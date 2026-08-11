import { PALETTE, WORLD, grainHex } from './config.ts'
import type { GameSim } from './sim.ts'
import type { StardustColor } from './types.ts'

/**
 * Hand-drawn canvas renderer. Everything is drawn with wobble, double ink
 * strokes and warm gradients so it reads as illustrated, not generated. All
 * inputs are in WORLD units; `world2screen` maps them to device pixels.
 */
export interface Transform {
  scale: number
  ox: number
  oy: number
}

export class Renderer {
  private stars: { x: number; y: number; r: number; a: number }[] = []
  private constellations: { x: number; y: number }[][] = []
  /** faint background planet (ties into the Cosmic Merge universe) */
  private planet = { x: 74, y: 30, r: 14 }

  constructor(private ctx: CanvasRenderingContext2D) {
    // deterministic starfield in world space
    let seed = 1337
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
    for (let i = 0; i < 60; i++) {
      this.stars.push({ x: rnd() * WORLD.w, y: rnd() * WORLD.h, r: 0.3 + rnd() * 0.9, a: 0.15 + rnd() * 0.5 })
    }
    // a couple of hand-placed constellations (connected star doodles)
    this.constellations = [
      [
        { x: 12, y: 18 },
        { x: 20, y: 26 },
        { x: 26, y: 20 },
        { x: 33, y: 30 },
      ],
      [
        { x: 82, y: 96 },
        { x: 88, y: 104 },
        { x: 80, y: 110 },
        { x: 90, y: 116 },
      ],
      [
        { x: 10, y: 118 },
        { x: 16, y: 126 },
        { x: 22, y: 120 },
      ],
    ]
  }

  /** Fit the world into the canvas pixel box, centred, preserving aspect. */
  transformFor(cw: number, ch: number): Transform {
    const scale = Math.min(cw / WORLD.w, ch / WORLD.h)
    return { scale, ox: (cw - WORLD.w * scale) / 2, oy: (ch - WORLD.h * scale) / 2 }
  }

  draw(sim: GameSim, t: Transform, timeMs: number, pullable: string | null, coachPin: string | null = null): void {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(t.ox, t.oy)
    ctx.scale(t.scale, t.scale)

    this.drawBackground(timeMs)
    for (const h of sim.hazardViews) this.drawHazard(h.def.kind, h.x, h.def.y, h.def.w, h.def.h, timeMs)
    for (const w of sim.level.walls) this.drawWall(w.x, w.y, w.w, w.h, w.angle ?? 0)
    for (const c of sim.cupViews)
      this.drawCup(c.def.x, c.def.y, c.def.w, c.def.h, c.ratio, c.def.color, timeMs, c.def.need - c.filled)
    for (const g of sim.grainViews) this.drawGrain(g.x, g.y, g.vx, g.vy, g.r, g.color, timeMs)
    for (const p of sim.pinViews) this.drawPin(p.x, p.y, p.len, p.thick, p.angle, p.id === pullable, timeMs)

    if (coachPin) {
      const p = sim.pinViews.find((v) => v.id === coachPin)
      if (p) this.drawCoach(p.x, p.y - p.thick, timeMs)
    }

    ctx.restore()
  }

  /** A bobbing "tap here" hand pointing down at a pin (first-level onboarding). */
  private drawCoach(x: number, y: number, timeMs: number): void {
    const ctx = this.ctx
    const bob = Math.abs(Math.sin(timeMs / 350)) * 4
    const ty = y - 10 - bob
    ctx.save()
    ctx.globalAlpha = 0.9
    // downward arrow
    ctx.fillStyle = PALETTE.ink
    ctx.beginPath()
    ctx.moveTo(x, ty + 7)
    ctx.lineTo(x - 3, ty + 1)
    ctx.lineTo(x + 3, ty + 1)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    roundRect(ctx, x - 1.2, ty - 6, 2.4, 7, 1.2)
    ctx.fill()
    ctx.restore()
  }

  // ── background ──────────────────────────────────────────────
  private drawBackground(timeMs: number): void {
    const ctx = this.ctx
    const g = ctx.createLinearGradient(0, 0, 0, WORLD.h)
    g.addColorStop(0, '#F7EFE0')
    g.addColorStop(1, '#EBDCC2')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, WORLD.w, WORLD.h)

    // faint ringed planet in the sky (cozy nod to Cosmic Merge)
    this.drawBgPlanet(timeMs)

    // constellations: connected star doodles with a soft ink line
    ctx.strokeStyle = PALETTE.goldDeep
    ctx.lineWidth = 0.25
    for (const c of this.constellations) {
      ctx.globalAlpha = 0.22
      ctx.beginPath()
      c.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
      ctx.stroke()
      ctx.globalAlpha = 0.4
      ctx.fillStyle = PALETTE.goldDeep
      for (const p of c) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 0.7, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // twinkling background stars
    for (const s of this.stars) {
      const tw = 0.6 + 0.4 * Math.sin(timeMs / 600 + s.x)
      ctx.globalAlpha = s.a * tw
      ctx.fillStyle = PALETTE.goldDeep
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  private drawBgPlanet(timeMs: number): void {
    const ctx = this.ctx
    const { x, y, r } = this.planet
    ctx.save()
    ctx.globalAlpha = 0.14
    // body
    const grd = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r)
    grd.addColorStop(0, PALETTE.gold)
    grd.addColorStop(1, PALETTE.goldDeep)
    ctx.fillStyle = grd
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    // ring
    ctx.strokeStyle = PALETTE.goldDeep
    ctx.lineWidth = 1.1
    ctx.beginPath()
    ctx.ellipse(x, y, r * 1.7, r * 0.5, -0.4 + Math.sin(timeMs / 4000) * 0.03, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  // ── walls ───────────────────────────────────────────────────
  private drawWall(x: number, y: number, w: number, h: number, angle: number): void {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    const r = Math.min(h, w) / 2
    roundRect(ctx, -w / 2, -h / 2, w, h, r)
    ctx.fillStyle = PALETTE.ink
    ctx.fill()
    ctx.lineJoin = 'round'
    ctx.strokeStyle = PALETTE.inkSoft
    ctx.lineWidth = 0.5
    ctx.stroke()
    // subtle top highlight to look hand-inked
    ctx.globalAlpha = 0.18
    roundRect(ctx, -w / 2 + 0.6, -h / 2 + 0.4, w - 1.2, h * 0.4, r * 0.6)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.restore()
  }

  // ── pins (wooden pegs) ──────────────────────────────────────
  private drawPin(x: number, y: number, len: number, thick: number, angle: number, hot: boolean, timeMs: number): void {
    const ctx = this.ctx
    // gentle idle wiggle to invite the tap
    const wob = Math.sin(timeMs / 260 + x * 0.3) * 0.03
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle + wob)

    {
      // "pull me" pulse ring — always gently breathing (reads on touch, which
      // has no hover state), brighter when the finger is over it.
      const pulse = 0.5 + 0.5 * Math.sin(timeMs / (hot ? 180 : 500))
      const pr = 1 + (hot ? 0.12 : 0.06) * pulse
      ctx.save()
      ctx.globalAlpha = hot ? 0.4 : 0.16 + 0.08 * pulse
      ctx.scale(pr, pr)
      roundRect(ctx, -len / 2 - 1.5, -thick / 2 - 1.5, len + 3, thick + 3, thick)
      ctx.strokeStyle = PALETTE.gold
      ctx.lineWidth = hot ? 1.3 : 0.9
      ctx.stroke()
      ctx.restore()
    }

    // wood body
    const g = ctx.createLinearGradient(0, -thick / 2, 0, thick / 2)
    g.addColorStop(0, PALETTE.wood)
    g.addColorStop(1, PALETTE.woodDark)
    roundRect(ctx, -len / 2, -thick / 2, len, thick, thick / 2)
    ctx.fillStyle = g
    ctx.fill()
    ctx.strokeStyle = PALETTE.woodDark
    ctx.lineWidth = 0.5
    ctx.stroke()
    // grain lines
    ctx.globalAlpha = 0.25
    ctx.strokeStyle = '#3d2a17'
    ctx.lineWidth = 0.25
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath()
      ctx.moveTo(-len / 2 + 1, i * thick * 0.22)
      ctx.lineTo(len / 2 - 1, i * thick * 0.22)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    // knob (the pull tab)
    ctx.beginPath()
    ctx.arc(len / 2, 0, thick * 0.75, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.gold
    ctx.fill()
    ctx.strokeStyle = PALETTE.woodDark
    ctx.lineWidth = 0.4
    ctx.stroke()
    ctx.restore()
  }

  // ── stardust ────────────────────────────────────────────────
  private drawGrain(x: number, y: number, vx: number, vy: number, r: number, color: StardustColor, timeMs: number): void {
    const ctx = this.ctx
    const hex = grainHex(color)
    const tw = 0.8 + 0.2 * Math.sin(timeMs / 170 + x * 1.3 + y) // per-grain twinkle
    const glow = 1 + 0.18 * Math.sin(timeMs / 200 + x + y)

    // motion trail — fast grains streak like flowing light (comet tail)
    const speed = Math.hypot(vx, vy)
    if (speed > 0.5) {
      const len = Math.min(speed * 0.9, 6)
      const nx = vx / speed
      const ny = vy / speed
      const grdT = ctx.createLinearGradient(x, y, x - nx * len, y - ny * len)
      grdT.addColorStop(0, hex)
      grdT.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.strokeStyle = grdT
      ctx.lineWidth = r * 1.3
      ctx.lineCap = 'round'
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x - nx * len, y - ny * len)
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    // soft glow halo
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r * 2.4 * glow)
    grd.addColorStop(0, hex)
    grd.addColorStop(0.5, hex)
    grd.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.globalAlpha = 0.5
    ctx.fillStyle = grd
    ctx.beginPath()
    ctx.arc(x, y, r * 2.4 * glow, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1

    // star core
    ctx.beginPath()
    ctx.arc(x, y, r * 0.92, 0, Math.PI * 2)
    ctx.fillStyle = hex
    ctx.fill()

    // 4-point sparkle cross — makes each grain read as a little star, not a ball
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(timeMs / 3000 + x)
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    const s = r * 1.7 * tw
    ctx.beginPath()
    ctx.moveTo(0, -s)
    ctx.quadraticCurveTo(0, 0, s, 0)
    ctx.quadraticCurveTo(0, 0, 0, s)
    ctx.quadraticCurveTo(0, 0, -s, 0)
    ctx.quadraticCurveTo(0, 0, 0, -s)
    ctx.fill()
    // bright center dot
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // ── cups ────────────────────────────────────────────────────
  private drawCup(x: number, y: number, w: number, h: number, ratio: number, color: StardustColor | undefined, timeMs: number, remaining: number): void {
    const ctx = this.ctx
    const left = x - w / 2
    const top = y - h / 2
    const hex = color ? grainHex(color) : PALETTE.gold

    // glass interior
    ctx.save()
    roundRect(ctx, left, top, w, h, 2)
    ctx.clip()
    // faint colour hint for colour-locked cups
    if (color) {
      ctx.globalAlpha = 0.08
      ctx.fillStyle = hex
      ctx.fillRect(left, top, w, h)
      ctx.globalAlpha = 1
    }
    // liquid fill with a wavy surface
    const fillH = (h - 1) * ratio
    const surfaceY = top + h - fillH
    const grd = ctx.createLinearGradient(0, surfaceY, 0, top + h)
    grd.addColorStop(0, hex)
    grd.addColorStop(1, PALETTE.goldDeep)
    ctx.fillStyle = grd
    ctx.beginPath()
    ctx.moveTo(left, top + h)
    ctx.lineTo(left, surfaceY)
    const amp = ratio > 0 && ratio < 1 ? 0.7 : 0.25
    for (let sx = 0; sx <= w; sx += 1) {
      const yy = surfaceY + Math.sin((sx / w) * Math.PI * 2 + timeMs / 300) * amp
      ctx.lineTo(left + sx, yy)
    }
    ctx.lineTo(left + w, top + h)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // glass outline (double-inked)
    ctx.beginPath()
    ctx.moveTo(left, top)
    ctx.lineTo(left, top + h)
    ctx.lineTo(left + w, top + h)
    ctx.lineTo(left + w, top)
    ctx.strokeStyle = PALETTE.ink
    ctx.lineWidth = 0.9
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.stroke()
    ctx.globalAlpha = 0.3
    ctx.lineWidth = 0.4
    ctx.strokeStyle = '#fff'
    ctx.stroke()
    ctx.globalAlpha = 1

    if (ratio >= 1) {
      // full check-mark badge
      ctx.save()
      ctx.translate(x, top - 2.5)
      ctx.beginPath()
      ctx.arc(0, 0, 2.4, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.aqua
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 0.7
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-1.1, 0)
      ctx.lineTo(-0.2, 0.9)
      ctx.lineTo(1.2, -0.9)
      ctx.stroke()
      ctx.restore()
    } else {
      // goal badge: how many more grains this cup still needs (legible target)
      ctx.save()
      ctx.font = `${Math.min(h * 0.5, 6)}px 'Comic Sans MS', system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'rgba(43,38,32,0.28)'
      ctx.fillText(String(Math.max(0, remaining)), x, top - 3.2)
      ctx.restore()
    }
  }

  // ── hazards ─────────────────────────────────────────────────
  private drawHazard(kind: 'lava' | 'void', x: number, y: number, w: number, h: number, timeMs: number): void {
    const ctx = this.ctx
    const left = x - w / 2
    const top = y - h / 2
    ctx.save()
    roundRect(ctx, left, top, w, h, Math.min(w, h) / 2.5)
    ctx.clip()
    if (kind === 'lava') {
      const grd = ctx.createLinearGradient(0, top, 0, top + h)
      grd.addColorStop(0, '#FF8A3D')
      grd.addColorStop(1, PALETTE.lava)
      ctx.fillStyle = grd
      ctx.fillRect(left, top, w, h)
      // molten wobble on the surface
      ctx.fillStyle = '#FFD08A'
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      ctx.moveTo(left, top + 1.5)
      for (let sx = 0; sx <= w; sx += 1) {
        ctx.lineTo(left + sx, top + 1.2 + Math.sin(sx * 0.6 + timeMs / 180) * 0.8)
      }
      ctx.lineTo(left + w, top)
      ctx.lineTo(left, top)
      ctx.fill()
      ctx.globalAlpha = 1
    } else {
      const grd = ctx.createRadialGradient(x, y, 0, x, y, Math.max(w, h) / 1.6)
      grd.addColorStop(0, '#120a20')
      grd.addColorStop(0.6, PALETTE.voidCore)
      grd.addColorStop(1, '#6a4b9a')
      ctx.fillStyle = grd
      ctx.fillRect(left, top, w, h)
      // swirl ring
      ctx.strokeStyle = 'rgba(200,170,255,0.5)'
      ctx.lineWidth = 0.6
      for (let k = 0; k < 3; k++) {
        ctx.beginPath()
        ctx.ellipse(x, y, (w / 2) * (0.4 + k * 0.25), (h / 2) * (0.4 + k * 0.25), timeMs / 400 + k, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
    ctx.restore()
    // outline
    roundRect(ctx, left, top, w, h, Math.min(w, h) / 2.5)
    ctx.strokeStyle = kind === 'lava' ? '#B33A24' : '#2a1c45'
    ctx.lineWidth = 0.7
    ctx.stroke()
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}
