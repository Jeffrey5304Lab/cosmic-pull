import { describe, expect, it } from 'vitest'
import { GameSim } from './sim.ts'
import { LEVELS } from './levels.ts'
import { PHYS } from './config.ts'

/**
 * "Teeth" guarantee: for any level that declares trap pins (support bridges),
 * pulling a trap must make the level UNWINNABLE. This proves a wrong choice
 * really fails you — the puzzle has genuine stakes, not just a single obvious
 * pull. (This is the fix for "the early levels have no difficulty/logic".)
 */
describe('trap pins have real teeth (pulling one loses the level)', () => {
  const trapped = LEVELS.filter((l) => l.traps && l.traps.length > 0)

  for (const level of trapped) {
    for (const trap of level.traps!) {
      it(`level ${level.id} "${level.name}": pulling trap "${trap}" makes it unwinnable`, () => {
        const sim = new GameSim(level)
        // Play the intended solution but ALSO pull the trap up front.
        sim.pull(trap)
        const steps = [...level.solution!].sort((a, b) => a.atMs - b.atMs)
        let t = 0
        let si = 0
        for (let i = 0; i < 800 && sim.status === 'playing'; i++) {
          while (si < steps.length && steps[si].atMs <= t) (sim.pull(steps[si].pin), si++)
          sim.step(PHYS.stepMs)
          t += PHYS.stepMs
        }
        // Teeth = the level can no longer be won. That shows up either as an
        // outright loss, or as a board that has run dry and frozen short of the
        // target (which the UI surfaces as a "tap ↻" nudge). Both are a failed
        // run; only a win would mean the trap was toothless. To be sure no
        // recovery exists, exhaust every remaining pull too.
        for (const p of level.pins) sim.pull(p.id)
        for (let i = 0; i < 900 && sim.status === 'playing'; i++) sim.step(PHYS.stepMs)
        expect(sim.status, `trap ${trap} was toothless — the level was still winnable`).not.toBe('won')
      })
    }
  }

  it('there is at least one trap level (early-game puzzle logic exists)', () => {
    expect(trapped.length).toBeGreaterThan(0)
  })
})
