// Review helper: node scripts/contact-sheet.mjs out.jpg a.jpg b.jpg … → side-by-side strip
import sharp from 'sharp'
const [out, ...files] = process.argv.slice(2)
const metas = await Promise.all(files.map((f) => sharp(f).metadata()))
const h = Math.max(...metas.map((m) => m.height)); let x = 0
const comps = files.map((f, i) => { const c = { input: f, left: x, top: 0 }; x += metas[i].width + 8; return c })
await sharp({ create: { width: x, height: h, channels: 3, background: '#777' } }).composite(comps).png().toBuffer().then((b) => sharp(b).resize({ width: Math.min(x, 2600) }).jpeg({ quality: 88 }).toFile(out))
