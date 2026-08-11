import type { LevelDef } from './types.ts'

/**
 * Hand-authored levels for Cosmic Pull.
 *
 * Coordinates are in WORLD units (100 × 150, y points down). Every level ships
 * a `solution` — the intended pull order — which the Phase 5 test replays to
 * guarantee the level is beatable. Difficulty ramps by introducing one idea at
 * a time: fall → funnel → hazard → order-matters → colour → moving hazard.
 */

const W = { w: 100, h: 150 }

export const LEVELS: LevelDef[] = [
  // 1 ── the very first pull: nothing to do but tap.
  {
    id: 1,
    name: 'First Pull',
    world: W,
    hint: '點一下木栓，把它拔出來 ✦',
    pins: [{ id: 'a', x: 50, y: 40, len: 30, thick: 3 }],
    walls: [],
    emitters: [{ x: 50, y: 26, w: 24, h: 14, count: 26 }],
    cups: [{ id: 'c', x: 50, y: 120, w: 34, h: 22, need: 18 }],
    hazards: [],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'a', atMs: 200 }],
  },

  // 2 ── a funnel: guide walls squeeze the pour into a narrower cup.
  {
    id: 2,
    name: 'Funnel',
    world: W,
    hint: '星塵會順著斜牆滑進杯子',
    pins: [{ id: 'a', x: 50, y: 34, len: 30, thick: 3 }],
    walls: [
      { x: 30, y: 70, w: 34, h: 3, angle: 0.5 },
      { x: 70, y: 70, w: 34, h: 3, angle: -0.5 },
    ],
    emitters: [{ x: 50, y: 22, w: 24, h: 12, count: 26 }],
    cups: [{ id: 'c', x: 50, y: 124, w: 24, h: 20, need: 18 }],
    hazards: [],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'a', atMs: 200 }],
  },

  // 3 ── first hazard: a lava pool you must pour *around*.
  {
    id: 3,
    name: 'Mind the Lava',
    world: W,
    hint: '碰到岩漿的星塵會被燒掉——別浪費！',
    pins: [{ id: 'a', x: 32, y: 40, len: 22, thick: 3 }],
    walls: [{ x: 40, y: 74, w: 40, h: 3, angle: 0.62 }],
    emitters: [{ x: 32, y: 28, w: 18, h: 12, count: 24 }],
    cups: [{ id: 'c', x: 74, y: 122, w: 22, h: 20, need: 15 }],
    hazards: [{ x: 30, y: 122, w: 34, h: 10, kind: 'lava' }],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'a', atMs: 200 }],
  },

  // 4 ── two cups, two pins: fill them both.
  {
    id: 4,
    name: 'Split',
    world: W,
    hint: '兩個杯子都要裝滿才能過關',
    pins: [
      { id: 'l', x: 26, y: 40, len: 16, thick: 3 },
      { id: 'r', x: 74, y: 40, len: 16, thick: 3 },
    ],
    walls: [{ x: 50, y: 66, w: 3, h: 44 }],
    emitters: [
      { x: 26, y: 28, w: 12, h: 12, count: 16 },
      { x: 74, y: 28, w: 12, h: 12, count: 16 },
    ],
    cups: [
      { id: 'cl', x: 26, y: 122, w: 24, h: 22, need: 10 },
      { id: 'cr', x: 74, y: 122, w: 24, h: 22, need: 10 },
    ],
    hazards: [],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'l', atMs: 200 },
      { pin: 'r', atMs: 400 },
    ],
  },

  // 5 ── order matters: pull the drain plug before the flood.
  {
    id: 5,
    name: 'Order of Things',
    world: W,
    hint: '先後順序會影響結果，多想一步',
    pins: [
      { id: 'gate', x: 50, y: 60, len: 26, thick: 3 },
      { id: 'top', x: 50, y: 30, len: 26, thick: 3 },
    ],
    walls: [
      { x: 30, y: 90, w: 30, h: 3, angle: 0.5 },
      { x: 70, y: 90, w: 30, h: 3, angle: -0.5 },
    ],
    emitters: [{ x: 50, y: 20, w: 22, h: 10, count: 28 }],
    cups: [{ id: 'c', x: 50, y: 128, w: 22, h: 18, need: 20 }],
    hazards: [
      { x: 14, y: 108, w: 16, h: 8, kind: 'lava' },
      { x: 86, y: 108, w: 16, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'top', atMs: 200 },
      { pin: 'gate', atMs: 1400 },
    ],
  },

  // 6 ── colour match: gold to the gold cup, rose to the rose cup.
  {
    id: 6,
    name: 'True Colours',
    world: W,
    hint: '顏色要對！只有相符的星塵會被杯子收下',
    pins: [
      { id: 'g', x: 28, y: 38, len: 20, thick: 3 },
      { id: 'r', x: 72, y: 38, len: 20, thick: 3 },
    ],
    walls: [{ x: 50, y: 62, w: 3, h: 34 }],
    emitters: [
      { x: 28, y: 26, w: 16, h: 12, count: 16, color: 'gold' },
      { x: 72, y: 26, w: 16, h: 12, count: 16, color: 'rose' },
    ],
    cups: [
      { id: 'cg', x: 26, y: 122, w: 20, h: 20, need: 12, color: 'gold' },
      { id: 'cr', x: 74, y: 122, w: 20, h: 20, need: 12, color: 'rose' },
    ],
    hazards: [],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'g', atMs: 200 },
      { pin: 'r', atMs: 400 },
    ],
  },

  // 7 ── twin falls with a central void: don't let the streams spill inward.
  {
    id: 7,
    name: 'Twin Falls',
    world: W,
    hint: '中間是黑洞，別讓星塵漏到中央',
    pins: [
      { id: 'l', x: 22, y: 40, len: 16, thick: 3 },
      { id: 'r', x: 78, y: 40, len: 16, thick: 3 },
    ],
    walls: [
      // short dividers shielding each cup from the central void
      { x: 38, y: 112, w: 3, h: 28 },
      { x: 62, y: 112, w: 3, h: 28 },
    ],
    emitters: [
      { x: 22, y: 28, w: 12, h: 12, count: 15 },
      { x: 78, y: 28, w: 12, h: 12, count: 15 },
    ],
    cups: [
      { id: 'cl', x: 22, y: 124, w: 24, h: 22, need: 9 },
      { id: 'cr', x: 78, y: 124, w: 24, h: 22, need: 9 },
    ],
    hazards: [{ x: 50, y: 128, w: 18, h: 10, kind: 'void' }],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'l', atMs: 200 },
      { pin: 'r', atMs: 400 },
    ],
  },

  // 8 ── moving hazard: time the pour past a sweeping void.
  {
    id: 8,
    name: 'Sweeper',
    world: W,
    hint: '黑洞會來回移動，抓準空檔再拔栓',
    pins: [{ id: 'a', x: 50, y: 34, len: 26, thick: 3 }],
    walls: [
      { x: 28, y: 66, w: 30, h: 3, angle: 0.5 },
      { x: 72, y: 66, w: 30, h: 3, angle: -0.5 },
    ],
    emitters: [{ x: 50, y: 22, w: 22, h: 12, count: 32 }],
    cups: [{ id: 'c', x: 50, y: 132, w: 28, h: 16, need: 10 }],
    hazards: [{ x: 50, y: 98, w: 14, h: 8, kind: 'void', moveX: 1.6, moveRange: 20 }],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'a', atMs: 200 }],
  },
]

export const LEVEL_COUNT = LEVELS.length

export function getLevel(id: number): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id)
}
