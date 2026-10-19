// Generates 256 px thumbnails of every 3D render (src/assets/3d/*.webp → src/assets/3d/sm/).
// Art uses them automatically for small numeric sizes (≤ 85 css px, i.e. ≤ 256 px at DPR 3),
// so list rows and chips don't download 720 px heroes.
//   node scripts/make-small-renders.mjs
import sharp from 'sharp'
import { mkdirSync, readdirSync, statSync } from 'node:fs'

const SRC = 'src/assets/3d'
mkdirSync(`${SRC}/sm`, { recursive: true })
let before = 0, after = 0
for (const f of readdirSync(SRC).filter((f) => f.endsWith('.webp'))) {
  if (f.startsWith('sack-')) continue // only used full-screen on Welcome
  await sharp(`${SRC}/${f}`).resize({ width: 256, height: 256, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84, alphaQuality: 90, effort: 6 }).toFile(`${SRC}/sm/${f}`)
  before += statSync(`${SRC}/${f}`).size
  after += statSync(`${SRC}/sm/${f}`).size
}
console.log(`thumbnails: ${Math.round(before / 1024)} KB → ${Math.round(after / 1024)} KB`)
