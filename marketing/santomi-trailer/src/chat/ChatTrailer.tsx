import type { CSSProperties } from 'react'
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import chatLayout from '../../public/assets/chat/chat-layout.json'
import { color } from '../config/brand'
import { MUSIC_VOLUME } from '../config/timeline'
import { easeInOut, easeSoft, mix, progress } from '../animations/easing'
import { Motes, Vignette } from '../components/Atmosphere'
import { LightSweep, sweepReveal } from '../components/LightSweep'
import { PhoneFrame, TouchRing } from '../components/PhoneFrame'
import { CSS_H, CSS_W, ChocolateBg, ScreenLayer, phoneGeom } from '../components/Stage'
import { Title } from '../components/Title'

/**
 * Feature trailer — anonymous chat with the Secret Santa. 15 s @30 fps (450 frames), 9:16 and 16:9.
 * Only real captured chat states (public/assets/chat, scripts/capture-chat.spec.ts); safe demo messages.
 *
 *   0–200   «Спроси о мечтах.»     the sealed envelope flies into the empty chat (Santa's side), the Santa asks,
 *                                 «печатает…», the recipient answers
 *   200–330 «…и останься тайной.»  the other side: the recipient sees only «Твой Тайный Санта»; anonymity note glows;
 *                                 quick reply, the Santa answers
 *   330–450 brand frame            «Santomi · Анонимный чат с Тайным Сантой · Скоро в Telegram», static from 400
 */
export const CHAT_FRAMES = 450

type Box = { x: number; y: number; w: number; h: number }
const L = chatLayout as { lastBubble: Record<string, Box | null>; ui: Record<string, Box> }
const ENVELOPE_ASPECT = 591 / 720 // h / w of envelope.webp

/** A real chat state appearing: full-screen crossfade, except the new bubble, which rises into place. */
function State({ screen, at, k, bubble, f }: { screen: string; at: number; k: number; bubble?: Box | null; f: number }) {
  if (f < at) return null
  const p = progress(f, at, at + 6)
  const rise = progress(f, at, at + 8, easeSoft)
  const sw = CSS_W * k
  const sh = CSS_H * k
  if (!bubble) return <ScreenLayer dir="chat" screen={screen} opacity={p} />
  const b = { x: bubble.x * k, y: bubble.y * k, w: bubble.w * k, h: bubble.h * k }
  // everything but the bubble crossfades; the bubble itself rises 12 px and fades in (the app's new-message motion)
  const hole = `path(evenodd, 'M0 0 H${sw} V${sh} H0 Z M${b.x} ${b.y} H${b.x + b.w} V${b.y + b.h} H${b.x} Z')`
  const bubbleStyle: CSSProperties = { position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, overflow: 'hidden', opacity: rise, transform: `translateY(${((1 - rise) * 12 * k).toFixed(2)}px)` }
  return (
    <>
      <ScreenLayer dir="chat" screen={screen} opacity={p} style={{ clipPath: hole }} />
      <div style={bubbleStyle}>
        <Img src={staticFile(`assets/chat/${screen}.png`)} style={{ position: 'absolute', left: -b.x, top: -b.y, width: sw, height: sh, maxWidth: 'none' }} />
      </div>
    </>
  )
}

/** «печатает…»: cycles the three captured dot phases (real UI frames). */
function Typing({ prefix, from, to, f }: { prefix: string; from: number; to: number; f: number }) {
  if (f < from || f >= to) return null
  const phase = ['a', 'b', 'c'][Math.floor((f - from) / 5) % 3]
  return <ScreenLayer dir="chat" screen={`${prefix}-typing-${phase}`} />
}

function Ring({ box, k, at, f, size }: { box: Box; k: number; at: number; f: number; size: number }) {
  return <TouchRing x={(box.x + box.w / 2) * k} y={(box.y + box.h / 2) * k} size={size} p={progress(f, at, at + 18, (t) => t)} />
}

export function ChatTrailerPicture() {
  const f = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()
  const portrait = H > W
  const u = Math.min(W, H)
  const g = phoneGeom(W, H)

  // ---------- part A: the Santa asks ----------
  const envIn = progress(f, 0, 20, easeSoft)
  const toSlot = progress(f, 36, 64, easeInOut)
  const phoneA = progress(f, 32, 62, easeSoft)
  const envOut = progress(f, 92, 98)
  const slot = L.ui['santa.envelope']
  const slotW = slot.w * g.k
  const heroW = portrait ? W * 0.5 : H * 0.42
  const swapA = progress(f, 198, 222, easeInOut) // phone A leaves, phone B arrives
  const shiftA = -swapA * W * 0.95
  const phoneATop = mix(H * 1.02, g.top, phoneA)
  const ex = mix(portrait ? W / 2 : W * 0.66, g.fx(slot.x + slot.w / 2), toSlot) + shiftA
  const ey = mix(H * 0.5 + (1 - envIn) * H * 0.06, g.fy(slot.y + slot.h / 2) + (phoneATop - g.top), toSlot)
  const ew = mix(heroW, slotW, toSlot) * mix(1.3, 1, envIn)
  const envTurn = mix(-6, 2, progress(f, 0, 40, easeInOut)) * (1 - toSlot) + Math.sin(f / 18) * 1.5 * (1 - toSlot)
  const envBlur = (1 - envIn) * u * 0.012
  const zoomA = 1 + 0.04 * progress(f, 64, 196, easeInOut)

  // ---------- part B: the other side ----------
  const shiftB = (1 - swapA) * W * 0.95
  const glow = progress(f, 222, 236, easeSoft) * (1 - progress(f, 256, 276, easeInOut))

  // ---------- part C: brand ----------
  const sweep = progress(f, 322, 352, easeInOut)
  const brandF = Math.min(f, 400) // nothing moves after 400
  const gEnd = phoneGeom(W, H, portrait ? { width: W * 0.4, top: H * 0.4 } : { width: H * 0.36, x: W * 0.64, top: H * 0.1 })
  const endIn = progress(brandF, 334, 362, easeSoft)

  const note = L.ui['rec.note']

  return (
    <AbsoluteFill style={{ background: color.night }}>
      <ChocolateBg portrait={portrait} />
      <Motes opacity={0.65} frame={brandF} />

      {/* phone A — Santa's side */}
      {swapA < 1 && (
        <div style={{ position: 'absolute', left: g.x + shiftA, top: phoneATop, opacity: phoneA, transform: `scale(${zoomA.toFixed(4)})`, transformOrigin: '50% 45%' }}>
          <PhoneFrame width={g.phoneW}>
            <ScreenLayer dir="chat" screen="santa-0-empty" />
            {/* the app's own contact shadow stays on the capture; only the envelope itself flies in */}
            <State screen="santa-1" at={92} k={g.k} bubble={L.lastBubble['santa-1']} f={f} />
            <State screen="santa-2" at={104} k={g.k} f={f} />
            <Typing prefix="santa" from={116} to={150} f={f} />
            <State screen="santa-3" at={150} k={g.k} bubble={L.lastBubble['santa-3']} f={f} />
            <Ring box={L.ui['santa.suggestion']} k={g.k} at={88} f={f} size={g.phoneW * 0.24} />
          </PhoneFrame>
        </div>
      )}

      {/* the sealed envelope (the chat's own empty-state art) flies into its slot */}
      {envOut < 1 && (
        <div style={{ position: 'absolute', left: ex - ew / 2, top: ey - (ew * ENVELOPE_ASPECT) / 2, width: ew, opacity: envIn * (1 - envOut), transform: `rotate(${envTurn.toFixed(2)}deg)`, filter: envBlur > 0.3 ? `blur(${envBlur.toFixed(1)}px)` : undefined }}>
          <Img src={staticFile('assets/3d/envelope.webp')} style={{ width: '100%', display: 'block' }} />
        </div>
      )}

      {/* phone B — the recipient's side: the Santa stays «Твой Тайный Санта» */}
      {swapA > 0 && sweep < 1 && (
        <div style={{ position: 'absolute', left: g.x + shiftB, top: g.top }}>
          <PhoneFrame width={g.phoneW}>
            <ScreenLayer dir="chat" screen="rec-0" />
            {glow > 0 && (
              <div style={{ position: 'absolute', left: (note.x - 3) * g.k, top: (note.y - 3) * g.k, width: (note.w + 6) * g.k, height: (note.h + 6) * g.k, borderRadius: 22 * g.k, opacity: glow, boxShadow: `0 0 0 ${(1.5 * g.k).toFixed(1)}px rgba(201,155,97,0.95), 0 0 ${(26 * g.k).toFixed(0)}px rgba(201,155,97,0.55)` }} />
            )}
            <State screen="rec-1" at={243} k={g.k} bubble={L.lastBubble['rec-1']} f={f} />
            <State screen="rec-2" at={254} k={g.k} f={f} />
            <Typing prefix="rec" from={262} to={294} f={f} />
            <State screen="rec-3" at={294} k={g.k} bubble={L.lastBubble['rec-3']} f={f} />
            <Ring box={L.ui['rec.suggestion']} k={g.k} at={238} f={f} size={g.phoneW * 0.24} />
          </PhoneFrame>
        </div>
      )}

      {/* titles */}
      <div style={{ position: 'absolute', left: portrait ? 0 : W * 0.08, right: portrait ? 0 : undefined, top: portrait ? H * 0.085 : H * 0.38 }}>
        <Title lines={portrait ? ['Спроси о мечтах.'] : ['Спроси', 'о мечтах.']} at={12} outAt={194} size={portrait ? 0.088 : 0.11} align={portrait ? 'center' : 'left'} />
      </div>
      <div style={{ position: 'absolute', left: portrait ? 0 : W * 0.08, right: portrait ? 0 : undefined, top: portrait ? H * 0.085 : H * 0.38 }}>
        <Title lines={portrait ? ['…и останься тайной.'] : ['…и останься', 'тайной.']} at={212} outAt={320} size={portrait ? 0.088 : 0.11} align={portrait ? 'center' : 'left'} />
      </div>
      <Vignette strength={0.55} />

      {/* brand frame, revealed behind the light sweep */}
      {sweep > 0 && (
        <AbsoluteFill style={{ ...sweepReveal(sweep) }}>
          <ChocolateBg portrait={portrait} focusY={portrait ? 0.62 : 0.5} />
          <Motes opacity={0.6} frame={brandF} />
          <div style={{ position: 'absolute', left: gEnd.x, top: gEnd.top + (1 - endIn) * u * 0.06, opacity: endIn }}>
            <PhoneFrame width={gEnd.phoneW} glare={0.6}>
              <ScreenLayer dir="chat" screen="santa-3" />
            </PhoneFrame>
          </div>
          {(portrait
            ? [
                { art: 'envelope', x: 0.15, y: 0.6, w: 0.22, at: 338 },
                { art: 'star', x: 0.87, y: 0.48, w: 0.13, at: 342 },
                { art: 'gift-green', x: 0.85, y: 0.8, w: 0.2, at: 346 },
              ]
            : [
                { art: 'envelope', x: 0.5, y: 0.76, w: 0.2, at: 338 },
                { art: 'star', x: 0.53, y: 0.24, w: 0.12, at: 342 },
                { art: 'gift-green', x: 0.91, y: 0.8, w: 0.17, at: 346 },
              ]
          ).map((p, i) => {
            const a = progress(brandF, p.at, p.at + 22, easeSoft)
            const w = p.w * u
            const bob = Math.sin((brandF + i * 23) / 24) * u * 0.007 * (1 - progress(brandF, 388, 400))
            return <Img key={p.art} src={staticFile(`assets/3d/${p.art}.webp`)} style={{ position: 'absolute', left: p.x * W - w / 2, top: p.y * H - w / 2 + bob + (1 - a) * u * 0.04, width: w, opacity: a, filter: 'drop-shadow(0 16px 20px rgba(0,0,0,0.45))' }} />
          })}
          <div style={{ position: 'absolute', left: portrait ? 0 : W * 0.08, right: portrait ? 0 : undefined, top: portrait ? H * 0.1 : H * 0.3 }}>
            <Title lines={['Santomi']} at={340} size={portrait ? 0.17 : 0.15} align={portrait ? 'center' : 'left'} />
            <div style={{ height: u * 0.025 }} />
            <Title lines={['Анонимный чат', 'с Тайным Сантой']} at={358} size={portrait ? 0.072 : 0.066} weight={550} color={color.marzipan} stagger={3} align={portrait ? 'center' : 'left'} />
            {!portrait && (
              <div style={{ marginTop: u * 0.06 }}>
                <Title lines={['Скоро в Telegram']} at={376} size={0.04} weight={500} color={color.taupeSoft} stagger={3} align="left" style={{ letterSpacing: '0' }} />
              </div>
            )}
          </div>
          {portrait && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: H * 0.905 }}>
              <Title lines={['Скоро в Telegram']} at={376} size={0.046} weight={500} color={color.taupeSoft} stagger={3} style={{ letterSpacing: '0' }} />
            </div>
          )}
          <Vignette strength={0.5} />
        </AbsoluteFill>
      )}
      <LightSweep p={sweep} />
    </AbsoluteFill>
  )
}

const CUES: [number, string, number][] = [
  [12, 'chime.wav', 0.55], // «Спроси о мечтах.»
  [30, 'whoosh-soft.wav', 0.3], // envelope flies
  [62, 'pop.wav', 0.35], // envelope lands in the empty chat
  [88, 'tap.wav', 0.7], // suggestion tapped
  [92, 'avatar-1.wav', 0.42], // message sent
  [116, 'type.wav', 0.3], // «печатает…»
  [150, 'avatar-3.wav', 0.45], // reply arrives
  [198, 'whoosh.wav', 0.5], // to the other side
  [222, 'sparkle.wav', 0.42], // anonymity note glows
  [238, 'tap.wav', 0.7], // quick reply tapped
  [243, 'avatar-2.wav', 0.42], // sent
  [262, 'type.wav', 0.3],
  [294, 'avatar-4.wav', 0.45], // the Santa answers
  [322, 'whoosh.wav', 0.5], // light sweep to the brand frame
  [340, 'final-chime.wav', 0.6], // «Santomi»
]

export function ChatTrailer() {
  return (
    <AbsoluteFill>
      <ChatTrailerPicture />
      <Audio src={staticFile('audio/music-chat.wav')} volume={MUSIC_VOLUME} />
      {CUES.map(([at, file, volume], i) => (
        <Sequence key={i} from={at} layout="none" name={`sfx ${file}`}>
          <Audio src={staticFile(`audio/${file}`)} volume={volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}
