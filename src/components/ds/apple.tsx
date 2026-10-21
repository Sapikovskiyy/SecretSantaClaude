/**
 * Apple-style motion primitives (iOS feel, Motion for React; transform/opacity only).
 *  - CollapsingHeader + useLargeTitle: iOS large title that shrinks/fades on scroll while a
 *    compact centred title fades into a blurred sticky bar.
 *  - AnimatedCheck: checkmark that draws itself (pathLength), like iOS selection.
 *  - RollingNumber: digits roll vertically when a count changes.
 */
import { type ReactNode } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
import { APPLE } from '@/motion/tokens'

/** Large title style bound to page scroll: 1 → 0.86 scale, fades out by ~90 px. */
export function useLargeTitle() {
  const { scrollY } = useScroll()
  const scale = useTransform(scrollY, [0, 90], [1, 0.86], { clamp: true })
  const opacity = useTransform(scrollY, [10, 90], [1, 0], { clamp: true })
  return { scale, opacity, transformOrigin: '0% 100%' }
}

/** Sticky header row: transparent at the top, blurred bar + compact title once the large title is gone. */
export function CollapsingHeader({ title, left, right, className = '' }: { title: string; left?: ReactNode; right?: ReactNode; className?: string }) {
  const { scrollY } = useScroll()
  const bar = useTransform(scrollY, [20, 70], [0, 1], { clamp: true })
  const titleOpacity = useTransform(scrollY, [60, 100], [0, 1], { clamp: true })
  const titleY = useTransform(scrollY, [60, 100], [8, 0], { clamp: true })
  return (
    <div className={`sticky top-0 z-30 ${className}`}>
      <motion.div aria-hidden style={{ opacity: bar }} className="pointer-events-none absolute inset-x-0 -top-[200px] bottom-0 border-b border-white/[0.06] bg-[rgba(45,29,22,0.78)] backdrop-blur-xl" />
      <div className="relative flex h-12 items-center justify-between px-[22px]">
        {left ?? <span className="w-12" />}
        <motion.span aria-hidden style={{ opacity: titleOpacity, y: titleY }} className="type-screen pointer-events-none absolute inset-x-20 truncate text-center text-snow">
          {title}
        </motion.span>
        {right ?? <span className="w-12" />}
      </div>
    </div>
  )
}

/** Checkmark that draws itself in ~0.3 s (selection feedback). */
export function AnimatedCheck({ size = 17, strokeWidth = 2.6, className = '' }: { size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <motion.path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1], delay: 0.05 }}
      />
    </svg>
  )
}

/** A number that rolls up (increase) or down (decrease) when it changes. */
export function RollingNumber({ value, className = '' }: { value: number; className?: string }) {
  return (
    <span className={`relative inline-flex overflow-hidden align-bottom ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: '70%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-70%', opacity: 0 }}
          transition={APPLE.snappy}
          className="inline-block tabular-nums"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
