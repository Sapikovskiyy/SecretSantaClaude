/**
 * Soft glowing star from reference 01 (cream body, warm amber halo). Static SVG + one radial
 * gradient + one static drop-shadow; only the halo opacity breathes (compositor-only).
 */
export function GlowStar({ size, className = '', style, delay = 0 }: { size: number; className?: string; style?: React.CSSProperties; delay?: number }) {
  return (
    <span aria-hidden className={`pointer-events-none absolute ${className}`} style={{ width: size, height: size, ...style }}>
      <span
        className="glow-breathe absolute rounded-full"
        style={{
          animationDelay: `${delay}s`,
          inset: -size * 0.7,
          background:
            'radial-gradient(closest-side, rgba(255,222,178,.95) 0%, rgba(255,164,92,.62) 30%, rgba(238,98,44,.26) 60%, rgba(210,60,30,0) 100%)',
        }}
      />
      <svg viewBox="0 0 100 100" width={size} height={size} className="relative" style={{ filter: `drop-shadow(0 0 ${Math.round(size * 0.07)}px rgba(255,214,160,.95))` }}>
        <defs>
          <radialGradient id="gs-fill" cx="40%" cy="35%" r="70%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.65" stopColor="#fff5e8" />
            <stop offset="1" stopColor="#ffe0bd" />
          </radialGradient>
        </defs>
        <path
          d="M50 6c3.2 0 5 2.4 6.4 6.2l7.1 19.3c.7 1.9 2.4 3.1 4.4 3.2l20.4 1c4 .2 6.6 1.5 7.4 4.3.9 2.8-.6 5.3-3.7 7.8L76 60.5c-1.6 1.3-2.2 3.3-1.7 5.2l5.4 19.8c1 3.9.8 6.8-1.5 8.5-2.3 1.7-5.2 1-8.6-1.2l-17-11.3a4.9 4.9 0 0 0-5.3 0l-17 11.3c-3.4 2.2-6.3 2.9-8.6 1.2-2.3-1.7-2.5-4.6-1.5-8.5l5.4-19.8c.5-1.9-.1-3.9-1.7-5.2L8 47.8c-3.1-2.5-4.6-5-3.7-7.8.8-2.8 3.4-4.1 7.4-4.3l20.4-1c2-.1 3.7-1.3 4.4-3.2l7.1-19.3C45 8.4 46.8 6 50 6Z"
          fill="url(#gs-fill)"
        />
      </svg>
    </span>
  )
}
