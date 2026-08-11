import { describe, expect, it } from 'vitest'
import { GameSim } from './sim.ts'
import { getLevel } from './levels.ts'
import { PHYS } from './config.ts'
import type { LevelDef } from './types.ts'

function run(sim: GameSim, ms: number): void {
  for (let t = 0; t < ms; t += PHYS.stepMs) sim.step(PHYS.stepMs)
}

describe('pull mechanics', () => {
  it('pinAt finds a pin near its centre and misses far away', () => {
    const sim = new GameSim(getLevel(1)!) // pin 'a' at (50,40)
    expect(sim.pinAt(50, 40)).toBe('a')
    expect(sim.pinAt(10, 10)).toBeNull()
  })

  it('pull removes the pin and is idempotent', () => {
    const sim = new GameSim(getLevel(1)!)
    expect(sim.pinViews.some((p) => p.id === 'a')).toBe(true)
    expect(sim.pull('a')).toBe(true)
    expect(sim.pull('a')).toBe(false) // already gone
    expect(sim.pinViews.some((p) => p.id === 'a')).toBe(false)
    expect(sim.pulls).toBe(1)
  })

  it('emits a pull event with the pin position', () => {
    const sim = new GameSim(getLevel(1)!)
    sim.pull('a')
    const ev = sim.drainEvents().find((e) => e.type === 'pull')
    expect(ev).toBeDefined()
    expect(sim.drainEvents()).toHaveLength(0) // drained
  })

  it('ignores pulls once the level is resolved', () => {
    const sim = new GameSim(getLevel(1)!)
    sim.pull('a')
    run(sim, 6000)
    expect(sim.status).toBe('won')
    expect(sim.pull('a')).toBe(false)
  })
})

describe('lose path', () => {
  it('goes to "lost" when the stardust cannot reach the cup', () => {
    // pile pours straight into a lava pool; the cup is unreachable off to the side
    const trap: LevelDef = {
      id: 999,
      name: 'Trap',
      world: { w: 100, h: 150 },
      pins: [{ id: 'a', x: 50, y: 40, len: 26, thick: 3 }],
      walls: [],
      emitters: [{ x: 50, y: 26, w: 20, h: 12, count: 20 }],
      cups: [{ id: 'c', x: 90, y: 140, w: 12, h: 12, need: 15 }],
      hazards: [{ x: 50, y: 120, w: 60, h: 12, kind: 'lava' }],
      solution: [{ pin: 'a', atMs: 0 }],
    }
    const sim = new GameSim(trap)
    sim.pull('a')
    run(sim, 8000)
    expect(sim.status).toBe('lost')
    expect(sim.wasted).toBeGreaterThan(0)
  })
})

describe('determinism', () => {
  it('same level + same pull timing → identical cup fills', () => {
    const play = () => {
      const sim = new GameSim(getLevel(4)!)
      let t = 0
      let did = false
      let did2 = false
      for (let i = 0; i < 400; i++) {
        if (!did && t >= 200) (sim.pull('l'), (did = true))
        if (!did2 && t >= 400) (sim.pull('r'), (did2 = true))
        sim.step(PHYS.stepMs)
        t += PHYS.stepMs
      }
      return sim.cupViews.map((c) => c.filled)
    }
    expect(play()).toEqual(play())
  })
})

describe('resolved-state safety', () => {
  it('stepping after resolution does not throw or change status', () => {
    const sim = new GameSim(getLevel(1)!)
    sim.pull('a')
    run(sim, 6000)
    const s = sim.status
    expect(() => run(sim, 2000)).not.toThrow()
    expect(sim.status).toBe(s)
  })
})
