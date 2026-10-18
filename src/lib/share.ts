import { isTelegram, tg } from './telegram'

const BOT = import.meta.env.VITE_BOT_USERNAME as string | undefined
const APP = import.meta.env.VITE_APP_SHORT_NAME as string | undefined

/** Deep link that opens the Mini App straight into the join flow. */
export function inviteLink(code: string) {
  if (BOT && APP) return `https://t.me/${BOT}/${APP}?startapp=${code}`
  return `${window.location.origin}/join/${code}`
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

/** Returns how the link was shared so the UI can confirm. */
export async function shareInvite(code: string, roomName: string): Promise<'telegram' | 'native' | 'copied'> {
  const url = inviteLink(code)
  const text = `Присоединяйся к Тайному Санте «${roomName}» в Santomi`
  if (isTelegram && tg?.openTelegramLink) {
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`)
    return 'telegram'
  }
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Santomi', text, url })
      return 'native'
    } catch {
      /* user cancelled — fall through to copy */
    }
  }
  await copyText(url)
  return 'copied'
}
