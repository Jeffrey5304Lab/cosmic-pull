import { describe, expect, it } from 'vitest'
import { computeStars } from './logic.ts'
import { GameSim } from './sim.ts'
import { LEVELS } from './levels.ts'
import { PHYS } from './config.ts'

/** Replay a level's intended solution and return the resulting pulls + waste. */
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

describe('computeStars', () => {
  it('awards the intended solution a full 3★ on every level', () => {
    // If this fails, a level or the physics changed the solution's spill —
    // update REF_WASTE in logic.ts to the new measured `wasted`.
    for (const lv of LEVELS) {
      const { pulls, wasted, status } = playSolution(lv)
      expect(status, `L${lv.id} solution should win`).toBe('won')
      expect(computeStars(lv, pulls, wasted), `L${lv.id} solution stars (pulls=${pulls} wasted=${wasted})`).toBe(3)
    }
  })

  it('demotes on the pull axis (over-pulling costs stars)', () => {
    for (const lv of LEVELS) {
      const { wasted } = playSolution(lv)
      const par = lv.stars?.pulls?.[0] ?? lv.solution!.length
      const tidy = computeStars(lv, par, wasted)
      const sloppy = computeStars(lv, par + 5, wasted)
      expect(sloppy, `L${lv.id} many extra pulls should not beat a tight solve`).toBeLessThanOrEqual(tidy)
    }
  })

  it('is non-increasing as you waste more stardust', () => {
    for (const lv of LEVELS) {
      const par = lv.stars?.pulls?.[0] ?? lv.solution!.length
      let prev = 3
      for (let w = 0; w <= 60; w += 3) {
        const s = computeStars(lv, par, w)
        expect(s, `L${lv.id} stars rose when wasting more (w=${w})`).toBeLessThanOrEqual(prev)
        prev = s
      }
    }
  })

  it('demotes a clean-pour level when you spill instead', () => {
    // L1 pours with zero intended waste and has a fat buffer — spilling most of
    // it must cost stars, proving the tidiness axis actually bites.
    const l1 = LEVELS[0]
    expect(computeStars(l1, 1, 0)).toBe(3)
    expect(computeStars(l1, 1, 11)).toBeLessThan(3)
  })

  it('never returns a rating outside 1–3', () => {
    for (const lv of LEVELS) {
      for (const pulls of [0, 1, 5, 20]) {
        for (const wasted of [0, 5, 50]) {
          const s = computeStars(lv, pulls, wasted)
          expect(s).toBeGreaterThanOrEqual(1)
          expect(s).toBeLessThanOrEqual(3)
        }
      }
    }
  })
})
