/**
 * Animation asset registry. Drop real files into:
 *   src/assets/rive/<key>.riv        (exported from the Rive editor)
 *   src/assets/lottie/<key>.lottie   (licensed dotLottie files)
 * and they are picked up automatically by key. Missing keys resolve to `undefined`,
 * so screens keep showing their static 3D illustration and NO runtime is loaded.
 * We never ship placeholder or fabricated animation files.
 */
const fileKey = (path: string) => path.split('/').pop()!.replace(/\.(riv|lottie|json)$/, '')

const riveFiles = import.meta.glob('../assets/rive/*.riv', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const lottieFiles = import.meta.glob('../assets/lottie/*.{lottie,json}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

const RIVE = Object.fromEntries(Object.entries(riveFiles).map(([p, url]) => [fileKey(p), url]))
const LOTTIE = Object.fromEntries(Object.entries(lottieFiles).map(([p, url]) => [fileKey(p), url]))

/** Planned Rive assets (interactive, state-machine driven). */
export type RiveKey = 'gift-ai-robot' | 'gift-reveal'
/** Planned dotLottie assets (short, pre-rendered feedback). */
export type LottieKey = 'success-check' | 'loading-dots' | 'confetti-soft' | 'notification-bell' | 'completion-star'

export const riveAsset = (key: RiveKey): string | undefined => RIVE[key]
export const lottieAsset = (key: LottieKey): string | undefined => LOTTIE[key]
