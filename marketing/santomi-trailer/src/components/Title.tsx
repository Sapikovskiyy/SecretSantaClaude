import type { CSSProperties } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { fontFamily, type } from '../config/brand'
import { progress } from '../animations/easing'

type Props = {
  lines: string[]
  /** frame (local) at which the first word starts entering */
  at: number
  /** optional frame at which the title leaves */
  outAt?: number
  size?: number // fraction of short side
  weight?: number
  color?: string
  align?: CSSProperties['textAlign']
  stagger?: number
  style?: CSSProperties
}

/** Word-by-word refined entrance: opacity, 0.18em rise, 8px blur → sharp. No bounce. */
export function Title({ lines, at, outAt, size = type.hero, weight = type.weightHero, color = '#fff', align = 'center', stagger = 4, style }: Props) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const px = Math.min(width, height) * size
  const out = outAt === undefined ? 0 : progress(frame, outAt, outAt + 14)
  let w = 0
  return (
    <div style={{ fontFamily, fontSize: px, fontWeight: weight, letterSpacing: type.tracking, lineHeight: 1.04, color, textAlign: align, opacity: 1 - out, transform: `translateY(${(-out * px * 0.12).toFixed(2)}px)`, ...style }}>
      {lines.map((line, li) => (
        <div key={li} style={{ whiteSpace: 'nowrap' }}>
          {line.split(' ').map((word, wi) => {
            const p = progress(frame, at + w * stagger, at + w * stagger + 20)
            w++
            return (
              <span key={wi} style={{ display: 'inline-block', opacity: p, transform: `translateY(${((1 - p) * px * 0.18).toFixed(2)}px)`, filter: p < 1 ? `blur(${((1 - p) * 8).toFixed(2)}px)` : undefined, marginRight: wi < line.split(' ').length - 1 ? '0.25em' : 0 }}>
                {word}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}
