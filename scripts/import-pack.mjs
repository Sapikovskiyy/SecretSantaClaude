// Imports CEO illustration-pack PNGs (transparent cutouts) into src/assets/3d as WebP.
// Kills faint background-removal fringe, trims empty borders, caps the size.
//
//   node scripts/import-pack.mjs <pack root containing public/santomi/illustrations>
// Sources are kept under design/renders/pack/ (copied by this script) for future re-exports.
import sharp from 'sharp'
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// pack path (relative to illustrations/) → asset key
const MAP = {
  'categories/books.png': 'cat-books',
  'categories/games.png': 'cat-games',
  'categories/coffee-tea.png': 'cat-coffee',
  'categories/technology.png': 'cat-tech',
  'categories/music.png': 'cat-music',
  'categories/beauty.png': 'cat-beauty',
  'categories/fashion.png': 'cat-fashion',
  'categories/creativity.png': 'cat-creative',
  'categories/home.png': 'cat-home',
  'categories/sports.png': 'cat-sport',
  'categories/travel.png': 'cat-travel',
  'categories/photo.png': 'cat-photo',
  'wishlist/sneakers.png': 'wl-sneakers',
  'wishlist/headphones.png': 'wl-headphones',
  'wishlist/wireless-earbuds.png': 'wl-earbuds',
  'wishlist/handheld-console.png': 'wl-console',
  'wishlist/hoodie.png': 'wl-hoodie',
  'wishlist/novel.png': 'wl-book',
  'wishlist/camera.png': 'wl-camera',
  'wishlist/candle.png': 'wl-candle',
  'wishlist/plant.png': 'wl-plant',
  'wishlist/suitcase.png': 'wl-suitcase',
  'wishlist/coffee-cup.png': 'wl-coffee',
  'hero/gift-ai-mascot.png': 'mascot',
}

const root = process.argv[2]
if (!root) throw new Error('Pass the pack root')
const src = join(root, 'public/santomi/illustrations')
mkdirSync('src/assets/3d', { recursive: true })

for (const [rel, key] of Object.entries(MAP)) {
  const input = join(src, rel)
  if (!existsSync(input)) {
    console.log(`skip ${rel}`)
    continue
  }
  const keep = join('design/renders/pack', rel)
  mkdirSync(join(keep, '..'), { recursive: true })
  copyFileSync(input, keep)

  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 3; i < data.length; i += 4) if (data[i] < 28) data[i] = 0
  const dest = `src/assets/3d/${key}.webp`
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 1 })
    .resize({ width: key === 'mascot' ? 720 : 400, height: key === 'mascot' ? 720 : 400, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 84, alphaQuality: 90, effort: 6 })
    .toFile(dest)
  console.log(`${rel} -> ${dest} (${Math.round(statSync(dest).size / 1024)} KB)`)
}
