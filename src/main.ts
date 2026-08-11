import './style.css'
import { PHYS } from './config.ts'
import { GameSim } from './sim.ts'
import { Renderer } from './render.ts'
import { Particles } from './particles.ts'
import { LEVELS, LEVEL_COUNT, getLevel } from './levels.ts'
import { computeStars } from './logic.ts'
import { loadProgress, recordWin, saveProgress, totalStars, type Progress } from './storage.ts'
import { shareResult } from './sharecard.ts'
import * as audio from './audio.ts'
import * as haptics from './haptics.ts'

// ── DOM refs ──────────────────────────────────────────────────
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const canvas = $<HTMLCanvasElement>('game')
const ctx = canvas.getContext('2d')!
const renderer = new Renderer(ctx)
const particles = new Particles()

const el = {
  levelName: $('level-name'),
  pullCount: $('pull-count'),
  hint: $('hint'),
  win: $('win'),
  winStars: $('win-stars'),
  winTitle: $('win-title'),
  lose: $('lose'),
  menu: $('menu'),
  menuSub: $('menu-sub'),
  levelGrid: $('level-grid'),
  btnSound: $('btn-sound'),
}

// ── state ─────────────────────────────────────────────────────
let progress: Progress = loadProgress()
let sim: GameSim
let currentId = 1
let acc = 0
let lastT = performance.now()
let resolved = false // win/lose already handled for this attempt
let hoverPin: string | null = null
let lastFilled = 0
let dripCooldown = 0
let shake = 0 // screenshake magnitude (world units), decays each frame

audio.setMuted(progress.muted)
updateSoundBtn()

// ── level lifecycle ───────────────────────────────────────────
function loadLevel(id: number): void {
  const level = getLevel(id)
  if (!level) return
  currentId = id
  sim = new GameSim(level)
  particles.clear()
  resolved = false
  acc = 0
  lastFilled = 0
  shake = 0
  hoverPin = null
  el.levelName.textContent = `${id}. ${level.name}`
  updatePullCount()
  hideAllOverlays()
  showHint(level.hint)
}

function updatePullCount(): void {
  el.pullCount.textContent = sim.pulls === 1 ? '1 pull' : `${sim.pulls} pulls`
}

let hintTimer = 0
function showHint(text?: string): void {
  window.clearTimeout(hintTimer)
  if (!text) {
    el.hint.classList.add('hidden')
    return
  }
  el.hint.textContent = text
  el.hint.classList.remove('hidden')
  el.hint.style.opacity = '1'
  hintTimer = window.setTimeout(() => {
    el.hint.style.opacity = '0'
  }, 3200)
}

function hideAllOverlays(): void {
  el.win.classList.add('hidden')
  el.lose.classList.add('hidden')
  el.menu.classList.add('hidden')
}

// ── main loop (fixed timestep) ────────────────────────────────
function frame(now: number): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
  const rect = canvas.getBoundingClientRect()
  const cw = Math.max(1, Math.round(rect.width * dpr))
  const chh = Math.max(1, Math.round(rect.height * dpr))
  if (canvas.width !== cw || canvas.height !== chh) {
    canvas.width = cw
    canvas.height = chh
  }

  let dt = now - lastT
  lastT = now
  if (dt > 250) dt = 250 // tab was backgrounded
  dripCooldown -= dt

  if (!resolved) {
    acc += dt
    while (acc >= PHYS.stepMs) {
      sim.step(PHYS.stepMs)
      acc -= PHYS.stepMs
    }
  }

  // turn sim FX cues into particles (also drives the "waste = small shake")
  for (const ev of sim.drainEvents()) {
    particles.emit(ev)
    if (ev.type === 'waste') shake = Math.min(shake + 0.5, 2)
    if (ev.type === 'pull') shake = Math.min(shake + 0.35, 2)
  }
  particles.update(dt)
  shake *= Math.pow(0.001, dt / 1000) // smooth exponential decay

  if (!resolved) checkResolution()

  // audio feedback when a cup gains stardust
  const filled = sim.cupViews.reduce((s, c) => s + c.filled, 0)
  if (filled > lastFilled && dripCooldown <= 0) {
    audio.sfxDrip(Math.min(6, filled))
    dripCooldown = 70
  }
  lastFilled = filled

  // render (in CSS-pixel space scaled by dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, rect.width, rect.height)
  const t = renderer.transformFor(rect.width, rect.height)
  if (shake > 0.01) {
    t.ox += (Math.random() - 0.5) * shake * t.scale
    t.oy += (Math.random() - 0.5) * shake * t.scale
  }
  renderer.draw(sim, t, now, resolved ? null : hoverPin)
  // particles share the world transform, drawn on top
  ctx.save()
  ctx.translate(t.ox, t.oy)
  ctx.scale(t.scale, t.scale)
  particles.draw(ctx)
  ctx.restore()

  // soft vignette for depth/atmosphere (screen space)
  drawVignette(rect.width, rect.height)

  requestAnimationFrame(frame)
}

let vignette: { grad: CanvasGradient; w: number; h: number } | null = null
function drawVignette(w: number, h: number): void {
  if (!vignette || vignette.w !== w || vignette.h !== h) {
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.72)
    g.addColorStop(0, 'rgba(43,38,32,0)')
    g.addColorStop(1, 'rgba(43,38,32,0.16)')
    vignette = { grad: g, w, h }
  }
  ctx.fillStyle = vignette.grad
  ctx.fillRect(0, 0, w, h)
}

function checkResolution(): void {
  if (sim.status === 'won') {
    resolved = true
    const stars = computeStars(sim.level, sim.pulls)
    progress = recordWin(progress, currentId, stars, LEVEL_COUNT)
    audio.sfxWin()
    haptics.notifyWin()
    shake = 1.6
    for (const c of sim.cupViews) particles.celebrate(c.def.x, c.def.y - c.def.h / 2)
    setTimeout(() => showWin(stars), 550)
  } else if (sim.status === 'lost') {
    resolved = true
    audio.sfxLose()
    haptics.notifyLose()
    setTimeout(() => el.lose.classList.remove('hidden'), 400)
  }
}

// ── overlays ──────────────────────────────────────────────────
let lastStars = 3
function showWin(stars: number): void {
  lastStars = stars
  el.winStars.innerHTML = [1, 2, 3].map((i) => `<span class="${i <= stars ? '' : 'dim'}">★</span>`).join(' ')
  el.winTitle.textContent =
    stars === 3 ? 'Perfect pour!' : stars === 2 ? 'Nicely done!' : 'Cleared!'
  const isLast = currentId >= LEVEL_COUNT
  ;($('win-next') as HTMLButtonElement).textContent = isLast ? 'Menu' : 'Next ›'
  el.win.classList.remove('hidden')
}

function openMenu(): void {
  el.menuSub.textContent = `★ ${totalStars(progress)} / ${LEVEL_COUNT * 3}`
  el.levelGrid.innerHTML = ''
  for (const lv of LEVELS) {
    const unlocked = lv.id <= progress.unlocked
    const cell = document.createElement('button')
    cell.className = 'level-cell' + (unlocked ? '' : ' locked')
    const stars = progress.stars[lv.id] ?? 0
    cell.innerHTML = unlocked
      ? `<span>${lv.id}</span><span class="mini-stars">${'★'.repeat(stars)}</span>`
      : `<span>🔒</span>`
    if (unlocked) cell.addEventListener('click', () => loadLevel(lv.id))
    el.levelGrid.appendChild(cell)
  }
  el.menu.classList.remove('hidden')
}

// ── input: tap a pin to pull it ───────────────────────────────
function toWorld(clientX: number, clientY: number): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  const t = renderer.transformFor(rect.width, rect.height)
  return { x: (clientX - rect.left - t.ox) / t.scale, y: (clientY - rect.top - t.oy) / t.scale }
}

canvas.addEventListener('pointermove', (e) => {
  if (resolved) {
    hoverPin = null
    return
  }
  const w = toWorld(e.clientX, e.clientY)
  hoverPin = sim.pinAt(w.x, w.y, 8)
})

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault()
  if (resolved) return
  const w = toWorld(e.clientX, e.clientY)
  const id = sim.pinAt(w.x, w.y, 8)
  if (id && sim.pull(id)) {
    audio.sfxPull()
    haptics.tapMedium()
    updatePullCount()
    showHint(undefined)
    hoverPin = null
  }
})

// ── buttons ───────────────────────────────────────────────────
$('btn-menu').addEventListener('click', openMenu)
$('menu-close').addEventListener('click', () => el.menu.classList.add('hidden'))
$('btn-restart').addEventListener('click', () => loadLevel(currentId))
$('win-replay').addEventListener('click', () => loadLevel(currentId))
$('win-share').addEventListener('click', () => {
  void shareResult(sim.level, lastStars)
})
$('lose-retry').addEventListener('click', () => loadLevel(currentId))
$('win-next').addEventListener('click', () => {
  if (currentId >= LEVEL_COUNT) openMenu()
  else loadLevel(currentId + 1)
})
el.btnSound.addEventListener('click', () => {
  progress = { ...progress, muted: !progress.muted }
  saveProgress(progress)
  audio.setMuted(progress.muted)
  updateSoundBtn()
})
function updateSoundBtn(): void {
  el.btnSound.classList.toggle('off', progress.muted)
  el.btnSound.textContent = progress.muted ? '♪̶' : '♪'
}

// ── boot ──────────────────────────────────────────────────────
loadLevel(Math.min(progress.unlocked, LEVEL_COUNT))
requestAnimationFrame(frame)
