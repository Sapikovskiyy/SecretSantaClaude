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
import { App } from './App'
import { connectTelegram, initTelegram, launchedInTelegram, tgUserName } from './lib/telegram'
import { useDemo } from './data/demoStore'

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
  // Demo profile name was created before the SDK was bound.
  const name = tgUserName()
  if (name && useDemo.getState().me.name === 'Вы') useDemo.setState((s) => ({ me: { ...s.me, name } }))

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MotionConfig>
    </StrictMode>,
  )
})
