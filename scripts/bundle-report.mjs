// Attributes minified bytes of a built JS chunk to source packages/files using its sourcemap.
//   npx vite build --mode demo --sourcemap --outDir <dir> && node scripts/bundle-report.mjs <dir>
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2] ?? 'dist'
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const val = Object.fromEntries([...B64].map((c, i) => [c, i]))

function decodeLine(line) {
  const segs = []
  for (const seg of line.split(',')) {
    if (!seg) continue
    const out = []
    let shift = 0, v = 0
    for (const ch of seg) {
      const d = val[ch]
      v += (d & 31) << shift
      if (d & 32) shift += 5
      else {
        out.push(v & 1 ? -(v >> 1) : v >> 1)
        v = 0
        shift = 0
      }
    }
    segs.push(out)
  }
  return segs
}

const group = (src) => {
  const m = src.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/)
  if (m) return m[1]
  const s = src.replace(/^.*?\/src\//, 'src/')
  return s.startsWith('src/') ? s.split('/').slice(0, 3).join('/') : s
}

const assets = join(dir, 'assets')
for (const f of readdirSync(assets).filter((f) => f.endsWith('.js'))) {
  const code = readFileSync(join(assets, f), 'utf8')
  const map = JSON.parse(readFileSync(join(assets, f + '.map'), 'utf8'))
  const lines = code.split('\n')
  const sizes = {}
  let src = 0
  map.mappings.split(';').forEach((l, li) => {
    const segs = decodeLine(l)
    const len = lines[li]?.length ?? 0
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i]
      if (s.length > 1) src += s[1]
      const start = s[0] + (i ? segs.slice(0, i).reduce((a, x) => a + x[0], 0) : 0)
      const next = i + 1 < segs.length ? start + segs[i + 1][0] : len
      const key = group(map.sources[src] ?? '?')
      sizes[key] = (sizes[key] ?? 0) + Math.max(0, next - start)
    }
  })
  const total = Object.values(sizes).reduce((a, b) => a + b, 0)
  console.log(`\n${f}  ${(code.length / 1024).toFixed(0)} KB`)
  for (const [k, v] of Object.entries(sizes).sort((a, b) => b[1] - a[1]).slice(0, 18)) console.log(`  ${(v / 1024).toFixed(1).padStart(7)} KB  ${((v / total) * 100).toFixed(1).padStart(5)}%  ${k}`)
}
