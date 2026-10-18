/**
 * Public entry for asset-based animations. Both runtimes are code-split:
 * nothing is downloaded until a screen renders a player WITH a real asset.
 *
 *   Motion for React  → all interface motion (src/motion)
 *   Rive              → complex interactive assets (Gift AI robot, signature reveal)
 *   dotLottie         → short pre-rendered feedback (success, loading, small festive effects)
 *   CSS               → trivial loops & press physics
 */
import { Suspense, lazy, type ReactNode } from 'react'
import type { RivePlayerProps } from './RivePlayer'
import type { LottiePlayerProps } from './LottiePlayer'
import { lottieAsset, riveAsset, type LottieKey, type RiveKey } from './assets'

const RivePlayer = lazy(() => import('./RivePlayer'))
const LottiePlayer = lazy(() => import('./LottiePlayer'))

/** Renders a Rive asset by key, or just the static fallback if the asset doesn't exist yet. */
export function RiveAnimation({ asset, fallback, ...rest }: Omit<RivePlayerProps, 'src' | 'fallback'> & { asset: RiveKey; fallback: ReactNode }) {
  const src = riveAsset(asset)
  if (!src) return <>{fallback}</>
  return (
    <Suspense fallback={fallback}>
      <RivePlayer src={src} fallback={fallback} {...rest} />
    </Suspense>
  )
}

/** Renders a dotLottie asset by key, or the static fallback if missing / reduced motion. */
export function LottieAnimation({ asset, fallback, ...rest }: Omit<LottiePlayerProps, 'src' | 'fallback'> & { asset: LottieKey; fallback: ReactNode }) {
  const src = lottieAsset(asset)
  if (!src) return <>{fallback}</>
  return (
    <Suspense fallback={fallback}>
      <LottiePlayer src={src} fallback={fallback} {...rest} />
    </Suspense>
  )
}

export { riveAsset, lottieAsset }
export type { RiveKey, LottieKey }
