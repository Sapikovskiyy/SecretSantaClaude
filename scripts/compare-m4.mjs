// Side-by-side: overview crop (design/reference_screens_cropped, low-res) vs real screenshot.
// Usage: node scripts/compare-m4.mjs [width=390] [name…]
import { chromium } from '@playwright/test'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'

const [W = '390', ...only] = process.argv.slice(2)
const root = new URL('..', import.meta.url)
const f = (p) => new URL(p, root)
const data = (p, type) => `data:${type};base64,${readFileSync(f(p)).toString('base64')}`
const NAMES = ['04-interests', '05-wishlist', '06-gift-ai', '07-game-room', '08-participants', '09-secret-draw', '10-recipient-reveal', '11-anonymous-chat', '12-profile-premium']

mkdirSync(f('screenshots/m4/compare/'), { recursive: true })
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'msedge' })
const page = await browser.newPage({ viewport: { width: 900, height: 900 } })
for (const name of only.length ? only : NAMES) {
  const shot = `screenshots/m4/${W}/${name}.png`
  if (!existsSync(f(shot))) continue
  const H = 820
  await page.setContent(`<html><body style="margin:0;background:#efe6dc;font:600 15px system-ui;color:#281D19">
    <div style="display:flex;gap:24px;padding:20px 24px">
      <figure style="margin:0"><figcaption style="margin-bottom:8px">Макет (кроп обзора)</figcaption>
        <img src="${data(`design/reference_screens_cropped/${name}.png`, 'image/png')}" style="height:${H}px;width:${Math.round((H * 390) / 844)}px;object-fit:cover;object-position:top;border-radius:22px;display:block"></figure>
      <figure style="margin:0"><figcaption style="margin-bottom:8px">Реализация (${W} px)</figcaption>
        <img src="${data(shot, 'image/png')}" style="height:${H}px;border-radius:22px;display:block"></figure>
    </div></body></html>`)
  await page.waitForTimeout(120)
  await page.screenshot({ path: f(`screenshots/m4/compare/${name}-${W}.png`).pathname.replace(/^\/([A-Za-z]:)/, '$1'), fullPage: true })
  console.log('wrote', name)
}
await browser.close()
