/**
 * 05 · Wishlist — design/references/05-full-screen-overview.jpeg («My wishlist»).
 * Chocolate screen: back circle + «+» circle; two-line-safe title + lead; filter pills
 * (cream = active, translucent = idle); list of cream wish cards (3D category art on a soft
 * tile, title, price, link mark, «⋮» actions). Adding/editing happens in a bottom sheet, so the
 * screen stays a calm list. «Мои интересы» and «Не дарить» live in a compact group below.
 * Motion: layout reflow on add/remove (180–280 ms); saving is never blocked by animation.
 */
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { PrimaryCTA, buttonClass } from '@/components/ds'
import { CollapsingHeader, useLargeTitle } from '@/components/ds/apple'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Sheet } from '@/components/ui/Kit'
import { Art } from '@/components/art/Art'
import { useDemo } from '@/data/demoStore'
import { INTERESTS, interestById } from '@/domain/interests'
import { ideaArt } from '@/domain/giftIdeas'
import type { GiftIdea, InterestId, Priority, WishItem } from '@/domain/types'
import { formatRange, formatRub, plural } from '@/lib/format'
import { haptic, isTelegram } from '@/lib/telegram'
import { toast } from '@/data/uiStore'
import { interestsFromText } from '@/domain/topic'
import { DUR, EASE, PRESS, tween } from '@/motion/tokens'

type Draft = { title: string; price: string; priority: Priority; notes: string; url: string; category: InterestId }
type Filter = 'all' | 'links' | 'ideas'

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
  const [filter, setFilter] = useState<Filter>('all')
  /** undefined = editor closed, null = new wish, string = editing that wish */
  const [editing, setEditing] = useState<string | null | undefined>(undefined)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [avoidOpen, setAvoidOpen] = useState(false)
  const largeTitle = useLargeTitle()

  const withLinks = wishlist.filter((w) => w.url)
  const shown = filter === 'links' ? withLinks : wishlist
  const menuItem = wishlist.find((w) => w.id === menuFor)

  const openNew = () => {
    haptic.tap()
    setEditing(null)
  }

  return (
    <Screen surface="cocoa" back="/home" headless className="!pb-0">
      {/* Header: back circle + add circle; sticky iOS bar with a compact title on scroll */}
      <CollapsingHeader
        className="mt-[34px] [@media(max-height:820px)]:mt-4"
        title="Мой вишлист"
        left={
          !isTelegram ? (
            <motion.button whileTap={PRESS} aria-label="Назад" onClick={() => navigate('/home')} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <Icon name="back" size={22} />
            </motion.button>
          ) : undefined
        }
        right={
          <motion.button whileTap={PRESS} aria-label="Добавить желание" onClick={openNew} className="flex h-[46px] w-[46px] items-center justify-center rounded-full border-[1.25px] border-[#e2c7b4]/85 text-snow">
            <Icon name="plus" size={26} strokeWidth={1.5} />
          </motion.button>
        }
      />

      <div className="px-6 pt-[22px] [@media(max-height:820px)]:pt-3">
        <motion.h1 style={largeTitle} className="t-page-tight text-snow">
          Мой вишлист
        </motion.h1>
        <p className="t-lead mt-2 text-snow/80">Добавьте подарки, которые хотели бы получить</p>
      </div>

      {/* Filter pills */}
      <div role="tablist" aria-label="Фильтр вишлиста" className="no-scrollbar mt-5 flex gap-2 overflow-x-auto px-5">
        {(
          [
            ['all', 'Все', wishlist.length],
            ['links', 'Со ссылкой', withLinks.length],
            ['ideas', 'Идеи', savedIdeas.length],
          ] as const
        ).map(([id, label, count]) => {
          const active = filter === id
          return (
            <motion.button
              key={id}
              role="tab"
              aria-selected={active}
              whileTap={PRESS}
              onClick={() => {
                haptic.select()
                setFilter(id)
              }}
              className={`flex h-11 shrink-0 items-center gap-2 rounded-full px-[18px] text-callout transition-colors duration-200 ${active ? 'bg-marzipan font-medium text-ink' : 'bg-white/[0.09] text-snow/90'}`}
            >
              {label}
              <span className={`text-footnote ${active ? 'text-ink-soft' : 'text-snow/55'}`}>{count}</span>
            </motion.button>
          )
        })}
      </div>

      <div className="flex-1 px-4 pt-4" style={{ paddingBottom: 'calc(var(--sa-bottom) + 24px)' }}>
        <AnimatePresence mode="wait" initial={false}>
          {filter === 'ideas' ? (
            <motion.div key="ideas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={tween(0.18)}>
              <IdeasList ideas={savedIdeas} onMove={(idea) => {
                addWish({ title: idea.title, description: idea.why, category: idea.interests[0] ?? 'other', priority: 'normal' })
                removeIdea(idea.id)
                toast('Перенесено в вишлист')
              }} onRemove={removeIdea} />
            </motion.div>
          ) : (
            <motion.div key="items" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={tween(0.18)}>
              {wishlist.length === 0 ? (
                <EmptyWish onAdd={openNew} />
              ) : shown.length === 0 ? (
                <p className="px-3 py-6 text-center text-secondary text-snow/65">Пока нет желаний со ссылкой на товар</p>
              ) : (
                <LayoutGroup>
                  <ul className="space-y-2.5" aria-label="Желания">
                    <AnimatePresence initial={false}>
                      {shown.map((w, i) => (
                        <WishCard key={w.id} item={w} index={i} onOpen={() => setEditing(w.id)} onMenu={() => setMenuFor(w.id)} />
                      ))}
                    </AnimatePresence>
                  </ul>
                </LayoutGroup>
              )}

              {/* Hints for the Santa */}
              <div className="mt-5 overflow-hidden rounded-[24px] bg-white/[0.06]">
                <HintRow
                  icon="star"
                  title="Мои интересы"
                  label={`Мои интересы${interests.length ? ` (${interests.length})` : ''}`}
                  value={interests.length ? interests.map((i) => interestById[i].title).join(', ') : 'Не выбраны'}
                  onClick={() => navigate('/wishlist/interests')}
                />
                <div className="mx-5 h-px bg-white/[0.08]" />
                <HintRow icon="alert" title="Не дарить" label={`Не дарить${avoid.length ? ` (${avoid.length})` : ''}`} value={avoid.length ? avoid.join(', ') : 'Ничего не указано'} onClick={() => setAvoidOpen(true)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <WishEditorSheet
        open={editing !== undefined}
        item={editing ? wishlist.find((w) => w.id === editing) : undefined}
        fallbackCategory={interests[0]}
        onClose={() => setEditing(undefined)}
        onSave={(data, id) => {
          haptic.success()
          if (id) {
            updateWish(id, data)
            toast('Изменения сохранены')
          } else {
            addWish(data)
            toast('Добавлено в вишлист')
          }
          setEditing(undefined)
        }}
      />

      <Sheet open={Boolean(menuItem)} onClose={() => setMenuFor(null)} title={menuItem?.title}>
        <div className="space-y-2">
          <MenuRow icon="edit" label="Изменить" onClick={() => { setEditing(menuItem!.id); setMenuFor(null) }} />
          <MenuRow icon="up" label="Поднять выше" onClick={() => menuItem && moveWish(menuItem.id, -1)} />
          <MenuRow icon="down" label="Опустить ниже" onClick={() => menuItem && moveWish(menuItem.id, 1)} />
          <MenuRow
            icon="trash"
            label="Удалить желание"
            danger
            onClick={() => {
              if (!menuItem) return
              removeWish(menuItem.id)
              setMenuFor(null)
              toast('Удалено из вишлиста')
            }}
          />
        </div>
      </Sheet>

      <Sheet open={avoidOpen} onClose={() => setAvoidOpen(false)} title="Не дарить">
        <AvoidList avoid={avoid} onAdd={addAvoid} onRemove={removeAvoid} />
      </Sheet>

      <span className="sr-only" aria-live="polite">
        {wishlist.length} {plural(wishlist.length, 'желание', 'желания', 'желаний')}
      </span>
    </Screen>
  )
}

/* ───────────────────────── list pieces ───────────────────────── */

function WishCard({ item, index, onOpen, onMenu }: { item: WishItem; index: number; onOpen: () => void; onMenu: () => void }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24, transition: tween(DUR.layout) }}
      transition={{ duration: DUR.card, ease: EASE, delay: Math.min(index, 4) * 0.045 }}
      className="flex h-[104px] items-center rounded-[28px] bg-[linear-gradient(180deg,#ffe8d2,#fde2c8)] pl-3 pr-1.5 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,.5)]"
    >
      <motion.button
        whileTap={{ scale: 0.985 }}
        onClick={onOpen}
        aria-label={[item.title, item.price ? formatRub(item.price) : null, item.priority === 'high' ? 'высокий приоритет' : null].filter(Boolean).join(', ')}
        className="flex min-w-0 flex-1 items-center gap-4 text-left"
      >
        <span className="relative flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-[20px] bg-[#fff6ee] shadow-[inset_0_1px_2px_rgba(120,60,20,.08)]">
          <Art name={interestById[item.category].art} size={64} noShadow />
          {item.priority === 'high' && <span className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-ember" aria-hidden />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-button font-medium">{item.title}</span>
          <span className="mt-0.5 block text-callout text-ink-soft">{item.price ? formatRub(item.price) : 'Цена не указана'}</span>
          {item.url && <Icon name="link" size={15} className="mt-1 text-ink/40" aria-label="Есть ссылка" />}
        </span>
      </motion.button>
      <button aria-label="Ещё действия" onClick={onMenu} className="flex h-12 w-10 shrink-0 items-center justify-center rounded-full text-ink/70">
        <Icon name="more" size={24} strokeWidth={2.6} />
      </button>
    </motion.li>
  )
}

function EmptyWish({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex items-center gap-4 rounded-[28px] bg-[linear-gradient(180deg,#ffe8d2,#fde2c8)] p-3 pr-4 text-ink">
      <span className="flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-[20px] bg-[#fff6ee]">
        <Art name="stocking" size={62} noShadow />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-button font-semibold leading-tight">Добавьте первое желание</p>
        <p className="mt-1 text-footnote text-ink-soft">Санта увидит его после жеребьёвки</p>
      </div>
      <motion.button whileTap={PRESS} onClick={onAdd} aria-label="Новое желание" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-snow">
        <Icon name="plus" size={22} />
      </motion.button>
    </div>
  )
}

function IdeasList({ ideas, onMove, onRemove }: { ideas: GiftIdea[]; onMove: (i: GiftIdea) => void; onRemove: (id: string) => void }) {
  if (ideas.length === 0)
    return (
      <div className="flex flex-col items-center px-4 pt-4 text-center">
        <Art name="robot" size={140} />
        <p className="type-h3 mt-3">Здесь будут идеи</p>
        <p className="mt-1 max-w-[30ch] text-secondary text-snow/65">Сохраняйте понравившиеся подарки в Gift AI, чтобы вернуться к ним позже</p>
        <Link to="/ai" className={buttonClass({ variant: 'secondary', size: 'medium', className: 'mt-5' })}>
          Открыть Gift AI
        </Link>
      </div>
    )
  return (
    <ul className="space-y-2.5">
      <AnimatePresence initial={false}>
        {ideas.map((idea) => (
          <motion.li key={idea.id} layout exit={{ opacity: 0, x: -20, transition: tween(DUR.layout) }} className="flex gap-4 rounded-[28px] bg-[linear-gradient(180deg,#ffe8d2,#fde2c8)] p-3 text-ink">
            <span className="flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-[20px] bg-[#fff6ee]">
              <Art name={ideaArt(idea, (i) => interestById[i]?.art ?? 'gift')} size={64} noShadow />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-callout font-semibold leading-tight">{idea.title}</p>
              <p className="mt-1 text-caption text-ink-soft">Примерно {formatRange(idea.priceMin, idea.priceMax)}</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => onMove(idea)} className="h-9 rounded-full bg-ember px-3.5 text-footnote font-semibold text-snow">
                  В мой вишлист
                </button>
                <button onClick={() => onRemove(idea.id)} className="h-9 rounded-full bg-ink/8 px-3.5 text-footnote font-semibold">
                  Убрать
                </button>
              </div>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

function HintRow({ icon, label, value, onClick }: { icon: IconName; title?: string; label: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex min-h-[64px] w-full items-center gap-4 px-5 py-3 text-left">
      <Icon name={icon} size={20} className="shrink-0 text-gold" />
      <span className="min-w-0 flex-1">
        <span className="block text-body text-snow">{label}</span>
        <span className="block truncate text-footnote text-snow/55">{value}</span>
      </span>
      <Icon name="forward" size={18} className="shrink-0 text-snow/60" />
    </button>
  )
}

/* ───────────────────────── editor sheet ───────────────────────── */

type WishData = Omit<WishItem, 'id' | 'createdAt'>

function WishEditorSheet({
  open,
  item,
  fallbackCategory,
  onClose,
  onSave,
}: {
  open: boolean
  item?: WishItem
  fallbackCategory?: InterestId
  onClose: () => void
  onSave: (data: Pick<WishData, 'title' | 'price' | 'url' | 'description' | 'category' | 'priority'>, id?: string) => void
}) {
  return (
    <Sheet open={open} onClose={onClose} title={item ? 'Изменить желание' : 'Новое желание'}>
      {/* keyed so the form resets for every item */}
      {open && <WishForm key={item?.id ?? 'new'} item={item} fallbackCategory={fallbackCategory} onSave={onSave} />}
    </Sheet>
  )
}

function WishForm({ item, fallbackCategory, onSave }: { item?: WishItem; fallbackCategory?: InterestId; onSave: Parameters<typeof WishEditorSheet>[0]['onSave'] }) {
  const original = useMemo(() => toDraft(item, fallbackCategory), [item, fallbackCategory])
  const [draft, setDraft] = useState<Draft>(original)
  // New wish: until the user picks a category, guess it from the title («Наушники» → Техника).
  const [categoryTouched, setCategoryTouched] = useState(Boolean(item))
  const dirty = JSON.stringify(draft) !== JSON.stringify(original)
  const urlError = !isValidUrl(draft.url.trim())
  const titleError = draft.title.trim().length > 0 && draft.title.trim().length < 2

  const save = () => {
    const title = draft.title.trim()
    if (title.length < 2) return toast('Напишите, что вы хотите — хотя бы 2 буквы', 'error')
    if (urlError) return toast('Ссылка должна начинаться с https://', 'error')
    onSave(
      {
        title: title.slice(0, 80),
        price: draft.price ? Number(draft.price) : undefined,
        url: draft.url.trim() || undefined,
        description: draft.notes.trim().slice(0, 300) || undefined,
        category: categoryTouched ? draft.category : (interestsFromText(title)[0] ?? draft.category),
        priority: draft.priority,
      },
      item?.id,
    )
  }

  return (
    <div className="space-y-4">
      <Field label="Что подарить" error={titleError ? 'Хотя бы 2 буквы' : undefined}>
        <input className={inputCls(titleError)} value={draft.title} maxLength={80} placeholder="Например, фотоаппарат моментальной печати" onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
      </Field>

      <div className="grid grid-cols-[1fr_1.4fr] gap-3">
        <Field label="Цена, ₽">
          <input className={inputCls()} inputMode="numeric" placeholder="Примерно" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value.replace(/\D/g, '').slice(0, 7) })} />
        </Field>
        <Field label="Категория">
          <select className={inputCls()} value={draft.category} onChange={(e) => {
              setCategoryTouched(true)
              setDraft({ ...draft, category: e.target.value as InterestId })
            }}>
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
                className={`h-12 rounded-[16px] text-secondary font-semibold transition-colors duration-200 ${active ? 'bg-ember text-snow shadow-[0_8px_18px_-10px_rgba(213,54,28,.9)]' : 'bg-snow text-ink/70'}`}
              >
                {p.label}
              </motion.button>
            )
          })}
        </div>
      </div>

      <Field label="Заметки">
        <textarea className={`${inputCls()} h-24 resize-none py-3 leading-snug`} maxLength={300} placeholder="Цвет, размер, модель — всё, что поможет Санте" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
      </Field>

      <Field label="Ссылка на товар" error={urlError ? 'Ссылка должна начинаться с https://' : undefined}>
        <div className="relative">
          <Icon name="link" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/45" />
          <input className={`${inputCls(urlError)} pl-11 pr-11`} inputMode="url" placeholder="https://" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
          {draft.url && (
            <button aria-label="Очистить ссылку" onClick={() => setDraft({ ...draft, url: '' })} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink/55">
              <Icon name="close" size={18} />
            </button>
          )}
        </div>
      </Field>

      <div className="pt-1">
        <PrimaryCTA icon="check" onClick={save} disabled={Boolean(item) && !dirty}>
          {!item ? 'Добавить в вишлист' : dirty ? 'Сохранить изменения' : 'Сохранено'}
        </PrimaryCTA>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="type-label mb-2 block text-ink/75">{label}</span>
      {children}
      <AnimatePresence>
        {error && (
          <motion.span initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={tween(DUR.chip)} className="mt-1.5 block text-footnote font-medium text-ember" role="alert">
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  )
}

const inputCls = (error?: boolean) =>
  `h-[52px] w-full rounded-[16px] bg-snow px-4 text-body text-ink placeholder:text-ink/35 outline-none transition-shadow duration-200 ${
    error ? 'shadow-[0_0_0_2px_#D5361C]' : 'shadow-[0_0_0_1px_rgba(40,29,25,.08)] focus:shadow-[0_0_0_2px_#D5361C]'
  }`

function AvoidList({ avoid, onAdd, onRemove }: { avoid: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void }) {
  const [text, setText] = useState('')
  return (
    <div className="pb-2">
      <p className="text-center text-secondary text-ink-soft">Санта увидит этот список вместе с вишлистом</p>
      {avoid.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <AnimatePresence initial={false}>
            {avoid.map((a) => (
              <motion.button key={a} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={tween(DUR.chip)} onClick={() => onRemove(a)} aria-label={`Убрать «${a}»`} className="flex h-9 items-center gap-1.5 rounded-full bg-ink/8 pl-3.5 pr-2.5 text-footnote font-semibold">
                {a}
                <Icon name="close" size={14} />
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          const t = text.trim()
          if (t.length >= 2) onAdd(t.slice(0, 40))
          setText('')
        }}
      >
        <input className={`${inputCls()} h-11`} placeholder="Например, сладкое" value={text} onChange={(e) => setText(e.target.value)} aria-label="Что не дарить" />
        <button className="h-11 shrink-0 rounded-full bg-ink px-4 text-secondary font-semibold text-snow">Добавить</button>
      </form>
    </div>
  )
}

function MenuRow({ icon, label, onClick, danger }: { icon: IconName; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={() => {
        haptic.tap()
        onClick()
      }}
      className={`flex h-14 w-full items-center gap-3 rounded-[18px] bg-snow px-5 text-left text-body font-semibold ${danger ? 'text-ember' : ''}`}
    >
      <Icon name={icon} size={20} />
      {label}
    </button>
  )
}
