// Brand tokens — mirrored from the app's src/styles/index.css (@theme). Keep in sync.
export const color = {
  night: '#120a07', // near-black chocolate (trailer-only deepest tone)
  bark: '#211715',
  cocoa: '#2d1d16',
  truffle: '#392a25',
  taupeSoft: '#bda99e',
  ember: '#d93624',
  emberBright: '#ef4930',
  emberDeep: '#8e1f0e',
  emberGlow: '#ff6a45',
  pine: '#006b43',
  pineDeep: '#06452f',
  pineGlow: '#1f9a62',
  marzipan: '#ffe4ce',
  creamLight: '#fff2e5',
  snow: '#fff8f1',
  gold: '#c99b61',
  ink: '#281d19',
  warmLight: '#ffb27a', // key light tint
} as const

// SF Pro where the OS has it, bundled Inter (OFL) everywhere else — never bundle SF Pro.
export const fontFamily = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, 'Segoe UI', sans-serif"

export const type = {
  // sizes are fractions of the frame's short side, so 9:16 and 16:9 stay proportional
  hero: 0.125, // ≈135 px on 1080
  title: 0.105,
  subtitle: 0.046,
  caption: 0.034,
  weightHero: 700,
  weightTitle: 650,
  tracking: '-0.035em',
} as const
