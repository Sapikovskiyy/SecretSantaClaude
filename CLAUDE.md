# Santomi — permanent project rules

Santomi is a premium Secret Santa Telegram Mini App (React + TS + Vite + Tailwind v4 + Motion).
Owner: CEO / Product Owner. Claude acts as the full technical team.

## Communication
- Talk to the CEO in **Russian**. All user-facing UI text in **Russian**.
- Code, identifiers, comments: English.
- Report honestly: what works, what was tested, what is incomplete, what needs a decision.

## Design system (do not drift)
- Visual source of truth: `design-handoff/` — 4 sheets of 14 screens (structure) + original 3-screen reference (art direction), plus SANTOMI_UI_UX_TZ_RU.md and MOTION_SPEC_RU.md.
- Tokens live in `src/styles/index.css` (`@theme`): cocoa, bark, truffle, taupe, ember, pine, marzipan, snow.
- Type: system SF Pro stack (`-apple-system, BlinkMacSystemFont, 'Inter', …`) — SF Pro on Apple devices, bundled Inter (OFL) elsewhere. Never bundle SF Pro files. Roles: `.type-hero/.type-display/.type-title/.type-screen/.type-h3/.type-label`; sizes via `text-hero|title|section|card|button|body|callout|secondary|footnote|caption|numeral` tokens (`@theme` in index.css). No arbitrary `text-[Npx]` for text, no uppercase.
- Buttons: `SantomiButton` / `SantomiLinkButton` only (variants primary·success·premium·secondary·ghost·danger; styles in `src/styles/buttons.css`). One dimensional gradient CTA per screen; premium (gold) only for AI Plus.
- Signature controls: `SwipeConfirm` pill, round `IconButton`, marzipan bottom panels, `Sheet` bottom sheets, floating `Dock`.
- Illustrations: `Art` renders 3D WebP from `src/assets/3d` (source PNGs → `npm run assets <folder>`); vector fallback only for keys without a render.
- DS v2 primitives: `src/components/ds` (PageHeader, PrimaryCTA, SecondaryCTA, CreamSheet, Segmented, StatusPill, states). Motion tokens: `src/motion/tokens.ts`.
- One primary action per screen. No generic dashboards, no stock imagery, no emoji as major illustrations.
- Motion: **Motion for React only** (OriginKit not connected in this environment). Respect reduced motion (`MotionConfig reducedMotion="user"`).

## Architecture
- `src/domain/*` — pure logic (draw algorithm, gift ideas). Must stay framework-free so it can run in Supabase Edge Functions (Deno).
- `src/data/demoStore.ts` — **Demo Mode only** (localStorage), enabled by `VITE_DEMO_MODE=true` / `--mode demo` (`src/lib/mode.ts`). Production builds show `ServerNotConnected` until the backend exists.
- `supabase/migrations` — schema + RLS + atomic `store_draw` (pre-existing, keep).
- `src/screens/*` — one file per screen. `src/components/ui/*` — design-system primitives.
- Phase 2+ backend: Supabase (Postgres + RLS + Edge Functions). Telegram `initData` verified server-side only.

## Security rules
- Never put secrets in `VITE_*` variables or frontend code. Service role / bot token / Yandex keys = Edge Function secrets.
- The draw runs server-side in production; clients receive only their own recipient.
- Never expose full assignment mappings, santa identities in chat payloads, or organizer access to private chats.
- Never unlock paid features from frontend state; never simulate a successful payment.

## Workflow
- Feature branches; `main` stays stable; no push to `main` and no production deploy without CEO approval.
- Before claiming done: `npm run typecheck`, `npm test`, `npm run build`, `npx playwright test`.
- Playwright uses the local Edge (`PW_CHANNEL` env to override).
