import Matter from 'matter-js'
import { PHYS } from './config.ts'
import type { CupDef, HazardDef, LevelDef, PinDef, SimEvent, SimStatus, StardustColor } from './types.ts'

const { Engine, World, Bodies, Body, Composite, Events } = Matter

/**
 * matter-js is tuned for pixel-scale bodies; our authoring world is only
 * 100×150 with r≈1.5 grains, which tunnels through thin walls. So we build the
 * physics world at SCALE× and convert back to world units in the view getters.
 * Nothing outside this file needs to know.
 */
const SCALE = 6

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

  /**
   * FX events (WORLD units) accumulated since the last `drainEvents()`. The
   * renderer/particle layer reads these; the sim itself stays presentation-free.
   */
  events: SimEvent[] = []

  private pins = new Map<string, Matter.Body>()
  private grains: Grain[] = []
  private cups: CupRuntime[] = []
  private hazards: HazardRuntime[] = []
  private toCollect: { grain: Grain; cup: CupRuntime }[] = []
  private toWaste = new Map<Matter.Body, HazardDef['kind']>()

  constructor(level: LevelDef) {
    this.level = level
    this.engine = Engine.create()
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

    for (const wd of this.level.walls) this.addWall(wd)
    for (const pd of this.level.pins) this.addPin(pd)
    for (const cd of this.level.cups) this.addCup(cd)
    for (const hd of this.level.hazards) this.addHazard(hd)
    for (const em of this.level.emitters) this.spawnEmitter(em)
  }

  private addWall(wd: { x: number; y: number; w: number; h: number; angle?: number }): void {
    const b = Bodies.rectangle(wd.x * SCALE, wd.y * SCALE, wd.w * SCALE, wd.h * SCALE, {
      isStatic: true,
      angle: wd.angle ?? 0,
      friction: 0.4,
      restitution: 0.05,
    })
    b.collisionFilter = { group: 0, category: CAT.wall, mask: CAT.grain }
    b.label = 'wall'
    Composite.add(this.engine.world, b)
  }

  private addPin(pd: PinDef): void {
    const b = Bodies.rectangle(pd.x * SCALE, pd.y * SCALE, pd.len * SCALE, pd.thick * SCALE, {
      isStatic: true,
      angle: pd.angle ?? 0,
      // low-ish so a slanted "bridge" pin actually routes grains instead of
      // letting them jam into a stuck heap (flat blocker pins still hold fine)
      friction: 0.3,
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
      const x = cx - w / 2 + r + col * (r * 2.1) + jx * r * 0.6
      const y = cy - (em.h * SCALE) / 2 + r + row * (r * 2.05) + jy * r * 0.4
      this.addGrain(x, y, color)
    }
  }

  private addGrain(x: number, y: number, color: StardustColor): void {
    const b = Bodies.circle(x, y, PHYS.grainR * SCALE, {
      friction: 0.02,
      frictionStatic: 0.05,
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
    const remaining = this.cups.reduce((s, c) => s + Math.max(0, c.def.need - c.filled), 0)
    if (remaining === 0) {
      this.settleHoldMs += dtMs
      if (this.settleHoldMs > 250) this.status = 'won'
      return
    }
    if (remaining > this.grains.length) this.status = 'lost'
  }

  private removeGrain(g: Grain): boolean {
    const i = this.grains.indexOf(g)
    if (i < 0) return false
    this.grains.splice(i, 1)
    World.remove(this.engine.world, g.body)
    return true
  }

  // ── player actions ──────────────────────────────────────────
  pull(id: string): boolean {
    const body = this.pins.get(id)
    if (!body || this.status !== 'playing') return false
    this.pins.delete(id)
    World.remove(this.engine.world, body)
    this.pulls++
    this.events.push({
      type: 'pull',
      x: body.position.x / SCALE,
      y: body.position.y / SCALE,
      angle: body.angle,
    })
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
  get grainViews(): { x: number; y: number; color: StardustColor; r: number }[] {
    return this.grains.map((g) => ({
      x: g.body.position.x / SCALE,
      y: g.body.position.y / SCALE,
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
