import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { color, fontFamily } from '../config/brand'
import { easeCamera, easeInOut, easeSoft, mix, progress } from '../animations/easing'
import { Motes, Vignette } from '../components/Atmosphere'
import { LightSweep, sweepReveal } from '../components/LightSweep'
import { PhoneFrame, SCREEN_ASPECT, TouchRing } from '../components/PhoneFrame'
import { Title } from '../components/Title'

/**
 * SCENE 02 — «Santomi · Тайный Санта в Telegram» + the real Home screen.
 * Sequence starts at global 105 (local 0) so the light sweep covers the hand-off from scene 01.
 *  local 0–34   light sweep, scene revealed behind the band, wordmark appears in its wake
 *  local 45–95  wordmark rises, floating phone with the real Home screen enters
 *  local 104–135 gentle push towards «+» (create game), tap at local 123 (global 228); scene 03 crossfades in
 */
export const SCENE02_START = 105
export const SCENE02_LENGTH = 135
/** Scene 02 ends with a gentle push; scene 03 picks up exactly this zoom. */
export const PUSH_ZOOM = 1.12

// «+» button on the captured Home screen (fraction of the screen) — measured on home.png (1170×2532)
const PLUS = { x: 1028 / 1170, y: 232 / 2532 }

export function Scene02Intro() {
  const f = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()
  const portrait = H > W
  const u = Math.min(W, H)

  const sweep = progress(f, 0, 34, easeInOut)

  // wordmark: centred → top
  const rise = progress(f, 45, 95, easeCamera)
  const phoneIn = progress(f, 52, 100, easeSoft)
  const push = progress(f, 104, 135, easeInOut)

  // phone geometry
  const phoneW = portrait ? W * 0.6 : H * 0.42
  const phoneH = phoneW * 0.944 * SCREEN_ASPECT + phoneW * 0.056
  const phoneX = portrait ? (W - phoneW) / 2 : W * 0.62
  const phoneTopRest = portrait ? H * 0.245 : (H - phoneH) / 2 + H * 0.02
  const float = Math.sin(f / 26) * u * 0.006
  const phoneY = mix(H * 1.05, phoneTopRest, phoneIn) + float * phoneIn
  const tilt = mix(-4, -1.2, phoneIn) + push * 1.2 // ends at 0°

  // push-in towards «+»: zoom around the button
  const screenX = phoneX + phoneW * 0.028 + PLUS.x * phoneW * 0.944
  const screenY = phoneY + phoneW * 0.028 + PLUS.y * phoneW * 0.944 * SCREEN_ASPECT
  const zoom = 1 + push * (PUSH_ZOOM - 1)

  // wordmark layout
  const markCenterY = portrait ? mix(H * 0.42, H * 0.115, rise) : mix(H * 0.42, H * 0.36, rise)
  const markX = portrait ? 0 : mix(0, -W * 0.18, rise)
  const markScale = portrait ? mix(1, 0.68, rise) : mix(1, 0.85, rise)

  const tap = interpolate(f, [123, 141], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ ...sweepReveal(sweep) }}>
        <AbsoluteFill style={{ background: `radial-gradient(90% 60% at 50% ${portrait ? '58%' : '50%'}, #4a2a1c 0%, ${color.bark} 45%, ${color.night} 100%)` }} />
        <AbsoluteFill style={{ transformOrigin: `${screenX}px ${screenY}px`, transform: `scale(${zoom.toFixed(4)})` }}>
          {/* warm halo behind the phone */}
          <AbsoluteFill style={{ opacity: phoneIn, background: `radial-gradient(${portrait ? '55% 32%' : '30% 50%'} at ${((phoneX + phoneW / 2) / W * 100).toFixed(1)}% ${((phoneTopRest + phoneH * 0.45) / H * 100).toFixed(1)}%, rgba(217,54,36,0.22), rgba(217,54,36,0) 70%)` }} />
          <Motes opacity={0.7} />

          {/* wordmark + subtitle */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: markCenterY, transform: `translate(${markX}px, -50%) scale(${markScale})`, transformOrigin: '50% 50%', opacity: 1 - Math.min(1, push * 2.2) }}>
            <Title lines={['Santomi']} at={12} size={0.15} />
            <div style={{ height: u * 0.02 }} />
            <Title lines={['Тайный Санта в Telegram']} at={24} size={0.05} weight={500} color={color.marzipan} stagger={3} style={{ letterSpacing: '-0.01em', opacity: 0.9 }} />
          </div>

          {/* contact shadow */}
          <div style={{ position: 'absolute', left: phoneX + phoneW * 0.1, width: phoneW * 0.8, top: phoneTopRest + phoneH - phoneW * 0.02, height: phoneW * 0.14, borderRadius: '50%', opacity: phoneIn * 0.8, background: 'radial-gradient(closest-side, rgba(0,0,0,0.6), rgba(0,0,0,0))', transform: `scale(${(1 - float / u * 4).toFixed(3)})` }} />

          {/* floating phone with the real Home screen */}
          <div style={{ position: 'absolute', left: phoneX, top: phoneY, transform: `rotate(${tilt.toFixed(3)}deg)`, transformOrigin: '50% 60%' }}>
            <PhoneFrame width={phoneW} screen="home" glare={0.4 + 0.6 * Math.sin(f / 60) ** 2}>
              <TouchRing x={PLUS.x * phoneW * 0.944} y={PLUS.y * phoneW * 0.944 * SCREEN_ASPECT} size={phoneW * 0.2} p={tap} />
            </PhoneFrame>
          </div>
        </AbsoluteFill>
        <Vignette strength={0.55} />
      </AbsoluteFill>
      <LightSweep p={sweep} />
      {/* keep an invisible font probe so the bundle never lacks the family */}
      <span style={{ position: 'absolute', opacity: 0, fontFamily }}>.</span>
    </AbsoluteFill>
  )
}
