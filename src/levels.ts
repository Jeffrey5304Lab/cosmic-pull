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
  // 1 ── teach the basic act: one blocker pin, no danger, just enough stardust.
  {
    id: 1,
    name: 'First Pull',
    world: W,
    hint: '點木栓把它拔掉 ✦ 讓星塵倒進杯子',
    pins: [{ id: 'a', x: 50, y: 44, len: 30, thick: 3 }],
    walls: [],
    emitters: [{ x: 50, y: 30, w: 20, h: 12, count: 18 }],
    cups: [{ id: 'c', x: 50, y: 122, w: 28, h: 22, need: 15 }],
    hazards: [],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'a', atMs: 200 }],
  },

  // 2 ── teach the danger: a lava pool, but a FIXED ramp routes you safely past.
  {
    id: 2,
    name: 'Mind the Lava',
    world: W,
    hint: '星塵滑下斜坡、繞過岩漿，流進杯子',
    pins: [{ id: 'a', x: 30, y: 42, len: 22, thick: 3 }],
    walls: [{ x: 42, y: 74, w: 44, h: 3, angle: 0.6 }],
    emitters: [{ x: 30, y: 28, w: 18, h: 14, count: 22 }],
    cups: [{ id: 'c', x: 76, y: 122, w: 22, h: 20, need: 15 }],
    hazards: [{ x: 28, y: 122, w: 34, h: 10, kind: 'lava' }],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'a', atMs: 200 }],
  },

  // 3 ── THE core idea: the ramp is now a PIN. Pull it and the path collapses
  //      into the lava. Only pull the blocker on top.
  {
    id: 3,
    name: "Don't Pull the Bridge",
    world: W,
    hint: '斜的木栓是「橋」！撐住去路——別拔它，只拔上面那根',
    pins: [
      { id: 'hold', x: 30, y: 42, len: 22, thick: 3 },
      { id: 'bridge', x: 42, y: 74, len: 44, thick: 4, angle: 0.6 },
    ],
    walls: [],
    emitters: [{ x: 30, y: 28, w: 18, h: 14, count: 22 }],
    cups: [{ id: 'c', x: 76, y: 122, w: 22, h: 20, need: 15 }],
    hazards: [{ x: 28, y: 122, w: 34, h: 10, kind: 'lava' }],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'hold', atMs: 200 }],
    traps: ['bridge'],
  },

  // 4 ── read the board: two bridges funnel inward to one cup. Pull either
  //      bridge and that whole stream is lost to the lava — you can't recover.
  {
    id: 4,
    name: 'Which Ones?',
    world: W,
    hint: '兩根斜的都是橋，把星塵送到中間。只拔上面兩根！',
    pins: [
      { id: 'hl', x: 24, y: 44, len: 16, thick: 3 },
      { id: 'hr', x: 76, y: 44, len: 16, thick: 3 },
      { id: 'bl', x: 30, y: 76, len: 36, thick: 4, angle: 0.6 },
      { id: 'br', x: 70, y: 76, len: 36, thick: 4, angle: -0.6 },
    ],
    walls: [],
    emitters: [
      { x: 24, y: 30, w: 14, h: 12, count: 20 },
      { x: 76, y: 30, w: 14, h: 12, count: 20 },
    ],
    cups: [{ id: 'c', x: 50, y: 128, w: 28, h: 20, need: 22 }],
    hazards: [
      { x: 12, y: 124, w: 20, h: 10, kind: 'lava' },
      { x: 88, y: 124, w: 20, h: 10, kind: 'lava' },
    ],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'hl', atMs: 200 },
      { pin: 'hr', atMs: 400 },
    ],
    traps: ['bl', 'br'],
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
      { id: 'g', x: 28, y: 40, len: 26, thick: 3 },
      { id: 'r', x: 72, y: 40, len: 26, thick: 3 },
    ],
    walls: [{ x: 50, y: 62, w: 3, h: 34 }],
    emitters: [
      { x: 28, y: 28, w: 20, h: 10, count: 18, color: 'gold' },
      { x: 72, y: 28, w: 20, h: 10, count: 18, color: 'rose' },
    ],
    cups: [
      { id: 'cg', x: 26, y: 122, w: 22, h: 20, need: 12, color: 'gold' },
      { id: 'cr', x: 74, y: 122, w: 22, h: 20, need: 12, color: 'rose' },
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
    pins: [{ id: 'a', x: 50, y: 36, len: 34, thick: 3 }],
    walls: [
      { x: 28, y: 66, w: 30, h: 3, angle: 0.5 },
      { x: 72, y: 66, w: 30, h: 3, angle: -0.5 },
    ],
    emitters: [{ x: 50, y: 26, w: 28, h: 8, count: 30 }],
    cups: [{ id: 'c', x: 50, y: 132, w: 28, h: 16, need: 10 }],
    hazards: [{ x: 50, y: 98, w: 14, h: 8, kind: 'void', moveX: 1.6, moveRange: 20 }],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'a', atMs: 200 }],
  },

  // 9 ── funnel past a sweeping lava.
  {
    id: 9,
    name: 'Hot Timing',
    world: W,
    hint: '岩漿來回掃，趁空檔倒下去',
    pins: [{ id: 'a', x: 50, y: 34, len: 26, thick: 3 }],
    walls: [
      { x: 30, y: 66, w: 30, h: 3, angle: 0.5 },
      { x: 70, y: 66, w: 30, h: 3, angle: -0.5 },
    ],
    emitters: [{ x: 50, y: 22, w: 22, h: 12, count: 34 }],
    cups: [{ id: 'c', x: 50, y: 132, w: 28, h: 16, need: 11 }],
    hazards: [{ x: 50, y: 98, w: 16, h: 8, kind: 'lava', moveX: 1.5, moveRange: 22 }],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'a', atMs: 200 }],
  },

  // 10 ── three cups, three pins.
  {
    id: 10,
    name: 'Three of a Kind',
    world: W,
    hint: '三個杯子，全都要滿',
    pins: [
      { id: 'l', x: 20, y: 40, len: 13, thick: 3 },
      { id: 'm', x: 50, y: 40, len: 13, thick: 3 },
      { id: 'r', x: 80, y: 40, len: 13, thick: 3 },
    ],
    walls: [
      { x: 35, y: 90, w: 3, h: 60 },
      { x: 65, y: 90, w: 3, h: 60 },
    ],
    emitters: [
      { x: 20, y: 28, w: 11, h: 12, count: 13 },
      { x: 50, y: 28, w: 11, h: 12, count: 13 },
      { x: 80, y: 28, w: 11, h: 12, count: 13 },
    ],
    cups: [
      { id: 'cl', x: 19, y: 126, w: 18, h: 20, need: 7 },
      { id: 'cm', x: 50, y: 126, w: 18, h: 20, need: 7 },
      { id: 'cr', x: 81, y: 126, w: 18, h: 20, need: 7 },
    ],
    hazards: [],
    stars: { pulls: [3, 3] },
    solution: [
      { pin: 'l', atMs: 200 },
      { pin: 'm', atMs: 350 },
      { pin: 'r', atMs: 500 },
    ],
  },

  // 11 ── keystone: a big pile, a long bridge over a wide lava. The bridge is a
  //      pin now — pull the blocker, never the bridge.
  {
    id: 11,
    name: 'Keystone',
    world: W,
    hint: '一整堆星塵靠那道長橋撐著——只拔上面的栓',
    pins: [
      { id: 'hold', x: 30, y: 42, len: 22, thick: 3 },
      { id: 'bridge', x: 42, y: 74, len: 44, thick: 4, angle: 0.6 },
    ],
    walls: [],
    emitters: [{ x: 30, y: 28, w: 18, h: 14, count: 26 }],
    cups: [{ id: 'c', x: 76, y: 122, w: 22, h: 20, need: 15 }],
    hazards: [{ x: 28, y: 122, w: 34, h: 10, kind: 'lava' }],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'hold', atMs: 200 }],
    traps: ['bridge'],
  },

  // 12 ── colour match with a central void punishing spill.
  {
    id: 12,
    name: 'Colour Guard',
    world: W,
    hint: '顏色要配對，中間還有黑洞',
    pins: [
      { id: 'g', x: 24, y: 38, len: 16, thick: 3 },
      { id: 'r', x: 76, y: 38, len: 16, thick: 3 },
    ],
    walls: [
      { x: 38, y: 112, w: 3, h: 28 },
      { x: 62, y: 112, w: 3, h: 28 },
    ],
    emitters: [
      { x: 24, y: 26, w: 12, h: 12, count: 15, color: 'gold' },
      { x: 76, y: 26, w: 12, h: 12, count: 15, color: 'rose' },
    ],
    cups: [
      { id: 'cg', x: 22, y: 124, w: 24, h: 22, need: 9, color: 'gold' },
      { id: 'cr', x: 78, y: 124, w: 24, h: 22, need: 9, color: 'rose' },
    ],
    hazards: [{ x: 50, y: 128, w: 18, h: 10, kind: 'void' }],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'g', atMs: 200 },
      { pin: 'r', atMs: 400 },
    ],
  },

  // 13 ── narrow gauntlet: pour a big pile between two lavas.
  {
    id: 13,
    name: 'The Needle',
    world: W,
    hint: '兩側都是岩漿，縫隙很窄——穩住',
    pins: [{ id: 'a', x: 50, y: 30, len: 26, thick: 3 }],
    walls: [
      { x: 28, y: 86, w: 28, h: 3, angle: 0.5 },
      { x: 72, y: 86, w: 28, h: 3, angle: -0.5 },
    ],
    emitters: [{ x: 50, y: 20, w: 22, h: 10, count: 26 }],
    cups: [{ id: 'c', x: 50, y: 130, w: 26, h: 16, need: 12 }],
    hazards: [
      { x: 12, y: 108, w: 16, h: 8, kind: 'lava' },
      { x: 88, y: 108, w: 16, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'a', atMs: 200 }],
  },

  // 14 ── two sweeping voids over a funnel.
  {
    id: 14,
    name: 'Double Sweep',
    world: W,
    hint: '兩個黑洞交錯移動，看準再拔',
    pins: [{ id: 'a', x: 50, y: 32, len: 26, thick: 3 }],
    walls: [
      { x: 30, y: 60, w: 30, h: 3, angle: 0.5 },
      { x: 70, y: 60, w: 30, h: 3, angle: -0.5 },
    ],
    emitters: [{ x: 50, y: 20, w: 22, h: 12, count: 36 }],
    cups: [{ id: 'c', x: 50, y: 134, w: 30, h: 14, need: 10 }],
    hazards: [
      { x: 40, y: 92, w: 12, h: 7, kind: 'void', moveX: 1.7, moveRange: 16 },
      { x: 60, y: 112, w: 12, h: 7, kind: 'void', moveX: 2.1, moveRange: 16 },
    ],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'a', atMs: 200 }],
  },

  // 15 ── ordered release: clear the shelf before opening the flood.
  {
    id: 15,
    name: 'Clear the Shelf',
    world: W,
    hint: '先開上面的閘，等它流下去，再放大水流',
    pins: [
      { id: 'top', x: 50, y: 28, len: 24, thick: 3 },
      { id: 'gate', x: 50, y: 58, len: 24, thick: 3 },
    ],
    walls: [
      { x: 30, y: 92, w: 30, h: 3, angle: 0.5 },
      { x: 70, y: 92, w: 30, h: 3, angle: -0.5 },
    ],
    emitters: [{ x: 50, y: 18, w: 22, h: 10, count: 30 }],
    cups: [{ id: 'c', x: 50, y: 130, w: 22, h: 18, need: 20 }],
    hazards: [
      { x: 14, y: 112, w: 16, h: 8, kind: 'lava' },
      { x: 86, y: 112, w: 16, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'top', atMs: 200 },
      { pin: 'gate', atMs: 1400 },
    ],
  },

  // 16 ── two colours across a drifting void.
  {
    id: 16,
    name: 'Void Crossing',
    world: W,
    hint: '兩種顏色，中間有游走的黑洞',
    pins: [
      { id: 'g', x: 22, y: 40, len: 16, thick: 3 },
      { id: 'a', x: 78, y: 40, len: 16, thick: 3 },
    ],
    walls: [
      { x: 38, y: 108, w: 3, h: 34 },
      { x: 62, y: 108, w: 3, h: 34 },
    ],
    emitters: [
      { x: 22, y: 28, w: 12, h: 12, count: 16, color: 'gold' },
      { x: 78, y: 28, w: 12, h: 12, count: 16, color: 'aqua' },
    ],
    cups: [
      { id: 'cg', x: 22, y: 122, w: 24, h: 22, need: 8, color: 'gold' },
      { id: 'ca', x: 78, y: 122, w: 24, h: 22, need: 8, color: 'aqua' },
    ],
    hazards: [{ x: 50, y: 104, w: 14, h: 8, kind: 'void', moveX: 1.4, moveRange: 14 }],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'g', atMs: 200 },
      { pin: 'a', atMs: 300 },
    ],
  },

  // 17 ── three colours, three cups.
  {
    id: 17,
    name: 'Rainbow Row',
    world: W,
    hint: '三種顏色，各就各位',
    pins: [
      { id: 'l', x: 20, y: 40, len: 13, thick: 3 },
      { id: 'm', x: 50, y: 40, len: 13, thick: 3 },
      { id: 'r', x: 80, y: 40, len: 13, thick: 3 },
    ],
    walls: [
      { x: 35, y: 90, w: 3, h: 60 },
      { x: 65, y: 90, w: 3, h: 60 },
    ],
    emitters: [
      { x: 20, y: 28, w: 11, h: 12, count: 13, color: 'gold' },
      { x: 50, y: 28, w: 11, h: 12, count: 13, color: 'rose' },
      { x: 80, y: 28, w: 11, h: 12, count: 13, color: 'aqua' },
    ],
    cups: [
      { id: 'cl', x: 19, y: 126, w: 18, h: 20, need: 7, color: 'gold' },
      { id: 'cm', x: 50, y: 126, w: 18, h: 20, need: 7, color: 'rose' },
      { id: 'cr', x: 81, y: 126, w: 18, h: 20, need: 7, color: 'aqua' },
    ],
    hazards: [],
    stars: { pulls: [3, 3] },
    solution: [
      { pin: 'l', atMs: 200 },
      { pin: 'm', atMs: 350 },
      { pin: 'r', atMs: 500 },
    ],
  },

  // 18 ── colour match either side of a lava pool.
  {
    id: 18,
    name: 'Aqua & Gold',
    world: W,
    hint: '別讓顏色掉進中間的岩漿',
    pins: [
      { id: 'g', x: 24, y: 38, len: 16, thick: 3 },
      { id: 'a', x: 76, y: 38, len: 16, thick: 3 },
    ],
    walls: [
      { x: 38, y: 112, w: 3, h: 28 },
      { x: 62, y: 112, w: 3, h: 28 },
    ],
    emitters: [
      { x: 24, y: 26, w: 12, h: 12, count: 15, color: 'gold' },
      { x: 76, y: 26, w: 12, h: 12, count: 15, color: 'aqua' },
    ],
    cups: [
      { id: 'cg', x: 22, y: 124, w: 24, h: 22, need: 9, color: 'gold' },
      { id: 'ca', x: 78, y: 124, w: 24, h: 22, need: 9, color: 'aqua' },
    ],
    hazards: [{ x: 50, y: 128, w: 18, h: 10, kind: 'lava' }],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'g', atMs: 200 },
      { pin: 'a', atMs: 400 },
    ],
  },

  // 19 ── one huge pour: fill the big cup.
  {
    id: 19,
    name: 'Avalanche',
    world: W,
    hint: '一次傾瀉——盡量別浪費',
    pins: [{ id: 'a', x: 50, y: 36, len: 30, thick: 3 }],
    walls: [
      { x: 26, y: 70, w: 28, h: 3, angle: 0.5 },
      { x: 74, y: 70, w: 28, h: 3, angle: -0.5 },
    ],
    emitters: [{ x: 50, y: 24, w: 24, h: 14, count: 40 }],
    cups: [{ id: 'c', x: 50, y: 132, w: 30, h: 16, need: 26 }],
    hazards: [],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'a', atMs: 200 }],
  },

  // 20 ── grand finale: two colours, a wider drifting void, tight budget.
  {
    id: 20,
    name: 'Grand Finale',
    world: W,
    hint: '把學到的全用上——祝好運 ✦',
    pins: [
      { id: 'g', x: 22, y: 40, len: 16, thick: 3 },
      { id: 'a', x: 78, y: 40, len: 16, thick: 3 },
    ],
    walls: [
      { x: 38, y: 108, w: 3, h: 34 },
      { x: 62, y: 108, w: 3, h: 34 },
    ],
    emitters: [
      { x: 22, y: 28, w: 12, h: 12, count: 16, color: 'gold' },
      { x: 78, y: 28, w: 12, h: 12, count: 16, color: 'aqua' },
    ],
    cups: [
      { id: 'cg', x: 22, y: 122, w: 24, h: 22, need: 9, color: 'gold' },
      { id: 'ca', x: 78, y: 122, w: 24, h: 22, need: 9, color: 'aqua' },
    ],
    hazards: [{ x: 50, y: 104, w: 14, h: 8, kind: 'void', moveX: 1.5, moveRange: 16 }],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'g', atMs: 200 },
      { pin: 'a', atMs: 300 },
    ],
  },
]

export const LEVEL_COUNT = LEVELS.length

export function getLevel(id: number): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id)
}
