/**
 * iOS-style navigation via the View Transitions API.
 *
 * The router location changes first; Routes keeps rendering the *previous* location until the
 * browser has captured a snapshot of it, then the new screen is committed synchronously inside
 * `document.startViewTransition`. CSS (index.css, «View transitions») animates the two snapshots:
 *   forward — new screen slides in from the right over the old one, which drifts left and dims;
 *   back    — mirror image; tab — quick cross-fade between dock tabs.
 * No duplicate DOM (snapshots are images), the dock keeps its own name so it never slides.
 * Unsupported browsers and reduced motion: instant switch + the Screen enter fade.
 */
import { useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, type Location } from 'react-router'
import { whenScreensReady } from '@/lazyScreens'

type Doc = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } }

export const supportsViewTransitions = typeof document !== 'undefined' && typeof (document as Doc).startViewTransition === 'function'

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** True when screen changes are animated by view transitions (Screen then skips its own fade). */
export const usesViewTransitions = () => supportsViewTransitions && !reducedMotion()

export function useTransitionLocation(tabRoutes: string[]): Location {
  const location = useLocation()
  const [shown, setShown] = useState(location)
  const stack = useRef<string[]>([location.pathname])
  const mountedAt = useRef(performance.now())
  const latest = useRef(location)
  latest.current = location

  useLayoutEffect(() => {
    if (location === shown) return
    const from = shown.pathname
    const to = location.pathname
    const s = stack.current
    const back = s.length > 1 && s[s.length - 2] === to
    if (back) s.pop()
    else if (from !== to) s.push(to)

    // First paint redirects (/ → /home) and same-path updates switch instantly.
    const instant = from === to || performance.now() - mountedAt.current < 400 || !usesViewTransitions()
    if (instant) {
      setShown(location)
      return
    }
    const kind = tabRoutes.includes(from) && tabRoutes.includes(to) ? 'tab' : back ? 'back' : 'forward'
    const root = document.documentElement
    const start = () => {
      root.dataset.nav = kind
      const vt = (document as Doc).startViewTransition!(() => flushSync(() => setShown(location)))
      vt.finished.finally(() => {
        if (root.dataset.nav === kind) delete root.dataset.nav
      })
    }
    // The new screen's code must be loaded first, or the snapshot would be an empty fallback.
    // Normally already prefetched; never wait more than 400 ms.
    let started = false
    const go = () => {
      if (started) return
      started = true
      if (latest.current === location) start() // a newer navigation will run its own transition
    }
    whenScreensReady().then(go)
    window.setTimeout(go, 400)
  }, [location]) // eslint-disable-line react-hooks/exhaustive-deps

  return shown
}
