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

  // 5 ── order matters: pull the drain plug before the flood.
  {
    id: 5,
    name: 'Order of Things',
    world: W,
    // Zigzag descent: the stream switchbacks down two spans. Both are the road
    // itself — pull either and the pour drops into the lava below. (It used to
    // be two stacked pins over a cup directly beneath, where every order won.)
    hint: '之字形下降——兩段斜橋都是路，拔掉哪一段都會掉進岩漿',
    pins: [
      { id: 'hold', x: 72, y: 30, len: 22, thick: 3 },
      { id: 'spanA', x: 58, y: 58, len: 40, thick: 4, angle: -0.6 },
      { id: 'spanB', x: 36, y: 90, len: 40, thick: 4, angle: -0.6 },
    ],
    walls: [],
    emitters: [{ x: 72, y: 18, w: 18, h: 12, count: 30 }],
    cups: [{ id: 'c', x: 18, y: 130, w: 24, h: 18, need: 13 }],
    hazards: [{ x: 62, y: 128, w: 40, h: 10, kind: 'lava' }],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'hold', atMs: 200 }],
    traps: ['spanA', 'spanB'],
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
      { id: 'hold', x: 70, y: 42, len: 22, thick: 3 },
      { id: 'bridge', x: 58, y: 74, len: 44, thick: 4, angle: -0.6 },
    ],
    walls: [],
    emitters: [{ x: 70, y: 28, w: 18, h: 14, count: 26 }],
    cups: [{ id: 'c', x: 24, y: 122, w: 22, h: 20, need: 12 }],
    hazards: [{ x: 72, y: 122, w: 34, h: 10, kind: 'lava' }],
    stars: { pulls: [1, 1] },
    solution: [{ pin: 'hold', atMs: 200 }],
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
    // Two-stage descent between two drifting voids: cross on the upper span,
    // rest on the shelf, then drop. Both spans are load-bearing.
    hint: '兩個黑洞交錯移動。橋撐著去路——分兩段走，看準再放',
    pins: [
      { id: 'hold', x: 28, y: 34, len: 22, thick: 3 },
      { id: 'span', x: 42, y: 64, len: 42, thick: 4, angle: 0.6 },
      { id: 'shelf', x: 76, y: 96, len: 22, thick: 3 },
    ],
    walls: [],
    emitters: [{ x: 28, y: 20, w: 18, h: 14, count: 30 }],
    cups: [{ id: 'c', x: 76, y: 132, w: 24, h: 16, need: 12 }],
    hazards: [
      { x: 34, y: 96, w: 14, h: 7, kind: 'void', moveX: 1.7, moveRange: 14 },
      { x: 50, y: 124, w: 16, h: 8, kind: 'void', moveX: 2.1, moveRange: 14 },
    ],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'hold', atMs: 200 },
      { pin: 'shelf', atMs: 3400 },
    ],
    traps: ['span'],
  },

  // 15 ── ordered release: clear the shelf before opening the flood.
  {
    id: 15,
    name: 'Clear the Shelf',
    world: W,
    // CHAIN: pulling 'gate' also knocks out 'catch' a beat later, so one pull
    // starts a cascade the player has to have set up correctly first.
    // (The chutes stay scenery: with the cup directly below they aren't
    // load-bearing, so making them pullable would be a fake choice.)
    hint: '拔中間那根會連鎖鬆開下面的接盤——先把上面的放下來墊好',
    pins: [
      { id: 'top', x: 50, y: 28, len: 24, thick: 3 },
      { id: 'gate', x: 50, y: 58, len: 24, thick: 3, releases: ['catch'] },
      { id: 'catch', x: 50, y: 78, len: 26, thick: 3 },
    ],
    walls: [
      { x: 30, y: 92, w: 30, h: 3, angle: 0.5 },
      { x: 70, y: 92, w: 30, h: 3, angle: -0.5 },
    ],
    emitters: [{ x: 50, y: 18, w: 22, h: 10, count: 30 }],
    cups: [{ id: 'c', x: 50, y: 130, w: 22, h: 18, need: 16 }],
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
    // A huge pour, but routed: the span carries the avalanche across the lava
    // and the shelf holds it until you release it into the cup. Big volume AND
    // real decisions (it used to be one pin with no hazard at all).
    hint: '大傾瀉！斜橋撐著整條路——分兩段放，別讓它掉進岩漿',
    pins: [
      { id: 'hold', x: 28, y: 36, len: 24, thick: 3 },
      { id: 'span', x: 44, y: 70, len: 46, thick: 4, angle: 0.6 },
      { id: 'shelf', x: 78, y: 100, len: 22, thick: 3 },
    ],
    walls: [],
    emitters: [{ x: 28, y: 22, w: 20, h: 14, count: 38 }],
    cups: [{ id: 'c', x: 78, y: 132, w: 26, h: 16, need: 16 }],
    hazards: [{ x: 34, y: 128, w: 34, h: 10, kind: 'lava' }],
    stars: { pulls: [2, 2] },
    solution: [
      { pin: 'hold', atMs: 200 },
      { pin: 'shelf', atMs: 3600 },
    ],
    traps: ['span'],
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
]

export const LEVEL_COUNT = LEVELS.length

export function getLevel(id: number): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id)
}
