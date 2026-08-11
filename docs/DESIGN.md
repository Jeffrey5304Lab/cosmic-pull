# Cosmic Pull — Level Design Notes

The vocabulary the levels are built from, so new levels stay fair, legible and
sim-verifiable.

## The core idea
Pins have **two roles the player must tell apart**:

- **Blocker** — a (near-)horizontal pin holding a pile of stardust. Pull it to
  release the flow. High friction so the resting pile never leaks.
- **Bridge** — a slanted pin acting as a ramp/ledge that routes stardust safely
  past a hazard. **Pulling a bridge dumps that stream into the lava/void.** Low
  friction so grains slide instead of jamming.

Because supply is **just enough**, wasting a stream to a hazard makes the level
unwinnable. That "which pins are bridges?" read is the puzzle.

## Rules of thumb
- **Just-enough supply:** `sum(emitter.count) ≈ sum(cup.need) + a small buffer`.
  Too much supply → no failure, no puzzle. Too little → luck.
- **Every level ships a `solution`** (intended pull order). `sim.solve.test.ts`
  replays it and must reach `won`.
- **Trap pins** go in `traps: [...]`. `traps.test.ts` proves pulling one loses.
- **Contain the starting pile:** blocker `len` ≥ emitter `w`, keep piles short &
  wide (increase emitter `w`, small `h`) so they don't topple and leak.
- Don't rely on grains sliding a **long** shallow ramp — they clog. Keep bridges
  reasonably steep (|angle| ≈ 0.5–0.65) and the drop-off near the cup.
- Colour cups: challenge is the colour gate, so give comfortable supply (a leak
  shouldn't fail you).

## Difficulty ramp (target)
- **1–4** teach blocker vs bridge (L3 "Don't Pull the Bridge", L4 "Which Ones?").
- **5–6** order + colour.
- **7–12** add moving hazards / timing; bridges reappear (L11).
- **13–20** combine everything.

## Coordinates
World is `100 × 150`, y points down (see `WORLD` in `config.ts`). The physics
runs at 6× internally; you never see that in level data.

## Authoring loop
1. Add the level with a `solution` (and `traps` if any).
2. `npm test` — solvability, teeth, and player-robustness must stay green.
3. If it fails, probe with a throwaway test that logs cup fills over time.
4. Eyeball geometry in `docs/level-previews.svg`
   (`npx vitest run scripts/gen-preview`), then playtest `npm run dev`.
