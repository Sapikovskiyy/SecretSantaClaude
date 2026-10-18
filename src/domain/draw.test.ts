import { describe, expect, it } from 'vitest'
import { drawAssignments, isValidAssignment } from './draw'

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`)

describe('drawAssignments', () => {
  it('rejects fewer than 3 participants', () => {
    expect(drawAssignments(['a', 'b'])).toEqual({ ok: false, reason: 'too_few' })
  })

  it('rejects duplicate participants', () => {
    expect(drawAssignments(['a', 'a', 'b'])).toMatchObject({ ok: false, reason: 'duplicate' })
  })

  it('produces a valid bijection without self-assignment', () => {
    for (let n = 3; n <= 40; n++) {
      const p = ids(n)
      const res = drawAssignments(p, [], seeded(n))
      expect(res.ok).toBe(true)
      if (res.ok) expect(isValidAssignment(p, res.pairs)).toBe(true)
    }
  })

  it('respects one-way and mutual exclusions', () => {
    const p = ids(6)
    const ex = [
      { a: 'p0', b: 'p1', mutual: true },
      { a: 'p2', b: 'p3', mutual: false },
      { a: 'p4', b: 'p5', mutual: true },
    ]
    for (let s = 1; s < 200; s++) {
      const res = drawAssignments(p, ex, seeded(s))
      expect(res.ok).toBe(true)
      if (!res.ok) continue
      expect(isValidAssignment(p, res.pairs, ex)).toBe(true)
      expect(res.pairs.get('p0')).not.toBe('p1')
      expect(res.pairs.get('p1')).not.toBe('p0')
      expect(res.pairs.get('p2')).not.toBe('p3')
    }
  })

  it('detects a giver with no options', () => {
    const p = ['a', 'b', 'c']
    const ex = [
      { a: 'a', b: 'b', mutual: false },
      { a: 'a', b: 'c', mutual: false },
    ]
    expect(drawAssignments(p, ex)).toMatchObject({ ok: false, reason: 'impossible' })
  })

  it('detects impossible configurations not caught by degree checks', () => {
    // 4 people, two couples mutually excluded + a↔c excluded:
    // a can only give to d, b can only give to c... forces a 2-cycle conflict.
    const p = ['a', 'b', 'c', 'd']
    const ex = [
      { a: 'a', b: 'b', mutual: true },
      { a: 'a', b: 'c', mutual: true },
      { a: 'b', b: 'd', mutual: true },
      { a: 'c', b: 'd', mutual: false },
    ]
    // a→d only, d→? (d can give to a, c — b excluded), c→b only (a,d excluded), b→c only.
    // b→c and c→b, a→d, d→a: valid! Make it impossible by forbidding d→a as well.
    ex.push({ a: 'd', b: 'a', mutual: false })
    expect(drawAssignments(p, ex)).toMatchObject({ ok: false, reason: 'impossible' })
  })

  it('is roughly uniform across recipients (no fixed bias)', () => {
    const p = ids(5)
    const counts = new Map<string, number>()
    const rng = seeded(42)
    for (let i = 0; i < 2000; i++) {
      const res = drawAssignments(p, [], rng)
      if (res.ok) {
        const r = res.pairs.get('p0')!
        counts.set(r, (counts.get(r) ?? 0) + 1)
      }
    }
    for (const id of ['p1', 'p2', 'p3', 'p4']) {
      expect(counts.get(id) ?? 0).toBeGreaterThan(350)
    }
  })

  it('handles a large group quickly', () => {
    const p = ids(300)
    const ex = p.slice(0, 150).map((id, i) => ({ a: id, b: p[i + 150], mutual: true }))
    const t = Date.now()
    const res = drawAssignments(p, ex, seeded(7))
    expect(res.ok).toBe(true)
    if (res.ok) expect(isValidAssignment(p, res.pairs, ex)).toBe(true)
    expect(Date.now() - t).toBeLessThan(2000)
  })
})
