import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Header, Screen, Toggle } from '@/components/ui';
import { useApp } from '@/store/app';

const field = 'mt-2 h-14 w-full rounded-2xl bg-cream-50 px-4 text-cocoa outline-none focus:ring-2 focus:ring-cherry';

export default function CreateRoom() {
  const nav = useNavigate();
  const create = useApp((s) => s.createRoom);
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: '', description: '', budget: '1500', date: '', maxMembers: '10', anonymous: true });
  const budget = Number(f.budget), max = Number(f.maxMembers);
  const valid = [f.name.trim().length >= 2, budget > 0 && max >= 3 && max <= 500, true][step];
  const next = () => {
    if (step < 2) return setStep(step + 1);
    const id = create({ name: f.name.trim(), description: f.description.trim(), budget, date: f.date, maxMembers: max, anonymous: f.anonymous });
    nav(`/invite/${id}`, { replace: true });
  };
  return (
    <Screen>
      <Header title="Новая игра" />
      <div className="flex gap-2" aria-label={`Шаг ${step + 1} из 3`}>
        {[0, 1, 2].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-cherry' : 'bg-white/15'}`} />)}
      </div>
      <div className="mt-8 flex-1">
        {step === 0 && (<>
          <h2 className="font-display text-3xl leading-tight">Как назовём игру?</h2>
          <label className="mt-6 block text-sm text-taupe">Название
            <input className={field} value={f.name} maxLength={60} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Офис 2026" autoFocus />
          </label>
          <label className="mt-4 block text-sm text-taupe">Описание (необязательно)
            <textarea className={`${field} h-28 py-3`} value={f.description} maxLength={300} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </label>
        </>)}
        {step === 1 && (<>
          <h2 className="font-display text-3xl leading-tight">Бюджет и дата</h2>
          <label className="mt-6 block text-sm text-taupe">Бюджет подарка, ₽
            <input className={field} inputMode="numeric" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value.replace(/\D/g, '') })} />
          </label>
          <label className="mt-4 block text-sm text-taupe">Дата обмена
            <input type="date" className={field} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          </label>
          <label className="mt-4 block text-sm text-taupe">Максимум участников (3–500)
            <input className={field} inputMode="numeric" value={f.maxMembers} onChange={(e) => setF({ ...f, maxMembers: e.target.value.replace(/\D/g, '') })} />
          </label>
          {!valid && <p role="alert" className="mt-3 text-sm font-bold text-cherry-glow">Проверьте бюджет и число участников.</p>}
        </>)}
        {step === 2 && (<>
          <h2 className="font-display text-3xl leading-tight">Последний штрих</h2>
          <div className="mt-6 flex items-center justify-between gap-4 rounded-card bg-cocoa-800 p-4">
            <div><p className="font-bold">Анонимные вопросы</p><p className="text-sm text-taupe">Санта сможет задать вопрос получателю</p></div>
            <Toggle on={f.anonymous} onChange={(v) => setF({ ...f, anonymous: v })} label="Анонимные вопросы" />
          </div>
          <p className="mt-4 text-sm text-taupe">Исключения (кто не должен дарить друг другу) вы настроите в комнате, когда участники присоединятся.</p>
        </>)}
      </div>
      <div className="flex gap-3">
        {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Назад</Button>}
        <Button variant="cream" className="flex-1" disabled={!valid} onClick={next}>{step < 2 ? 'Дальше' : 'Создать комнату'}</Button>
      </div>
    </Screen>
  );
}
