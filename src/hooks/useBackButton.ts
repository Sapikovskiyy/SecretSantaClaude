import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { tg } from '@/lib/telegram';

/** Shows Telegram's native back button on every screen except the roots. */
export function useBackButton() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => {
    const b = tg()?.BackButton;
    if (!b) return;
    if (pathname === '/' || pathname === '/home') { b.hide(); return; }
    const back = () => nav(-1);
    b.show(); b.onClick(back);
    return () => b.offClick(back);
  }, [pathname, nav]);
}
