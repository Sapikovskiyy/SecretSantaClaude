import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Screen } from '@/components/ui';
import { GiftArt } from '@/components/Art';
import { useApp } from '@/store/app';

const TEXT = { not_found: 'Приглашение недействительно или отозвано.', full: 'В этой игре больше нет мест.', drawn: 'Жеребьёвка уже прошла, присоединиться нельзя.' } as const;

export default function Join() {
  const { code = '' } = useParams();
  const nav = useNavigate();
  const join = useApp((s) => s.joinByCode);
  const finish = useApp((s) => s.finishOnboarding);
  const [err, setErr] = useState<keyof typeof TEXT | null>(null);
  useEffect(() => {
    const r = join(code);
    if (r.ok) { finish(); nav(`/room/${r.roomId}`, { replace: true }); } else setErr(r.reason);
  }, [code, join, finish, nav]);
  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <GiftArt className="h-32 w-32" />
        <h1 className="mt-4 font-display text-2xl">{err ? 'Не получилось войти' : 'Входим в игру…'}</h1>
        {err && <p role="alert" className="mt-2 text-taupe">{TEXT[err]}</p>}
      </div>
      {err && <Button onClick={() => nav('/home', { replace: true })}>На главную</Button>}
    </Screen>
  );
}
