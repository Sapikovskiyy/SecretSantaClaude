// QA for a rendered MP4: stream facts, loudness, black/flash scan, transition frames.
// Usage: node scripts/qa.mjs renders/<file>.mp4 [frame,frame,...]
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync } from 'node:fs'
import { basename } from 'node:path'
import sharp from 'sharp'

const [file, frameList = ''] = process.argv.slice(2)
const name = basename(file, '.mp4')
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const run = (args) => execFileSync(npx, ['remotion', ...args], { encoding: 'utf8', shell: process.platform === 'win32' })

// 1 · streams
const probe = JSON.parse(run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,codec_name,profile,width,height,r_frame_rate,nb_frames,pix_fmt,color_space,sample_rate,channels,duration:format=duration,size,bit_rate', '-of', 'json', file]))
for (const s of probe.streams) console.log(s.codec_type.padEnd(5), JSON.stringify(s))
console.log('format', JSON.stringify(probe.format))

// 2 · loudness (BS.1770 meter in scripts/loudness.mjs)
const tmp = `renders/frames/qa-${name}`
rmSync(tmp, { recursive: true, force: true })
mkdirSync(`${tmp}/tiny`, { recursive: true })
run(['ffmpeg', '-v', 'error', '-y', '-i', file, '-vn', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s16le', `${tmp}/a.wav`])
console.log(execFileSync(process.execPath, ['scripts/loudness.mjs', `${tmp}/a.wav`], { encoding: 'utf8' }).trim())

// 3 · per-frame luminance: black frames and sudden jumps
run(['ffmpeg', '-v', 'error', '-i', file, '-vf', 'scale=24:24', '-y', `${tmp}/tiny/%04d.png`])
const tiles = readdirSync(`${tmp}/tiny`).sort()
const luma = []
for (const t of tiles) {
  const [r, g, b] = (await sharp(`${tmp}/tiny/${t}`).stats()).channels.map((c) => c.mean)
  luma.push(0.2126 * r + 0.7152 * g + 0.0722 * b) // BT.709 luma
}
const black = luma.map((v, i) => [i, v]).filter(([, v]) => v < 6)
const jumps = luma.slice(1).map((v, i) => [i + 1, v - luma[i]]).filter(([, d]) => Math.abs(d) > 14)
console.log(`frames decoded: ${luma.length} · min luma ${Math.min(...luma).toFixed(1)} · max ${Math.max(...luma).toFixed(1)}`)
console.log(`near-black frames (<6/255): ${black.length ? black.map(([i]) => i).join(',') : 'none'}`)
console.log(`frame-to-frame jumps >14/255: ${jumps.length ? jumps.map(([i, d]) => `${i}(${d > 0 ? '+' : ''}${d.toFixed(0)})`).join(' ') : 'none'}`)

// 4 · review frames
if (frameList) {
  for (const fr of frameList.split(',').map(Number)) {
    const fps = Number(probe.streams.find((s) => s.codec_type === 'video').r_frame_rate.split('/')[0])
    run(['ffmpeg', '-v', 'error', '-y', '-ss', ((fr + 0.5) / fps).toFixed(4), '-i', file, '-vf', 'scale=-2:480', '-frames:v', '1', `${tmp}/f${String(fr).padStart(4, '0')}.png`])
  }
  console.log(`review frames → ${tmp}/f*.png`)
}
