import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Button, IconButton, SwipeConfirm } from '@/components/ui/Buttons'
import { Avatar, Chip, DemoBadge, Field, Progress, Sheet, Toggle, inputLight } from '@/components/ui/Kit'
import { Icon } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { themeFace, stageLabel } from '@/components/RoomCard'
import { ME, isMember, unreadCount, useDemo } from '@/data/demoStore'
import { personName, usePerson, useRoomPeople } from '@/data/people'
import type { GiftStatus, Room } from '@/domain/types'
import { countdownLabel, formatDate, formatRub, plural } from '@/lib/format'
import { haptic } from '@/lib/telegram'
import { toast } from '@/data/uiStore'
import { NotFound } from './NotFound'

const GIFT_STEPS: { id: GiftStatus; label: string }[] = [
  { id: 'choosing', label: 'Выбираю' },
  { id: 'bought', label: 'Купил' },
  { id: 'ready', label: 'Упаковал' },
]

export function RoomDashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const room = useDemo((s) => s.rooms.find((r) => r.id === id))
  const { runDraw, setGiftStatus, removeMember, chats, me } = useDemo()
  const people = useRoomPeople(room)
  const recipient = usePerson(room?.myRecipientId)
  const [sheet, setSheet] = useState<null | 'members' | 'exclusions' | 'settings'>(null)

  if (!room) return <NotFound />
  if (!isMember(room)) return <Navigate to={`/join/${room.inviteCode}`} replace />
  const isOrganizer = room.organizerId === ME
  const face = themeFace[room.theme]
  const ready = room.members.filter((m) => m.wishlistReady).length
  const myMember = room.members.find((m) => m.personId === ME)
  const giftCounts = {
    ready: room.members.filter((m) => m.giftStatus === 'ready').length,
    bought: room.members.filter((m) => m.giftStatus === 'bought').length,
  }

  const draw = () => {
    const res = runDraw(room.id)
    if (res.ok) {
      haptic.success()
      navigate(`/rooms/${room.id}/reveal`)
    } else {
      haptic.error()
      toast(
        res.reason === 'too_few'
          ? 'Нужно минимум 3 участника'
          : res.reason === 'impossible'
            ? 'С такими исключениями пары не складываются'
            : 'Жеребьёвка уже прошла',
        'error',
      )
    }
  }

  return (
    <Screen back="/home" right={isOrganizer ? <IconButton icon="edit" label="Настройки игры" onClick={() => setSheet('settings')} /> : undefined}>
      {/* Hero card */}
      <div className={`relative mx-5 overflow-hidden rounded-[36px] p-6 ${face.bg}`}>
        <div className="pointer-events-none absolute -bottom-8 -right-6">
          <Art name={face.art} size={180} noShadow />
        </div>
        <span className="relative inline-flex rounded-full bg-black/20 px-3 py-1 text-caption backdrop-blur">{stageLabel(room)}</span>
        <h1 className="type-title relative mt-4 max-w-[10ch]">{room.name}</h1>
        {room.description && <p className="relative mt-2 max-w-[24ch] text-secondary text-snow/75">{room.description}</p>}
        <dl className="relative mt-6 flex gap-6 text-secondary">
          <div>
            <dt className="text-snow/60">Обмен</dt>
            <dd className="mt-0.5 font-medium">{formatDate(room.date)}</dd>
          </div>
          <div>
            <dt className="text-snow/60">Бюджет</dt>
            <dd className="mt-0.5 font-medium">до {formatRub(room.budget)}</dd>
          </div>
        </dl>
      </div>
      <p className="mt-3 px-6 text-footnote text-snow/50">{countdownLabel(room.date)}</p>

      {/* Participants */}
      <button onClick={() => setSheet('members')} className="mx-5 mt-4 flex items-center gap-3 rounded-[28px] bg-truffle p-4 text-left">
        <div className="flex -space-x-2">
          {people.slice(0, 4).map((p) => (
            <Avatar key={p.id} person={p} size={36} ring />
          ))}
        </div>
        <div className="flex-1">
          <p className="text-callout font-medium">
            {people.length} {plural(people.length, 'участник', 'участника', 'участников')}
          </p>
          <p className="text-footnote text-snow/55">
            Вишлисты готовы у {ready} из {room.members.length}
          </p>
        </div>
        <Icon name="forward" size={18} className="text-snow/40" />
      </button>
      <div className="mx-5 mt-2 px-1">
        <Progress value={ready / Math.max(1, room.members.length)} tone="marzipan" />
      </div>

      {/* Stage-specific block */}
      <div className="mt-6 flex-1 px-5">
        {room.stage === 'gathering' && isOrganizer && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Link to={`/rooms/${room.id}/invite`} className="flex h-[92px] flex-col justify-between rounded-[26px] bg-pine p-4">
                <Icon name="share" />
                <span className="text-callout font-medium">Пригласить</span>
              </Link>
              <button onClick={() => setSheet('exclusions')} className="flex h-[92px] flex-col justify-between rounded-[26px] bg-truffle p-4 text-left">
                <Icon name="shuffle" />
                <span className="text-callout font-medium">
                  Исключения{room.exclusions.length ? ` (${room.exclusions.length})` : ''}
                </span>
              </button>
            </div>
            {!myMember?.wishlistReady && <WishlistNudge />}
            <p className="pt-2 text-center text-footnote text-snow/50">
              {room.members.length < 3 ? 'Для жеребьёвки нужно минимум 3 участника' : 'Когда все соберутся — запускайте'}
            </p>
            <SwipeConfirm label="Провести жеребьёвку" knobIcon="shuffle" tone="ember" onConfirm={draw} disabled={room.members.length < 3} />
          </div>
        )}

        {room.stage === 'gathering' && !isOrganizer && (
          <div className="space-y-3">
            <div className="rounded-[28px] bg-truffle p-5">
              <p className="type-h3">Ждём жеребьёвку</p>
              <p className="mt-1 text-secondary text-snow/60">
                Организатор {personName(room.organizerId, me)} запустит её, когда все соберутся. Пока заполните вишлист.
              </p>
            </div>
            <WishlistNudge />
          </div>
        )}

        {room.stage === 'drawn' && !room.revealSeen && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/rooms/${room.id}/reveal`)}
            className="flex w-full items-center gap-4 rounded-[32px] bg-marzipan p-5 text-left text-ink"
          >
            <Art name="envelope" size={96} noShadow />
            <span className="flex-1">
              <span className="type-h3 block">Ваш конверт ждёт</span>
              <span className="mt-1 block text-secondary text-ink/60">Откройте, чтобы узнать, кому дарите</span>
            </span>
          </motion.button>
        )}

        {room.stage === 'drawn' && room.revealSeen && recipient && (
          <div className="space-y-3">
            <div className="rounded-[32px] bg-marzipan p-5 text-ink">
              <p className="text-secondary text-ink/60">Вы дарите подарок</p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar person={recipient} size={56} />
                <p className="type-title">{recipient.name}</p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Link to={`/rooms/${room.id}/recipient`} className="flex h-14 items-center justify-center gap-2 rounded-full bg-ink text-callout font-medium text-snow">
                  <Icon name="gift" size={18} /> Вишлист
                </Link>
                {room.chatEnabled && (
                  <Link to={`/rooms/${room.id}/chat/toRecipient`} className="relative flex h-14 items-center justify-center gap-2 rounded-full bg-ember text-callout font-medium text-snow">
                    <Icon name="chat" size={18} /> Написать
                    {unreadCount(chats, room.id, 'toRecipient') > 0 && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-marzipan" />}
                  </Link>
                )}
              </div>
            </div>

            <div className="rounded-[28px] bg-truffle p-5">
              <p className="text-secondary text-snow/60">Как дела с подарком?</p>
              <div className="mt-3 flex gap-2">
                {GIFT_STEPS.map((g) => (
                  <Chip
                    key={g.id}
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
              <Link to={`/rooms/${room.id}/chat/fromSanta`} className="flex items-center gap-3 rounded-[28px] bg-truffle p-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ember/20 text-ember-glow">
                  <Icon name="lock" size={20} />
                </span>
                <span className="flex-1">
                  <span className="block text-callout font-medium">Ваш Тайный Санта</span>
                  <span className="block text-footnote text-snow/55">Анонимный чат — Санта знает вас, вы его нет</span>
                </span>
                {unreadCount(chats, room.id, 'fromSanta') > 0 && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-ember px-2 text-caption font-semibold">
                    {unreadCount(chats, room.id, 'fromSanta')}
                  </span>
                )}
              </Link>
            )}

            {isOrganizer && (
              <div className="rounded-[28px] bg-truffle p-5">
                <p className="text-secondary text-snow/60">Подготовка подарков в группе</p>
                <p className="mt-1 text-callout">
                  Готово {giftCounts.ready}, куплено {giftCounts.bought} из {room.members.length}
                </p>
                <p className="mt-2 text-caption text-snow/45">Кто кому дарит, не видит даже организатор</p>
              </div>
            )}
          </div>
        )}
      </div>

      <MembersSheet open={sheet === 'members'} onClose={() => setSheet(null)} room={room} canEdit={isOrganizer && room.stage === 'gathering'} onRemove={(pid) => removeMember(room.id, pid)} />
      <ExclusionsSheet open={sheet === 'exclusions'} onClose={() => setSheet(null)} room={room} />
      <SettingsSheet open={sheet === 'settings'} onClose={() => setSheet(null)} room={room} />
    </Screen>
  )
}

function WishlistNudge() {
  return (
    <Link to="/wishlist" className="flex items-center gap-3 rounded-[28px] bg-marzipan p-4 text-ink">
      <Art name="mitten" size={64} noShadow />
      <span className="flex-1">
        <span className="block text-callout font-medium">Заполните вишлист</span>
        <span className="block text-footnote text-ink/60">Так Санте будет проще выбрать подарок</span>
      </span>
      <Icon name="forward" size={18} />
    </Link>
  )
}

function MembersSheet({ open, onClose, room, canEdit, onRemove }: { open: boolean; onClose: () => void; room: Room; canEdit: boolean; onRemove: (id: string) => void }) {
  const people = useRoomPeople(room)
  return (
    <Sheet open={open} onClose={onClose} title="Участники">
      <ul className="divide-y divide-ink/8">
        {people.map((p) => {
          const m = room.members.find((x) => x.personId === p.id)!
          return (
            <li key={p.id} className="flex items-center gap-3 py-3">
              <Avatar person={p} size={44} />
              <div className="flex-1">
                <p className="text-body font-medium">
                  {p.name}
                  {p.id === room.organizerId && <span className="ml-2 text-caption font-normal text-ink/50">организатор</span>}
                </p>
                <p className="text-footnote text-ink/55">{m.wishlistReady ? 'Вишлист готов' : 'Вишлист не заполнен'}</p>
              </div>
              {canEdit && p.id !== room.organizerId && (
                <button aria-label={`Удалить ${p.name}`} onClick={() => onRemove(p.id)} className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/6">
                  <Icon name="trash" size={18} />
                </button>
              )}
            </li>
          )
        })}
      </ul>
      {people.some((p) => p.isDemo) && <DemoBadge className="mt-3 !bg-ink/8 !text-ink/70" />}
    </Sheet>
  )
}

function ExclusionsSheet({ open, onClose, room }: { open: boolean; onClose: () => void; room: Room }) {
  const people = useRoomPeople(room)
  const { addExclusion, removeExclusion, me } = useDemo()
  const [a, setA] = useState<string>('')
  const [b, setB] = useState<string>('')
  const [mutual, setMutual] = useState(true)
  return (
    <Sheet open={open} onClose={onClose} title="Исключения">
      <p className="mb-4 text-center text-secondary text-ink/60">Например, пары или коллеги, которые и так дарят друг другу подарки</p>
      {room.exclusions.length > 0 && (
        <ul className="mb-4 space-y-2">
          {room.exclusions.map((e, i) => (
            <li key={i} className="flex items-center gap-2 rounded-[18px] bg-snow px-4 py-3 text-callout">
              <span className="flex-1">
                {personName(e.a, me)} {e.mutual ? '⇄' : '→'} {personName(e.b, me)}
              </span>
              <button aria-label="Убрать исключение" onClick={() => removeExclusion(room.id, i)}>
                <Icon name="close" size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-2 gap-2">
        <select className={inputLight} value={a} onChange={(e) => setA(e.target.value)} aria-label="Первый участник">
          <option value="">Кто</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select className={inputLight} value={b} onChange={(e) => setB(e.target.value)} aria-label="Второй участник">
          <option value="">Кому нельзя</option>
          {people
            .filter((p) => p.id !== a)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
      </div>
      <Toggle checked={mutual} onChange={setMutual} label="В обе стороны" />
      <Button
        className="mt-2 w-full"
        disabled={!a || !b || a === b}
        onClick={() => {
          addExclusion(room.id, { a, b, mutual })
          setA('')
          setB('')
        }}
      >
        Добавить исключение
      </Button>
    </Sheet>
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
        <Button
          className="w-full"
          onClick={() => {
            if (name.trim().length < 2 || Number(budget) < 100) return toast('Проверьте название и бюджет', 'error')
            updateRoom(room.id, { name: name.trim(), budget: Number(budget), date, chatEnabled: chat })
            toast('Настройки сохранены')
            onClose()
          }}
        >
          Сохранить
        </Button>
      </div>
    </Sheet>
  )
}
