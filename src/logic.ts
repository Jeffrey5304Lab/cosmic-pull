import type { LevelDef } from './types.ts'

/**
 * 3★ **reference waste**: how many grains each level's *intended solution*
 * spills (measured by the solvability sim). Stars are graded relative to this,
 * so a level that is designed to overflow (e.g. L14 "Clear the Shelf", whose
 * clean solution still wastes its whole buffer) can 3-star on a tidy run, while
 * a level meant to pour cleanly (waste 0) punishes any spill.
 *
 * Regenerate if levels or physics change — `logic.test.ts` replays every
 * solution and fails if a level now wastes more than its entry here.
 */
const REF_WASTE: Record<number, number> = {
  1: 0, 2: 6, 3: 6, 4: 5, 5: 15, 6: 0, 7: 2, 8: 7, 9: 10, 10: 0,
  11: 5, 12: 2, 13: 8, 14: 13, 15: 0, 16: 0, 17: 0, 18: 5, 19: 20, 20: 5,
}

/** The pull-count axis: how tightly (few pulls) the level was solved. */
function pullStars(level: LevelDef, pulls: number): number {
  const rule = level.stars?.pulls
  if (rule) {
    if (pulls <= rule[0]) return 3
    if (pulls <= rule[1]) return 2
    return 1
  }
  const par = level.solution?.length ?? level.pins.length
  if (pulls <= par) return 3
  if (pulls <= par + 1) return 2
  return 1
}

/** The tidiness axis: how little stardust you spilled versus the intended line. */
function wasteStars(level: LevelDef, wasted: number): number {
  const ref = REF_WASTE[level.id]
  if (ref === undefined) return 3 // ungraded level → don't let this axis demote
  const supply = level.emitters.reduce((s, e) => s + e.count, 0)
  const need = level.cups.reduce((s, c) => s + c.need, 0)
  const buffer = Math.max(0, supply - need)
  // Generous, cozy tolerances above the intended solution's own spill.
  const tol3 = Math.max(2, Math.round(buffer * 0.2))
  const tol2 = Math.max(5, Math.round(buffer * 0.55))
  if (wasted <= ref + tol3) return 3
  if (wasted <= ref + tol2) return 2
  return 1
}

/**
 * Star rating for a cleared level. Two axes — solve it *tightly* (few pulls)
 * AND *cleanly* (little wasted stardust) — and the lower of the two wins, so 3★
 * asks for real mastery while clearing at all stays forgiving (cozy).
 */
export function computeStars(level: LevelDef, pulls: number, wasted = 0): number {
  return Math.min(pullStars(level, pulls), wasteStars(level, wasted))
}
