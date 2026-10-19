import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { easeInOut, progress } from '../animations/easing'

/**
 * Transition: a warm band of light crosses the frame diagonally. Returns `edge` (0..1) so the
 * incoming scene can be revealed exactly behind the brightest part of the band.
 */
export function useSweep(from: number, duration: number) {
  const f = useCurrentFrame()
  return progress(f, from, from + duration, easeInOut)
}

/** Band centre (fraction of frame width) for sweep progress p. */
export const sweepCenter = (p: number) => -0.6 + p * 2.2

/** Soft mask that reveals the incoming scene exactly behind the band (angle matches the band). */
export function sweepReveal(p: number) {
  if (p >= 1) return {}
  const c = sweepCenter(p) * 100
  const m = `linear-gradient(104deg, #000 ${(c - 14).toFixed(2)}%, rgba(0,0,0,0) ${(c + 6).toFixed(2)}%)`
  return { WebkitMaskImage: m, maskImage: m }
}

export function LightSweep({ p, tint = '255,184,128', strength = 0.75 }: { p: number; tint?: string; strength?: number }) {
  const { width } = useVideoConfig()
  if (p <= 0 || p >= 1) return null
  const x = sweepCenter(p)
  const fade = Math.sin(p * Math.PI)
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'screen', opacity: fade }}>
      <div
        style={{
          position: 'absolute',
          top: '-30%',
          bottom: '-30%',
          left: x * width - width * 0.6,
          width: width * 1.2,
          transform: 'rotate(14deg)',
          background: `linear-gradient(90deg, rgba(${tint},0) 0%, rgba(${tint},${strength * 0.35}) 35%, rgba(255,236,214,${strength}) 50%, rgba(${tint},${strength * 0.35}) 65%, rgba(${tint},0) 100%)`,
        }}
      />
    </AbsoluteFill>
  )
}
