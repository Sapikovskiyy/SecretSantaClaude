import { Link } from 'react-router'
import { motion } from 'motion/react'
import type { Room } from '@/domain/types'
import { useRoomPeople } from '@/data/people'
import { ME } from '@/data/demoStore'
import { countdownLabel, formatRub } from '@/lib/format'
import { AvatarStack } from './ui/Kit'
import { Art, type ArtName } from './art/Art'

export const themeFace: Record<Room['theme'], { bg: string; art: ArtName; text: string }> = {
  ember: { bg: 'bg-[radial-gradient(120%_90%_at_30%_10%,#e2492c,#a42813_55%,#5c150b)]', art: 'bauble', text: 'text-snow' },
  pine: { bg: 'bg-[radial-gradient(120%_90%_at_30%_10%,#1c9a60,#0b6b42_55%,#053a22)]', art: 'teahouse', text: 'text-snow' },
  cocoa: { bg: 'bg-[radial-gradient(120%_90%_at_30%_10%,#5a4038,#3a2d28_55%,#231915)]', art: 'gift', text: 'text-snow' },
}

export function stageLabel(room: Room) {
  if (room.stage === 'gathering') return room.organizerId === ME ? 'Собираем участников' : 'Ждём жеребьёвку'
  if (room.stage === 'drawn') return room.revealSeen ? 'Готовим подарки' : 'Жеребьёвка прошла'
  return 'Обмен завершён'
}

export function RoomCard({ room, compact }: { room: Room; compact?: boolean }) {
  const people = useRoomPeople(room)
  const face = themeFace[room.theme]
  const fresh = room.stage === 'drawn' && !room.revealSeen
  return (
    <motion.div whileTap={{ scale: 0.97 }} className="shrink-0 snap-start">
      <Link
        to={`/rooms/${room.id}`}
        className={`relative flex flex-col overflow-hidden rounded-[32px] p-5 ${face.bg} ${face.text} ${compact ? 'h-[200px] w-full' : 'h-[260px] w-[230px]'}`}
      >
        <div className="pointer-events-none absolute -bottom-6 -right-8 opacity-95">
          <Art name={face.art} size={compact ? 140 : 170} noShadow />
        </div>
        <span className="relative inline-flex w-fit items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 text-[12px] backdrop-blur">
          {fresh && <span className="h-2 w-2 animate-pulse rounded-full bg-marzipan" />}
          {stageLabel(room)}
        </span>
        <h3 className="type-h3 relative mt-3 max-w-[11ch] text-[22px] leading-[1.1]">{room.name}</h3>
        <p className="relative mt-1 text-[13px] opacity-75">
          {countdownLabel(room.date)}
          <br />
          До {formatRub(room.budget)}
        </p>
        <div className="relative mt-auto">
          <AvatarStack people={people} max={3} size={30} />
        </div>
      </Link>
    </motion.div>
  )
}
