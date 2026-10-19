/**
 * Real anonymous-chat captures for the chat feature trailer (390×844 @3x) + last-bubble boxes (chat-layout.json).
 * Demo mode, safe sample data. Capture-time only: demo badges/toasts hidden, sample recipient shown as «Мария».
 * Both sides of one assignment:
 *   santa-*  — I am the Santa writing to my recipient (/chat/toRecipient)
 *   rec-*    — I am a recipient writing to my own Santa (/chat/fromSanta), who stays «Твой Тайный Санта»
 * Run from the repo root:  npx playwright test --config=marketing/santomi-trailer/playwright.capture.config.ts capture-chat
 */
import { test, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../public/assets/chat')
mkdirSync(out, { recursive: true })
type Box = { x: number; y: number; w: number; h: number }
const boxes: Record<string, Box | null> = {}
const ui: Record<string, Box> = {}
async function el(page: Page, key: string, l: ReturnType<Page['locator']>) {
  const b = await l.first().boundingBox()
  if (b) ui[key] = { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }
}

async function prep(page: Page) {
  await page.addStyleTag({ content: `.pointer-events-none.fixed.inset-x-0 { display: none !important; }` })
  await page.evaluate(() => {
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('span, p, div'))) {
      const t = el.textContent?.trim()
      if (el.children.length <= 1 && (t === 'демо' || t === 'Демо-режим')) el.style.visibility = 'hidden'
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.nodeValue?.includes('Вика')) n.nodeValue = n.nodeValue.replace(/Вика/g, 'Мария')
    ;(document.activeElement as HTMLElement | null)?.blur()
  })
}
async function snap(page: Page, name: string) {
  await prep(page)
  await page.screenshot({ path: `${out}/${name}.png` })
  const last = page.locator('[role="log"] > *').last()
  const b = (await last.count()) ? await last.boundingBox() : null
  boxes[name] = b ? { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } : null
}

async function conversation(page: Page, path: string, prefix: string, suggestion: string) {
  await page.goto(path)
  await page.waitForTimeout(900)
  await snap(page, `${prefix}-0`)
  await el(page, `${prefix}.suggestion`, page.getByRole('button', { name: suggestion }))
  await el(page, `${prefix}.note`, page.getByText('Вы общаетесь анонимно').locator('xpath=../..'))
  const env = page.locator('img[src*="envelope"]')
  if (await env.count()) {
    const art = env.first().locator('xpath=..')
    await el(page, `${prefix}.envelope`, art)
    const hide = await page.addStyleTag({ content: 'img[src*="envelope"] { visibility: hidden !important; }' })
    await page.waitForTimeout(120)
    await snap(page, `${prefix}-0-empty`)
    await hide.evaluate((n) => n.remove())
  }
  await page.getByRole('button', { name: suggestion }).click()
  await page.waitForTimeout(60)
  await snap(page, `${prefix}-1`) // sending (clock)
  await page.waitForTimeout(420)
  await snap(page, `${prefix}-2`) // delivered (✓✓)
  await page.waitForSelector('[aria-label="Собеседник печатает"]')
  for (const k of ['a', 'b', 'c']) {
    await snap(page, `${prefix}-typing-${k}`)
    await page.waitForTimeout(140)
  }
  await page.waitForSelector('[aria-label="Собеседник печатает"]', { state: 'detached' })
  await page.waitForTimeout(400)
  await snap(page, `${prefix}-3`) // reply arrived
}

test('chat captures', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/')
  await page.getByRole('button', { name: 'Начать' }).click()
  await page.waitForURL(/\/home$/)
  // the recipient must be revealed before the chat opens
  await page.goto('/rooms/r-family/reveal')
  await page.getByRole('button', { name: 'Пропустить' }).click()
  await page.waitForTimeout(400)

  await conversation(page, '/rooms/r-family/chat/toRecipient', 'santa', 'Как ты любишь проводить зиму?')
  await conversation(page, '/rooms/r-family/chat/fromSanta', 'rec', 'Мне нравится всё уютное')

  writeFileSync(`${out}/chat-layout.json`, JSON.stringify({ lastBubble: boxes, ui }, null, 2))
})
