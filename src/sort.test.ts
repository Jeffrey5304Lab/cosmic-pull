import { describe, expect, it } from 'vitest'
import { SortGame, canPour, isWon, pour, topRun, unpour } from './sort.ts'
import type { Bottle } from './sort.ts'

const CAP = 4

describe('sort core rules', () => {
  it('topRun reads the top same-colour run', () => {
    expect(topRun([])).toBeNull()
    expect(topRun([0, 1, 1])).toEqual({ color: 1, count: 2 })
    expect(topRun([2, 2, 2, 2])).toEqual({ color: 2, count: 4 })
  })

  it('canPour: needs space, matching top (or empty target), non-empty source', () => {
    const b: Bottle[] = [[0, 1], [1], [], [2, 2, 2, 2]]
    expect(canPour(b, CAP, 0, 1)).toBe(true) // 1 onto 1
    expect(canPour(b, CAP, 0, 2)).toBe(true) // onto empty
    expect(canPour(b, CAP, 1, 0)).toBe(true) // 1 onto 1
    expect(canPour(b, CAP, 2, 0)).toBe(false) // empty source
    expect(canPour(b, CAP, 0, 0)).toBe(false) // self
    expect(canPour(b, CAP, 0, 3)).toBe(false) // full target
    expect(canPour(b, CAP, 3, 2)).toBe(false) // complete bottle is sealed
  })

  it('pour moves min(run, space) and unpour reverses exactly', () => {
    const b: Bottle[] = [[0, 1, 1, 1], [1], []]
    const mv = pour(b, CAP, 0, 1)!
    expect(mv.count).toBe(3)
    expect(b[0]).toEqual([0])
    expect(b[1]).toEqual([1, 1, 1, 1])
    unpour(b, mv)
    expect(b[0]).toEqual([0, 1, 1, 1])
    expect(b[1]).toEqual([1])
  })

  it('pour into a full bottle is rejected', () => {
    const b: Bottle[] = [[1, 1, 1], [0, 0, 0, 1]]
    expect(pour(b, CAP, 0, 1)).toBeNull()
  })

  it('partial pour when space is tight', () => {
    const b: Bottle[] = [[0, 1, 1, 1], [2, 2, 1]]
    const mv = pour(b, CAP, 0, 1)!
    expect(mv.count).toBe(1) // only one slot free
    expect(b[1]).toEqual([2, 2, 1, 1])
    expect(b[0]).toEqual([0, 1, 1])
  })

  it('isWon: all bottles empty or complete', () => {
    expect(isWon([[0, 0, 0, 0], []], CAP)).toBe(true)
    expect(isWon([[0, 0, 0], []], CAP)).toBe(false) // not full
    expect(isWon([[0, 0, 0, 1], []], CAP)).toBe(false)
  })

  it('SortGame: pour/undo/restart lifecycle', () => {
    const g = new SortGame([[0, 1], [1, 0], [], []], CAP)
    expect(g.won).toBe(false)
    expect(g.pour(0, 2)).toBe(true) // top 1 → empty
    expect(g.bottles).toEqual([[0], [1, 0], [1], []])
    expect(g.pour(1, 0)).toBe(true) // top 0 onto 0
    expect(g.bottles).toEqual([[0, 0], [1], [1], []])
    expect(g.moves).toBe(2)
    g.undo()
    g.undo()
    expect(g.bottles).toEqual([[0, 1], [1, 0], [], []])
    expect(g.moves).toBe(0)
    expect(g.undo()).toBe(false) // nothing left to undo
    g.pour(0, 2)
    g.restart()
    expect(g.bottles).toEqual([[0, 1], [1, 0], [], []])
    expect(g.moves).toBe(0)
  })

  it('a full-capacity game can actually be won', () => {
    // two colours, four units each, solvable in a few pours
    const g = new SortGame([[0, 0, 1, 1], [1, 1, 0, 0], [], []], CAP)
    g.pour(0, 2) // 11 → empty
    g.pour(1, 3) // 00 → empty
    g.pour(1, 2) // 11 → onto 11
    g.pour(0, 3) // 00 → onto 00
    expect(g.won).toBe(true)
    expect(g.moves).toBe(4)
  })

  it('stuck: no legal pour and not won', () => {
    const g = new SortGame([[0, 1, 0, 1], [1, 0, 1, 0]], CAP) // no empties, tops mismatch... top0=1, top1=0
    expect(g.stuck).toBe(true)
  })
})
