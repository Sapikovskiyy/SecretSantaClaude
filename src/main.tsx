import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { MotionConfig } from 'motion/react'
// Inter (OFL-1.1) is the fallback for Android/Windows. On Apple devices the stack
// resolves to the system San Francisco font first, so these files are never fetched there.
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import './styles/index.css'
import { lazy, Suspense } from 'react'
import { connectTelegram, initTelegram, launchedInTelegram } from './lib/telegram'
import { IS_DEMO } from './lib/mode'
import { ServerNotConnected } from './screens/ServerNotConnected'
import { DEFAULT_TRANSITION } from './motion/tokens'

// The demo app (local store + seed data) is a separate chunk: production builds never ship it.
const App = IS_DEMO ? lazy(() => import('./App').then((m) => ({ default: m.App }))) : () => null

/** Inside Telegram the SDK must be bound before the first render; elsewhere we never wait for it. */
function whenSdkReady(): Promise<void> {
  if (window.Telegram?.WebApp || !launchedInTelegram()) return Promise.resolve()
  const s = document.getElementById('tg-sdk')
  return new Promise((resolve) => {
    s?.addEventListener('load', () => resolve(), { once: true })
    s?.addEventListener('error', () => resolve(), { once: true })
    setTimeout(resolve, 5000) // never hang on a blocked telegram.org
  })
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}

whenSdkReady().then(() => {
  connectTelegram()
  initTelegram()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MotionConfig reducedMotion="user" transition={DEFAULT_TRANSITION}>
        <BrowserRouter>
          {IS_DEMO ? (
            <Suspense fallback={null}>
              <App />
            </Suspense>
          ) : (
            <ServerNotConnected />
          )}
        </BrowserRouter>
      </MotionConfig>
    </StrictMode>,
  )
})
