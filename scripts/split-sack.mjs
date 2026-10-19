// Prepares the Welcome sack render (CEO asset, transparent PNG/WebP) as two aligned layers:
//   sack-back.webp  — the whole sack
//   sack-front.webp — only what lies in front of the opening (front lip, rope, body)
// The candy cane is rendered between them, so it stands *inside* the sack.
// Both layers keep the same canvas (no trim) so they overlay pixel-perfectly.
//
//   node scripts/split-sack.mjs <sack.webp|png>
import sharp from 'sharp'
import { statSync } from 'node:fs'

const input = process.argv[2]
if (!input) throw new Error('Usage: split-sack.mjs <sack image>')

// Front rim of the opening in source pixels (1254² render), measured on a 20 px grid.
const RIM = [
  [0, 260], [275, 227], [340, 245], [430, 245], [520, 236], [575, 242], [610, 265], [640, 285],
  [680, 295], [720, 287], [755, 275], [800, 260], [850, 251], [905, 245], [950, 245], [1254, 260],
]
const rimY = (x) => {
  for (let i = 1; i < RIM.length; i++) {
    const [x0, y0] = RIM[i - 1], [x1, y1] = RIM[i]
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
  }
  return RIM.at(-1)[1]
}

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: w, height: h } = info
const k = 1254 / w
for (let i = 3; i < data.length; i += 4) if (data[i] < 20) data[i] = 0 // background-removal fringe

const front = Buffer.from(data)
for (let y = 0; y < h; y++)
  for (let x = 0; x < w; x++) {
    // 3 px feather just above the rim so the lip's highlight stays on the front layer
    const d = y * k - (rimY(x * k) - 3)
    const cover = Math.max(0, Math.min(1, (d + 1.5) / 3))
    const a = (y * w + x) * 4 + 3
    front[a] = Math.round(front[a] * cover)
  }

const out = async (buf, name) => {
  const dest = `src/assets/3d/${name}.webp`
  await sharp(buf, { raw: { width: w, height: h, channels: 4 } })
    .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 84, alphaQuality: 90, effort: 6 })
    .toFile(dest)
  console.log(`${dest} (${Math.round(statSync(dest).size / 1024)} KB)`)
}
await out(data, 'sack-back')
await out(front, 'sack-front')
