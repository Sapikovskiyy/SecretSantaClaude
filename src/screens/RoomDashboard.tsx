/**
 * 07 · Game room — design/references/05-overview-original.png («Work group»).
 * Warm red light at the top; back + gear circles; centred game name and «N участников ·
 * Бюджет до …»; snow globe between two glowing stars; a cream panel rises over the scene with
 * a status card (calendar + date + black arrow), the participants' avatars and a quiet list:
 * Участники · Обмен вишлистами · Анонимный чат · Настройки игры.
 * Stage-aware: gathering → draw (organizer only); drawn → reveal / recipient / chats; finished.
 * The organizer only ever sees aggregate readiness, never pairs.
 */
import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Avatar, Chip, Field, Sheet, Toggle, inputLight } from '@/components/ui/Kit'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { GlowStar } from '@/components/GlowStar'
import { CalendarMark } from '@/components/CalendarMark'
import { SantomiButton } from '@/components/ds'
import { useRoomStats } from '@/components/ds/blocks'
import { ME, isMember, unreadCount, useDemo } from '@/data/demoStore'
import { personName, usePerson } from '@/data/people'
import type { GiftStatus, Room } from '@/domain/types'
import { formatRub, plural } from '@/lib/format'
import { haptic, isTelegram } from '@/lib/telegram'
import { toast } from '@/data/uiStore'
import { EASE, PRESS } from '@/motion/tokens'
import { NotFound } from './NotFound'

const GIFT_STEPS: { id: GiftStatus; label: string }[] = [
  { id: 'choosing', label: 'Выбираю' },
  { id: 'bought', label: 'Купил' },
  { id: 'ready', label: 'Упаковал' },
]

const longDate = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).replace(' г.', '')

const rise = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, ease: EASE, delay: 0.06 + i * 0.05 },
})

export function RoomDashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const room = useDemo((s) => s.rooms.find((r) => r.id === id))
  const { setGiftStatus, chats, me } = useDemo()
  const { people, ready } = useRoomStats(room)
  const recipient = usePerson(room?.myRecipientId)
  const [settings, setSettings] = useState(false)

  if (!room) return <NotFound />
  if (!isMember(room)) return <Navigate to={`/join/${room.inviteCode}`} replace />
  const isOrganizer = room.organizerId === ME
  const myMember = room.members.find((m) => m.personId === ME)
  const drawn = room.stage !== 'gathering'
  const unread = unreadCount(chats, room.id, 'fromSanta') + unreadCount(chats, room.id, 'toRecipient')

  // Status card: the one thing that matters for this game right now.
  const status: { label: string; value: string; action?: { to: string; label: string } } =
    room.stage === 'gathering'
      ? {
          label: 'Жеребьёвка',
          value: room.drawDate ? longDate(room.drawDate) : 'Когда соберутся все',
          action: isOrganizer ? { to: `/rooms/${room.id}/draw`, label: 'Перейти к жеребьёвке' } : undefined,
        }
      : room.stage === 'drawn' && !room.revealSeen
        ? { label: 'Жеребьёвка прошла', value: 'Откройте свой подарок', action: { to: `/rooms/${room.id}/reveal`, label: 'Узнать, кому я дарю' } }
        : room.stage === 'drawn'
          ? { label: 'Вы дарите подарок', value: recipient?.name ?? 'Получатель', action: { to: `/rooms/${room.id}/recipient`, label: 'Вишлист получателя' } }
          : { label: 'Обмен завершён', value: longDate(room.date) }

  const wishValue = drawn && room.revealSeen ? 'Открыть' : !myMember?.wishlistReady ? 'Заполните' : ready.length === people.length ? 'Готово' : `${ready.length} из ${people.length}`
  const wishTo = drawn && room.revealSeen ? `/rooms/${room.id}/recipient` : '/wishlist'

  return (
    <Screen back="/home" headless surface="cocoa" className="!pb-0">
      {/* warm festive light behind the scene */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[460px]"
        style={{ background: 'radial-gradient(110% 70% at 50% 30%, rgba(160,34,18,.75) 0%, rgba(110,24,12,.55) 40%, rgba(45,29,22,0) 75%)' }}
      />

      {/* Header */}
      <div className="relative z-10 mt-[22px] flex h-12 items-center justify-between px-[22px]">
        {!isTelegram ? (
          <motion.button whileTap={PRESS} aria-label="Назад" onClick={() => navigate('/home')} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Icon name="back" size={22} />
          </motion.button>
        ) : (
          <span className="w-12" />
        )}
        {isOrganizer && room.stage === 'gathering' ? (
          <motion.button whileTap={PRESS} aria-label="Настройки игры" onClick={() => setSettings(true)} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Icon name="gear" size={21} strokeWidth={1.6} />
          </motion.button>
        ) : (
          <span className="w-12" />
        )}
      </div>

      <div className="relative z-10 -mt-1 px-6 text-center">
        <h1 className="t-section mx-auto max-w-[16ch] truncate font-medium text-snow">{room.name}</h1>
        <p className="mt-1 text-callout text-snow/80">
          {people.length} {plural(people.length, 'участник', 'участника', 'участников')} · Бюджет до {formatRub(room.budget)}
        </p>
      </div>

      {/* Scene */}
      <div aria-hidden className="relative z-0 mx-auto mt-2 flex h-[206px] w-full items-end justify-center [@media(max-height:820px)]:h-[176px]">
        <GlowStar size={44} style={{ left: '9%', top: '46%' }} />
        <GlowStar size={40} delay={2} style={{ right: '10%', top: '38%' }} />
        <Art name="snow-globe" size="min(214px, 22dvh)" eager noShadow />
      </div>

      {/* Cream panel */}
      <section className="relative z-10 -mt-[34px] flex-1 rounded-t-[32px] bg-[linear-gradient(180deg,#ffe7d1,#fde0c6)] px-4 pt-4 text-ink shadow-[0_-10px_30px_-12px_rgba(0,0,0,.5)]" style={{ paddingBottom: 'calc(var(--sa-bottom) + 20px)' }}>
        {/* Status */}
        <motion.div {...rise(0)} className="flex min-h-[76px] items-center gap-4 rounded-[24px] bg-[#fff2e6] py-3 pl-4 pr-3 shadow-[0_1px_0_rgba(255,255,255,.6)_inset,0_6px_16px_-10px_rgba(80,40,10,.35)]">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#fde3cc]">
            <CalendarMark size={26} variant="outline" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-secondary text-ink-soft">{status.label}</span>
            <span className="block truncate text-button">{status.value}</span>
          </span>
          {status.action && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              aria-label={status.action.label}
              onClick={() => {
                haptic.press()
                navigate(status.action!.to)
              }}
              className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-ink text-snow shadow-[0_6px_14px_-6px_rgba(0,0,0,.6)]"
            >
              <Icon name="arrowRight" size={22} strokeWidth={1.8} />
            </motion.button>
          )}
        </motion.div>
        {room.stage === 'gathering' && !isOrganizer && (
          <p className="mt-2 px-2 text-footnote text-ink-soft">Жеребьёвку проведёт организатор — {personName(room.organizerId, me)}. Мы сообщим, когда она пройдёт.</p>
        )}

        {/* Avatars */}
        <motion.button
          {...rise(1)}
          whileTap={{ scale: 0.985 }}
          onClick={() => navigate(room.stage === 'gathering' ? `/rooms/${room.id}/invite` : `/rooms/${room.id}/participants`)}
          className="mt-3 flex h-[62px] w-full items-center rounded-[22px] pl-2 pr-3 text-left"
        >
          <span className="flex items-center">
            {people.slice(0, 4).map((p, i) => (
              <span key={p.id} style={{ marginLeft: i ? -10 : 0 }} className="rounded-full ring-2 ring-[#fde3cb]">
                <Avatar person={p} size={42} />
              </span>
            ))}
            {people.length > 4 && (
              <span style={{ marginLeft: -10 }} className="flex h-[42px] min-w-[42px] items-center justify-center rounded-full bg-[#f3d2b8] px-1 text-footnote text-ink/75 ring-2 ring-[#fde3cb]">
                +{people.length - 4}
              </span>
            )}
          </span>
          <span className="sr-only">{room.stage === 'gathering' ? 'Пригласить участников' : 'Все участники'}</span>
          <span className="ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-ink/[0.07] text-ink/80">
            <Icon name="forward" size={20} strokeWidth={1.8} />
          </span>
        </motion.button>

        {/* List */}
        <motion.ul {...rise(2)} className="mt-1">
          <Row icon="users" label="Участники" value={String(people.length)} onClick={() => navigate(`/rooms/${room.id}/participants`)} />
          <Row icon="gift" label="Обмен вишлистами" value={wishValue} onClick={() => navigate(wishTo)} />
          <Row
            icon="chat"
            label="Анонимный чат"
            value={!room.chatEnabled ? 'Выключен' : drawn ? undefined : 'Позже'}
            badge={unread || undefined}
            disabled={!room.chatEnabled || !drawn}
            onClick={() => navigate('/chats')}
          />
          {isOrganizer && room.stage === 'gathering' && <Row icon="gear" label="Настройки игры" onClick={() => setSettings(true)} last />}
          {!(isOrganizer && room.stage === 'gathering') && <Row icon="help" label="Правила и исключения" onClick={() => navigate(`/rooms/${room.id}/participants`)} last />}
        </motion.ul>

        {/* Gift progress after the draw */}
        {room.stage === 'drawn' && room.revealSeen && (
          <motion.div {...rise(3)} className="mt-3 rounded-[22px] bg-[#fff2e6] p-4">
            <p className="text-secondary text-ink-soft">Как дела с подарком?</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {GIFT_STEPS.map((g) => (
                <Chip
                  key={g.id}
                  tone="light"
                  active={myMember?.giftStatus === g.id}
                  onClick={() => {
                    setGiftStatus(room.id, g.id)
                    if (g.id === 'ready') toast('Отлично! Подарок готов')
                  }}
                >
                  {myMember?.giftStatus === g.id && <Icon name="check" size={16} />}
                  {g.label}
                </Chip>
              ))}
            </div>
            {isOrganizer && (
              <p className="mt-3 text-caption text-ink-soft">
                В группе готово {room.members.filter((m) => m.giftStatus === 'ready').length} из {room.members.length}. Кто кому дарит, не видит даже организатор.
              </p>
            )}
          </motion.div>
        )}
      </section>

      <SettingsSheet open={settings} onClose={() => setSettings(false)} room={room} />
    </Screen>
  )
}

function Row({ icon, label, value, badge, onClick, disabled, last }: { icon: IconName; label: string; value?: ReactNode; badge?: number; onClick: () => void; disabled?: boolean; last?: boolean }) {
  return (
    <li className={last ? '' : 'border-b border-ink/[0.08]'}>
      <motion.button
        whileTap={disabled ? undefined : { scale: 0.99 }}
        disabled={disabled}
        onClick={() => {
          haptic.tap()
          onClick()
        }}
        className="flex h-[58px] w-full items-center gap-4 px-2 text-left disabled:opacity-60"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#f7d8bf] text-ink/80">
          <Icon name={icon} size={20} strokeWidth={1.7} />
        </span>
        <span className="min-w-0 flex-1 truncate text-body">{label}</span>
        {badge ? <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-ember px-2 text-caption font-semibold text-snow">{badge}</span> : null}
        {value && <span className="text-callout text-ink-soft">{value}</span>}
        <Icon name="forward" size={18} strokeWidth={1.8} className="shrink-0 text-ink/45" />
      </motion.button>
    </li>
  )
}

function SettingsSheet({ open, onClose, room }: { open: boolean; onClose: () => void; room: Room }) {
  const updateRoom = useDemo((s) => s.updateRoom)
  const [name, setName] = useState(room.name)
  const [budget, setBudget] = useState(String(room.budget))
  const [date, setDate] = useState(room.date)
  const [chat, setChat] = useState(room.chatEnabled)
  return (
    <Sheet open={open} onClose={onClose} title="Настройки игры">
      <div className="space-y-4">
        <Field label="Название">
          <input className={inputLight} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Бюджет, ₽">
            <input className={inputLight} inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, '').slice(0, 6))} />
          </Field>
          <Field label="Дата обмена">
            <input type="date" className={inputLight} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Toggle checked={chat} onChange={setChat} label="Анонимный чат" />
        <SantomiButton
          fullWidth
          leadingIcon="check"
          onClick={() => {
            if (name.trim().length < 2 || Number(budget) < 100) return toast('Проверьте название и бюджет', 'error')
            updateRoom(room.id, { name: name.trim(), budget: Number(budget), date, chatEnabled: chat })
            toast('Настройки сохранены')
            onClose()
          }}
        >
          Сохранить
        </SantomiButton>
      </div>
    </Sheet>
  )
}
