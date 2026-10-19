import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { easeCamera, easeInOut, easeSoft, mix, progress } from '../animations/easing'
import { Motes, Vignette } from '../components/Atmosphere'
import { PhoneFrame, TouchRing } from '../components/PhoneFrame'
import { ChocolateBg, Region, phoneGeom, ui } from '../components/Stage'
import { Title } from '../components/Title'

/**
 * SCENE 04 — «Пригласи друзей.»  global 360–495 (local 0–135).
 *  0–18   red gift with the emerald ribbon flies in towards camera (from soft focus), slight turn
 *  30–58  the phone rises with the real Invite screen (gift slot left empty at capture); the gift flies
 *         into that slot and stays there — exactly the size and place the app draws it
 *  66/78/90 participants join one by one (real captured states), tap on «Отправить в Telegram» at 104
 *  120+   scene 05's emerald circle opens from that button
 */
export const SCENE04_START = 360
export const SCENE04_LENGTH = 150

// The app draws gift-green.webp object-contain in a square Art box (ui-layout.json → invite.gift)
const GIFT_ASPECT = 720 / 702 // h / w of gift-green.webp
const SLOT = ui.invite.gift

/** Telegram button centre in frame px (scene 05 opens its circle here). */
export function telegramButtonPoint(W: number, H: number) {
  const g = phoneGeom(W, H)
  const t = ui.invite.telegram
  return { x: g.fx(t.x + t.w / 2), y: g.fy(t.y + t.h / 2) }
}

export function Scene04Invite() {
  const f = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()
  const portrait = H > W
  const u = Math.min(W, H)
  const g = phoneGeom(W, H)

  const bgIn = progress(f, 0, 14)
  const giftIn = progress(f, 0, 20, easeSoft)
  const toScreen = progress(f, 30, 58, easeCamera)
  const landed = progress(f, 50, 60)
  const phoneIn = progress(f, 28, 58, easeSoft)

  // gift: hero position → its place on the screen
  const heroW = portrait ? W * 0.56 : H * 0.48
  const heroCx = portrait ? W / 2 : W * 0.66
  const heroCy = portrait ? H * 0.52 : H * 0.54
  const phoneTop = mix(H * 1.02, g.top, phoneIn)
  const dy = phoneTop - g.top
  const targetW = (SLOT.h / GIFT_ASPECT) * g.k
  const targetCx = g.fx(SLOT.x + SLOT.w / 2)
  const targetCy = g.fy(SLOT.y + SLOT.h / 2) + dy
  const gw = mix(heroW, targetW, toScreen) * mix(1.35, 1, giftIn)
  const gcx = mix(heroCx, targetCx, toScreen)
  const gcy = mix(heroCy + (1 - giftIn) * H * 0.08, targetCy, toScreen)
  const turn = mix(-5, 3, progress(f, 0, 50, easeInOut)) * (1 - toScreen) + Math.sin(f / 20) * 1.2 * (1 - toScreen)
  const giftBlur = (1 - giftIn) * u * 0.012

  // participants joining (real captured states, crossfaded only inside the avatars row)
  const join = (at: number) => progress(f, at, at + 6)
  const pop = (at: number) => 1 + 0.02 * Math.sin(Math.PI * progress(f, at, at + 10))
  const row = { x: 14, y: 650, w: 362, h: 84 }
  const popScale = pop(66) * pop(78) * pop(90)
  const tg = ui.invite.telegram
  const tap = progress(f, 104, 122, (t) => t)

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: bgIn }}>
        <ChocolateBg portrait={portrait} />
        <Motes opacity={0.6} />
      </AbsoluteFill>

      {/* phone with the real Invite screen */}
      <div style={{ position: 'absolute', left: g.x, top: phoneTop, opacity: phoneIn }}>
        <PhoneFrame width={g.phoneW} screen="invite-empty">
          {/* the Art contact shadow under the gift slot, appearing as the gift lands */}
          <div style={{ position: 'absolute', left: (SLOT.x + SLOT.w * 0.19) * g.k, top: (SLOT.y + SLOT.h * 0.88) * g.k, width: SLOT.w * 0.62 * g.k, height: SLOT.h * 0.09 * g.k, borderRadius: '50%', background: 'rgba(0,0,0,0.3)', filter: `blur(${(6 * g.k).toFixed(1)}px)`, opacity: landed }} />
          <div style={{ position: 'absolute', inset: 0, transformOrigin: `${(row.x + 40) * g.k}px ${(row.y + row.h / 2) * g.k}px` }}>
            <Region screen="invite-1" k={g.k} box={row} opacity={join(66)} style={{ transform: `scale(${popScale.toFixed(4)})`, transformOrigin: '12% 50%' }} />
            <Region screen="invite-2" k={g.k} box={row} opacity={join(78)} style={{ transform: `scale(${popScale.toFixed(4)})`, transformOrigin: '12% 50%' }} />
            <Region screen="invite-3" k={g.k} box={row} opacity={join(90)} style={{ transform: `scale(${popScale.toFixed(4)})`, transformOrigin: '12% 50%' }} />
          </div>
          <TouchRing x={(tg.x + tg.w / 2) * g.k} y={(tg.y + tg.h / 2) * g.k} size={g.phoneW * 0.22} p={tap} />
        </PhoneFrame>
      </div>

      {/* the gift: flies in, then lands in the empty slot of the Invite screen and stays */}
      {(
        <div style={{ position: 'absolute', left: gcx - gw / 2, top: gcy - (gw * GIFT_ASPECT) / 2, width: gw, opacity: giftIn, transform: `rotate(${turn.toFixed(2)}deg)`, filter: giftBlur > 0.3 ? `blur(${giftBlur.toFixed(1)}px)` : undefined }}>
          <Img src={staticFile('assets/3d/gift-green.webp')} style={{ width: '100%', display: 'block' }} />
        </div>
      )}

      <div style={{ position: 'absolute', left: portrait ? 0 : W * 0.08, right: portrait ? 0 : undefined, top: portrait ? H * 0.085 : H * 0.38 }}>
        <Title lines={portrait ? ['Пригласи друзей.'] : ['Пригласи', 'друзей.']} at={12} outAt={112} size={portrait ? 0.088 : 0.11} align={portrait ? 'center' : 'left'} />
      </div>
      <Vignette strength={0.55} />
    </AbsoluteFill>
  )
}
