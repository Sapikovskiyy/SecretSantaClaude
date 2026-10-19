/**
 * Santomi soft-3D illustration set (original vector artwork).
 * Volumetric look via radial gradients, rim light and blurred speculars.
 * Phase 1 placeholder art: designed to be swapped 1:1 with commissioned
 * pre-rendered 3D assets later (same keys, same 200×200 framing).
 */
import { useId, type ReactNode } from 'react'

export type ArtName =
  | 'sack'
  | 'gift'
  | 'teahouse'
  | 'book'
  | 'gamepad'
  | 'mug'
  | 'headphones'
  | 'vinyl'
  | 'perfume'
  | 'mitten'
  | 'palette'
  | 'ball'
  | 'star'
  | 'cane'
  | 'bauble'
  | 'envelope'
  | 'house'
  | 'santa'
  | 'sleigh'
  | 'robot'
  | 'stocking'
  | 'gift-star'

interface Props {
  name: ArtName | string
  size?: number | string
  className?: string
  /** Hide the contact shadow (for floating decor) */
  noShadow?: boolean
}

/** Shared defs: every instance gets unique ids so many can render at once. */
function Defs({ p }: { p: string }) {
  return (
    <defs>
      <filter id={`${p}blur`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
      <filter id={`${p}soft`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
      {/* Christmas red, lit from top-left */}
      <radialGradient id={`${p}red`} cx="32%" cy="28%" r="80%">
        <stop offset="0" stopColor="#FF7A55" />
        <stop offset="0.45" stopColor="#D8371C" />
        <stop offset="1" stopColor="#6E140A" />
      </radialGradient>
      <radialGradient id={`${p}cream`} cx="30%" cy="25%" r="85%">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="0.5" stopColor="#FFE9D6" />
        <stop offset="1" stopColor="#D9A988" />
      </radialGradient>
      <radialGradient id={`${p}green`} cx="30%" cy="25%" r="85%">
        <stop offset="0" stopColor="#5FD39A" />
        <stop offset="0.5" stopColor="#13854F" />
        <stop offset="1" stopColor="#053A22" />
      </radialGradient>
      <radialGradient id={`${p}snow`} cx="35%" cy="20%" r="90%">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="0.6" stopColor="#E8EEF5" />
        <stop offset="1" stopColor="#9FAABB" />
      </radialGradient>
      <radialGradient id={`${p}gold`} cx="30%" cy="25%" r="85%">
        <stop offset="0" stopColor="#FFF0B8" />
        <stop offset="0.5" stopColor="#E7B54A" />
        <stop offset="1" stopColor="#8A5A12" />
      </radialGradient>
      <radialGradient id={`${p}choc`} cx="30%" cy="25%" r="85%">
        <stop offset="0" stopColor="#8A5A44" />
        <stop offset="0.55" stopColor="#4A2C20" />
        <stop offset="1" stopColor="#1E110C" />
      </radialGradient>
      <radialGradient id={`${p}violet`} cx="30%" cy="25%" r="85%">
        <stop offset="0" stopColor="#C9B8FF" />
        <stop offset="0.55" stopColor="#6E56C9" />
        <stop offset="1" stopColor="#2C1E66" />
      </radialGradient>
      <radialGradient id={`${p}pink`} cx="30%" cy="25%" r="85%">
        <stop offset="0" stopColor="#FFD6E2" />
        <stop offset="0.55" stopColor="#EF8DA9" />
        <stop offset="1" stopColor="#9C3D5A" />
      </radialGradient>
      <linearGradient id={`${p}glass`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
        <stop offset="0.5" stopColor="#FFD9E4" stopOpacity="0.55" />
        <stop offset="1" stopColor="#C77E98" stopOpacity="0.8" />
      </linearGradient>
    </defs>
  )
}

const Shine = ({ p, cx, cy, rx, ry, o = 0.75, rot = -30 }: { p: string; cx: number; cy: number; rx: number; ry: number; o?: number; rot?: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fff" opacity={o} filter={`url(#${p}blur)`} transform={`rotate(${rot} ${cx} ${cy})`} />
)

const Shadow = ({ p, cx = 100, cy = 182, rx = 62, ry = 9 }: { p: string; cx?: number; cy?: number; rx?: number; ry?: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#000" opacity="0.32" filter={`url(#${p}soft)`} />
)

/** Candy cane stroke used in several pieces */
function Cane({ p, d, w = 16 }: { p: string; d: string; w?: number }) {
  return (
    <g>
      <path d={d} fill="none" stroke="#F7EDE6" strokeWidth={w} strokeLinecap="round" />
      <path d={d} fill="none" stroke={`url(#${p}red)`} strokeWidth={w} strokeLinecap="butt" strokeDasharray={`${w * 0.75} ${w * 0.55}`} />
      <path d={d} fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth={w * 0.22} strokeLinecap="round" transform={`translate(${-w * 0.18} ${-w * 0.18})`} />
    </g>
  )
}

const ART: Partial<Record<ArtName, (p: string) => ReactNode>> = {
  sack: (p) => (
    <>
      <Shadow p={p} rx={70} cy={186} />
      <Cane p={p} d="M112 100 L112 48 Q112 22 136 22 Q158 22 158 46 L158 58" w={18} />
      {/* bag body */}
      <path d="M48 118 Q30 150 44 172 Q70 192 120 190 Q166 188 172 160 Q178 132 152 110 Q132 98 100 100 Q66 102 48 118Z" fill={`url(#${p}red)`} />
      {/* dots */}
      {[
        [70, 140, 9],
        [104, 128, 8],
        [140, 140, 10],
        [86, 170, 8],
        [126, 172, 9],
        [158, 165, 6],
        [56, 162, 6],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill={`url(#${p}gold)`} />
        </g>
      ))}
      {/* ruffled neck */}
      <path d="M62 104 Q58 82 74 86 Q80 70 96 80 Q106 66 118 80 Q134 70 138 88 Q154 84 146 106 Q120 118 100 116 Q78 116 62 104Z" fill={`url(#${p}red)`} />
      <path d="M70 98 Q96 106 140 98" fill="none" stroke="#3a0a04" strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" />
      {/* rope */}
      <path d="M60 110 Q100 126 148 110" fill="none" stroke={`url(#${p}gold)`} strokeWidth="9" strokeLinecap="round" />
      <path d="M60 110 Q100 126 148 110" fill="none" stroke="#7a3a10" strokeWidth="9" strokeLinecap="round" strokeDasharray="4 6" opacity="0.6" />
      <path d="M100 118 Q88 140 80 150 M104 118 Q114 140 124 148" fill="none" stroke={`url(#${p}gold)`} strokeWidth="7" strokeLinecap="round" />
      <Shine p={p} cx={70} cy={128} rx={16} ry={7} o={0.45} />
    </>
  ),

  gift: (p) => (
    <>
      <Shadow p={p} />
      <rect x="40" y="88" width="120" height="88" rx="18" fill={`url(#${p}cream)`} />
      <rect x="32" y="66" width="136" height="36" rx="14" fill={`url(#${p}cream)`} />
      <rect x="88" y="66" width="24" height="110" fill={`url(#${p}red)`} />
      <path d="M100 66 C80 30 44 30 52 54 C58 70 84 70 100 66Z" fill={`url(#${p}red)`} />
      <path d="M100 66 C120 30 156 30 148 54 C142 70 116 70 100 66Z" fill={`url(#${p}red)`} />
      <circle cx="100" cy="66" r="10" fill={`url(#${p}red)`} />
      <Shine p={p} cx={58} cy={78} rx={18} ry={5} o={0.8} rot={0} />
      <Shine p={p} cx={64} cy={42} rx={8} ry={4} o={0.6} />
    </>
  ),

  teahouse: (p) => (
    <>
      {/* snow base */}
      <path d="M22 168 Q30 140 70 146 Q100 132 138 144 Q178 140 180 168 Q170 188 100 188 Q32 188 22 168Z" fill={`url(#${p}snow)`} />
      {/* spout */}
      <Cane p={p} d="M66 120 Q40 112 34 86" w={14} />
      {/* body */}
      <path d="M62 152 Q52 110 70 86 Q100 70 130 86 Q150 110 140 152 Q100 164 62 152Z" fill={`url(#${p}red)`} />
      {/* handle */}
      <path d="M140 104 Q168 104 162 128 Q158 142 142 140" fill="none" stroke={`url(#${p}red)`} strokeWidth="11" strokeLinecap="round" />
      {/* green collar */}
      <path d="M66 90 Q100 74 134 90 L132 100 Q100 86 68 100Z" fill={`url(#${p}green)`} />
      <path d="M68 96 Q100 82 132 96" stroke="#fff" strokeWidth="3" strokeDasharray="6 6" fill="none" opacity="0.8" />
      {/* snowy lid */}
      <path d="M64 86 Q66 56 100 52 Q134 56 136 86 Q100 76 64 86Z" fill={`url(#${p}snow)`} />
      <circle cx="100" cy="46" r="7" fill={`url(#${p}cream)`} />
      {/* window */}
      <rect x="86" y="112" width="30" height="34" rx="12" fill="#FFD37A" />
      <path d="M101 112 V146 M86 128 H116" stroke="#B4210F" strokeWidth="3" />
      <rect x="86" y="112" width="30" height="34" rx="12" fill="none" stroke="#7E1608" strokeWidth="3" />
      <Shine p={p} cx={76} cy={112} rx={6} ry={16} o={0.5} rot={10} />
      {/* bubbles */}
      <circle cx="40" cy="62" r="6" fill="#fff" opacity="0.5" />
      <circle cx="52" cy="48" r="4" fill="#fff" opacity="0.4" />
    </>
  ),

  book: (p) => (
    <>
      <Shadow p={p} />
      <rect x="38" y="138" width="128" height="30" rx="8" fill={`url(#${p}green)`} />
      <rect x="44" y="142" width="116" height="20" rx="4" fill="#FFF4E8" />
      <rect x="46" y="104" width="116" height="34" rx="8" fill={`url(#${p}red)`} transform="rotate(-6 104 121)" />
      <rect x="54" y="108" width="100" height="24" rx="4" fill="#FFF4E8" transform="rotate(-6 104 121)" />
      <rect x="54" y="70" width="98" height="34" rx="8" fill={`url(#${p}gold)`} transform="rotate(4 103 87)" />
      <rect x="62" y="74" width="82" height="24" rx="4" fill="#FFF4E8" transform="rotate(4 103 87)" />
      <path d="M120 72 L120 52 L128 60 L136 52 L136 74" fill={`url(#${p}red)`} />
      <Shine p={p} cx={60} cy={142} rx={14} ry={3} o={0.7} rot={0} />
    </>
  ),

  gamepad: (p) => (
    <>
      <Shadow p={p} />
      <path d="M40 96 Q48 70 80 76 L120 76 Q152 70 160 96 L174 146 Q178 170 156 166 Q142 162 132 140 L68 140 Q58 162 44 166 Q22 170 26 146Z" fill={`url(#${p}green)`} />
      <rect x="54" y="98" width="30" height="10" rx="4" fill="#FFF4E8" />
      <rect x="64" y="88" width="10" height="30" rx="4" fill="#FFF4E8" />
      <circle cx="132" cy="94" r="8" fill={`url(#${p}red)`} />
      <circle cx="148" cy="108" r="8" fill={`url(#${p}gold)`} />
      <circle cx="116" cy="108" r="8" fill={`url(#${p}cream)`} />
      <circle cx="132" cy="122" r="8" fill={`url(#${p}red)`} />
      <Shine p={p} cx={64} cy={84} rx={16} ry={5} o={0.55} rot={-10} />
    </>
  ),

  mug: (p) => (
    <>
      <Shadow p={p} />
      <path d="M150 100 Q182 100 178 128 Q174 152 146 150" fill="none" stroke={`url(#${p}cream)`} strokeWidth="13" strokeLinecap="round" />
      <path d="M48 82 L152 82 L146 160 Q144 178 124 178 L76 178 Q56 178 54 160Z" fill={`url(#${p}cream)`} />
      <ellipse cx="100" cy="82" rx="52" ry="12" fill="#5A3020" />
      <ellipse cx="100" cy="84" rx="44" ry="8" fill={`url(#${p}choc)`} />
      <rect x="70" y="66" width="22" height="20" rx="7" fill="#FFF8F1" transform="rotate(-14 81 76)" />
      <rect x="98" y="62" width="22" height="20" rx="7" fill="#FFE1EA" transform="rotate(10 109 72)" />
      <path d="M54 118 Q100 130 148 118 L147 134 Q100 146 53 134Z" fill={`url(#${p}red)`} />
      <path d="M84 50 Q76 38 86 28 M110 46 Q102 34 112 22" stroke="#fff" strokeOpacity="0.6" strokeWidth="5" strokeLinecap="round" fill="none" />
      <Shine p={p} cx={64} cy={110} rx={6} ry={20} o={0.7} rot={0} />
    </>
  ),

  headphones: (p) => (
    <>
      <Shadow p={p} />
      <path d="M44 120 Q40 46 100 42 Q160 46 156 120" fill="none" stroke={`url(#${p}violet)`} strokeWidth="16" strokeLinecap="round" />
      <rect x="28" y="104" width="44" height="66" rx="20" fill={`url(#${p}violet)`} />
      <rect x="128" y="104" width="44" height="66" rx="20" fill={`url(#${p}violet)`} />
      <rect x="56" y="112" width="18" height="50" rx="8" fill={`url(#${p}cream)`} />
      <rect x="126" y="112" width="18" height="50" rx="8" fill={`url(#${p}cream)`} />
      <Shine p={p} cx={40} cy={118} rx={5} ry={14} o={0.6} rot={0} />
      <Shine p={p} cx={70} cy={60} rx={16} ry={4} o={0.5} rot={-25} />
    </>
  ),

  vinyl: (p) => (
    <>
      <Shadow p={p} />
      <circle cx="100" cy="102" r="74" fill="#1A1210" />
      {[64, 54, 44].map((r) => (
        <circle key={r} cx="100" cy="102" r={r} fill="none" stroke="#3B2C28" strokeWidth="2" />
      ))}
      <circle cx="100" cy="102" r="26" fill={`url(#${p}red)`} />
      <circle cx="100" cy="102" r="4" fill="#1A1210" />
      <path d="M48 60 Q70 38 100 34" stroke="#fff" strokeOpacity="0.35" strokeWidth="8" strokeLinecap="round" fill="none" filter={`url(#${p}blur)`} />
    </>
  ),

  perfume: (p) => (
    <>
      <Shadow p={p} rx={48} />
      <rect x="82" y="36" width="36" height="28" rx="8" fill={`url(#${p}gold)`} />
      <rect x="90" y="60" width="20" height="14" fill={`url(#${p}gold)`} />
      <rect x="46" y="72" width="108" height="104" rx="30" fill={`url(#${p}glass)`} />
      <rect x="58" y="110" width="84" height="56" rx="18" fill={`url(#${p}pink)`} opacity="0.9" />
      <rect x="72" y="96" width="56" height="22" rx="6" fill="#FFF8F1" />
      <Shine p={p} cx={64} cy={100} rx={6} ry={22} o={0.85} rot={0} />
    </>
  ),

  mitten: (p) => (
    <>
      <Shadow p={p} rx={52} />
      <Cane p={p} d="M128 150 L128 70 Q128 46 150 46 Q170 46 170 66" w={14} />
      <path d="M56 70 Q56 40 88 40 Q120 40 120 72 L120 98 Q138 88 146 100 Q154 114 130 132 L118 140 L118 150 L58 150Z" fill={`url(#${p}green)`} />
      <rect x="52" y="146" width="72" height="30" rx="12" fill={`url(#${p}snow)`} />
      <path d="M66 82 L78 94 L90 82 L102 94" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <Shine p={p} cx={70} cy={60} rx={6} ry={14} o={0.6} rot={10} />
    </>
  ),

  palette: (p) => (
    <>
      <Shadow p={p} />
      <path d="M100 38 Q170 38 174 100 Q176 140 140 140 Q120 140 124 158 Q126 178 98 176 Q30 172 28 108 Q28 40 100 38Z" fill={`url(#${p}cream)`} />
      <circle cx="68" cy="84" r="12" fill={`url(#${p}red)`} />
      <circle cx="104" cy="66" r="12" fill={`url(#${p}gold)`} />
      <circle cx="140" cy="82" r="12" fill={`url(#${p}green)`} />
      <circle cx="62" cy="124" r="12" fill={`url(#${p}violet)`} />
      <circle cx="96" cy="152" r="9" fill="#5A3020" opacity="0.25" />
      <path d="M150 168 L118 112" stroke="#8A5A44" strokeWidth="8" strokeLinecap="round" />
      <path d="M118 112 L110 98" stroke={`url(#${p}red)`} strokeWidth="10" strokeLinecap="round" />
    </>
  ),

  ball: (p) => (
    <>
      <Shadow p={p} rx={54} />
      <circle cx="100" cy="104" r="68" fill={`url(#${p}cream)`} />
      <path d="M44 80 Q100 100 156 80" stroke={`url(#${p}red)`} strokeWidth="12" fill="none" />
      <path d="M50 140 Q100 116 150 140" stroke={`url(#${p}green)`} strokeWidth="12" fill="none" />
      <path d="M100 36 Q76 104 100 172" stroke="#D9A988" strokeWidth="4" fill="none" />
      <Shine p={p} cx={70} cy={66} rx={18} ry={8} o={0.8} />
    </>
  ),

  star: (p) => (
    <>
      <path
        d="M100 26 Q110 26 116 50 L124 76 Q126 82 132 82 L160 84 Q178 86 166 100 L144 118 Q140 122 142 128 L150 156 Q154 174 138 166 L112 150 Q106 146 100 150 L74 166 Q58 174 62 156 L70 128 Q72 122 68 118 L46 100 Q34 86 52 84 L80 82 Q86 82 88 76 L96 50 Q100 26 100 26Z"
        fill={`url(#${p}snow)`}
      />
      <Shine p={p} cx={86} cy={74} rx={10} ry={5} o={0.9} />
    </>
  ),

  cane: (p) => (
    <>
      <Shadow p={p} rx={30} />
      <Cane p={p} d="M90 176 L90 70 Q90 34 120 34 Q148 34 148 64 L148 76" w={24} />
    </>
  ),

  bauble: (p) => (
    <>
      <Shadow p={p} rx={46} />
      <path d="M100 44 Q94 24 108 22" stroke="#C9A227" strokeWidth="4" fill="none" />
      <rect x="86" y="40" width="28" height="18" rx="5" fill={`url(#${p}gold)`} />
      <circle cx="100" cy="114" r="60" fill={`url(#${p}red)`} />
      <path d="M44 114 Q100 132 156 114" stroke="#FFE2CB" strokeWidth="8" fill="none" opacity="0.9" />
      <Shine p={p} cx={76} cy={86} rx={18} ry={9} o={0.7} />
    </>
  ),

  envelope: (p) => (
    <>
      <Shadow p={p} />
      <rect x="26" y="62" width="148" height="108" rx="18" fill={`url(#${p}cream)`} />
      <path d="M26 80 L100 128 L174 80" fill="none" stroke="#D9A988" strokeWidth="4" />
      <path d="M30 70 L100 118 L170 70 Q170 62 160 62 L40 62 Q30 62 30 70Z" fill={`url(#${p}red)`} />
      <circle cx="100" cy="112" r="14" fill={`url(#${p}gold)`} />
    </>
  ),
}

/**
 * Pre-rendered 3D assets provided by the CEO (src/assets/3d, optimized by
 * scripts/optimize-assets.mjs). Keys not listed here fall back to the vector set
 * until matching renders exist (vinyl, perfume, palette, ball).
 */
const RENDERS: Record<string, string> = Object.fromEntries(
  Object.entries(import.meta.glob('../../assets/3d/*.webp', { eager: true, import: 'default' }) as Record<string, string>).map(
    ([path, url]) => [path.split('/').pop()!.replace('.webp', ''), url],
  ),
)

/** 256 px thumbnails (scripts/make-small-renders.mjs) for small numeric sizes. */
const SMALL: Record<string, string> = Object.fromEntries(
  Object.entries(import.meta.glob('../../assets/3d/sm/*.webp', { eager: true, import: 'default' }) as Record<string, string>).map(
    ([path, url]) => [path.split('/').pop()!.replace('.webp', ''), url],
  ),
)
/** ≤ 85 css px fits a 256 px image even at DPR 3. */
const SMALL_MAX = 85

/** Old vector keys → 3D render keys. */
const ALIAS: Record<string, string> = {
  teahouse: 'house',
  sack: 'santa',
  mitten: 'stocking',
}

/** Direct URL of a 3D render (for compositions that need the native aspect ratio). */
export function artUrl(name: string): string | undefined {
  return RENDERS[ALIAS[name] ?? name]
}

export function hasRender(name: string) {
  return Boolean(RENDERS[ALIAS[name] ?? name])
}

export function Art({ name, size = 160, className, noShadow, eager }: Props & { eager?: boolean }) {
  const key = ALIAS[name] ?? name
  const url = (typeof size === 'number' && size <= SMALL_MAX && SMALL[key]) || RENDERS[key]
  if (url) {
    return (
      <span
        className={`relative inline-flex shrink-0 items-center justify-center ${className ?? ''}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {!noShadow && (
          <span className="absolute bottom-[3%] left-1/2 h-[9%] w-[62%] -translate-x-1/2 rounded-[50%] bg-black/30 blur-[6px]" />
        )}
        <img
          src={url}
          alt=""
          draggable={false}
          decoding="async"
          loading={eager ? 'eager' : 'lazy'}
          className="relative h-full w-full select-none object-contain"
        />
      </span>
    )
  }
  return <VectorArt name={name} size={size} className={className} noShadow={noShadow} />
}

function VectorArt({ name, size = 160, className, noShadow }: Props) {
  const p = 'a' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const render = ART[name as ArtName] ?? ART.gift!
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      style={noShadow ? { overflow: 'visible' } : { overflow: 'visible' }}
    >
      <Defs p={p} />
      {render(p)}
    </svg>
  )
}
