import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Gift, MessageCircle, Send, X } from 'lucide-react';
import { Avatar, Button, Header, Screen, SwipeToConfirm, fmtDate, rub } from '@/components/ui';
import { ME, useApp } from '@/store/app';
import { STATUS_LABELS } from '@/types';
import { AnimatedItem, AnimatedList } from '@/motion';

export default function Room() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const room = useApp((s) => s.rooms.find((r) => r.id === id));
  const users = useApp((s) => s.users);
  const wishlists = useApp((s) => s.wishlists);
  const statuses = useApp((s) => s.statuses);
  const { draw, removeMember, addExclusion, removeExclusion, setStatus } = useApp();
  const [err, setErr] = useState('');
  const [exA, setExA] = useState('');
  const [exB, setExB] = useState('');
  if (!room) return <Screen><Header /><p>Комната не найдена.</p></Screen>;
  const org = room.organizerId === ME;
  const drawn = room.stage === 'drawn';
  const name = (u: string) => users[u]?.name ?? '?';
  const counts = STATUS_LABELS.map((_, i) => room.members.filter((m) => (statuses[`${id}:${m}`] ?? 0) === i).length);
  const mine = statuses[`${id}:${ME}`] ?? 0;
  const sel = 'h-12 flex-1 rounded-2xl bg-cream-50 px-3 text-cocoa';
  return (
    <Screen>
      <Header title={room.name} />
      <div className="rounded-sheet bg-cherry p-5">
        <p className="text-sm text-cream/90">{room.description || 'Тайный Санта'}</p>
        <div className="mt-3 flex gap-6 text-sm"><span>Бюджет <b>{rub(room.budget)}</b></span><span>Обмен <b>{fmtDate(room.date)}</b></span></div>
        <p className="mt-3 inline-block rounded-full bg-black/25 px-3 py-1 text-xs font-bold">{drawn ? 'Жеребьёвка проведена' : 'Сбор участников'}</p>
      </div>

      <h2 className="mt-6 font-display text-lg">Участники · {room.members.length}/{room.maxMembers}</h2>
      <AnimatedList className="mt-3 space-y-2">
        {room.members.map((m) => {
          const ready = (wishlists[m]?.items.length ?? 0) > 0;
          return (
            <AnimatedItem key={m} className="flex items-center gap-3 rounded-2xl bg-cocoa-800 p-3">
              <Avatar name={name(m)} />
              <div className="flex-1"><p className="font-bold">{name(m)}{m === room.organizerId && <span className="ml-2 text-xs text-gold">организатор</span>}</p>
                <p className="text-xs text-taupe">{ready ? 'Вишлист заполнен' : 'Вишлист пока пуст'}</p></div>
              {org && !drawn && m !== ME && <button aria-label={`Убрать ${name(m)}`} onClick={() => removeMember(id, m)} className="grid h-9 w-9 place-items-center rounded-full bg-white/10"><X size={16} /></button>}
            </AnimatedItem>
          );
        })}
      </AnimatedList>
      {!drawn && <Button variant="ghost" className="mt-3 w-full" onClick={() => nav(`/invite/${id}`)}><Send size={18} />Пригласить</Button>}

      {org && !drawn && (<>
        <h2 className="mt-8 font-display text-lg">Исключения</h2>
        <p className="mt-1 text-sm text-taupe">Эти двое не будут дарить друг другу.</p>
        <div className="mt-3 flex gap-2">
          <select aria-label="Первый участник" className={sel} value={exA} onChange={(e) => setExA(e.target.value)}><option value="">Кто</option>{room.members.map((m) => <option key={m} value={m}>{name(m)}</option>)}</select>
          <select aria-label="Второй участник" className={sel} value={exB} onChange={(e) => setExB(e.target.value)}><option value="">Кому</option>{room.members.map((m) => <option key={m} value={m}>{name(m)}</option>)}</select>
          <Button variant="green" className="!h-12 !px-4" disabled={!exA || !exB || exA === exB} onClick={() => { addExclusion(id, exA, exB); setExA(''); setExB(''); }}>+</Button>
        </div>
        <ul className="mt-2 space-y-1">
          {room.exclusions.map(([a, b]) => (
            <li key={a + b} className="flex items-center justify-between rounded-xl bg-cocoa-800 px-3 py-2 text-sm">{name(a)} ↔ {name(b)}
              <button aria-label="Удалить исключение" onClick={() => removeExclusion(id, a, b)}><X size={16} /></button></li>
          ))}
        </ul>
        <div className="mt-8">
          <SwipeToConfirm label="Свайп — провести жеребьёвку" tone="taupe" onConfirm={() => { const r = draw(id); setErr(r.ok ? '' : r.reason); }} />
          {err && <p role="alert" className="mt-3 text-sm font-bold text-cherry-glow">{err}</p>}
        </div>
      </>)}
      {!org && !drawn && <p className="mt-6 text-sm text-taupe">Жеребьёвку проведёт организатор.</p>}

      {drawn && (<>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="red" onClick={() => nav(`/reveal/${id}`)}><Gift size={18} />Мой получатель</Button>
          {room.anonymous && <Button variant="ghost" onClick={() => nav(`/chat/${id}`)}><MessageCircle size={18} />Вопросы</Button>}
        </div>
        <h2 className="mt-8 font-display text-lg">Мой прогресс</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {STATUS_LABELS.map((l, i) => (
            <button key={l} onClick={() => setStatus(id, i)} className={`rounded-full px-4 py-2 text-sm font-bold ${mine === i ? 'bg-cream text-cocoa' : 'bg-white/12'}`}>{l}</button>
          ))}
        </div>
        <h2 className="mt-6 font-display text-lg">Общий прогресс</h2>
        <ul className="mt-2 space-y-1 text-sm text-taupe">{STATUS_LABELS.map((l, i) => <li key={l} className="flex justify-between"><span>{l}</span><b className="text-cream-50">{counts[i]}</b></li>)}</ul>
      </>)}
    </Screen>
  );
}
