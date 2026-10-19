import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { easeCamera, easeInOut, easeSoft, mix, progress } from '../animations/easing'
import { Vignette } from '../components/Atmosphere'
import { GiftBox } from '../components/Stage'
import { Title } from '../components/Title'

/**
 * SCENE 06 — «Но главный сюрприз... / ...ещё впереди.»  global 600–765 (local 0–165). The emotional peak.
 *  0–18   Christmas red opens from the centre; music drops to silence (600–615)
 *  15     «Но главный сюрприз...»
 *  40–85  warm light grows inside the box, one restrained tremble (66–84)
 *  85     the lid lifts away (real CEO renders: box + lid), soft warm flash — no confetti
 *  92–122 the real recipient card (cut from the Reveal screen capture) rises out of the light
 *  104    «...ещё впереди.»
 *  140–165 warm light floods the frame → scene 07
 */
export const SCENE06_START = 600
export const SCENE06_LENGTH = 165

const CARD_ASPECT = 1008 / 898 // card-cutout.png

export function Scene06Reveal() {
  const f = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()
  const portrait = H > W
  const u = Math.min(W, H)

  const open = progress(f, 0, 24, easeInOut)
  const radius = open * Math.hypot(W, H) * 0.62

  const boxIn = progress(f, 4, 24, easeSoft)
  const glow = progress(f, 40, 85, (t) => t * t) * 0.65 + progress(f, 85, 92) * 0.35 - progress(f, 110, 140) * 0.5
  const tremble = f >= 66 && f < 85 ? Math.sin(f * 2.3) * u * 0.0016 : 0
  const lid = progress(f, 85, 104, easeSoft)
  const flash = progress(f, 85, 89) * (1 - progress(f, 89, 114, easeSoft))
  const card = progress(f, 92, 124, easeSoft)
  const push = progress(f, 85, 165, easeCamera)
  const flood = progress(f, 132, 150, easeInOut) // reaches 0.8 exactly at scene 07's first frame

  const boxW = portrait ? W * 0.5 : H * 0.42
  const boxCx = portrait ? W / 2 : W * 0.64
  const boxBottom = portrait ? H * 0.74 : H * 0.86
  const boxDrop = card * u * 0.05
  const boxH = 0.7837 * boxW + 0.3937 * boxW
  const rimY = boxBottom - 0.7837 * boxW

  const cardW = portrait ? W * 0.62 : H * 0.48
  const cardH = cardW * CARD_ASPECT
  const cardCy = mix(rimY + cardH * 0.1, portrait ? H * 0.44 : H * 0.42, card)
  const cardCx = portrait ? W / 2 : mix(boxCx, W * 0.64, card)

  return (
    <AbsoluteFill style={{ clipPath: open < 1 ? `circle(${radius.toFixed(1)}px at 50% 52%)` : undefined }}>
      <AbsoluteFill style={{ transform: `scale(${(1 + push * 0.05).toFixed(4)})`, transformOrigin: `${boxCx}px ${H * 0.5}px` }}>
        <AbsoluteFill style={{ background: 'radial-gradient(110% 70% at 50% 40%, #c9351f 0%, #9e2512 48%, #5c140a 100%)' }} />
        {/* soft out-of-focus gifts (static depth) */}
        <Img src={staticFile('assets/3d/gift.webp')} style={{ position: 'absolute', left: -u * 0.1, top: H * 0.16, width: u * 0.36, opacity: 0.55, filter: `blur(${(u * 0.008).toFixed(1)}px)` }} />
        <Img src={staticFile('assets/3d/gift-green.webp')} style={{ position: 'absolute', right: -u * 0.12, top: H * (portrait ? 0.1 : 0.06), width: u * 0.34, opacity: 0.5, filter: `blur(${(u * 0.01).toFixed(1)}px)`, transform: 'rotate(10deg)' }} />
        <Img src={staticFile('assets/3d/gift-green.webp')} style={{ position: 'absolute', left: -u * 0.08, bottom: -u * 0.12, width: u * 0.42, opacity: 0.5, filter: `blur(${(u * 0.012).toFixed(1)}px)` }} />
        <Img src={staticFile('assets/3d/gift.webp')} style={{ position: 'absolute', right: -u * 0.1, bottom: -u * 0.1, width: u * 0.4, opacity: 0.5, filter: `blur(${(u * 0.011).toFixed(1)}px)` }} />
        <AbsoluteFill style={{ background: 'linear-gradient(to top, rgba(60,12,6,.5), rgba(60,12,6,0) 40%)' }} />

        {/* contact shadow + box */}
        <div style={{ position: 'absolute', left: boxCx - boxW * 0.45, width: boxW * 0.9, top: boxBottom + boxDrop - boxW * 0.06, height: boxW * 0.14, borderRadius: '50%', opacity: boxIn * 0.8, background: 'radial-gradient(closest-side, rgba(40,6,2,0.6), rgba(40,6,2,0))' }} />
        <div style={{ position: 'absolute', left: boxCx - boxW / 2, top: boxBottom + boxDrop - boxH, opacity: boxIn, transform: `scale(${mix(0.94, 1, boxIn).toFixed(4)})`, transformOrigin: '50% 100%' }}>
          <GiftBox width={boxW} lid={lid} tremble={tremble} glow={Math.max(0, glow)} />
        </div>

        {/* the real recipient card rises out of the box */}
        {card > 0 && (
          <div style={{ position: 'absolute', left: cardCx - cardW / 2, top: cardCy - cardH / 2, width: cardW, opacity: progress(f, 92, 102), transform: `scale(${mix(0.4, 1, card).toFixed(4)})`, transformOrigin: '50% 80%', filter: 'drop-shadow(0 30px 40px rgba(40,6,2,0.55))' }}>
            <Img src={staticFile('assets/ui/card-cutout.png')} style={{ width: '100%', display: 'block' }} />
          </div>
        )}

        {/* warm flash at the opening */}
        {flash > 0 && <AbsoluteFill style={{ opacity: flash, background: `radial-gradient(circle at ${(boxCx / W) * 100}% ${(rimY / H) * 100}%, rgba(255,240,215,0.95), rgba(255,200,140,0.35) 35%, rgba(255,180,120,0) 65%)` }} />}

        <div style={{ position: 'absolute', left: portrait ? 0 : W * 0.07, right: portrait ? 0 : undefined, top: portrait ? H * 0.075 : H * 0.38 }}>
          <Title lines={portrait ? ['Но главный', 'сюрприз...'] : ['Но главный', 'сюрприз...']} at={15} outAt={96} size={portrait ? 0.1 : 0.1} align={portrait ? 'center' : 'left'} />
        </div>
        <div style={{ position: 'absolute', left: portrait ? 0 : W * 0.07, right: portrait ? 0 : undefined, top: portrait ? H * 0.075 : H * 0.38 }}>
          <Title lines={['...ещё впереди.']} at={104} size={portrait ? 0.1 : 0.1} align={portrait ? 'center' : 'left'} />
        </div>
      </AbsoluteFill>
      <Vignette strength={0.5} />
      {flood > 0 && <AbsoluteFill style={{ opacity: flood * 0.8, background: '#fff1e3' }} />}
    </AbsoluteFill>
  )
}
