/**
 * Star Sort — P0 playable prototype (deliberately ugly; logic-feel check only).
 * Open /sort.html on the dev server. Tap a bottle, tap another to pour.
 * The point: does deterministic sorting FEEL like a puzzle? Rendering is
 * throwaway; sort.ts / solver.ts are the real deliverables.
 */
import { SortGame, canPour } from './sort.ts'
import { generateLevel, hintMove, starsFor, type GeneratedLevel } from './solver.ts'

const COLORS = ['#F5B942', '#E86A8E', '#4FC6C0', '#8E7CC3', '#7C8B4C', '#E5533B', '#5B7290', '#D98A1F', '#3A2A55']

const canvas = document.getElementById('c') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const $ = (id: string) => document.getElementById(id)!

let levelNo = Number(localStorage.getItem('starsort-proto-level') || '1')
let lv: GeneratedLevel
let game: SortGame
let selected = -1
let hint: [number, number] | null = null
let hintTimer = 0

function load(n: number): void {
  levelNo = Math.max(1, n)
  localStorage.setItem('starsort-proto-level', String(levelNo))
  lv = generateLevel(levelNo)
  game = new SortGame(lv.bottles, lv.params.capacity)
  selected = -1
  hint = null
  updateHud()
  draw()
}

function updateHud(): void {
  $('lv').textContent = `第 ${levelNo} 關`
  $('meta').textContent = `${lv.params.colors} 色 · 最少 ${lv.minMoves} 步`
  const proj = game.won ? starsFor(game.moves, lv.minMoves) : 0
  $('mv').textContent = game.won
    ? `${game.moves} 步 · ${'★'.repeat(proj)}${'☆'.repeat(3 - proj)}`
    : `${game.moves} 步`
  $('win').style.display = game.won ? 'block' : 'none'
  $('stuckmsg').style.display = !game.won && game.stuck ? 'block' : 'none'
}

// ── layout ────────────────────────────────────────────────────
const BW = 54
const BH = 168
function slots(): { x: number; y: number }[] {
  const n = game.bottles.length
  const perRow = n <= 7 ? Math.min(n, 5) : Math.ceil(n / 2)
  const rows = Math.ceil(n / perRow)
  const out: { x: number; y: number }[] = []
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / perRow)
    const inRow = Math.min(perRow, n - r * perRow)
    const rowW = inRow * (BW + 26) - 26
    const x0 = (canvas.width - rowW) / 2
    out.push({ x: x0 + (i % perRow) * (BW + 26), y: 120 + r * (BH + 60) - (rows > 1 ? 30 : 0) })
  }
  return out
}

function draw(): void {
  ctx.fillStyle = '#F4E9D7'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const cap = game.capacity
  const cell = (BH - 12) / cap
  const pos = slots()
  game.bottles.forEach((b, i) => {
    const { x } = pos[i]
    const lift = i === selected ? 16 : 0
    const y = pos[i].y - lift
    const complete = b.length === cap && b.every((c) => c === b[0])
    // when a bottle is picked, show WHERE it can pour (the big clarity fix)
    const legalTarget = selected >= 0 && selected !== i && canPour(game.bottles, cap, selected, i)
    // glass
    ctx.fillStyle = legalTarget ? 'rgba(90,200,140,0.22)' : 'rgba(255,255,255,0.45)'
    ctx.strokeStyle = complete ? '#3aa76d' : legalTarget ? '#3aa76d' : i === selected ? '#D98A1F' : '#2B2620'
    ctx.lineWidth = complete || legalTarget || i === selected ? 4.5 : 2.5
    roundRect(x, y, BW, BH, 12)
    ctx.fill()
    ctx.stroke()
    if (legalTarget) {
      ctx.fillStyle = '#3aa76d'
      ctx.font = 'bold 20px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('↓', x + BW / 2, y - 8)
    }
    // contents
    b.forEach((c, k) => {
      ctx.fillStyle = COLORS[c % COLORS.length]
      const cy = y + BH - 6 - (k + 1) * cell
      ctx.fillRect(x + 5, cy + 2, BW - 10, cell - 3)
    })
    if (complete) {
      ctx.fillStyle = '#3aa76d'
      ctx.font = 'bold 22px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('✓', x + BW / 2, y - 10)
    }
    // hint highlight
    if (hint && (hint[0] === i || hint[1] === i)) {
      ctx.strokeStyle = hint[0] === i ? '#D98A1F' : '#4FC6C0'
      ctx.lineWidth = 5
      roundRect(x - 4, y - 4, BW + 8, BH + 8, 15)
      ctx.stroke()
    }
  })
}

function roundRect(x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect()
  const px = ((e.clientX - rect.left) / rect.width) * canvas.width
  const py = ((e.clientY - rect.top) / rect.height) * canvas.height
  const pos = slots()
  let hit = -1
  pos.forEach((p, i) => {
    if (px >= p.x - 8 && px <= p.x + BW + 8 && py >= p.y - 24 && py <= p.y + BH) hit = i
  })
  if (hit < 0) {
    selected = -1
  } else if (selected < 0) {
    if (game.bottles[hit].length > 0) selected = hit
  } else if (selected === hit) {
    selected = -1
  } else if (game.pour(selected, hit)) {
    selected = -1
    hint = null
  } else {
    selected = game.bottles[hit].length > 0 ? hit : -1
  }
  updateHud()
  draw()
})

$('undo').addEventListener('click', () => {
  game.undo()
  selected = -1
  updateHud()
  draw()
})
$('restart').addEventListener('click', () => {
  game.restart()
  selected = -1
  updateHud()
  draw()
})
$('hintbtn').addEventListener('click', () => {
  hint = hintMove(game.bottles, game.capacity)
  window.clearTimeout(hintTimer)
  hintTimer = window.setTimeout(() => {
    hint = null
    draw()
  }, 2500)
  draw()
})
$('prev').addEventListener('click', () => load(levelNo - 1))
$('next').addEventListener('click', () => load(levelNo + 1))
$('nextwin').addEventListener('click', () => load(levelNo + 1))

load(levelNo)
