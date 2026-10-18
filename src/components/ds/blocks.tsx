/**
 * Composite blocks shared by the 14 handoff screens:
 * HeroScene (dark 3D stage above a cream sheet), RoomRow, StatTile, ProgressRow,
 * NavRow, SectionTitle. Built on DS v2 tokens; no screen-specific logic.
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import type { Person, Room } from '@/domain/types'
import { Art } from '@/components/art/Art'
import { Icon, type IconName } from '@/components/ui/Icon'
import { AvatarStack } from '@/components/ui/Kit'
import { useRoomPeople } from '@/data/people'
import { ME } from '@/data/demoStore'
import { formatDate, plural } from '@/lib/format'
import { DUR, EASE, PRESS, tween } from '@/motion/tokens'
import { StatusPill } from './index'

/* ───────────────────────── HeroScene ───────────────────────── */

type Glow = 'ember' | 'pine' | 'gold'
const GLOWS: Record<Glow, string> = {
  ember: 'radial-gradient(closest-side, rgba(213,54,28,.85), rgba(142,31,14,.45) 50%, rgba(40,29,25,0) 100%)',
  pine: 'radial-gradient(closest-side, rgba(31,154,98,.75), rgba(0,74,46,.45) 50%, rgba(40,29,25,0) 100%)',
  gold: 'radial-gradient(closest-side, rgba(230,185,108,.6), rgba(142,31,14,.35) 55%, rgba(40,29,25,0) 100%)',
}

/** Dark stage with one dominant 3D object, restrained decor and a light glow. */
export function HeroScene({
  art,
  size = 200,
  glow = 'ember',
  decor = true,
  height = 230,
  children,
}: {
  art: string
  size?: number | string
  glow?: Glow
  decor?: boolean
  height?: number
  children?: ReactNode
}) {
  return (
    <div className="relative flex items-center justify-center overflow-hidden" style={{ height }}>
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[130%] w-[120%] -translate-x-1/2 -translate-y-1/2" style={{ background: GLOWS[glow] }} />
      {decor && (
        <>
          <div className="float-a absolute left-[7%] top-[14%]">
            <Art name="star" size={34} noShadow />
          </div>
          <div className="float-b absolute right-[9%] top-[8%]">
            <Art name="star" size={26} noShadow />
          </div>
          <div className="float-b absolute bottom-[14%] right-[6%]">
            <Art name="bauble" size={30} noShadow />
          </div>
        </>
      )}
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="relative">
        <Art name={art} size={size} eager />
      </motion.div>
      {children}
    </div>
  )
}

/* ───────────────────────── Section title ───────────────────────── */

export function SectionTitle({ children, action, tone = 'light' }: { children: ReactNode; action?: { label: string; to: string }; tone?: 'light' | 'dark' }) {
  return (
    <div className="flex items-end justify-between">
      <h2 className={`text-card font-semibold ${tone === 'dark' ? 'text-snow' : 'text-ink'}`}>{children}</h2>
      {action && (
        <Link to={action.to} className={`flex h-9 items-center gap-0.5 text-secondary font-medium ${tone === 'dark' ? 'text-snow/60' : 'text-ink-soft'}`}>
          {action.label}
          <Icon name="forward" size={16} />
        </Link>
      )}
    </div>
  )
}

/* ───────────────────────── Room row ───────────────────────── */

export const roomArt = (room: Pick<Room, 'theme'>) => ({ ember: 'bauble', pine: 'house', cocoa: 'gift-star' })[room.theme]

export function roomStatus(room: Room): { label: string; tone: 'green' | 'gold' | 'red' | 'muted' } {
  if (room.stage === 'gathering') return room.organizerId === ME ? { label: 'Сбор', tone: 'gold' } : { label: 'Ожидание', tone: 'gold' }
  if (room.stage === 'drawn') return room.revealSeen ? { label: 'Идёт', tone: 'green' } : { label: 'Новое', tone: 'red' }
  return { label: 'Завершена', tone: 'muted' }
}

/** Cream list row for a game (handoff 02 «Мои игры», 14 «Активные игры»). */
export function RoomRow({ room, index = 0 }: { room: Room; index?: number }) {
  const status = roomStatus(room)
  return (
    <motion.li initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...tween(DUR.card), delay: Math.min(index, 4) * 0.045 }}>
      <motion.div whileTap={PRESS}>
        <Link to={`/rooms/${room.id}`} className="flex items-center gap-3 rounded-[22px] bg-snow p-3 text-ink shadow-[0_1px_0_rgba(40,29,25,.04)]">
          <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[16px] bg-marzipan">
            <Art name={roomArt(room)} size={52} noShadow />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-body font-semibold">{room.name}</p>
            </div>
            <p className="text-footnote text-ink-soft">
              {room.members.length} {plural(room.members.length, 'участник', 'участника', 'участников')}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-footnote text-ink/70">
              <Icon name="calendar" size={14} /> {formatDate(room.date)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
            <Icon name="forward" size={16} className="text-ink/35" />
          </div>
        </Link>
      </motion.div>
    </motion.li>
  )
}

/* ───────────────────────── Stats & progress ───────────────────────── */

export function StatTile({ icon, value, label }: { icon: IconName; value: ReactNode; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-[18px] bg-snow px-3 py-3">
      <Icon name={icon} size={20} className="text-ember" />
      <p className="truncate text-secondary font-semibold leading-tight">{value}</p>
      <p className="truncate text-caption text-ink-soft">{label}</p>
    </div>
  )
}

export function ProgressRow({
  label,
  done,
  total,
  tone,
  people,
  onClick,
}: {
  label: string
  done: number
  total: number
  tone: 'pine' | 'ember'
  people: Person[]
  onClick?: () => void
}) {
  const ratio = total ? done / total : 0
  return (
    <button onClick={onClick} className="block w-full rounded-[18px] bg-snow p-3.5 text-left">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-secondary text-ink-soft">{label}</p>
          <p className={`text-body font-semibold ${tone === 'pine' ? 'text-pine' : 'text-ember'}`}>
            {done} из {total}
          </p>
        </div>
        <AvatarStack people={people} max={4} size={30} />
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-ink/8">
        <motion.div
          className={`h-full rounded-full ${tone === 'pine' ? 'bg-pine-glow' : 'bg-ember'}`}
          initial={false}
          animate={{ width: `${Math.round(ratio * 100)}%` }}
          transition={{ duration: 0.4, ease: EASE }}
        />
      </div>
    </button>
  )
}

/* ───────────────────────── Nav row ───────────────────────── */

export function NavRow({ icon, title, subtitle, to, onClick, trailing }: { icon: IconName | ReactNode; title: string; subtitle?: string; to?: string; onClick?: () => void; trailing?: ReactNode }) {
  const body = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-ember/10 text-ember">
        {typeof icon === 'string' ? <Icon name={icon as IconName} size={20} /> : icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body font-semibold">{title}</span>
        {subtitle && <span className="block truncate text-footnote text-ink-soft">{subtitle}</span>}
      </span>
      {trailing ?? <Icon name="forward" size={16} className="shrink-0 text-ink/35" />}
    </>
  )
  const cls = 'flex w-full items-center gap-3 rounded-[20px] bg-snow p-3 text-left text-ink'
  return to ? (
    <Link to={to} className={cls}>
      {body}
    </Link>
  ) : (
    <button onClick={onClick} className={cls}>
      {body}
    </button>
  )
}

export function useRoomStats(room?: Room) {
  const people = useRoomPeople(room)
  if (!room) return { people, ready: [] as Person[], limit: 0 }
  const readyIds = new Set(room.members.filter((m) => m.wishlistReady).map((m) => m.personId))
  return { people, ready: people.filter((p) => readyIds.has(p.id)), limit: room.participantLimit ?? 30 }
}
