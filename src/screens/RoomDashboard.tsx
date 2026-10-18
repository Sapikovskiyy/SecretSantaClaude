/**
 * 05 · Room dashboard — sheet 02/screen 05.
 * Snowy house scene, cream panel: name + description, three stat tiles, participant and
 * wishlist progress (animated ~400 ms), actions. Stage-aware: gathering → invite / remind /
 * draw (organizer only, when allowed); drawn → recipient card, chat, gift status.
 * The organizer only ever sees aggregate readiness, never pairs.
 */
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Avatar, Chip, Field, Sheet, Toggle, inputLight } from '@/components/ui/Kit'
import { Icon } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { PageHeader, SantomiButton, StatusPill } from '@/components/ds'
import { HeroScene, NavRow, ProgressRow, StatTile, roomStatus, useRoomStats } from '@/components/ds/blocks'
import { ME, isMember, unreadCount, useDemo } from '@/data/demoStore'
import { personName, usePerson } from '@/data/people'
import type { GiftStatus, Room } from '@/domain/types'
import { countdownLabel, formatRub } from '@/lib/format'
import { toast } from '@/data/uiStore'
import { PRESS, cardIn } from '@/motion/tokens'
import { NotFound } from './NotFound'

const GIFT_STEPS: { id: GiftStatus; label: string }[] = [
  { id: 'choosing', label: 'Выбираю' },
  { id: 'bought', label: 'Купил' },
  { id: 'ready', label: 'Упаковал' },
]

const shortDate = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

export function RoomDashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const room = useDemo((s) => s.rooms.find((r) => r.id === id))
  const { setGiftStatus, chats, me } = useDemo()
  const { people, ready, limit } = useRoomStats(room)
  const recipient = usePerson(room?.myRecipientId)
  const [settings, setSettings] = useState(false)

  if (!room) return <NotFound />
  if (!isMember(room)) return <Navigate to={`/join/${room.inviteCode}`} replace />
  const isOrganizer = room.organizerId === ME
  const myMember = room.members.find((m) => m.personId === ME)
  const status = roomStatus(room)
  const sceneArt = { ember: 'house', pine: 'house', cocoa: 'gift-star' }[room.theme]

  return (
    <Screen back="/home" headless className="!pb-0">
      <PageHeader
        back="/home"
        title={room.name}
        right={
          isOrganizer && room.stage === 'gathering' ? (
            <motion.button whileTap={PRESS} aria-label="Настройки игры" onClick={() => setSettings(true)} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <Icon name="edit" size={20} />
            </motion.button>
          ) : undefined
        }
      />

      <HeroScene art={sceneArt} size={210} height={210} glow={room.theme === 'pine' ? 'pine' : 'ember'} />

      <section className="relative z-10 -mt-3 flex-1 rounded-t-[32px] bg-marzipan px-5 pb-8 pt-6 text-ink">
        <motion.div {...cardIn(0)}>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-section">{room.name}</h1>
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
          </div>
          {room.description && <p className="mt-1.5 text-callout text-ink/70">{room.description}</p>}
          <p className="mt-1 text-footnote text-ink-soft">{countdownLabel(room.date)}</p>
        </motion.div>

        <motion.div {...cardIn(1)} className="mt-4 flex gap-2">
          <StatTile icon="calendar" value={shortDate(room.date)} label="Обмен" />
          <StatTile icon="gift" value={`до ${formatRub(room.budget)}`} label="Бюджет" />
          <StatTile icon="users" value={people.length} label="Участники" />
        </motion.div>

        <motion.div {...cardIn(2)} className="mt-3 space-y-2">
          <ProgressRow label="Участники" done={people.length} total={limit} tone="pine" people={people} onClick={() => navigate(`/rooms/${room.id}/participants`)} />
          <ProgressRow label="Вишлисты" done={ready.length} total={people.length} tone="ember" people={ready} onClick={() => navigate(`/rooms/${room.id}/participants`)} />
        </motion.div>

        {/* Gathering */}
        {room.stage === 'gathering' && (
          <div className="mt-5 space-y-3">
            {!myMember?.wishlistReady && (
              <NavRow icon={<Art name="stocking" size={34} noShadow />} title="Заполните свой вишлист" subtitle="Так Санте будет проще выбрать подарок" to="/wishlist" />
            )}
            <div className="grid grid-cols-2 gap-2">
              <SantomiButton variant="secondary" size="medium" leadingIcon="users" onClick={() => navigate(`/rooms/${room.id}/invite`)}>
                Пригласить
              </SantomiButton>
              <SantomiButton
                variant={isOrganizer ? 'secondary' : 'primary'}
                size="medium"
                leadingIcon="bell"
                onClick={() => toast(isOrganizer ? 'Напоминание отправлено (демо)' : 'Организатору отправлено напоминание (демо)')}
              >
                Напомнить
              </SantomiButton>
            </div>
            {isOrganizer ? (
              <SantomiButton fullWidth leadingIcon="shuffle" onClick={() => navigate(`/rooms/${room.id}/draw`)}>
                Перейти к жеребьёвке
              </SantomiButton>
            ) : (
              <p className="rounded-[18px] bg-snow/70 p-4 text-secondary text-ink/75">
                Жеребьёвку проведёт организатор — {personName(room.organizerId, me)}. Мы сообщим, когда она пройдёт.
              </p>
            )}
          </div>
        )}

        {/* Drawn, envelope not opened */}
        {room.stage === 'drawn' && !room.revealSeen && (
          <motion.button
            whileTap={PRESS}
            onClick={() => navigate(`/rooms/${room.id}/reveal`)}
            className="mt-5 flex w-full items-center gap-4 rounded-[22px] bg-snow p-4 text-left"
          >
            <Art name="gift-star" size={80} noShadow />
            <span className="flex-1">
              <span className="block text-card font-semibold">Ваш подарок ждёт</span>
              <span className="mt-0.5 block text-secondary text-ink-soft">Откройте, чтобы узнать, кому дарите</span>
            </span>
            <Icon name="forward" size={18} className="text-ink/40" />
          </motion.button>
        )}

        {/* Drawn & revealed (or finished) */}
        {room.stage !== 'gathering' && room.revealSeen && recipient && (
          <div className="mt-5 space-y-3">
            <div className="rounded-[22px] bg-snow p-4">
              <p className="text-secondary text-ink-soft">{room.stage === 'exchanged' ? 'Вы дарили подарок' : 'Вы дарите подарок'}</p>
              <div className="mt-2 flex items-center gap-3">
                <Avatar person={recipient} size={52} />
                <p className="text-section">{recipient.name}</p>
              </div>
              {room.stage === 'drawn' && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <SantomiButton variant="secondary" size="medium" leadingIcon="gift" onClick={() => navigate(`/rooms/${room.id}/recipient`)}>
                    Вишлист
                  </SantomiButton>
                  {room.chatEnabled && (
                    <SantomiButton size="medium" leadingIcon="chat" onClick={() => navigate(`/rooms/${room.id}/chat/toRecipient`)}>
                      Написать
                    </SantomiButton>
                  )}
                </div>
              )}
            </div>

            {room.stage === 'drawn' && (
              <>
                <div className="rounded-[22px] bg-snow p-4">
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
                </div>
                {room.chatEnabled && (
                  <NavRow
                    icon="lock"
                    title="Ваш Тайный Санта"
                    subtitle="Анонимный чат — Санта знает вас, вы его нет"
                    to={`/rooms/${room.id}/chat/fromSanta`}
                    trailing={
                      unreadCount(chats, room.id, 'fromSanta') > 0 ? (
                        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-ember px-2 text-caption font-semibold text-snow">{unreadCount(chats, room.id, 'fromSanta')}</span>
                      ) : undefined
                    }
                  />
                )}
                {isOrganizer && (
                  <div className="rounded-[22px] bg-snow/70 p-4">
                    <p className="text-secondary text-ink-soft">Подготовка подарков в группе</p>
                    <p className="mt-1 text-callout">
                      Готово {room.members.filter((m) => m.giftStatus === 'ready').length}, куплено {room.members.filter((m) => m.giftStatus === 'bought').length} из{' '}
                      {room.members.length}
                    </p>
                    <p className="mt-1 text-caption text-ink-soft">Кто кому дарит, не видит даже организатор</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <Link to={`/rooms/${room.id}/participants`} className="mt-4 flex h-11 items-center justify-center gap-1 text-secondary font-medium text-ink-soft">
          Участники и исключения <Icon name="forward" size={16} />
        </Link>
      </section>

      <SettingsSheet open={settings} onClose={() => setSettings(false)} room={room} />
    </Screen>
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
