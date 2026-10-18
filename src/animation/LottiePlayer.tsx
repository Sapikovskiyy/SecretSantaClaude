/**
 * dotLottie runtime wrapper (official @lottiefiles/dotlottie-react). Loaded lazily via ./index.
 * For short feedback only (success, loading, small festive effects) — not ambient loops.
 * - Self-hosted WASM (no third-party CDN).
 * - Under prefers-reduced-motion: no playback, the static fallback is shown instead.
 * - Load errors fall back to the static content; the player is destroyed on unmount.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useReducedMotion } from 'motion/react'
import { DotLottieReact, setWasmUrl } from '@lottiefiles/dotlottie-react'
import type { DotLottie } from '@lottiefiles/dotlottie-web'
import dotLottieWasmUrl from '@lottiefiles/dotlottie-web/dotlottie-player.wasm?url'

setWasmUrl(dotLottieWasmUrl)

export interface LottiePlayerProps {
  src: string
  fallback: ReactNode
  loop?: boolean
  autoplay?: boolean
  speed?: number
  className?: string
  onComplete?: () => void
}

export default function LottiePlayer({ src, fallback, loop = false, autoplay = true, speed = 1, className, onComplete }: LottiePlayerProps) {
  const reduce = useReducedMotion()
  const [failed, setFailed] = useState(false)
  const instance = useRef<DotLottie | null>(null)
  const completeRef = useRef(onComplete)
  completeRef.current = onComplete

  useEffect(() => () => instance.current?.destroy(), [])

  if (reduce || failed) return <>{fallback}</>
  return (
    <DotLottieReact
      src={src}
      loop={loop}
      autoplay={autoplay}
      speed={speed}
      className={className}
      aria-hidden
      dotLottieRefCallback={(d) => {
        instance.current = d
        if (!d) return
        d.addEventListener('loadError', () => setFailed(true))
        d.addEventListener('complete', () => completeRef.current?.())
      }}
    />
  )
}
