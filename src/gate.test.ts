import { describe, expect, it } from 'vitest'
import { GameSim } from './sim.ts'
import { PHYS } from './config.ts'
import type { LevelDef } from './types.ts'

const step = (s: GameSim, ms: number): void => {
  for (let t = 0; t < ms; t += PHYS.stepMs) s.step(PHYS.stepMs)
}
const ratio = (s: GameSim, id: string): number => s.cupViews.find((c) => c.def.id === id)!.ratio

/**
 * Two-stream dependency board:
 *  - Left: pile held by pin `pa` above cup `a`. Pulling pa fills a.
 *  - Right: pile resting on a GATE ledge above cup `b`. The ledge (gate:'a')
 *    only opens once cup `a` is full — then the right pile drops into b.
 */
function gateLevel(): LevelDef {
  return {
    id: 998,
    name: 'Gate probe',
    world: { w: 100, h: 150 },
    pins: [{ id: 'pa', x: 25, y: 60, len: 26, thick: 3 }],
    walls: [{ x: 75, y: 82, w: 30, h: 3, gate: 'a' }],
    emitters: [
      { x: 25, y: 46, w: 20, h: 12, count: 10 },
      { x: 75, y: 68, w: 24, h: 12, count: 10 },
    ],
    cups: [
      { id: 'a', x: 25, y: 128, w: 24, h: 20, need: 6 },
      { id: 'b', x: 75, y: 128, w: 24, h: 20, need: 6 },
    ],
    hazards: [],
  }
}

describe('gate-on-fill', () => {
  it('keeps the gated stream blocked until its cup fills', () => {
    const sim = new GameSim(gateLevel())
    step(sim, 3000) // player does nothing; right pile rests on the closed gate
    expect(ratio(sim, 'a')).toBeLessThan(1)
    expect(ratio(sim, 'b'), 'cup b filled while the gate was still closed').toBeLessThan(0.5)
    expect(sim.status).toBe('playing')
  })

  it('opens once its cup fills, letting the held stream through to win', () => {
    const sim = new GameSim(gateLevel())
    sim.pull('pa') // fill cup a → gate 'a' opens → right pile drops into b
    step(sim, 8000)
    expect(ratio(sim, 'a')).toBe(1)
    expect(ratio(sim, 'b'), 'gate did not open / stream did not reach b').toBe(1)
    expect(sim.status).toBe('won')
  })
})
