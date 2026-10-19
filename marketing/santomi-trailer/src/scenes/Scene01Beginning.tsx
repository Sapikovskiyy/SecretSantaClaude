import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { color } from '../config/brand'
import { easeIn, easeInOut, easeSoft, mix, progress } from '../animations/easing'
import { layer, type Camera } from '../animations/camera'
import { ContactShadow } from '../components/Art'
import { Motes, Vignette } from '../components/Atmosphere'
import { SackWithCane } from '../components/Stage'
import { Title } from '../components/Title'

/**
 * SCENE 01 — «Дарить — это магия.»  (global 0–120, rendered until 140 to hand off under the light sweep)
 * Darkness → warm key light slowly blooms → the polka-dot sack rises softly out of the dark →
 * a candy cane drops in from above and lands inside the sack (it falls between the back and front
 * layers of the app's Welcome composition) with a small, damped settle → title. Slow eased dolly-in.
 *  6–56 sack · 30–52 cane falls (gravity) · 52 impact · 52–74 settle · 62 title · 108–140 hand-off
 */
export const SCENE01_LENGTH = 140

export function Scene01Beginning() {
  const f = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()
  const portrait = H > W
  const u = Math.min(W, H)

  // camera: 1.00 → 1.06, eased at both ends, gentle vertical drift
  const t = progress(f, 0, SCENE01_LENGTH, easeInOut)
  const cam: Camera = { zoom: 1 + 0.06 * t, x: 0, y: -u * 0.012 * t }

  const light = progress(f, 0, 80, easeInOut)
  const sackIn = progress(f, 6, 46, easeSoft)
  const sackRise = progress(f, 6, 58, easeSoft)
  const out = progress(f, 108, 140, easeIn)

  // candy cane drop: gravity fall (t²), then a small damped settle — no cartoon bounce
  const LAND = 52
  const fall = progress(f, 30, LAND, (x) => x * x)
  const since = Math.max(0, f - LAND)
  const settle = f >= LAND ? Math.sin((since / 18) * Math.PI * 2) * Math.exp(-since / 6) : 0
  const squash = f >= LAND && f < LAND + 12 ? Math.sin((Math.PI * since) / 12) * Math.exp(-since / 8) : 0
  const caneIn = progress(f, 28, 32)

  // box = composition unit (sack is 1.35 × box wide)
  const box = portrait ? W * 0.62 : H * 0.5
  const compH = 0.227 * box + 1.35 * box
  const cx = portrait ? W / 2 : W * 0.68
  const bottom = portrait ? H * 0.97 : H * 1.02
  const floorY = bottom - compH * 0.06
  const dropFrom = -(bottom - compH) - box * 0.95 // starts fully above the frame
  const caneY = mix(dropFrom, 0, fall) - settle * box * 0.018
  const caneRot = mix(-16, 0, fall) + settle * 1.6

  return (
    <AbsoluteFill style={{ background: color.night, opacity: 1 - out * 0.85 }}>
      {/* key light + floor bounce */}
      <AbsoluteFill style={{ ...layer(cam, 0.3) }}>
        <AbsoluteFill style={{ opacity: light, background: `radial-gradient(70% 55% at ${portrait ? '38% 30%' : '62% 28%'}, rgba(176,94,52,0.55), rgba(90,44,24,0.25) 45%, rgba(18,10,7,0) 75%)` }} />
        <AbsoluteFill style={{ opacity: light * 0.9, background: `radial-gradient(45% 18% at ${(cx / W) * 100}% ${(floorY / H) * 100}%, rgba(255,170,110,0.22), rgba(0,0,0,0) 70%)` }} />
      </AbsoluteFill>

      <Motes opacity={light * 0.9 * (1 - out)} />

      <AbsoluteFill style={{ ...layer(cam, 1), transform: `${layer(cam, 1).transform} translateY(${(-out * u * 0.05).toFixed(1)}px)` }}>
        <div style={{ position: 'absolute', left: cx, top: floorY, transform: 'translate(-50%, -50%)', opacity: sackIn }}>
          <ContactShadow width={box * 1.05} opacity={0.6} />
        </div>
        <div style={{ position: 'absolute', left: cx - box / 2, top: bottom - compH, transform: `translateY(${((1 - sackRise) * u * 0.05).toFixed(1)}px) scale(${mix(0.97, 1, sackRise).toFixed(4)})`, transformOrigin: '50% 100%' }}>
          <SackWithCane box={box} caneIn={caneIn} sackIn={sackIn} caneY={caneY} caneRot={caneRot} squash={squash} />
        </div>
      </AbsoluteFill>

      {/* title */}
      <AbsoluteFill style={{ ...layer(cam, 0.55) }}>
        <div style={{ position: 'absolute', left: portrait ? 0 : W * 0.08, right: portrait ? 0 : undefined, top: portrait ? H * 0.12 : H * 0.36 }}>
          <Title lines={['Дарить —', 'это магия.']} at={62} outAt={104} align={portrait ? 'center' : 'left'} />
        </div>
      </AbsoluteFill>

      <Vignette strength={interpolate(light, [0, 1], [0.95, 0.65])} />
    </AbsoluteFill>
  )
}
