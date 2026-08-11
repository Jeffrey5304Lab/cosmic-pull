/**
 * Shared types for Cosmic Pull.
 *
 * The whole game is authored in a fixed **world coordinate system** (see
 * `WORLD` in config.ts): a portrait board WORLD.w × WORLD.h units. The renderer
 * scales world→screen so levels look identical on every device.
 */

export type StardustColor = 'gold' | 'rose' | 'aqua'

/** A removable peg. Static in the physics world until the player taps it. */
export interface PinDef {
  id: string
  x: number
  y: number
  /** length along the pin's local x axis */
  len: number
  /** thickness */
  thick: number
  /** rotation in radians (0 = horizontal) */
  angle?: number
}

/** A fixed obstacle: ink-drawn wall/ledge. Never removable. */
export interface WallDef {
  x: number
  y: number
  w: number
  h: number
  angle?: number
  /** decorative rounded look only; physics uses the rectangle */
  round?: boolean
}

/** Where stardust starts. A pre-placed pile of `count` grains. */
export interface EmitterDef {
  x: number
  y: number
  w: number
  h: number
  count: number
  color?: StardustColor
}

/** A cup to fill. Collects grains that settle into its mouth. */
export interface CupDef {
  id: string
  x: number
  y: number
  w: number
  h: number
  /** grains required to fill */
  need: number
  /** if set, only grains of this colour count; others are rejected */
  color?: StardustColor
}

export type HazardKind = 'lava' | 'void'

/** A danger zone. Grains touching it are destroyed (wasted). */
export interface HazardDef {
  x: number
  y: number
  w: number
  h: number
  kind: HazardKind
  /** optional horizontal patrol: peak speed (world units/s) and travel half-range */
  moveX?: number
  moveRange?: number
}

/** Star rating thresholds (lower pulls / higher leftover = more stars). */
export interface StarRule {
  /** ≤ this many pulls → keep this star. Index 0 = 3-star, 1 = 2-star. */
  pulls?: [number, number]
}

export interface LevelDef {
  id: number
  name: string
  world: { w: number; h: number }
  pins: PinDef[]
  walls: WallDef[]
  emitters: EmitterDef[]
  cups: CupDef[]
  hazards: HazardDef[]
  stars?: StarRule
  /** one-line coaching shown the first time a mechanic appears */
  hint?: string
  /**
   * The designer's intended pull sequence (pin id + when, in ms). Not used by
   * gameplay — the Phase 5 solvability test replays it to prove the level is
   * winnable, and it documents each level's "aha".
   */
  solution?: { pin: string; atMs: number }[]
  /**
   * "Trap" pins — support ramps/ledges that must NOT be pulled. The test suite
   * asserts that pulling one makes the level unwinnable, guaranteeing the puzzle
   * has real teeth (a wrong choice actually fails you).
   */
  traps?: string[]
}

export type SimStatus = 'playing' | 'won' | 'lost'

/** Presentation FX cue emitted by the sim (all coords in WORLD units). */
export type SimEvent =
  | { type: 'collect'; x: number; y: number; color: StardustColor }
  | { type: 'waste'; x: number; y: number; kind: HazardKind }
  | { type: 'pull'; x: number; y: number; angle: number }
