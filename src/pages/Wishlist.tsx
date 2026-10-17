import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, Screen, rub } from '@/components/ui';
import { BottomNav } from '@/components/Nav';
import { catArt } from '@/components/Art';
import { CATEGORIES, catLabel } from '@/features/wishlists/categories';
import { ME, useApp } from '@/store/app';
import type { CategoryId } from '@/types';

const inp = 'h-12 w-full rounded-2xl bg-cream-50 px-4 text-cocoa outline-none focus:ring-2 focus:ring-cherry';
export default function Wishlist() {
  const nav = useNavigate();
  const w = useApp((s) => s.wishlists[ME]);
  const { saveItem, deleteItem, setUnwanted } = useApp();
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState({ name: '', price: '', category: 'other' as CategoryId, url: '' });
  const reset = () => { setEditing(null); setF({ name: '', price: '', category: 'other', url: '' }); };
  const submit = () => {
    if (!f.name.trim()) return;
    saveItem({ id: editing ?? undefined, name: f.name.trim(), price: Number(f.price) || 0, category: f.category, priority: 2, url: f.url.trim() || undefined });
    reset();
  };
  return (
    <>
      <Screen nav>
        <h1 className="mt-2 text-right font-display text-3xl leading-tight">Мой вишлист</h1>
        <button onClick={() => nav('/interests')} className="mt-4 self-start rounded-full bg-white/12 px-4 py-2 text-sm font-bold">Интересы: {w.interests.length ? w.interests.map(catLabel).join(', ') : 'выбрать'}</button>
        <div className="-mx-5 mt-5 flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar">
          {w.items.length === 0 && <p className="text-sm text-taupe">Добавьте первый подарок в форме ниже.</p>}
          <AnimatePresence initial={false} mode="popLayout">
          {w.items.map((i) => { const Art = catArt[i.category]; return (
            <motion.div key={i.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.22 }} className="w-32 shrink-0 rounded-3xl bg-cream-50 p-3 text-cocoa">
              <Art className="mx-auto h-20 w-20" />
              <p className="mt-1 line-clamp-2 text-sm font-bold leading-tight">{i.name}</p>
              <p className="text-xs text-cocoa/60">{i.price ? rub(i.price) : 'Без цены'}</p>
              <div className="mt-2 flex gap-2">
                <button aria-label="Изменить" onClick={() => { setEditing(i.id); setF({ name: i.name, price: String(i.price || ''), category: i.category, url: i.url ?? '' }); }}><Pencil size={16} /></button>
                <button aria-label="Удалить" onClick={() => deleteItem(i.id)}><Trash2 size={16} /></button>
              </div>
            </motion.div>); })}
          </AnimatePresence>
        </div>
        <div className="mt-4 rounded-sheet bg-cream p-5 text-cocoa">
          <h2 className="font-display text-lg">{editing ? 'Изменить подарок' : 'Добавить подарок'}</h2>
          <div className="mt-3 space-y-2">
            <input className={inp} placeholder="Название" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <div className="flex gap-2">
              <input className={inp} placeholder="Цена, ₽" inputMode="numeric" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value.replace(/\D/g, '') })} />
              <select aria-label="Категория" className={inp} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as CategoryId })}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
            </div>
            <input className={inp} placeholder="Ссылка (необязательно)" inputMode="url" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
          </div>
          <div className="mt-3 flex gap-2">
            {editing && <Button variant="ghost" className="!bg-cocoa/10 !text-cocoa" onClick={reset}>Отмена</Button>}
            <Button variant="red" className="flex-1" disabled={!f.name.trim()} onClick={submit}><Plus size={18} />{editing ? 'Сохранить' : 'Добавить'}</Button>
          </div>
          <label className="mt-5 block text-sm font-bold">Не дарите мне
            <textarea className={`${inp} mt-2 h-20 py-3 font-normal`} placeholder="Например: носки, кружки" value={w.unwanted} onChange={(e) => setUnwanted(e.target.value)} />
          </label>
        </div>
      </Screen>
      <BottomNav />
    </>
  );
}
