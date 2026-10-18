// Renders public/icons/icon.svg into the PNG sizes the PWA manifest needs.
// Usage: node scripts/gen-icons.mjs   (uses local Edge; set PW_CHANNEL=chrome to switch)
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'

const svg = readFileSync(new URL('../public/icons/icon.svg', import.meta.url), 'utf8')
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'msedge' })
const page = await browser.newPage()

const targets = [
  { file: 'icon-192.png', size: 192, pad: 0 },
  { file: 'icon-512.png', size: 512, pad: 0 },
  { file: 'icon-maskable-512.png', size: 512, pad: 0.12 },
]

for (const t of targets) {
  await page.setViewportSize({ width: t.size, height: t.size })
  const inner = Math.round(t.size * (1 - t.pad * 2))
  await page.setContent(
    `<html><body style="margin:0;background:#2A1F1B;display:flex;align-items:center;justify-content:center;width:${t.size}px;height:${t.size}px">
      <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div>
    </body></html>`,
  )
  await page.screenshot({ path: new URL(`../public/icons/${t.file}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1') })
  console.log('wrote', t.file)
}
await browser.close()
