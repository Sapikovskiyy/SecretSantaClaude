/**
 * Calendar mark from references 02 / 04.
 * outline — red-framed calendar on cream (reference status panel / date row);
 * tile — solid red tile (compact contexts).
 */
export function CalendarMark({ size = 36, variant = 'tile' }: { size?: number; variant?: 'tile' | 'outline' }) {
  if (variant === 'outline')
    return (
      <svg aria-hidden width={size} height={size * (34 / 32)} viewBox="0 0 32 34" className="shrink-0">
        <rect x="3" y="6" width="26" height="25" rx="6" fill="#fff4e8" stroke="#d93624" strokeWidth="2.4" />
        <path d="M3 12.5V12a6 6 0 0 1 6-6h14a6 6 0 0 1 6 6v.5z" fill="#d93624" />
        <rect x="8.4" y="2.5" width="3.4" height="7" rx="1.7" fill="#b3271a" />
        <rect x="20.2" y="2.5" width="3.4" height="7" rx="1.7" fill="#b3271a" />
        <rect x="8.5" y="16.5" width="5" height="4.6" rx="1.2" fill="#e4572e" />
        <rect x="15" y="16.5" width="5" height="4.6" rx="1.2" fill="#d93624" />
        <rect x="21.5" y="16.5" width="2.8" height="4.6" rx="1.2" fill="#f0a25a" />
        <rect x="8.5" y="22.6" width="5" height="4.6" rx="1.2" fill="#f0a25a" />
        <rect x="15" y="22.6" width="5" height="4.6" rx="1.2" fill="#e4572e" />
      </svg>
    )
  const dot = Math.round(size * 0.11)
  return (
    <span
      aria-hidden
      className="relative flex shrink-0 items-center justify-center rounded-[10px] bg-ember text-snow shadow-[inset_0_-2px_0_rgba(0,0,0,.15)]"
      style={{ width: size, height: size }}
    >
      <span className="absolute -top-1 left-[22%] h-2 w-1 rounded-full bg-ember" />
      <span className="absolute -top-1 right-[22%] h-2 w-1 rounded-full bg-ember" />
      <span className="grid grid-cols-3 gap-[2px] pt-1.5">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="rounded-[1px] bg-snow/90" style={{ width: dot, height: dot }} />
        ))}
      </span>
    </span>
  )
}
