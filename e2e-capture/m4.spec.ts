/**
 * Milestone 4 visual capture: the 9 screens from the 12-screen overview.
 * Run: npx playwright test --config=playwright.capture.config.ts m4
 * Output: screenshots/m4/<width>/<screen>.png + metrics.json
 */
import { expect, test, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

const SIZES = [
  { w: 360, h: 800 },
  { w: 390, h: 844 },
  { w: 430, h: 932 },
]

// name → route (seeded demo data: r-newyear gathering/organizer, r-family drawn & unrevealed)
const SCREENS: [string, string][] = [
  ['04-interests', '/wishlist/interests'],
  ['05-wishlist', '/wishlist'],
  ['06-gift-ai', '/ai'],
  ['07-game-room', '/rooms/r-newyear'],
  ['08-participants', '/rooms/r-newyear/participants'],
  ['09-secret-draw', '/rooms/r-newyear/draw'],
  ['10-recipient-reveal', '/rooms/r-family/reveal'],
  ['11-anonymous-chat', '/rooms/r-family/chat/toRecipient'],
  ['12-profile-premium', '/profile'],
]

async function metrics(page: Page) {
  return page.evaluate(() => {
    const vw = window.innerWidth
    const overflow: string[] = []
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('main *'))) {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) continue
      if (getComputedStyle(el).pointerEvents === 'none' || el.closest('[aria-hidden="true"]')) continue
      if (r.right > vw + 1 || r.left < -1) overflow.push(`${el.tagName.toLowerCase()} ${String(el.className).slice(0, 50)}`)
    }
    const doc = document.documentElement
    return { scrollHeight: doc.scrollHeight, viewport: window.innerHeight, overflow: overflow.slice(0, 6) }
  })
}

for (const s of SIZES) {
  test.describe(`${s.w}x${s.h}`, () => {
    test.use({ viewport: { width: s.w, height: s.h } })

    test(`m4 screens at ${s.w}`, async ({ page }) => {
      const out = `screenshots/m4/${s.w}`
      mkdirSync(out, { recursive: true })
      const m: Record<string, unknown> = {}
      await page.goto('/')
      await page.evaluate(() => localStorage.clear())
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Тайного Санты')
      await page.getByRole('button', { name: 'Начать' }).click()
      await page.waitForURL(/\/home$/)
      for (const [name, route] of SCREENS) {
        await page.goto(route)
        await page.waitForTimeout(900)
        await page.screenshot({ path: `${out}/${name}.png` })
        m[name] = await metrics(page)
      }
      writeFileSync(`${out}/metrics.json`, JSON.stringify(m, null, 2))
    })
  })
}
