import './style.css'
import { PALETTE, PHYS } from './config.ts'
import { GameSim } from './sim.ts'
import { Renderer } from './render.ts'
import { Particles } from './particles.ts'
import { LEVELS, LEVEL_COUNT, getLevel } from './levels.ts'
import { computeStars, earnedStardust } from './logic.ts'
import { addStardust, loadProgress, recordWin, saveProgress, totalStars, type Progress } from './storage.ts'
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
  winReward: $('win-reward'),
  lose: $('lose'),
  menu: $('menu'),
  menuSub: $('menu-sub'),
  levelGrid: $('level-grid'),
  btnSound: $('btn-sound'),
  btnRestart: $('btn-restart'),
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
let flash = 0 // golden full-screen flash (0–1), decays each frame
let stuckShown = false // gentle "no flow left" cue already surfaced this attempt
let winPending = 0 // ms since the win was locked in; lets the pour finish first
let winAt = 0 // performance.now() when the win locked in; drives the constellation reveal
const fullCups = new Set<string>() // cups that have already popped their "filled" burst
const cupOverflow = new Map<string, number>() // grains a cup has collected beyond its need
let floaterCd = 0 // throttle for the "+N ✦" currency pops
// Floating "+N ✦" reward pops (overflow stardust → currency; see GAME-DIRECTION).
const floaters: { x: number; y: number; vy: number; life: number; max: number; n: number }[] = []
// Respect the OS "reduce motion" setting: skip screenshake + the golden flash.
const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

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
  flash = 0
  stuckShown = false
  winPending = 0
  winAt = 0
  fullCups.clear()
  cupOverflow.clear()
  floaters.length = 0
  floaterCd = 0
  audio.pourStop()
  hoverPin = null
  el.btnRestart.classList.remove('nudge')
  el.levelName.textContent = `${id}. ${level.name}`
  updatePullCount()
  hideAllOverlays()
  showHint(level.hint)
}

function updatePullCount(): void {
  // Show the 3★ pull budget, not just a bare count — otherwise the rating feels
  // arbitrary and there's nothing to play against.
  const par = sim.level.stars?.pulls?.[0] ?? sim.level.solution?.length ?? sim.level.pins.length
  const label = sim.pulls === 1 ? '1 pull' : `${sim.pulls} pulls`
  el.pullCount.textContent = `${label} · ★★★ ≤ ${par}`
  el.pullCount.classList.toggle('over-par', sim.pulls > par)
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

/** Cozy dead-end nudge: the board can no longer flow, but we never auto-fail a
 *  player. Surface a persistent, friendly toast and pulse the restart button. */
function showStuck(): void {
  window.clearTimeout(hintTimer)
  el.hint.textContent = '星塵流不動了 — 點 ↻ 再試一次'
  el.hint.classList.remove('hidden')
  el.hint.style.opacity = '1'
  el.btnRestart.classList.add('nudge')
}

function clearStuck(): void {
  el.btnRestart.classList.remove('nudge')
  if (stuckShown) showHint(undefined)
  stuckShown = false
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
  floaterCd -= dt

  // Slow-mo to savour the winning pour: once the goal is met but stardust is
  // still in the air, drop the sim clock so the last grains drift home in style.
  const timeScale = !resolved && sim.status === 'won' ? 0.45 : 1
  if (!resolved) {
    acc += dt * timeScale
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

  if (!resolved) checkResolution(dt)

  // cozy dead-end: nothing can flow anymore — nudge a retry (never auto-lose)
  if (!resolved && !stuckShown && sim.stuck) {
    stuckShown = true
    showStuck()
  }

  // audio feedback when a cup gains stardust
  const filled = sim.cupViews.reduce((s, c) => s + c.filled, 0)
  if (filled > lastFilled && dripCooldown <= 0) {
    audio.sfxDrip(Math.min(6, filled))
    dripCooldown = 70
  }
  lastFilled = filled

  // continuous pour bed: soft hiss while stardust streams, pitch rising as the
  // cups fill — turns the pour into the main event (see docs/GAME-DIRECTION).
  const needTotal = sim.cupViews.reduce((s, c) => s + c.def.need, 0)
  const fillRatio = needTotal ? Math.min(1, filled / needTotal) : 0
  let flowing = 0
  for (const g of sim.grainViews) if (Math.hypot(g.vx, g.vy) > 2) flowing++
  audio.pourUpdate(!resolved && sim.status === 'playing' && flowing > 0, fillRatio, Math.min(1, flowing / 12))

  // celebrate the instant a cup tops out (ring + sparkle pop + chime)
  for (const c of sim.cupViews) {
    if (c.ratio >= 1 && !fullCups.has(c.def.id)) {
      fullCups.add(c.def.id)
      particles.cupBurst(c.def.x, c.def.y - c.def.h / 2, c.def.color ?? 'gold')
      audio.sfxStar(0)
      shake = Math.min(shake + 0.6, 2)
    }
    // overflow stardust is a REWARD, not a spill: pop a "+N ✦" so extra scoops
    // read as bonus currency (settled into real currency in P1).
    const over = Math.max(0, c.filled - c.def.need)
    const shown = cupOverflow.get(c.def.id) ?? 0
    if (over > shown && floaterCd <= 0) {
      floaters.push({ x: c.def.x, y: c.def.y - c.def.h / 2 - 2, vy: -9, life: 0, max: 0.9, n: over - shown })
      cupOverflow.set(c.def.id, over)
      floaterCd = 150
    }
  }

  // drive the floating reward pops
  for (const f of floaters) {
    f.life += dt / 1000
    f.y += (f.vy * dt) / 1000
  }
  for (let i = floaters.length - 1; i >= 0; i--) if (floaters[i].life >= floaters[i].max) floaters.splice(i, 1)

  flash *= Math.pow(0.015, dt / 1000) // quick decay

  // render (in CSS-pixel space scaled by dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, rect.width, rect.height)
  const t = renderer.transformFor(rect.width, rect.height)
  // camera micro-push: ease in toward the cups as the win lands, for weight
  const winProgress = winAt ? Math.min(1, (now - winAt) / 1400) : 0
  if (winProgress > 0 && !reduceMotion) {
    const k = 0.05 * easeOutCubic(Math.min(1, winProgress * 1.6))
    let cx = 0
    let cy = 0
    for (const c of sim.cupViews) {
      cx += c.def.x
      cy += c.def.y
    }
    const nc = sim.cupViews.length || 1
    cx /= nc
    cy /= nc
    const s2 = t.scale * (1 + k)
    t.ox += cx * (t.scale - s2)
    t.oy += cy * (t.scale - s2)
    t.scale = s2
  }
  if (shake > 0.01 && !reduceMotion) {
    t.ox += (Math.random() - 0.5) * shake * t.scale
    t.oy += (Math.random() - 0.5) * shake * t.scale
  }
  // gentle onboarding: point at the pin on level 1 until the first pull
  const coach = currentId === 1 && sim.pulls === 0 && !resolved ? (sim.pinViews[0]?.id ?? null) : null
  renderer.draw(sim, t, now, resolved ? null : hoverPin, coach, winProgress)
  // particles + reward floaters share the world transform, drawn on top
  ctx.save()
  ctx.translate(t.ox, t.oy)
  ctx.scale(t.scale, t.scale)
  particles.draw(ctx)
  drawFloaters(ctx)
  ctx.restore()

  // soft vignette for depth/atmosphere (screen space)
  drawVignette(rect.width, rect.height)

  // golden win flash (screen space)
  if (flash > 0.01 && !reduceMotion) {
    ctx.fillStyle = `rgba(245,185,66,${(flash * 0.35).toFixed(3)})`
    ctx.fillRect(0, 0, rect.width, rect.height)
  }

  requestAnimationFrame(frame)
}

const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3)

/** Floating "+N ✦" reward pops, drawn in world space above the cups. */
function drawFloaters(c: CanvasRenderingContext2D): void {
  for (const f of floaters) {
    const k = 1 - f.life / f.max
    c.save()
    c.globalAlpha = Math.max(0, Math.min(1, k * 1.4))
    c.font = "4.2px 'Gochi Hand', 'Comic Sans MS', system-ui, sans-serif"
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.lineWidth = 0.9
    c.strokeStyle = 'rgba(255,255,255,0.7)'
    c.strokeText(`+${f.n} ✦`, f.x, f.y)
    c.fillStyle = PALETTE.goldDeep
    c.fillText(`+${f.n} ✦`, f.x, f.y)
    c.restore()
  }
  c.globalAlpha = 1
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

function checkResolution(dt: number): void {
  if (sim.status !== 'playing') showHint(undefined) // clear any lingering coaching toast
  if (sim.status === 'won') {
    if (winPending === 0) {
      // Lock in the result and fire the celebration on the very first frame…
      lastStars = computeStars(sim.level, sim.pulls)
      progress = recordWin(progress, currentId, lastStars, LEVEL_COUNT)
      winAt = performance.now() // start the constellation reveal + camera push
      audio.pourStop()
      audio.sfxWin()
      haptics.notifyWin()
      shake = 1.6
      flash = 0.7
      for (const c of sim.cupViews) particles.celebrate(c.def.x, c.def.y - c.def.h / 2)
    }
    // …but keep simulating so stardust still in the air finishes pouring. We
    // used to freeze physics instantly, which cut the pour off mid-flight and
    // slammed the result card over a stopped board.
    winPending += dt
    if (winPending > 2200 || sim.activeGrains === 0) {
      resolved = true
      // Settle ✦ currency once the pour has fully finished, so it captures every
      // overflow grain that landed during the slow-mo tail — "多撈的都是賺的".
      const overflow = [...cupOverflow.values()].reduce((a, b) => a + b, 0)
      lastReward = earnedStardust(overflow, lastStars)
      progress = addStardust(progress, lastReward)
      showWin(lastStars, lastReward)
    }
  } else if (sim.status === 'lost') {
    resolved = true
    audio.pourStop()
    audio.sfxLose()
    haptics.notifyLose()
    setTimeout(() => el.lose.classList.remove('hidden'), 400)
  }
}

// ── overlays ──────────────────────────────────────────────────
let lastStars = 3
let lastReward = 0
function showWin(stars: number, reward = 0): void {
  lastStars = stars
  el.winStars.innerHTML = [1, 2, 3].map((i) => `<span class="${i <= stars ? '' : 'dim'}">★</span>`).join(' ')
  el.winTitle.textContent =
    stars === 3 ? 'Perfect pour!' : stars === 2 ? 'Nicely done!' : 'Cleared!'
  // ✦ reward line: how much stardust this pour banked, plus the running purse.
  el.winReward.textContent = reward > 0 ? `✦ +${reward}   ·   ✦ ${progress.stardust}` : `✦ ${progress.stardust}`
  el.winReward.classList.remove('pop')
  void el.winReward.offsetWidth // restart the pop animation
  el.winReward.classList.add('pop')
  const isLast = currentId >= LEVEL_COUNT
  ;($('win-next') as HTMLButtonElement).textContent = isLast ? 'Menu' : 'Next ›'
  el.win.classList.remove('hidden')
  // reveal the stars one at a time with a rising chime — the satisfying beat
  const spans = Array.from(el.winStars.querySelectorAll('span'))
  spans.forEach((span, i) => {
    window.setTimeout(() => {
      span.classList.add('pop')
      if (i < stars) audio.sfxStar(i)
    }, 180 + i * 240)
  })
}

/** The three chapters — each reads as a constellation to rebuild in the night
 *  sky. Boundaries mirror docs/REDESIGN.md (Pour / Route / Machine). */
const CHAPTERS = [
  { name: 'Pour', from: 1, to: 8 },
  { name: 'Route', from: 9, to: 16 },
  { name: 'Machine', from: 17, to: LEVEL_COUNT },
] as const

function openMenu(): void {
  hideAllOverlays() // clear win/lose first so the menu never stacks on them
  el.menuSub.innerHTML = `★ ${totalStars(progress)} / ${LEVEL_COUNT * 3}<span class="dot">·</span><span class="dust">✦ ${progress.stardust}</span>`
  el.levelGrid.innerHTML = ''
  for (const ch of CHAPTERS) {
    const levels = LEVELS.filter((l) => l.id >= ch.from && l.id <= ch.to)
    if (!levels.length) continue
    const got = levels.reduce((s, l) => s + (progress.stars[l.id] ?? 0), 0)
    const section = document.createElement('div')
    section.className = 'chapter'
    const title = document.createElement('div')
    title.className = 'chapter-title'
    title.innerHTML = `<span>✦ ${ch.name}</span><span class="chapter-prog">${got} / ${levels.length * 3}</span>`
    const grid = document.createElement('div')
    grid.className = 'chapter-grid'
    for (const lv of levels) {
      const unlocked = lv.id <= progress.unlocked
      const stars = progress.stars[lv.id] ?? 0
      const cell = document.createElement('button')
      cell.className = 'level-cell' + (unlocked ? '' : ' locked') + (stars >= 3 ? ' full' : '')
      cell.innerHTML = unlocked
        ? `<span>${lv.id}</span><span class="mini-stars">${'★'.repeat(stars)}</span>`
        : `<span>🔒</span>`
      if (unlocked) cell.addEventListener('click', () => loadLevel(lv.id))
      grid.appendChild(cell)
    }
    section.appendChild(title)
    section.appendChild(grid)
    el.levelGrid.appendChild(section)
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
    clearStuck() // a fresh pull re-mobilises the board; drop any dead-end nudge
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
$('lose-menu').addEventListener('click', openMenu)
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

// ── title / start screen ─────────────────────────────────────
$('title-play').addEventListener('click', () => {
  const title = $('title')
  title.classList.add('fade')
  window.setTimeout(() => title.classList.add('hidden'), 400)
  // first user gesture — nudge the audio context awake
  audio.sfxPull()
})

// ── boot ──────────────────────────────────────────────────────
loadLevel(Math.min(progress.unlocked, LEVEL_COUNT))
requestAnimationFrame(frame)
