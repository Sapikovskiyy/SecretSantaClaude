// Review stills from one bundle: node scripts/stills.mjs <compositionId> <scale> <frame,frame,...> [outDir]
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
const [id, scale, list, dir = 'renders/frames/review'] = process.argv.slice(2)
mkdirSync(dir, { recursive: true })
const serveUrl = await bundle({ entryPoint: resolve('src/index.ts') })
const composition = await selectComposition({ serveUrl, id })
for (const frame of list.split(',').map(Number)) {
  await renderStill({ composition, serveUrl, frame, output: `${dir}/${id}-${String(frame).padStart(3, '0')}.jpg`, imageFormat: 'jpeg', jpegQuality: 85, scale: Number(scale) })
  process.stdout.write(frame + ' ')
}
console.log('done')
