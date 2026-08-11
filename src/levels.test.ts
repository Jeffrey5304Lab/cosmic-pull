import { describe, expect, it } from 'vitest'
import { LEVELS } from './levels.ts'
import { computeStars } from './logic.ts'

/** Authoring sanity: catch typos before they reach the physics sim. */
describe('level data integrity', () => {
  it('ids are sequential from 1', () => {
    LEVELS.forEach((lv, i) => expect(lv.id).toBe(i + 1))
  })

  it('every level has cups, emitters, a solution and enough stardust', () => {
    for (const lv of LEVELS) {
      expect(lv.cups.length, `L${lv.id} cups`).toBeGreaterThan(0)
      expect(lv.emitters.length, `L${lv.id} emitters`).toBeGreaterThan(0)
      expect(lv.solution?.length, `L${lv.id} solution`).toBeGreaterThan(0)
      const supply = lv.emitters.reduce((s, e) => s + e.count, 0)
      const demand = lv.cups.reduce((s, c) => s + c.need, 0)
      expect(supply, `L${lv.id} supply≥demand`).toBeGreaterThanOrEqual(demand)
    }
  })

  it('solutions only reference existing pins', () => {
    for (const lv of LEVELS) {
      const ids = new Set(lv.pins.map((p) => p.id))
      for (const step of lv.solution ?? []) {
        expect(ids.has(step.pin), `L${lv.id} solution pin ${step.pin}`).toBe(true)
      }
    }
  })

  it('colour-locked cups have a matching-colour emitter', () => {
    for (const lv of LEVELS) {
      for (const cup of lv.cups) {
        if (!cup.color) continue
        const match = lv.emitters.some((e) => (e.color ?? 'gold') === cup.color)
        expect(match, `L${lv.id} cup ${cup.id} needs a ${cup.color} emitter`).toBe(true)
      }
    }
  })

  it('all geometry sits inside the world bounds', () => {
    for (const lv of LEVELS) {
      const items = [...lv.pins, ...lv.walls, ...lv.cups, ...lv.hazards, ...lv.emitters] as {
        x: number
        y: number
      }[]
      for (const it2 of items) {
        expect(it2.x, `L${lv.id} x`).toBeGreaterThanOrEqual(0)
        expect(it2.x, `L${lv.id} x`).toBeLessThanOrEqual(lv.world.w)
        expect(it2.y, `L${lv.id} y`).toBeGreaterThanOrEqual(0)
        expect(it2.y, `L${lv.id} y`).toBeLessThanOrEqual(lv.world.h)
      }
    }
  })
})

describe('star rating', () => {
  it('rewards the intended pull count with 3 stars and penalises extras', () => {
    for (const lv of LEVELS) {
      const par = lv.stars?.pulls?.[0] ?? lv.solution!.length
      expect(computeStars(lv, par)).toBe(3)
      expect(computeStars(lv, par + 5)).toBeLessThan(3)
    }
  })
})
