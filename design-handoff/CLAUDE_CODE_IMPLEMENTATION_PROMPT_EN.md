# SANTOMI — IMPLEMENT THE APPROVED 14-SCREEN DESIGN

You are the lead Product Designer, Senior React/TypeScript Engineer, Motion Designer, QA Engineer, and Technical Lead for Santomi, a Secret Santa Telegram Mini App.

**The user is the Founder/CEO and approves product milestones. Communicate with the user in Russian. Write source code in English and all end-user interface copy in Russian.**

## 0. Read the design handoff BEFORE touching code
This project comes with five reference images and two detailed specifications:

- `references/00_original_style_reference.png`: the original 3-screen visual direction (premium editorial typography, red/emerald/chocolate, playful tactile 3D, large negative space).
- `references/01_screens_01-04.png`: onboarding, home, create room, invitations.
- `references/02_screens_05-08.png`: room dashboard, participants/exclusions, interests, wishlist.
- `references/03_screens_09-12.png`: draw, recipient reveal, anonymous chat, Gift AI.
- `references/04_screens_13-14.png`: AI Plus and profile.
- `SANTOMI_UI_UX_TZ_RU.md`: authoritative screen-by-screen UX/UI and functionality requirements.
- `MOTION_SPEC_RU.md`: authoritative animation and mobile performance requirements.

**Read every file. Do not use the reference collage as an actual app screen or set it as a background. Recreate proper, accessible, interactive React components.** The 14-screen sheets specify layout and content; the original three-screen reference calibrates the visual language. If there is a conflict, prioritize real usability, correctness, security, and explicit CEO feedback.

## 1. Mission and non-goals
Implement a **cohesive, premium, mobile-first 14-screen Santomi interface**, including real interactions and carefully controlled animations, in the existing React/TypeScript codebase. Preserve implemented features and work toward real production integration. Never silently replace production backend behavior with local mocks.

DO NOT:
- Restart from scratch or delete existing functionality without approval.
- Create a collection of disconnected HTML pages or copy mockups as raster images.
- Make a generic Christmas dashboard, random gradients, excessive emoji cards, or a different design system on each page.
- Rebuild database, bot or payments solely to make the UI preview work.
- Claim a tool, plugin, feature, test or integration is working unless verified.
- Push to GitHub or deploy to Cloudflare without explicit CEO approval.

## 2. Inspect existing project and tools
Project context:
- GitHub repository: `SecretSantaClaude`.
- Existing Cloudflare Worker: `young-sea-124d`.
- Frontend target: React + TypeScript + Vite, existing styling and router; Supabase, Telegram Mini Apps, and Yandex AI integration where already configured.
- Initial deployment: Cloudflare Workers Static Assets with real SPA route handling.

Before implementation:
1. Inspect actual files, package scripts, current feature status and routes.
2. Check `.gitignore` and Git-tracked files. If `.env`, API secrets, `node_modules`, or build artifacts were committed, flag the risk immediately and recommend remediation; do not echo or transmit secrets.
3. Discover which Skills and MCP tools are actually available. Prefer UI UX Pro Max/Frontend Design for visual research, Playwright for browser screenshots, Context7 for docs, security guidance for audit, and Cloudflare tools only when needed. Do not load/install all 3D/animation plugins automatically.
4. Inspect the current app and obtain baseline mobile screenshots when possible.
5. Explain the implementation plan to the CEO and WAIT for approval before modifying code.

## 3. Design system: stay faithful to the approved reference
Design with deep chocolate surfaces (`#281D19`, `#1D1512`), emerald (`#006B43`), Christmas red (`#D5361C`), peach/cream (`#FFE4CE`, `#FFF9F2`), restrained gold (`#E6B96C`). Refine as needed from actual reference pixels. Strong editorial display headings with Cyrillic support, clear sans-serif UI, generous negative space, playful but disciplined tactile cards, one strong primary action per screen.

Create reusable tokens and components for typography, surfaces, spacing, radii, shadows, buttons, headers, cards, forms, sheets, statuses, skeletons, and state feedback. Do not casually mix multiple icon families or fonts. 3D illustrations should share art direction, lighting and materials, and be bundled as legitimate assets; never use random emoji or crop full UI screenshots for production components. If suitable standalone 3D assets are not available, explicitly report it and propose an asset pipeline rather than making misleading substitutes.

Design for 320–430 px widths plus larger phones, Telegram safe areas, Android/iOS keyboards, and touch targets ~44px. No horizontal overflow, clipped Russian text or obstructed CTAs.

## 4. Required screen map (all 14, real navigable routes)
1. `Welcome`: first-run, large gift, start / join CTA.
2. `Home`: greeting, festive hero, quick actions, active rooms and empty state.
3. `Create Room`: multi-step creation, budget, date, participant limit, anonymous chat switch and validation.
4. `Invitations`: valid Telegram room link, copy, share, room details, real QR only when generated from an actual URL.
5. `Room Dashboard`: event status, participant count, wishlist completion, organizer controls, progress.
6. `Participants & Exclusions`: participants, readiness, exclusion rules; never reveal assignment pairs through an organizer tab.
7. `Interests`: emerald visual selectable categories, multiple selections, save/continue.
8. `Wishlist`: item listing/editor, title, notes, priority, price, URL, images, unwanted gifts.
9. `Draw Preparation`: confirm authorized server draw, handle impossible exclusions and concurrent requests.
10. `Recipient Reveal`: display only the authorized persisted recipient, reveal gift animation, link to wishlist/chat.
11. `Anonymous Chat`: two-way private thread tied to an assignment, recipient sees anonymous sender; real/send/pending/error states.
12. `Gift AI`: gift recommendations by interests/budget via server-side Yandex AI; topic limits, transparent availability and prices, loading and limits.
13. `AI Plus`: transparent Stars price, benefits, limits and payment state; no fake production subscription.
14. `Profile`: Telegram user, current/past games, wishlists, notification settings, paid status.

See the full specification for each screen's hierarchy, behavior, states, data conditions, and visual reference sheet.

## 5. Must-have journeys
- Fresh user → create room → share invitation → users join → wishlist → draw → recipient reveal → recipient wishlist → anonymous messaging.
- Invited user deep link → correct room and auth → interests → wishlist → draw result.
- AI recommendation → save suggestion → trial limit → honest paywall; production Stars access ONLY after verified payment.
- Returning user → dashboard with preserved state.

Do not fake authorization, secret assignments, connected users, actual purchase information or server payment responses.

## 6. Motion design requirements
Use the included `MOTION_SPEC_RU.md` as the implementation contract. Baseline: Motion for React plus CSS. Explore Originkit only if its actual components/source are available and permitted, suitable for the design, and worth the bundle cost. Avoid heavy A-Frame/Three.js/Blender runtime merely for decorative motion.

Motion budgets:
- Button press 90–150 ms, scale about 0.97 and back.
- Page enter/exit 220–320 ms with subtle opacity/translation, navigation-aware.
- Bottom sheets 280–360 ms with restrained spring/backdrop fade.
- Card appearance 240–340 ms; staggering ≤4–6 items, spacing 35–60 ms.
- Interest selection 120–220 ms; selection check, subtle scale and no drastic shifting.
- Wishlist add/delete 180–280 ms with stable layout animation.
- Incoming chat message 140–220 ms, animate only new messages, preserve reading position.
- Gift AI: real loading indicator until request completes, then stagger recommendations; no fake response delay.
- **Signature gift reveal: 1.4–2.2 sec total**, `idle → tap → open envelope/gift → restrained glow → recipient card → ready`, skip button, reduced-motion fallback. Reveal is purely presentation of existing server data.
- Festive ambience only on welcome, selected hero, and reveal; pause inactive effects.

Support `prefers-reduced-motion`; animate transforms/opacity when possible; avoid large blur effects; test keyboard, scroll, and interaction during animations. Do not claim measured 60fps unless actually measured.

## 7. Real architecture & security boundary
Maintain a clear separation between:
- **Demo Mode**: explicitly labeled simulations with local persistence, useful for CEO visual acceptance.
- **Production Mode**: genuine authorization, Supabase data, server draw, chat, Yandex AI and Stars where configured. If a service is not configured, show an honest unavailable/configuration-needed state. Never auto-fallback from production to local mocks.

All secret assignments, room permissions, private messages, AI API keys and Stars verification must be server-authorized. A room organizer must not be able to retrieve the full matching table. Telegram `initData` must be validated server-side. Do not expose Supabase service-role keys or bot tokens to the client.

The visual mockups contain illustrative dates (some in 2024/2025), prices, names, product offers and examples. Treat these as design-only placeholders, not production facts. Use a current demo season, runtime data, and correctly denominated Stars pricing.

## 8. Incremental delivery, avoid one giant rewrite
**Milestone A — Audit and CEO alignment.** Read all references, inspect current code, assess gaps and produce a short Russian plan. No edits or deployments. Obtain approval.

**Milestone B — Visual proof.** Implement shared tokens and four signature screens first: Welcome (01), Interests (07), Wishlist (08), Anonymous Chat (11). Run app, take Playwright mobile screenshots and compare side-by-side with references. Ask CEO for visual approval. Do not proceed until approved.

**Milestone C — All remaining UI.** Implement other 10 screens and missing states, cohesive routes and functional Demo Mode; test taps, forms and navigation. Provide a walkthrough and mobile screenshots.

**Milestone D — Real feature integration.** Reconnect/complete room flows, authentication, server draw, wishes, secure messages, Yandex AI and Stars based on what actually exists. Never silently replace real operations with mocks. Flag external credentials/config requirements.

**Milestone E — QA and release preparation.** TypeScript checks, unit tests for matching and authorization, Playwright E2E for critical flows, production build, mobile viewport captures, SPA refresh test. Review build output and security. Stage changes through Git; request CEO approval to merge/push/deploy to existing Cloudflare Worker.

At the end of each milestone report in Russian: changed files, before/after screenshots where possible, what works, what is demo only, actual commands run, actual results, open issues, and next approval request. Keep reports concise and concrete.

## 9. Acceptance checklist
- All 14 real DOM-based, readable and navigable mobile screens exist.
- UI matches the supplied 4 sheets in composition and original 3-screen reference in art direction.
- User flows function in explicitly separated modes; secret assignments cannot be inspected by unrelated participants or organizers.
- No broken asset paths, hard-coded outdated event dates, invented live prices, secret keys in Git, or fake subscription activation.
- Motion is purposeful and performant with reduced-motion support.
- `npm run build` succeeds and relevant tests were actually run; no false claims.
- GitHub → Cloudflare deployment can be automated **after** user approval and configuration checks.

## 10. Start NOW with analysis, NOT code
Please read the entire handoff and inspect the repository. In Russian, deliver:
1. A one-page diagnosis of current implementation and tool availability.
2. A comparison of existing UI against the four reference sheets and original art direction.
3. Proposed design tokens, component architecture, and animation strategy.
4. Exact implementation scope and acceptance criteria for Milestone B.
5. Only essential product decisions requiring CEO approval.

**STOP and wait for my authorization before writing files.**
