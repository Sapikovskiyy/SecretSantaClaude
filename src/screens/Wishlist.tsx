/**
 * 08 · Wishlist — sheet 02/screen 08, calibrated by original reference screen 3.
 * Dark top with a horizontal thumbnail strip (selected tile points into the sheet),
 * large cream editor: title, price, priority, notes, product link, unwanted gifts.
 * Tabs: «Товары» (own items) / «Идеи» (ideas saved from Gift AI).
 * Motion: layout reflow on add/remove (180–280 ms); saving is never blocked by animation.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { PageHeader, PrimaryCTA, Segmented } from '@/components/ds'
import { Icon } from '@/components/ui/Icon'
import { Sheet } from '@/components/ui/Kit'
import { Art } from '@/components/art/Art'
import { useDemo } from '@/data/demoStore'
import { INTERESTS, interestById } from '@/domain/interests'
import type { InterestId, Priority, WishItem } from '@/domain/types'
import { formatRange, formatRub, plural } from '@/lib/format'
import { haptic } from '@/lib/telegram'
import { toast } from '@/data/uiStore'
import { DUR, EASE, PRESS, cardIn, tween } from '@/motion/tokens'

type Draft = { title: string; price: string; priority: Priority; notes: string; url: string; category: InterestId }

const NEW = '__new__'
const PRIORITY_OPTIONS: { id: Priority; label: string }[] = [
  { id: 'high', label: 'Высокий' },
  { id: 'normal', label: 'Средний' },
  { id: 'low', label: 'Низкий' },
]

const toDraft = (w?: WishItem, fallback: InterestId = 'other'): Draft => ({
  title: w?.title ?? '',
  price: w?.price ? String(w.price) : '',
  priority: w?.priority ?? 'normal',
  notes: w?.description ?? '',
  url: w?.url ?? '',
  category: w?.category ?? fallback,
})

const isValidUrl = (u: string) => !u || /^https?:\/\/[^\s/]+\.[^\s]+$/i.test(u)

export function Wishlist() {
  const navigate = useNavigate()
  const { wishlist, interests, avoid, savedIdeas, addWish, updateWish, removeWish, moveWish, addAvoid, removeAvoid, removeIdea } = useDemo()
  const [tab, setTab] = useState<'items' | 'ideas'>('items')
  const [selectedId, setSelectedId] = useState<string>(wishlist[0]?.id ?? NEW)
  const [menu, setMenu] = useState(false)

  const selected = wishlist.find((w) => w.id === selectedId)
  const isNew = selectedId === NEW || !selected
  const [draft, setDraft] = useState<Draft>(() => toDraft(selected, interests[0]))

  // Reset the editor whenever another item is selected.
  useEffect(() => {
    setDraft(toDraft(wishlist.find((w) => w.id === selectedId), interests[0]))
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  const original = useMemo(() => toDraft(selected, interests[0]), [selected, interests])
  const dirty = JSON.stringify(draft) !== JSON.stringify(original)
  const urlError = !isValidUrl(draft.url.trim())
  const titleError = draft.title.trim().length > 0 && draft.title.trim().length < 2

  const save = () => {
    const title = draft.title.trim()
    if (title.length < 2) return toast('Напишите, что вы хотите — хотя бы 2 буквы', 'error')
    if (urlError) return toast('Ссылка должна начинаться с https://', 'error')
    const data = {
      title: title.slice(0, 80),
      price: draft.price ? Number(draft.price) : undefined,
      url: draft.url.trim() || undefined,
      description: draft.notes.trim().slice(0, 300) || undefined,
      category: draft.category,
      priority: draft.priority,
    }
    haptic.success()
    if (isNew) {
      addWish(data)
      // the new item is the last one
      const created = useDemo.getState().wishlist.at(-1)
      if (created) setSelectedId(created.id)
      toast('Добавлено в вишлист')
    } else {
      updateWish(selected!.id, data)
      toast('Изменения сохранены')
    }
  }

  const remove = () => {
    if (!selected) return
    const idx = wishlist.findIndex((w) => w.id === selected.id)
    removeWish(selected.id)
    const next = wishlist.filter((w) => w.id !== selected.id)
    setSelectedId(next[Math.max(0, idx - 1)]?.id ?? NEW)
    setMenu(false)
    toast('Удалено из вишлиста')
  }

  return (
    <Screen surface="cocoa" back="/home" headless className="!pb-0">
      <PageHeader
        back="/home"
        title="Мой вишлист"
        right={
          <motion.button
            whileTap={PRESS}
            aria-label={`Мои интересы${interests.length ? ` (${interests.length})` : ''}`}
            onClick={() => navigate('/wishlist/interests')}
            className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-snow"
          >
            <Icon name="star" size={20} />
            {interests.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-pine px-1 text-[11px] font-bold">
                {interests.length}
              </span>
            )}
          </motion.button>
        }
      />

      <div className="mt-3 px-5">
        <Segmented
          label="Раздел вишлиста"
          value={tab}
          onChange={setTab}
          options={[
            { id: 'items', label: `Товары (${wishlist.length})` },
            { id: 'ideas', label: `Идеи (${savedIdeas.length})` },
          ]}
        />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {tab === 'items' ? (
          <motion.div key="items" className="flex flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={tween(0.18)}>
            {/* Thumbnail strip */}
            <LayoutGroup>
              <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-0 pt-5" role="listbox" aria-label="Желания">
                <AnimatePresence initial={false}>
                  {wishlist.map((w) => (
                    <Thumb key={w.id} item={w} active={w.id === selectedId} onSelect={() => setSelectedId(w.id)} />
                  ))}
                </AnimatePresence>
                <motion.button
                  layout
                  whileTap={PRESS}
                  onClick={() => {
                    haptic.tap()
                    setSelectedId(NEW)
                  }}
                  aria-label="Добавить желание"
                  className="relative flex h-[76px] w-[76px] shrink-0 flex-col items-center"
                >
                  <span
                    className={`flex h-[76px] w-[76px] items-center justify-center rounded-[20px] border-2 border-dashed text-snow/80 ${
                      isNew ? 'border-marzipan bg-marzipan/10' : 'border-snow/30'
                    }`}
                  >
                    <Icon name="plus" size={26} />
                  </span>
                </motion.button>
              </div>
            </LayoutGroup>

            {/* Cream editor sheet */}
            <section className="relative mt-4 flex flex-1 flex-col rounded-t-[32px] bg-marzipan px-5 pb-36 pt-5 text-ink">
              {/* Item header card (doubles as the empty state for a first wish) */}
              <motion.div key={selectedId} {...cardIn()} className="flex items-center gap-3 rounded-[22px] bg-snow p-3">
                <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[18px] bg-marzipan">
                  <Art name={wishlist.length === 0 && !draft.title ? 'stocking' : interestById[draft.category].art} size={62} noShadow />
                </span>
                <div className="min-w-0 flex-1">
                  {wishlist.length === 0 && isNew && !draft.title.trim() ? (
                    <>
                      <p className="text-[17px] font-bold leading-tight">Добавьте первое желание</p>
                      <p className="mt-1 text-[13px] text-ink-soft">Санта увидит его после жеребьёвки</p>
                    </>
                  ) : (
                    <>
                      <p className="truncate text-[17px] font-bold leading-tight">{draft.title.trim() || (isNew ? 'Новое желание' : 'Без названия')}</p>
                      <p className="mt-1 text-[15px] font-semibold text-ink/80">{draft.price ? `≈ ${formatRub(Number(draft.price))}` : 'Цена не указана'}</p>
                    </>
                  )}
                </div>
                {!isNew && (
                  <button aria-label="Действия с желанием" onClick={() => setMenu(true)} className="flex h-11 w-9 items-center justify-center rounded-full text-ink/60">
                    <Icon name="more" size={24} strokeWidth={2.6} />
                  </button>
                )}
              </motion.div>

              <div className="mt-5 space-y-5">
                <Field label="Что подарить" error={titleError ? 'Хотя бы 2 буквы' : undefined}>
                  <input
                    className={inputCls(titleError)}
                    value={draft.title}
                    maxLength={80}
                    placeholder="Например, фотоаппарат моментальной печати"
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  />
                </Field>

                <div className="grid grid-cols-[1fr_1.4fr] gap-3">
                  <Field label="Цена, ₽">
                    <input
                      className={inputCls()}
                      inputMode="numeric"
                      placeholder="Примерно"
                      value={draft.price}
                      onChange={(e) => setDraft({ ...draft, price: e.target.value.replace(/\D/g, '').slice(0, 7) })}
                    />
                  </Field>
                  <Field label="Категория">
                    <select className={inputCls()} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as InterestId })}>
                      {INTERESTS.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div>
                  <p className="type-label mb-2 text-ink/75">Приоритет</p>
                  <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Приоритет">
                    {PRIORITY_OPTIONS.map((p) => {
                      const active = draft.priority === p.id
                      return (
                        <motion.button
                          key={p.id}
                          role="radio"
                          aria-checked={active}
                          whileTap={PRESS}
                          onClick={() => {
                            haptic.select()
                            setDraft({ ...draft, priority: p.id })
                          }}
                          className={`h-12 rounded-[16px] text-[14px] font-semibold transition-colors duration-200 ${
                            active ? 'bg-ember text-snow shadow-[0_8px_18px_-10px_rgba(213,54,28,.9)]' : 'bg-snow text-ink/70'
                          }`}
                        >
                          {p.label}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                <Field label="Заметки">
                  <textarea
                    className={`${inputCls()} h-24 resize-none py-3 leading-snug`}
                    maxLength={300}
                    placeholder="Цвет, размер, модель — всё, что поможет Санте"
                    value={draft.notes}
                    onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  />
                </Field>

                <Field label="Ссылка на товар" error={urlError ? 'Ссылка должна начинаться с https://' : undefined}>
                  <div className="relative">
                    <Icon name="link" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/45" />
                    <input
                      className={`${inputCls(urlError)} pl-11 pr-11`}
                      inputMode="url"
                      placeholder="https://"
                      value={draft.url}
                      onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                    />
                    {draft.url && (
                      <button
                        aria-label="Очистить ссылку"
                        onClick={() => setDraft({ ...draft, url: '' })}
                        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink/55"
                      >
                        <Icon name="close" size={18} />
                      </button>
                    )}
                  </div>
                </Field>

                <AvoidList avoid={avoid} onAdd={addAvoid} onRemove={removeAvoid} />
              </div>
            </section>

            <StickyCTA>
              <PrimaryCTA icon="check" onClick={save} disabled={!isNew && !dirty}>
                {isNew ? 'Добавить в вишлист' : dirty ? 'Сохранить изменения' : 'Сохранено'}
              </PrimaryCTA>
            </StickyCTA>
          </motion.div>
        ) : (
          <motion.div key="ideas" className="flex-1 px-5 pb-10 pt-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={tween(0.18)}>
            {savedIdeas.length === 0 ? (
              <div className="flex flex-col items-center px-4 pt-6 text-center">
                <Art name="robot" size={150} />
                <p className="type-h3 mt-3">Здесь будут идеи</p>
                <p className="mt-1 max-w-[30ch] text-[14px] text-snow/65">Сохраняйте понравившиеся подарки в Gift AI, чтобы вернуться к ним позже</p>
                <Link to="/ai" className="mt-5 flex h-12 items-center rounded-full bg-snow px-5 text-[15px] font-semibold text-ink">
                  Открыть Gift AI
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                <AnimatePresence initial={false}>
                  {savedIdeas.map((idea, i) => (
                    <motion.li
                      key={idea.id}
                      layout
                      {...cardIn(i)}
                      exit={{ opacity: 0, x: -20, transition: tween(DUR.layout) }}
                      className="flex gap-3 rounded-[22px] bg-marzipan p-3 text-ink"
                    >
                      <span className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-[18px] bg-snow">
                        <Art name={interestById[idea.interests[0]]?.art ?? 'gift'} size={58} noShadow />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-bold leading-tight">{idea.title}</p>
                        <p className="mt-1 text-[12px] text-ink-soft">Примерно {formatRange(idea.priceMin, idea.priceMax)}</p>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => {
                              addWish({ title: idea.title, description: idea.why, category: idea.interests[0] ?? 'other', priority: 'normal' })
                              removeIdea(idea.id)
                              toast('Перенесено в вишлист')
                            }}
                            className="h-9 rounded-full bg-ember px-3.5 text-[13px] font-semibold text-snow"
                          >
                            В мой вишлист
                          </button>
                          <button onClick={() => removeIdea(idea.id)} className="h-9 rounded-full bg-ink/8 px-3.5 text-[13px] font-semibold">
                            Убрать
                          </button>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={menu} onClose={() => setMenu(false)} title={selected?.title}>
        <div className="space-y-2">
          <MenuRow icon="back" label="Сдвинуть левее" onClick={() => selected && moveWish(selected.id, -1)} />
          <MenuRow icon="forward" label="Сдвинуть правее" onClick={() => selected && moveWish(selected.id, 1)} />
          <MenuRow icon="trash" label="Удалить желание" danger onClick={remove} />
        </div>
      </Sheet>

      <span className="sr-only" aria-live="polite">
        {wishlist.length} {plural(wishlist.length, 'желание', 'желания', 'желаний')}
      </span>
    </Screen>
  )
}

function Thumb({ item, active, onSelect }: { item: WishItem; active: boolean; onSelect: () => void }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={{ duration: DUR.layout, ease: EASE }}
      whileTap={PRESS}
      role="option"
      aria-selected={active}
      aria-label={item.title}
      onClick={() => {
        haptic.select()
        onSelect()
      }}
      className="relative flex shrink-0 flex-col items-center"
    >
      <span
        className={`relative flex h-[76px] w-[76px] items-center justify-center rounded-[20px] bg-snow transition-shadow duration-200 ${
          active ? 'shadow-[0_0_0_3px_#E6B96C]' : ''
        }`}
      >
        <Art name={interestById[item.category].art} size={64} noShadow />
        {item.priority === 'high' && <span className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-ember" aria-label="Высокий приоритет" />}
      </span>
      {/* pointer into the sheet */}
      {active && (
        <motion.span
          layoutId="wish-pointer"
          transition={{ duration: DUR.layout, ease: EASE }}
          className="mt-1.5 h-0 w-0 border-x-[9px] border-b-[9px] border-x-transparent border-b-marzipan"
        />
      )}
      {!active && <span className="mt-1.5 h-[9px]" />}
    </motion.button>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="type-label mb-2 block text-ink/75">{label}</span>
      {children}
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={tween(DUR.chip)}
            className="mt-1.5 block text-[13px] font-medium text-ember"
            role="alert"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  )
}

const inputCls = (error?: boolean) =>
  `h-[52px] w-full rounded-[16px] bg-snow px-4 text-[16px] text-ink placeholder:text-ink/35 outline-none transition-shadow duration-200 ${
    error ? 'shadow-[0_0_0_2px_#D5361C]' : 'shadow-[0_0_0_1px_rgba(40,29,25,.08)] focus:shadow-[0_0_0_2px_#D5361C]'
  }`

function AvoidList({ avoid, onAdd, onRemove }: { avoid: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void }) {
  const [text, setText] = useState('')
  return (
    <div className="rounded-[20px] bg-snow/70 p-4">
      <p className="type-label text-ink/75">Не дарить</p>
      <p className="mt-0.5 text-[12px] text-ink-soft">Санта увидит этот список вместе с вишлистом</p>
      {avoid.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <AnimatePresence initial={false}>
            {avoid.map((a) => (
              <motion.button
                key={a}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={tween(DUR.chip)}
                onClick={() => onRemove(a)}
                aria-label={`Убрать «${a}»`}
                className="flex h-9 items-center gap-1.5 rounded-full bg-ink/8 pl-3.5 pr-2.5 text-[13px] font-semibold"
              >
                {a}
                <Icon name="close" size={14} />
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          const t = text.trim()
          if (t.length >= 2) onAdd(t.slice(0, 40))
          setText('')
        }}
      >
        <input className={`${inputCls()} h-11`} placeholder="Например, сладкое" value={text} onChange={(e) => setText(e.target.value)} aria-label="Что не дарить" />
        <button className="h-11 shrink-0 rounded-full bg-ink px-4 text-[14px] font-semibold text-snow">Добавить</button>
      </form>
    </div>
  )
}

function MenuRow({ icon, label, onClick, danger }: { icon: 'back' | 'forward' | 'trash'; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={() => {
        haptic.tap()
        onClick()
      }}
      className={`flex h-14 w-full items-center gap-3 rounded-[18px] bg-snow px-5 text-left text-[16px] font-semibold ${danger ? 'text-ember' : ''}`}
    >
      <Icon name={icon} size={20} />
      {label}
    </button>
  )
}

/** Fixed bottom CTA over a cream fade, above the safe area. */
export function StickyCTA({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] bg-gradient-to-t from-marzipan via-marzipan/95 to-transparent px-5 pt-6"
      style={{ paddingBottom: 'calc(var(--sa-bottom) + 16px)' }}
    >
      {children}
    </div>
  )
}
