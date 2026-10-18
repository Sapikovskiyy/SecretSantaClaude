import { describe, expect, it } from 'vitest'
import { suggestIdeas } from './giftIdeas'

describe('suggestIdeas (demo engine)', () => {
  it('never suggests ideas starting above the budget', () => {
    for (const budget of [500, 1000, 2000, 5000]) {
      for (const idea of suggestIdeas({ budget, interests: ['books'] }, 5)) {
        expect(idea.priceMin).toBeLessThanOrEqual(budget)
      }
    }
  })

  it('prefers matching interests', () => {
    const res = suggestIdeas({ budget: 5000, interests: ['coffee'] })
    expect(res[0].interests).toContain('coffee')
  })

  it('"cheaper" lowers the effective budget', () => {
    const res = suggestIdeas({ budget: 2000, interests: ['tech'], followUp: 'cheaper' }, 5)
    for (const i of res) expect(i.priceMin).toBeLessThanOrEqual(1200)
  })

  it('excludes already shown ideas', () => {
    const first = suggestIdeas({ budget: 3000, interests: ['home'] })
    const again = suggestIdeas({ budget: 3000, interests: ['home'], exclude: first.map((i) => i.id) })
    for (const i of again) expect(first.map((f) => f.id)).not.toContain(i.id)
  })
})
