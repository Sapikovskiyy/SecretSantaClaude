/**
 * Secret Santa constrained assignment.
 *
 * Pure, dependency-free module so the exact same code can run inside a
 * Supabase Edge Function (Deno) in Phase 2. In production the draw MUST run
 * server-side; the demo calls it in the browser only to simulate.
 *
 * Problem: find a random bijection giver → recipient such that
 *   - nobody gives to themselves
 *   - no forbidden pair (exclusion) is used
 * This is a perfect matching in a bipartite graph. We use randomized
 * backtracking with "fewest options first" ordering (fast for realistic
 * group sizes ≤ a few hundred), preceded by a Hall-condition style sanity
 * check for clear impossibility reporting.
 */

export interface DrawExclusion {
  a: string
  b: string
  mutual: boolean
}

export type DrawResult =
  | { ok: true; pairs: Map<string, string> }
  | { ok: false; reason: 'too_few' | 'duplicate' | 'impossible'; detail?: string }

export type Rng = () => number

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function buildAllowed(ids: string[], exclusions: DrawExclusion[]): Map<string, Set<string>> {
  const allowed = new Map<string, Set<string>>()
  for (const g of ids) allowed.set(g, new Set(ids.filter((r) => r !== g)))
  for (const ex of exclusions) {
    allowed.get(ex.a)?.delete(ex.b)
    if (ex.mutual) allowed.get(ex.b)?.delete(ex.a)
  }
  return allowed
}

export function drawAssignments(
  participantIds: string[],
  exclusions: DrawExclusion[] = [],
  rng: Rng = Math.random,
  maxSteps = 200_000,
): DrawResult {
  if (participantIds.length < 3) return { ok: false, reason: 'too_few' }
  if (new Set(participantIds).size !== participantIds.length) return { ok: false, reason: 'duplicate' }

  const allowed = buildAllowed(participantIds, exclusions)

  // Quick impossibility checks: someone with no options as giver or as recipient.
  for (const [g, set] of allowed) {
    if (set.size === 0) return { ok: false, reason: 'impossible', detail: `giver:${g}` }
  }
  const canReceive = new Map<string, number>(participantIds.map((id) => [id, 0]))
  for (const set of allowed.values()) for (const r of set) canReceive.set(r, (canReceive.get(r) ?? 0) + 1)
  for (const [r, n] of canReceive) {
    if (n === 0) return { ok: false, reason: 'impossible', detail: `recipient:${r}` }
  }

  const givers = shuffle(participantIds, rng)
  const taken = new Set<string>()
  const pairs = new Map<string, string>()
  let steps = 0

  const solve = (): boolean => {
    if (pairs.size === givers.length) return true
    if (++steps > maxSteps) return false
    // Most constrained unassigned giver first.
    let best: string | null = null
    let bestOpts: string[] = []
    for (const g of givers) {
      if (pairs.has(g)) continue
      const opts = [...allowed.get(g)!].filter((r) => !taken.has(r))
      if (opts.length === 0) return false
      if (best === null || opts.length < bestOpts.length) {
        best = g
        bestOpts = opts
        if (opts.length === 1) break
      }
    }
    for (const r of shuffle(bestOpts, rng)) {
      pairs.set(best!, r)
      taken.add(r)
      if (solve()) return true
      pairs.delete(best!)
      taken.delete(r)
    }
    return false
  }

  return solve() ? { ok: true, pairs } : { ok: false, reason: 'impossible' }
}

/** Validates a finished assignment — used by tests and as a server-side safety net. */
export function isValidAssignment(
  ids: string[],
  pairs: Map<string, string>,
  exclusions: DrawExclusion[] = [],
): boolean {
  if (pairs.size !== ids.length) return false
  const allowed = buildAllowed(ids, exclusions)
  const recipients = new Set<string>()
  for (const g of ids) {
    const r = pairs.get(g)
    if (!r || r === g || !allowed.get(g)!.has(r) || recipients.has(r)) return false
    recipients.add(r)
  }
  return true
}
