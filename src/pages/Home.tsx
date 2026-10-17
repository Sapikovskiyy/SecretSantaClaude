import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Avatar, Button, Screen, fmtDate } from '@/components/ui';
import { BottomNav } from '@/components/Nav';
import { GiftArt, CaneArt } from '@/components/Art';
import { ME, useApp } from '@/store/app';
import { AnimatedCard, AnimatedItem, AnimatedList } from '@/motion';

export default function Home() {
  const nav = useNavigate();
  const rooms = useApp((s) => s.rooms);
  const users = useApp((s) => s.users);
  const name = useApp((s) => s.meName);
  const mine = rooms.filter((r) => r.members.includes(ME));
  return (
    <>
      <Screen nav>
        <p className="font-display text-sm text-taupe">//santomi</p>
        <h1 className="mt-2 font-display text-3xl font-medium leading-tight">Привет, {name}!</h1>
        <div className="relative mt-6 overflow-hidden rounded-sheet bg-cherry p-6">
          <CaneArt className="absolute -right-4 -top-2 h-28 w-28 opacity-90" />
          <GiftArt className="absolute -bottom-6 right-0 h-36 w-36 animate-float" />
          <h2 className="max-w-[200px] font-display text-2xl font-medium leading-tight">Новая игра Тайного Санты</h2>
          <p className="mt-2 max-w-[180px] text-sm text-cream/90">Комната готова за минуту</p>
          <Button className="mt-5 !h-12" onClick={() => nav('/create')}><Plus size={18} />Создать игру</Button>
        </div>
        <h2 className="mt-8 font-display text-lg">Ваши игры</h2>
        {mine.length === 0 ? (
          <div className="mt-3 rounded-card bg-cocoa-800 p-6 text-center">
            <GiftArt className="mx-auto h-24 w-24" />
            <p className="mt-2 font-bold">Пока нет ни одной игры</p>
            <p className="mt-1 text-sm text-taupe">Создайте первую или присоединитесь по ссылке друга.</p>
          </div>
        ) : (
          <AnimatedList className="mt-3 space-y-3">
            {mine.map((r) => (
              <AnimatedItem key={r.id}>
                <AnimatedCard onClick={() => nav(`/room/${r.id}`)} className="w-full rounded-card bg-cocoa-800 p-4 text-left">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="truncate font-bold">{r.name}</h3>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${r.stage === 'drawn' ? 'bg-pine' : 'bg-cherry'}`}>{r.stage === 'drawn' ? 'Жеребьёвка проведена' : 'Сбор участников'}</span>
                  </div>
                  <p className="mt-1 text-sm text-taupe">Обмен: {fmtDate(r.date)}</p>
                  <div className="mt-3 flex -space-x-2">
                    {r.members.slice(0, 6).map((m) => <Avatar key={m} name={users[m]?.name ?? '?'} size={32} />)}
                    {r.members.length > 6 && <span className="grid h-8 w-8 place-items-center rounded-full bg-taupe text-xs font-bold">+{r.members.length - 6}</span>}
                  </div>
                </AnimatedCard>
              </AnimatedItem>
            ))}
          </AnimatedList>
        )}
      </Screen>
      <BottomNav />
    </>
  );
}
