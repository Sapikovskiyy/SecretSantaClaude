// Pixel audit: finds comparable layout features in a reference image and in a screenshot,
// converts both to CSS px at 390 width and prints the deltas.
//   node scripts/pixel-audit.mjs <reference.jpeg> <screenshot.png>
// Features: bounding boxes of cream panels, red CTAs, green card, the nav bar; and
// vertical bands of bright text on dark background (headline / subtitle lines).
import sharp from 'sharp'

const [refPath, shotPath] = process.argv.slice(2)

async function load(p) {
  const img = sharp(p).removeAlpha()
  const { width } = await img.metadata()
  const scale = 390 / width
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
  return { data, w: info.width, h: info.height, scale }
}

const isCream = (r, g, b) => r > 238 && g > 205 && g < 240 && b > 175 && b < 225 && r - b > 25
const isRed = (r, g, b) => r > 190 && g < 110 && b < 90 && r - g > 110
const isGreen = (r, g, b) => g > 80 && g > r + 40 && g > b + 15 && r < 80
const isWhiteText = (r, g, b) => r > 225 && g > 215 && b > 200

function bbox(img, test, minRowFill = 0.35, region = [0, 1]) {
  const { data, w, h } = img
  let top = -1, bottom = -1, left = w, right = 0
  for (let y = Math.floor(h * region[0]); y < Math.floor(h * region[1]); y++) {
    let n = 0, l = w, r = 0
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3
      if (test(data[i], data[i + 1], data[i + 2])) { n++; if (x < l) l = x; if (x > r) r = x }
    }
    if (n / w >= minRowFill) {
      if (top < 0) top = y
      bottom = y
      left = Math.min(left, l); right = Math.max(right, r)
    }
  }
  if (top < 0) return null
  const s = img.scale
  return { top: +(top * s).toFixed(1), bottom: +(bottom * s).toFixed(1), left: +(left * s).toFixed(1), right: +(right * s).toFixed(1), height: +((bottom - top) * s).toFixed(1) }
}

/** Rows (in CSS px) containing bright text pixels on dark background, merged into bands. */
function textBands(img, region = [0, 0.45]) {
  const { data, w, h } = img
  const bands = []
  let start = -1
  for (let y = Math.floor(h * region[0]); y < Math.floor(h * region[1]); y++) {
    let n = 0
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3
      if (isWhiteText(data[i], data[i + 1], data[i + 2])) n++
    }
    const on = n > w * 0.01
    if (on && start < 0) start = y
    if (!on && start >= 0) {
      if (y - start > 3) bands.push([+(start * img.scale).toFixed(1), +(y * img.scale).toFixed(1)])
      start = -1
    }
  }
  return bands
}

const ref = await load(refPath)
const shot = await load(shotPath)
const report = (name, a, b) => {
  if (!a || !b) return console.log(`${name.padEnd(14)} ref=${JSON.stringify(a)} shot=${JSON.stringify(b)}`)
  const d = (k) => (b[k] - a[k]).toFixed(1).padStart(6)
  console.log(`${name.padEnd(14)} top ${a.top}→${b.top} (${d('top')})  bottom ${a.bottom}→${b.bottom} (${d('bottom')})  left ${a.left}→${b.left} (${d('left')})  right ${a.right}→${b.right} (${d('right')})`)
}
report('cream', bbox(ref, isCream, 0.5), bbox(shot, isCream, 0.5))
report('red CTA', bbox(ref, isRed, 0.4, [0.55, 1]), bbox(shot, isRed, 0.4, [0.55, 1]))
report('green', bbox(ref, isGreen, 0.5), bbox(shot, isGreen, 0.5))
console.log('text ref ', JSON.stringify(textBands(ref)))
console.log('text shot', JSON.stringify(textBands(shot)))
