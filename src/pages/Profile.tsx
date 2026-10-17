import { Avatar, Button, Screen, Toggle } from '@/components/ui';
import { BottomNav } from '@/components/Nav';
import { ME, useApp } from '@/store/app';
import { isDemo } from '@/lib/telegram';

const PREFS: [string, string][] = [['invites', 'Приглашения'], ['draw', 'Итоги жеребьёвки'], ['messages', 'Анонимные сообщения'], ['reminders', 'Напоминания']];
export default function Profile() {
  const name = useApp((s) => s.meName);
  const rooms = useApp((s) => s.rooms);
  const prefs = useApp((s) => s.prefs);
  const { setPref, resetDemo } = useApp();
  const mine = rooms.filter((r) => r.members.includes(ME));
  return (
    <>
      <Screen nav>
        <div className="mt-4 flex items-center gap-4"><Avatar name={name} size={72} /><div><h1 className="font-display text-2xl">{name}</h1><p className="text-sm text-taupe">Активных игр: {mine.filter((r) => r.stage === 'gathering').length} · Проведено: {mine.filter((r) => r.stage === 'drawn').length}</p></div></div>
        <h2 className="mt-8 font-display text-lg">Уведомления</h2>
        <ul className="mt-3 space-y-2">{PREFS.map(([k, l]) => <li key={k} className="flex items-center justify-between rounded-2xl bg-cocoa-800 p-4"><span className="font-bold">{l}</span><Toggle on={prefs[k]} onChange={(v) => setPref(k, v)} label={l} /></li>)}</ul>
        <div className="mt-6 rounded-2xl bg-cocoa-800 p-4"><p className="font-bold">Язык</p><p className="text-sm text-taupe">Русский</p></div>
        <div className="mt-3 rounded-2xl bg-cocoa-800 p-4"><p className="font-bold">Santomi AI Plus</p><p className="text-sm text-taupe">Не активна{isDemo ? ' (платежи в демо отключены)' : ''}</p></div>
        <div className="mt-3 rounded-2xl bg-cocoa-800 p-4"><p className="font-bold">Помощь</p><p className="text-sm text-taupe">Напишите боту Santomi командой /help.</p></div>
        {isDemo && <Button variant="ghost" className="mt-6 w-full" onClick={() => { if (confirm('Сбросить демо-данные?')) resetDemo(); }}>Сбросить демо-данные</Button>}
      </Screen>
      <BottomNav />
    </>
  );
}
