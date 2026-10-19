/** Red calendar tile from references 02 / 04 (date rows, game status panel). */
export function CalendarMark({ size = 36 }: { size?: number }) {
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
