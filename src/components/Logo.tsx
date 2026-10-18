import { Art } from './art/Art'

/** Santomi lockup: 3D gift mark + bold system-font wordmark. */
export function Logo({ className = '', compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-label="Santomi">
      <Art name="gift" size={compact ? 26 : 32} noShadow eager />
      <span className="text-card font-bold leading-none tracking-[-0.02em]">Santomi</span>
    </span>
  )
}
