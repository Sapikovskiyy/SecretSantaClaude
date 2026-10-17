import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useParams } from 'react-router-dom';
import { Flag, SendHorizontal } from 'lucide-react';
import { Chip, Header, Screen } from '@/components/ui';
import { ME, useApp } from '@/store/app';

const SUGGEST = ['Какие книги тебе нравятся?', 'Какой твой любимый цвет?', 'Ты предпочитаешь практичные подарки?'];
const time = (t: number) => new Date(t).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

export default function Chat() {
  const { id = '' } = useParams();
  const messages = useApp((s) => s.messages);
  const recipient = useApp((s) => s.assignments[id]?.[ME]);
  const users = useApp((s) => s.users);
  const { ask, reply, report } = useApp();
  const [tab, setTab] = useState<'out' | 'in'>('out');
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const out = messages.filter((m) => m.roomId === id && m.giverId === ME);
  const inc = messages.filter((m) => m.roomId === id && m.receiverId === ME);
  const giverOfIncoming = inc[0]?.giverId;
  const send = () => {
    const r = tab === 'out' ? ask(id, text) : giverOfIncoming ? reply(id, giverOfIncoming, text) : { ok: false as const, reason: 'Пока нет вопросов' };
    if (r.ok) { setText(''); setErr(''); } else setErr(r.reason);
  };
  const list = tab === 'out' ? out : inc;
  const seen = useRef<Set<string> | null>(null);
  if (!seen.current) seen.current = new Set(messages.map((m) => m.id));
  const prevLen = useRef(list.length);
  useEffect(() => {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 160;
    if (list.length > prevLen.current && nearBottom) window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    prevLen.current = list.length;
    list.forEach((m) => seen.current?.add(m.id));
  }, [list]);
  return (
    <Screen>
      <Header title="Анонимные вопросы" />
      <div className="flex gap-2"><Chip on={tab === 'out'} onClick={() => setTab('out')}>Моему получателю</Chip><Chip on={tab === 'in'} onClick={() => setTab('in')}>Мне</Chip></div>
      {tab === 'out' && recipient && <p className="mt-3 text-sm text-taupe">Вы пишете анонимно для {users[recipient]?.name}. Получатель не увидит, кто вы.</p>}
      {tab === 'in' && <p className="mt-3 text-sm text-taupe">Сообщения приходят от «Тайного Санты». Вы можете ответить или пожаловаться.</p>}
      <motion.ul key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} className="mt-4 flex-1 space-y-2" aria-live="polite">
        {list.length === 0 && <li className="mt-10 text-center text-sm text-taupe">Пока нет сообщений.</li>}
        {list.map((m) => {
          const mineMsg = (tab === 'out') === (m.author === 'giver');
          return (
            <motion.li key={m.id} initial={seen.current?.has(m.id) ? false : { opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.22 }}
              className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm ${mineMsg ? 'ml-auto bg-cream text-cocoa' : 'bg-cocoa-800'}`}>
              {tab === 'in' && m.author === 'giver' && <p className="mb-1 text-xs font-bold text-gold">Тайный Санта</p>}
              <p>{m.text}</p>
              <p className="mt-1 flex items-center justify-between gap-3 text-[11px] opacity-60">{time(m.at)}{m.demo && ' · демо-сообщение'}
                {tab === 'in' && m.author === 'giver' && <button aria-label="Пожаловаться" disabled={m.reported} onClick={() => report(m.id)} className="flex items-center gap-1"><Flag size={12} />{m.reported ? 'Жалоба отправлена' : 'Пожаловаться'}</button>}
              </p>
            </motion.li>
          );
        })}
      </motion.ul>
      {tab === 'out' && <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">{SUGGEST.map((s) => <Chip key={s} onClick={() => setText(s)}>{s}</Chip>)}</div>}
      {err && <p role="alert" className="mb-2 text-sm font-bold text-cherry-glow">{err}</p>}
      <div className="flex gap-2">
        <input value={text} maxLength={300} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} aria-label="Сообщение"
          placeholder={tab === 'out' ? 'Ваш вопрос' : 'Ваш ответ'} className="h-14 flex-1 rounded-full bg-cream-50 px-5 text-cocoa outline-none" />
        <button aria-label="Отправить" onClick={send} className="grid h-14 w-14 place-items-center rounded-full bg-cherry"><SendHorizontal size={20} /></button>
      </div>
    </Screen>
  );
}
