// Side-by-side: approved reference (design/references) vs real 390×844 screenshot.
// Usage: node scripts/compare-v3.mjs [width=390]
import { chromium } from '@playwright/test'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'

const W = process.argv[2] ?? '390'
const root = new URL('..', import.meta.url)
const f = (p) => new URL(p, root)
const data = (p, type) => `data:${type};base64,${readFileSync(f(p)).toString('base64')}`
const PAIRS = ['01-welcome', '02-create-game', '03-invite-friends', '04-home']
const REF = { '01-welcome': '01-welcome', '02-create-game': '02-create-game', '03-invite-friends': '03-invite-friends', '04-home': '04-home' }

mkdirSync(f(`screenshots/v3/compare/`), { recursive: true })
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'msedge' })
const page = await browser.newPage({ viewport: { width: 900, height: 900 } })
for (const name of PAIRS) {
  const shot = `screenshots/v3/${W}/${name}.png`
  if (!existsSync(f(shot))) continue
  const H = 820
  await page.setContent(`<html><body style="margin:0;background:#efe6dc;font:600 15px system-ui;color:#281D19">
    <div style="display:flex;gap:24px;padding:20px 24px">
      <figure style="margin:0"><figcaption style="margin-bottom:8px">Референс</figcaption>
        <img src="${data(`design/references/${REF[name]}.jpeg`, 'image/jpeg')}" style="height:${H}px;border-radius:22px;display:block"></figure>
      <figure style="margin:0"><figcaption style="margin-bottom:8px">Реализация (${W} px)</figcaption>
        <img src="${data(shot, 'image/png')}" style="height:${H}px;border-radius:22px;display:block"></figure>
    </div></body></html>`)
  await page.waitForTimeout(120)
  await page.screenshot({ path: f(`screenshots/v3/compare/${name}-${W}.png`).pathname.replace(/^\/([A-Za-z]:)/, '$1'), fullPage: true })
  console.log('wrote', name)
}
await browser.close()
