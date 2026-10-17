import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, Button, SwipeToConfirm } from '@/components/ui';
import { SackArt, StarArt } from '@/components/Art';
import { useApp } from '@/store/app';
import { extractCode } from '@/lib/telegram';
import { AnimatedBottomSheet } from '@/motion';

export default function Welcome() {
  const nav = useNavigate();
  const finish = useApp((s) => s.finishOnboarding);
  const join = useApp((s) => s.joinByCode);
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState('');
  const [err, setErr] = useState('');
  const start = () => { finish(); nav('/home', { replace: true }); };
  const tryJoin = () => {
    const r = join(extractCode(val));
    if (r.ok) { finish(); nav(`/room/${r.roomId}`, { replace: true }); } else setErr('Не нашли такую игру. Проверьте код или ссылку.');
  };
  return (
    <Screen style="--surface-welcome">
      <p className="font-display text-sm text-cream/80">//santomi</p>
      <h1 className="mt-6 text-center font-display text-[38px] font-medium leading-[1.05]">Время Тайного Санты!</h1>
      <p className="mx-auto mt-4 max-w-[280px] text-center text-sm text-cream/80">Создайте комнату, позовите друзей и подарите кому-то маленькое чудо. Жеребьёвка тайная, настроение настоящее.</p>
      <div className="relative flex flex-1 items-center justify-center">
        <div className="absolute inset-x-8 top-1/2 h-48 -translate-y-1/2 rounded-full bg-cherry-glow/40 blur-3xl" />
        <StarArt className="absolute left-0 top-6 h-16 w-16 animate-float" />
        <StarArt className="absolute bottom-10 right-2 h-12 w-12 animate-float [animation-delay:1.5s]" />
        <SackArt className="relative h-72 w-72 animate-float" />
      </div>
      <div className="space-y-3">
        <SwipeToConfirm label="Свайп, чтобы начать" onConfirm={start} />
        <button onClick={() => setOpen(true)} className="w-full py-2 text-center text-sm font-bold text-cream/90 underline underline-offset-4">У меня есть приглашение</button>
      </div>
      <AnimatedBottomSheet open={open} onClose={() => setOpen(false)} label="Вход по приглашению">
        <label htmlFor="code" className="text-sm font-bold">Ссылка или код приглашения</label>
        <input id="code" autoFocus value={val} onChange={(e) => { setVal(e.target.value); setErr(''); }} onKeyDown={(e) => e.key === 'Enter' && val.trim() && tryJoin()} placeholder="DEMO26"
          className="mt-2 h-12 w-full rounded-2xl bg-cream-50 px-4 outline-none" />
        {err && <p role="alert" className="mt-2 text-sm font-bold text-cherry">{err}</p>}
        <div className="mt-3 flex gap-2">
          <Button variant="ghost" className="!bg-cocoa/10 !text-cocoa flex-1" onClick={() => setOpen(false)}>Отмена</Button>
          <Button variant="red" className="flex-1" disabled={!val.trim()} onClick={tryJoin}>Войти</Button>
        </div>
      </AnimatedBottomSheet>
    </Screen>
  );
}
