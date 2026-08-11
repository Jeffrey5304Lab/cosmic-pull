import { describe, expect, it } from 'vitest'
import { GameSim } from './sim.ts'
import { LEVELS } from './levels.ts'
import { PHYS } from './config.ts'

function step(sim: GameSim, ms: number): void {
  for (let t = 0; t < ms; t += PHYS.stepMs) sim.step(PHYS.stepMs)
}

/** Tests written from a real player's perspective — the ways people actually poke. */
describe('player-perspective robustness', () => {
  it('you cannot win by doing nothing — pins hold the stardust', () => {
    for (const lv of LEVELS) {
      const sim = new GameSim(lv)
      step(sim, 4000)
      expect(sim.status, `L${lv.id} should still be playing if you never pull`).toBe('playing')
      // no cup should COMPLETE on its own (a little settling is fine; a cup
      // finishing itself would mean the level solves without the player)
      for (const c of sim.cupViews) {
        expect(c.ratio, `L${lv.id} cup ${c.def.id} completed itself unaided`).toBeLessThan(1)
      }
    }
  })

  it('mashing every pin at once always resolves — never soft-locks into limbo', () => {
    for (const lv of LEVELS) {
      const sim = new GameSim(lv)
      for (const p of lv.pins) sim.pull(p.id)
      step(sim, 16000)
      expect(sim.status, `L${lv.id} left grains stuck in 'playing' after pulling everything`).not.toBe('playing')
    }
  })

  it('the intended solution never wastes so much that it is a fluke win', () => {
    for (const lv of LEVELS) {
      const sim = new GameSim(lv)
      const steps = [...lv.solution!].sort((a, b) => a.atMs - b.atMs)
      let t = 0
      let si = 0
      for (let i = 0; i < 900 && sim.status === 'playing'; i++) {
        while (si < steps.length && steps[si].atMs <= t) (sim.pull(steps[si].pin), si++)
        sim.step(PHYS.stepMs)
        t += PHYS.stepMs
      }
      expect(sim.status).toBe('won')
      // a healthy level clears with the solution well before the 15s budget
      expect(t, `L${lv.id} solution took ${(t / 1000).toFixed(1)}s — too slow/marginal`).toBeLessThan(12000)
    }
  })
})
