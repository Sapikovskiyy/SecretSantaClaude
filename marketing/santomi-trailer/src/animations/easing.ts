import { Easing, interpolate } from 'remotion'

// The app's --ease-soft — refined deceleration, no overshoot.
export const easeSoft = Easing.bezier(0.22, 1, 0.36, 1)
// Slow camera ease (both ends soft).
export const easeCamera = Easing.bezier(0.45, 0, 0.25, 1)
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1)
export const easeIn = Easing.bezier(0.55, 0, 1, 0.45)

/** 0→1 progress between two frames with an easing, clamped. */
export function progress(frame: number, from: number, to: number, easing = easeSoft) {
  return interpolate(frame, [from, to], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing })
}

export const mix = (a: number, b: number, t: number) => a + (b - a) * t
