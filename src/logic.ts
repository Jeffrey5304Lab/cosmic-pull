import type { LevelDef } from './types.ts'

/**
 * Star rating for a cleared level, from how many pulls it took.
 * 3 stars = solved as tightly as the designer intended.
 */
export function computeStars(level: LevelDef, pulls: number): number {
  const rule = level.stars?.pulls
  if (rule) {
    if (pulls <= rule[0]) return 3
    if (pulls <= rule[1]) return 2
    return 1
  }
  // Fallback: the intended solution length is the 3-star bar.
  const par = level.solution?.length ?? level.pins.length
  if (pulls <= par) return 3
  if (pulls <= par + 1) return 2
  return 1
}
