import type { SVGProps } from 'react'

const paths = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  back: 'M15 5l-7 7 7 7',
  forward: 'M9 5l7 7-7 7',
  down: 'M6 9l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  share: 'M12 15V4M7.5 8.5L12 4l4.5 4.5M5 13v5a2 2 0 002 2h10a2 2 0 002-2v-5',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  send: 'M5 12l14-7-5 14-3-6-6-1z',
  chat: 'M5 6h14v10H9l-4 3z',
  home: 'M4 11l8-6 8 6v8a1 1 0 01-1 1h-4v-5h-6v5H5a1 1 0 01-1-1z',
  list: 'M8 7h11M8 12h11M8 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 20a7.5 7.5 0 0115 0',
  gift: 'M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-2-4-6-4-6-1.5S10 7 12 7zM12 7c2-4 6-4 6-1.5S14 7 12 7z',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  up: 'M6 15l6-6 6 6',
  flag: 'M6 21V4M6 4h11l-2 4 2 4H6',
  lock: 'M7 11V8a5 5 0 0110 0v3M5 11h14v10H5z',
  calendar: 'M5 6h14v14H5zM5 10h14M9 3v4M15 3v4',
  wallet: 'M4 7h14a2 2 0 012 2v9a2 2 0 01-2 2H4zM4 7l11-3v3M16 13h.01',
  users: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 6.5M18 14.5a6.5 6.5 0 013.5 5.5',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  link: 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1',
  bell: 'M6 16V11a6 6 0 0112 0v5l2 2H4zM10 20h4',
  help: 'M9.5 9a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4M12 17h.01',
  star: 'M12 4l2.4 5 5.6.6-4.2 3.8 1.2 5.6L12 16.2 7 19l1.2-5.6L4 9.6 9.6 9z',
  refresh: 'M4 12a8 8 0 0114-5.3L20 9M20 4v5h-5M20 12a8 8 0 01-14 5.3L4 15M4 20v-5h5',
  shuffle: 'M4 7h3c5 0 5 10 10 10h3M4 17h3c2 0 3-1.5 4-3.5M13 9.5C14 8 15 7 17 7h3M18 4l3 3-3 3M18 14l3 3-3 3',
  x: 'M8 8l8 8M16 8l-8 8',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2',
  crown: 'M4 18h16M5 18L3.5 8l5 4L12 6l3.5 6 5-4L19 18',
  play: 'M8 5.5v13l10.5-6.5z',
  more: 'M12 5.5h.01M12 12h.01M12 18.5h.01',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z',
  snow: 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z',
  film: 'M4 5h16v14H4zM8 5v14M16 5v14M4 9.5h4M4 14.5h4M16 9.5h4M16 14.5h4',
  game: 'M7 9h10a4 4 0 014 4v1a3 3 0 01-5.4 1.8L14 14h-4l-1.6 1.8A3 3 0 013 14v-1a4 4 0 014-4zM8 11.5v3M6.5 13h3M15.5 12.5h.01M17.5 14h.01',
  checks: 'M2.5 12.5L6 16l7.5-8M10 16l1 1 8.5-9',
  alert: 'M12 8v5M12 16.5h.01M10.3 3.9L2.6 17.5A2 2 0 004.3 20.5h15.4a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  hat: 'M4 18h16M5.5 18c1-6 4-11 9-11 2.5 0 4 1.5 4 3.5M18.5 10.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z',
} as const

export type IconName = keyof typeof paths

export function Icon({ name, size = 22, strokeWidth = 1.8, ...rest }: { name: IconName; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  )
}

/** »»» chevrons. `still` disables the blink loop (no perpetual animation on idle screens). */
export function Chevrons({ className = '', still = false }: { className?: string; still?: boolean }) {
  return (
    <span className={`${still ? '' : 'chev '}inline-flex items-center gap-0 ${className}`} aria-hidden="true">
      <Icon name="forward" size={16} strokeWidth={2} className="-mr-2" />
      <Icon name="forward" size={16} strokeWidth={2} className="-mr-2" />
      <Icon name="forward" size={16} strokeWidth={2} />
    </span>
  )
}
