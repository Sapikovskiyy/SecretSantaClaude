import { describe, it, expect } from 'vitest';
import { drawSecretSanta, hasReciprocal } from '../src/features/secret-draw/matching.ts';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `u${i}`);

function assertValid(members: string[], a: Record<string, string>, ex: { giver: string; receiver: string }[] = []) {
  expect(Object.keys(a).sort()).toEqual([...members].sort());
  expect(Object.values(a).sort()).toEqual([...members].sort());
  for (const [g, r] of Object.entries(a)) {
    expect(g).not.toBe(r);
    expect(ex.some((e) => e.giver === g && e.receiver === r)).toBe(false);
  }
}

describe('drawSecretSanta', () => {
  it('works for 2..30 members, repeatedly', () => {
    for (let n = 2; n <= 30; n++) for (let k = 0; k < 20; k++) {
      const m = ids(n);
      const r = drawSecretSanta(m);
      expect(r.ok).toBe(true);
      if (r.ok) assertValid(m, r.assignments);
    }
  });
  it('rejects fewer than 2 members and duplicates', () => {
    expect(drawSecretSanta(['a'])).toMatchObject({ ok: false, reason: 'too_few_members' });
    expect(drawSecretSanta(['a', 'a', 'b'])).toMatchObject({ ok: false, reason: 'duplicate_members' });
  });
  it('respects heavy exclusions (couples forbidden both ways)', () => {
    const m = ids(8);
    const ex = [[0,1],[2,3],[4,5],[6,7]].flatMap(([a,b]) => [
      { giver: m[a], receiver: m[b] }, { giver: m[b], receiver: m[a] }]);
    for (let k = 0; k < 100; k++) {
      const r = drawSecretSanta(m, ex);
      expect(r.ok).toBe(true);
      if (r.ok) assertValid(m, r.assignments, ex);
    }
  });
  it('finds the only solution when constraints force a single cycle', () => {
    const ex = [
      { giver: 'a', receiver: 'c' }, { giver: 'b', receiver: 'a' }, { giver: 'c', receiver: 'b' },
    ];
    expect(drawSecretSanta(['a', 'b', 'c'], ex)).toEqual({ ok: true, assignments: { a: 'b', b: 'c', c: 'a' } });
  });
  it('detects impossible configurations', () => {
    const m = ['a', 'b', 'c'];
    expect(drawSecretSanta(m, [{ giver: 'a', receiver: 'b' }, { giver: 'a', receiver: 'c' }]))
      .toMatchObject({ ok: false, reason: 'impossible' });
    expect(drawSecretSanta(m, [{ giver: 'a', receiver: 'c' }, { giver: 'b', receiver: 'c' }]))
      .toMatchObject({ ok: false, reason: 'impossible' });
  });
  it('avoids reciprocal pairs when possible (n>2)', () => {
    for (let k = 0; k < 50; k++) {
      const r = drawSecretSanta(ids(6));
      expect(r.ok && hasReciprocal(r.assignments)).toBe(false);
    }
  });
  it('allows reciprocal pair when n=2', () => {
    expect(drawSecretSanta(['a', 'b'])).toEqual({ ok: true, assignments: { a: 'b', b: 'a' } });
  });
});
