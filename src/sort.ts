/**
 * Star Sort — the deterministic core (see docs/REBOOT-PLAN.md).
 *
 * Water-Sort rules: bottles are stacks of coloured stardust units. A pour moves
 * the top run of one colour onto a bottle whose top matches (or is empty), as
 * many units as fit. Win when every bottle is empty or full of a single colour.
 *
 * Everything here is integer logic — zero physics, zero randomness, 100%
 * deterministic and unit-testable. That determinism IS the puzzle feel.
 */

/** A bottle: colour indices, bottom → top. */
export type Bottle = number[]

export interface Move {
  from: number
  to: number
  /** units actually moved (needed for undo) */
  count: number
}

/** The colour and length of the run sitting on top of a bottle. */
export function topRun(b: Bottle): { color: number; count: number } | null {
  if (b.length === 0) return null
  const color = b[b.length - 1]
  let count = 1
  for (let i = b.length - 2; i >= 0 && b[i] === color; i--) count++
  return { color, count }
}

/** Is this bottle finished — full of one colour? */
export function isComplete(b: Bottle, capacity: number): boolean {
  return b.length === capacity && b.every((c) => c === b[0])
}

/** May the player pour from → to? (Pouring OUT of a finished bottle is never allowed.) */
export function canPour(bottles: Bottle[], capacity: number, from: number, to: number): boolean {
  if (from === to) return false
  const a = bottles[from]
  const b = bottles[to]
  if (!a || !b) return false
  if (a.length === 0 || b.length >= capacity) return false
  if (isComplete(a, capacity)) return false
  const run = topRun(a)!
  return b.length === 0 || b[b.length - 1] === run.color
}

/**
 * Apply a pour, mutating `bottles`. Returns the Move performed (for undo/replay)
 * or null if illegal. Moves min(run length, free space) units.
 */
export function pour(bottles: Bottle[], capacity: number, from: number, to: number): Move | null {
  if (!canPour(bottles, capacity, from, to)) return null
  const a = bottles[from]
  const b = bottles[to]
  const run = topRun(a)!
  const count = Math.min(run.count, capacity - b.length)
  for (let i = 0; i < count; i++) b.push(a.pop()!)
  return { from, to, count }
}

/** Reverse a Move exactly (for undo). */
export function unpour(bottles: Bottle[], mv: Move): void {
  const b = bottles[mv.to]
  const a = bottles[mv.from]
  for (let i = 0; i < mv.count; i++) a.push(b.pop()!)
}

/** Solved ⇔ every bottle is empty or complete. */
export function isWon(bottles: Bottle[], capacity: number): boolean {
  return bottles.every((b) => b.length === 0 || isComplete(b, capacity))
}

/** Any legal pour available? (If not and not won, the player must undo/restart.) */
export function anyMove(bottles: Bottle[], capacity: number): boolean {
  for (let i = 0; i < bottles.length; i++)
    for (let j = 0; j < bottles.length; j++) if (canPour(bottles, capacity, i, j)) return true
  return false
}

/** Deep-copy bottles. */
export function cloneBottles(bottles: Bottle[]): Bottle[] {
  return bottles.map((b) => [...b])
}

/**
 * A playable game: initial state + move history (undo/redo-free restart).
 * The UI drives this; the solver works on raw bottles for speed.
 */
export class SortGame {
  readonly capacity: number
  readonly initial: Bottle[]
  bottles: Bottle[]
  history: Move[] = []

  constructor(initial: Bottle[], capacity = 4) {
    this.capacity = capacity
    this.initial = cloneBottles(initial)
    this.bottles = cloneBottles(initial)
  }

  pour(from: number, to: number): boolean {
    const mv = pour(this.bottles, this.capacity, from, to)
    if (!mv) return false
    this.history.push(mv)
    return true
  }

  undo(): boolean {
    const mv = this.history.pop()
    if (!mv) return false
    unpour(this.bottles, mv)
    return true
  }

  restart(): void {
    this.bottles = cloneBottles(this.initial)
    this.history = []
  }

  get moves(): number {
    return this.history.length
  }
  get won(): boolean {
    return isWon(this.bottles, this.capacity)
  }
  get stuck(): boolean {
    return !this.won && !anyMove(this.bottles, this.capacity)
  }
}
