// Converts the CEO-provided 3D renders (transparent PNG, ~1.2 MB each) into
// web-ready WebP files in src/assets/3d. Also removes faint background-removal
// fringe (stray low-alpha pixels) and trims empty borders.
//
// Usage: node scripts/optimize-assets.mjs <source-folder>
// Source files must be named a01.png…a15.png (see MAP below) — the original
// ZIP had long Cyrillic names, so they are renamed on extraction.
import sharp from 'sharp'
import { mkdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const MAP = {
  a01: 'mug', // premium_roter_kaffeebecher
  a02: 'gift', // красная подарочная коробка с бантом
  a03: 'house', // пряничный домик в снегу
  a04: 'santa', // санта с подарком и мешком
  a05: 'gift-star', // коробка с сияющей звездой
  a06: 'stocking', // рождественский чулок
  a07: 'sleigh', // сани с подарками
  a08: 'cane', // леденец-трость
  a09: 'star', // кремовая звезда с лентой
  a10: 'bauble', // ёлочный шар
  a11: 'gamepad', // геймпад
  a12: 'headphones', // наушники
  a13: 'book', // зелёная книга с лентой
  a14: 'envelope', // перламутровый конверт с печатью
  a15: 'robot', // робот-санта с подарком
}

const src = process.argv[2]
if (!src) throw new Error('Pass the source folder')
const out = new URL('../src/assets/3d/', import.meta.url)
mkdirSync(out, { recursive: true })

for (const [file, key] of Object.entries(MAP)) {
  const input = join(src, `${file}.png`)
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  // Kill near-transparent fringe pixels left by background removal.
  for (let i = 3; i < data.length; i += 4) if (data[i] < 28) data[i] = 0
  const cleaned = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  const trimmed = await cleaned.png().toBuffer()
  const dest = new URL(`${key}.webp`, out)
  await sharp(trimmed)
    .trim({ threshold: 1 })
    .resize({ width: 720, height: 720, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90, effort: 6 })
    .toFile(dest.pathname.replace(/^\/([A-Za-z]:)/, '$1'))
  const kb = Math.round(statSync(dest).size / 1024)
  console.log(`${file}.png -> ${key}.webp (${kb} KB)`)
}
