import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { color } from '../config/brand'
import { easeCamera, easeInOut, easeSoft, mix, progress } from '../animations/easing'
import { Motes, Vignette } from '../components/Atmosphere'
import { PhoneFrame } from '../components/PhoneFrame'
import { ChocolateBg, phoneGeom } from '../components/Stage'
import { Title } from '../components/Title'

/**
 * SCENE 07 — final brand frame.  global 750–900 (local 0–150).
 *  0–22   the warm light of scene 06 settles into the chocolate brand background
 *  10     «Santomi» · 35 «Удивлять проще, чем кажется.» · 55 «Скоро в Telegram» (CEO confirmed: not launched yet)
 *  80–150 everything holds perfectly still — 2.3 s of clean, readable end frame
 */
export const SCENE07_START = 750
export const SCENE07_LENGTH = 150
const HOLD = 80

const PROPS = {
  portrait: [
    { art: 'star', x: 0.13, y: 0.47, w: 0.15, depth: 0.6, at: 6 },
    { art: 'bauble', x: 0.87, y: 0.5, w: 0.14, depth: 0.8, at: 10 },
    { art: 'snow-globe', x: 0.15, y: 0.77, w: 0.24, depth: 1.2, at: 14 },
    { art: 'gift-green', x: 0.85, y: 0.79, w: 0.22, depth: 1.1, at: 18 },
  ],
  landscape: [
    { art: 'star', x: 0.53, y: 0.24, w: 0.12, depth: 0.6, at: 6 },
    { art: 'bauble', x: 0.93, y: 0.3, w: 0.11, depth: 0.8, at: 10 },
    { art: 'snow-globe', x: 0.5, y: 0.78, w: 0.19, depth: 1.2, at: 14 },
    { art: 'gift-green', x: 0.91, y: 0.8, w: 0.17, depth: 1.1, at: 18 },
  ],
}

export function Scene07Final() {
  const live = useCurrentFrame()
  const f = Math.min(live, HOLD) // nothing moves after HOLD
  const { width: W, height: H } = useVideoConfig()
  const portrait = H > W
  const u = Math.min(W, H)

  const clear = progress(live, 0, 30, easeInOut)
  const dolly = progress(f, 0, HOLD, easeCamera)
  const zoom = mix(1.05, 1, dolly)
  const settle = 1 - progress(f, HOLD - 12, HOLD) // floats ease to rest

  const g = phoneGeom(W, H, portrait ? { width: W * 0.4, top: H * 0.39 } : { width: H * 0.36, x: W * 0.64, top: H * 0.1 })
  const phoneIn = progress(f, 4, 34, easeSoft)
  const float = Math.sin(f / 26) * u * 0.005 * settle

  return (
    // short crossfade over scene 06 (both carry the same warm flood level at the hand-off)
    <AbsoluteFill style={{ opacity: progress(live, 0, 8) }}>
      <ChocolateBg portrait={portrait} focusY={portrait ? 0.62 : 0.5} />
      <Motes opacity={0.6} frame={f} />

      <AbsoluteFill style={{ transform: `scale(${zoom.toFixed(4)})`, transformOrigin: '50% 55%' }}>
        {/* soft halo + phone with the real Home screen */}
        <AbsoluteFill style={{ background: `radial-gradient(${portrait ? '45% 26%' : '24% 42%'} at ${(((g.x + g.phoneW / 2) / W) * 100).toFixed(1)}% ${(((g.top + g.phoneH * 0.45) / H) * 100).toFixed(1)}%, rgba(217,54,36,0.2), rgba(217,54,36,0) 70%)`, opacity: phoneIn }} />
        <div style={{ position: 'absolute', left: g.x + g.phoneW * 0.1, width: g.phoneW * 0.8, top: g.top + g.phoneH - g.phoneW * 0.03, height: g.phoneW * 0.15, borderRadius: '50%', opacity: phoneIn * 0.8, background: 'radial-gradient(closest-side, rgba(0,0,0,0.6), rgba(0,0,0,0))' }} />
        <div style={{ position: 'absolute', left: g.x, top: g.top + (1 - phoneIn) * u * 0.08 + float, opacity: phoneIn }}>
          <PhoneFrame width={g.phoneW} screen="home" glare={0.6} />
        </div>

        {(portrait ? PROPS.portrait : PROPS.landscape).map((p, i) => {
          const a = progress(f, p.at, p.at + 22, easeSoft)
          const w = p.w * u
          const bob = Math.sin((f + i * 23) / (24 + i * 3)) * u * 0.008 * p.depth * settle
          return (
            <Img
              key={p.art}
              src={staticFile(`assets/3d/${p.art}.webp`)}
              style={{ position: 'absolute', left: p.x * W - w / 2, top: p.y * H - w / 2 + bob + (1 - a) * u * 0.04, width: w, opacity: a, filter: 'drop-shadow(0 16px 20px rgba(0,0,0,0.45))' }}
            />
          )
        })}

        {/* typography */}
        <div style={{ position: 'absolute', left: portrait ? 0 : W * 0.08, right: portrait ? 0 : undefined, top: portrait ? H * 0.1 : H * 0.3 }}>
          <Title lines={['Santomi']} at={10} size={portrait ? 0.17 : 0.15} align={portrait ? 'center' : 'left'} />
          <div style={{ height: u * 0.025 }} />
          <Title lines={['Удивлять проще,', 'чем кажется.']} at={35} size={portrait ? 0.072 : 0.068} weight={550} color={color.marzipan} stagger={3} align={portrait ? 'center' : 'left'} />
          {!portrait && (
            <div style={{ marginTop: u * 0.06 }}>
              <Title lines={['Скоро в Telegram']} at={55} size={0.04} weight={500} color={color.taupeSoft} stagger={3} align="left" style={{ letterSpacing: '0' }} />
            </div>
          )}
        </div>
        {portrait && (
          <div style={{ position: 'absolute', left: 0, right: 0, top: H * 0.905 }}>
            <Title lines={['Скоро в Telegram']} at={55} size={0.046} weight={500} color={color.taupeSoft} stagger={3} style={{ letterSpacing: '0' }} />
          </div>
        )}
      </AbsoluteFill>
      <Vignette strength={0.5} />
      {clear < 1 && <AbsoluteFill style={{ opacity: (1 - clear) * 0.8, background: '#fff1e3' }} />}
    </AbsoluteFill>
  )
}
