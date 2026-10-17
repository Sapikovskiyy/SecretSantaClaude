# Santomi (Telegram Mini App, Secret Santa)

Status: Demo Mode UI is written; NOT yet built or type-checked (see below).

## Run (demo)
    npm install
    npm run dev          # .env has VITE_DEMO_MODE=true
    npm run build        # output in dist/
    npm run typecheck    # tsc --noEmit
    npm test             # draw algorithm tests

## Deploy to Cloudflare
    npm run build && npx wrangler deploy     # wrangler.jsonc serves ./dist with SPA fallback
For production leave VITE_DEMO_MODE empty. The app then shows "server not connected" until the backend exists.

## Not implemented yet
Supabase client and Edge Functions (Telegram initData verification, draw, messages), AI proxy (Yandex),
Telegram Stars payments, bot notifications, service worker. Only SQL migration 0001 and the draw algorithm exist.

## Motion
Shared tokens and primitives live in src/motion. MotionConfig reducedMotion="user" is set in main.tsx.

## Deploy without building locally
See .github/workflows/deploy.yml (GitHub Actions builds and runs wrangler deploy for Worker young-sea-124d).
Alternative: Workers dashboard > young-sea-124d > Settings > Builds, connect the repo, build `npm run build`, deploy `npx wrangler deploy`.
