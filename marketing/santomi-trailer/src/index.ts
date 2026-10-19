import { continueRender, delayRender, registerRoot } from 'remotion'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import { Root } from './Root'

// Block rendering until Inter (incl. the Cyrillic subset) is ready — no font swaps mid-video.
const handle = delayRender('Loading Inter')
const sample = 'Дарить — это магия. Santomi Тайный Санта в Telegram'
Promise.all(['500', '600', '700'].map((w) => document.fonts.load(`${w} 100px Inter`, sample)))
  .then(() => document.fonts.ready)
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle))

registerRoot(Root)
