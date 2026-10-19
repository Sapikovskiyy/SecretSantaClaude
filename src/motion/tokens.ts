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
  page: 0.28, // screen transition 220–320 ms (legacy)
  enter: 0.2, // v3: enter-only screen transition, 180–260 ms
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

/** Spring presets. All are critically damped or close to it — no rubbery bounce. */
export const SPRING = {
  /** Default UI motion (cards, chips, layout). */
  soft: { type: 'spring', stiffness: 380, damping: 34, mass: 0.9 } as Transition,
  /** Small, quick elements (checks, badges, toggles). */
  snappy: { type: 'spring', stiffness: 600, damping: 38 } as Transition,
  /** Bottom sheets / modals. */
  sheet: SHEET_SPRING,
  /** Layout reflow of lists (wishlist add/remove). */
  layout: { type: 'spring', stiffness: 500, damping: 42 } as Transition,
} as const

/** Screen transition (navigation-aware: dir = 1 forward, -1 back). */
export const pageTransition = (dir: 1 | -1 = 1) => ({
  initial: { opacity: 0, x: 12 * dir },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 * dir },
  transition: tween(DUR.page),
})

/** Modal / bottom-sheet presets. */
export const modal = {
  backdrop: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: tween(0.2) },
  sheet: { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, transition: SHEET_SPRING },
  dialog: { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.98 }, transition: tween(0.22) },
} as const

/** Variants for staggered lists: parent `listVariants`, children `itemVariants`. */
export const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER, delayChildren: 0.02 } },
}
export const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: tween(DUR.card) },
  exit: { opacity: 0, x: -16, transition: tween(DUR.layout) },
}

/** Card entrance (opacity + translateY 12px). */
export const cardIn = (i = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { ...tween(DUR.card), delay: Math.min(i, MAX_STAGGERED) * STAGGER },
})
