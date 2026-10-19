/**
 * Captures Home / Wishlist / Gift AI at 390×844 for design review, plus objective
 * layout metrics: dock overlap, horizontal overflow, clipped text, page height,
 * and transition timing (time from tap to the next screen being fully visible).
 * LABEL env var names the output folder (e.g. before / after).
 */
import { test, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

const LABEL = process.env.LABEL ?? 'before'
const OUT = `screenshots/capture/${LABEL}`
mkdirSync(OUT, { recursive: true })
const metrics: Record<string, unknown> = {}

async function measure(page: Page, name: string) {
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/${name}-viewport.png` })
  await page.screenshot({ path: `${OUT}/${name}-full.png`, fullPage: true })
  metrics[name] = await page.evaluate(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const dock = document.querySelector('nav[aria-label="Основная навигация"]')?.getBoundingClientRect()
    const overflow: string[] = []
    const clipped: string[] = []
    let covered = 0
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('main *'))) {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) continue
      const style = getComputedStyle(el)
      if (style.position === 'fixed') continue
      if (r.right > vw + 1 || r.left < -1) {
        const insideScroller = el.closest('.no-scrollbar, .overflow-x-auto')
        if (!insideScroller) overflow.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} → ${Math.round(r.right - vw)}px`)
      }
      if (el.children.length === 0 && el.textContent?.trim() && el.scrollWidth > el.clientWidth + 1 && style.overflow === 'hidden') {
        clipped.push(el.textContent.trim().slice(0, 40))
      }
      // interactive elements hidden under the dock when scrolled to the bottom
      if (dock && el.matches('a,button,input,textarea,select') && r.bottom > dock.top && r.top < dock.bottom && r.left < dock.right && r.right > dock.left) covered++
    }
    return {
      pageHeight: document.documentElement.scrollHeight,
      screens: +(document.documentElement.scrollHeight / vh).toFixed(2),
      dockTop: dock ? Math.round(dock.top) : null,
      interactiveUnderDockAtTop: covered,
      overflow: overflow.slice(0, 8),
      clippedText: clipped.slice(0, 8),
      vh,
    }
  })
}

test('capture Home, Wishlist, Gift AI', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/')
  await page.getByRole('button', { name: 'Начать' }).click()
  await page.waitForURL(/\/home$/)
  await measure(page, '02-home')

  // Transition timing: tap → next screen settled (content visible and opacity 1)
  const t0 = Date.now()
  await page.getByRole('link', { name: 'Идеи подарков' }).first().click()
  await page.waitForURL(/\/ai$/)
  await page.waitForFunction(() => {
    const m = document.querySelector('main')
    return m && getComputedStyle(m).opacity === '1'
  })
  metrics.transitionHomeToAiMs = Date.now() - t0

  await measure(page, '12-ai-empty')
  await page.getByLabel('Что ищем').fill('что-то уютное, любит кофе')
  await page.getByRole('button', { name: 'Подобрать идеи' }).last().click()
  await page.getByRole('heading', { name: 'Рекомендации' }).waitFor()
  await page.evaluate(() => window.scrollTo(0, 0))
  await measure(page, '12-ai-results')

  // Wishlist with interests and two items
  await page.goto('/wishlist/interests')
  for (const n of ['Уют', 'Книги', 'Кофе и чай']) await page.getByRole('checkbox', { name: n }).click()
  await page.getByRole('button', { name: 'Продолжить' }).click()
  for (const t of ['Шерстяной плед', 'Ручная кофемолка']) {
    if (await page.getByRole('option').count()) await page.getByRole('button', { name: 'Добавить желание' }).click()
    await page.getByPlaceholder('Например, фотоаппарат моментальной печати').fill(t)
    await page.getByRole('button', { name: 'Добавить в вишлист' }).click()
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(2600)
  await measure(page, '08-wishlist')

  writeFileSync(`${OUT}/metrics.json`, JSON.stringify(metrics, null, 2))
})
