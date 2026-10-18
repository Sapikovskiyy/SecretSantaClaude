// Builds side-by-side images: approved reference (cropped from the handoff sheets)
// next to the Playwright screenshot of the implementation.
// Usage: node scripts/compare.mjs   (after `npx playwright test`)
import { chromium } from '@playwright/test'
import { mkdirSync, readFileSync, existsSync } from 'node:fs'

const root = new URL('..', import.meta.url)
const file = (p) => new URL(p, root)
const dataUrl = (p) => `data:image/png;base64,${readFileSync(file(p)).toString('base64')}`

// Crop boxes (x, y, w, h) in sheet pixels.
const S1 = 'design-handoff/references/01_screens_01-04.png'
const S2 = 'design-handoff/references/02_screens_05-08.png'
const S3 = 'design-handoff/references/03_screens_09-12.png'
const S4 = 'design-handoff/references/04_screens_13-14.png'
const PAIRS = [
  { name: '01-welcome', ref: S1, box: [46, 140, 330, 800], shot: 'screenshots/iphone/01-welcome.png' },
  { name: '02-home', ref: S1, box: [393, 128, 330, 800], shot: 'screenshots/iphone/02-home.png' },
  { name: '03-create', ref: S1, box: [738, 128, 330, 800], shot: 'screenshots/iphone/03-create.png' },
  { name: '04-invite', ref: S1, box: [1078, 128, 330, 800], shot: 'screenshots/iphone/04-invite.png' },
  { name: '05-room', ref: S2, box: [38, 128, 334, 770], shot: 'screenshots/iphone/05-room.png' },
  { name: '06-participants', ref: S2, box: [386, 128, 334, 770], shot: 'screenshots/iphone/06-participants.png' },
  { name: '07-interests', ref: S2, box: [730, 128, 330, 770], shot: 'screenshots/iphone/07-interests-empty.png' },
  { name: '08-wishlist', ref: S2, box: [1074, 128, 332, 770], shot: 'screenshots/iphone/08-wishlist-top.png' },
  { name: '09-draw', ref: S3, box: [36, 135, 334, 790], shot: 'screenshots/iphone/09-draw.png' },
  { name: '10-reveal', ref: S3, box: [386, 135, 334, 790], shot: 'screenshots/iphone/10-reveal-open.png' },
  { name: '11-chat', ref: S3, box: [732, 135, 330, 790], shot: 'screenshots/iphone/11-chat.png' },
  { name: '12-ai', ref: S3, box: [1078, 135, 334, 790], shot: 'screenshots/iphone/12-ai.png' },
  { name: '13-ai-plus', ref: S4, box: [376, 48, 428, 935], shot: 'screenshots/iphone/13-ai-plus.png' },
  { name: '14-profile', ref: S4, box: [836, 48, 440, 935], shot: 'screenshots/iphone/14-profile.png' },
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
