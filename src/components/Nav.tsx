import { NavLink } from 'react-router-dom';
import { Gift, Home, Sparkles, User } from 'lucide-react';

const ITEMS = [
  { to: '/home', label: 'Главная', Icon: Home },
  { to: '/wishlist', label: 'Вишлист', Icon: Gift },
  { to: '/ai', label: 'Идеи', Icon: Sparkles },
  { to: '/profile', label: 'Профиль', Icon: User },
];
export function BottomNav() {
  return (
    <nav aria-label="Основная навигация" className="fixed inset-x-0 z-20 mx-auto w-full max-w-md px-5" style={{ bottom: 'calc(var(--safe-bottom) + 12px)' }}>
      <div className="flex items-center justify-between rounded-full bg-cream p-1.5 shadow-soft">
        {ITEMS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-sm font-bold transition ${isActive ? 'bg-cocoa text-cream-50' : 'text-cocoa/70'}`}>
            <Icon size={18} /><span className="hidden min-[380px]:inline">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
