import { describe, expect, it } from 'vitest'
import { SortGame } from './sort.ts'
import { generateLevel, hintMove, levelParams, mulberry32, solve, starsFor } from './solver.ts'

describe('solver', () => {
  it('solved state needs 0 moves', () => {
    expect(solve([[0, 0, 0, 0], []], 4)).toMatchObject({ solvable: true, minMoves: 0 })
  })

  it('finds the known optimum on a hand-checked puzzle', () => {
    // [0011][1100] + 2 empties. Optimal is 3: pour 11→empty, 00→bottle0, 11→11.
    // (My first hand-count said 4 — the solver found the shorter line. That is
    // exactly the property we're buying: honest, provable optima.)
    const res = solve([[0, 0, 1, 1], [1, 1, 0, 0], [], []], 4)
    expect(res.solvable).toBe(true)
    expect(res.minMoves).toBe(3)
  })

  it('one-pour finish is found as exactly 1', () => {
    const res = solve([[0, 0, 0], [0], []], 4)
    expect(res.minMoves).toBe(1)
  })

  it('detects an unsolvable position', () => {
    // both bottles full, mismatched tops, no empties: no legal move exists
    const res = solve([[0, 1, 0, 1], [1, 0, 1, 0]], 4)
    expect(res.solvable).toBe(false)
  })

  it('mulberry32 is deterministic', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    for (let i = 0; i < 10; i++) expect(a()).toBe(b())
  })
})

describe('generator', () => {
  it('same level id ⇒ identical level (determinism, incl. dailies)', () => {
    const a = generateLevel(12)
    const b = generateLevel(12)
    expect(a.bottles).toEqual(b.bottles)
    expect(a.minMoves).toBe(b.minMoves)
  })

  it('every level of the 30-level curve is solvable and meets its depth floor', () => {
    for (let n = 1; n <= 30; n++) {
      const lv = generateLevel(n)
      const p = levelParams(n)
      expect(lv.minMoves, `L${n} solvable`).toBeGreaterThan(0)
      expect(lv.minMoves, `L${n} depth floor`).toBeGreaterThanOrEqual(p.minMovesFloor)
      expect(lv.bottles.length).toBe(p.colors + p.empties)
    }
  }, 120_000)

  it('difficulty rises across the curve (median min-moves per band)', () => {
    const med = (ns: number[]) => {
      const ms = ns.map((n) => generateLevel(n).minMoves).sort((x, y) => x - y)
      return ms[ms.length >> 1]
    }
    const tutorial = med([1, 2, 3, 4, 5])
    const mid = med([11, 12, 13, 14, 15])
    const late = med([26, 27, 28, 29, 30])
    expect(tutorial).toBeLessThan(mid)
    expect(mid).toBeLessThan(late)
  }, 120_000)

  it('the generated level is actually playable to a win via solver hints', () => {
    const lv = generateLevel(7)
    const g = new SortGame(lv.bottles, lv.params.capacity)
    for (let step = 0; step < lv.minMoves + 5 && !g.won; step++) {
      const h = hintMove(g.bottles, g.capacity)
      expect(h, `hint exists at step ${step}`).not.toBeNull()
      expect(g.pour(h![0], h![1])).toBe(true)
    }
    expect(g.won).toBe(true)
    expect(g.moves).toBe(lv.minMoves) // following hints IS the optimal line
  }, 60_000)
})

describe('stars', () => {
  it('honest thresholds vs the proven optimum', () => {
    expect(starsFor(20, 20)).toBe(3)
    expect(starsFor(23, 20)).toBe(3) // ≤ ceil(20×1.15)=23
    expect(starsFor(24, 20)).toBe(2)
    expect(starsFor(30, 20)).toBe(2) // ≤ 30
    expect(starsFor(31, 20)).toBe(1)
  })
})
