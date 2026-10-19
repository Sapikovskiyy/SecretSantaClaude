/**
 * Milestone 3b visual capture: Interests, Wishlist, Gift AI, Reveal (sealed + open) at 390×844.
 * Run: npx playwright test --config=playwright.capture.config.ts v3b
 * Output: screenshots/v3b/<label>/<screen>.png — pass LABEL=before|after.
 */
import { test, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const label = process.env.LABEL ?? 'after'
const out = `screenshots/v3b/${label}`

async function shot(page: Page, name: string, wait = 900) {
  await page.waitForTimeout(wait)
  await page.screenshot({ path: `${out}/${name}.png` })
}

test('v3b screens', async ({ page }) => {
  mkdirSync(out, { recursive: true })
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/')
  await page.getByRole('button', { name: 'Начать' }).click()
  await page.waitForURL(/\/home$/)

  await page.goto('/wishlist/interests')
  await shot(page, '04-interests')
  await page.getByRole('checkbox', { name: 'Игры' }).click()
  await page.getByRole('checkbox', { name: 'Книги' }).click()
  await shot(page, '04-interests-selected', 500)
  await page.goto('/wishlist')
  await shot(page, '05-wishlist-empty')
  for (const [t, price, url] of [['Фотоаппарат моментальной печати', '8990', 'https://example.com/camera'], ['Наушники', '6500', ''], ['Настольная игра', '2490', 'https://example.com/game']]) {
    await page.getByRole('button', { name: 'Добавить желание' }).click()
    await page.getByPlaceholder('Например, фотоаппарат моментальной печати').fill(t)
    await page.getByPlaceholder('Примерно').fill(price)
    if (url) await page.getByPlaceholder('https://').fill(url)
    await page.getByRole('button', { name: 'Добавить в вишлист' }).click()
    await page.waitForTimeout(400)
  }
  await shot(page, '05-wishlist', 2600)
  await page.getByRole('button', { name: 'Добавить желание' }).click()
  await shot(page, '05-wishlist-editor')
  await page.keyboard.press('Escape')
  await page.goto('/ai')
  await shot(page, '06-gift-ai')
  await page.goto('/rooms/r-family/reveal')
  await shot(page, '10-reveal-sealed')
})

test('v3b reveal open', async ({ page }) => {
  mkdirSync(out, { recursive: true })
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/')
  await page.getByRole('button', { name: 'Начать' }).click()
  await page.waitForURL(/\/home$/)
  await page.goto('/rooms/r-family/reveal')
  await page.waitForTimeout(900)
  await page.getByRole('button', { name: 'Открыть подарок' }).click()
  await page.waitForTimeout(450)
  await page.screenshot({ path: `${out}/10-reveal-opening.png` })
  await shot(page, '10-reveal-open', 1800)
  await page.goto('/ai?room=r-family')
  await shot(page, '06-gift-ai-recipient')
  await page.getByLabel('Что ищем').fill('любит кофе и уют')
  await page.getByRole('button', { name: 'Подобрать идеи: Вика' }).click()
  await page.waitForTimeout(800)
  await page.getByRole('heading', { name: 'Рекомендации · Вика' }).scrollIntoViewIfNeeded()
  await shot(page, '06-gift-ai-results')
})
