type Bezier = [number, number, number, number];
export const motionTokens = {
  duration: { instant: 0.12, fast: 0.18, normal: 0.28, slow: 0.4, reveal: 1.8 },
  easing: { standard: [0.22, 1, 0.36, 1] as Bezier, smooth: [0.4, 0, 0.2, 1] as Bezier },
  scale: { pressed: 0.97, entrance: 0.96 },
  spring: { sheet: { type: 'spring' as const, stiffness: 380, damping: 38 } },
};
