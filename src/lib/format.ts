const rub = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

export const formatRub = (n: number) => `${rub.format(n)} ₽`

export const formatRange = (a: number, b: number) => `${rub.format(a)}–${rub.format(b)} ₽`

export function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export function daysUntil(iso: string) {
  const d = new Date(iso + 'T12:00:00').getTime()
  const now = new Date()
  now.setHours(12, 0, 0, 0)
  return Math.round((d - now.getTime()) / 86_400_000)
}

/** 1 день, 2 дня, 5 дней */
export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

export function countdownLabel(iso: string) {
  const d = daysUntil(iso)
  if (d < 0) return 'Обмен прошёл'
  if (d === 0) return 'Обмен сегодня'
  if (d === 1) return 'Обмен завтра'
  return `До обмена ${d} ${plural(d, 'день', 'дня', 'дней')}`
}

export function timeHM(ts: number) {
  return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export function inviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return s
}
