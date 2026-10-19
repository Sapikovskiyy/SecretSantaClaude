// Cuts the real recipient card out of the Reveal capture (rounded body + avatar tab) → card-cutout.png
// Boxes measured on public/assets/ui/reveal-open.png (1170×2532). Re-run after re-capturing.
import sharp from 'sharp'
const src = 'public/assets/ui/reveal-open.png'
const L = 136, T = 800, R = 1034, B = 1808
const w = R - L, h = B - T
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect x="5" y="${968 - T}" width="${1028 - 141}" height="${1804 - 968}" rx="88" fill="#fff"/>
  <rect x="${402 - L}" y="${808 - T}" width="${768 - 402}" height="${1000 - 808}" rx="104" fill="#fff"/>
</svg>`
const crop = await sharp(src).extract({ left: L, top: T, width: w, height: h }).ensureAlpha().toBuffer()
await sharp(crop).composite([{ input: Buffer.from(svg), blend: 'dest-in' }]).png().toFile('public/assets/ui/card-cutout.png')
console.log('card-cutout.png', w, h)
