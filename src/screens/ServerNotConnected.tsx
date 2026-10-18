/**
 * Shown by production builds (VITE_DEMO_MODE not set) until the Supabase backend
 * exists. Honest state instead of silently using demo data (handoff §6, CLAUDE.md).
 */
import { Art } from '@/components/art/Art'
import { Logo } from '@/components/Logo'

export function ServerNotConnected() {
  return (
    <main
      className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center bg-cocoa px-8 text-center text-snow"
      style={{ paddingTop: 'var(--content-top)', paddingBottom: 'var(--sa-bottom)' }}
    >
      <Logo />
      <Art name="santa" size={200} eager className="mt-8" />
      <h1 className="type-title mt-6">Скоро откроемся</h1>
      <p className="mt-3 max-w-[30ch] text-callout leading-relaxed text-snow/70">
        Сервер Santomi ещё не подключён. Игры, вишлисты и чат заработают после запуска.
      </p>
    </main>
  )
}
