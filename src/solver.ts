/**
 * Star Sort solver + level generator (docs/REBOOT-PLAN.md §3).
 *
 * A* over canonicalised states with an admissible heuristic (a pour merges at
 * most one colour run, so `runs − colours` never overestimates). This is what
 * makes difficulty PROVABLE: every level ships with its exact minimum move
 * count, and the generator rejects deals that are unsolvable or too shallow.
 */
import { type Bottle, canPour, cloneBottles, isWon, pour, topRun, unpour } from './sort.ts'

// ── canonicalisation ──────────────────────────────────────────
/** Bottle order is irrelevant to the puzzle — sort so permutations dedupe. */
function key(bottles: Bottle[]): string {
  return bottles
    .map((b) => String.fromCharCode(...b.map((c) => 65 + c)))
    .sort()
    .join('|')
}

/** Admissible lower bound: total colour runs − distinct colours present. */
function heuristic(bottles: Bottle[]): number {
  let runs = 0
  const colours = new Set<number>()
  for (const b of bottles) {
    for (let i = 0; i < b.length; i++) {
      colours.add(b[i])
      if (i === 0 || b[i] !== b[i - 1]) runs++
    }
  }
  return runs - colours.size
}

// ── tiny binary heap (f-ordered) ──────────────────────────────
interface Node {
  bottles: Bottle[]
  g: number
  f: number
}
class Heap {
  private a: Node[] = []
  get size(): number {
    return this.a.length
  }
  push(n: Node): void {
    const a = this.a
    a.push(n)
    let i = a.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (a[p].f <= a[i].f) break
      ;[a[p], a[i]] = [a[i], a[p]]
      i = p
    }
  }
  pop(): Node | undefined {
    const a = this.a
    if (a.length === 0) return undefined
    const top = a[0]
    const last = a.pop()!
    if (a.length) {
      a[0] = last
      let i = 0
      for (;;) {
        const l = i * 2 + 1
        const r = l + 1
        let m = i
        if (l < a.length && a[l].f < a[m].f) m = l
        if (r < a.length && a[r].f < a[m].f) m = r
        if (m === i) break
        ;[a[m], a[i]] = [a[i], a[m]]
        i = m
      }
    }
    return top
  }
}

export interface SolveResult {
  solvable: boolean
  /** exact minimum number of pours (present iff solvable) */
  minMoves?: number
  nodes: number
}

/** All useful pours from a state (prunes moves that provably help nothing). */
function usefulMoves(bottles: Bottle[], capacity: number): [number, number][] {
  const out: [number, number][] = []
  for (let i = 0; i < bottles.length; i++) {
    const a = bottles[i]
    if (a.length === 0) continue
    const run = topRun(a)!
    // a bottle that is one single run: moving it to an EMPTY bottle is a no-op
    const singleRun = run.count === a.length
    let emptyUsed = false // all empty bottles are interchangeable — try one per source
    for (let j = 0; j < bottles.length; j++) {
      if (!canPour(bottles, capacity, i, j)) continue
      if (bottles[j].length === 0) {
        if (singleRun || emptyUsed) continue
        emptyUsed = true
      }
      out.push([i, j])
    }
  }
  return out
}

/**
 * Exact A* solve. `maxNodes` caps the search (generator resamples on overrun —
 * treated as "unsolvable in budget", never shipped).
 */
export function solve(bottles: Bottle[], capacity = 4, maxNodes = 250_000): SolveResult {
  if (isWon(bottles, capacity)) return { solvable: true, minMoves: 0, nodes: 0 }
  const start = cloneBottles(bottles)
  const open = new Heap()
  const best = new Map<string, number>()
  open.push({ bottles: start, g: 0, f: heuristic(start) })
  best.set(key(start), 0)
  let nodes = 0
  while (open.size) {
    const cur = open.pop()!
    if (cur.g > (best.get(key(cur.bottles)) ?? Infinity)) continue // stale entry
    nodes++
    if (nodes > maxNodes) return { solvable: false, nodes }
    for (const [i, j] of usefulMoves(cur.bottles, capacity)) {
      const mv = pour(cur.bottles, capacity, i, j)!
      const g = cur.g + 1
      if (isWon(cur.bottles, capacity)) {
        unpour(cur.bottles, mv)
        return { solvable: true, minMoves: g, nodes }
      }
      const k = key(cur.bottles)
      if (g < (best.get(k) ?? Infinity)) {
        best.set(k, g)
        open.push({ bottles: cloneBottles(cur.bottles), g, f: g + heuristic(cur.bottles) })
      }
      unpour(cur.bottles, mv)
    }
  }
  return { solvable: false, nodes }
}

/** The solver's recommended next move from a live position (for the hint ad). */
export function hintMove(bottles: Bottle[], capacity = 4): [number, number] | null {
  if (isWon(bottles, capacity)) return null
  const base = solve(bottles, capacity)
  if (!base.solvable || base.minMoves === undefined) return null
  for (const [i, j] of usefulMoves(bottles, capacity)) {
    const mv = pour(bottles, capacity, i, j)!
    const after = solve(bottles, capacity)
    unpour(bottles, mv)
    if (after.solvable && (after.minMoves ?? Infinity) === base.minMoves - 1) return [i, j]
  }
  return null
}

// ── deterministic RNG (same seed ⇒ same level, incl. the daily) ──
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface LevelParams {
  colors: number
  empties: number
  capacity: number
  /** reject deals whose optimal solution is shorter than this (anti-fluke floor) */
  minMovesFloor: number
}

/** The 30-level P0 curve. L1–5 deliberately mindless (tutorial, per the user). */
export function levelParams(n: number): LevelParams {
  const c = (colors: number, floor: number): LevelParams => ({ colors, empties: 2, capacity: 4, minMovesFloor: floor })
  if (n <= 5) return c(3, 0)
  if (n <= 10) return c(4, 8)
  if (n <= 15) return c(5, 11)
  if (n <= 20) return c(6, 14)
  if (n <= 25) return c(7, 17)
  return c(8, 20)
}

export interface GeneratedLevel {
  bottles: Bottle[]
  minMoves: number
  params: LevelParams
  seed: number
}

/** Random deal: capacity× of each colour, shuffled across the colour bottles. */
function deal(p: LevelParams, rnd: () => number): Bottle[] {
  const units: number[] = []
  for (let c = 0; c < p.colors; c++) for (let k = 0; k < p.capacity; k++) units.push(c)
  for (let i = units.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[units[i], units[j]] = [units[j], units[i]]
  }
  const bottles: Bottle[] = []
  for (let b = 0; b < p.colors; b++) bottles.push(units.slice(b * p.capacity, (b + 1) * p.capacity))
  for (let e = 0; e < p.empties; e++) bottles.push([])
  return bottles
}

/**
 * Generate level #n deterministically: seeded deals, rejected until solvable,
 * not-already-won, and at least `minMovesFloor` deep. Same n ⇒ same level.
 */
export function generateLevel(n: number, seedBase = 0x5eed): GeneratedLevel {
  const p = levelParams(n)
  for (let attempt = 0; attempt < 200; attempt++) {
    const seed = (seedBase ^ (n * 0x9e3779b9) ^ (attempt * 0x85ebca6b)) >>> 0
    const bottles = deal(p, mulberry32(seed))
    if (isWon(bottles, p.capacity)) continue
    const res = solve(bottles, p.capacity)
    if (!res.solvable || res.minMoves === undefined) continue
    if (res.minMoves < p.minMovesFloor) continue
    return { bottles, minMoves: res.minMoves, params: p, seed }
  }
  throw new Error(`generateLevel(${n}): no viable deal in 200 attempts`)
}

/** Star rating vs the proven optimum: honest mastery, not a guess. */
export function starsFor(playerMoves: number, minMoves: number): number {
  if (playerMoves <= Math.ceil(minMoves * 1.15)) return 3
  if (playerMoves <= Math.ceil(minMoves * 1.5)) return 2
  return 1
}
