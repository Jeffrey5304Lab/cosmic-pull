import './style.css'
import { PALETTE, PHYS, THEMES } from './config.ts'
import { GameSim } from './sim.ts'
import { Renderer } from './render.ts'
import { Particles } from './particles.ts'
import { LEVELS, LEVEL_COUNT, getLevel } from './levels.ts'
import { computeStars, dailyReward, daysBetween, earnedStardust, today } from './logic.ts'
import { addStardust, claimDaily, loadProgress, pickTheme, recordWin, saveProgress, totalStars, type Progress } from './storage.ts'
import { shareResult } from './sharecard.ts'
import { applyI18n, hintFor, nameFor, pullsLabel, streakLabel, t } from './i18n.ts'
import { AD_REWARD, adsAvailable, initAds, privacyOptionsAvailable, showPrivacyOptions, showRewarded } from './ads.ts'
import * as audio from './audio.ts'
import * as haptics from './haptics.ts'

applyI18n() // localise all static [data-i18n] markup before first paint
void initAds() // best-effort AdMob init (native only; no-op on web)

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
  daily: $('daily'),
  dailySub: $('daily-sub'),
  dailyAmount: $('daily-amount'),
  shop: $('shop'),
  shopSub: $('shop-sub'),
  shopGrid: $('shop-grid'),
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
let hintPin: string | null = null // solution pin revealed by a rewarded "hint" ad
let winPending = 0 // ms since the win was locked in; lets the pour finish first
let winAt = 0 // performance.now() when the win locked in; drives the constellation reveal
const fullCups = new Set<string>() // cups that have already popped their "filled" burst
const cupOverflow = new Map<string, number>() // grains a cup has collected beyond its need
let floaterCd = 0 // throttle for the "+N ✦" currency pops
// Floating "+N ✦" reward pops (overflow stardust → currency; see GAME-DIRECTION).
const floaters: { x: number; y: number; vy: number; life: number; max: number; n: number }[] = []
// Respect the OS "reduce motion" setting: skip screenshake + the golden flash.
const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
renderer.setReduceMotion(reduceMotion) // calm the decorative canvas animation too

audio.setMuted(progress.muted)
updateSoundBtn()

/** Which chapter a level belongs to (1 Pour / 2 Route / 3 Machine). */
function chapterOf(id: number): number {
  return id <= 8 ? 1 : id <= 16 ? 2 : 3
}
/**
 * The sky the board should wear. If the player has bought & chosen a theme,
 * honour it everywhere; otherwise the *default* sky quietly evolves per chapter
 * (warm → dawn → dusk) so progressing feels like travelling somewhere new
 * instead of replaying the same cream board — the #1 first-glance boredom fix.
 */
function effectiveThemeId(levelId: number): string {
  if (progress.theme !== 'parchment') return progress.theme
  const ch = chapterOf(levelId)
  return ch === 3 ? 'dusk' : ch === 2 ? 'dawn' : 'parchment'
}
function applyTheme(): void {
  renderer.setTheme(effectiveThemeId(currentId))
}
applyTheme()

// ── level lifecycle ───────────────────────────────────────────
function loadLevel(id: number): void {
  const level = getLevel(id)
  if (!level) return
  currentId = id
  applyTheme() // chapter-tinted sky (or the player's chosen theme)
  sim = new GameSim(level)
  particles.clear()
  resolved = false
  acc = 0
  lastFilled = 0
  shake = 0
  flash = 0
  stuckShown = false
  hintPin = null
  $('hint-ad').classList.add('hidden')
  winPending = 0
  winAt = 0
  fullCups.clear()
  cupOverflow.clear()
  floaters.length = 0
  floaterCd = 0
  audio.pourStop()
  hoverPin = null
  el.btnRestart.classList.remove('nudge')
  // Spike levels wear a ✦ so a harder level reads as an intentional challenge.
  el.levelName.textContent = `${level.spike ? '✦ ' : ''}${id}. ${nameFor(id, level.name)}`
  el.levelName.classList.toggle('spike', !!level.spike)
  updatePullCount()
  hideAllOverlays()
  showHint(hintFor(level.id, level.hint))
}

function updatePullCount(): void {
  // Show the 3★ pull budget, not just a bare count — otherwise the rating feels
  // arbitrary and there's nothing to play against.
  const par = sim.level.stars?.pulls?.[0] ?? sim.level.solution?.length ?? sim.level.pins.length
  el.pullCount.textContent = `${pullsLabel(sim.pulls)} · ★★★ ≤ ${par}`
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
  el.hint.textContent = t('stuck')
  el.hint.classList.remove('hidden')
  el.hint.style.opacity = '1'
  el.btnRestart.classList.add('nudge')
  // A genuinely useful ad moment: the player is stuck and wants help (the
  // industry's best-performing rewarded placement is exactly this).
  if (adsAvailable() && !hintPin) $('hint-ad').classList.remove('hidden')
}

function clearStuck(): void {
  el.btnRestart.classList.remove('nudge')
  if (stuckShown) showHint(undefined)
  stuckShown = false
  $('hint-ad').classList.add('hidden')
}

/** The next pin in the level's intended solution that hasn't been pulled yet. */
function nextSolutionPin(): string | null {
  const sol = sim.level.solution
  if (!sol) return null
  const live = new Set(sim.pinViews.map((p) => p.id))
  for (const s of [...sol].sort((a, b) => a.atMs - b.atMs)) if (live.has(s.pin)) return s.pin
  return null
}

function hideAllOverlays(): void {
  el.win.classList.add('hidden')
  el.lose.classList.add('hidden')
  el.menu.classList.add('hidden')
  el.shop.classList.add('hidden')
  el.daily.classList.add('hidden')
}

/** Grant today's daily ✦ (once per calendar day) and show the little card. */
function offerDaily(): void {
  const t = today()
  const gap = progress.lastDaily ? daysBetween(progress.lastDaily, t) : Number.NaN
  const got = claimDaily(progress, t, gap, dailyReward)
  if (!got) return // already claimed today
  progress = got.progress
  el.dailySub.textContent = streakLabel(got.streak)
  el.dailyAmount.textContent = `✦ +${got.amount}`
  el.daily.classList.remove('hidden')
  audio.sfxStar(1)
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

  // drive the floating reward pops (they hold still under reduce-motion)
  for (const f of floaters) {
    f.life += dt / 1000
    if (!reduceMotion) f.y += (f.vy * dt) / 1000
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
  const coach = hintPin ?? (currentId === 1 && sim.pulls === 0 && !resolved ? (sim.pinViews[0]?.id ?? null) : null)
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
  el.winTitle.textContent = stars === 3 ? t('win_perfect') : stars === 2 ? t('win_nice') : t('win_cleared')
  // ✦ reward line: how much stardust this pour banked, plus the running purse.
  el.winReward.textContent = reward > 0 ? `✦ +${reward}   ·   ✦ ${progress.stardust}` : `✦ ${progress.stardust}`
  el.winReward.classList.remove('pop')
  void el.winReward.offsetWidth // restart the pop animation
  el.winReward.classList.add('pop')
  // Rewarded ad at the moment of success — the highest-intent, least-intrusive
  // placement for a cozy game (we rarely fail, so a "continue" ad wouldn't fire).
  const dbl = $<HTMLButtonElement>('win-double')
  dbl.classList.toggle('hidden', !(adsAvailable() && reward > 0))
  dbl.disabled = false
  dbl.textContent = t('double_reward')
  const isLast = currentId >= LEVEL_COUNT
  ;($('win-next') as HTMLButtonElement).textContent = isLast ? t('menu') : t('next')
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
    const chName = t('chapter_' + ch.name.toLowerCase())
    title.innerHTML = `<span>✦ ${chName}</span><span class="chapter-prog">${got} / ${levels.length * 3}</span>`
    const grid = document.createElement('div')
    grid.className = 'chapter-grid'
    for (const lv of levels) {
      const unlocked = lv.id <= progress.unlocked
      const stars = progress.stars[lv.id] ?? 0
      const cell = document.createElement('button')
      cell.className =
        'level-cell' + (unlocked ? '' : ' locked') + (stars >= 3 ? ' full' : '') + (lv.spike && unlocked ? ' spike' : '')
      cell.innerHTML = unlocked
        ? `${lv.spike ? '<span class="spike-mark">✦</span>' : ''}<span>${lv.id}</span><span class="mini-stars">${'★'.repeat(stars)}</span>`
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

/** ✦ Sky-theme shop — the currency sink. Buying/selecting a theme only recolours
 *  the background, so it's pure cozy self-expression (no gameplay effect). */
function openShop(): void {
  hideAllOverlays()
  renderShop()
  $('shop-ad').classList.toggle('hidden', !adsAvailable()) // only where ads exist
  // GDPR: let users revisit their consent choice (promised in the privacy policy)
  $('shop-privacy').classList.toggle('hidden', !privacyOptionsAvailable())
  el.shop.classList.remove('hidden')
}

function renderShop(): void {
  el.shopSub.innerHTML = `<span class="dust">✦ ${progress.stardust}</span> ${t('to_spend')}`
  el.shopGrid.innerHTML = ''
  for (const th of THEMES) {
    const owned = progress.owned.includes(th.id)
    const selected = progress.theme === th.id
    const affordable = progress.stardust >= th.cost
    const cell = document.createElement('button')
    cell.className = 'theme-swatch' + (selected ? ' selected' : '') + (!owned && !affordable ? ' cant' : '')
    const state = selected ? t('selected') : owned ? t('select') : `✦ ${th.cost}`
    cell.innerHTML =
      `<span class="swatch-preview" style="background:linear-gradient(160deg, ${th.bg0}, ${th.bg1})">` +
      `<i style="background:${th.deco}"></i><i style="background:${th.deco}"></i><i style="background:${th.deco}"></i></span>` +
      `<span class="swatch-name">${t('theme_' + th.id)}</span>` +
      `<span class="swatch-state">${state}</span>`
    cell.addEventListener('click', () => {
      if (selected) return
      const next = pickTheme(progress, th.id, th.cost)
      if (!next) {
        // not enough ✦ — a gentle shake, no scary modal
        cell.classList.remove('deny')
        void cell.offsetWidth
        cell.classList.add('deny')
        return
      }
      progress = next
      applyTheme()
      renderShop()
    })
    el.shopGrid.appendChild(cell)
  }
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
$('btn-shop').addEventListener('click', openShop)
$('shop-close').addEventListener('click', openMenu) // Back → the level map
$('shop-privacy').addEventListener('click', () => void showPrivacyOptions())
$('hint-ad').addEventListener('click', () => {
  const btn = $<HTMLButtonElement>('hint-ad')
  btn.disabled = true
  void showRewarded().then((ok) => {
    btn.disabled = false
    if (!ok) {
      btn.textContent = t('ad_unavailable')
      window.setTimeout(() => (btn.textContent = t('hint_ad')), 1600)
      return
    }
    hintPin = nextSolutionPin() // the coach arrow now points at the right peg
    btn.classList.add('hidden')
  })
})
$('win-double').addEventListener('click', () => {
  const btn = $<HTMLButtonElement>('win-double')
  btn.disabled = true
  void showRewarded().then((ok) => {
    if (!ok) {
      btn.textContent = t('ad_unavailable')
      window.setTimeout(() => {
        btn.textContent = t('double_reward')
        btn.disabled = false
      }, 1600)
      return
    }
    progress = addStardust(progress, lastReward) // pay the same amount again = ×2
    lastReward *= 2
    el.winReward.textContent = `✦ +${lastReward}   ·   ✦ ${progress.stardust}`
    el.winReward.classList.remove('pop')
    void el.winReward.offsetWidth
    el.winReward.classList.add('pop')
    btn.classList.add('hidden') // one double per level
    audio.sfxStar(2)
  })
})
$('shop-ad').addEventListener('click', () => {
  const btn = $<HTMLButtonElement>('shop-ad')
  btn.disabled = true
  void showRewarded().then((ok) => {
    btn.disabled = false
    if (ok) {
      progress = addStardust(progress, AD_REWARD)
      renderShop()
    } else {
      btn.textContent = t('ad_unavailable')
      window.setTimeout(() => (btn.textContent = t('watch_ad')), 1600)
    }
  })
})
$('btn-restart').addEventListener('click', () => loadLevel(currentId))
$('win-replay').addEventListener('click', () => loadLevel(currentId))
$('win-share').addEventListener('click', () => {
  void shareResult(sim.level, lastStars, { theme: progress.theme, stardust: progress.stardust })
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
  // first user gesture — nudge the audio context awake + start the cozy bed
  audio.sfxPull()
  audio.ambientStart()
  window.setTimeout(offerDaily, 450) // after the title fades, before they play
})
$('daily-ok').addEventListener('click', () => el.daily.classList.add('hidden'))

// ── boot ──────────────────────────────────────────────────────
loadLevel(Math.min(progress.unlocked, LEVEL_COUNT))
requestAnimationFrame(frame)
