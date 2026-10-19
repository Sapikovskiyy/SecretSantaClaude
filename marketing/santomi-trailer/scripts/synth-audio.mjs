// Original procedural audio for the Santomi trailer — no samples, no third-party music.
// Everything here is synthesized from sine/noise primitives, so the result is fully owned.
// Usage: node scripts/synth-audio.mjs  → public/audio/*.wav (48 kHz, 16-bit, stereo)
//
// Grid: 120 BPM (1 beat = 0.5 s = 15 frames @30fps). Chords change every scene (4 s).
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SR = 48000
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/audio')
mkdirSync(OUT, { recursive: true })

// ---------- helpers ----------
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12)
const N = (s) => Math.round(s * SR)
function buf(sec) { return [new Float32Array(N(sec)), new Float32Array(N(sec))] }
let seed = 1234567
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1 }
const pan = (p) => [Math.cos((p + 1) * Math.PI / 4), Math.sin((p + 1) * Math.PI / 4)]

function onePoleLP(x, cutoff) {
  const a = Math.exp(-2 * Math.PI * cutoff / SR); let y = 0
  for (let i = 0; i < x.length; i++) { y = (1 - a) * x[i] + a * y; x[i] = y }
}
function highpass(x, cutoff) {
  const a = Math.exp(-2 * Math.PI * cutoff / SR); let lp = 0
  for (let i = 0; i < x.length; i++) { lp = (1 - a) * x[i] + a * lp; x[i] = x[i] - lp }
}
// Simple stereo reverb: 4 parallel combs + 2 allpasses per channel (Schroeder/Freeverb-ish).
function reverb([L, R], { mix = 0.3, size = 1, damp = 0.4 } = {}) {
  const proc = (x, off) => {
    const combs = [1557, 1617, 1491, 1422].map((d) => Math.round((d + off) * size * SR / 44100))
    const out = new Float32Array(x.length)
    for (const d of combs) {
      const line = new Float32Array(d); let idx = 0, filt = 0
      for (let i = 0; i < x.length; i++) {
        const y = line[idx]; filt = y * (1 - damp) + filt * damp
        line[idx] = x[i] + filt * 0.84; idx = (idx + 1) % d; out[i] += y * 0.25
      }
    }
    for (const d0 of [556, 441]) {
      const d = Math.round((d0 + off) * SR / 44100); const line = new Float32Array(d); let idx = 0
      for (let i = 0; i < out.length; i++) {
        const b = line[idx]; const y = -out[i] + b; line[idx] = out[i] + b * 0.5; idx = (idx + 1) % d; out[i] = y
      }
    }
    return out
  }
  const wl = proc(L, 0), wr = proc(R, 23)
  for (let i = 0; i < L.length; i++) { L[i] = L[i] * (1 - mix) + wl[i] * mix; R[i] = R[i] * (1 - mix) + wr[i] * mix }
}
function add(dst, src, at = 0, gain = 1) {
  const o = N(at)
  for (let c = 0; c < 2; c++) for (let i = 0; i < src[c].length && i + o < dst[c].length; i++) if (i + o >= 0) dst[c][i + o] += src[c][i] * gain
}
function normalize(b, peakDb = -1) {
  let p = 0; for (const ch of b) for (const v of ch) p = Math.max(p, Math.abs(v))
  const g = Math.pow(10, peakDb / 20) / (p || 1); for (const ch of b) for (let i = 0; i < ch.length; i++) ch[i] *= g
}
function fadeEdges(b, inS = 0.004, outS = 0.02) {
  const n = b[0].length, a = N(inS), z = N(outS)
  for (const ch of b) { for (let i = 0; i < a && i < n; i++) ch[i] *= i / a; for (let i = 0; i < z && i < n; i++) ch[n - 1 - i] *= i / z }
}
function writeWav(name, [L, R]) {
  const n = L.length, data = Buffer.alloc(44 + n * 4)
  data.write('RIFF', 0); data.writeUInt32LE(36 + n * 4, 4); data.write('WAVE', 8); data.write('fmt ', 12)
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(2, 22); data.writeUInt32LE(SR, 24)
  data.writeUInt32LE(SR * 4, 28); data.writeUInt16LE(4, 32); data.writeUInt16LE(16, 34); data.write('data', 36); data.writeUInt32LE(n * 4, 40)
  for (let i = 0; i < n; i++) {
    data.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(L[i] * 32767))), 44 + i * 4)
    data.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(R[i] * 32767))), 46 + i * 4)
  }
  writeFileSync(resolve(OUT, name), data); console.log('wrote', name, (n / SR).toFixed(2) + 's')
}

// ---------- instruments ----------
// Warm pad: detuned additive saws (soft, 7 harmonics), slow attack/release, low-passed.
function pad(notes, dur, { attack = 1.6, release = 2.2, amp = 0.08, bright = 1 } = {}) {
  const b = buf(dur + release)
  notes.forEach((n, ni) => {
    const [pl, pr] = pan((ni / Math.max(1, notes.length - 1)) * 1.2 - 0.6)
    for (const det of [-7, 0, 6]) {
      const f = midi(n) * Math.pow(2, det / 1200); const ph = (rnd() + 1) * 3.14
      for (let i = 0; i < b[0].length; i++) {
        const t = i / SR
        const env = Math.min(1, t / attack) * (t > dur ? Math.max(0, 1 - (t - dur) / release) : 1)
        if (env <= 0) continue
        let s = 0
        for (let h = 1; h <= 7; h++) s += Math.sin(2 * Math.PI * f * h * t + ph * h) / (h * (1 + (h - 1) * (1.1 - 0.5 * bright)))
        const v = s * env * amp / 3
        b[0][i] += v * pl; b[1][i] += v * pr
      }
    }
  })
  onePoleLP(b[0], 1800 * bright); onePoleLP(b[1], 1800 * bright)
  return b
}
// Bell / chime: inharmonic partials with individual decays.
function bell(note, { amp = 0.3, decay = 3.2, p = 0 } = {}) {
  const f = midi(note), parts = [[1, 1, 1], [2.0, 0.45, 0.7], [2.76, 0.35, 0.5], [5.4, 0.18, 0.3], [8.93, 0.08, 0.18]]
  const b = buf(decay + 0.2); const [pl, pr] = pan(p)
  for (let i = 0; i < b[0].length; i++) {
    const t = i / SR; let s = 0
    for (const [r, a, d] of parts) s += a * Math.sin(2 * Math.PI * f * r * t) * Math.exp(-t / (decay * d))
    const v = s * amp * Math.min(1, t / 0.002); b[0][i] += v * pl; b[1][i] += v * pr
  }
  fadeEdges(b); return b
}
// Celesta-like pluck: soft, short.
function celesta(note, { amp = 0.18, decay = 0.9, p = 0 } = {}) {
  const f = midi(note), b = buf(decay * 2.5); const [pl, pr] = pan(p)
  for (let i = 0; i < b[0].length; i++) {
    const t = i / SR
    const s = Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * f * 4 * t) * Math.exp(-t * 6) + 0.06 * Math.sin(2 * Math.PI * f * 10 * t) * Math.exp(-t * 14)
    const v = s * amp * Math.exp(-t / decay) * Math.min(1, t / 0.003); b[0][i] += v * pl; b[1][i] += v * pr
  }
  fadeEdges(b); return b
}
// Soft sub thump (felt, not a club kick).
function thump({ amp = 0.5, f0 = 110, f1 = 42, decay = 0.45 } = {}) {
  const b = buf(decay * 3); let ph = 0
  for (let i = 0; i < b[0].length; i++) {
    const t = i / SR; const f = f1 + (f0 - f1) * Math.exp(-t * 18); ph += 2 * Math.PI * f / SR
    const v = Math.sin(ph) * amp * Math.exp(-t / decay) * Math.min(1, t / 0.004); b[0][i] += v; b[1][i] += v
  }
  fadeEdges(b); return b
}
// Noise through a sweeping state-variable band-pass, with stereo pan sweep.
function whoosh({ dur = 1.0, f0 = 300, f1 = 3200, q = 0.6, amp = 0.35, peak = 0.55, panFrom = -0.7, panTo = 0.7, reverse = false } = {}) {
  const b = buf(dur); let low = 0, band = 0
  for (let i = 0; i < b[0].length; i++) {
    const x = i / b[0].length; const t = reverse ? 1 - x : x
    const fc = f0 * Math.pow(f1 / f0, t); const fco = 2 * Math.sin(Math.PI * Math.min(fc, SR / 6) / SR)
    const n = rnd(); low += fco * band; const high = n - low - q * band; band += fco * high
    const env = x < peak ? Math.pow(x / peak, 2) : Math.pow(1 - (x - peak) / (1 - peak), 1.6)
    const [pl, pr] = pan(panFrom + (panTo - panFrom) * x)
    const v = band * env * amp; b[0][i] += v * pl; b[1][i] += v * pr
  }
  fadeEdges(b, 0.01, 0.05); return b
}
// UI tap: tiny pitched blip + filtered click.
function tap(note = 88, { amp = 0.22, p = 0 } = {}) {
  const b = buf(0.18), f = midi(note); const [pl, pr] = pan(p); let lp = 0
  for (let i = 0; i < b[0].length; i++) {
    const t = i / SR; lp = lp * 0.6 + rnd() * 0.4
    const s = Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 0.035) + lp * 0.5 * Math.exp(-t / 0.004)
    const v = s * amp; b[0][i] += v * pl; b[1][i] += v * pr
  }
  fadeEdges(b, 0.0005, 0.02); return b
}

// ---------- music bed (30 s) ----------
// D major colour, one chord per 4 s scene: Dmaj9 · Bm9 · Gmaj7 · Em9 · Gmaj9/A … reveal: Gmaj7 → D/F# → final Dmaj9
const MUSIC_LEN = 30
function music() {
  const m = buf(MUSIC_LEN + 3)
  const chords = [
    [0, [50, 57, 61, 64, 66], 0.8],       // Dmaj9 — intro, dark & low-passed
    [4, [47, 54, 57, 61, 62], 0.9],       // Bm9
    [8, [43, 50, 54, 57, 62], 1],         // Gmaj7
    [12, [40, 47, 50, 54, 59], 1],        // Em9
    [16, [45, 50, 54, 57, 64], 1.05],     // A sus / Gmaj9 colour
  ]
  for (const [at, notes, bright] of chords) add(m, pad(notes, 4.4, { amp: 0.075, bright, attack: at === 0 ? 2.6 : 1.1, release: 1.6 }), at)
  // Reveal section: suspended, quiet, swelling into the open
  add(m, pad([43, 50, 55, 57, 62], 2.0, { amp: 0.05, bright: 0.7, attack: 0.6, release: 0.6 }), 20.5)
  add(m, pad([42, 50, 54, 57, 62, 66], 2.4, { amp: 0.085, bright: 1.15, attack: 0.08, release: 1.4 }), 22.83)
  // Finale
  add(m, pad([38, 50, 57, 61, 64, 66, 69], 4.6, { amp: 0.085, bright: 1.1, attack: 0.25, release: 2.6 }), 25.33)

  // Pulse from 6 s: soft sub on every 2nd beat, celesta arpeggio on 8ths (quiet) until the reveal dip.
  const arps = { 4: [69, 73, 76, 78], 8: [67, 71, 74, 78], 12: [64, 67, 71, 74], 16: [69, 72, 76, 81] }
  for (let t = 6; t < 20; t += 1) add(m, thump({ amp: 0.22, decay: 0.35 }), t)
  for (let t = 6; t < 20; t += 0.25) {
    const sec = t < 8 ? 4 : t < 12 ? 8 : t < 16 ? 12 : 16
    const seq = arps[sec], idx = Math.round((t - 6) / 0.25) % seq.length
    add(m, celesta(seq[idx], { amp: 0.045 + (t > 16 ? 0.01 : 0), decay: 0.55, p: idx % 2 ? 0.35 : -0.35 }), t)
  }
  // Finale arpeggio, slower, fading
  ;[74, 78, 81, 85, 86].forEach((n, k) => add(m, celesta(n, { amp: 0.06, decay: 1.2, p: (k % 2 ? 0.4 : -0.4) }), 25.83 + k * 0.5))

  // Silence window 20.0–20.5 s (scene 06 dip)
  const s0 = N(19.6), s1 = N(20.0), s2 = N(20.5)
  for (const ch of m) for (let i = s0; i < ch.length && i < N(MUSIC_LEN + 3); i++) {
    if (i < s1) ch[i] *= 1 - (i - s0) / (s1 - s0)
    else if (i < s2) ch[i] = 0
  }
  highpass(m[0], 35); highpass(m[1], 35)
  reverb(m, { mix: 0.32, size: 1.15, damp: 0.45 })
  // final fade 28.5 → 30
  for (const ch of m) for (let i = N(28.5); i < ch.length; i++) ch[i] *= Math.max(0, 1 - (i - N(28.5)) / N(1.5))
  const out = [m[0].slice(0, N(MUSIC_LEN)), m[1].slice(0, N(MUSIC_LEN))]
  normalize(out, -3)
  return out
}

// ---------- SFX ----------
function withVerb(b, mix = 0.35, tail = 2.5) {
  const out = buf(b[0].length / SR + tail); add(out, b, 0); reverb(out, { mix, size: 1.1, damp: 0.5 }); return out
}
const sfx = {
  // Delicate festive chime: three-bell cluster (D6 · A6 · F#7) with a soft lead-in
  'chime.wav': () => { const b = buf(4); add(b, bell(86, { amp: 0.22, p: -0.25 }), 0); add(b, bell(93, { amp: 0.14, p: 0.3, decay: 2.6 }), 0.06); add(b, bell(102, { amp: 0.07, p: 0, decay: 1.8 }), 0.12); return withVerb(b, 0.4) },
  'whoosh.wav': () => withVerb(whoosh({ dur: 1.1, f0: 260, f1: 4200, amp: 0.5, peak: 0.6 }), 0.25, 1),
  'whoosh-soft.wav': () => withVerb(whoosh({ dur: 0.8, f0: 400, f1: 2400, amp: 0.32, peak: 0.5, panFrom: 0.5, panTo: -0.5 }), 0.25, 1),
  'impact-soft.wav': () => { const b = buf(2); add(b, thump({ amp: 0.7, f0: 140, f1: 44, decay: 0.55 }), 0); return withVerb(b, 0.2, 1.5) },
  'tap.wav': () => withVerb(tap(88), 0.15, 0.4),
  'type.wav': () => withVerb(tap(100, { amp: 0.08 }), 0.1, 0.2),
  ...Object.fromEntries([81, 83, 85, 86, 88].map((n, i) => [`avatar-${i + 1}.wav`, () => { const b = buf(1.2); add(b, tap(n + 12, { amp: 0.12 }), 0); add(b, celesta(n, { amp: 0.1, decay: 0.5 }), 0); return withVerb(b, 0.25, 0.8) }])),
  'pop.wav': () => { const b = buf(0.6); add(b, celesta(79, { amp: 0.12, decay: 0.3 }), 0); add(b, tap(91, { amp: 0.1 }), 0); return withVerb(b, 0.2, 0.6) },
  'sparkle.wav': () => { const b = buf(2); [93, 97, 100, 105, 109].forEach((n, k) => add(b, celesta(n, { amp: 0.07, decay: 0.4, p: k % 2 ? 0.5 : -0.5 }), k * 0.045)); return withVerb(b, 0.4, 1.5) },
  'breath-rise.wav': () => withVerb(whoosh({ dur: 1.4, f0: 180, f1: 1800, amp: 0.3, peak: 0.97, panFrom: 0, panTo: 0, q: 0.9 }), 0.3, 0.5),
  // Gift reveal: felt impact + bright bell bloom + airy shimmer tail
  'reveal.wav': () => {
    const b = buf(5)
    add(b, thump({ amp: 0.75, f0: 120, f1: 38, decay: 0.8 }), 0)
    add(b, whoosh({ dur: 1.6, f0: 1500, f1: 7000, amp: 0.16, peak: 0.08, panFrom: -0.3, panTo: 0.3 }), 0)
    ;[[74, 0.2, 0], [81, 0.16, -0.4], [86, 0.14, 0.4], [90, 0.1, -0.2], [93, 0.08, 0.3]].forEach(([n, a, p], k) => add(b, bell(n, { amp: a, p, decay: 3.4 }), k * 0.03))
    return withVerb(b, 0.42, 2.5)
  },
  'final-chime.wav': () => { const b = buf(5); add(b, bell(74, { amp: 0.2, p: -0.2, decay: 4 }), 0); add(b, bell(81, { amp: 0.14, p: 0.25, decay: 3.4 }), 0.08); add(b, bell(90, { amp: 0.08, decay: 2.5 }), 0.16); return withVerb(b, 0.45, 3) },
}

writeWav('music.wav', music())
for (const [name, make] of Object.entries(sfx)) { const b = make(); normalize(b, -3); fadeEdges(b, 0.0005, 0.05); writeWav(name, b) }

// ---------- teaser bed (15 s) ----------
// Teaser edit (frames @30): intro 0–90 · brand 90–170 · friends 170–230 · reveal 230–345 (hit at 295 = 9.83 s) · finale 345–450.
function musicTeaser() {
  const LEN = 15
  const m = buf(LEN + 3)
  add(m, pad([50, 57, 61, 64, 66], 3.2, { amp: 0.075, bright: 0.8, attack: 1.6, release: 1.2 }), 0)
  add(m, pad([47, 54, 57, 61, 62], 2.8, { amp: 0.075, bright: 0.95, attack: 0.6, release: 1.2 }), 3)
  add(m, pad([43, 50, 54, 57, 62], 2.0, { amp: 0.075, bright: 1, attack: 0.5, release: 0.8 }), 5.67)
  for (let t = 3; t < 7.5; t += 1) add(m, thump({ amp: 0.22, decay: 0.35 }), t)
  const seq = [69, 73, 76, 78]
  for (let t = 3; t < 7.5; t += 0.25) add(m, celesta(seq[Math.round((t - 3) / 0.25) % 4], { amp: 0.045, decay: 0.55, p: Math.round(t * 4) % 2 ? 0.35 : -0.35 }), t)
  add(m, pad([43, 50, 55, 57, 62], 1.6, { amp: 0.05, bright: 0.7, attack: 0.5, release: 0.5 }), 8.1)
  add(m, pad([42, 50, 54, 57, 62, 66], 1.7, { amp: 0.085, bright: 1.15, attack: 0.08, release: 1.0 }), 9.83)
  add(m, pad([38, 50, 57, 61, 64, 66, 69], 3.6, { amp: 0.085, bright: 1.1, attack: 0.25, release: 2.4 }), 11.5)
  ;[74, 78, 81, 85, 86].forEach((n, k) => add(m, celesta(n, { amp: 0.06, decay: 1.2, p: k % 2 ? 0.4 : -0.4 }), 12 + k * 0.4))
  const s0 = N(7.4), s1 = N(7.67), s2 = N(8.1)
  for (const ch of m) for (let i = s0; i < s2; i++) ch[i] *= i < s1 ? 1 - (i - s0) / (s1 - s0) : 0
  highpass(m[0], 35); highpass(m[1], 35)
  reverb(m, { mix: 0.32, size: 1.15, damp: 0.45 })
  for (const ch of m) for (let i = N(13.6); i < ch.length; i++) ch[i] *= Math.max(0, 1 - (i - N(13.6)) / N(1.4))
  const out = [m[0].slice(0, N(LEN)), m[1].slice(0, N(LEN))]
  normalize(out, -3)
  return out
}
writeWav('music-teaser.wav', musicTeaser())
