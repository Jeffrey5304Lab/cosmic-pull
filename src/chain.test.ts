import { describe, expect, it } from 'vitest'
import { GameSim } from './sim.ts'
import { PHYS } from './config.ts'
import type { LevelDef } from './types.ts'

const step = (s: GameSim, ms: number): void => {
  for (let t = 0; t < ms; t += PHYS.stepMs) s.step(PHYS.stepMs)
}

/** Minimal two-pin board: pulling `trigger` chains a release of `follower`. */
function chainLevel(): LevelDef {
  return {
    id: 999,
    name: 'Chain probe',
    world: { w: 100, h: 150 },
    pins: [
      { id: 'trigger', x: 30, y: 40, len: 24, thick: 3, releases: ['follower'] },
      { id: 'follower', x: 70, y: 40, len: 24, thick: 3 },
    ],
    walls: [],
    emitters: [{ x: 70, y: 26, w: 18, h: 10, count: 12 }],
    cups: [{ id: 'c', x: 70, y: 124, w: 24, h: 20, need: 6 }],
    hazards: [],
  }
}

describe('chain pins', () => {
  it('pulling a chain pin auto-removes its followers after a beat', () => {
    const sim = new GameSim(chainLevel())
    const ids = () => sim.pinViews.map((p) => p.id)
    expect(ids()).toEqual(['trigger', 'follower'])

    sim.pull('trigger')
    // follower is still present the instant the trigger is pulled...
    expect(ids()).toContain('follower')
    // ...and gone once the chain beat elapses.
    step(sim, 400)
    expect(ids()).not.toContain('follower')
  })

  it('chained releases do not count as player pulls', () => {
    const sim = new GameSim(chainLevel())
    sim.pull('trigger')
    step(sim, 400)
    expect(sim.pulls).toBe(1) // the follower popped automatically
  })

  it('if the player pulls the follower first, the scheduled release is a no-op', () => {
    const sim = new GameSim(chainLevel())
    sim.pull('follower')
    sim.pull('trigger')
    step(sim, 400)
    expect(sim.pulls).toBe(2)
    expect(sim.status).not.toBe('lost') // no crash / double-remove
  })
})
