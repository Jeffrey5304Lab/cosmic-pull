# Cosmic Pull — Redesign Plan (Fable 5 pass, 2026-08-14)

> Health-check + redesign driven after playtesting. Direction chosen by the user:
> **cozy feel × genuinely fun logic × complex late-game puzzles.**
> Front/mid game should relax and forgive; the back half should be a real
> brain-box. Failure only on true dead-ends — stars reward mastery.

## The one design pivot
The whole game was built on **"just-enough" supply → wrong pull = instant
unrecoverable loss.** That single choice is the root of every recurring bug
(stardust leaks, spillage blocking a win, soft-locks) and makes the game feel
like a *gotcha*, not a *puzzle*. We split difficulty across the arc instead:

- **Forgiving to CLEAR** — comfortable supply + only true dead-ends fail you.
- **Tight to 3-STAR** — pull count / leftover stardust decides 1–3★.
- **Complex, not cruel** — late levels are hard because they're *deep*
  (multi-step, systemic), never because they hid which pin was a trap.

## Difficulty arc (target ~24 levels, 3 chapters)
- **Ch.1 "Pour" (1–8) — cozy.** One idea at a time: pull → funnel → hazard →
  order → colour. Generous supply. Almost unlosable. Teach the *feel*.
- **Ch.2 "Route" (9–16) — clever.** Combine two ideas. Colour routing, moving
  hazards, chain pins. Supply comfortable; 3★ needs a clean line.
- **Ch.3 "Machine" (17–24) — complex.** Systemic contraptions: portals, gates,
  seesaws, gravity wells. Multi-step solutions. This is the "後面複雜解謎".

## Mechanic roadmap (the "很有趣" toolbox)
Cozy-readable but deep. Recommended build order in **bold**.
1. **Chain pins (連鎖栓)** — pulling one auto-releases another after a beat →
   sequencing puzzles. *Cheap, high fun.*
2. **Gate on fill (填滿開閘)** — fill cup A ⇒ a barrier lifts for cup B →
   multi-step dependency. *The backbone of Ch.3.*
3. **Wormhole portal (蟲洞)** — teleport stardust A→B. Ties into the Cosmic
   universe, very shareable, enables non-local routing. *Signature mechanic.*
4. Seesaw / pivot (翹翹板) — a pin on a pivot that tips under stardust weight →
   emergent, dynamic routing.
5. Gravity well (重力井) — reuse the black-hole art as an *attractor* that bends
   the stream (not only a hazard). Grand-finale set-piece (L20 already roams a
   black hole).
6. Colour prism/splitter — sort a mixed stream into colour cups.

Ship **1→2→3** first; 4–6 are stretch set-pieces.

## Foundation fixes (P0 — do first, under any design)
Everything above needs a clean, fair core. In priority order:
- **F1. Soft-lock / stuck feedback.** ✅ DONE (see Findings below). Frozen
  boards (no pull can move any grain) are now detected by `sim.stuck`; wire it
  to a gentle "no flow left — tap ↻" cue in main.ts. **No hard auto-loss** (cozy:
  never false-fail a thinking player).
- **F2. Calm settle.** ✅ DONE via `enableSleeping` (not damping — see Findings).
- **F3. Fairness pass on supply.** Re-tune emitters to a comfortable buffer so
  scatter never causes an unfair loss; move the challenge into the star rule.
- **F4. Telegraph bridges vs blockers.** Distinct look (not just angle) so a
  wrong pull is a *choice*, never a *trap you couldn't see*.

## UI/UX review (from reading index.html + style.css, 2026-08-14)
NOTE: grounded in the actual markup/CSS, but NOT yet verified rendered on a
device (browser extension was offline) — re-check spacing/canvas letterboxing
live. Good already: safe-area insets + `dvh`, `aria-label`s, strong ink/paper
contrast, tactile button press, branded title screen, Cosmic Merge cross-promo.
Fix list (severity):
- **[med] Menu card overflows.** `.card` has no `max-height`/`overflow-y`. Fine
  at 19 levels; the 24-level redesign will push the Close button off-screen on
  small phones. Add `max-height: 88dvh; overflow-y: auto` (+ keep Close reachable).
- **[med] Level name can break the HUD.** `.hud-center` lacks `nowrap`/ellipsis;
  long names ("13. Twin Keystones") wrap or shove the icon buttons on narrow
  screens. Add `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`.
- **[low] Touch targets small.** `.icon-btn` is 40×40; bump to 44 (Apple HIG).
- **[low] Lose copy mismatches.** "Out of stardust…" doesn't fit stranded/stuck
  failures; under the cozy direction make it gentler/encouraging + accurate.
- **[low] Language split.** UI is EN, hints are zh-TW — pick a locale strategy
  (or ship bilingual) before submission.
- **[low] No 3★ target shown.** HUD shows "N pulls" but not the budget for 3★.
- **[nit] Restart ↻ sits next to Sound ♪** — easy misfire that resets the level.

## Polish (P3)
- Show the 3★ pull target during play.
- Language: pick a locale strategy (UI is EN, hints are zh-TW today).
- More juice on portals/gates when they trigger.

## Guardrails
- Keep the 46-test suite green at every step; add regression tests for F1/F2.
- Each new mechanic ships with a `solution` + `traps` and passes the solvability
  + robustness + stuck tests.
- Commit per phase. This file is the resume point (see PLAN.md convention).

## Findings — F1+F2 landed after a re-audit (2026-08-14)
The first spike's diagnosis was **wrong in two ways**; a second pass with
ground-truth probing corrected it. Final state (all 50 tests green):

1. **The "10/19 levels soft-lock" claim was overstated.** Ground truth (pull
   every remaining pin from each "hung" probe state): 11/12 of those states
   still had a pin holding grains — the player had real moves left, and 8 even
   went on to WIN. Those are normal mid-game states, not dead ends. Truly
   frozen boards are rare (≈1 per probe sweep) but real.
2. **`enableSleeping: true` beats damping.** `frictionAir` broke solvability;
   sleeping freezes resting piles completely (no jitter/creep), costs nothing,
   and broke zero tests. Gotcha handled: matter-js does NOT wake sleeping
   bodies when their static support is removed — `pull()` wakes all grains.
3. **Bridges can be winning moves.** An earlier draft treated only blocker pins
   as "board still has options"; L4 disproved it (pulling a bridge dropped the
   stranded pile into the cup → win). Final `stuck` semantics: fire only when
   **no un-pulled pin touches any grain** — then provably no pull can move
   anything. Validated: never fires when the rest of the pins could still win,
   and never fires along any intended solution (`src/stuck.test.ts`).
4. `sim.stuck` is non-mutating — UI may show a gentle retry cue, never a loss.

**Remaining wiring:** surface `sim.stuck` in `main.ts` as a soft toast
("星塵流不動了 — 點 ↻ 再試一次") after a short grace, styled like `.hint`.

**Star-rule gap (new, important):** under cozy/comfortable supply the current
`computeStars` (pulls-only) collapses — par is trivially met. 3★ must also
require leftover stardust (e.g. `wasted ≤ X`) or a time component. Do this with
F3.

## Status
- [x] Health-check + direction (this doc)
- [x] F1 stuck detection — `sim.stuck` + regression suite (`stuck.test.ts`)
- [x] F1-UI — gentle "board stuck" toast + restart nudge in main.ts (no auto-loss)
- [x] F2 calm settle — `enableSleeping` + wake-on-pull
- [x] F3 star-rule rework — dual-axis (pulls AND waste vs solution), `logic.test.ts`
- [x] F4 telegraph bridges — reworked to sheen + drifting motes (screenshot-verified)
- [x] UX polish — reduce-motion a11y, menu scroll, HUD truncation, 44pt targets, lose card
- [x] Mechanic 1 — **chain pins** (`PinDef.releases`) + `chain.test.ts`
- [x] Mechanic 2 — **gate-on-fill** (`WallDef.gate`) + `gate.test.ts`
- [ ] Mechanic 3 — **wormhole portal** (teleport grains A→B) — not started
- [ ] Author real levels using chain/gate + the cozy→complex 3-chapter recut
- [ ] F3b supply fairness: buffers already generous (recent fixes); revisit per level with playtest
- [x] Polish: 3★ target in HUD  ·  [ ] locale decision (EN UI vs zh-TW hints)
- [x] Headless screenshot harness (playwright, npm run shot) + visual pass done

## Playtest findings + visual pass (2026-08-14, screenshot-verified)
Simulated players (see the throwaway harnesses in git history) measured:
- **Random "monkey" pulls beat 75.6% of the game**; 13/20 levels 100%.
- **8 of 20 levels have exactly ONE pin** → zero decision. L20 "Grand Finale"
  was a single tap.
- **94% of casual wins earned 3★** → no mastery chase, no replay drive.
- **"Timing" levels have no timing**: L8/L20 won at 13/13 tested pull moments.
- The 5 trap levels (L3, L4, L11, L13, L18) are the *good* ones (0–16% monkey) —
  the bridge/blocker read works, it's just deployed in only a quarter of the game.

**Proven fix pattern:** convert load-bearing scenery into trap PINS. Applied to
L20 (100% → **8%** monkey) and L7. ⚠️ It does NOT generalise: on L8 the funnel
walls are obstacles, not supports (pulling one lets *more* stardust through) —
that level needs real geometry work. Check with the sim before relabelling.

**Visual pass done** (all verified via `npm run shot`, not guessed): hint toast
no longer covers the cup on L1 (it did — the new player couldn't see the goal);
cup rebuilt as a real vessel with halo/rim/shadow; goal number is a hand-drawn
paper chip; bridge telegraph reworked (the blind chevrons read as scratches);
coach arrow and walls warmed to match the palette; lava no longer reads as a
sausage. HUD now shows the 3★ pull budget; Restart moved away from Sound.

**Still open:** the remaining one-pin levels (L8, L9, L14, L19), the empty-board
composition problem, the L5–L9 difficulty dead zone, locale decision, and
authoring levels that actually use chain pins / gates.

### What NOT to trust without a human playtest
- F4 chevron **appearance** (rendered blind).
- F3 star **tolerances** (`tol3`/`tol2` in logic.ts) — mechanism proven, feel untuned.
- The new mechanics' **fun** — engine + solvability proven, no level authored yet.
