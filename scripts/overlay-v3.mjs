// Visual overlay comparison: reference vs implementation at 390 px.
//   node scripts/overlay-v3.mjs <name> [width=390]
// Writes screenshots/v3/overlay/<name>-<w>-{blend,zoom-top,zoom-mid,zoom-bottom}.png
//   blend: 50/50 mix (ghosting shows misalignment)
//   zoom-*: side-by-side 2× crops of each vertical third, with a 10 px grid in CSS px
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const [name, W = '390'] = process.argv.slice(2)
const w = +W
const out = 'screenshots/v3/overlay'
mkdirSync(out, { recursive: true })

const raw = sharp(`screenshots/v3/${w}/${name}.png`)
const meta = await raw.metadata()
const shotH = Math.round((meta.height * w) / meta.width)
const shot = sharp(await raw.resize(w, shotH).png().toBuffer())
const H = Math.min(shotH, Math.round((w * 1536) / 711))
const ref = await sharp(`design/references/${name}.jpeg`).resize(w, Math.round((w * 1536) / 711)).extract({ left: 0, top: 0, width: w, height: H }).png().toBuffer()
const imp = await shot.extract({ left: 0, top: 0, width: w, height: H }).png().toBuffer()

await sharp(ref).composite([{ input: await sharp(imp).ensureAlpha(0.5).toBuffer(), blend: 'over' }]).png().toFile(`${out}/${name}-${w}-blend.png`)

const grid = (h) => {
  let g = ''
  for (let y = 0; y <= h; y += 10) g += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${y % 50 ? 'rgba(0,255,255,.18)' : 'rgba(0,255,255,.55)'}" stroke-width="0.5"/>`
  for (let x = 0; x <= w; x += 10) g += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${x % 50 ? 'rgba(0,255,255,.18)' : 'rgba(0,255,255,.55)'}" stroke-width="0.5"/>`
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${g}</svg>`)
}
const thirds = { top: [0, Math.round(H / 3)], mid: [Math.round(H / 3), Math.round((2 * H) / 3)], bottom: [Math.round((2 * H) / 3), H] }
for (const [k, [a, b]] of Object.entries(thirds)) {
  const h = b - a
  const crop = async (buf) => sharp(await sharp(buf).extract({ left: 0, top: a, width: w, height: h }).composite([{ input: grid(h) }]).png().toBuffer()).resize(w * 2, h * 2).png().toBuffer()
  await sharp({ create: { width: w * 4 + 20, height: h * 2, channels: 3, background: '#ffffff' } })
    .composite([{ input: await crop(ref), left: 0, top: 0 }, { input: await crop(imp), left: w * 2 + 20, top: 0 }])
    .png()
    .toFile(`${out}/${name}-${w}-zoom-${k}.png`)
}
console.log(`overlay written for ${name} (y offset of thirds: ${Object.values(thirds).map((t) => t[0]).join(', ')})`)
