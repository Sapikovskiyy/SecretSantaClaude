// Builds side-by-side images: approved reference (cropped from the handoff sheets)
// next to the Playwright screenshot of the implementation.
// Usage: node scripts/compare.mjs   (after `npx playwright test`)
import { chromium } from '@playwright/test'
import { mkdirSync, readFileSync, existsSync } from 'node:fs'

const root = new URL('..', import.meta.url)
const file = (p) => new URL(p, root)
const dataUrl = (p) => `data:image/png;base64,${readFileSync(file(p)).toString('base64')}`

// Crop boxes (x, y, w, h) in sheet pixels.
const PAIRS = [
  { name: '01-welcome', ref: 'design-handoff/references/01_screens_01-04.png', box: [46, 140, 330, 800], shot: 'screenshots/iphone/01-welcome.png' },
  { name: '07-interests', ref: 'design-handoff/references/02_screens_05-08.png', box: [730, 128, 330, 770], shot: 'screenshots/iphone/07-interests-empty.png' },
  { name: '08-wishlist', ref: 'design-handoff/references/02_screens_05-08.png', box: [1074, 128, 332, 770], shot: 'screenshots/iphone/08-wishlist-top.png' },
  { name: '11-chat', ref: 'design-handoff/references/03_screens_09-12.png', box: [732, 135, 330, 790], shot: 'screenshots/iphone/11-chat.png' },
]

mkdirSync(file('screenshots/compare/'), { recursive: true })
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'msedge' })
const page = await browser.newPage({ viewport: { width: 760, height: 900 } })
for (const p of PAIRS) {
  if (!existsSync(file(p.shot))) {
    console.log('skip (no screenshot):', p.name)
    continue
  }
  const [x, y, w, h] = p.box
  const H = 820
  const scale = H / h
  await page.setContent(`<html><body style="margin:0;background:#efe6dc;font:600 15px system-ui;color:#281D19">
    <div style="display:flex;gap:24px;padding:20px 24px">
      <figure style="margin:0"><figcaption style="margin-bottom:8px">Референс</figcaption>
        <div style="width:${w * scale}px;height:${H}px;overflow:hidden;border-radius:22px;position:relative">
          <img src="${dataUrl(p.ref)}" style="position:absolute;left:${-x * scale}px;top:${-y * scale}px;transform-origin:0 0;transform:scale(${scale})">
        </div></figure>
      <figure style="margin:0"><figcaption style="margin-bottom:8px">Реализация (390×844)</figcaption>
        <img src="${dataUrl(p.shot)}" style="height:${H}px;border-radius:22px;display:block"></figure>
    </div></body></html>`)
  await page.waitForTimeout(150)
  const out = file(`screenshots/compare/${p.name}.png`)
  await page.screenshot({ path: out.pathname.replace(/^\/([A-Za-z]:)/, '$1'), fullPage: true })
  console.log('wrote', p.name)
}
await browser.close()
