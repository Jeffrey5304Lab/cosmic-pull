import { describe, expect, it } from 'vitest'
import { computeStars, earnedStardust } from './logic.ts'
import { GameSim } from './sim.ts'
import { LEVELS } from './levels.ts'
import { PHYS } from './config.ts'

/** Replay a level's intended solution and return the resulting pulls + status. */
function playSolution(level: (typeof LEVELS)[number]): { pulls: number; wasted: number; status: string } {
  const sim = new GameSim(level)
  const sol = [...level.solution!].sort((a, b) => a.atMs - b.atMs)
  let t = 0
  let i = 0
  for (let k = 0; k < 900 && sim.status === 'playing'; k++) {
    while (i < sol.length && sol[i].atMs <= t) {
      sim.pull(sol[i].pin)
      i++
    }
    sim.step(PHYS.stepMs)
    t += PHYS.stepMs
  }
  return { pulls: sim.pulls, wasted: sim.wasted, status: sim.status }
}

describe('computeStars (pulls-only)', () => {
  it('awards the intended solution a full 3★ on every level', () => {
    // If this fails, a level's solution now pulls more than its 3★ budget —
    // fix the level's `stars.pulls` / `solution`, not this test.
    for (const lv of LEVELS) {
      const { pulls, status } = playSolution(lv)
      expect(status, `L${lv.id} solution should win`).toBe('won')
      expect(computeStars(lv, pulls), `L${lv.id} solution stars (pulls=${pulls})`).toBe(3)
    }
  })

  it('demotes on the pull axis (over-pulling costs stars)', () => {
    for (const lv of LEVELS) {
      const par = lv.stars?.pulls?.[0] ?? lv.solution!.length
      const tidy = computeStars(lv, par)
      const sloppy = computeStars(lv, par + 5)
      expect(sloppy, `L${lv.id} many extra pulls should not beat a tight solve`).toBeLessThanOrEqual(tidy)
    }
  })

  it('is non-increasing as you pull more', () => {
    for (const lv of LEVELS) {
      let prev = 3
      for (let p = 0; p <= 20; p++) {
        const s = computeStars(lv, p)
        expect(s, `L${lv.id} stars rose when pulling more (pulls=${p})`).toBeLessThanOrEqual(prev)
        prev = s
      }
    }
  })

  it('ignores wasted stardust — spilling is a reward, not a penalty', () => {
    // Cozy direction: overflow becomes ✦ currency, so it must NOT demote stars.
    // Same pull count → same rating no matter how much was spilled.
    const l1 = LEVELS[0]
    expect(computeStars(l1, 1)).toBe(3)
    // computeStars takes no waste arg at all now; a tidy 1-pull solve stays 3★.
    expect(computeStars(l1, 1)).toBe(3)
  })

  it('never returns a rating outside 1–3', () => {
    for (const lv of LEVELS) {
      for (const pulls of [0, 1, 5, 20]) {
        const s = computeStars(lv, pulls)
        expect(s).toBeGreaterThanOrEqual(1)
        expect(s).toBeLessThanOrEqual(3)
      }
    }
  })
})

describe('earnedStardust (✦ currency)', () => {
  it('pays out overflow plus a mastery bonus, never negative', () => {
    expect(earnedStardust(0, 1)).toBe(0) // scraped by, no overflow, no bonus
    expect(earnedStardust(0, 2)).toBe(2) // 2★ bonus
    expect(earnedStardust(0, 3)).toBe(5) // 3★ bonus
    expect(earnedStardust(7, 3)).toBe(12) // 7 overflow + 5 bonus
    expect(earnedStardust(-4, 1)).toBe(0) // spilling is never a debt
  })

  it('is monotonic in overflow', () => {
    let prev = -1
    for (let o = 0; o <= 20; o++) {
      const v = earnedStardust(o, 3)
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
  })
})
