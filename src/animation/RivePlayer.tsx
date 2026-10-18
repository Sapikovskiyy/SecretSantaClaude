/**
 * Rive runtime wrapper (official @rive-app/react-canvas). Loaded lazily via ./index.
 * - Self-hosted WASM (no third-party CDN — important for Telegram WebView in RU).
 * - Pauses offscreen (IntersectionObserver) and under prefers-reduced-motion.
 * - Cleanup of the Rive instance and canvas is handled by useRive on unmount.
 * - Never throws: load errors switch to the provided static fallback.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { useReducedMotion } from 'motion/react'
import { RuntimeLoader, useRive, useStateMachineInput, type Rive } from '@rive-app/react-canvas'
import riveWasmUrl from '@rive-app/canvas/rive.wasm?url'

RuntimeLoader.setWasmUrl(riveWasmUrl)

export interface RivePlayerProps {
  src: string
  stateMachine?: string
  artboard?: string
  /** Static illustration shown while loading and on error. */
  fallback: ReactNode
  className?: string
  /** Boolean input to drive from React, e.g. { name: 'thinking', value: loading }. */
  boolInput?: { name: string; value: boolean }
  onReady?: (rive: Rive) => void
  label?: string
}

export default function RivePlayer({ src, stateMachine, artboard, fallback, className, boolInput, onReady, label }: RivePlayerProps) {
  const reduce = useReducedMotion()
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const { rive, RiveComponent } = useRive(
    {
      src,
      artboard,
      stateMachines: stateMachine,
      autoplay: !reduce,
      onLoad: () => setStatus('ready'),
      onLoadError: () => setStatus('error'),
    },
    { useDevicePixelRatio: true, shouldUseIntersectionObserver: true },
  )

  const input = useStateMachineInput(rive, stateMachine, boolInput?.name)
  useEffect(() => {
    if (input && boolInput) input.value = boolInput.value
  }, [input, boolInput])

  useEffect(() => {
    if (rive && status === 'ready') onReady?.(rive)
  }, [rive, status, onReady])

  // Respect reduced motion even if it changes while mounted.
  useEffect(() => {
    if (!rive) return
    if (reduce) rive.pause()
    else rive.play()
  }, [rive, reduce])

  if (status === 'error') return <>{fallback}</>
  return (
    <div className={`relative ${className ?? ''}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {status === 'loading' && <div className="absolute inset-0 flex items-center justify-center">{fallback}</div>}
      <RiveComponent className={`h-full w-full transition-opacity duration-300 ${status === 'ready' ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  )
}
