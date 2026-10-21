/**
 * 02 · Home — design/references/04-home.jpeg (primary reference for the product language).
 * At 390 px: «Santomi» wordmark ≈34 px + outlined «+» (47 px); avatars + «N участников»;
 * tall emerald featured-game card (inset 16, radius 33, ≈413 px) with title ≈32 px, budget,
 * translucent arrow, centred 3D illustration and an overlapping cream status panel with a
 * black arrow; «Мои игры» ≈26 px + «Все»; compact cream game rows; bottom navigation.
 * All content is real store data; nothing is hard-coded.
 * Featured card bottom: hills + cream snow ground behind the snow-globe render (CEO asset).
 */
import { Link, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Avatar } from '@/components/ui/Kit'
import { Icon } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { CalendarMark } from '@/components/CalendarMark'
import { DEFAULT_COVER, themeLook } from '@/domain/look'
import { ME, useMyRooms } from '@/data/demoStore'
import { useRoomPeople } from '@/data/people'
import type { Room } from '@/domain/types'
import { daysUntil, formatRub, plural } from '@/lib/format'
import { IS_DEMO } from '@/lib/mode'
import { haptic } from '@/lib/telegram'
import { EASE, PRESS } from '@/motion/tokens'

/** Active games first, then by nearest exchange date (finished games last). */
const byDate = (a: Room, b: Room) => Number(a.stage === 'exchanged') - Number(b.stage === 'exchanged') || a.date.localeCompare(b.date)

/** Card surface per room theme (domain/look.ts) — emerald is the reference default. */
const CARD_BG = (theme: Room['theme']) => themeLook(theme).card

/** Illustration that reflects the game's stage (not a random decoration). */
export const stageArt = (r: Room) => (r.stage === 'exchanged' ? 'star' : r.stage === 'drawn' && r.revealSeen ? 'gift-star' : 'gift')

function status(room: Room, people: number): { title: string; action: string } {
  const limit = room.participantLimit ?? 30
  if (room.stage === 'gathering') {
    if (room.drawDate) {
      const d = daysUntil(room.drawDate)
      if (d > 0) return { title: `Жеребьёвка через ${d} ${plural(d, 'день', 'дня', 'дней')}`, action: room.organizerId === ME ? `/rooms/${room.id}/draw` : `/rooms/${room.id}` }
      if (d === 0) return { title: 'Жеребьёвка сегодня', action: room.organizerId === ME ? `/rooms/${room.id}/draw` : `/rooms/${room.id}` }
    }
    if (room.organizerId === ME && people < 3) return { title: `Пригласите ещё ${3 - people} ${plural(3 - people, 'человека', 'человек', 'человек')}`, action: `/rooms/${room.id}/invite` }
    return { title: room.organizerId === ME ? `Готово к жеребьёвке: ${people} из ${limit}` : 'Ждём жеребьёвку', action: room.organizerId === ME ? `/rooms/${room.id}/draw` : `/rooms/${room.id}` }
  }
  if (room.stage === 'drawn' && !room.revealSeen) return { title: 'Жеребьёвка прошла — откройте подарок', action: `/rooms/${room.id}/reveal` }
  if (room.stage === 'drawn') {
    const d = daysUntil(room.date)
    return { title: d > 0 ? `Обмен через ${d} ${plural(d, 'день', 'дня', 'дней')}` : d === 0 ? 'Обмен сегодня' : 'Обмен прошёл', action: `/rooms/${room.id}` }
  }
  return { title: 'Обмен завершён', action: `/rooms/${room.id}` }
}

export function Home() {
  const rooms = useMyRooms()
  const sorted = [...rooms].sort(byDate)
  const featured = sorted.find((r) => r.stage !== 'exchanged') ?? sorted[0]
  const others = sorted.filter((r) => r !== featured)

  return (
    <Screen withDock headless>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-[39px] [@media(max-height:820px)]:pt-6">
        <p className="t-wordmark flex items-start gap-1.5 font-medium text-snow">
          Santomi
          {IS_DEMO && <span className="mt-0.5 text-caption font-medium tracking-normal text-taupe-soft">демо</span>}
        </p>
        <motion.div whileTap={PRESS}>
          <Link to="/rooms/new" aria-label="Создать игру" className="flex h-[46px] w-[46px] translate-y-[3px] items-center justify-center rounded-full border-[1.25px] border-[#e2c7b4]/85 text-snow">
            <Icon name="plus" size={26} strokeWidth={1.5} />
          </Link>
        </motion.div>
      </div>

      {featured ? <Featured room={featured} /> : <EmptyFeatured />}

      {/* My games */}
      {others.length > 0 && (
        <section className="mt-[18px] px-4 [@media(max-height:820px)]:mt-3">
          <div className="flex items-end justify-between px-2">
            <h2 className="t-section text-snow">Мои игры</h2>
            {others.length > 0 && (
              <Link to="/profile" className="flex h-9 items-center gap-1 text-button text-snow/85">
                Все <Icon name="forward" size={18} />
              </Link>
            )}
          </div>
          <ul className="mt-3 space-y-2.5">
            {others.slice(0, 1).map((r, i) => (
              <GameRow key={r.id} room={r} index={i} />
            ))}
          </ul>
        </section>
      )}
    </Screen>
  )
}

function Featured({ room }: { room: Room }) {
  const navigate = useNavigate()
  const people = useRoomPeople(room)
  const st = status(room, people.length)
  return (
    <>
      {/* Participants of the featured game — 38 px avatars, overlap 9, count at +17 px */}
      <div className="mt-[13px] flex items-center gap-4 px-[25px]">
        <div className="flex items-center">
          {people.slice(0, 3).map((p, i) => (
            <span key={p.id} style={{ marginLeft: i ? -9 : 0 }} className="rounded-full ring-[1.5px] ring-[#efe3da]/80">
              <Avatar person={p} size={38} />
            </span>
          ))}
          {people.length > 3 && (
            <span
              style={{ marginLeft: -9 }}
              className="flex h-[38px] min-w-[38px] items-center justify-center rounded-full bg-[#6f6056] px-1 text-footnote text-snow ring-[1.5px] ring-[#efe3da]/80"
            >
              +{people.length - 3}
            </span>
          )}
        </div>
        <span className="text-body text-taupe-soft">
          {people.length} {plural(people.length, 'участник', 'участника', 'участников')}
        </span>
      </div>

      {/* Featured game card: emerald top, snowy ground with hills at the bottom (reference 04) */}
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: EASE }}
        className="relative mx-4 mt-[18px] overflow-hidden rounded-[33px] pb-[9px] shadow-[0_18px_40px_-18px_rgba(0,0,0,.6)]"
        style={{ background: CARD_BG(room.theme) }}
      >
        {/* Landscape: two soft hills + cream snow ground (static, behind the illustration) */}
        <span aria-hidden className="absolute left-[-9%] top-[252px] h-[130px] w-[44%] rounded-[50%] bg-[linear-gradient(180deg,#dcb987,#c6a473_60%)] [@media(max-height:820px)]:top-[228px]" />
        <span aria-hidden className="absolute right-[-12%] top-[236px] h-[150px] w-[48%] rounded-[50%] bg-[linear-gradient(180deg,#a7b187,#8a9872_60%)] [@media(max-height:820px)]:top-[212px]" />
        <span aria-hidden className="absolute inset-x-0 bottom-0 top-[70%] bg-[linear-gradient(180deg,#e7c597_0%,#f3cca5_22%,#f6d0aa_100%)]" />

        <Link to={`/rooms/${room.id}`} className="relative block pl-[32px] pr-[25px] pt-[29px]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 pt-[3px]">
              <h1 className="t-hero-card line-clamp-2 text-snow">{room.name}</h1>
              <p className="mt-[9px] text-body text-snow/90">Бюджет до {formatRub(room.budget)}</p>
            </div>
            <span className="flex h-[51px] w-[51px] shrink-0 items-center justify-center rounded-full bg-white/[0.13] text-snow ring-1 ring-white/[0.06]">
              <Icon name="forward" size={22} strokeWidth={1.8} />
            </span>
          </div>
          {/* Illustration stage: the globe sinks behind the status panel like in the reference */}
          <div style={{ clipPath: "inset(-200px 0 -80px 0)" }} className="relative -ml-[32px] -mr-[25px] h-[185px] [@media(max-height:820px)]:h-[160px]">
            <span className="absolute left-1/2 top-[-4px] -translate-x-1/2">
              <Art name={room.cover ?? DEFAULT_COVER} size="min(240px, 28.5dvh)" eager noShadow />
            </span>
          </div>
        </Link>

        {/* Cream status panel */}
        <motion.button
          whileTap={{ scale: 0.985 }}
          onClick={() => {
            haptic.press()
            navigate(st.action)
          }}
          className="relative mx-[11px] flex h-[88px] w-[calc(100%-22px)] items-center gap-[25px] rounded-[27px] bg-[linear-gradient(180deg,#fde3c6,#fbd8b5)] pl-[27px] pr-[11px] text-left text-ink shadow-[0_-6px_18px_-8px_rgba(80,40,10,.35),inset_0_1px_0_rgba(255,255,255,.55)]"
        >
          <CalendarMark size={31} variant="outline" />
          <span className="min-w-0 max-w-[160px] flex-1 text-button font-normal leading-[23px]">{st.title}</span>
          <span className="ml-auto flex h-[57px] w-[57px] shrink-0 items-center justify-center rounded-full bg-ink text-snow shadow-[0_6px_14px_-6px_rgba(0,0,0,.6)]">
            <Icon name="arrowRight" size={24} strokeWidth={1.8} />
          </span>
        </motion.button>
      </motion.article>
    </>
  )
}

function EmptyFeatured() {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE }}
      className="relative mx-4 mt-6 overflow-hidden rounded-[33px] px-[22px] pb-4 pt-6"
      style={{ background: CARD_BG('pine') }}
    >
      <h1 className="t-hero-card text-snow">Первая игра</h1>
      <p className="mt-2 text-button font-normal text-snow/85">Создайте игру и позовите друзей</p>
      <div className="flex h-[180px] items-center justify-center">
        <Art name="gift-star" size={170} eager />
      </div>
      <Link to="/rooms/new" className="flex items-center gap-4 rounded-[28px] bg-marzipan py-3 pl-5 pr-3 text-ink">
        <CalendarMark size={38} />
        <span className="flex-1 text-button">Создать игру</span>
        <span className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-ink text-snow">
          <Icon name="arrowRight" size={22} strokeWidth={2} />
        </span>
      </Link>
    </motion.article>
  )
}

function GameRow({ room, index }: { room: Room; index: number }) {
  const people = room.members.length
  return (
    <motion.li initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: EASE, delay: 0.08 + index * 0.05 }}>
      <motion.div whileTap={PRESS}>
        <Link to={`/rooms/${room.id}`} className="flex h-[100px] items-center gap-5 rounded-[28px] bg-[linear-gradient(180deg,#ffe8d2,#fde2c8)] pl-[21px] pr-[26px] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,.5)]">
          <span className="flex h-[59px] w-[59px] shrink-0 items-center justify-center rounded-[18px] bg-[#f9d9bf] shadow-[inset_0_1px_2px_rgba(120,60,20,.08)]">
            <Art name={stageArt(room)} size={44} noShadow />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-button font-medium">{room.name}</span>
            <span className="block text-callout text-ink-soft">До {formatRub(room.budget)}</span>
            <span className="block text-secondary text-ink-soft">
              {people} {plural(people, 'участник', 'участника', 'участников')}
              {room.stage === 'exchanged' ? ', завершена' : ''}
            </span>
          </span>
          <Icon name="forward" size={22} strokeWidth={1.8} className="shrink-0 text-ink" />
        </Link>
      </motion.div>
    </motion.li>
  )
}
