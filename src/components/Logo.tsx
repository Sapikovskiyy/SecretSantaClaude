import { Art } from './art/Art'

/** Santomi lockup from the handoff sheets: 3D gift mark + serif wordmark. */
export function Logo({ className = '', compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-label="Santomi">
      <Art name="gift" size={compact ? 26 : 32} noShadow eager />
      <span className="font-display text-[22px] leading-none tracking-[-0.01em]">Santomi</span>
    </span>
  )
}
