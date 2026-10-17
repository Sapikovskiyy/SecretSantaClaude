interface TgWebApp {
  initData: string;
  initDataUnsafe: { user?: { id: number; first_name: string }; start_param?: string };
  ready(): void; expand(): void;
  setHeaderColor?(c: string): void; setBackgroundColor?(c: string): void;
  BackButton: { show(): void; hide(): void; onClick(f: () => void): void; offClick(f: () => void): void };
  HapticFeedback?: { impactOccurred(s: string): void; notificationOccurred(t: string): void };
  openTelegramLink?(url: string): void;
}
declare global { interface Window { Telegram?: { WebApp?: TgWebApp } } }

export const tg = () => window.Telegram?.WebApp;
export const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

export function initTelegram() {
  const w = tg();
  if (!w) return;
  w.ready(); w.expand();
  try { w.setHeaderColor?.('#281D19'); w.setBackgroundColor?.('#281D19'); } catch { /* older clients */ }
}
export const telegramFirstName = () => tg()?.initDataUnsafe.user?.first_name; // display only, never proof of identity
export const startParam = () => tg()?.initDataUnsafe.start_param ?? new URLSearchParams(location.search).get('tgWebAppStartParam') ?? undefined;
export function haptic(kind: 'light' | 'medium' | 'success' = 'light') {
  const h = tg()?.HapticFeedback;
  if (!h) return;
  if (kind === 'success') h.notificationOccurred('success'); else h.impactOccurred(kind);
}
export function inviteLink(code: string) {
  const bot = import.meta.env.VITE_BOT_USERNAME || 'santomi_bot';
  const app = import.meta.env.VITE_APP_SHORT_NAME || 'app';
  return `https://t.me/${bot}/${app}?startapp=join_${code}`;
}
export function shareInvite(code: string, roomName: string) {
  const url = `https://t.me/share/url?url=${encodeURIComponent(inviteLink(code))}&text=${encodeURIComponent(`Присоединяйся к Тайному Санте «${roomName}»!`)}`;
  const w = tg();
  if (w?.openTelegramLink) w.openTelegramLink(url); else window.open(url, '_blank');
}
export function extractCode(input: string) {
  const m = /join_([A-Za-z0-9]+)/.exec(input);
  return (m ? m[1] : input).trim().toUpperCase();
}
