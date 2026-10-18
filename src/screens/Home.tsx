/**
 * 02 · Home — sheet 01/screen 02.
 * Logo + bell, greeting with avatar, emerald festive hero with Santa, three quick actions,
 * «Мои игры» list with live status. The hero switches to the reveal call-to-action
 * when a draw has happened and the envelope is still unopened.
 */
import { Link, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Avatar, DemoBadge, Sheet } from '@/components/ui/Kit'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { Logo } from '@/components/Logo'
import { RoomRow, SectionTitle } from '@/components/ds/blocks'
import { SantomiLinkButton } from '@/components/ds'
import { useDemo, useMyRooms, unreadCount } from '@/data/demoStore'
import { haptic } from '@/lib/telegram'
import { DUR, EASE, PRESS, cardIn, tween } from '@/motion/tokens'
import { useState } from 'react'

export function Home() {
  const navigate = useNavigate()
  const { me, chats } = useDemo()
  const rooms = useMyRooms()
  const [bell, setBell] = useState(false)
  const active = rooms.filter((r) => r.stage !== 'exchanged')
  const pendingReveal = rooms.find((r) => r.stage === 'drawn' && !r.revealSeen)
  const unreadRooms = rooms.filter((r) => unreadCount(chats, r.id, 'fromSanta') + unreadCount(chats, r.id, 'toRecipient') > 0)
  const firstName = me.name === 'Вы' ? null : me.name

  return (
    <Screen withDock>
      {/* Header */}
      <div className="flex items-center justify-between px-5">
        <Logo />
        <div className="flex items-center gap-2">
          <DemoBadge />
          <motion.button
            whileTap={PRESS}
            onClick={() => setBell(true)}
            aria-label={unreadRooms.length ? `Уведомления: ${unreadRooms.length}` : 'Уведомления'}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/10"
          >
            <Icon name="bell" size={20} />
            {unreadRooms.length > 0 && <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-ember ring-2 ring-cocoa" />}
          </motion.button>
        </div>
      </div>

      {/* Greeting */}
      <motion.div {...cardIn(0)} className="mt-5 flex items-center gap-3 px-5">
        <Link to="/profile" aria-label="Профиль">
          <Avatar person={me} size={52} />
        </Link>
        <div className="min-w-0">
          <p className="text-secondary text-snow/60">Привет{firstName ? ',' : '!'}</p>
          {firstName && <p className="truncate text-section">{firstName}!</p>}
          <p className="text-footnote text-snow/55">Готов к новогодним чудесам?</p>
        </div>
      </motion.div>

      {/* Hero */}
      <motion.button
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...tween(DUR.card), delay: 0.05 }}
        whileTap={PRESS}
        onClick={() => {
          haptic.press()
          navigate(pendingReveal ? `/rooms/${pendingReveal.id}/reveal` : '/rooms/new')
        }}
        className="relative mx-5 mt-5 flex min-h-[190px] overflow-hidden rounded-[28px] p-5 text-left"
        style={{
          background: pendingReveal
            ? 'radial-gradient(130% 120% at 15% 0%, #e2492c 0%, #a42813 55%, #5c150b 100%)'
            : 'radial-gradient(130% 120% at 15% 0%, #1f9a62 0%, #006b43 50%, #004a2e 100%)',
        }}
      >
        <span aria-hidden className="absolute -left-8 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex max-w-[58%] flex-col">
          {pendingReveal ? (
            <>
              <span className="text-footnote text-snow/75">{pendingReveal.name}</span>
              <span className="mt-1 text-section leading-tight">Жеребьёвка прошла!</span>
              <span className="mt-2 text-secondary text-snow/80">Откройте конверт и узнайте, кому дарите</span>
            </>
          ) : (
            <>
              <span className="text-section leading-tight">Новый год ближе, чем кажется</span>
              <span className="mt-2 text-secondary text-snow/80">Создай игру, пригласи друзей и дарите друг другу незабываемые подарки</span>
            </>
          )}
        </div>
        <div className="pointer-events-none absolute -bottom-3 -right-4">
          <Art name={pendingReveal ? 'envelope' : 'santa'} size={pendingReveal ? 150 : 172} eager />
        </div>
        <span className="absolute bottom-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-snow text-ink shadow-md">
          <Icon name="arrowRight" size={20} strokeWidth={2.2} />
        </span>
      </motion.button>

      {/* Quick actions */}
      <div className="mt-4 grid grid-cols-3 gap-3 px-5">
        <QuickAction to="/rooms/new" icon="plus" label="Создать игру" tone="ember" i={1} />
        <QuickAction to={active[0] ? `/rooms/${active[0].id}` : '/rooms/new'} icon="users" label="Мои игры" tone="pine" i={2} />
        <QuickAction to="/ai" icon="gift" label="Идеи подарков" tone="cream" i={3} />
      </div>

      {/* Games */}
      <section className="mt-7 px-5">
        <SectionTitle tone="dark" action={rooms.length > 3 ? { label: 'Все', to: '/profile' } : undefined}>
          Мои игры
        </SectionTitle>
        {rooms.length === 0 ? (
          <div className="mt-3 flex flex-col items-center rounded-[24px] bg-white/[0.05] px-6 py-8 text-center">
            <Art name="gift-star" size={110} />
            <p className="mt-3 text-card font-semibold">Пока нет игр</p>
            <p className="mt-1 max-w-[28ch] text-secondary text-snow/60">Создайте первую игру и пригласите друзей</p>
            <SantomiLinkButton to="/rooms/new" size="medium" leadingIcon="plus" className="mt-5">
              Создать игру
            </SantomiLinkButton>
          </div>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {rooms.slice(0, 4).map((r, i) => (
              <RoomRow key={r.id} room={r} index={i} />
            ))}
          </ul>
        )}
      </section>

      <Sheet open={bell} onClose={() => setBell(false)} title="Уведомления">
        {unreadRooms.length === 0 ? (
          <p className="pb-4 text-center text-callout text-ink-soft">Новых уведомлений нет</p>
        ) : (
          <div className="space-y-2">
            {unreadRooms.map((r) => (
              <Link
                key={r.id}
                to={`/rooms/${r.id}/chat/${unreadCount(chats, r.id, 'fromSanta') ? 'fromSanta' : 'toRecipient'}`}
                className="flex items-center gap-3 rounded-[18px] bg-snow p-3"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ember/12 text-ember">
                  <Icon name="chat" size={20} />
                </span>
                <span className="flex-1">
                  <span className="block text-body font-semibold">Новое анонимное сообщение</span>
                  <span className="block text-footnote text-ink-soft">{r.name}</span>
                </span>
                <Icon name="forward" size={16} className="text-ink/35" />
              </Link>
            ))}
          </div>
        )}
      </Sheet>
    </Screen>
  )
}

function QuickAction({ to, icon, label, tone, i }: { to: string; icon: IconName; label: string; tone: 'ember' | 'pine' | 'cream'; i: number }) {
  const t = {
    ember: 'bg-[linear-gradient(155deg,#ff6b4a,#e63b25_48%,#a71912)] text-snow',
    pine: 'bg-[linear-gradient(155deg,#35b77a,#08784c_48%,#06442f)] text-snow',
    cream: 'bg-[linear-gradient(155deg,#fff7ea,#ffe4ce_52%,#e9c9ae)] text-ink',
  }[tone]
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DUR.card, ease: EASE, delay: i * 0.045 }} whileTap={PRESS}>
      <Link to={to} className={`flex h-[104px] flex-col items-center justify-center gap-2 rounded-[24px] px-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.35)] ${t}`}>
        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${tone === 'cream' ? 'bg-ember/12 text-ember' : 'bg-white/20'}`}>
          <Icon name={icon} size={20} strokeWidth={2.2} />
        </span>
        <span className="text-footnote font-semibold leading-tight">{label}</span>
      </Link>
    </motion.div>
  )
}
