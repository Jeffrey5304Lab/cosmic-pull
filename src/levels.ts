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
    // Each colour rides its own span out to its matching cup, with lava down
    // the middle. Pull a span and that colour is gone — and only that colour
    // can fill its cup, so it's unrecoverable.
    hint: '顏色要對！每種顏色都靠自己那座橋出去——拔掉就再也補不回來',
    pins: [
      { id: 'g', x: 34, y: 36, len: 22, thick: 3 },
      { id: 'r', x: 66, y: 36, len: 22, thick: 3 },
      { id: 'bg', x: 30, y: 72, len: 38, thick: 4, angle: -0.55 },
      { id: 'br', x: 70, y: 72, len: 38, thick: 4, angle: 0.55 },
    ],
    walls: [],
    emitters: [
      { x: 34, y: 24, w: 18, h: 10, count: 20, color: 'gold' },
      { x: 66, y: 24, w: 18, h: 10, count: 20, color: 'rose' },
    ],
    cups: [
      { id: 'cg', x: 14, y: 124, w: 22, h: 20, need: 10, color: 'gold' },
      { id: 'cr', x: 86, y: 124, w: 22, h: 20, need: 10, color: 'rose' },
    ],
    hazards: [{ x: 50, y: 126, w: 28, h: 10, kind: 'lava' }],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'g', atMs: 200 },
      { pin: 'r', atMs: 400 },
    ],
    traps: ['bg', 'br'],
  },

  // 7 ── fountain: one pile splits over a peak into two cups. One pull, but the
  //      stardust fans out to both sides.
  {
    id: 7,
    name: 'Fountain',
    world: W,
    hint: '星塵撞上尖頂會往兩邊分流，兩杯都要滿',
    pins: [
      { id: 'hold', x: 50, y: 32, len: 38, thick: 3 },
      // The peak that fans the fountain is pullable — and load-bearing. Take a
      // half away and that side's stream drops straight into the void.
      { id: 'peakL', x: 43, y: 60, len: 20, thick: 3, angle: -0.42 },
      { id: 'peakR', x: 57, y: 60, len: 20, thick: 3, angle: 0.42 },
    ],
    walls: [],
    emitters: [{ x: 50, y: 24, w: 22, h: 6, count: 30 }],
    cups: [
      { id: 'cl', x: 24, y: 128, w: 26, h: 20, need: 8 },
      { id: 'cr', x: 76, y: 128, w: 26, h: 20, need: 8 },
    ],
    hazards: [{ x: 50, y: 116, w: 12, h: 9, kind: 'void' }],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'hold', atMs: 200 }],
    traps: ['peakL', 'peakR'],
  },

  // 8 ── moving hazard: time the pour past a sweeping void.
  {
    id: 8,
    name: 'Sweeper',
    world: W,
    // Rebuilt: the cup used to sit directly under the pile, so the "funnel"
    // walls were decoration (pulling one let MORE stardust through) and a
    // monkey won 100% of the time. Now the cup is offset and the span is the
    // only way across — with a void sweeping the gap underneath it.
    hint: '黑洞在下面掃——斜橋是唯一的路，別拔它',
    pins: [
      { id: 'hold', x: 30, y: 42, len: 22, thick: 3 },
      { id: 'span', x: 42, y: 74, len: 44, thick: 4, angle: 0.6 },
    ],
    walls: [],
    emitters: [{ x: 30, y: 28, w: 18, h: 14, count: 26 }],
    cups: [{ id: 'c', x: 76, y: 122, w: 22, h: 20, need: 12 }],
    hazards: [{ x: 32, y: 122, w: 30, h: 10, kind: 'void', moveX: 1.4, moveRange: 10 }],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'hold', atMs: 200 }],
    traps: ['span'],
  },

  // 9 ── funnel past a sweeping lava.
  {
    id: 9,
    name: 'Hot Timing',
    world: W,
    // Mirror of L8 so the read flips (pour right→left) — plus a second shelf:
    // the stream lands on 'shelf' and waits there until you drop it, so this
    // level needs TWO deliberate pulls, not one.
    hint: '岩漿來回掃。先放行，星塵會停在檯子上——抓準空檔再放它下去',
    pins: [
      { id: 'hold', x: 70, y: 42, len: 22, thick: 3 },
      { id: 'span', x: 58, y: 74, len: 44, thick: 4, angle: -0.6 },
      { id: 'shelf', x: 24, y: 104, len: 24, thick: 3 },
    ],
    walls: [],
    emitters: [{ x: 70, y: 28, w: 18, h: 14, count: 30 }],
    cups: [{ id: 'c', x: 24, y: 132, w: 24, h: 16, need: 12 }],
    hazards: [{ x: 60, y: 124, w: 30, h: 9, kind: 'lava', moveX: 1.5, moveRange: 16 }],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'hold', atMs: 200 },
      { pin: 'shelf', atMs: 3200 },
    ],
    traps: ['span'],
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
    spike: true,
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
    hint: '顏色要配對。中間是黑洞，兩座橋各自把顏色送出去——別動它們',
    pins: [
      { id: 'g', x: 34, y: 38, len: 18, thick: 3 },
      { id: 'r', x: 66, y: 38, len: 18, thick: 3 },
      { id: 'bg', x: 30, y: 84, len: 30, thick: 4, angle: -0.55 },
      { id: 'br', x: 70, y: 84, len: 30, thick: 4, angle: 0.55 },
    ],
    walls: [
      { x: 38, y: 112, w: 3, h: 28 },
      { x: 62, y: 112, w: 3, h: 28 },
    ],
    emitters: [
      { x: 34, y: 26, w: 14, h: 12, count: 16, color: 'gold' },
      { x: 66, y: 26, w: 14, h: 12, count: 16, color: 'rose' },
    ],
    cups: [
      { id: 'cg', x: 14, y: 120, w: 22, h: 22, need: 9, color: 'gold' },
      { id: 'cr', x: 86, y: 120, w: 22, h: 22, need: 9, color: 'rose' },
    ],
    hazards: [{ x: 50, y: 128, w: 18, h: 10, kind: 'void' }],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'g', atMs: 200 },
      { pin: 'r', atMs: 400 },
    ],
    traps: ['bg', 'br'],
  },

  // 13 ── twin keystones: two bridges, two cups, outer lava. Leave both bridges.
  {
    id: 13,
    name: 'Twin Keystones',
    world: W,
    hint: '兩座橋各撐一堆——一座都不能拔',
    pins: [
      { id: 'hl', x: 20, y: 38, len: 14, thick: 3 },
      { id: 'hr', x: 80, y: 38, len: 14, thick: 3 },
      { id: 'bl', x: 30, y: 70, len: 34, thick: 4, angle: 0.55 },
      { id: 'br', x: 70, y: 70, len: 34, thick: 4, angle: -0.55 },
    ],
    walls: [],
    emitters: [
      { x: 20, y: 26, w: 12, h: 12, count: 16 },
      { x: 80, y: 26, w: 12, h: 12, count: 16 },
    ],
    cups: [
      { id: 'cl', x: 40, y: 126, w: 18, h: 20, need: 8 },
      { id: 'cr', x: 60, y: 126, w: 18, h: 20, need: 8 },
    ],
    hazards: [
      { x: 16, y: 128, w: 20, h: 10, kind: 'lava' },
      { x: 84, y: 128, w: 20, h: 10, kind: 'lava' },
    ],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'hl', atMs: 200 },
      { pin: 'hr', atMs: 400 },
    ],
    traps: ['bl', 'br'],
  },

  // 14 ── two sweeping voids over a funnel.
  {
    id: 14,
    name: 'Double Sweep',
    world: W,
    spike: true,
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
      { x: 8, y: 104, w: 22, h: 8, kind: 'void' },
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
    hint: '三層架子——由下往上，一層一層清',
    pins: [
      { id: 's1', x: 62, y: 26, len: 22, thick: 3 },
      { id: 's2', x: 62, y: 58, len: 22, thick: 3 },
      { id: 's3', x: 62, y: 90, len: 22, thick: 3 },
    ],
    walls: [],
    emitters: [
      { x: 62, y: 17, w: 18, h: 8, count: 9 },
      { x: 62, y: 49, w: 18, h: 8, count: 9 },
      { x: 62, y: 81, w: 18, h: 8, count: 9 },
    ],
    cups: [{ id: 'c', x: 62, y: 132, w: 24, h: 14, need: 18 }],
    hazards: [
      { x: 30, y: 112, w: 24, h: 8, kind: 'lava' },
      { x: 92, y: 112, w: 18, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [3, 4] },
    solution: [
      { pin: 's3', atMs: 200 },
      { pin: 's2', atMs: 2800 },
      { pin: 's1', atMs: 5600 },
    ],
  },

  // 16 ── two colours across a drifting void.
  {
    id: 16,
    name: 'Void Crossing',
    world: W,
    hint: '兩種顏色各走一座橋出去，中間的黑洞還會游走',
    pins: [
      { id: 'g', x: 32, y: 40, len: 16, thick: 3 },
      { id: 'a', x: 68, y: 40, len: 16, thick: 3 },
      { id: 'bg', x: 30, y: 84, len: 30, thick: 4, angle: -0.55 },
      { id: 'ba', x: 70, y: 84, len: 30, thick: 4, angle: 0.55 },
    ],
    walls: [
      { x: 38, y: 108, w: 3, h: 34 },
      { x: 62, y: 108, w: 3, h: 34 },
    ],
    emitters: [
      { x: 32, y: 28, w: 12, h: 12, count: 16, color: 'gold' },
      { x: 68, y: 28, w: 12, h: 12, count: 16, color: 'aqua' },
    ],
    cups: [
      { id: 'cg', x: 14, y: 120, w: 22, h: 22, need: 8, color: 'gold' },
      { id: 'ca', x: 86, y: 120, w: 22, h: 22, need: 8, color: 'aqua' },
    ],
    hazards: [{ x: 50, y: 104, w: 14, h: 8, kind: 'void', moveX: 1.4, moveRange: 14 }],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'g', atMs: 200 },
      { pin: 'a', atMs: 300 },
    ],
    traps: ['bg', 'ba'],
  },

  // 17 ── three colours, three cups.
  {
    id: 17,
    name: 'Rainbow Row',
    world: W,
    // TODO(redesign): still ~96% monkey-winnable. Making the lane dividers
    // pullable was tried and reverted — with each cup directly under its own
    // pile the colours never actually mix, so the "trap" had no teeth and would
    // have been a fake choice. Needs the offset-cup treatment (see L12/L16).
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

  // 18 ── colour + bridge: each colour rides its own bridge to its cup. Pull a
  //      bridge and that colour spills into the lava right below it.
  {
    id: 18,
    name: 'Colour Bridges',
    world: W,
    hint: '每個顏色靠自己的橋——拔錯橋，那個顏色就沒了',
    pins: [
      { id: 'hg', x: 22, y: 40, len: 14, thick: 3 },
      { id: 'ha', x: 78, y: 40, len: 14, thick: 3 },
      { id: 'bg', x: 30, y: 68, len: 30, thick: 4, angle: 0.5 },
      { id: 'ba', x: 70, y: 68, len: 30, thick: 4, angle: -0.5 },
    ],
    walls: [{ x: 50, y: 100, w: 3, h: 64 }],
    emitters: [
      { x: 22, y: 28, w: 12, h: 10, count: 13, color: 'gold' },
      { x: 78, y: 28, w: 12, h: 10, count: 13, color: 'aqua' },
    ],
    cups: [
      { id: 'cg', x: 40, y: 128, w: 18, h: 20, need: 7, color: 'gold' },
      { id: 'ca', x: 60, y: 128, w: 18, h: 20, need: 7, color: 'aqua' },
    ],
    hazards: [
      { x: 22, y: 132, w: 16, h: 8, kind: 'lava' },
      { x: 78, y: 132, w: 16, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'hg', atMs: 200 },
      { pin: 'ha', atMs: 400 },
    ],
    traps: ['bg', 'ba'],
  },

  // 19 ── one huge pour: fill the big cup.
  {
    id: 19,
    name: 'Avalanche',
    world: W,
    spike: true,
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
    hint: '終章 ✦ 分流、守住兩座橋，左杯滿了才會開門——最後再放行右邊',
    pins: [
      { id: 'hold', x: 50, y: 30, len: 38, thick: 3 },
      // The fountain's split peak is load-bearing: pull either half and the
      // whole pour collapses straight down into the drifting black hole.
      { id: 'splitL', x: 43, y: 58, len: 20, thick: 3, angle: -0.42 },
      { id: 'splitR', x: 57, y: 58, len: 20, thick: 3, angle: 0.42 },
      // The right stream parks on this shelf until you release it — and it can
      // only get anywhere once the gate below has opened.
      { id: 'shelf', x: 78, y: 86, len: 22, thick: 3 },
    ],
    // Gate-on-fill: the right route stays sealed until the LEFT cup is full,
    // so the finale is a genuine two-stage machine, not one tap.
    walls: [{ x: 78, y: 108, w: 26, h: 3, gate: 'cl' }],
    emitters: [{ x: 50, y: 22, w: 22, h: 6, count: 32 }],
    cups: [
      { id: 'cl', x: 24, y: 130, w: 26, h: 20, need: 8 },
      { id: 'cr', x: 78, y: 130, w: 26, h: 20, need: 8 },
    ],
    hazards: [{ x: 50, y: 112, w: 14, h: 8, kind: 'void', moveX: 1.4, moveRange: 12 }],
    stars: { pulls: [2, 3] },
    solution: [
      { pin: 'hold', atMs: 200 },
      { pin: 'shelf', atMs: 4200 },
    ],
    traps: ['splitL', 'splitR'],
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
      { x: 4, y: 96, w: 10, h: 8, kind: 'lava' },
      { x: 32, y: 96, w: 6, h: 8, kind: 'lava' },
      { x: 96, y: 96, w: 10, h: 8, kind: 'lava' },
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
    hint: '一路掉到底——斜橋把星塵接住送到對面，別拔它',
    pins: [
      { id: 'hold', x: 74, y: 34, len: 20, thick: 3 },
      { id: 'catch', x: 58, y: 78, len: 44, thick: 4, angle: -0.55 },
    ],
    walls: [],
    emitters: [{ x: 74, y: 22, w: 18, h: 12, count: 24 }],
    cups: [{ id: 'c', x: 20, y: 126, w: 24, h: 20, need: 12 }],
    hazards: [{ x: 70, y: 128, w: 40, h: 10, kind: 'lava' }],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'hold', atMs: 200 }],
    traps: ['catch'],
  },

  {
    id: 27,
    name: 'Double Span',
    world: W,
    hint: '兩段橋接力，一路送到右下角——兩座都動不得',
    pins: [
      { id: 'hold', x: 24, y: 40, len: 20, thick: 3 },
      { id: 'span1', x: 40, y: 64, len: 40, thick: 4, angle: 0.5 },
      { id: 'span2', x: 66, y: 96, len: 40, thick: 4, angle: 0.5 },
    ],
    walls: [],
    emitters: [{ x: 24, y: 26, w: 18, h: 14, count: 36 }],
    cups: [{ id: 'c', x: 86, y: 124, w: 22, h: 20, need: 12 }],
    hazards: [{ x: 40, y: 126, w: 40, h: 10, kind: 'lava' }],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'hold', atMs: 200 }],
    traps: ['span1', 'span2'],
  },

  {
    id: 28,
    name: 'Stepping Stones',
    world: W,
    hint: '之字形一路往下——每塊踏石都是路的一部分',
    pins: [
      { id: 'hold', x: 22, y: 32, len: 18, thick: 3 },
      { id: 'st1', x: 36, y: 58, len: 32, thick: 4, angle: 0.5 },
      { id: 'st2', x: 62, y: 84, len: 32, thick: 4, angle: -0.5 },
      { id: 'st3', x: 38, y: 108, len: 32, thick: 4, angle: 0.5 },
    ],
    walls: [],
    emitters: [{ x: 22, y: 22, w: 16, h: 10, count: 32 }],
    cups: [{ id: 'c', x: 66, y: 132, w: 24, h: 16, need: 12 }],
    hazards: [{ x: 16, y: 132, w: 24, h: 9, kind: 'void' }],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'hold', atMs: 200 }],
    traps: ['st1', 'st3'],
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
    hint: '先下後上——上面那堆砸下來會把下面的撞飛出去',
    pins: [
      { id: 'flood', x: 50, y: 22, len: 26, thick: 3 },
      { id: 'hold', x: 50, y: 56, len: 24, thick: 3 },
    ],
    walls: [],
    emitters: [
      { x: 50, y: 12, w: 22, h: 9, count: 15 },
      { x: 50, y: 46, w: 20, h: 9, count: 15 },
    ],
    cups: [{ id: 'c', x: 50, y: 128, w: 26, h: 18, need: 22 }],
    hazards: [
      { x: 14, y: 122, w: 24, h: 9, kind: 'lava' },
      { x: 86, y: 122, w: 24, h: 9, kind: 'lava' },
    ],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'hold', atMs: 200 },
      { pin: 'flood', atMs: 3200 },
    ],
  },

  {
    id: 31,
    name: 'Slow Sweep',
    world: W,
    hint: '底下的岩漿慢慢來回——長橋是唯一的路',
    pins: [
      { id: 'hold', x: 28, y: 38, len: 20, thick: 3 },
      { id: 'span', x: 46, y: 76, len: 46, thick: 4, angle: 0.55 },
    ],
    walls: [],
    emitters: [{ x: 28, y: 26, w: 18, h: 12, count: 36 }],
    cups: [{ id: 'c', x: 74, y: 124, w: 24, h: 20, need: 12 }],
    hazards: [{ x: 38, y: 118, w: 26, h: 9, kind: 'lava', moveX: 1.1, moveRange: 12 }],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'hold', atMs: 200 }],
    traps: ['span'],
  },

  {
    id: 32,
    name: 'Two Rivers',
    world: W,
    hint: '兩條顏色各自向外分流，中間是黑洞——兩座橋都別碰',
    pins: [
      { id: 'holdG', x: 26, y: 36, len: 18, thick: 3 },
      { id: 'holdR', x: 74, y: 36, len: 18, thick: 3 },
      { id: 'spanG', x: 34, y: 72, len: 34, thick: 4, angle: -0.5 },
      { id: 'spanR', x: 66, y: 72, len: 34, thick: 4, angle: 0.5 },
    ],
    walls: [],
    emitters: [
      { x: 26, y: 24, w: 16, h: 12, count: 18, color: 'gold' },
      { x: 74, y: 24, w: 16, h: 12, count: 18, color: 'rose' },
    ],
    cups: [
      { id: 'cg', x: 12, y: 126, w: 20, h: 20, need: 9, color: 'gold' },
      { id: 'cr', x: 88, y: 126, w: 20, h: 20, need: 9, color: 'rose' },
    ],
    hazards: [{ x: 50, y: 126, w: 30, h: 10, kind: 'void' }],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'holdG', atMs: 200 },
      { pin: 'holdR', atMs: 1200 },
    ],
    traps: ['spanG', 'spanR'],
  },

  {
    id: 33,
    name: 'Side Key',
    world: W,
    spike: true,
    hint: '右邊被閘門擋著——先把左邊那個小鑰匙杯填滿，門才會開',
    pins: [
      { id: 'key', x: 24, y: 40, len: 18, thick: 3 },
      { id: 'main', x: 68, y: 40, len: 22, thick: 3 },
      { id: 'span', x: 70, y: 78, len: 34, thick: 4, angle: 0.5 },
    ],
    walls: [{ x: 84, y: 100, w: 26, h: 4, gate: 'ck' }],
    emitters: [
      { x: 24, y: 28, w: 16, h: 12, count: 16 },
      { x: 68, y: 28, w: 18, h: 12, count: 28 },
    ],
    cups: [
      { id: 'ck', x: 16, y: 122, w: 20, h: 18, need: 8 },
      { id: 'cm', x: 84, y: 128, w: 22, h: 16, need: 12 },
    ],
    hazards: [{ x: 50, y: 128, w: 26, h: 9, kind: 'lava' }],
    stars: { pulls: [2, 3] },
    solution: [
      { pin: 'key', atMs: 200 },
      { pin: 'main', atMs: 3000 },
    ],
    traps: ['span'],
  },

  {
    id: 34,
    name: 'Crossfire',
    world: W,
    hint: '兩道危險交錯掃過，長橋撐住整條路',
    pins: [
      { id: 'hold', x: 26, y: 34, len: 20, thick: 3 },
      { id: 'span', x: 48, y: 74, len: 48, thick: 4, angle: 0.5 },
    ],
    walls: [],
    emitters: [{ x: 26, y: 22, w: 18, h: 12, count: 46 }],
    cups: [{ id: 'c', x: 76, y: 126, w: 24, h: 18, need: 12 }],
    hazards: [
      { x: 34, y: 104, w: 22, h: 8, kind: 'lava', moveX: 1.3, moveRange: 10 },
      { x: 40, y: 128, w: 22, h: 8, kind: 'void', moveX: 0.9, moveRange: 12 },
    ],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'hold', atMs: 200 }],
    traps: ['span'],
  },

  {
    id: 35,
    name: 'Unzip',
    world: W,
    spike: true,
    hint: '拔最上面那根會連鎖鬆開中層——先把最底下那堆放下去',
    pins: [
      { id: 'trigger', x: 50, y: 26, len: 24, thick: 3, releases: ['mid'] },
      { id: 'mid', x: 50, y: 58, len: 22, thick: 3 },
      { id: 'base', x: 50, y: 90, len: 22, thick: 3 },
    ],
    walls: [],
    emitters: [
      { x: 50, y: 17, w: 20, h: 8, count: 10 },
      { x: 50, y: 49, w: 18, h: 8, count: 10 },
      { x: 50, y: 81, w: 18, h: 8, count: 10 },
    ],
    cups: [{ id: 'c', x: 50, y: 132, w: 26, h: 14, need: 21 }],
    hazards: [
      { x: 14, y: 112, w: 24, h: 8, kind: 'lava' },
      { x: 86, y: 112, w: 24, h: 8, kind: 'lava' },
    ],
    stars: { pulls: [2, 3] },
    solution: [
      { pin: 'base', atMs: 200 },
      { pin: 'trigger', atMs: 3400 },
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
