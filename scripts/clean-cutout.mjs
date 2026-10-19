// Cleans a generated transparent cutout and writes a web-ready WebP to src/assets/3d.
// Keeps only the largest opaque object (drops detached stars, glow chunks and
// rectangular remnants from background removal), feathers 3 px around it,
// trims empty borders.
//
//   node scripts/clean-cutout.mjs <input.png> <key> [maxSize=1024]
import sharp from 'sharp'
import { statSync } from 'node:fs'

const [input, key, max = '1024'] = process.argv.slice(2)
if (!input || !key) throw new Error('Usage: clean-cutout.mjs <input.png> <key> [maxSize]')

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: w, height: h } = info
// Per-asset shape masks (coordinates in 600-unit space of the untrimmed source).
// Generated cutouts carry opaque glow/star remnants that touch the object, so a
// connected-component pass alone cannot separate them.
const inCircle = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r
const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1
const MASKS = {
  'sack-v3': (x, y) =>
    // candy cane: hook (outer ellipse minus hole, upper half) + two legs
    (y <= 112 && inEllipse(x, y, 360, 108, 75, 68) && !inEllipse(x, y, 358, 114, 33, 32)) ||
    (y > 108 && y <= 236 && x >= 285 - (y - 112) * 0.12 && x <= 327 - (y - 112) * 0.1) ||
    (y > 104 && y <= 165 && x >= 384 && x <= 432) ||
    inEllipse(x, y, 290, 219, 110, 30) || // frill
    inEllipse(x, y, 285, 268, 84, 27) || // rope
    (inEllipse(x, y, 300, 424, 159, 139) && x <= 459), // sack body
  'snow-globe': (x, y) =>
    inCircle(x, y, 290, 258, 218) || // glass dome
    (y >= 372 && Math.abs(x - 290) <= 220 + Math.min(1, Math.max(0, (y - 372) / 70)) * 22), // flared base
}
// Red/orange background glow left at the outer edges of an object (not the object itself).
const EDGE_GLOW = { 'snow-globe': (x, y) => y >= 330 && Math.abs(x - 290) > 185 }
const mask = MASKS[key]
const glow = EDGE_GLOW[key]
if (mask) {
  const k = 600 / w
  for (let p = 0; p < w * h; p++) {
    const x = (p % w) * k, y = ((p / w) | 0) * k, i = p * 4
    const d = k / 2
    const cover = (mask(x, y) + mask(x + d, y) + mask(x, y + d) + mask(x + d, y + d)) / 4
    if (cover < 1) data[i + 3] = Math.round(data[i + 3] * cover)
    if (cover > 0 && glow && glow(x, y) && data[i] > data[i + 1] + 55 && data[i] > data[i + 2] + 45) data[i + 3] = 0
  }
}

const solid = new Uint8Array(w * h)
for (let p = 0; p < w * h; p++) solid[p] = data[p * 4 + 3] > 100 ? 1 : 0

// Label connected components (4-neighbour), remember the largest.
const label = new Int32Array(w * h)
let best = 0, bestSize = 0, next = 0
const stack = []
for (let p = 0; p < w * h; p++) {
  if (!solid[p] || label[p]) continue
  next++
  let size = 0
  stack.push(p)
  label[p] = next
  while (stack.length) {
    const q = stack.pop()
    size++
    const x = q % w, y = (q / w) | 0
    for (const n of [x > 0 && q - 1, x < w - 1 && q + 1, y > 0 && q - w, y < h - 1 && q + w]) {
      if (n !== false && solid[n] && !label[n]) { label[n] = next; stack.push(n) }
    }
  }
  if (size > bestSize) { bestSize = size; best = next }
}

// Keep the main object plus a 3 px halo of its soft edge.
const R = 3
const keep = new Uint8Array(w * h)
for (let p = 0; p < w * h; p++) {
  if (label[p] !== best) continue
  const x = p % w, y = (p / w) | 0
  for (let dy = -R; dy <= R; dy++)
    for (let dx = -R; dx <= R; dx++) {
      const xx = x + dx, yy = y + dy
      if (xx >= 0 && yy >= 0 && xx < w && yy < h) keep[yy * w + xx] = 1
    }
}
for (let p = 0; p < w * h; p++) {
  const a = p * 4 + 3
  if (!keep[p] || data[a] < 28) data[a] = 0
}

const dest = `src/assets/3d/${key}.webp`
await sharp(data, { raw: { width: w, height: h, channels: 4 } })
  .trim({ threshold: 1 })
  .resize({ width: +max, height: +max, fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 84, alphaQuality: 90, effort: 6 })
  .toFile(dest)
console.log(`${input.split(/[\\/]/).pop()} -> ${dest} (${Math.round(statSync(dest).size / 1024)} KB, kept ${bestSize}px core)`)
