import { useCurrentFrame, useVideoConfig } from 'remotion'

/**
 * Warm "dust in the light" bokeh — a few large, soft, slow motes. Gradients only (no blur filters),
 * deterministic positions, so it stays cheap and identical on every render.
 */
const MOTES = [
  { x: 0.18, y: 0.22, r: 0.05, s: 0.6, a: 0.16 },
  { x: 0.78, y: 0.16, r: 0.035, s: 0.9, a: 0.12 },
  { x: 0.86, y: 0.48, r: 0.06, s: 0.5, a: 0.1 },
  { x: 0.12, y: 0.6, r: 0.03, s: 1.1, a: 0.12 },
  { x: 0.62, y: 0.72, r: 0.045, s: 0.7, a: 0.08 },
  { x: 0.35, y: 0.1, r: 0.025, s: 1.3, a: 0.14 },
  { x: 0.5, y: 0.42, r: 0.02, s: 1.6, a: 0.1 },
]

export function Motes({ opacity = 1, tint = '255,190,140', frame: fixed }: { opacity?: number; tint?: string; frame?: number }) {
  const current = useCurrentFrame()
  const frame = fixed ?? current
  const { width, height } = useVideoConfig()
  const u = Math.min(width, height)
  return (
    <div style={{ position: 'absolute', inset: 0, opacity, pointerEvents: 'none' }}>
      {MOTES.map((m, i) => {
        const dx = Math.sin(frame / 90 * m.s + i) * u * 0.02
        const dy = -frame * m.s * 0.35 + Math.cos(frame / 70 * m.s + i * 2) * u * 0.012
        const r = m.r * u
        return (
          <div key={i} style={{ position: 'absolute', left: m.x * width - r + dx, top: m.y * height - r + dy, width: r * 2, height: r * 2, borderRadius: '50%', background: `radial-gradient(closest-side, rgba(${tint},${m.a}), rgba(${tint},${m.a * 0.35}) 60%, rgba(${tint},0))` }} />
        )
      })}
    </div>
  )
}

/** Cinematic vignette. */
export function Vignette({ strength = 0.7 }: { strength?: number }) {
  return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)` }} />
}
