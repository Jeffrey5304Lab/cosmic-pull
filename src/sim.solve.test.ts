import { describe, expect, it } from 'vitest'
import { GameSim } from './sim.ts'
import { LEVELS } from './levels.ts'
import { PHYS } from './config.ts'

/**
 * Solvability guarantee: replay each level's designer `solution` on a fixed
 * clock and assert it reaches 'won' within a generous budget. If a level ever
 * becomes unbeatable (bad geometry, too-strict cup need), this fails loudly.
 */
describe('every level is solvable via its solution', () => {
  for (const level of LEVELS) {
    it(`level ${level.id} "${level.name}" is winnable`, () => {
      expect(level.solution, `level ${level.id} needs a solution`).toBeDefined()
      const sim = new GameSim(level)
      const solution = [...level.solution!].sort((a, b) => a.atMs - b.atMs)
      let t = 0
      const budgetMs = 14000
      let si = 0
      while (t < budgetMs && sim.status === 'playing') {
        while (si < solution.length && solution[si].atMs <= t) {
          sim.pull(solution[si].pin)
          si++
        }
        sim.step(PHYS.stepMs)
        t += PHYS.stepMs
      }
      expect(sim.status, `level ${level.id} ended '${sim.status}' after ${(t / 1000).toFixed(1)}s (wasted ${sim.wasted})`).toBe('won')
    })
  }
})
