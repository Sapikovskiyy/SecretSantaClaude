// Frame-exact timeline @30 fps. Grid: 120 BPM → 1 beat = 15 frames. Cuts and hits land on beats.
export const FPS = 30
export const BEAT = 15

export const TRAILER_FRAMES = 900
export const TEASER_FRAMES = 450
export const PREVIEW_FRAMES = 240

/** Scene windows in global frames (each scene renders a little past its end to hand off). */
export const scenes = {
  s01: { from: 0, len: 140 },
  s02: { from: 105, len: 142 },
  s03: { from: 240, len: 135 },
  s04: { from: 360, len: 150 },
  s05: { from: 480, len: 145 },
  s06: { from: 600, len: 165 },
  s07: { from: 750, len: 150 },
} as const

// Sound cues (global frame → file in public/audio, volume 0..1). All audio is synthesized in-house.
export type Cue = { at: number; file: string; volume: number }
const ticks = (from: number, n: number, step: number): Cue[] => Array.from({ length: n }, (_, i) => ({ at: from + i * step, file: 'type.wav', volume: 0.32 }))
export const sfxCues: Cue[] = [
  // 01 · 02
  { at: 31, file: 'whoosh-soft.wav', volume: 0.18 }, // candy cane falls
  { at: 51, file: 'pop.wav', volume: 0.45 }, // cane lands in the sack
  { at: 60, file: 'chime.wav', volume: 0.7 }, // «Дарить — это магия.»
  { at: 100, file: 'whoosh.wav', volume: 0.6 }, // light sweep
  { at: 165, file: 'whoosh-soft.wav', volume: 0.3 }, // phone rises
  { at: 180, file: 'impact-soft.wav', volume: 0.7 }, // pulse starts
  { at: 228, file: 'tap.wav', volume: 0.75 }, // tap on «+»
  // 03 · create
  { at: 258, file: 'tap.wav', volume: 0.6 }, // name field
  ...ticks(265, 6, 4),
  { at: 296, file: 'tap.wav', volume: 0.6 }, // description
  ...ticks(303, 5, 4),
  { at: 340, file: 'tap.wav', volume: 0.75 }, // «Продолжить»
  { at: 350, file: 'whoosh-soft.wav', volume: 0.4 }, // gift flies in
  // 04 · invite
  { at: 418, file: 'pop.wav', volume: 0.35 }, // gift lands in its slot
  { at: 426, file: 'avatar-1.wav', volume: 0.5 },
  { at: 438, file: 'avatar-2.wav', volume: 0.5 },
  { at: 450, file: 'avatar-3.wav', volume: 0.42 },
  { at: 464, file: 'tap.wav', volume: 0.75 }, // «Отправить в Telegram»
  { at: 470, file: 'whoosh.wav', volume: 0.45 }, // emerald opens
  // 05 · wishes
  { at: 487, file: 'pop.wav', volume: 0.55 },
  { at: 502, file: 'pop.wav', volume: 0.55 },
  { at: 517, file: 'pop.wav', volume: 0.55 },
  { at: 532, file: 'pop.wav', volume: 0.55 },
  { at: 547, file: 'pop.wav', volume: 0.55 },
  { at: 556, file: 'whoosh-soft.wav', volume: 0.4 }, // into the phone
  { at: 578, file: 'type.wav', volume: 0.4 }, // → wishlist
  { at: 592, file: 'sparkle.wav', volume: 0.5 }, // → Gift AI
  // 06 · reveal (600–615 is silence)
  { at: 640, file: 'breath-rise.wav', volume: 0.55 },
  { at: 684, file: 'reveal.wav', volume: 0.7 },
  // 07 · final
  { at: 742, file: 'whoosh-soft.wav', volume: 0.3 },
  { at: 760, file: 'final-chime.wav', volume: 0.65 },
]
export const MUSIC_VOLUME = 0.78

/** Teaser: [teaser start, source start, length] — the strongest moments of the main cut. */
export const teaserSegments: [number, number, number][] = [
  [0, 20, 90], // darkness → cane → sack → «Дарить — это магия.»
  [90, 125, 80], // Santomi + the real Home screen
  [170, 415, 60], // friends join
  [230, 620, 115], // the gift opens, recipient card
  [345, 760, 105], // brand end frame (static from teaser 415)
]
export const TEASER_XFADE = 8
