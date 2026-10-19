import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Img, staticFile } from 'remotion'
import layout from '../../public/assets/ui/ui-layout.json'
import { color } from '../config/brand'
import { SCREEN_ASPECT } from './PhoneFrame'

/** Element boxes of the captured UI in CSS px (390×844 logical screen). */
export const ui = layout as Record<string, Record<string, { x: number; y: number; w: number; h: number }>>
export const CSS_W = 390
export const CSS_H = 844

/** Phone geometry for a frame size. `scale` lets a scene use a bigger/smaller phone. */
export function phoneGeom(W: number, H: number, opts: { width?: number; x?: number; top?: number } = {}) {
  const portrait = H > W
  const phoneW = opts.width ?? (portrait ? W * 0.6 : H * 0.42)
  const bezel = phoneW * 0.028
  const screenW = phoneW - bezel * 2
  const screenH = screenW * SCREEN_ASPECT
  const phoneH = screenH + bezel * 2
  const x = opts.x ?? (portrait ? (W - phoneW) / 2 : W * 0.62)
  const top = opts.top ?? (portrait ? H * 0.245 : (H - phoneH) / 2 + H * 0.02)
  const k = screenW / CSS_W
  return {
    phoneW,
    phoneH,
    screenW,
    screenH,
    x,
    top,
    k,
    /** CSS px on the screen → frame px (ignores tilt) */
    fx: (cssX: number) => x + bezel + cssX * k,
    fy: (cssY: number) => top + bezel + cssY * k,
  }
}

/** Shows `screen` (a capture) only inside a CSS-px box — for typing reveals and state changes. */
export function Region({ screen, k, box, reveal = 1, opacity = 1, style }: { screen: string; k: number; box: { x: number; y: number; w: number; h: number }; reveal?: number; opacity?: number; style?: CSSProperties }) {
  if (reveal <= 0 || opacity <= 0) return null
  return (
    <div style={{ position: 'absolute', left: box.x * k, top: box.y * k, width: box.w * k * reveal, height: box.h * k, overflow: 'hidden', opacity, ...style }}>
      <Img src={staticFile(`assets/ui/${screen}.png`)} style={{ position: 'absolute', left: -box.x * k, top: -box.y * k, width: CSS_W * k, height: CSS_H * k, maxWidth: 'none' }} />
    </div>
  )
}

/** Full-screen capture layer inside the phone (crossfades / slides). */
export function ScreenLayer({ screen, opacity = 1, x = 0, style }: { screen: string; opacity?: number; x?: number; style?: CSSProperties }) {
  if (opacity <= 0) return null
  return <Img src={staticFile(`assets/ui/${screen}.png`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity, transform: x ? `translateX(${x}px)` : undefined, ...style }} />
}

/** Chocolate studio background shared by the product scenes. */
export function ChocolateBg({ portrait, focusY = 0.58 }: { portrait: boolean; focusY?: number }) {
  return <AbsoluteFill style={{ background: `radial-gradient(${portrait ? '90% 60%' : '60% 90%'} at ${portrait ? '50%' : '62%'} ${(focusY * 100).toFixed(0)}%, #4a2a1c 0%, ${color.bark} 45%, ${color.night} 100%)` }} />
}

/**
 * Gift box built from two CEO renders (box + lid v3, same 1254 px source frame; geometry in box-width units,
 * fitted on a composite: lid canvas offset −93 / −415 px against the 1054 px box). `lid` 0 = closed … 1 = flown away.
 */
export function GiftBox({ width, lid = 0, tremble = 0, glow = 0, children }: { width: number; lid?: number; tremble?: number; glow?: number; children?: ReactNode }) {
  const lidLeft = -0.0882 * width
  const lidTop = -0.3937 * width
  const lidW = 1.1765 * width
  const boxH = 0.7837 * width
  const ly = -lid * width * 0.75
  const lx = lid * width * 0.28
  const lr = lid * 18
  return (
    <div style={{ position: 'relative', width, height: boxH - lidTop }}>
      {/* light escaping the box */}
      {glow > 0 && (
        <div style={{ position: 'absolute', left: -width * 0.45, right: -width * 0.45, top: -width * 0.55, height: width * 1.5, opacity: glow, background: 'radial-gradient(closest-side, rgba(255,232,190,0.95), rgba(255,190,120,0.45) 45%, rgba(255,160,90,0) 75%)' }} />
      )}
      <div style={{ position: 'absolute', left: 0, bottom: 0, width }}>
        <Img src={staticFile('assets/3d/gift-base.webp')} style={{ width: '100%', display: 'block' }} />
      </div>
      {children}
      <div style={{ position: 'absolute', left: lidLeft, top: 0, width: lidW, transformOrigin: '70% 80%', transform: `translate(${(lx + tremble).toFixed(2)}px, ${ly.toFixed(2)}px) rotate(${lr.toFixed(2)}deg)`, opacity: lid > 0.55 ? Math.max(0, 1 - (lid - 0.55) / 0.45) : 1 }}>
        <Img src={staticFile('assets/3d/gift-lid-v3.webp')} style={{ width: '100%', display: 'block' }} />
      </div>
    </div>
  )
}

/**
 * Polka-dot sack with the candy cane standing inside: back layer → cane → front layer
 * (the app's Welcome composition, positions in box-width units). Because the cane sits between the
 * two layers, a cane dropped from above disappears into the opening naturally.
 *  sackIn 0..1 · caneIn 0..1 (light) · caneY px offset from rest · caneRot deg offset · squash 0..1 (impact)
 */
export function SackWithCane({ box, caneIn, sackIn, caneY = 0, caneRot = 0, squash = 0 }: { box: number; caneIn: number; sackIn: number; caneY?: number; caneRot?: number; squash?: number }) {
  const sack: CSSProperties = { position: 'absolute', left: -0.15 * box, top: 0.227 * box, width: 1.35 * box, maxWidth: 'none', filter: `brightness(${(0.12 + 0.72 * sackIn).toFixed(3)}) contrast(1.06) saturate(1.05)`, opacity: sackIn }
  return (
    <div style={{ position: 'relative', width: box, height: 0.227 * box + 1.35 * box, transformOrigin: '50% 100%', transform: squash ? `scale(${(1 + squash * 0.012).toFixed(4)}, ${(1 - squash * 0.018).toFixed(4)})` : undefined }}>
      <Img src={staticFile('assets/3d/sack-back.webp')} style={sack} />
      <Img
        src={staticFile('assets/3d/cane.webp')}
        style={{ position: 'absolute', left: 0.32 * box, top: -0.059 * box, width: 0.46 * box, maxWidth: 'none', transformOrigin: '40% 70%', transform: `translateY(${caneY.toFixed(2)}px) rotate(${(-19 + caneRot).toFixed(2)}deg)`, opacity: caneIn, filter: `brightness(${(0.1 + 0.85 * caneIn).toFixed(3)})` }}
      />
      <Img src={staticFile('assets/3d/sack-front.webp')} style={sack} />
    </div>
  )
}
