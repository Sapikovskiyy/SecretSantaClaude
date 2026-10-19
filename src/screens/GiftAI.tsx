/**
 * 06 · Gift AI — design/references/05-full-screen-overview.jpeg («Gift ideas just for them»).
 * Back circle + filters circle; two-line title; cream speech bubble next to the robot mascot;
 * cream «Выберите получателя» panel with avatars; dark query pill with a red send button.
 * Budget and interests live in the filters sheet. Up to 5 recommendations with save,
 * follow-ups, free limit → Santa+.
 * Controlled workflow (not a free chat); every free-text query passes the topic guard.
 * DEMO: ideas come from the local catalog instantly — no fake «thinking» delay, and
 * prices are category ranges, never live shop prices. Phase 4: Edge Function → Yandex AI.
 */
import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Avatar, Chip, DemoBadge, Sheet } from '@/components/ui/Kit'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { RiveAnimation } from '@/animation'
import { ErrorState, SantomiButton } from '@/components/ds'
import { FREE_AI_GENERATIONS, useDemo } from '@/data/demoStore'
import { DEMO_WISHLISTS } from '@/data/demoSeed'
import { personById, personName } from '@/data/people'
import { INTERESTS, interestById } from '@/domain/interests'
import { ideaArt, suggestIdeas, type FollowUp } from '@/domain/giftIdeas'
import { checkGiftTopic, interestsFromText, MAX_QUERY_LENGTH } from '@/domain/topic'
import type { GiftIdea, InterestId } from '@/domain/types'
import { formatRange } from '@/lib/format'
import { haptic, isTelegram } from '@/lib/telegram'
import { toast } from '@/data/uiStore'
import { DUR, EASE, PRESS, cardIn } from '@/motion/tokens'

const BUDGETS = [
  { id: 'low', label: 'До 1 000 ₽', value: 1000 },
  { id: 'mid', label: '1–3 тыс. ₽', value: 3000 },
  { id: 'high', label: 'От 3 000 ₽', value: 8000 },
] as const
type BudgetId = (typeof BUDGETS)[number]['id']
const budgetFor = (rub: number): BudgetId => (rub <= 1000 ? 'low' : rub <= 3000 ? 'mid' : 'high')

const FOLLOW_UPS: { id: FollowUp; label: string }[] = [
  { id: 'cheaper', label: 'Предложи дешевле' },
  { id: 'unusual', label: 'Что-то необычное' },
  { id: 'practical', label: 'Более практичный' },
  { id: 'again', label: 'Попробуй ещё' },
]

export function GiftAI() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { rooms, me, aiUsed, consumeAi, savedIdeas, saveIdea, removeIdea } = useDemo()

  const recipients = useMemo(
    () =>
      rooms
        .filter((r) => r.stage === 'drawn' && r.revealSeen && r.myRecipientId)
        .map((r) => ({ roomId: r.id, personId: r.myRecipientId!, budget: r.budget, name: personName(r.myRecipientId!, me), person: personById(r.myRecipientId!, me) })),
    [rooms, me],
  )
  const preset = recipients.find((o) => o.roomId === params.get('room')) ?? recipients[0]

  const [who, setWho] = useState<string>(preset?.personId ?? 'friend')
  const [budget, setBudget] = useState<BudgetId>(budgetFor(preset?.budget ?? 3000))
  const [interests, setInterests] = useState<InterestId[]>(preset ? (DEMO_WISHLISTS[preset.personId]?.interests ?? []) : [])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GiftIdea[] | null>(null)
  const [shown, setShown] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pickInterests, setPickInterests] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)
  const [paywall, setPaywall] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const recipient = recipients.find((r) => r.personId === who)
  const left = Math.max(0, FREE_AI_GENERATIONS - aiUsed)
  const forName = recipient?.name

  const generate = (followUp?: FollowUp) => {
    setError(null)
    const verdict = checkGiftTopic(query)
    if (!verdict.ok) {
      haptic.error()
      setError(verdict.reason === 'too_long' ? `Слишком длинный запрос — до ${MAX_QUERY_LENGTH} символов` : 'Gift AI помогает только с подарками. Опишите, кому и что вы ищете.')
      return
    }
    if (!consumeAi()) {
      haptic.error()
      setPaywall(true)
      return
    }
    setLoading(true)
    // Demo: synchronous local catalog. In production this awaits the server — the loader
    // runs exactly as long as the real request, never longer.
    const wishInterests = recipient ? (DEMO_WISHLISTS[recipient.personId]?.interests ?? []) : []
    const ideas = suggestIdeas(
      {
        budget: BUDGETS.find((b) => b.id === budget)!.value,
        interests: [...new Set([...interests, ...wishInterests, ...interestsFromText(query)])],
        followUp,
        exclude: followUp ? shown : [],
        seed: Date.now() % 100000,
      },
      5,
    )
    setShown((s) => [...s, ...ideas.map((i) => i.id)])
    setResults(ideas)
    setLoading(false)
    haptic.success()
  }

  const toggleSave = (idea: GiftIdea) => {
    if (savedIdeas.some((s) => s.id === idea.id)) removeIdea(idea.id)
    else {
      saveIdea(idea)
      toast('Идея сохранена в вишлист → Идеи')
    }
  }

  const personas: { id: string; label: string; icon: IconName }[] = [
    { id: 'friend', label: 'Друг', icon: 'user' },
    { id: 'colleague', label: 'Коллега', icon: 'users' },
    { id: 'family', label: 'Родные', icon: 'home' },
    { id: 'partner', label: 'Партнёр', icon: 'heart' },
  ]
  const pickRecipient = (r: (typeof recipients)[number]) => {
    haptic.select()
    setWho(r.personId)
    setBudget(budgetFor(r.budget))
    setInterests(DEMO_WISHLISTS[r.personId]?.interests ?? [])
    setResults(null)
  }

  return (
    <Screen withDock headless>
      {/* warm light behind the mascot */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_40%_at_85%_40%,rgba(201,53,31,.42),transparent_70%)]" />

      {/* Header: back circle + filters */}
      <div className="relative mt-[34px] flex h-12 items-center justify-between px-[22px] [@media(max-height:820px)]:mt-4">
        {!isTelegram ? (
          <motion.button whileTap={PRESS} aria-label="Назад" onClick={() => navigate('/home')} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Icon name="back" size={22} />
          </motion.button>
        ) : (
          <span className="w-12" />
        )}
        <motion.button whileTap={PRESS} aria-label="Настройки подбора" onClick={() => setFiltersOpen(true)} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
          <Icon name="sliders" size={22} />
        </motion.button>
      </div>

      <div className="relative px-6 pt-[22px] [@media(max-height:820px)]:pt-3">
        <h1 className="t-page-tight max-w-[12ch] text-snow">Идеи подарков именно для них</h1>
        <p className="t-lead mt-2 max-w-[30ch] text-snow/80">Расскажите о человеке и получите персональные идеи.</p>
      </div>

      {/* Speech bubble + mascot */}
      <div className="relative mt-3 flex h-[150px] items-start px-5">
        <motion.div
          key={forName ?? 'any'}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: DUR.card, ease: EASE }}
          className="relative z-10 mt-4 max-w-[58%] rounded-[24px] rounded-br-[8px] bg-[linear-gradient(180deg,#fff1e3,#fde5cf)] px-5 py-4 text-ink shadow-[0_14px_30px_-16px_rgba(0,0,0,.7)]"
        >
          <p className="text-callout font-medium leading-snug">{forName ? `Подарок для: ${forName}` : 'Для кого ищем подарок?'}</p>
          {forName && <p className="mt-1 text-footnote leading-snug text-ink-soft">Учитываю интересы, вишлист и бюджет</p>}
        </motion.div>
        <motion.div
          className="absolute -top-5 right-1"
          animate={loading ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={loading ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
        >
          {/* Rive robot when src/assets/rive/gift-ai-robot.riv exists; static 3D render until then */}
          <RiveAnimation asset="gift-ai-robot" stateMachine="Robot" boolInput={{ name: 'thinking', value: loading }} label="Робот Gift AI" className="h-[176px] w-[176px]" fallback={<Art name="mascot" size={176} eager noShadow />} />
        </motion.div>
      </div>

      {/* Recipient panel */}
      <section className="relative z-10 mx-4 rounded-[30px] bg-marzipan px-5 pb-4 pt-4 text-ink shadow-[0_18px_40px_-20px_rgba(0,0,0,.6)]">
        <div className="flex items-center justify-between">
          <h2 className="text-button font-medium">Выберите получателя</h2>
          <Icon name="forward" size={18} className="text-ink/60" />
        </div>
        <div className="no-scrollbar -mx-5 mt-3 flex gap-4 overflow-x-auto px-5" role="radiogroup" aria-label="Для кого">
          {recipients.map((r) => (
            <RecipientChoice key={r.personId} label={r.name} active={who === r.personId} onClick={() => pickRecipient(r)}>
              <Avatar person={r.person} size={54} />
            </RecipientChoice>
          ))}
          {personas.map((p) => (
            <RecipientChoice
              key={p.id}
              label={p.label}
              active={who === p.id}
              onClick={() => {
                haptic.select()
                setWho(p.id)
                setResults(null)
              }}
            >
              <span className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#f6d6bb] text-ink/80">
                <Icon name={p.icon} size={24} />
              </span>
            </RecipientChoice>
          ))}
        </div>
      </section>

      {/* Query: dark pill + red send */}
      <form
        className="relative mx-4 mt-3 flex items-center gap-2 rounded-full bg-white/[0.09] p-1.5 pl-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,.06)] focus-within:shadow-[inset_0_0_0_1.5px_rgba(239,73,48,.9)]"
        onSubmit={(e) => {
          e.preventDefault()
          generate()
        }}
      >
        <input
          aria-label="Что ищем"
          value={query}
          maxLength={MAX_QUERY_LENGTH + 20}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Что ещё учесть? Например, любит кофе"
          className="h-12 min-w-0 flex-1 bg-transparent text-callout text-snow outline-none placeholder:text-snow/45"
        />
        <motion.button
          whileTap={PRESS}
          aria-label={forName ? `Подобрать идеи: ${forName}` : 'Подобрать идеи'}
          disabled={loading}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#f2583a,#d23a22)] text-snow shadow-[0_8px_18px_-8px_rgba(217,54,36,.9)] disabled:opacity-50"
        >
          <Icon name="send" size={20} strokeWidth={2} />
        </motion.button>
      </form>
      <div className="relative mx-5 mt-2 flex items-center justify-between gap-3">
        <p className="text-caption text-snow/55">
          Бесплатно осталось: {left} из {FREE_AI_GENERATIONS}
        </p>
        <button onClick={() => setSavedOpen(true)} className="flex h-9 items-center gap-1.5 rounded-full px-2 text-caption font-medium text-snow/75">
          <Icon name="heart" size={15} className={savedIdeas.length ? 'text-ember-bright' : ''} /> Сохранённые идеи ({savedIdeas.length})
        </button>
      </div>

      {error && (
        <div className="relative mx-4 mt-3">
          <ErrorState title="Не получилось подобрать" text={error} />
        </div>
      )}

      {/* Results */}
      <div className="relative mx-4 mt-4" aria-live="polite">
        {loading && (
          <div className="flex items-center gap-2 text-secondary text-snow/70">
            <span className="sbtn-spinner text-ember" aria-hidden /> Подбираем идеи…
          </div>
        )}
        {!loading && results && (
          <>
            <h2 className="t-section px-1 text-snow">{forName ? `Рекомендации · ${forName}` : 'Рекомендации'}</h2>
            {results.length === 0 ? (
              <p className="mt-2 rounded-[22px] bg-marzipan p-4 text-callout text-ink">С таким бюджетом идей не нашлось. Попробуйте бюджет побольше.</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                <AnimatePresence initial={false}>
                  {results.map((idea, i) => (
                    <motion.li key={idea.id} {...cardIn(i)}>
                      <IdeaCard idea={idea} saved={savedIdeas.some((s) => s.id === idea.id)} onToggle={() => toggleSave(idea)} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
            <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
              {FOLLOW_UPS.map((f) => (
                <Chip key={f.id} onClick={() => generate(f.id)}>
                  {f.label}
                </Chip>
              ))}
            </div>
            <p className="mt-3 px-1 text-caption leading-snug text-snow/50">Цены — примерный диапазон по категории, а не цены магазинов. Демо: идеи из локального каталога, не ИИ.</p>
          </>
        )}
        <div className="mt-4 flex justify-center pb-2">
          <DemoBadge />
        </div>
      </div>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Настройки подбора">
        <p className="type-label text-ink/75">Бюджет</p>
        <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Бюджет">
          {BUDGETS.map((b) => (
            <motion.button
              key={b.id}
              role="radio"
              aria-checked={budget === b.id}
              whileTap={PRESS}
              onClick={() => {
                haptic.select()
                setBudget(b.id)
              }}
              className={`h-11 whitespace-nowrap rounded-full px-2 text-footnote font-semibold transition-colors duration-200 ${budget === b.id ? 'bg-ember text-snow' : 'bg-snow text-ink/75'}`}
            >
              {b.label}
            </motion.button>
          ))}
        </div>
        <p className="type-label mt-5 text-ink/75">Интересы получателя</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {interests.map((id) => (
            <button
              key={id}
              onClick={() => setInterests((s) => s.filter((x) => x !== id))}
              aria-label={`Убрать интерес ${interestById[id].title}`}
              className="flex h-10 items-center gap-1.5 rounded-full bg-snow pl-1.5 pr-3 text-footnote font-semibold"
            >
              <Art name={interestById[id].art} size={26} noShadow />
              {interestById[id].title}
              <Icon name="close" size={13} className="text-ink/40" />
            </button>
          ))}
          <button onClick={() => setPickInterests(true)} className="flex h-10 items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-ink/25 px-3.5 text-footnote font-semibold text-ink/70">
            <Icon name="plus" size={14} /> Добавить
          </button>
        </div>
        <SantomiButton variant="secondary" fullWidth className="mt-5" onClick={() => setFiltersOpen(false)}>
          Готово
        </SantomiButton>
      </Sheet>

      <Sheet open={pickInterests} onClose={() => setPickInterests(false)} title="Интересы получателя">
        <div className="grid grid-cols-3 gap-2">
          {INTERESTS.map((it) => {
            const on = interests.includes(it.id)
            return (
              <motion.button
                key={it.id}
                whileTap={PRESS}
                aria-pressed={on}
                onClick={() => setInterests((s) => (on ? s.filter((x) => x !== it.id) : [...s, it.id]))}
                className={`flex flex-col items-center gap-1 rounded-[18px] p-2 transition-colors ${on ? 'bg-pine text-snow' : 'bg-snow'}`}
              >
                <Art name={it.art} size={52} noShadow />
                <span className="text-caption font-semibold">{it.title}</span>
              </motion.button>
            )
          })}
        </div>
        <SantomiButton variant="secondary" fullWidth className="mt-4" onClick={() => setPickInterests(false)}>
          Готово
        </SantomiButton>
      </Sheet>

      <Sheet open={savedOpen} onClose={() => setSavedOpen(false)} title="Сохранённые идеи">
        {savedIdeas.length === 0 ? (
          <p className="pb-4 text-center text-callout text-ink-soft">Нажмите ♡ на рекомендации, чтобы сохранить её</p>
        ) : (
          <ul className="space-y-2.5">
            {savedIdeas.map((idea) => (
              <li key={idea.id}>
                <IdeaCard idea={idea} saved onToggle={() => removeIdea(idea.id)} />
              </li>
            ))}
          </ul>
        )}
      </Sheet>

      <Sheet open={paywall} onClose={() => setPaywall(false)} title="Бесплатные подборы закончились">
        <div className="flex flex-col items-center text-center">
          <Art name="robot" size={120} />
          <p className="mt-2 max-w-[30ch] text-callout text-ink/70">С Santa+ — 50 подборов на 30 дней, анализ вишлистов и сохранённые идеи</p>
          <SantomiButton variant="premium" leadingIcon="star" fullWidth className="mt-5" onClick={() => navigate('/premium')}>
            Подробнее о Santa+
          </SantomiButton>
          <button className="mt-3 h-11 text-secondary text-ink-soft" onClick={() => setPaywall(false)}>
            Не сейчас
          </button>
        </div>
      </Sheet>
    </Screen>
  )
}

function IdeaCard({ idea, saved, onToggle }: { idea: GiftIdea; saved: boolean; onToggle: () => void }) {
  const art = ideaArt(idea, (i) => interestById[i]?.art ?? 'gift')
  return (
    <div className="flex gap-3 rounded-[22px] bg-snow p-3 text-ink">
      <span className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[18px] bg-marzipan">
        <Art name={art} size={64} noShadow />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold leading-tight">{idea.title}</p>
        <p className="mt-0.5 text-callout font-semibold text-ember">{formatRange(idea.priceMin, idea.priceMax)}</p>
        <p className="mt-0.5 text-footnote text-ink-soft">{idea.why}</p>
      </div>
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => {
          haptic.tap()
          onToggle()
        }}
        aria-label={saved ? 'Убрать из сохранённых' : 'Сохранить идею'}
        aria-pressed={saved}
        className={`flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-full transition-colors ${saved ? 'bg-ember text-snow' : 'bg-ember/10 text-ember'}`}
      >
        <Icon name="heart" size={18} />
      </motion.button>
    </div>
  )
}

function RecipientChoice({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <motion.button whileTap={PRESS} role="radio" aria-checked={active} aria-label={label} onClick={onClick} className="flex w-[62px] shrink-0 flex-col items-center gap-1.5">
      <span className={`rounded-full p-[3px] transition-shadow duration-200 ${active ? 'shadow-[0_0_0_2.5px_#d93624]' : ''}`}>{children}</span>
      <span className={`max-w-full truncate text-footnote ${active ? 'font-semibold text-ink' : 'text-ink/75'}`}>{label}</span>
    </motion.button>
  )
}
