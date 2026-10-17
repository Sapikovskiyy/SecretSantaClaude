import type { ComponentType, SVGProps } from 'react';
import type { CategoryId } from '@/types';

type P = SVGProps<SVGSVGElement>;
const G = ({ id, a, b }: { id: string; a: string; b: string }) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
);
const Base = ({ children, ...p }: P) => (
  <svg viewBox="0 0 200 200" role="img" aria-hidden="true" {...p}>
    <defs>
      <G id="gRed" a="#FF6A4D" b="#8E1F10" /><G id="gGreen" a="#2FB57A" b="#044D32" />
      <G id="gCream" a="#FFF9F2" b="#F2C9A8" /><G id="gGold" a="#FFE29A" b="#C9923A" />
      <G id="gDark" a="#5A4A42" b="#1E1511" /><G id="gBlue" a="#7FB6FF" b="#2A5BB0" />
      <filter id="soft"><feDropShadow dx="0" dy="9" stdDeviation="7" floodColor="#000" floodOpacity=".35" /></filter>
    </defs>
    <g filter="url(#soft)">{children}</g>
  </svg>
);
const Shine = ({ x, y, rx = 14, ry = 6 }: { x: number; y: number; rx?: number; ry?: number }) => (
  <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#fff" opacity=".35" transform={`rotate(-30 ${x} ${y})`} />
);

export const GiftArt = (p: P) => (
  <Base {...p}>
    <rect x="38" y="84" width="124" height="88" rx="18" fill="url(#gRed)" />
    <rect x="30" y="62" width="140" height="34" rx="14" fill="url(#gRed)" />
    <rect x="92" y="62" width="16" height="110" fill="url(#gGold)" />
    <ellipse cx="78" cy="50" rx="26" ry="15" fill="url(#gGold)" transform="rotate(-20 78 50)" />
    <ellipse cx="122" cy="50" rx="26" ry="15" fill="url(#gGold)" transform="rotate(20 122 50)" />
    <Shine x={58} y={110} />
  </Base>
);
export const CaneArt = (p: P) => (
  <Base {...p}>
    <path d="M72 176 V76 a34 34 0 0 1 68 0" fill="none" stroke="#FFF9F2" strokeWidth="22" strokeLinecap="round" />
    <path d="M72 176 V76 a34 34 0 0 1 68 0" fill="none" stroke="#D5361C" strokeWidth="22" strokeDasharray="14 18" />
  </Base>
);
export const SackArt = (p: P) => (
  <Base {...p}>
    <path d="M96 30 v52" stroke="#FFF9F2" strokeWidth="14" strokeLinecap="round" />
    <path d="M96 30 v52" stroke="#D5361C" strokeWidth="14" strokeDasharray="9 11" />
    <path d="M96 30 a22 22 0 0 1 44 0" fill="none" stroke="#FFF9F2" strokeWidth="14" strokeLinecap="round" />
    <ellipse cx="100" cy="140" rx="70" ry="52" fill="url(#gRed)" />
    <path d="M52 92 q48 -30 96 0 l-8 18 q-40 -18 -80 0 z" fill="#8E1F10" />
    <path d="M60 104 q40 16 80 0" fill="none" stroke="url(#gGold)" strokeWidth="9" strokeDasharray="6 5" />
    {[[70, 140], [112, 128], [96, 165], [132, 158], [78, 118]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="8" fill="#E6B96C" />)}
    <Shine x={64} y={130} rx={18} ry={8} />
  </Base>
);
export const HouseArt = (p: P) => (
  <Base {...p}>
    <ellipse cx="100" cy="162" rx="76" ry="22" fill="url(#gCream)" />
    <rect x="52" y="76" width="96" height="84" rx="24" fill="url(#gRed)" />
    <path d="M44 84 q56 -44 112 0 q-8 14 -20 8 q-36 -14 -72 0 q-12 6 -20 -8z" fill="url(#gCream)" />
    <rect x="86" y="104" width="28" height="34" rx="9" fill="url(#gGold)" />
    <Shine x={70} y={110} />
  </Base>
);
export const BookArt = (p: P) => (
  <Base {...p}>
    <rect x="54" y="30" width="96" height="140" rx="12" fill="url(#gGreen)" />
    <rect x="62" y="38" width="84" height="124" rx="8" fill="none" stroke="#E6B96C" strokeWidth="3" />
    <rect x="76" y="62" width="56" height="8" rx="4" fill="url(#gGold)" /><rect x="76" y="80" width="40" height="8" rx="4" fill="url(#gGold)" />
    <rect x="144" y="36" width="10" height="128" rx="3" fill="url(#gCream)" />
  </Base>
);
export const PadArt = (p: P) => (
  <Base {...p}>
    <path d="M44 76 q56 -24 112 0 q22 14 20 50 q-4 30 -28 20 l-20 -18 h-56 l-20 18 q-24 10 -28 -20 q-2 -36 20 -50z" fill="url(#gDark)" />
    <rect x="62" y="92" width="26" height="8" rx="3" fill="#FFE4CE" /><rect x="71" y="83" width="8" height="26" rx="3" fill="#FFE4CE" />
    <circle cx="126" cy="90" r="7" fill="#D5361C" /><circle cx="144" cy="104" r="7" fill="#E6B96C" /><circle cx="126" cy="116" r="7" fill="#2FB57A" />
    <Shine x={70} y={80} />
  </Base>
);
export const PhonesArt = (p: P) => (
  <Base {...p}>
    <path d="M52 112 V96 a48 48 0 0 1 96 0 v16" fill="none" stroke="url(#gDark)" strokeWidth="14" strokeLinecap="round" />
    <rect x="38" y="104" width="32" height="56" rx="16" fill="url(#gRed)" /><rect x="130" y="104" width="32" height="56" rx="16" fill="url(#gRed)" />
  </Base>
);
export const MugArt = (p: P) => (
  <Base {...p}>
    <path d="M144 88 h10 a24 24 0 0 1 0 48 h-14" fill="none" stroke="url(#gCream)" strokeWidth="12" />
    <rect x="46" y="70" width="104" height="100" rx="22" fill="url(#gCream)" />
    <rect x="46" y="70" width="104" height="26" rx="13" fill="#6B3B22" />
    <path d="M78 52 q-10 -12 0 -22 M106 52 q-10 -12 0 -22" fill="none" stroke="#FFF9F2" strokeWidth="6" strokeLinecap="round" opacity=".7" />
    <rect x="62" y="116" width="72" height="14" rx="7" fill="url(#gRed)" />
  </Base>
);
export const BottleArt = (p: P) => (
  <Base {...p}>
    <rect x="82" y="26" width="36" height="30" rx="8" fill="url(#gGold)" />
    <rect x="90" y="52" width="20" height="16" fill="url(#gCream)" />
    <rect x="56" y="66" width="88" height="106" rx="26" fill="url(#gRed)" opacity=".95" />
    <rect x="72" y="104" width="56" height="34" rx="8" fill="url(#gCream)" />
    <Shine x={74} y={88} />
  </Base>
);
export const HatArt = (p: P) => (
  <Base {...p}>
    <path d="M52 140 q6 -86 82 -96 q-22 28 -4 96z" fill="url(#gRed)" />
    <rect x="40" y="132" width="132" height="32" rx="16" fill="url(#gCream)" />
    <circle cx="140" cy="44" r="16" fill="url(#gCream)" />
  </Base>
);
export const PaletteArt = (p: P) => (
  <Base {...p}>
    <path d="M100 36 c-50 0 -72 40 -62 76 c10 36 52 48 60 28 c6 -16 24 -6 38 -4 c26 4 36 -34 22 -58 c-14 -24 -36 -42 -58 -42z" fill="url(#gCream)" />
    {[['#D5361C', 76, 76], ['#E6B96C', 108, 64], ['#2FB57A', 134, 86], ['#7FB6FF', 66, 112]].map(([c, x, y], i) => <circle key={i} cx={x as number} cy={y as number} r="11" fill={c as string} />)}
  </Base>
);
export const BallArt = (p: P) => (
  <Base {...p}>
    <circle cx="100" cy="100" r="66" fill="url(#gBlue)" />
    <path d="M34 100 q66 -40 132 0 M34 100 q66 40 132 0 M100 34 v132" fill="none" stroke="#FFF9F2" strokeWidth="5" opacity=".8" />
    <Shine x={78} y={68} rx={18} ry={8} />
  </Base>
);
export const StarArt = (p: P) => (
  <Base {...p}><path d="M100 24 l22 50 54 6 -40 36 12 54 -48 -28 -48 28 12 -54 -40 -36 54 -6z" fill="url(#gCream)" /></Base>
);

export const catArt: Record<CategoryId, ComponentType<P>> = {
  books: BookArt, games: PadArt, tech: PhonesArt, coffee: MugArt, beauty: BottleArt,
  fashion: HatArt, art: PaletteArt, home: HouseArt, sports: BallArt, other: GiftArt,
};

export const GiftBody = (p: P) => (
  <Base {...p}>
    <rect x="38" y="84" width="124" height="88" rx="18" fill="url(#gRed)" />
    <rect x="92" y="84" width="16" height="88" fill="url(#gGold)" />
  </Base>
);
export const GiftLid = (p: P) => (
  <Base {...p}>
    <rect x="30" y="62" width="140" height="34" rx="14" fill="url(#gRed)" />
    <rect x="92" y="62" width="16" height="34" fill="url(#gGold)" />
    <ellipse cx="78" cy="50" rx="26" ry="15" fill="url(#gGold)" transform="rotate(-20 78 50)" />
    <ellipse cx="122" cy="50" rx="26" ry="15" fill="url(#gGold)" transform="rotate(20 122 50)" />
  </Base>
);
