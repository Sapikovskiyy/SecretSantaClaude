import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { color, fontFamily } from '../config/brand'
import { easeIn, easeInOut, easeSoft, mix, progress } from '../animations/easing'
import { Motes, Vignette } from '../components/Atmosphere'
import { PhoneFrame } from '../components/PhoneFrame'
import { ScreenLayer, phoneGeom } from '../components/Stage'
import { Title } from '../components/Title'
import { telegramButtonPoint } from './Scene04Invite'

/**
 * SCENE 05 — «У каждого свои желания.»  global 480–615 (local 0–135).
 *  0–22   emerald circle opens from the Telegram button of scene 04
 *  7…67   five gift-category objects (CEO's high-res festive 3D renders, 637–720 px) appear one per beat
 *         (the pack's cat-* icons are 512 px sources and read soft at this size — not used here)
 *  76–96  they fly into the phone: real Interests screen → Wishlist (98) → Gift AI (112)
 *  120+   scene 06 turns the frame Christmas red
 */
export const SCENE05_START = 480
export const SCENE05_LENGTH = 145

const OBJECTS = [
  { art: 'book', label: 'Книги', at: 7 },
  { art: 'gamepad', label: 'Игры', at: 22 },
  { art: 'vinyl', label: 'Музыка', at: 37 },
  { art: 'headphones', label: 'Техника', at: 52 },
  { art: 'mug', label: 'Кофе', at: 67 },
]
// [x, y] centres as frame fractions; size as a fraction of the short side
const PORTRAIT = { pos: [[0.27, 0.43], [0.73, 0.41], [0.25, 0.62], [0.75, 0.6], [0.5, 0.79]], size: 0.27 }
const LANDSCAPE = { pos: [[0.52, 0.3], [0.7, 0.27], [0.88, 0.33], [0.6, 0.7], [0.8, 0.7]], size: 0.27 }

export function Scene05Wishes() {
  const f = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()
  const portrait = H > W
  const u = Math.min(W, H)
  const L = portrait ? PORTRAIT : LANDSCAPE

  const origin = telegramButtonPoint(W, H)
  const open = progress(f, 0, 22, easeInOut)
  const radius = open * Math.hypot(W, H) * 1.05

  const toPhone = progress(f, 76, 96, easeIn)
  const g = phoneGeom(W, H, portrait ? { width: W * 0.56, top: H * 0.25 } : { width: H * 0.4, x: W * 0.6 })
  const phoneIn = progress(f, 80, 100, easeSoft)
  const pcx = g.x + g.phoneW / 2
  const pcy = g.top + g.phoneH * 0.42

  // in-phone screen sequence: interests → wishlist → gift AI (slides)
  const s1 = progress(f, 98, 106, easeInOut)
  const s2 = progress(f, 112, 120, easeInOut)
  const sw = g.screenW

  return (
    <AbsoluteFill style={{ clipPath: open < 1 ? `circle(${radius.toFixed(1)}px at ${origin.x.toFixed(1)}px ${origin.y.toFixed(1)}px)` : undefined }}>
      <AbsoluteFill style={{ background: `radial-gradient(${portrait ? '85% 60%' : '60% 85%'} at ${portrait ? '50% 52%' : '62% 50%'}, #0e7d4e 0%, ${color.pineDeep} 52%, #022a1b 100%)` }} />
      <Motes opacity={0.55} tint="190,255,215" />

      {OBJECTS.map((o, i) => {
        const p = progress(f, o.at, o.at + 16, easeSoft)
        if (p <= 0) return null
        const [fx, fy] = L.pos[i]
        const size = L.size * u
        const bob = Math.sin((f + i * 17) / 22) * u * 0.006
        const cx = mix(fx * W, pcx, toPhone)
        const cy = mix(fy * H + (1 - p) * u * 0.05 + bob, pcy, toPhone)
        const s = mix(0.72 + 0.28 * p, 0.25, toPhone)
        return (
          <div key={o.art} style={{ position: 'absolute', left: cx - size / 2, top: cy - size / 2, width: size, opacity: p * (1 - toPhone), transform: `scale(${s.toFixed(4)})` }}>
            <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Img src={staticFile(`assets/3d/${o.art}.webp`)} style={{ maxWidth: '86%', maxHeight: '86%', filter: 'drop-shadow(0 18px 22px rgba(0,30,15,0.45))' }} />
            </div>
            <div style={{ fontFamily, textAlign: 'center', color: color.snow, opacity: 0.88, fontSize: u * 0.036, fontWeight: 500, letterSpacing: '-0.01em', marginTop: -u * 0.004 }}>{o.label}</div>
          </div>
        )
      })}

      {phoneIn > 0 && (
        <div style={{ position: 'absolute', left: g.x, top: g.top + (1 - phoneIn) * u * 0.06, opacity: phoneIn, transform: `scale(${mix(0.94, 1, phoneIn).toFixed(4)})`, transformOrigin: '50% 40%' }}>
          <PhoneFrame width={g.phoneW}>
            <ScreenLayer screen="interests" x={-s1 * sw} />
            <ScreenLayer screen="wishlist" x={(1 - s1) * sw - s2 * sw} />
            <ScreenLayer screen="gift-ai" x={(1 - s2) * sw} />
          </PhoneFrame>
        </div>
      )}

      <div style={{ position: 'absolute', left: portrait ? 0 : W * 0.08, right: portrait ? 0 : undefined, top: portrait ? H * 0.085 : H * 0.36 }}>
        <Title lines={portrait ? ['У каждого', 'свои желания.'] : ['У каждого', 'свои желания.']} at={10} outAt={portrait ? 76 : undefined} size={portrait ? 0.1 : 0.1} align={portrait ? 'center' : 'left'} />
      </div>
      <Vignette strength={0.5} />
    </AbsoluteFill>
  )
}
