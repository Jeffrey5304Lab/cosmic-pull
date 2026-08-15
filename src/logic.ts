import type { LevelDef } from './types.ts'

/**
 * Star rating for a cleared level — **pulls only**.
 *
 * Cosmic Pull's direction is cozy-juice (80%) with a few clever spikes (20%);
 * see docs/GAME-DIRECTION.md. Under that direction we deliberately DON'T punish
 * spilled stardust: overflow is reframed as a *reward* (it becomes ✦ stardust
 * currency, shown as a "+N" pop), so grading the same spill as a star penalty
 * would be contradictory. Mastery is chased purely on the pull axis — tight on
 * the marked spike levels (via `stars.pulls`), forgiving everywhere else.
 *
 * The `wasted` grain count still lives on the sim (drives the currency pop and
 * the solvability tests); it just no longer feeds the star rating.
 */
export function computeStars(level: LevelDef, pulls: number): number {
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

/**
 * ✦ Stardust currency earned for clearing a level (the meta backbone — see
 * docs/GAME-DIRECTION.md §3.4). Cozy framing: "the extra you scooped is bonus,"
 * so OVERFLOW (grains collected past a cup's need) pays out directly, plus a
 * small mastery bonus for a tidy star rating. Never negative — spilling is
 * never a punishment here.
 */
export function earnedStardust(overflow: number, stars: number): number {
  const starBonus = stars >= 3 ? 5 : stars >= 2 ? 2 : 0
  return Math.max(0, Math.round(overflow)) + starBonus
}

/**
 * ✦ for showing up today. A daily reason to return was the one retention lever
 * the game had none of. Streak-based so coming back tomorrow is worth more than
 * today, capped at day 7 so it never becomes a grind you can fall "behind" on
 * (cozy: missing a day costs you the streak, never your progress).
 */
export function dailyReward(streakDay: number): number {
  const day = Math.min(7, Math.max(1, Math.round(streakDay)))
  return 5 + day * 5 // day1 = 10 … day7 = 40
}

/** Days between two YYYY-MM-DD stamps (local dates, no timezone math needed). */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(from + 'T00:00:00')
  const b = Date.parse(to + 'T00:00:00')
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.NaN
  return Math.round((b - a) / 86400000)
}

/** Local calendar date as YYYY-MM-DD (what "a day" means to the player). */
export function today(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
