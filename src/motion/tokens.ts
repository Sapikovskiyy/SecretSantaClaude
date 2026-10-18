/**
 * Motion tokens — implementation of design-handoff/MOTION_SPEC_RU.md.
 * Use these instead of ad-hoc numbers so timing stays consistent.
 */
import type { Transition } from 'motion/react'

export const EASE = [0.22, 1, 0.36, 1] as const

export const DUR = {
  press: 0.12, // CTA press 90–150 ms
  chip: 0.18, // toggle / chip 120–220 ms
  message: 0.18, // new chat message 140–220 ms
  toast: 0.2, // 180–240 ms
  page: 0.28, // screen transition 220–320 ms
  card: 0.3, // card enter 240–340 ms
  layout: 0.24, // wishlist add/remove 180–280 ms
} as const

export const STAGGER = 0.045 // 35–60 ms, max 4–6 items
export const MAX_STAGGERED = 5

export const tween = (duration: number): Transition => ({ duration, ease: EASE })

/** Bottom sheet: soft spring, no visible bounce (≈300 ms). */
export const SHEET_SPRING: Transition = { type: 'spring', stiffness: 420, damping: 42, mass: 0.9 }

/** Press feedback: scale 1 → 0.97 → 1 without delaying the action. */
export const PRESS = { scale: 0.97 } as const

/** Card entrance (opacity + translateY 12px). */
export const cardIn = (i = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { ...tween(DUR.card), delay: Math.min(i, MAX_STAGGERED) * STAGGER },
})
