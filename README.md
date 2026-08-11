# Cosmic Pull ✦

A cozy, hand-drawn **pull-the-pin** physics puzzle. Tap the wooden pins, let the
glowing stardust pour, and fill every cup — while dodging lava and drifting voids.

Sister game to [Cosmic Merge](https://github.com/jeffrey5304lab/cosmic-merge);
same warm illustrated universe, built on the same proven stack.

## Play

- **Web:** `npm run dev` → open the printed URL.
- One thumb: tap a pin to pull it. Fill all cups to clear the level. Fewer pulls = more stars.

## Stack

- **TypeScript + Vite + Canvas 2D** — no framework, tiny bundle.
- **matter-js** physics, built at 6× scale internally to avoid small-body tunnelling.
- **Capacitor 7** wraps the web build into native iOS / Android.
- **vitest** — every level ships a designer "solution" that a headless sim replays
  to guarantee it is beatable (`src/sim.solve.test.ts`).

## Architecture

| File | Role |
| --- | --- |
| `src/sim.ts` | DOM-free physics simulation (the source of truth). Runs identically in the browser and in tests. |
| `src/levels.ts` | Hand-authored levels in WORLD units (100×150). |
| `src/render.ts` | Hand-drawn Canvas renderer (ink, wood, glow). |
| `src/particles.ts` | Juice: chips, sparkles, embers, star fountain. |
| `src/main.ts` | Loop, input, overlays, audio/haptics glue. |
| `src/logic.ts` | Star rating. |
| `src/storage.ts` | Local progress (no network). |

## Scripts

```bash
npm run dev              # local dev server
npm run build            # typecheck + production build → dist/
npm test                 # vitest (solvability + data integrity)
npm run cap:ios          # build + open Xcode (test ads / dev)
npm run cap:ios:release  # release build (live ad IDs, when configured)
```

## Privacy

v1.0 collects **nothing** — progress is stored locally, no accounts, no analytics,
no ads, no network. See `public/privacy.html` (hosted on GitHub Pages for the
App Store privacy-policy URL).

## License

See [LICENSE](LICENSE).
