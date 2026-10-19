/**
 * Thin typed wrapper over the official telegram-web-app.js SDK.
 * Every call is optional-chained so the same build runs in a normal browser.
 *
 * SECURITY: initDataUnsafe is used only for UI hints (name, start_param).
 * Identity must be verified server-side from raw initData (Phase 2).
 */

interface TgButton {
  show(): void
  hide(): void
  onClick(cb: () => void): void
  offClick(cb: () => void): void
}

interface TgWebApp {
  initData: string
  initDataUnsafe: {
    user?: { id: number; first_name: string; last_name?: string; username?: string; photo_url?: string }
    start_param?: string
  }
  platform: string
  version: string
  ready(): void
  expand(): void
  isVersionAtLeast?(v: string): boolean
  setHeaderColor?(c: string): void
  setBackgroundColor?(c: string): void
  setBottomBarColor?(c: string): void
  disableVerticalSwipes?(): void
  openTelegramLink?(url: string): void
  openLink?(url: string): void
  BackButton?: TgButton
  HapticFeedback?: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
    notificationOccurred(type: 'error' | 'success' | 'warning'): void
    selectionChanged(): void
  }
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp }
  }
}

/*
 * The SDK script loads async (index.html) so it never blocks first paint outside Telegram.
 * These are live bindings: main.tsx calls connectTelegram() once the SDK is available
 * (inside Telegram, before the first render), and every import sees the updated values.
 */
export let tg: TgWebApp | undefined
/** True only when launched from Telegram (initData present). */
export let isTelegram = false

/** Likely a Telegram launch: launch params in the URL/session, the native proxy, or Telegram Web's iframe. */
export function launchedInTelegram(): boolean {
  if (typeof window === 'undefined') return false
  if (/tgWebApp/.test(window.location.hash) || 'TelegramWebviewProxy' in window) return true
  try {
    if (sessionStorage.getItem('__telegram__initParams')) return true
  } catch {
    /* storage blocked */
  }
  return window.parent !== window
}

/** Binds the SDK object (call after the SDK script has loaded, or immediately if it is absent). */
export function connectTelegram() {
  tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined
  isTelegram = Boolean(tg && tg.initData)
  initialStartParam = isTelegram ? tg?.initDataUnsafe.start_param : browserStartParam()
}

const atLeast = (v: string) => Boolean(tg?.isVersionAtLeast?.(v))

export function initTelegram() {
  if (!tg || !isTelegram) return
  tg.ready()
  tg.expand()
  if (atLeast('6.1')) {
    tg.setHeaderColor?.('#2A1F1B')
    tg.setBackgroundColor?.('#1C1411')
  }
  if (atLeast('7.10')) tg.setBottomBarColor?.('#1C1411')
  if (atLeast('7.7')) tg.disableVerticalSwipes?.()
}

export function tgUserName(): string | undefined {
  return isTelegram ? tg?.initDataUnsafe.user?.first_name : undefined
}

// Captured once at load: routing may rewrite the URL before React effects run.
// Browser fallback: ?startapp=CODE also works for testing
const browserStartParam = () => (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('startapp') : null) ?? undefined
let initialStartParam: string | undefined = browserStartParam()

export function startParam(): string | undefined {
  return initialStartParam
}

export const haptic = {
  tap: () => (atLeast('6.1') ? tg?.HapticFeedback?.impactOccurred('light') : undefined),
  press: () => (atLeast('6.1') ? tg?.HapticFeedback?.impactOccurred('medium') : undefined),
  select: () => (atLeast('6.1') ? tg?.HapticFeedback?.selectionChanged() : undefined),
  success: () => (atLeast('6.1') ? tg?.HapticFeedback?.notificationOccurred('success') : undefined),
  error: () => (atLeast('6.1') ? tg?.HapticFeedback?.notificationOccurred('error') : undefined),
}

export function bindBackButton(visible: boolean, onBack: () => void) {
  const bb = tg?.BackButton
  if (!bb || !isTelegram || !atLeast('6.1')) return () => {}
  if (visible) {
    bb.show()
    bb.onClick(onBack)
  } else bb.hide()
  return () => bb.offClick(onBack)
}
