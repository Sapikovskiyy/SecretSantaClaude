# Santomi

Тайный Санта в Telegram: игры, вишлисты, жеребьёвка, анонимный чат и подбор подарков.

**Статус:** дизайн-система v2 (по `design-handoff/`), Milestone B — экраны 01 Welcome, 07 Интересы, 08 Вишлист, 11 Анонимный чат. Остальные экраны работают в демо и будут переведены на v2 в Milestone C.
Бэкенд (Supabase Edge Functions, Telegram-авторизация, Yandex AI, Stars) ещё не реализован — есть только SQL-миграция `supabase/migrations/0001`.

## Запуск

```bash
npm install
npm run dev            # демо-режим, http://localhost:5173
```

| Команда | Что делает |
| --- | --- |
| `npm run dev` | Сервер разработки в демо-режиме |
| `npm run typecheck` | Проверка TypeScript |
| `npm test` | Юнит-тесты (жеребьёвка, подбор идей) |
| `npm run build` | Продакшен-сборка: без бэкенда показывает «Скоро откроемся» |
| `npm run build:demo` | Сборка демо-версии |
| `npx playwright test` | Браузерные сценарии на 390×844 и 360×800 (локальный Edge) |
| `node scripts/compare.mjs` | Картинки «референс ↔ реализация» в `screenshots/compare` |
| `npm run assets <папка>` | Оптимизация исходных 3D-рендеров (PNG → WebP в `src/assets/3d`) |

## Режимы
- **Демо** — `VITE_DEMO_MODE=true` или `--mode demo`. Данные симулированы и хранятся в браузере, на экранах есть плашка «Демо-режим».
- **Продакшен** — без флага. Демо-данные никогда не подставляются; пока нет сервера, показывается честный экран «Сервер ещё не подключён».

## Деплой
`.github/workflows/deploy.yml` собирает проект в GitHub Actions и выполняет `wrangler deploy` в Worker `young-sea-124d` при push в `main`
(нужны секреты репозитория `CLOUDFLARE_API_TOKEN` и `CLOUDFLARE_ACCOUNT_ID`). Сейчас workflow собирает демо (`VITE_DEMO_MODE=true`).
Ручной вариант: `npm run deploy:demo`.

## Структура
```
design-handoff/  ТЗ, motion-спека, референсы 14 экранов
src/
  components/ds  дизайн-система v2 (PageHeader, PrimaryCTA, CreamSheet, Segmented…)
  components/art 3D-иллюстрации (WebP) с векторным запасным вариантом
  motion/        токены анимаций по MOTION_SPEC_RU.md
  domain/        чистая логика: жеребьёвка, интересы, идеи подарков
  data/          демо-хранилище (Zustand + localStorage)
  screens/       экраны
supabase/        миграции БД (RLS, атомарная жеребьёвка)
e2e/             Playwright-сценарии
```
