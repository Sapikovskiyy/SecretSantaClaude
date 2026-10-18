import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Button, SwipeConfirm } from '@/components/ui/Buttons'
import { AvatarStack, DemoBadge, inputDark } from '@/components/ui/Kit'
import { Art } from '@/components/art/Art'
import { FREE_PARTICIPANT_LIMIT, ME, useDemo } from '@/data/demoStore'
import { personName, useRoomPeople } from '@/data/people'
import { formatDate, formatRub, plural } from '@/lib/format'
import { haptic } from '@/lib/telegram'
import { toast } from '@/data/uiStore'

export function Join() {
  const { code: paramCode } = useParams()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const { findRoomByCode, joinByCode, me } = useDemo()
  const room = paramCode ? findRoomByCode(paramCode) : undefined
  const people = useRoomPeople(room)

  // Step 1: enter a code manually
  if (!paramCode) {
    return (
      <Screen surface="pine" back="/home">
        <h1 className="type-title mt-6 max-w-[12ch] px-5">Введите код приглашения</h1>
        <p className="mt-3 max-w-[30ch] px-5 text-[15px] text-snow/70">Его можно найти в ссылке, которую прислал организатор</p>
        <div className="mt-8 px-5">
          <input
            autoFocus
            className={`${inputDark} text-center text-[28px] tracking-[0.3em] uppercase`}
            placeholder="ABC123"
            maxLength={12}
            value={code}
            aria-label="Код приглашения"
            onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && code.length >= 4 && navigate(`/join/${code}`)}
          />
          <p className="mt-3 text-center text-[13px] text-snow/50">В демо попробуйте код SANTA5</p>
        </div>
        <div className="mt-6 flex justify-center">
          <Art name="envelope" size={180} />
        </div>
        <div className="mt-auto px-5">
          <Button className="w-full" tone="snow" disabled={code.length < 4} onClick={() => navigate(`/join/${code}`)}>
            Найти игру
          </Button>
        </div>
      </Screen>
    )
  }

  // Invalid link
  if (!room) {
    return (
      <Screen surface="cocoa" back="/home">
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <Art name="envelope" size={160} />
          <h1 className="type-title mt-4">Приглашение не найдено</h1>
          <p className="mt-3 max-w-[30ch] text-[15px] text-snow/65">
            Проверьте код «{paramCode.toUpperCase()}» или попросите организатора прислать новую ссылку
          </p>
          <div className="mt-6 flex gap-2">
            <Link to="/join" className="flex h-12 items-center rounded-full bg-snow px-5 text-[15px] font-medium text-ink">
              Ввести код
            </Link>
            <Link to="/home" className="flex h-12 items-center rounded-full bg-truffle px-5 text-[15px]">
              На главную
            </Link>
          </div>
        </div>
      </Screen>
    )
  }

  const already = room.members.some((m) => m.personId === ME)
  const full = room.members.length >= (room.participantLimit ?? FREE_PARTICIPANT_LIMIT)
  const closed = room.stage !== 'gathering'

  const join = () => {
    const res = joinByCode(room.inviteCode)
    if (res.status === 'joined') {
      haptic.success()
      toast('Вы в игре!')
      navigate(`/rooms/${room.id}`, { replace: true })
    } else if (res.status === 'already') navigate(`/rooms/${room.id}`, { replace: true })
    else toast(res.status === 'full' ? 'В игре больше нет мест' : 'Жеребьёвка уже прошла', 'error')
  }

  return (
    <Screen surface="pine" back="/home">
      {/* Group pill — straight from the reference */}
      <div className="mx-5 flex items-center gap-3 rounded-full bg-white/12 p-2 pr-5 backdrop-blur-md">
        <AvatarStack people={people} max={3} size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-snow/65">
            {people.length} {plural(people.length, 'участник', 'участника', 'участников')}
          </p>
          <p className="truncate text-[15px] font-medium">{room.name}</p>
        </div>
      </div>

      <h1 className="type-display mt-8 max-w-[11ch] px-5">Вас зовут в Тайного Санту</h1>
      <p className="mt-3 px-5 text-[15px] text-snow/75">Организатор — {personName(room.organizerId, me)}</p>

      <div className="relative mt-2 flex flex-1 items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 14 }}>
          <Art name="teahouse" size={230} />
        </motion.div>
      </div>

      <div className="mx-5 rounded-[36px] bg-marzipan p-5 text-ink">
        <div className="flex justify-between text-[15px]">
          <span className="text-ink/60">Обмен</span>
          <span className="font-medium">{formatDate(room.date)}</span>
        </div>
        <div className="mt-2 flex justify-between text-[15px]">
          <span className="text-ink/60">Бюджет</span>
          <span className="font-medium">до {formatRub(room.budget)}</span>
        </div>
        {room.description && <p className="mt-3 text-[14px] text-ink/70">{room.description}</p>}
        <div className="mt-5">
          {already ? (
            <Button className="w-full" tone="ember" onClick={() => navigate(`/rooms/${room.id}`)}>
              Вы уже в игре — открыть
            </Button>
          ) : closed ? (
            <p className="rounded-[20px] bg-snow p-4 text-center text-[15px]">Жеребьёвка уже прошла — присоединиться нельзя</p>
          ) : full ? (
            <p className="rounded-[20px] bg-snow p-4 text-center text-[15px]">Все места заняты. Попросите организатора увеличить лимит</p>
          ) : (
            <SwipeConfirm label="Присоединиться" knobIcon="check" tone="taupe" onConfirm={join} />
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-center">
        <DemoBadge />
      </div>
    </Screen>
  )
}
