import type { CSSProperties } from 'react'

/**
 * Virtual 2.5D camera. A layer at `depth` (0 = background, 1 = subject, >1 = foreground)
 * scales and drifts proportionally to the camera move — classic multiplane parallax.
 * No perspective warping is applied to flat renders.
 */
export type Camera = { zoom: number; x: number; y: number } // zoom 1 = rest, x/y in px of camera drift

export function layer(cam: Camera, depth: number): CSSProperties {
  const s = 1 + (cam.zoom - 1) * depth
  return {
    transform: `translate3d(${(-cam.x * depth).toFixed(2)}px, ${(-cam.y * depth).toFixed(2)}px, 0) scale(${s.toFixed(4)})`,
    transformOrigin: '50% 50%',
  }
}
