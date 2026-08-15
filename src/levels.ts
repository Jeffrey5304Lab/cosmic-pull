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
    emitters: [{ x: 50, y: 30, w: 20, h: 12, count: 22 }],
    cups: [{ id: 'c', x: 50, y: 122, w: 28, h: 22, need: 11 }],
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
    cups: [{ id: 'c', x: 76, y: 122, w: 22, h: 20, need: 12 }],
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
    cups: [{ id: 'c', x: 76, y: 122, w: 22, h: 20, need: 12 }],
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
      { id: 'hl', x: 24, y: 44, len: 24, thick: 3 },
      { id: 'hr', x: 76, y: 44, len: 24, thick: 3 },
      { id: 'bl', x: 30, y: 78, len: 36, thick: 4, angle: 0.6 },
      { id: 'br', x: 70, y: 78, len: 36, thick: 4, angle: -0.6 },
    ],
    walls: [],
    emitters: [
      { x: 24, y: 32, w: 22, h: 7, count: 20 },
      { x: 76, y: 32, w: 22, h: 7, count: 20 },
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

  // 5 ── THE RULE-BREAKER. By now the player has learned "pull the flat one,
  //      never the slanted one" (L3/L4) — and that rule LOSES here: this ramp
  //      doesn't bridge anything, it dumps into the lava. The cup is straight
  //      down, so you must clear the ramp away FIRST, then release the pile.
  //      Without levels like this the whole game is solvable by rote.
  {
    id: 5,
    name: 'The False Bridge',
    spike: true,
    world: W,
    hint: '斜的不一定是橋——先看清楚它通到哪裡',
    pins: [
      { id: 'slide', x: 62, y: 74, len: 40, thick: 4, angle: 0.6 },
      { id: 'hold', x: 50, y: 40, len: 26, thick: 3 },
    ],
    walls: [],
    emitters: [{ x: 50, y: 28, w: 20, h: 10, count: 17 }],
    cups: [{ id: 'c', x: 50, y: 128, w: 26, h: 20, need: 13 }],
    hazards: [{ x: 86, y: 126, w: 28, h: 10, kind: 'lava' }],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'slide', atMs: 200 },
      { pin: 'hold', atMs: 900 },
    ],
  },

  // 6 ── colour match: gold to the gold cup, rose to the rose cup.
  {
    id: 6,
    name: 'True Colours',
    world: W,
    // Rebuilt: the long ramp funnels BOTH colours onto the gold cup, which
    // rejects rose — so the habit (pull the flats, never a slant) destroys the
    // rose supply. You must remove the ramp first and let the splitter walls
    // send each colour its own way. Deliberately inverts the L3 lesson.
    hint: '兩色都會被那道長斜坡導到同一邊——先把斜坡拔掉，讓它們各走各的',
    pins: [
      { id: 'holdG', x: 34, y: 30, len: 20, thick: 3 },
      { id: 'holdR', x: 66, y: 30, len: 20, thick: 3 },
      { id: 'diverter', x: 46, y: 64, len: 60, thick: 4, angle: -0.45 },
    ],
    walls: [
      { x: 38, y: 98, w: 28, h: 4, angle: -0.5 },
      { x: 62, y: 98, w: 28, h: 4, angle: 0.5 },
    ],
    emitters: [
      { x: 34, y: 20, w: 18, h: 9, count: 18, color: 'gold' },
      { x: 66, y: 20, w: 18, h: 9, count: 18, color: 'rose' },
    ],
    cups: [
      { id: 'cg', x: 15, y: 132, w: 22, h: 16, need: 9, color: 'gold' },
      { id: 'cr', x: 85, y: 132, w: 22, h: 16, need: 9, color: 'rose' },
    ],
    hazards: [{ x: 50, y: 134, w: 22, h: 9, kind: 'void' }],
    stars: { pulls: [3, 3] },
    solution: [
      { pin: 'diverter', atMs: 200 },
      { pin: 'holdG', atMs: 1600 },
      { pin: 'holdR', atMs: 3200 },
    ],
  },

  // 7 ── fountain: one pile splits over a peak into two cups. One pull, but the
  //      stardust fans out to both sides.
  {
    id: 7,
    name: 'Fountain',
    world: W,
    spike: true,
    hint: '噴泉變成機關了：先清一側的層架填滿杯子，閘門才開',
    pins: [
      { id: 's1', x: 72, y: 24, len: 18, thick: 3 },
      { id: 's2', x: 72, y: 48, len: 18, thick: 3 },
      { id: 's3', x: 72, y: 72, len: 18, thick: 3 },
      { id: 'gshelf', x: 28, y: 60, len: 20, thick: 3, releases: ['ghelp'] },
      { id: 'ghelp', x: 28, y: 40, len: 18, thick: 3 },
    ],
    walls: [
      { x: 50, y: 100, w: 3, h: 60 },
      { x: 28, y: 84, w: 26, h: 3, gate: 'cl' },
    ],
    emitters: [
      { x: 72, y: 15, w: 14, h: 8, count: 7 },
      { x: 72, y: 39, w: 14, h: 8, count: 7 },
      { x: 72, y: 63, w: 14, h: 8, count: 7 },
      { x: 28, y: 50, w: 20, h: 8, count: 7 },
      { x: 28, y: 30, w: 18, h: 8, count: 6 },
    ],
    cups: [
      { id: 'cl', x: 72, y: 126, w: 18, h: 16, need: 18 },
      { id: 'cr', x: 28, y: 132, w: 20, h: 14, need: 11 },
    ],
    hazards: [
      { x: 90, y: 98, w: 12, h: 8, kind: 'void' },
      { x: 55, y: 98, w: 6, h: 8, kind: 'void' },
    ],
    stars: { pulls: [5, 6] },
    solution: [
      { pin: 's3', atMs: 200 },
      { pin: 's2', atMs: 2600 },
      { pin: 's1', atMs: 5000 },
      { pin: 'gshelf', atMs: 8400 },
    ],
  },

  // 8 ── moving hazard: time the pour past a sweeping void.
  {
    id: 8,
    name: 'Sweeper',
    world: W,
    spike: true,
    hint: '先解開層架那側——閘門開了，另一邊才落得下去',
    pins: [
      { id: 's1', x: 32, y: 24, len: 18, thick: 3 },
      { id: 's2', x: 32, y: 48, len: 18, thick: 3 },
      { id: 's3', x: 32, y: 72, len: 18, thick: 3 },
      { id: 'gshelf', x: 68, y: 60, len: 20, thick: 3, releases: ['ghelp'] },
      { id: 'ghelp', x: 68, y: 40, len: 18, thick: 3 },
    ],
    walls: [
      { x: 50, y: 100, w: 3, h: 60 },
      { x: 68, y: 84, w: 26, h: 3, gate: 'cl' },
    ],
    emitters: [
      { x: 32, y: 15, w: 14, h: 8, count: 7 },
      { x: 32, y: 39, w: 14, h: 8, count: 7 },
      { x: 32, y: 63, w: 14, h: 8, count: 7 },
      { x: 68, y: 50, w: 20, h: 8, count: 7 },
      { x: 68, y: 30, w: 18, h: 8, count: 6 },
    ],
    cups: [
      { id: 'cl', x: 32, y: 126, w: 18, h: 16, need: 18 },
      { id: 'cr', x: 68, y: 132, w: 20, h: 14, need: 11 },
    ],
    hazards: [
      { x: 10, y: 98, w: 12, h: 8, kind: 'void' },
      { x: 45, y: 98, w: 6, h: 8, kind: 'void' },
    ],
    stars: { pulls: [5, 6] },
    solution: [
      { pin: 's3', atMs: 200 },
      { pin: 's2', atMs: 2600 },
      { pin: 's1', atMs: 5000 },
      { pin: 'gshelf', atMs: 8400 },
    ],
  },

  // 9 ── funnel past a sweeping lava.
  {
    id: 9,
    name: 'Hot Timing',
    world: W,
    spike: true,
    hint: '兩段式：由下往上清層架，再放行閘門後的那疊',
    pins: [
      { id: 's1', x: 72, y: 24, len: 18, thick: 3 },
      { id: 's2', x: 72, y: 48, len: 18, thick: 3 },
      { id: 's3', x: 72, y: 72, len: 18, thick: 3 },
      { id: 'gshelf', x: 28, y: 60, len: 20, thick: 3, releases: ['ghelp'] },
      { id: 'ghelp', x: 28, y: 40, len: 18, thick: 3 },
    ],
    walls: [
      { x: 50, y: 100, w: 3, h: 60 },
      { x: 28, y: 84, w: 26, h: 3, gate: 'cl' },
    ],
    emitters: [
      { x: 72, y: 15, w: 14, h: 8, count: 7 },
      { x: 72, y: 39, w: 14, h: 8, count: 7 },
      { x: 72, y: 63, w: 14, h: 8, count: 7 },
      { x: 28, y: 50, w: 20, h: 8, count: 7 },
      { x: 28, y: 30, w: 18, h: 8, count: 6 },
    ],
    cups: [
      { id: 'cl', x: 72, y: 126, w: 18, h: 16, need: 18 },
      { id: 'cr', x: 28, y: 132, w: 20, h: 14, need: 11 },
    ],
    hazards: [
      { x: 90, y: 98, w: 12, h: 8, kind: 'lava' },
      { x: 55, y: 98, w: 6, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [5, 6] },
    solution: [
      { pin: 's3', atMs: 200 },
      { pin: 's2', atMs: 2600 },
      { pin: 's1', atMs: 5000 },
      { pin: 'gshelf', atMs: 8400 },
    ],
  },

  // 10 ── three cups, three pins.
  {
    id: 10,
    name: 'Wrong Way Round',
    spike: true,
    world: W,
    // RULE-BREAKER #2: the rote habit is "work top-to-bottom", and here that
    // loses. Release the flood first and it lands on the pile still sitting on
    // 'gate', blasting it off the sides into the lava. Drain the lower pile
    // first, THEN send the flood down the empty channel.
    hint: '由上往下拔？這關會害你——先把下面那堆放走，再開上面的洪水',
    pins: [
      { id: 'top', x: 50, y: 26, len: 26, thick: 3 },
      { id: 'gate', x: 50, y: 64, len: 22, thick: 3 },
    ],
    walls: [],
    emitters: [
      { x: 50, y: 14, w: 22, h: 10, count: 20 },
      { x: 50, y: 52, w: 18, h: 10, count: 16 },
    ],
    cups: [{ id: 'c', x: 50, y: 128, w: 24, h: 18, need: 26 }],
    hazards: [
      { x: 16, y: 120, w: 30, h: 10, kind: 'lava' },
      { x: 84, y: 120, w: 30, h: 10, kind: 'lava' },
    ],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'gate', atMs: 200 },
      { pin: 'top', atMs: 3000 },
    ],
  },

  // 11 ── keystone: a big pile, a long bridge over a wide lava. The bridge is a
  //      pin now — pull the blocker, never the bridge.
  {
    id: 11,
    name: 'Keystone',
    world: W,
    // Rebuilt for difficulty: the rote habit (pull flats top-down) releases the
    // upper flood onto the still-loaded lower shelf and blasts it sideways into
    // the lava. Drain the lower pile first, then send the flood down the bridge.
    hint: '上面那堆是洪水——先把下面那堆放走，再開上面的',
    pins: [
      { id: 'flood', x: 70, y: 20, len: 24, thick: 3 },
      { id: 'hold', x: 70, y: 50, len: 22, thick: 3 },
      { id: 'bridge', x: 56, y: 80, len: 44, thick: 4, angle: -0.6 },
    ],
    walls: [],
    emitters: [
      { x: 70, y: 10, w: 20, h: 9, count: 14 },
      { x: 70, y: 40, w: 18, h: 9, count: 16 },
    ],
    cups: [{ id: 'c', x: 22, y: 124, w: 24, h: 20, need: 21 }],
    hazards: [
      { x: 78, y: 122, w: 34, h: 10, kind: 'lava' },
      { x: 46, y: 104, w: 20, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'hold', atMs: 200 },
      { pin: 'flood', atMs: 3200 },
    ],
    traps: ['bridge'],
  },

  // 12 ── colour match with a central void punishing spill.
  {
    id: 12,
    name: 'Colour Guard',
    world: W,
    spike: true,
    hint: '顏色先擺一邊——這關要先把層架那側清乾淨',
    pins: [
      { id: 's1', x: 68, y: 24, len: 18, thick: 3 },
      { id: 's2', x: 68, y: 48, len: 18, thick: 3 },
      { id: 's3', x: 68, y: 72, len: 18, thick: 3 },
      { id: 'gshelf', x: 32, y: 60, len: 20, thick: 3, releases: ['ghelp'] },
      { id: 'ghelp', x: 32, y: 40, len: 18, thick: 3 },
    ],
    walls: [
      { x: 50, y: 100, w: 3, h: 60 },
      { x: 32, y: 84, w: 26, h: 3, gate: 'cl' },
    ],
    emitters: [
      { x: 68, y: 15, w: 14, h: 8, count: 7 },
      { x: 68, y: 39, w: 14, h: 8, count: 7 },
      { x: 68, y: 63, w: 14, h: 8, count: 7 },
      { x: 32, y: 50, w: 20, h: 8, count: 7 },
      { x: 32, y: 30, w: 18, h: 8, count: 6 },
    ],
    cups: [
      { id: 'cl', x: 68, y: 126, w: 18, h: 16, need: 18 },
      { id: 'cr', x: 32, y: 132, w: 20, h: 14, need: 11 },
    ],
    hazards: [
      { x: 90, y: 98, w: 12, h: 8, kind: 'lava' },
      { x: 55, y: 98, w: 6, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [5, 6] },
    solution: [
      { pin: 's3', atMs: 200 },
      { pin: 's2', atMs: 2600 },
      { pin: 's1', atMs: 5000 },
      { pin: 'gshelf', atMs: 8400 },
    ],
  },

  // 13 ── twin keystones: two bridges, two cups, outer lava. Leave both bridges.
  {
    id: 13,
    name: 'Twin Keystones',
    world: W,
    spike: true,
    hint: '先由下往上清空一側的層架填滿杯子——閘門才會開，另一側才放得下去',
    pins: [
      { id: 's1', x: 28, y: 24, len: 18, thick: 3 },
      { id: 's2', x: 28, y: 48, len: 18, thick: 3 },
      { id: 's3', x: 28, y: 72, len: 18, thick: 3 },
      { id: 'gshelf', x: 72, y: 60, len: 20, thick: 3, releases: ['ghelp'] },
      { id: 'ghelp', x: 72, y: 40, len: 18, thick: 3 },
    ],
    walls: [
      { x: 50, y: 100, w: 3, h: 60 },
      { x: 72, y: 84, w: 26, h: 3, gate: 'cl' },
    ],
    emitters: [
      { x: 28, y: 15, w: 14, h: 8, count: 7 },
      { x: 28, y: 39, w: 14, h: 8, count: 7 },
      { x: 28, y: 63, w: 14, h: 8, count: 7 },
      { x: 72, y: 50, w: 20, h: 8, count: 7 },
      { x: 72, y: 30, w: 18, h: 8, count: 6 },
    ],
    cups: [
      { id: 'cl', x: 28, y: 126, w: 18, h: 16, need: 18 },
      { id: 'cr', x: 72, y: 132, w: 20, h: 14, need: 11 },
    ],
    hazards: [
      { x: 10, y: 98, w: 12, h: 8, kind: 'lava' },
      { x: 45, y: 98, w: 6, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [5, 6] },
    solution: [
      { pin: 's3', atMs: 200 },
      { pin: 's2', atMs: 2600 },
      { pin: 's1', atMs: 5000 },
      { pin: 'gshelf', atMs: 8400 },
    ],
  },

  // 14 ── two sweeping voids over a funnel.
  {
    id: 14,
    name: 'Double Sweep',
    world: W,
    hint: '兩層都載滿了——先放下面那層，順序反了會被埋',
    pins: [
      { id: 'up', x: 38, y: 30, len: 24, thick: 3 },
      { id: 'down', x: 38, y: 66, len: 24, thick: 3 },
    ],
    walls: [],
    emitters: [
      { x: 38, y: 20, w: 20, h: 9, count: 12 },
      { x: 38, y: 56, w: 20, h: 9, count: 12 },
    ],
    cups: [{ id: 'c', x: 38, y: 130, w: 24, h: 16, need: 18 }],
    hazards: [
      { x: 13, y: 104, w: 22, h: 8, kind: 'void' },
      { x: 70, y: 104, w: 26, h: 8, kind: 'void' },
    ],
    stars: { pulls: [2, 3] },
    solution: [
      { pin: 'down', atMs: 200 },
      { pin: 'up', atMs: 3000 },
    ],
  },

  // 15 ── ordered release: clear the shelf before opening the flood.
  {
    id: 15,
    name: 'Clear the Shelf',
    world: W,
    spike: true,
    hint: '三層架子＋一道閘門：先把左邊填滿，右邊才通',
    pins: [
      { id: 's1', x: 72, y: 24, len: 18, thick: 3 },
      { id: 's2', x: 72, y: 48, len: 18, thick: 3 },
      { id: 's3', x: 72, y: 72, len: 18, thick: 3 },
      { id: 'gshelf', x: 28, y: 60, len: 20, thick: 3 },
    ],
    walls: [
      { x: 50, y: 100, w: 3, h: 60 },
      { x: 28, y: 84, w: 26, h: 3, gate: 'cl' },
    ],
    emitters: [
      { x: 72, y: 15, w: 14, h: 8, count: 7 },
      { x: 72, y: 39, w: 14, h: 8, count: 7 },
      { x: 72, y: 63, w: 14, h: 8, count: 7 },
      { x: 28, y: 50, w: 20, h: 8, count: 7 },
    ],
    cups: [
      { id: 'cl', x: 72, y: 126, w: 18, h: 16, need: 18 },
      { id: 'cr', x: 28, y: 132, w: 20, h: 14, need: 5 },
    ],
    hazards: [
      { x: 90, y: 98, w: 12, h: 8, kind: 'lava' },
      { x: 55, y: 98, w: 6, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [4, 5] },
    solution: [
      { pin: 's3', atMs: 200 },
      { pin: 's2', atMs: 2600 },
      { pin: 's1', atMs: 5000 },
      { pin: 'gshelf', atMs: 8400 },
    ],
  },

  // 16 ── two colours across a drifting void.
  {
    id: 16,
    name: 'Void Crossing',
    world: W,
    hint: '先移開斜坡，兩種顏色才會各自落到自己那側',
    pins: [
      { id: 'holdA', x: 34, y: 26, len: 20, thick: 3 },
      { id: 'holdB', x: 66, y: 26, len: 20, thick: 3 },
      { id: 'diverter', x: 46, y: 60, len: 60, thick: 4, angle: -0.45 },
    ],
    walls: [
      { x: 38, y: 98, w: 28, h: 4, angle: -0.5 },
      { x: 62, y: 98, w: 28, h: 4, angle: 0.5 },
    ],
    emitters: [
      { x: 34, y: 16, w: 18, h: 9, count: 18, color: 'gold' },
      { x: 66, y: 16, w: 18, h: 9, count: 18, color: 'rose' },
    ],
    cups: [
      { id: 'ca', x: 15, y: 132, w: 22, h: 16, need: 9, color: 'gold' },
      { id: 'cb', x: 85, y: 132, w: 22, h: 16, need: 9, color: 'rose' },
    ],
    hazards: [{ x: 50, y: 134, w: 22, h: 9, kind: 'void' }],
    stars: { pulls: [3, 3] },
    solution: [
      { pin: 'diverter', atMs: 200 },
      { pin: 'holdA', atMs: 1600 },
      { pin: 'holdB', atMs: 3200 },
    ],
  },

  // 17 ── three colours, three cups.
  {
    id: 17,
    name: 'Rainbow Row',
    world: W,
    spike: true,
    hint: '兩段機關——先解開有層架那側，閘門才會讓另一邊過',
    pins: [
      { id: 's1', x: 28, y: 24, len: 18, thick: 3 },
      { id: 's2', x: 28, y: 48, len: 18, thick: 3 },
      { id: 'gshelf', x: 72, y: 60, len: 20, thick: 3, releases: ['ghelp'] },
      { id: 'ghelp', x: 72, y: 40, len: 18, thick: 3 },
    ],
    walls: [
      { x: 50, y: 100, w: 3, h: 60 },
      { x: 72, y: 84, w: 26, h: 3, gate: 'cl' },
    ],
    emitters: [
      { x: 28, y: 15, w: 14, h: 8, count: 7 },
      { x: 28, y: 39, w: 14, h: 8, count: 7 },
      { x: 72, y: 50, w: 20, h: 8, count: 7 },
      { x: 72, y: 30, w: 18, h: 8, count: 6 },
    ],
    cups: [
      { id: 'cl', x: 28, y: 126, w: 18, h: 16, need: 11 },
      { id: 'cr', x: 72, y: 132, w: 20, h: 14, need: 11 },
    ],
    hazards: [
      { x: 10, y: 98, w: 12, h: 8, kind: 'void' },
      { x: 45, y: 98, w: 6, h: 8, kind: 'void' },
    ],
    stars: { pulls: [4, 5] },
    solution: [
      { pin: 's2', atMs: 200 },
      { pin: 's1', atMs: 2600 },
      { pin: 'gshelf', atMs: 6000 },
    ],
  },

  // 18 ── colour + bridge: each colour rides its own bridge to its cup. Pull a
  //      bridge and that colour spills into the lava right below it.
  {
    id: 18,
    name: 'Colour Bridges',
    world: W,
    hint: '斜坡擋在中間——拔掉它，顏色才分得開',
    pins: [
      { id: 'holdA', x: 34, y: 30, len: 20, thick: 3 },
      { id: 'holdB', x: 66, y: 30, len: 20, thick: 3 },
      { id: 'diverter', x: 54, y: 64, len: 60, thick: 4, angle: 0.45 },
    ],
    walls: [
      { x: 38, y: 98, w: 28, h: 4, angle: -0.5 },
      { x: 62, y: 98, w: 28, h: 4, angle: 0.5 },
    ],
    emitters: [
      { x: 34, y: 20, w: 18, h: 9, count: 18, color: 'rose' },
      { x: 66, y: 20, w: 18, h: 9, count: 18, color: 'aqua' },
    ],
    cups: [
      { id: 'ca', x: 15, y: 132, w: 22, h: 16, need: 9, color: 'rose' },
      { id: 'cb', x: 85, y: 132, w: 22, h: 16, need: 9, color: 'aqua' },
    ],
    hazards: [{ x: 50, y: 134, w: 22, h: 9, kind: 'lava' }],
    stars: { pulls: [3, 3] },
    solution: [
      { pin: 'diverter', atMs: 200 },
      { pin: 'holdA', atMs: 1600 },
      { pin: 'holdB', atMs: 3200 },
    ],
  },

  // 19 ── one huge pour: fill the big cup.
  {
    id: 19,
    name: 'Avalanche',
    world: W,
    hint: '上面是一整片洪水——先讓下層走乾淨再放它下來',
    pins: [
      { id: 'top', x: 50, y: 24, len: 26, thick: 3 },
      { id: 'mid', x: 50, y: 60, len: 24, thick: 3 },
    ],
    walls: [],
    emitters: [
      { x: 50, y: 14, w: 22, h: 9, count: 16 },
      { x: 50, y: 50, w: 20, h: 9, count: 14 },
    ],
    cups: [{ id: 'c', x: 50, y: 132, w: 26, h: 14, need: 22 }],
    hazards: [
      { x: 14, y: 110, w: 26, h: 9, kind: 'lava' },
      { x: 86, y: 110, w: 26, h: 9, kind: 'lava' },
    ],
    stars: { pulls: [2, 3] },
    solution: [
      { pin: 'mid', atMs: 200 },
      { pin: 'top', atMs: 3200 },
    ],
  },

  // 20 ── grand finale: a big fountain split, a drifting black hole in the
  //      middle and lava on the flanks. Land the arcs cleanly. Good luck ✦
  {
    id: 20,
    name: 'Grand Finale',
    world: W,
    spike: true,
    hint: '終章機關：由下往上清層架、填滿杯子開閘，最後放行連鎖那疊',
    pins: [
      { id: 's1', x: 72, y: 24, len: 18, thick: 3 },
      { id: 's2', x: 72, y: 48, len: 18, thick: 3 },
      { id: 's3', x: 72, y: 72, len: 18, thick: 3 },
      { id: 'gshelf', x: 28, y: 60, len: 20, thick: 3, releases: ['ghelp'] },
      { id: 'ghelp', x: 28, y: 40, len: 18, thick: 3 },
    ],
    walls: [
      { x: 50, y: 100, w: 3, h: 60 },
      { x: 28, y: 84, w: 26, h: 3, gate: 'cl' },
    ],
    emitters: [
      { x: 72, y: 15, w: 14, h: 8, count: 7 },
      { x: 72, y: 39, w: 14, h: 8, count: 7 },
      { x: 72, y: 63, w: 14, h: 8, count: 7 },
      { x: 28, y: 50, w: 20, h: 8, count: 7 },
      { x: 28, y: 30, w: 18, h: 8, count: 6 },
    ],
    cups: [
      { id: 'cl', x: 72, y: 126, w: 18, h: 16, need: 18 },
      { id: 'cr', x: 28, y: 132, w: 20, h: 14, need: 11 },
    ],
    hazards: [
      { x: 90, y: 98, w: 12, h: 8, kind: 'lava' },
      { x: 55, y: 98, w: 6, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [5, 6] },
    solution: [
      { pin: 's3', atMs: 200 },
      { pin: 's2', atMs: 2600 },
      { pin: 's1', atMs: 5000 },
      { pin: 'gshelf', atMs: 8400 },
    ],
  },

  // ── Chapter 3 "Machine" (21–25) — complex, multi-step dependency puzzles. ──
  // Playtest feedback: "太簡單、不用動腦." These levels answer it. Each defeats
  // the rote rule ("pull the flat pins top-to-bottom") because the correct
  // order is the OPPOSITE — release bottom-up, or a loaded shelf gets buried
  // and its overflow spills into the lava. Supply is tuned close to demand, so
  // one careless spill loses. Verified in src/rote.test.ts.

  // 21 ── Cascade: three shelves stacked over lava. Release bottom-up
  //       (s3→s2→s1); pull a higher shelf first and it buries the loaded one
  //       below, whose overflow spills off the sides into the lava.
  {
    id: 21,
    name: 'Cascade',
    spike: true,
    world: W,
    hint: '三層架子疊在岩漿上——由下往上拔，先放最底那層',
    pins: [
      { id: 's1', x: 50, y: 30, len: 22, thick: 3 },
      { id: 's2', x: 50, y: 58, len: 22, thick: 3 },
      { id: 's3', x: 50, y: 86, len: 22, thick: 3 },
    ],
    walls: [],
    emitters: [
      { x: 50, y: 20, w: 18, h: 9, count: 8 },
      { x: 50, y: 48, w: 18, h: 9, count: 8 },
      { x: 50, y: 76, w: 18, h: 9, count: 8 },
    ],
    cups: [{ id: 'c', x: 50, y: 130, w: 22, h: 16, need: 22 }],
    hazards: [
      { x: 18, y: 100, w: 20, h: 8, kind: 'lava' },
      { x: 82, y: 100, w: 20, h: 8, kind: 'lava' },
      { x: 18, y: 128, w: 16, h: 8, kind: 'lava' },
      { x: 82, y: 128, w: 16, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [3, 4] },
    solution: [
      { pin: 's3', atMs: 200 },
      { pin: 's2', atMs: 2600 },
      { pin: 's1', atMs: 5200 },
    ],
  },

  // 22 ── Lock & Key: GATE dependency. The left cascade fills the key cup `ck`;
  //       filling it opens a gate that drops the pile parked on it into `cm`.
  //       Two dependent stages — botch the order trap and the gate never opens.
  {
    id: 22,
    name: 'Lock & Key',
    spike: true,
    world: W,
    hint: '由下往上填滿左邊的鑰匙杯，右邊閘門才會開，把星塵放進去',
    pins: [
      { id: 's1', x: 30, y: 26, len: 20, thick: 3 },
      { id: 's2', x: 30, y: 52, len: 20, thick: 3 },
      { id: 's3', x: 30, y: 78, len: 20, thick: 3 },
    ],
    walls: [
      { x: 52, y: 104, w: 3, h: 70 }, // divider protects the gate column
      { x: 76, y: 72, w: 28, h: 3, gate: 'ck' },
    ],
    emitters: [
      { x: 30, y: 16, w: 16, h: 9, count: 8 },
      { x: 30, y: 42, w: 16, h: 9, count: 8 },
      { x: 30, y: 68, w: 16, h: 9, count: 8 },
      { x: 76, y: 58, w: 24, h: 10, count: 14 }, // pile parked on the gate
    ],
    cups: [
      { id: 'ck', x: 30, y: 128, w: 20, h: 16, need: 22 },
      { id: 'cm', x: 76, y: 128, w: 24, h: 16, need: 12 },
    ],
    hazards: [
      { x: 10, y: 100, w: 14, h: 8, kind: 'lava' },
      { x: 46, y: 100, w: 8, h: 8, kind: 'lava' },
      { x: 10, y: 128, w: 12, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [3, 4] },
    solution: [
      { pin: 's3', atMs: 200 },
      { pin: 's2', atMs: 2600 },
      { pin: 's1', atMs: 5200 },
    ],
  },

  // 23 ── Chain Reaction: four shelves, bottom-up. `trigger` CHAIN-releases
  //       `catch` a beat later, so the bottom pair clears with one pull — but
  //       the order (trigger→mid→flood) is still strict.
  {
    id: 23,
    name: 'Chain Reaction',
    spike: true,
    world: W,
    hint: '拔那根會連鎖鬆開下一層——一樣由下往上，別讓上層壓垮下層',
    pins: [
      { id: 'flood', x: 50, y: 26, len: 22, thick: 3 },
      { id: 'mid', x: 50, y: 50, len: 22, thick: 3 },
      { id: 'trigger', x: 50, y: 72, len: 22, thick: 3, releases: ['catch'] },
      { id: 'catch', x: 50, y: 92, len: 22, thick: 3 },
    ],
    walls: [],
    emitters: [
      { x: 50, y: 17, w: 16, h: 8, count: 8 },
      { x: 50, y: 41, w: 16, h: 8, count: 8 },
      { x: 50, y: 63, w: 16, h: 8, count: 8 },
      { x: 50, y: 84, w: 16, h: 8, count: 8 },
    ],
    cups: [{ id: 'c', x: 50, y: 132, w: 22, h: 14, need: 30 }],
    hazards: [
      { x: 18, y: 106, w: 20, h: 8, kind: 'lava' },
      { x: 82, y: 106, w: 20, h: 8, kind: 'lava' },
      { x: 18, y: 130, w: 14, h: 8, kind: 'lava' },
      { x: 82, y: 130, w: 14, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [3, 4] },
    solution: [
      { pin: 'trigger', atMs: 200 },
      { pin: 'mid', atMs: 2800 },
      { pin: 'flood', atMs: 5400 },
    ],
  },

  // 24 ── Twin Locks: the central pile is parked on TWO stacked gates and only
  //       reaches `cm` once BOTH side keys fill (gateA:ck1, gateB:ck2). Each key
  //       is its own order trap — solve both cleanly or the pile stays locked.
  {
    id: 24,
    name: 'Twin Locks',
    spike: true,
    world: W,
    hint: '中間那堆鎖著兩道閘——左右兩個鑰匙杯都要填滿才放得出來',
    pins: [
      { id: 'lf', x: 18, y: 26, len: 14, thick: 3 },
      { id: 'lh', x: 18, y: 50, len: 14, thick: 3 },
      { id: 'rf', x: 82, y: 26, len: 14, thick: 3 },
      { id: 'rh', x: 82, y: 50, len: 14, thick: 3 },
    ],
    walls: [
      { x: 34, y: 100, w: 3, h: 60 },
      { x: 66, y: 100, w: 3, h: 60 },
      { x: 50, y: 58, w: 24, h: 3, gate: 'ck1' },
      { x: 50, y: 86, w: 24, h: 3, gate: 'ck2' },
    ],
    emitters: [
      { x: 18, y: 16, w: 12, h: 9, count: 6 },
      { x: 18, y: 40, w: 12, h: 9, count: 10 },
      { x: 82, y: 16, w: 12, h: 9, count: 6 },
      { x: 82, y: 40, w: 12, h: 9, count: 10 },
      { x: 50, y: 46, w: 20, h: 9, count: 14 }, // central pile on gateA
    ],
    cups: [
      { id: 'ck1', x: 18, y: 128, w: 18, h: 16, need: 9 },
      { id: 'ck2', x: 82, y: 128, w: 18, h: 16, need: 9 },
      { id: 'cm', x: 50, y: 130, w: 22, h: 14, need: 12 },
    ],
    hazards: [
      { x: 5, y: 96, w: 8, h: 8, kind: 'lava' },
      { x: 32, y: 96, w: 6, h: 8, kind: 'lava' },
      { x: 95, y: 96, w: 8, h: 8, kind: 'lava' },
      { x: 68, y: 96, w: 6, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [4, 5] },
    solution: [
      { pin: 'lh', atMs: 200 },
      { pin: 'rh', atMs: 500 },
      { pin: 'lf', atMs: 3200 },
      { pin: 'rf', atMs: 3500 },
    ],
  },

  // 25 ── The Machine (finale): order cascade on the left fills `cl`, which
  //       opens the gate sealing the right route; then a CHAIN pull (`rshelf`
  //       releases `rhelp`) drops the right piles into `cr`. Cascade + gate +
  //       chain in one contraption.
  {
    id: 25,
    name: 'The Machine',
    spike: true,
    world: W,
    hint: '先由下往上填滿左杯開閘，再拔右邊那根把整疊放下去',
    pins: [
      { id: 's1', x: 30, y: 24, len: 18, thick: 3 },
      { id: 's2', x: 30, y: 48, len: 18, thick: 3 },
      { id: 's3', x: 30, y: 72, len: 18, thick: 3 },
      { id: 'rshelf', x: 74, y: 60, len: 20, thick: 3, releases: ['rhelp'] },
      { id: 'rhelp', x: 74, y: 40, len: 18, thick: 3 },
    ],
    walls: [
      { x: 52, y: 100, w: 3, h: 60 },
      { x: 74, y: 84, w: 26, h: 3, gate: 'cl' },
    ],
    emitters: [
      { x: 30, y: 15, w: 14, h: 8, count: 7 },
      { x: 30, y: 39, w: 14, h: 8, count: 7 },
      { x: 30, y: 63, w: 14, h: 8, count: 7 },
      { x: 74, y: 50, w: 20, h: 8, count: 7 }, // pile on rshelf
      { x: 74, y: 30, w: 18, h: 8, count: 6 }, // pile on rhelp (chained)
    ],
    cups: [
      { id: 'cl', x: 30, y: 126, w: 18, h: 16, need: 18 },
      { id: 'cr', x: 74, y: 132, w: 20, h: 14, need: 11 },
    ],
    hazards: [
      { x: 10, y: 98, w: 12, h: 8, kind: 'lava' },
      { x: 47, y: 98, w: 6, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [4, 5] },
    solution: [
      { pin: 's3', atMs: 200 },
      { pin: 's2', atMs: 2600 },
      { pin: 's1', atMs: 5000 },
      { pin: 'rshelf', atMs: 8200 },
    ],
  },

  // ── Chapter 4 "Voyage" (26–36) — longer routes across the whole board. ──
  // Authored against the measured harness (real GameSim): every level's solution
  // is verified winnable, every declared trap verified to actually lose the
  // level, and each ✦ spike verified to defeat the rote rule. Cadence: flow
  // levels with spikes at 29 / 33 / 36.

  {
    id: 26,
    name: 'Long Fall',
    world: W,
    hint: '長長的斜坡把整條流導向一側——先拆掉它再放星塵下來',
    pins: [
      { id: 'hold', x: 50, y: 26, len: 30, thick: 3 },
      { id: 'diverter', x: 42, y: 58, len: 40, thick: 4, angle: -0.45 },
    ],
    walls: [
      { x: 40, y: 94, w: 28, h: 4, angle: -0.5 },
      { x: 60, y: 94, w: 28, h: 4, angle: 0.5 },
    ],
    emitters: [{ x: 50, y: 16, w: 22, h: 10, count: 32 }],
    cups: [
      { id: 'cl', x: 16, y: 128, w: 24, h: 18, need: 10 },
      { id: 'cr', x: 84, y: 128, w: 24, h: 18, need: 10 },
    ],
    hazards: [{ x: 50, y: 130, w: 24, h: 9, kind: 'lava' }],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'diverter', atMs: 200 },
      { pin: 'hold', atMs: 1600 },
    ],
  },

  {
    id: 27,
    name: 'Double Span',
    world: W,
    spike: true,
    hint: '兩區各一半：先做層架，閘門才會為另一半開',
    pins: [
      { id: 's1', x: 32, y: 24, len: 18, thick: 3 },
      { id: 's2', x: 32, y: 48, len: 18, thick: 3 },
      { id: 's3', x: 32, y: 72, len: 18, thick: 3 },
      { id: 'gshelf', x: 68, y: 60, len: 20, thick: 3, releases: ['ghelp'] },
      { id: 'ghelp', x: 68, y: 40, len: 18, thick: 3 },
    ],
    walls: [
      { x: 50, y: 100, w: 3, h: 60 },
      { x: 68, y: 84, w: 26, h: 3, gate: 'cl' },
    ],
    emitters: [
      { x: 32, y: 15, w: 14, h: 8, count: 7 },
      { x: 32, y: 39, w: 14, h: 8, count: 7 },
      { x: 32, y: 63, w: 14, h: 8, count: 7 },
      { x: 68, y: 50, w: 20, h: 8, count: 7 },
      { x: 68, y: 30, w: 18, h: 8, count: 6 },
    ],
    cups: [
      { id: 'cl', x: 32, y: 126, w: 18, h: 16, need: 18 },
      { id: 'cr', x: 68, y: 132, w: 20, h: 14, need: 11 },
    ],
    hazards: [
      { x: 10, y: 98, w: 12, h: 8, kind: 'lava' },
      { x: 45, y: 98, w: 6, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [5, 6] },
    solution: [
      { pin: 's3', atMs: 200 },
      { pin: 's2', atMs: 2600 },
      { pin: 's1', atMs: 5000 },
      { pin: 'gshelf', atMs: 8400 },
    ],
  },

  {
    id: 28,
    name: 'Stepping Stones',
    world: W,
    spike: true,
    hint: '分成兩區：一區由下往上，另一區等閘門開',
    pins: [
      { id: 's1', x: 72, y: 24, len: 18, thick: 3 },
      { id: 's2', x: 72, y: 48, len: 18, thick: 3 },
      { id: 's3', x: 72, y: 72, len: 18, thick: 3 },
      { id: 'gshelf', x: 28, y: 60, len: 20, thick: 3, releases: ['ghelp'] },
      { id: 'ghelp', x: 28, y: 40, len: 18, thick: 3 },
    ],
    walls: [
      { x: 50, y: 100, w: 3, h: 60 },
      { x: 28, y: 84, w: 26, h: 3, gate: 'cl' },
    ],
    emitters: [
      { x: 72, y: 15, w: 14, h: 8, count: 7 },
      { x: 72, y: 39, w: 14, h: 8, count: 7 },
      { x: 72, y: 63, w: 14, h: 8, count: 7 },
      { x: 28, y: 50, w: 20, h: 8, count: 7 },
      { x: 28, y: 30, w: 18, h: 8, count: 6 },
    ],
    cups: [
      { id: 'cl', x: 72, y: 126, w: 18, h: 16, need: 18 },
      { id: 'cr', x: 28, y: 132, w: 20, h: 14, need: 11 },
    ],
    hazards: [
      { x: 90, y: 98, w: 12, h: 8, kind: 'void' },
      { x: 55, y: 98, w: 6, h: 8, kind: 'void' },
    ],
    stars: { pulls: [5, 6] },
    solution: [
      { pin: 's3', atMs: 200 },
      { pin: 's2', atMs: 2600 },
      { pin: 's1', atMs: 5000 },
      { pin: 'gshelf', atMs: 8400 },
    ],
  },

  {
    id: 29,
    name: 'Twin Cascade',
    world: W,
    spike: true,
    hint: '兩層架子疊在岩漿之間——先放下面那層，順序反了就溢出去',
    pins: [
      { id: 'top', x: 50, y: 34, len: 24, thick: 3 },
      { id: 'low', x: 50, y: 70, len: 24, thick: 3 },
    ],
    walls: [],
    emitters: [
      { x: 50, y: 24, w: 20, h: 9, count: 10 },
      { x: 50, y: 60, w: 20, h: 9, count: 10 },
    ],
    cups: [{ id: 'c', x: 50, y: 128, w: 24, h: 18, need: 17 }],
    hazards: [
      { x: 16, y: 104, w: 22, h: 8, kind: 'lava' },
      { x: 84, y: 104, w: 22, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [2, 3] },
    solution: [
      { pin: 'low', atMs: 200 },
      { pin: 'top', atMs: 2800 },
    ],
  },

  {
    id: 30,
    name: 'Mirror Spans',
    world: W,
    spike: true,
    hint: '左右各一半——先做完層架那半',
    pins: [
      { id: 's1', x: 28, y: 24, len: 18, thick: 3 },
      { id: 's2', x: 28, y: 48, len: 18, thick: 3 },
      { id: 's3', x: 28, y: 72, len: 18, thick: 3 },
      { id: 'gshelf', x: 72, y: 60, len: 20, thick: 3, releases: ['ghelp'] },
      { id: 'ghelp', x: 72, y: 40, len: 18, thick: 3 },
    ],
    walls: [
      { x: 50, y: 100, w: 3, h: 60 },
      { x: 72, y: 84, w: 26, h: 3, gate: 'cl' },
    ],
    emitters: [
      { x: 28, y: 15, w: 14, h: 8, count: 7 },
      { x: 28, y: 39, w: 14, h: 8, count: 7 },
      { x: 28, y: 63, w: 14, h: 8, count: 7 },
      { x: 72, y: 50, w: 20, h: 8, count: 7 },
      { x: 72, y: 30, w: 18, h: 8, count: 6 },
    ],
    cups: [
      { id: 'cl', x: 28, y: 126, w: 18, h: 16, need: 18 },
      { id: 'cr', x: 72, y: 132, w: 20, h: 14, need: 11 },
    ],
    hazards: [
      { x: 10, y: 98, w: 12, h: 8, kind: 'void' },
      { x: 45, y: 98, w: 6, h: 8, kind: 'void' },
    ],
    stars: { pulls: [5, 6] },
    solution: [
      { pin: 's3', atMs: 200 },
      { pin: 's2', atMs: 2600 },
      { pin: 's1', atMs: 5000 },
      { pin: 'gshelf', atMs: 8400 },
    ],
  },

  {
    id: 31,
    name: 'Slow Sweep',
    world: W,
    hint: '斜坡加上游走的岩漿——先處理斜坡',
    pins: [
      { id: 'hold', x: 50, y: 26, len: 30, thick: 3 },
      { id: 'diverter', x: 56, y: 58, len: 42, thick: 4, angle: 0.45 },
    ],
    walls: [
      { x: 40, y: 94, w: 30, h: 4, angle: -0.5 },
      { x: 60, y: 94, w: 30, h: 4, angle: 0.5 },
    ],
    emitters: [{ x: 50, y: 16, w: 22, h: 10, count: 32 }],
    cups: [
      { id: 'cl', x: 16, y: 130, w: 24, h: 16, need: 10 },
      { id: 'cr', x: 84, y: 130, w: 24, h: 16, need: 10 },
    ],
    hazards: [{ x: 50, y: 118, w: 20, h: 8, kind: 'lava', moveX: 1.0, moveRange: 12 }],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'diverter', atMs: 200 },
      { pin: 'hold', atMs: 1600 },
    ],
  },

  {
    id: 32,
    name: 'Two Rivers',
    world: W,
    spike: true,
    hint: '兩條河被閘門隔開——先填滿一邊',
    pins: [
      { id: 's1', x: 76, y: 24, len: 18, thick: 3 },
      { id: 's2', x: 76, y: 48, len: 18, thick: 3 },
      { id: 's3', x: 76, y: 72, len: 18, thick: 3 },
      { id: 'gshelf', x: 24, y: 60, len: 20, thick: 3, releases: ['ghelp'] },
      { id: 'ghelp', x: 24, y: 40, len: 18, thick: 3 },
    ],
    walls: [
      { x: 50, y: 100, w: 3, h: 60 },
      { x: 24, y: 84, w: 26, h: 3, gate: 'cl' },
    ],
    emitters: [
      { x: 76, y: 15, w: 14, h: 8, count: 7 },
      { x: 76, y: 39, w: 14, h: 8, count: 7 },
      { x: 76, y: 63, w: 14, h: 8, count: 7 },
      { x: 24, y: 50, w: 20, h: 8, count: 7 },
      { x: 24, y: 30, w: 18, h: 8, count: 6 },
    ],
    cups: [
      { id: 'cl', x: 76, y: 126, w: 18, h: 16, need: 18 },
      { id: 'cr', x: 24, y: 132, w: 20, h: 14, need: 11 },
    ],
    hazards: [
      { x: 90, y: 98, w: 12, h: 8, kind: 'lava' },
      { x: 55, y: 98, w: 6, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [5, 6] },
    solution: [
      { pin: 's3', atMs: 200 },
      { pin: 's2', atMs: 2600 },
      { pin: 's1', atMs: 5000 },
      { pin: 'gshelf', atMs: 8400 },
    ],
  },

  {
    id: 33,
    name: 'Side Key',
    world: W,
    spike: true,
    hint: '鑰匙杯填滿才會開閘；順序錯了星塵就不夠',
    pins: [
      { id: 's1', x: 28, y: 24, len: 18, thick: 3 },
      { id: 's2', x: 28, y: 48, len: 18, thick: 3 },
      { id: 's3', x: 28, y: 72, len: 18, thick: 3 },
      { id: 'gshelf', x: 72, y: 60, len: 20, thick: 3, releases: ['ghelp'] },
      { id: 'ghelp', x: 72, y: 40, len: 18, thick: 3 },
    ],
    walls: [
      { x: 50, y: 100, w: 3, h: 60 },
      { x: 72, y: 84, w: 26, h: 3, gate: 'cl' },
    ],
    emitters: [
      { x: 28, y: 15, w: 14, h: 8, count: 7 },
      { x: 28, y: 39, w: 14, h: 8, count: 7 },
      { x: 28, y: 63, w: 14, h: 8, count: 7 },
      { x: 72, y: 50, w: 20, h: 8, count: 7 },
      { x: 72, y: 30, w: 18, h: 8, count: 6 },
    ],
    cups: [
      { id: 'cl', x: 28, y: 126, w: 18, h: 16, need: 18 },
      { id: 'cr', x: 72, y: 132, w: 20, h: 14, need: 11 },
    ],
    hazards: [
      { x: 10, y: 98, w: 12, h: 8, kind: 'lava' },
      { x: 45, y: 98, w: 6, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [5, 6] },
    solution: [
      { pin: 's3', atMs: 200 },
      { pin: 's2', atMs: 2600 },
      { pin: 's1', atMs: 5000 },
      { pin: 'gshelf', atMs: 8400 },
    ],
  },

  {
    id: 34,
    name: 'Crossfire',
    world: W,
    hint: '黑洞在下面游走，而斜坡把整條流送去同一邊——先處理斜坡',
    pins: [
      { id: 'hold', x: 50, y: 26, len: 30, thick: 3 },
      { id: 'diverter', x: 58, y: 58, len: 40, thick: 4, angle: 0.45 },
    ],
    walls: [
      { x: 40, y: 94, w: 28, h: 4, angle: -0.5 },
      { x: 60, y: 94, w: 28, h: 4, angle: 0.5 },
    ],
    emitters: [{ x: 50, y: 16, w: 22, h: 10, count: 34 }],
    cups: [
      { id: 'cl', x: 16, y: 130, w: 24, h: 16, need: 10 },
      { id: 'cr', x: 84, y: 130, w: 24, h: 16, need: 10 },
    ],
    hazards: [{ x: 50, y: 120, w: 20, h: 8, kind: 'void', moveX: 1.2, moveRange: 12 }],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'diverter', atMs: 200 },
      { pin: 'hold', atMs: 1600 },
    ],
  },

  {
    id: 35,
    name: 'Unzip',
    world: W,
    spike: true,
    hint: '連鎖＋閘門的雙段機關——一步錯就補不回來',
    pins: [
      { id: 's1', x: 72, y: 24, len: 18, thick: 3 },
      { id: 's2', x: 72, y: 48, len: 18, thick: 3 },
      { id: 's3', x: 72, y: 72, len: 18, thick: 3 },
      { id: 'gshelf', x: 28, y: 60, len: 20, thick: 3, releases: ['ghelp'] },
      { id: 'ghelp', x: 28, y: 40, len: 18, thick: 3 },
    ],
    walls: [
      { x: 50, y: 100, w: 3, h: 60 },
      { x: 28, y: 84, w: 26, h: 3, gate: 'cl' },
    ],
    emitters: [
      { x: 72, y: 15, w: 14, h: 8, count: 7 },
      { x: 72, y: 39, w: 14, h: 8, count: 7 },
      { x: 72, y: 63, w: 14, h: 8, count: 7 },
      { x: 28, y: 50, w: 20, h: 8, count: 7 },
      { x: 28, y: 30, w: 18, h: 8, count: 6 },
    ],
    cups: [
      { id: 'cl', x: 72, y: 126, w: 18, h: 16, need: 18 },
      { id: 'cr', x: 28, y: 132, w: 20, h: 14, need: 11 },
    ],
    hazards: [
      { x: 90, y: 98, w: 12, h: 8, kind: 'lava' },
      { x: 55, y: 98, w: 6, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [5, 6] },
    solution: [
      { pin: 's3', atMs: 200 },
      { pin: 's2', atMs: 2600 },
      { pin: 's1', atMs: 5000 },
      { pin: 'gshelf', atMs: 8400 },
    ],
  },

  {
    id: 36,
    name: 'Deep Cascade',
    world: W,
    spike: true,
    hint: '三層疊在岩漿走廊上——由下往上拔，一步都不能顛倒',
    pins: [
      { id: 's1', x: 50, y: 28, len: 22, thick: 3 },
      { id: 's2', x: 50, y: 56, len: 22, thick: 3 },
      { id: 's3', x: 50, y: 84, len: 22, thick: 3 },
    ],
    walls: [],
    emitters: [
      { x: 50, y: 19, w: 18, h: 8, count: 9 },
      { x: 50, y: 47, w: 18, h: 8, count: 9 },
      { x: 50, y: 75, w: 18, h: 8, count: 9 },
    ],
    cups: [{ id: 'c', x: 50, y: 130, w: 24, h: 16, need: 23 }],
    hazards: [
      { x: 15, y: 106, w: 22, h: 8, kind: 'lava' },
      { x: 85, y: 106, w: 22, h: 8, kind: 'lava' },
      { x: 15, y: 132, w: 18, h: 8, kind: 'lava' },
      { x: 85, y: 132, w: 18, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [3, 4] },
    solution: [
      { pin: 's3', atMs: 200 },
      { pin: 's2', atMs: 2800 },
      { pin: 's1', atMs: 5600 },
    ],
  },
]

export const LEVEL_COUNT = LEVELS.length

export function getLevel(id: number): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id)
}
