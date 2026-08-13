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
- **F1. Soft-lock / stuck feedback.** Partial pulls strand grains → sim hangs in
  `playing` forever (hit 10/19 levels in an adversarial probe). Detect a
  quiescent, un-progressable board (all grains at rest via *displacement*
  tracking — robust to jitter — AND no unpulled pin still holding grains) and
  surface a gentle "no flow left — tap ↻" retry cue. **No hard auto-loss** (cozy:
  never false-fail a thinking player). See [[softlock-partial-pull]].
- **F2. Calm settle (damping).** Grains jitter (speed spikes ~7.5 while
  "resting"). Add small `frictionAir` so piles go truly still → cozier pour, less
  micro-leak, cleaner rest. Re-verify all solvability timings stay green.
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

## Findings from the first execution spike (2026-08-14)
Landed the F1 **scaffolding** in `sim.ts` (all 46 tests still green, nothing
wired to UI yet):
- `trackQuiescence()` — jitter-robust stillness via net displacement from each
  grain's rest anchor (`REST_EPS`, `STUCK_HOLD_MS`, `Grain.ax/ay`).
- `get stuck` — quiescent + cups unfilled + no *blocker* pin still holding grains
  (bridges don't count; pulling one dumps rather than frees). Non-mutating, so it
  can only ever drive a gentle hint, never a false loss.

**What we learned (important for whoever continues):**
1. The `stuck` getter currently catches only ~1/10 probe soft-locks. Root cause:
   **without damping the piles never truly go still** — they micro-creep past
   `REST_EPS`, so `quietMs` keeps resetting and the board is never "quiescent".
   So **F2 (damping) is a prerequisite for F1**, not a parallel task.
2. But a naive `frictionAir: 0.02` on grains **breaks solvability** (4 solve
   tests fail) and creates *more* dead-ends — grains stall mid-slope. Damping
   must be tuned jointly with slope angles / gravity, and re-verified against the
   whole solve+robustness suite. Reverted for now.
3. Zero false positives on intended solutions is the hard constraint that held
   throughout — keep it.

**Recommended next approach:** treat F1+F2 as one tuning loop. Options to try:
raise `REST_EPS` a touch and/or add a *very* small `frictionAir` (~0.005–0.01)
only after confirming every `sim.solve` test stays green; or re-anchor
quiescence on a longer window. Then wire `sim.stuck` in `main.ts` to a gentle
"無法再流動了 — 點 ↻ 重試" toast (no auto-loss). Add a regression test that
asserts high catch-rate on the random-subset probe AND zero false-stuck on
solutions.

## Status
- [x] Health-check + direction (this doc)
- [~] F1 stuck feedback — scaffolding landed (sim.ts), NOT effective until F2
- [ ] F2 damping / calm settle — prerequisite for F1; needs joint tuning
- [ ] F3 supply fairness pass
- [ ] F4 telegraph bridges
- [ ] Ch.1 recut (cozy) · Ch.2 · Ch.3 + mechanics 1→2→3
