# Rive assets

Put real `.riv` files exported from the Rive editor here. The file name is the key
used in code (`src/animation/assets.ts`):

| File | Used on | Expected state machine / inputs |
| --- | --- | --- |
| `gift-ai-robot.riv` | 12 Gift AI (robot) | state machine `Robot`, boolean input `thinking` (true while a request runs) |
| `gift-reveal.riv` | 10 Recipient reveal (optional upgrade of the Motion sequence) | state machine `Reveal`, trigger `open` |

Until a file exists, the screen shows its static 3D render and the Rive runtime is not loaded.
Keep each file small (ideally < 150 KB), no embedded fonts, and match the art direction of
the 3D renders in `src/assets/3d`.
