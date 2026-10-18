import { Link, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Avatar, DemoBadge } from '@/components/ui/Kit'
import { Icon } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { Logo } from '@/components/Logo'
import { RoomCard } from '@/components/RoomCard'
import { useDemo, useMyRooms, unreadCount } from '@/data/demoStore'
import { haptic } from '@/lib/telegram'
import { plural } from '@/lib/format'

export function Home() {
  const navigate = useNavigate()
  const { me, wishlist, chats } = useDemo()
  const rooms = useMyRooms()
  const pendingReveal = rooms.find((r) => r.stage === 'drawn' && !r.revealSeen)
  const unread = rooms.reduce((n, r) => n + unreadCount(chats, r.id, 'fromSanta') + unreadCount(chats, r.id, 'toRecipient'), 0)
  const chatRoom = rooms.find((r) => unreadCount(chats, r.id, 'fromSanta') > 0)

  return (
    <Screen withDock>
      <div className="flex items-center justify-between px-5">
        <Logo />
        <div className="flex items-center gap-2">
          <DemoBadge />
          <Link to="/profile" aria-label="Профиль">
            <Avatar person={me} size={40} />
          </Link>
        </div>
      </div>

      <h1 className="type-title mt-7 px-5">
        {me.name === 'Вы' ? 'Привет!' : `Привет, ${me.name}!`}
        <br />
        <span className="text-snow/55">Кому дарим в этом году?</span>
      </h1>

      {/* Signature moment surfaced first when it exists */}
      {pendingReveal && (
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            haptic.press()
            navigate(`/rooms/${pendingReveal.id}/reveal`)
          }}
          className="relative mx-5 mt-6 flex items-center gap-3 overflow-hidden rounded-[32px] bg-[radial-gradient(120%_120%_at_20%_0%,#e2492c,#a42813_55%,#5c150b)] p-5 text-left"
        >
          <div className="flex-1">
            <p className="text-footnote text-snow/75">{pendingReveal.name}</p>
            <p className="type-h3 mt-1 text-card">Жеребьёвка прошла. Узнайте, кому дарите</p>
            <span className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-snow px-4 text-secondary font-medium text-ink">
              Открыть конверт
              <Icon name="forward" size={16} />
            </span>
          </div>
          <motion.div animate={{ rotate: [-4, 4, -4] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
            <Art name="envelope" size={112} noShadow />
          </motion.div>
        </motion.button>
      )}

      <section className="mt-8">
        <div className="flex items-end justify-between px-5">
          <h2 className="type-h3">Мои игры</h2>
          <span className="text-secondary text-snow/50">
            {rooms.length} {plural(rooms.length, 'игра', 'игры', 'игр')}
          </span>
        </div>
        <div className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2" style={{ scrollPaddingLeft: 20 }}>
          <motion.div whileTap={{ scale: 0.97 }} className="shrink-0 snap-start">
            <Link
              to="/rooms/new"
              className="flex h-[260px] w-[150px] flex-col items-center justify-center gap-4 rounded-[32px] bg-snow text-center text-ink"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-ember text-snow shadow-[0_10px_24px_-8px_rgba(199,50,28,.8)]">
                <Icon name="plus" size={28} strokeWidth={2} />
              </span>
              <span className="text-button font-medium leading-tight">
                Создать
                <br />
                игру
              </span>
            </Link>
          </motion.div>
          {rooms.map((r) => (
            <RoomCard key={r.id} room={r} />
          ))}
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 px-5">
        <Link to="/wishlist" className="relative flex h-[168px] flex-col overflow-hidden rounded-[32px] bg-marzipan p-5 text-ink">
          <span className="type-h3">Вишлист</span>
          <span className="mt-1 text-footnote text-ink/60">
            {wishlist.length ? `${wishlist.length} ${plural(wishlist.length, 'желание', 'желания', 'желаний')}` : 'Пока пусто'}
          </span>
          <div className="pointer-events-none absolute -bottom-5 -right-4">
            <Art name="mitten" size={110} noShadow />
          </div>
        </Link>
        <Link to="/ai" className="relative flex h-[168px] flex-col overflow-hidden rounded-[32px] bg-pine p-5">
          <span className="type-h3">Идеи подарков</span>
          <span className="mt-1 text-footnote text-snow/70">Подберём за минуту</span>
          <div className="pointer-events-none absolute -bottom-5 -right-3">
            <Art name="gift" size={104} noShadow />
          </div>
        </Link>
      </section>

      {unread > 0 && chatRoom && (
        <Link
          to={`/rooms/${chatRoom.id}/chat/fromSanta`}
          className="mx-5 mt-3 flex items-center gap-3 rounded-[28px] bg-truffle p-4"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ember/20 text-ember-glow">
            <Icon name="chat" />
          </span>
          <span className="flex-1">
            <span className="block text-callout font-medium">Тайный Санта написал вам</span>
            <span className="block text-footnote text-snow/55">{chatRoom.name}</span>
          </span>
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-ember px-2 text-caption font-semibold">{unread}</span>
        </Link>
      )}
    </Screen>
  )
}
