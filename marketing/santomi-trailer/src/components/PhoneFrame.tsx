import type { CSSProperties, ReactNode } from 'react'
import { Img, staticFile } from 'remotion'

/**
 * Neutral, brand-free smartphone body drawn in CSS (no logos, no recognisable vendor details).
 * Screen aspect = the captured UI (390×844 logical, 1170×2532 @3x).
 */
export const SCREEN_ASPECT = 844 / 390

type Props = { width: number; screen?: string; children?: ReactNode; glare?: number; style?: CSSProperties }

export function PhoneFrame({ width, screen, children, glare = 0.5, style }: Props) {
  const bezel = width * 0.028
  const screenW = width - bezel * 2
  const screenH = screenW * SCREEN_ASPECT
  const height = screenH + bezel * 2
  const r = width * 0.155
  return (
    <div style={{ position: 'relative', width, height, ...style }}>
      {/* metal rim */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: r, background: 'linear-gradient(135deg, #5b4c45 0%, #2a201c 22%, #8d7c71 48%, #241b18 72%, #5e4f47 100%)', boxShadow: `0 ${width * 0.09}px ${width * 0.16}px rgba(0,0,0,0.55), 0 ${width * 0.02}px ${width * 0.04}px rgba(0,0,0,0.35)` }} />
      {/* black glass bezel */}
      <div style={{ position: 'absolute', inset: width * 0.006, borderRadius: r - width * 0.006, background: '#0b0807' }} />
      {/* screen */}
      <div style={{ position: 'absolute', left: bezel, top: bezel, width: screenW, height: screenH, borderRadius: r - bezel, overflow: 'hidden', background: '#2d1d16' }}>
        {screen && <Img src={staticFile(`assets/ui/${screen}.png`)} style={{ width: '100%', height: '100%', display: 'block' }} />}
        {children}
        {/* camera punch-hole */}
        <div style={{ position: 'absolute', left: '50%', top: screenW * 0.03, width: screenW * 0.032, height: screenW * 0.032, marginLeft: -screenW * 0.016, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #2b2f3a, #050505 70%)' }} />
        {/* glass reflection */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(115deg, rgba(255,255,255,${0.1 * glare}) 0%, rgba(255,255,255,${0.03 * glare}) 28%, rgba(255,255,255,0) 42%)`, pointerEvents: 'none' }} />
      </div>
      {/* rim highlight */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: r, boxShadow: 'inset 0 0 0 1.5px rgba(255,235,220,0.18)', pointerEvents: 'none' }} />
    </div>
  )
}

/** Touch feedback: a soft ring that expands and fades. `p` = 0..1. */
export function TouchRing({ x, y, size, p }: { x: number; y: number; size: number; p: number }) {
  if (p <= 0 || p >= 1) return null
  const s = 0.6 + p * 0.8
  const a = p < 0.25 ? p / 0.25 : 1 - (p - 0.25) / 0.75
  return (
    <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%', transform: `scale(${s})`, background: `radial-gradient(closest-side, rgba(255,255,255,${0.32 * a}), rgba(255,255,255,${0.12 * a}) 70%, rgba(255,255,255,0))`, boxShadow: `0 0 0 ${size * 0.03}px rgba(255,255,255,${0.35 * a})` }} />
  )
}
