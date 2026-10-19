/**
 * Accessibility audit (Milestone 7): axe-core WCAG 2.1 A/AA on every screen + tap-target sizes.
 *   npx playwright test --config=playwright.capture.config.ts a11y
 * Writes screenshots/qa/a11y.json and prints a compact summary.
 */
import { test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const ROUTES = ['/', '/home', '/rooms/new', '/rooms/r-newyear', '/rooms/r-newyear/invite', '/rooms/r-newyear/participants', '/rooms/r-newyear/draw', '/rooms/r-family/reveal', '/rooms/r-family/chat/toRecipient', '/wishlist', '/wishlist/interests', '/ai', '/profile', '/premium', '/chats', '/join/SANTA5']

test('axe + tap targets', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  const report: Record<string, unknown> = {}
  for (const r of ROUTES) {
    if (r === '/home') {
      await page.goto('/')
      await page.getByRole('button', { name: 'Начать' }).click()
      await page.waitForURL(/\/home$/)
    } else await page.goto(r)
    await page.waitForTimeout(1500)
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    const small = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('main a, main button, main input, main select, nav a'))
        .filter((el) => {
          const b = el.getBoundingClientRect()
          return b.width > 0 && b.height > 0 && (b.width < 32 || b.height < 32) && getComputedStyle(el).visibility !== 'hidden'
        })
        .map((el) => `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`),
    )
    const v = axe.violations.map((x) => ({ id: x.id, impact: x.impact, n: x.nodes.length, sample: x.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary ?? '').split('\n')[1]?.trim()) }))
    report[r] = { violations: v, smallTargets: small }
    console.log(`${r}: ${v.map((x) => `${x.id}(${x.impact},${x.n})`).join(' ') || 'axe ok'}${small.length ? ` | small: ${small.length}` : ''}`)
  }
  mkdirSync('screenshots/qa', { recursive: true })
  writeFileSync('screenshots/qa/a11y.json', JSON.stringify(report, null, 2))
})
