/**
 * Constrained Secret Santa matching.
 *
 * Problem: find a perfect matching in a bipartite graph (givers -> receivers)
 * where edge (g, r) exists iff g !== r and (g, r) is not forbidden.
 * We use Kuhn's augmenting-path algorithm, so a valid assignment is found
 * whenever one exists, and impossibility is detected exactly (no retry loops).
 * Randomness only shuffles processing order and adjacency, using CSPRNG.
 * Note: the result is valid and unpredictable but not exactly uniform.
 */
export type MemberId = string;
export interface Exclusion { giver: MemberId; receiver: MemberId; }
export interface DrawOptions {
  /** Try to avoid A<->B pairs when more than 2 participants. Best effort only. */
  avoidReciprocal?: boolean;
  random?: () => number;
}
export type DrawResult =
  | { ok: true; assignments: Record<MemberId, MemberId> }
  | { ok: false; reason: 'too_few_members' | 'duplicate_members' | 'impossible'; stuck?: MemberId[] };

const MAX_RECIPROCAL_ATTEMPTS = 50;

export function secureRandom(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
}

function shuffle<T>(items: readonly T[], rnd: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function attempt(members: MemberId[], forbidden: Set<string>, rnd: () => number): DrawResult {
  const key = (g: MemberId, r: MemberId) => `${g}\u0000${r}`;
  const adj = new Map<MemberId, MemberId[]>();
  for (const g of members) {
    adj.set(g, shuffle(members.filter((r) => r !== g && !forbidden.has(key(g, r))), rnd));
  }
  const receiverOwner = new Map<MemberId, MemberId>();

  const tryAssign = (g: MemberId, seen: Set<MemberId>): boolean => {
    for (const r of adj.get(g)!) {
      if (seen.has(r)) continue;
      seen.add(r);
      const current = receiverOwner.get(r);
      if (current === undefined || tryAssign(current, seen)) {
        receiverOwner.set(r, g);
        return true;
      }
    }
    return false;
  };

  const stuck: MemberId[] = [];
  for (const g of shuffle(members, rnd)) {
    if (!tryAssign(g, new Set())) stuck.push(g);
  }
  if (stuck.length > 0) return { ok: false, reason: 'impossible', stuck };

  const assignments: Record<MemberId, MemberId> = {};
  for (const [r, g] of receiverOwner) assignments[g] = r;
  return { ok: true, assignments };
}

export function hasReciprocal(a: Record<MemberId, MemberId>): boolean {
  return Object.entries(a).some(([g, r]) => a[r] === g);
}

export function drawSecretSanta(
  members: readonly MemberId[],
  exclusions: readonly Exclusion[] = [],
  options: DrawOptions = {},
): DrawResult {
  if (new Set(members).size !== members.length) return { ok: false, reason: 'duplicate_members' };
  if (members.length < 2) return { ok: false, reason: 'too_few_members' };
  const rnd = options.random ?? secureRandom;
  const forbidden = new Set(exclusions.map((e) => `${e.giver}\u0000${e.receiver}`));
  const list = [...members];

  const wantNoReciprocal = options.avoidReciprocal !== false && list.length > 2;
  let best: DrawResult = attempt(list, forbidden, rnd);
  if (!best.ok || !wantNoReciprocal) return best;
  for (let i = 0; i < MAX_RECIPROCAL_ATTEMPTS && hasReciprocal(best.assignments); i++) {
    const next = attempt(list, forbidden, rnd);
    if (next.ok) best = next;
  }
  return best;
}
