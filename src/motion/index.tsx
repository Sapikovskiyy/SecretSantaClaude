/**
 * Santomi motion primitives — the ONE interface-animation layer (Motion for React).
 * Rive / dotLottie are only for pre-made animation assets (see src/animation).
 * CSS is preferred for trivial effects (button press physics live in styles/buttons.css).
 */
import type { ReactNode } from 'react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import { DUR, PRESS, SPRING, itemVariants, listVariants, tween } from './tokens'

export * from './tokens'

/** Tap feedback for custom tappable surfaces (cards, tiles). Never delays onClick. */
export function Pressable({ children, className, ...rest }: HTMLMotionProps<'div'> & { children: ReactNode }) {
  return (
    <motion.div whileTap={PRESS} transition={tween(DUR.press)} className={className} {...rest}>
      {children}
    </motion.div>
  )
}

/** One-shot entrance (opacity + 12 px rise). */
export function FadeIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...tween(DUR.card), delay }} className={className}>
      {children}
    </motion.div>
  )
}

/** Staggered list (≤ 5–6 visible items animate; the rest appear with them). */
export function StaggerList({ children, className, as = 'ul' }: { children: ReactNode; className?: string; as?: 'ul' | 'ol' | 'div' }) {
  const Tag = motion[as]
  return (
    <Tag variants={listVariants} initial="hidden" animate="show" className={className}>
      {children}
    </Tag>
  )
}

export function StaggerItem({ children, className, layout = true }: { children: ReactNode; className?: string; layout?: boolean }) {
  return (
    <motion.li variants={itemVariants} exit="exit" layout={layout} transition={SPRING.layout} className={className}>
      {children}
    </motion.li>
  )
}

/**
 * Decorative loop that pauses entirely under prefers-reduced-motion.
 * Use sparingly (welcome / hero / reveal only — motion spec).
 */
export function Ambient({ children, className, amplitude = 4, period = 7 }: { children: ReactNode; className?: string; amplitude?: number; period?: number }) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div className={className} animate={{ y: [0, -amplitude, 0], rotate: [-1.5, 1.5, -1.5] }} transition={{ duration: period, repeat: Infinity, ease: 'easeInOut' }}>
      {children}
    </motion.div>
  )
}
