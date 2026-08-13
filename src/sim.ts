import Matter from 'matter-js'
import { PHYS } from './config.ts'
import type { CupDef, HazardDef, LevelDef, PinDef, SimEvent, SimStatus, StardustColor } from './types.ts'

const { Engine, World, Bodies, Body, Composite, Events, Sleeping } = Matter

/**
 * matter-js is tuned for pixel-scale bodies; our authoring world is only
 * 100×150 with r≈1.5 grains, which tunnels through thin walls. So we build the
 * physics world at SCALE× and convert back to world units in the view getters.
 * Nothing outside this file needs to know.
 */
const SCALE = 6

/** Net displacement (WORLD units) a grain must drift before the board counts as
 *  "active" again — above resting jitter, below any real slide. */
const REST_EPS = 0.35
/** How long the board must stay quiescent before we call it stuck (ms). */
const STUCK_HOLD_MS = 800
/** Beat between pulling a chain pin and its `releases` auto-popping. */
const CHAIN_DELAY_MS = 260

// Collision categories (bit flags).
const CAT = {
  wall: 0x0001,
  pin: 0x0002,
  grain: 0x0004,
  sensor: 0x0008, // cups + hazards (sensors, don't push grains)
} as const

interface Grain {
  body: Matter.Body
  color: StardustColor
  /** rest anchor: last position where this grain was "settled" (physics units).
   *  Used for jitter-robust quiescence (net displacement, not noisy velocity). */
  ax?: number
  ay?: number
}

interface CupRuntime {
  def: CupDef
  filled: number
  sensor: Matter.Body
}

interface HazardRuntime {
  def: HazardDef
  sensor: Matter.Body
  baseX: number
  phase: number
}

/**
 * GameSim — the DOM-free heart of Cosmic Pull.
 *
 * Build from a LevelDef, `step(dt)` on a fixed clock, read `status`/cups for UI.
 * Identical in the browser and in the headless solvability tests (Phase 5).
 */
export class GameSim {
  readonly level: LevelDef
  readonly engine: Matter.Engine
  status: SimStatus = 'playing'
  pulls = 0
  wasted = 0
  private settleHoldMs = 0
  /** ms the whole board has been quiescent (no grain drifting past REST_EPS). */
  private quietMs = 0
  /** sim-time clock (ms), used to fire scheduled chain-pin releases. */
  private clockMs = 0
  /** chain pins queued to auto-release: {pin id, when in clockMs}. */
  private pendingReleases: { id: string; atMs: number }[] = []

  /**
   * FX events (WORLD units) accumulated since the last `drainEvents()`. The
   * renderer/particle layer reads these; the sim itself stays presentation-free.
   */
  events: SimEvent[] = []

  private pins = new Map<string, Matter.Body>()
  private grains: Grain[] = []
  private cups: CupRuntime[] = []
  private hazards: HazardRuntime[] = []
  /** gate walls: removed once their `cupId` fills, opening a held path. */
  private gates: { body: Matter.Body; cupId: string; open: boolean }[] = []
  private toCollect: { grain: Grain; cup: CupRuntime }[] = []
  private toWaste = new Map<Matter.Body, HazardDef['kind']>()

  constructor(level: LevelDef) {
    this.level = level
    // Sleeping: resting piles freeze completely (no micro-jitter/creep). This
    // is what makes the quiescence/stuck detection reliable — and saves CPU.
    // Gotcha: removing a static pin does NOT wake bodies sleeping on it, so
    // pull() wakes every grain manually.
    this.engine = Engine.create({ enableSleeping: true })
    this.engine.gravity.y = PHYS.gravityY
    this.build()
    this.wireCollisions()
  }

  private build(): void {
    const w = this.level.world.w * SCALE
    const h = this.level.world.h * SCALE
    const t = 6 * SCALE

    // Side + ceiling walls; the bottom is intentionally OPEN — grains that miss
    // every cup fall out and are counted as wasted (see reap()).
    const bounds = [
      Bodies.rectangle(-t / 2, h / 2, t, h * 3, { isStatic: true }),
      Bodies.rectangle(w + t / 2, h / 2, t, h * 3, { isStatic: true }),
      Bodies.rectangle(w / 2, -h, t * 200, t, { isStatic: true }),
    ]
    for (const b of bounds) {
      b.collisionFilter = { group: 0, category: CAT.wall, mask: CAT.grain | CAT.pin }
      b.friction = 0.3
    }
    Composite.add(this.engine.world, bounds)

    for (const wd of this.level.walls) {
      const body = this.addWall(wd)
      if (wd.gate) this.gates.push({ body, cupId: wd.gate, open: false })
    }
    for (const pd of this.level.pins) this.addPin(pd)
    for (const cd of this.level.cups) this.addCup(cd)
    for (const hd of this.level.hazards) this.addHazard(hd)
    for (const em of this.level.emitters) this.spawnEmitter(em)
  }

  private addWall(wd: { x: number; y: number; w: number; h: number; angle?: number }): Matter.Body {
    const b = Bodies.rectangle(wd.x * SCALE, wd.y * SCALE, wd.w * SCALE, wd.h * SCALE, {
      isStatic: true,
      angle: wd.angle ?? 0,
      friction: 0.4,
      restitution: 0.05,
    })
    b.collisionFilter = { group: 0, category: CAT.wall, mask: CAT.grain }
    b.label = 'wall'
    Composite.add(this.engine.world, b)
    return b
  }

  /** Open any gate whose cup has just filled — removes the wall so the stream it
   *  held can flow. Wakes grains so a slept pile above it drops. */
  private processGates(): void {
    for (const gate of this.gates) {
      if (gate.open) continue
      const cup = this.cups.find((c) => c.def.id === gate.cupId)
      if (!cup || cup.filled < cup.def.need) continue
      gate.open = true
      World.remove(this.engine.world, gate.body)
      this.quietMs = 0
      for (const g of this.grains) Sleeping.set(g.body, false)
    }
  }

  private addPin(pd: PinDef): void {
    const angle = pd.angle ?? 0
    const b = Bodies.rectangle(pd.x * SCALE, pd.y * SCALE, pd.len * SCALE, pd.thick * SCALE, {
      isStatic: true,
      angle,
      // Horizontal "blocker" pins need grip so the resting pile never leaks off
      // before you pull; slanted "bridge" pins need low friction so grains slide
      // down them cleanly instead of jamming into a stuck heap.
      friction: Math.abs(angle) < 0.15 ? 0.6 : 0.3,
      restitution: 0.05,
    })
    b.collisionFilter = { group: 0, category: CAT.pin, mask: CAT.grain }
    b.label = 'pin:' + pd.id
    this.pins.set(pd.id, b)
    Composite.add(this.engine.world, b)
  }

  private addCup(cd: CupDef): void {
    const wallT = 2 * SCALE
    const floorT = 4 * SCALE // thick floor so fast grains can't tunnel through
    const cx = cd.x * SCALE
    const cy = cd.y * SCALE
    const cw = cd.w * SCALE
    const ch = cd.h * SCALE
    const left = Bodies.rectangle(cx - cw / 2, cy, wallT, ch, { isStatic: true })
    const right = Bodies.rectangle(cx + cw / 2, cy, wallT, ch, { isStatic: true })
    const floor = Bodies.rectangle(cx, cy + ch / 2, cw + wallT, floorT, { isStatic: true })
    for (const b of [left, right, floor]) {
      b.collisionFilter = { group: 0, category: CAT.wall, mask: CAT.grain }
      b.label = 'cupwall'
      b.friction = 0.6
    }
    const sensor = Bodies.rectangle(cx, cy, cw - wallT, ch, { isStatic: true, isSensor: true })
    sensor.collisionFilter = { group: 0, category: CAT.sensor, mask: CAT.grain }
    sensor.label = 'cup:' + cd.id
    Composite.add(this.engine.world, [left, right, floor, sensor])
    this.cups.push({ def: cd, filled: 0, sensor })
  }

  private addHazard(hd: HazardDef): void {
    const sensor = Bodies.rectangle(hd.x * SCALE, hd.y * SCALE, hd.w * SCALE, hd.h * SCALE, {
      isStatic: true,
      isSensor: true,
    })
    sensor.collisionFilter = { group: 0, category: CAT.sensor, mask: CAT.grain }
    sensor.label = 'hazard'
    Composite.add(this.engine.world, sensor)
    this.hazards.push({ def: hd, sensor, baseX: hd.x * SCALE, phase: 0 })
  }

  private spawnEmitter(em: {
    x: number
    y: number
    w: number
    h: number
    count: number
    color?: StardustColor
  }): void {
    const color = em.color ?? 'gold'
    const r = PHYS.grainR * SCALE
    const w = em.w * SCALE
    const cx = em.x * SCALE
    const cy = em.y * SCALE
    const perRow = Math.max(1, Math.floor(w / (r * 2.1)))
    for (let i = 0; i < em.count; i++) {
      const col = i % perRow
      const row = Math.floor(i / perRow)
      const jx = ((i * 37) % 13) / 13 - 0.5
      const jy = ((i * 53) % 11) / 11 - 0.5
      // Stack the pile UPWARD from the emitter's bottom edge, and only small
      // jitter. (Stacking downward pushed the bottom rows of a big pile into the
      // blocker just below → matter ejected them → the pile leaked/scattered.)
      const x = cx - w / 2 + r + col * (r * 2.2) + jx * r * 0.15
      const y = cy + (em.h * SCALE) / 2 - r - row * (r * 2.15) + jy * r * 0.15
      this.addGrain(x, y, color)
    }
  }

  private addGrain(x: number, y: number, color: StardustColor): void {
    const b = Bodies.circle(x, y, PHYS.grainR * SCALE, {
      // Enough friction to grip a flat blocker (pile stays put until pulled) but
      // still below the slope of the bridges (angle ≳0.5) so they route/flow.
      friction: 0.35,
      frictionStatic: 0.7,
      restitution: 0.04, // low bounce so grains settle into cups instead of hopping out
      density: 0.02,
    })
    b.collisionFilter = { group: 0, category: CAT.grain, mask: CAT.grain | CAT.wall | CAT.pin | CAT.sensor }
    b.label = 'grain'
    this.grains.push({ body: b, color })
    Composite.add(this.engine.world, b)
  }

  private wireCollisions(): void {
    Events.on(this.engine, 'collisionActive', (ev) => {
      for (const pair of ev.pairs) this.handlePair(pair.bodyA, pair.bodyB)
    })
    Events.on(this.engine, 'collisionStart', (ev) => {
      for (const pair of ev.pairs) this.handlePair(pair.bodyA, pair.bodyB)
    })
  }

  private handlePair(a: Matter.Body, b: Matter.Body): void {
    const grainBody = a.label === 'grain' ? a : b.label === 'grain' ? b : null
    if (!grainBody) return
    const other = grainBody === a ? b : a
    const grain = this.grains.find((g) => g.body === grainBody)
    if (!grain) return

    if (other.label?.startsWith('cup:')) {
      const cup = this.cups.find((c) => c.sensor === other)
      if (!cup) return
      // Grab the grain the moment it's truly inside the mouth (center past the
      // rim). No speed gate: catching it at the top also prevents fast grains
      // from tunnelling through the floor before they can "settle".
      const mouthTop = (cup.def.y - cup.def.h / 2) * SCALE
      if (grainBody.position.y < mouthTop + PHYS.grainR * SCALE) return // just grazing the rim
      if (grainBody.velocity.y < -0.5 * SCALE) return // bouncing back up out of the cup
      if (cup.def.color && cup.def.color !== grain.color) return // wrong colour: reject
      this.toCollect.push({ grain, cup })
    } else if (other.label === 'hazard') {
      const hz = this.hazards.find((h) => h.sensor === other)
      this.toWaste.set(grainBody, hz?.def.kind ?? 'lava')
    }
  }

  step(dtMs: number = PHYS.stepMs): void {
    if (this.status !== 'playing') {
      Engine.update(this.engine, dtMs)
      return
    }

    // fire any chain-pin releases whose beat has elapsed (auto, not a player pull)
    this.clockMs += dtMs
    if (this.pendingReleases.length) {
      const due = this.pendingReleases.filter((r) => r.atMs <= this.clockMs)
      this.pendingReleases = this.pendingReleases.filter((r) => r.atMs > this.clockMs)
      for (const r of due) this.removePin(r.id, false)
    }

    for (const hz of this.hazards) {
      if (hz.def.moveX && hz.def.moveRange) {
        hz.phase += (dtMs / 1000) * hz.def.moveX
        const nx = hz.baseX + Math.sin(hz.phase) * hz.def.moveRange * SCALE
        Body.setPosition(hz.sensor, { x: nx, y: hz.def.y * SCALE })
      }
    }

    Engine.update(this.engine, dtMs)

    for (const { grain, cup } of this.toCollect) {
      const x = grain.body.position.x / SCALE
      const y = grain.body.position.y / SCALE
      if (this.removeGrain(grain)) {
        cup.filled++
        this.events.push({ type: 'collect', x, y, color: grain.color })
      }
    }
    this.toCollect.length = 0
    for (const [body, kind] of this.toWaste) {
      const g = this.grains.find((gg) => gg.body === body)
      if (!g) continue
      const x = g.body.position.x / SCALE
      const y = g.body.position.y / SCALE
      if (this.removeGrain(g)) {
        this.wasted++
        this.events.push({ type: 'waste', x, y, kind })
      }
    }
    this.toWaste.clear()

    this.processGates() // open any gate whose cup just filled
    this.reap()
    this.evaluate(dtMs)
  }

  /** Grains that fall past the open bottom are wasted. */
  private reap(): void {
    const killY = (this.level.world.h + 24) * SCALE
    for (const g of [...this.grains]) {
      if (g.body.position.y > killY) {
        if (this.removeGrain(g)) this.wasted++
      }
    }
  }

  private evaluate(dtMs: number): void {
    this.trackQuiescence(dtMs)
    const remaining = this.cups.reduce((s, c) => s + Math.max(0, c.def.need - c.filled), 0)
    if (remaining === 0) {
      this.settleHoldMs += dtMs
      if (this.settleHoldMs > 250) this.status = 'won'
      return
    }
    // Never lose before the first pull — the player should be free to study the
    // board without a stray settling grain failing the level for them.
    if (this.pulls > 0 && remaining > this.grains.length) this.status = 'lost'
  }

  /** Jitter-robust "has the board gone still?" — a resting pile still velocity-
   *  jitters, so we track *net displacement* from each grain's rest anchor.
   *  A grain that drifts past REST_EPS re-anchors and counts the board as active. */
  private trackQuiescence(dtMs: number): void {
    const eps = REST_EPS * SCALE
    let active = this.grains.length === 0
    for (const g of this.grains) {
      const p = g.body.position
      if (g.ax === undefined) {
        g.ax = p.x
        g.ay = p.y
        active = true
        continue
      }
      if (Math.hypot(p.x - g.ax, p.y - g.ay!) > eps) {
        g.ax = p.x
        g.ay = p.y
        active = true
      }
    }
    this.quietMs = active ? 0 : this.quietMs + dtMs
  }

  /** True when the board can no longer progress and the player must retry:
   *  cups unfilled, everything has come to rest, and no un-pulled pin is still
   *  holding grains (so no remaining pull could ever mobilise the pile). Cozy
   *  design: this drives a gentle "tap ↻" cue, NOT an automatic loss. */
  get stuck(): boolean {
    if (this.status !== 'playing' || this.pulls === 0) return false
    if (this.quietMs < STUCK_HOLD_MS) return false
    const remaining = this.cups.reduce((s, c) => s + Math.max(0, c.def.need - c.filled), 0)
    if (remaining === 0) return false
    return !this.anyPinHoldingGrain()
  }

  /** Any un-pulled pin with a grain resting against it? If so, pulling it can
   *  still change the board (free a pile, or drop a bridged stream — sometimes
   *  into a cup!), so this is not a dead end. Only when NO pin touches any
   *  grain is the board provably frozen: pins interact with nothing else, so no
   *  remaining pull can move a single grain. */
  private anyPinHoldingGrain(): boolean {
    const reach = (PHYS.grainR + 0.8) * SCALE
    for (const [, pin] of this.pins) {
      for (const g of this.grains) {
        if (distToBody(pin, g.body.position.x, g.body.position.y) < reach) return true
      }
    }
    return false
  }

  private removeGrain(g: Grain): boolean {
    const i = this.grains.indexOf(g)
    if (i < 0) return false
    this.grains.splice(i, 1)
    World.remove(this.engine.world, g.body)
    return true
  }

  // ── player actions ──────────────────────────────────────────
  /** Player taps a pin. Chain releases (`removePin`) don't go through here so
   *  they never inflate the pull count. */
  pull(id: string): boolean {
    if (this.status !== 'playing') return false
    return this.removePin(id, true)
  }

  /** Remove a pin from the world. Shared by player pulls (`countAsPull`) and
   *  automatic chain releases. Removing a pin's `releases` are scheduled to pop
   *  after a short beat, enabling sequencing puzzles. */
  private removePin(id: string, countAsPull: boolean): boolean {
    const body = this.pins.get(id)
    if (!body) return false
    this.pins.delete(id)
    World.remove(this.engine.world, body)
    if (countAsPull) this.pulls++
    this.quietMs = 0 // a pull re-mobilises the pile; don't carry stale stillness
    // matter-js does not wake sleeping bodies when a static support vanishes —
    // without this, a slept pile hangs in mid-air after its pin is pulled.
    for (const g of this.grains) Sleeping.set(g.body, false)
    this.events.push({
      type: 'pull',
      x: body.position.x / SCALE,
      y: body.position.y / SCALE,
      angle: body.angle,
    })
    const releases = this.level.pins.find((p) => p.id === id)?.releases
    if (releases) {
      for (const rid of releases) this.pendingReleases.push({ id: rid, atMs: this.clockMs + CHAIN_DELAY_MS })
    }
    return true
  }

  /** Take and clear the FX events accumulated since the last call. */
  drainEvents(): SimEvent[] {
    const e = this.events
    this.events = []
    return e
  }

  /** Nearest pull-able pin within `maxDist` WORLD units of a point, or null. */
  pinAt(x: number, y: number, maxDist = 6): string | null {
    let best: string | null = null
    let bestD = maxDist * SCALE
    for (const [id, body] of this.pins) {
      const d = distToBody(body, x * SCALE, y * SCALE)
      if (d < bestD) {
        bestD = d
        best = id
      }
    }
    return best
  }

  // ── read-only views for the renderer (WORLD units) ──────────
  get grainViews(): { x: number; y: number; vx: number; vy: number; color: StardustColor; r: number }[] {
    return this.grains.map((g) => ({
      x: g.body.position.x / SCALE,
      y: g.body.position.y / SCALE,
      vx: g.body.velocity.x / SCALE,
      vy: g.body.velocity.y / SCALE,
      color: g.color,
      r: PHYS.grainR,
    }))
  }
  get pinViews(): { id: string; x: number; y: number; len: number; thick: number; angle: number }[] {
    return this.level.pins
      .filter((p) => this.pins.has(p.id))
      .map((p) => ({ id: p.id, x: p.x, y: p.y, len: p.len, thick: p.thick, angle: p.angle ?? 0 }))
  }
  get cupViews(): { def: CupDef; filled: number; ratio: number }[] {
    return this.cups.map((c) => ({ def: c.def, filled: c.filled, ratio: Math.min(1, c.filled / c.def.need) }))
  }
  get hazardViews(): { def: HazardDef; x: number }[] {
    return this.hazards.map((h) => ({ def: h.def, x: h.sensor.position.x / SCALE }))
  }
  get activeGrains(): number {
    return this.grains.length
  }
}

/** Distance (WORLD-scaled units) from a point to a rotated rectangular body. */
function distToBody(body: Matter.Body, x: number, y: number): number {
  const dx = x - body.position.x
  const dy = y - body.position.y
  const c = Math.cos(-body.angle)
  const s = Math.sin(-body.angle)
  const lx = dx * c - dy * s
  const ly = dx * s + dy * c
  const bnd = body.bounds
  const hw = (bnd.max.x - bnd.min.x) / 2
  const hh = (bnd.max.y - bnd.min.y) / 2
  const ex = Math.max(Math.abs(lx) - hw, 0)
  const ey = Math.max(Math.abs(ly) - hh, 0)
  return Math.hypot(ex, ey)
}
