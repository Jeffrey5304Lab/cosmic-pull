import { PALETTE, grainHex } from './config.ts'
import type { SimEvent, StardustColor } from './types.ts'

/**
 * Lightweight particle layer, drawn in WORLD units on top of the scene.
 * Kept tasteful and warm — hand-drawn wood chips, soft sparkles, gentle
 * embers — rather than the generic confetti explosion that screams "AI game".
 */
type Kind = 'chip' | 'spark' | 'ember' | 'implode' | 'star' | 'ring'

interface P {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  rot: number
  spin: number
  grav: number
  color: string
  kind: Kind
}

export class Particles {
  private ps: P[] = []

  get count(): number {
    return this.ps.length
  }

  clear(): void {
    this.ps.length = 0
  }

  /** Translate a sim FX event into a small, characterful burst. */
  emit(ev: SimEvent): void {
    if (ev.type === 'pull') this.pullBurst(ev.x, ev.y, ev.angle)
    else if (ev.type === 'collect') this.collectSparkle(ev.x, ev.y, ev.color)
    else if (ev.type === 'waste') {
      if (ev.kind === 'lava') this.emberBurst(ev.x, ev.y)
      else this.implode(ev.x, ev.y)
    }
  }

  private add(p: Partial<P> & Pick<P, 'x' | 'y' | 'kind'>): void {
    this.ps.push({
      vx: 0,
      vy: 0,
      life: 0,
      max: 0.6,
      size: 1,
      rot: 0,
      spin: 0,
      grav: 0,
      color: PALETTE.gold,
      ...p,
    })
  }

  private pullBurst(x: number, y: number, angle: number): void {
    // wood chips fly off the knob end + a puff of dust
    for (let i = 0; i < 7; i++) {
      const a = angle + (Math.random() - 0.5) * 2.4
      const sp = 14 + Math.random() * 26
      this.add({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 8,
        max: 0.4 + Math.random() * 0.3,
        size: 0.8 + Math.random() * 1.1,
        rot: Math.random() * 6,
        spin: (Math.random() - 0.5) * 20,
        grav: 90,
        color: Math.random() < 0.5 ? PALETTE.wood : PALETTE.woodDark,
        kind: 'chip',
      })
    }
    for (let i = 0; i < 5; i++) {
      this.add({
        x,
        y,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 14,
        max: 0.35,
        size: 1.4 + Math.random(),
        color: '#fff4dc',
        kind: 'spark',
      })
    }
  }

  private collectSparkle(x: number, y: number, color: StardustColor): void {
    const hex = grainHex(color)
    for (let i = 0; i < 4; i++) {
      this.add({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: -6 - Math.random() * 10,
        max: 0.5,
        size: 0.7 + Math.random() * 0.8,
        grav: 24,
        color: i === 0 ? '#fff' : hex,
        kind: 'spark',
      })
    }
  }

  private emberBurst(x: number, y: number): void {
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6
      const sp = 10 + Math.random() * 22
      this.add({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        max: 0.5 + Math.random() * 0.3,
        size: 0.7 + Math.random(),
        grav: -20,
        color: Math.random() < 0.5 ? '#FFB25A' : PALETTE.lava,
        kind: 'ember',
      })
    }
  }

  private implode(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      const r = 5 + Math.random() * 3
      this.add({
        x: x + Math.cos(a) * r,
        y: y + Math.sin(a) * r,
        vx: -Math.cos(a) * 26,
        vy: -Math.sin(a) * 26,
        max: 0.35,
        size: 0.9,
        color: '#caa8ff',
        kind: 'implode',
      })
    }
  }

  /** A cup just filled up: a bright ring + a little upward sparkle pop. */
  cupBurst(x: number, y: number, color: StardustColor): void {
    const hex = grainHex(color)
    this.add({ x, y, size: 3, max: 0.55, color: hex, kind: 'ring' })
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2
      const sp = 16 + Math.random() * 24
      this.add({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        max: 0.6,
        size: 0.8 + Math.random(),
        grav: 40,
        color: i % 3 === 0 ? '#fff' : hex,
        kind: 'star',
        rot: Math.random() * 6,
        spin: (Math.random() - 0.5) * 12,
      })
    }
  }

  /** Celebratory star fountain from a point (level complete). */
  celebrate(x: number, y: number): void {
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.9
      const sp = 30 + Math.random() * 55
      this.add({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        max: 1.1 + Math.random() * 0.6,
        size: 1.1 + Math.random() * 1.4,
        rot: Math.random() * 6,
        spin: (Math.random() - 0.5) * 10,
        grav: 55,
        color: [PALETTE.gold, PALETTE.rose, PALETTE.aqua][i % 3],
        kind: 'star',
      })
    }
  }

  update(dtMs: number): void {
    const dt = dtMs / 1000
    for (const p of this.ps) {
      p.life += dt
      p.vy += p.grav * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.rot += p.spin * dt
    }
    this.ps = this.ps.filter((p) => p.life < p.max)
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.ps) {
      const k = 1 - p.life / p.max
      ctx.globalAlpha = Math.max(0, k)
      ctx.fillStyle = p.color
      if (p.kind === 'ring') {
        const r = p.size + (1 - k) * 14
        ctx.globalAlpha = Math.max(0, k) * 0.8
        ctx.strokeStyle = p.color
        ctx.lineWidth = 1 + k * 1.5
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.stroke()
      } else if (p.kind === 'chip') {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size)
        ctx.restore()
      } else if (p.kind === 'star') {
        drawStar(ctx, p.x, p.y, p.size * (0.6 + 0.4 * k), p.rot)
      } else {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * (p.kind === 'implode' ? k : 1), 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    const a2 = a + Math.PI / 5
    ctx.lineTo(Math.cos(a2) * r * 0.45, Math.sin(a2) * r * 0.45)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}
