/**
 * Profile personalisation. Live «Так вас увидит Санта» preview on top, then:
 * avatar (coloured initial or a 3D mascot) · name · about me · sizes · interests / «не дарить» links.
 * Bio and sizes are shown only to the person who draws you (server-side rule in production).
 */
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Avatar } from '@/components/ui/Kit'
import { Icon } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { SantomiButton } from '@/components/ds'
import { AnimatedCheck, CollapsingHeader } from '@/components/ds/apple'
import { useDemo } from '@/data/demoStore'
import { AVATAR_ARTS, AVATAR_TINTS, BIO_MAX, CLOTHING_SIZES, NAME_MAX, SHOE_SIZES } from '@/domain/look'
import { interestById } from '@/domain/interests'
import { haptic, isTelegram } from '@/lib/telegram'
import { toast } from '@/data/uiStore'
import { APPLE, PRESS } from '@/motion/tokens'

export function EditProfile() {
  const navigate = useNavigate()
  const { me, profile, interests, avoid, updateMe, updateProfile } = useDemo()
  const [name, setName] = useState(me.name === 'Вы' ? '' : me.name)
  const [tint, setTint] = useState(me.tint)
  const [art, setArt] = useState<string | undefined>(me.avatarArt)
  const [bio, setBio] = useState(profile.bio)
  const [clothing, setClothing] = useState(profile.clothing)
  const [shoe, setShoe] = useState(profile.shoe)
  const [touched, setTouched] = useState(false)
  const nameError = name.trim().length < 2 ? 'Хотя бы 2 буквы' : undefined
  const preview = { ...me, name: name.trim() || 'Ваше имя', tint, avatarArt: art }

  const save = () => {
    if (nameError) {
      setTouched(true)
      haptic.error()
      return toast('Введите имя — хотя бы 2 буквы', 'error')
    }
    updateMe({ name: name.trim().slice(0, NAME_MAX), tint, avatarArt: art })
    updateProfile({ bio: bio.trim().slice(0, BIO_MAX), clothing, shoe })
    haptic.success()
    toast('Профиль сохранён')
    navigate('/profile')
  }

  return (
    <Screen back="/profile" headless surface="cocoa" className="!pb-0">
      <CollapsingHeader
        className="mt-[22px]"
        title="Профиль"
        left={
          !isTelegram ? (
            <motion.button whileTap={PRESS} aria-label="Назад" onClick={() => navigate('/profile')} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <Icon name="back" size={22} />
            </motion.button>
          ) : undefined
        }
      />

      <div className="px-6 pt-3">
        <h1 className="t-page-tight text-snow">Мой профиль</h1>
        <p className="mt-2 text-callout text-snow/75">Помогите своему Санте с подарком</p>
      </div>

      {/* Live preview */}
      <motion.section layout aria-label="Так вас увидит Санта" className="mx-4 mt-5 flex items-center gap-4 rounded-[28px] bg-[linear-gradient(180deg,#ffe8d2,#fde2c8)] p-4 text-ink">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={`${art ?? 'letter'}-${tint}`} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={APPLE.bouncy} className="rounded-full ring-[3px] ring-[#fff4e8]">
            <Avatar person={preview} size={68} />
          </motion.span>
        </AnimatePresence>
        <div className="min-w-0 flex-1">
          <p className="text-caption text-ink-soft">Так вас увидит Санта</p>
          <p className="truncate text-card font-medium">{preview.name}</p>
          <p className="line-clamp-2 text-footnote text-ink/75">{bio.trim() || 'Пара слов о себе'}</p>
          {(clothing || shoe) && (
            <p className="mt-0.5 text-caption text-ink-soft">
              {[clothing && `Одежда ${clothing}`, shoe && `обувь ${shoe}`].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </motion.section>

      {/* Avatar */}
      <Section title="Аватар">
        <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1" role="radiogroup" aria-label="Талисман">
          <Choice active={!art} label="Буква" onClick={() => setArt(undefined)}>
            <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full text-card font-medium text-snow" style={{ background: tint }}>
              {(name.trim() || 'В')[0].toUpperCase()}
            </span>
          </Choice>
          {AVATAR_ARTS.map((a) => (
            <Choice key={a} active={art === a} label={`Талисман ${a}`} onClick={() => setArt(a)}>
              <Art name={a} size={56} noShadow />
            </Choice>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2.5" role="radiogroup" aria-label="Цвет аватара">
          {AVATAR_TINTS.map((t) => (
            <motion.button
              key={t}
              role="radio"
              aria-checked={tint === t}
              aria-label={`Цвет ${t}`}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                haptic.select()
                setTint(t)
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-snow transition-shadow duration-200 ${tint === t ? 'shadow-[0_0_0_3px_#2d1d16,0_0_0_5px_#ffe4ce]' : ''}`}
              style={{ background: t }}
            >
              {tint === t && <AnimatedCheck size={16} strokeWidth={3} />}
            </motion.button>
          ))}
        </div>
      </Section>

      {/* Name & bio */}
      <Section title="О себе">
        <div className="rounded-[26px] bg-[linear-gradient(180deg,#ffe8d2,#fde2c8)] px-5 text-ink">
          <label className="block border-b border-ink/10 py-3">
            <span className={`block text-secondary ${touched && nameError ? 'text-ember' : 'text-ink-soft'}`}>{touched && nameError ? nameError : 'Имя'}</span>
            <input aria-label="Имя" className="mt-1 block w-full bg-transparent text-button outline-none placeholder:text-ink/40" value={name} maxLength={NAME_MAX} placeholder="Как вас зовут" onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block py-3">
            <span className="flex justify-between text-secondary text-ink-soft">
              О себе <span className="tabular-nums">{bio.length}/{BIO_MAX}</span>
            </span>
            <textarea aria-label="О себе" rows={2} maxLength={BIO_MAX} className="mt-1 block w-full resize-none bg-transparent text-body leading-snug outline-none placeholder:text-ink/40" placeholder="Например: люблю горы, кофе и настолки" value={bio} onChange={(e) => setBio(e.target.value)} />
          </label>
        </div>
        {isTelegram && <p className="mt-2 px-1 text-footnote text-snow/55">Имя из Telegram можно заменить — участники увидят новое</p>}
      </Section>

      {/* Sizes */}
      <Section title="Размеры" note="Видит только ваш Тайный Санта">
        <p className="mb-2 px-1 text-secondary text-snow/70">Одежда</p>
        <Pills options={CLOTHING_SIZES} value={clothing} onChange={setClothing} label="Размер одежды" />
        <p className="mb-2 mt-4 px-1 text-secondary text-snow/70">Обувь</p>
        <Pills options={SHOE_SIZES} value={shoe} onChange={setShoe} label="Размер обуви" />
      </Section>

      {/* Links */}
      <Section title="Подсказки для Санты">
        <div className="overflow-hidden rounded-[22px] bg-white/[0.06]">
          <LinkRow title="Интересы" value={interests.length ? interests.map((i) => interestById[i].title).join(', ') : 'Не выбраны'} onClick={() => navigate('/wishlist/interests')} />
          <div className="mx-5 h-px bg-white/[0.08]" />
          <LinkRow title="Не дарить" value={avoid.length ? avoid.join(', ') : 'Ничего не указано'} onClick={() => navigate('/wishlist')} />
        </div>
      </Section>

      <div className="sticky bottom-0 z-20 mt-4 bg-[linear-gradient(to_top,#2d1d16_70%,rgba(45,29,22,0))] px-[22px] pt-6" style={{ paddingBottom: 'calc(var(--sa-bottom) + 16px)' }}>
        <SantomiButton fullWidth trailingIcon="check" onClick={save}>
          Сохранить
        </SantomiButton>
      </div>
    </Screen>
  )
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="mt-6 px-4">
      <h2 className="mb-2.5 px-1 text-callout font-medium text-snow/80">{title}</h2>
      {children}
      {note && <p className="mt-2 px-1 text-footnote text-snow/55">{note}</p>}
    </section>
  )
}

function Choice({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <motion.button
      role="radio"
      aria-checked={active}
      aria-label={label}
      whileTap={{ scale: 0.92 }}
      onClick={() => {
        haptic.select()
        onClick()
      }}
      className={`relative flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${active ? 'bg-[rgba(255,228,206,.16)] ring-2 ring-marzipan' : 'bg-white/[0.07] ring-1 ring-white/[0.06]'}`}
    >
      {children}
    </motion.button>
  )
}

function Pills({ options, value, onChange, label }: { options: readonly string[]; value?: string; onChange: (v?: string) => void; label: string }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const active = value === o
        return (
          <motion.button
            key={o}
            role="radio"
            aria-checked={active}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              haptic.select()
              onChange(active ? undefined : o)
            }}
            className={`h-11 min-w-[52px] shrink-0 rounded-full px-4 text-callout transition-colors duration-200 ${active ? 'bg-marzipan font-medium text-ink' : 'bg-white/[0.08] text-snow/90'}`}
          >
            {o}
          </motion.button>
        )
      })}
    </div>
  )
}

function LinkRow({ title, value, onClick }: { title: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex min-h-[60px] w-full items-center gap-4 px-5 py-3 text-left">
      <span className="min-w-0 flex-1">
        <span className="block text-body text-snow">{title}</span>
        <span className="block truncate text-footnote text-snow/55">{value}</span>
      </span>
      <Icon name="forward" size={18} className="shrink-0 text-snow/60" />
    </button>
  )
}
