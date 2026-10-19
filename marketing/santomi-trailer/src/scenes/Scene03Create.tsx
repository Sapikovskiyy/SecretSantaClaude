import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { easeCamera, easeIn, easeInOut, mix, progress } from '../animations/easing'
import { Motes, Vignette } from '../components/Atmosphere'
import { PhoneFrame, TouchRing } from '../components/PhoneFrame'
import { ChocolateBg, Region, ScreenLayer, phoneGeom, ui } from '../components/Stage'
import { Title } from '../components/Title'
import { PUSH_ZOOM, SCENE02_LENGTH } from './Scene02Intro'

/**
 * SCENE 03 — «Создай свою игру.»  global 240–375 (local 0–135).
 *  0–6    crossfade in over scene 02's last frame (identical phone, same zoom)
 *  0–16   the real «Создадим игру!» screen opens out of the «+» button
 *  6–30   camera settles; title enters
 *  18/56  taps on «Название игры» / «Описание», real typed states revealed letter-band by letter-band
 *  50–100 camera follows the form down to «Продолжить» (tap at 100)
 *  108–135 phone recedes out of focus while the gift (scene 04) flies in
 */
export const SCENE03_START = 240
export const SCENE03_LENGTH = 135

export function Scene03Create() {
  const f = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()
  const portrait = H > W
  const u = Math.min(W, H)
  const g = phoneGeom(W, H)

  // continuity with scene 02 (its float sine keeps running)
  const f02 = f + SCENE02_LENGTH
  const float = Math.sin(f02 / 26) * u * 0.006
  const top = g.top + float
  const plus = ui.home.plus
  const plusX = g.fx(plus.x + plus.w / 2)
  const plusY = top - g.top + g.fy(plus.y + plus.h / 2)

  const fadeIn = progress(f, 0, 6)
  const open = progress(f, 0, 16, easeInOut)
  const settle = progress(f, 6, 30, easeCamera)
  const zoom = mix(PUSH_ZOOM, 1, settle)

  // camera follow: name → description → budget/date → continue
  const follow = progress(f, 50, 100, easeInOut)
  const followY = -follow * g.phoneH * (portrait ? 0.1 : 0.08)

  const nameTyping = progress(f, 24, 52, (t) => t)
  const descTyping = progress(f, 62, 88, (t) => t)

  const exit = progress(f, 106, 135, easeIn)
  const exitScale = 1 - exit * 0.1
  const blur = exit * u * 0.01

  const row = (b: { x: number; y: number; w: number; h: number }) => ({ x: b.x - 4, y: b.y - 8, w: b.w + 8, h: b.h + 16 })
  const centre = (b: { x: number; y: number; w: number; h: number }) => ({ x: (b.x + b.w / 2) * g.k, y: (b.y + b.h / 2) * g.k })
  const ring = (at: number) => progress(f, at, at + 18, (t) => t)
  const c = ui.create
  const nameC = centre(c.name)
  const descC = centre(c.description)
  const contC = centre(c.continue)

  // the circle that opens the create screen from «+»
  const r = open * Math.hypot(g.screenW, g.screenH) * 1.05
  const px = plusX - g.fx(0)
  const py = plusY - (top - g.top) - g.fy(0)

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <ChocolateBg portrait={portrait} />
      <Motes opacity={0.7 * (1 - exit)} />

      <AbsoluteFill style={{ transformOrigin: `${plusX}px ${plusY}px`, transform: `scale(${zoom.toFixed(4)})` }}>
        <div
          style={{
            position: 'absolute',
            left: g.x,
            top,
            transformOrigin: '50% 40%',
            transform: `translateY(${followY.toFixed(1)}px) scale(${exitScale.toFixed(4)})`,
            filter: blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : undefined,
            opacity: 1 - exit * 0.75,
          }}
        >
          <PhoneFrame width={g.phoneW} screen="home" glare={0.4 + 0.6 * Math.sin(f02 / 60) ** 2}>
            <div style={{ position: 'absolute', inset: 0, clipPath: open < 1 ? `circle(${r.toFixed(1)}px at ${px.toFixed(1)}px ${py.toFixed(1)}px)` : undefined }}>
              <ScreenLayer screen="create-0" />
              <Region screen="create-1" k={g.k} box={row(c.name)} reveal={nameTyping} />
              <Region screen="create-2" k={g.k} box={row(c.description)} reveal={descTyping} />
            </div>
            <TouchRing x={nameC.x} y={nameC.y} size={g.phoneW * 0.2} p={ring(18)} />
            <TouchRing x={descC.x} y={descC.y} size={g.phoneW * 0.2} p={ring(56)} />
            <TouchRing x={contC.x} y={contC.y} size={g.phoneW * 0.22} p={ring(100)} />
          </PhoneFrame>
        </div>
      </AbsoluteFill>

      <div style={{ position: 'absolute', left: portrait ? 0 : W * 0.08, right: portrait ? 0 : undefined, top: portrait ? H * 0.085 : H * 0.38 }}>
        <Title lines={portrait ? ['Создай свою игру.'] : ['Создай', 'свою игру.']} at={8} outAt={104} size={portrait ? 0.088 : 0.11} align={portrait ? 'center' : 'left'} />
      </div>
      <Vignette strength={0.55} />
    </AbsoluteFill>
  )
}
