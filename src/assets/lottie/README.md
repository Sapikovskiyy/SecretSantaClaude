# dotLottie assets

Put licensed `.lottie` (preferred) or `.json` files here. Only use animations you have the
rights to (your own, commissioned, or with a license that allows commercial use — check the
LottieFiles license of each file). The file name is the key (`src/animation/assets.ts`):

| File | Used on | Notes |
| --- | --- | --- |
| `success-check.lottie` | 09 Draw — «Жеребьёвка проведена» | plays once, ≤ 1.2 s |
| `loading-dots.lottie` | AI / network loading | loop only while a real request runs |
| `confetti-soft.lottie` | small festive completion moments | one-shot, low particle count |
| `notification-bell.lottie` | notification feedback | one-shot |
| `completion-star.lottie` | wishlist / gift ready | one-shot |

Missing files are fine: the static fallback is shown and the runtime is never downloaded.
Under «Уменьшить движение» the static fallback is always used.
