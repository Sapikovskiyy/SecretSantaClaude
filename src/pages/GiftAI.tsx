import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { motion } from 'motion/react';
import { AnimatedItem, AnimatedList } from '@/motion';
import { Button, Chip, Screen, rub } from '@/components/ui';
import { BottomNav } from '@/components/Nav';
import { CATEGORIES, catLabel } from '@/features/wishlists/categories';
import { demoIdeas, type Mode } from '@/features/gift-ai/demoIdeas';
import { FREE_AI_LIMIT, useApp } from '@/store/app';
import { isDemo } from '@/lib/telegram';
import type { CategoryId, Idea } from '@/types';

const FOLLOW: { m: Mode; l: string }[] = [
  { m: 'odd', l: 'Что-то необычное' }, { m: 'cheaper', l: 'Найти дешевле' }, { m: 'practical', l: 'Более практичный' }, { m: 'other', l: 'Предложить другое' },
];
const inp = 'mt-2 h-12 w-full rounded-2xl bg-cream-50 px-4 text-cocoa outline-none';

export default function GiftAI() {
  const { aiUsed, savedIdeas, useAi, saveIdea } = useApp();
  const [who, setWho] = useState('');
  const [budget, setBudget] = useState('2000');
  const [interests, setInterests] = useState<CategoryId[]>([]);
  const [extra, setExtra] = useState('');
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [round, setRound] = useState(0);
  const left = FREE_AI_LIMIT - aiUsed;

  if (!isDemo) return <><Screen nav><h1 className="mt-4 font-display text-3xl">Santomi Gift AI</h1><p role="alert" className="mt-4 text-taupe">Живой ИИ-сервис сейчас недоступен: сервер ещё не подключён.</p></Screen><BottomNav /></>;

  const run = (mode: Mode) => {
    if (left <= 0) return;
    useAi();
    const r = mode === 'other' ? round + 1 : round;
    setRound(r);
    setIdeas(demoIdeas(interests, Number(budget) || 2000, mode, r));
  };
  return (
    <>
      <Screen nav>
        <h1 className="mt-2 font-display text-3xl leading-tight">Santomi Gift AI</h1>
        <p className="mt-2 rounded-2xl bg-gold/20 p-3 text-xs text-gold">Демо-режим: идеи подбираются локально по шаблонам, это не ответ ИИ. Цены ориентировочные, наличия и ссылок на магазины нет.</p>
        {!ideas ? (
          <div className="mt-4 rounded-sheet bg-cocoa-800 p-5">
            <label className="block text-sm text-taupe">Кому подарок?<input className={inp} value={who} onChange={(e) => setWho(e.target.value)} placeholder="Коллега, друг, мама…" /></label>
            <label className="mt-3 block text-sm text-taupe">Бюджет, ₽<input className={inp} inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ''))} /></label>
            <p className="mt-3 text-sm text-taupe">Интересы</p>
            <div className="mt-2 flex flex-wrap gap-2">{CATEGORIES.map((c) => <Chip key={c.id} on={interests.includes(c.id)} onClick={() => setInterests((p) => p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id])}>{c.label}</Chip>)}</div>
            <label className="mt-3 block text-sm text-taupe">Что ещё важно?<input className={inp} value={extra} onChange={(e) => setExtra(e.target.value)} /></label>
            <Button variant="red" className="mt-5 w-full" disabled={left <= 0} onClick={() => run('base')}>Подобрать идеи</Button>
            <p className="mt-2 text-center text-xs text-taupe">{left > 0 ? `Бесплатных подборок: ${left}` : 'Лимит исчерпан. AI Plus в демо недоступен.'}</p>
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm text-taupe">{who ? `Для: ${who}. ` : ''}{extra && `Учтено: ${extra}. `}Бесплатных подборок: {Math.max(left, 0)}</p>
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">{FOLLOW.map((f) => <Chip key={f.m} onClick={() => run(f.m)}>{f.l}</Chip>)}</div>
            {left <= 0 && <p role="alert" className="mt-2 text-sm text-cherry-glow">Лимит бесплатных подборок исчерпан.</p>}
            <AnimatedList key={aiUsed} className="mt-4 space-y-3">
              {ideas.length === 0 && <li className="text-sm text-taupe">Под такой бюджет ничего не нашлось. Увеличьте бюджет.</li>}
              {ideas.map((i) => (
                <AnimatedItem key={i.name} className="rounded-card bg-cream p-4 text-cocoa">
                  <div className="flex items-start justify-between gap-2"><h3 className="font-bold">{i.name}</h3>
                    <motion.button aria-label="Сохранить идею" whileTap={{ scale: 1.3 }} onClick={() => saveIdea(i)}><Bookmark size={20} fill={savedIdeas.some((x) => x.name === i.name) ? 'currentColor' : 'none'} /></motion.button></div>
                  <p className="text-sm font-bold text-cherry">≈ {rub(i.min)} – {rub(i.max)}</p>
                  <p className="mt-1 text-sm">{i.why}</p>
                  <p className="mt-2 text-xs text-cocoa/60">{catLabel(i.category)}</p>
                </AnimatedItem>
              ))}
            </AnimatedList>
            <Button variant="ghost" className="mt-4 w-full" onClick={() => setIdeas(null)}>Изменить вводные</Button>
          </>
        )}
        {savedIdeas.length > 0 && <p className="mt-6 text-sm text-taupe">Сохранено идей: {savedIdeas.length}</p>}
      </Screen>
      <BottomNav />
    </>
  );
}
