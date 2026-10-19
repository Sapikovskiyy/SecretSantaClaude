/**
 * Real-UI captures for the trailer (390×844 @3x = 1170×2532) + element boxes (ui-layout.json, CSS px).
 * Only safe demo data. Capture-time styling only (the app is not modified):
 *  - dev-only «демо» badges and demo toasts are hidden (absent in production);
 *  - create-0 hides input placeholders (the typing sequence starts from empty fields);
 *  - the demo recipient is shown as «Мария» (sample data, CEO request): text and avatar initial swapped in the DOM;
 *  - invite-empty hides the gift illustration so the trailer can fly the gift into its slot;
 *  - the invite link text is blurred: the demo build shows a localhost URL and we must not invent a bot name.
 * Run from the repo root:  npx playwright test --config=marketing/santomi-trailer/playwright.capture.config.ts
 */
import { test, type Locator, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../public/assets/ui')
mkdirSync(out, { recursive: true })
const layout: Record<string, Record<string, { x: number; y: number; w: number; h: number }>> = {}

async function prep(page: Page) {
  await page.addStyleTag({ content: `.pointer-events-none.fixed.inset-x-0 { display: none !important; }` })
  await page.evaluate(() => {
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('span, p, div'))) {
      const t = el.textContent?.trim()
      if (el.children.length <= 1 && (t === 'демо' || t === 'Демо-режим')) el.style.visibility = 'hidden'
      if (el.children.length === 0 && t && /localhost:\d+\/join\//.test(t)) el.style.filter = 'blur(6px)'
    }
  })
}
/** Sample-data rename for the trailer: demo recipient «Вика» → «Мария». */
async function renameRecipient(page: Page) {
  await page.evaluate(() => {
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('[aria-label="Вика"]'))) {
      el.setAttribute('aria-label', 'Мария')
      if (el.children.length === 0 && el.textContent?.trim() === 'В') el.textContent = 'М'
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.nodeValue?.includes('Вика')) n.nodeValue = n.nodeValue.replace(/Вика/g, 'Мария')
  })
}
async function shot(page: Page, name: string, wait = 600) {
  await page.waitForTimeout(wait)
  await prep(page)
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.waitForTimeout(150)
  await page.screenshot({ path: `${out}/${name}.png` })
}
async function box(screen: string, key: string, l: Locator) {
  const b = await l.first().boundingBox()
  if (!b) return
  ;(layout[screen] ??= {})[key] = { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }
}

test('trailer captures', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/')
  await page.getByRole('button', { name: 'Начать' }).click()
  await page.waitForURL(/\/home$/)
  await shot(page, 'home')
  await box('home', 'plus', page.getByRole('link', { name: 'Создать игру' }))

  // Create game — states for the typing / tap sequence
  await page.getByRole('link', { name: 'Создать игру' }).first().click()
  await page.waitForURL(/\/rooms\/new/)
  // typing sequence starts from truly empty fields (a placeholder disappears as soon as typing starts)
  await page.addStyleTag({ content: 'input::placeholder, textarea::placeholder { color: transparent !important; }' })
  await shot(page, 'create-0')
  await box('create', 'name', page.getByLabel('Название игры'))
  await box('create', 'description', page.getByLabel('Описание'))
  await box('create', 'budget', page.getByLabel('Бюджет подарка'))
  await box('create', 'date', page.getByLabel('Дата обмена'))
  await box('create', 'limit', page.getByLabel('Лимит участников'))
  await box('create', 'continue', page.getByRole('button', { name: 'Продолжить' }))
  await page.getByLabel('Название игры').fill('Новогодний обмен')
  await shot(page, 'create-1')
  await page.getByLabel('Описание').fill('Праздник для друзей и коллег')
  await shot(page, 'create-2')
  await page.getByLabel('Лимит участников').selectOption('12')

  // Invite — avatars appear one by one
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await page.getByRole('button', { name: 'Создать игру' }).click()
  await page.waitForURL(/\/invite/)
  await shot(page, 'invite-0')
  const giftArt = page.locator('img[src*="gift-green"]').first().locator('xpath=..')
  await box('invite', 'gift', giftArt)
  await giftArt.evaluate((el) => ((el as HTMLElement).style.visibility = 'hidden'))
  await shot(page, 'invite-empty', 200)
  await giftArt.evaluate((el) => ((el as HTMLElement).style.visibility = ''))
  await box('invite', 'telegram', page.getByRole('button', { name: /Отправить в Telegram/ }))
  await box('invite', 'avatars', page.getByText(/из 12 участников/))
  await box('invite', 'title', page.getByRole('heading', { level: 1 }))
  for (let i = 1; i <= 3; i++) {
    await page.getByRole('button', { name: 'Добавить тестового участника' }).click()
    await shot(page, `invite-${i}`, 400)
  }

  // Interests with a few picks
  await page.goto('/wishlist/interests')
  await page.waitForTimeout(700)
  for (const n of ['Книги', 'Игры', 'Музыка']) await page.getByRole('checkbox', { name: n }).first().click().catch(() => {})
  await page.evaluate(() => document.querySelectorAll<HTMLElement>('[class*=overflow-x-auto]').forEach((e) => e.scrollTo({ left: 0 })))
  await shot(page, 'interests', 700)

  // Wishlist with safe sample items (no brands)
  await page.goto('/wishlist')
  for (const [t, price] of [
    ['Беспроводные наушники', '6500'],
    ['Настольная игра для компании', '2490'],
    ['Кофе свежей обжарки', '1500'],
  ]) {
    await page.getByRole('button', { name: 'Добавить желание' }).first().click()
    const d = page.getByRole('dialog')
    await d.getByPlaceholder(/фотоаппарат/).fill(t)
    await d.getByPlaceholder('Примерно').fill(price)
    await d.getByRole('button', { name: 'Добавить в вишлист' }).click()
    await page.waitForTimeout(350)
  }
  await shot(page, 'wishlist', 2800)

  // Reveal → recipient card
  await page.goto('/rooms/r-family/reveal')
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: 'Открыть подарок' }).click()
  await page.waitForTimeout(2200)
  await renameRecipient(page)
  await shot(page, 'reveal-open', 200)
  await box('reveal', 'title', page.getByRole('heading', { level: 1 }))
  await box('reveal', 'cta', page.getByRole('link', { name: 'Посмотреть вишлист' }))
  await box('reveal', 'name', page.getByText('Мария', { exact: true }))

  // Gift AI for the revealed recipient
  await page.goto('/ai?room=r-family')
  await page.waitForTimeout(900)
  await renameRecipient(page)
  await shot(page, 'gift-ai', 200)

  writeFileSync(`${out}/ui-layout.json`, JSON.stringify(layout, null, 2))
})
