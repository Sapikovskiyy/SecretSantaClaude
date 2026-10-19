// ITU-R BS.1770-4 integrated loudness (LUFS) + sample/4× oversampled peak for a 16-bit stereo WAV.
// Usage: npx remotion ffmpeg -i in.mp4 -vn -ac 2 -ar 48000 -c:a pcm_s16le out.wav && node scripts/loudness.mjs out.wav
import { readFileSync } from 'node:fs'
const b = readFileSync(process.argv[2]); let o = 12, fmt, data
while (o < b.length) { const id = b.toString('ascii', o, o + 4), sz = b.readUInt32LE(o + 4); if (id === 'fmt ') fmt = { ch: b.readUInt16LE(o + 10), sr: b.readUInt32LE(o + 12) }; if (id === 'data') { data = b.subarray(o + 8, o + 8 + sz); break } o += 8 + sz }
const n = data.length / (2 * fmt.ch), ch = Array.from({ length: fmt.ch }, () => new Float64Array(n))
for (let i = 0; i < n; i++) for (let c = 0; c < fmt.ch; c++) ch[c][i] = data.readInt16LE((i * fmt.ch + c) * 2) / 32768
const biquad = (x, [b0, b1, b2, a1, a2]) => { const y = new Float64Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < x.length; i++) { const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v } return y }
// 48 kHz K-weighting coefficients (BS.1770)
const pre = [1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585]
const rlb = [1.0, -2.0, 1.0, -1.99004745483398, 0.99007225036621]
const kw = ch.map((x) => biquad(biquad(x, pre), rlb))
const blk = Math.round(0.4 * fmt.sr), hop = Math.round(0.1 * fmt.sr), L = []
for (let s = 0; s + blk <= n; s += hop) { let z = 0; for (const x of kw) { let e = 0; for (let i = s; i < s + blk; i++) e += x[i] * x[i]; z += e / blk } L.push(z) }
const lufs = (z) => -0.691 + 10 * Math.log10(z)
let g = L.filter((z) => lufs(z) > -70); const rel = lufs(g.reduce((a, z) => a + z, 0) / g.length) - 10
g = g.filter((z) => lufs(z) > rel)
const I = lufs(g.reduce((a, z) => a + z, 0) / g.length)
let peak = 0, tp = 0
for (const x of ch) for (let i = 1; i < n - 2; i++) { peak = Math.max(peak, Math.abs(x[i])); for (const t of [0.25, 0.5, 0.75]) { const v = x[i] + t * (x[i + 1] - x[i - 1]) / 2 + t * t * (2 * x[i - 1] - 5 * x[i] + 4 * x[i + 1] - x[i + 2]) / 2 + t * t * t * (3 * (x[i] - x[i + 1]) + x[i + 2] - x[i - 1]) / 2; tp = Math.max(tp, Math.abs(v)) } }
console.log(`Integrated: ${I.toFixed(1)} LUFS · sample peak ${(20 * Math.log10(peak)).toFixed(2)} dBFS · ~true peak ${(20 * Math.log10(tp)).toFixed(2)} dBTP · ${(n / fmt.sr).toFixed(2)} s`)
