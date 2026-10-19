/**
 * Milestone 3 visual capture: Welcome, Create game, Invite, Home at 360/390/430 px.
 * Run: npx playwright test --config=playwright.capture.config.ts v3
 * Output: screenshots/v3/<width>/<screen>.png (+ metrics.json with overflow / nav overlap / timing).
 */
import { expect, test, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

const SIZES = [
  { w: 360, h: 800 },
  { w: 390, h: 844 },
  { w: 430, h: 932 },
]

async function metrics(page: Page) {
  return page.evaluate(() => {
    const vw = window.innerWidth
    const nav = document.querySelector('nav[aria-label="Основная навигация"]')?.getBoundingClientRect()
    const overflow: string[] = []
    let underNav = 0
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('main *'))) {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) continue
      if (getComputedStyle(el).pointerEvents === 'none' || el.closest('[aria-hidden="true"]')) continue
      if (r.right > vw + 1 || r.left < -1) overflow.push(`${el.tagName.toLowerCase()} ${String(el.className).slice(0, 50)}`)
      if (nav && el.matches('a,button,input,select,textarea') && r.bottom > nav.top + 1) underNav++
    }
    const doc = document.documentElement
    return { scrollHeight: doc.scrollHeight, viewport: window.innerHeight, fitsWithoutScroll: doc.scrollHeight <= window.innerHeight + 1, overflow: overflow.slice(0, 6), interactiveBelowNavTop: underNav }
  })
}

for (const s of SIZES) {
  test.describe(`${s.w}x${s.h}`, () => {
    test.use({ viewport: { width: s.w, height: s.h } })

    test(`v3 screens at ${s.w}`, async ({ page }) => {
      const out = `screenshots/v3/${s.w}`
      mkdirSync(out, { recursive: true })
      const m: Record<string, unknown> = {}
      const shot = async (name: string) => {
        await page.waitForTimeout(700)
        await page.screenshot({ path: `${out}/${name}.png` })
        m[name] = await metrics(page)
      }

      await page.goto('/')
      await page.evaluate(() => localStorage.clear())
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Тайного Санты')
      await shot('01-welcome')

      await page.getByRole('button', { name: 'Начать' }).click()
      await page.waitForURL(/\/home$/)
      await shot('04-home')

      // Transition timing Home → Create (tap to settled screen)
      const t0 = Date.now()
      await page.getByRole('link', { name: 'Создать игру' }).first().click()
      await page.waitForFunction(() => location.pathname === '/rooms/new' && getComputedStyle(document.querySelector('main')!).opacity === '1')
      m.transitionMs = Date.now() - t0

      await page.getByLabel('Название игры').fill('Новогодний обмен')
      await page.getByLabel('Описание').fill('Праздник для друзей и коллег')
      await page.getByLabel('Бюджет подарка').selectOption('3000')
      await page.getByLabel('Лимит участников').selectOption('12')
      await page.locator('input:focus').blur().catch(() => {})
      await shot('02-create-game')
      await page.getByRole('button', { name: 'Продолжить' }).click()
      await page.getByRole('button', { name: 'Создать игру' }).click()
      await page.waitForURL(/\/invite/)
      for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Добавить тестового участника' }).click()
      await page.waitForTimeout(2600) // toasts fade
      await shot('03-invite-friends')

      writeFileSync(`${out}/metrics.json`, JSON.stringify(m, null, 2))
    })
  })
}
