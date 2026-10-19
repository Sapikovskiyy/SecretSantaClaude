/**
 * 02 · Home — design/references/04-home.jpeg (primary reference for the product language).
 * At 390 px: «Santomi» wordmark ≈34 px + outlined «+» (47 px); avatars + «N участников»;
 * tall emerald featured-game card (inset 16, radius 33, ≈413 px) with title ≈32 px, budget,
 * translucent arrow, centred 3D illustration and an overlapping cream status panel with a
 * black arrow; «Мои игры» ≈26 px + «Все»; compact cream game rows; bottom navigation.
 * All content is real store data; nothing is hard-coded.
 *
 * ASSET NOTE: the reference uses a snow-globe render; until it exists the gingerbread house
 * render (same art direction) is used.
 */
import { Link, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Avatar } from '@/components/ui/Kit'
import { Icon } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { CalendarMark } from '@/components/CalendarMark'
import { ME, useMyRooms } from '@/data/demoStore'
import { useRoomPeople } from '@/data/people'
import type { Room } from '@/domain/types'
import { daysUntil, formatRub, plural } from '@/lib/format'
import { IS_DEMO } from '@/lib/mode'
import { haptic } from '@/lib/telegram'
import { EASE, PRESS } from '@/motion/tokens'

/** Active games first, then by nearest exchange date (finished games last). */
const byDate = (a: Room, b: Room) => Number(a.stage === 'exchanged') - Number(b.stage === 'exchanged') || a.date.localeCompare(b.date)

/** Card surface per room theme — emerald is the reference default. */
const CARD_BG: Record<Room['theme'], string> = {
  pine: 'radial-gradient(120% 80% at 30% 0%, #0e8152 0%, #006b43 45%, #05502f 100%)',
  ember: 'radial-gradient(120% 80% at 30% 0%, #e2492c 0%, #b72d1a 50%, #7c1c10 100%)',
  cocoa: 'radial-gradient(120% 80% at 30% 0%, #5a4038 0%, #3a2b25 55%, #281d19 100%)',
}

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
        <p className="t-wordmark flex items-start gap-1.5 text-snow">
          Santomi
          {IS_DEMO && <span className="mt-0.5 text-caption font-medium tracking-normal text-taupe-soft">демо</span>}
        </p>
        <motion.div whileTap={PRESS}>
          <Link to="/rooms/new" aria-label="Создать игру" className="flex h-[47px] w-[47px] items-center justify-center rounded-full border-[1.5px] border-snow/70 text-snow">
            <Icon name="plus" size={24} strokeWidth={1.8} />
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
      {/* Participants of the featured game */}
      <div className="mt-[18px] flex items-center gap-3 px-6">
        <div className="flex items-center">
          {people.slice(0, 3).map((p, i) => (
            <span key={p.id} style={{ marginLeft: i ? -10 : 0 }} className="rounded-full ring-2 ring-cocoa">
              <Avatar person={p} size={34} />
            </span>
          ))}
          {people.length > 3 && (
            <span style={{ marginLeft: -10 }} className="flex h-[34px] min-w-[34px] items-center justify-center rounded-full bg-[#8a7a72] px-1 text-footnote font-semibold text-snow ring-2 ring-cocoa">
              +{people.length - 3}
            </span>
          )}
        </div>
        <span className="text-callout text-taupe-soft">
          {people.length} {plural(people.length, 'участник', 'участника', 'участников')}
        </span>
      </div>

      {/* Featured game card */}
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: EASE }}
        className="relative mx-4 mt-4 overflow-hidden rounded-[33px] pb-[10px]"
        style={{ background: CARD_BG[room.theme] }}
      >
        <Link to={`/rooms/${room.id}`} className="block px-[22px] pt-6" aria-label={`Открыть игру ${room.name}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="t-hero-card line-clamp-2 text-snow">{room.name}</h1>
              <p className="mt-2 text-button font-normal text-snow/85">Бюджет до {formatRub(room.budget)}</p>
            </div>
            <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-white/15 text-snow">
              <Icon name="forward" size={22} strokeWidth={2} />
            </span>
          </div>
          {/* Illustration area: soft ground + centred render */}
          <div className="relative mt-1 flex h-[min(233px,27.6dvh)] [@media(max-height:820px)]:h-[208px] items-end justify-center">
            <span aria-hidden className="absolute inset-x-[-10%] bottom-[-8%] h-[46%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,236,214,.55),rgba(255,236,214,0))]" />
            <Art name="snow-globe" size="min(232px, 26.5dvh)" eager noShadow />
          </div>
        </Link>

        {/* Overlapping cream status panel */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            haptic.press()
            navigate(st.action)
          }}
          className="relative mx-[10px] -mt-6 flex w-[calc(100%-20px)] items-center gap-4 rounded-[28px] bg-marzipan py-3 pl-5 pr-3 text-left text-ink"
        >
          <CalendarMark size={38} />
          <span className="min-w-0 flex-1 text-button font-normal leading-snug">{st.title}</span>
          <span className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-ink text-snow">
            <Icon name="arrowRight" size={22} strokeWidth={2} />
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
      style={{ background: CARD_BG.pine }}
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
        <Link to={`/rooms/${room.id}`} className="flex items-center gap-4 rounded-[28px] bg-marzipan py-3.5 pl-3.5 pr-4 text-ink">
          <span className="flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-[20px] bg-[#f6d3ba]">
            <Art name={stageArt(room)} size={54} noShadow />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-button font-semibold">{room.name}</span>
            <span className="block text-callout text-ink-soft">До {formatRub(room.budget)}</span>
            <span className="block text-secondary text-ink-soft">
              {people} {plural(people, 'участник', 'участника', 'участников')}
              {room.stage === 'exchanged' ? ', завершена' : ''}
            </span>
          </span>
          <Icon name="forward" size={22} className="shrink-0 text-ink" />
        </Link>
      </motion.div>
    </motion.li>
  )
}
