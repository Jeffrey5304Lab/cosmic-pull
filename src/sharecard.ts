import { PALETTE, constellationPoints, themeById } from './config.ts'
import type { LevelDef } from './types.ts'

/**
 * Renders a square, hand-drawn "I cleared it" card to a PNG blob and shares it
 * (Web Share API with files where available, otherwise a download). This is the
 * TikTok/IG-friendly artefact — deliberately warm and illustrated, not a
 * generic score screenshot. The hero is the level's own constellation (the same
 * shape the win screen lights up), themed to the player's chosen sky, so every
 * share reinforces the "rebuild the night sky" hook.
 */
const SIZE = 1080

export interface ShareOpts {
  theme?: string
  stardust?: number
}

export async function shareResult(level: LevelDef, stars: number, opts: ShareOpts = {}): Promise<void> {
  const blob = await renderCard(level, stars, opts)
  if (!blob) return
  const file = new File([blob], 'cosmic-pull.png', { type: 'image/png' })
  const text = `I cleared "${level.name}" in Cosmic Pull ${'★'.repeat(stars)}`

  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean
    share?: (data: unknown) => Promise<void>
  }
  try {
    if (nav.canShare?.({ files: [file] }) && nav.share) {
      await nav.share({ files: [file], text, title: 'Cosmic Pull' })
      return
    }
  } catch {
    // user cancelled or share failed — fall through to download
  }
  download(blob)
}

function download(blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'cosmic-pull.png'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function renderCard(level: LevelDef, stars: number, opts: ShareOpts): Promise<Blob | null> {
  const c = document.createElement('canvas')
  c.width = SIZE
  c.height = SIZE
  const ctx = c.getContext('2d')
  if (!ctx) return Promise.resolve(null)

  const theme = themeById(opts.theme ?? 'parchment')

  // themed paper background
  const g = ctx.createLinearGradient(0, 0, 0, SIZE)
  g.addColorStop(0, theme.bg0)
  g.addColorStop(1, theme.bg1)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, SIZE, SIZE)

  // border
  ctx.strokeStyle = PALETTE.ink
  ctx.lineWidth = 14
  roundRect(ctx, 40, 40, SIZE - 80, SIZE - 80, 48)
  ctx.stroke()

  const font = "'Gochi Hand', 'Comic Sans MS', sans-serif"
  ctx.textAlign = 'center'

  ctx.fillStyle = PALETTE.goldDeep
  ctx.font = `84px ${font}`
  ctx.fillText('COSMIC PULL', SIZE / 2, 180)

  // stars
  ctx.font = `132px ${font}`
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < stars ? PALETTE.gold : '#CBBFA8'
    ctx.fillText('★', SIZE / 2 - 160 + i * 160, 330)
  }

  // hero: the level's constellation, lit up in the themed sky
  drawConstellation(ctx, level.id, theme.deco, 210, 400, 660, 250)

  ctx.fillStyle = PALETTE.ink
  ctx.font = `70px ${font}`
  ctx.fillText(`Level ${level.id} — ${level.name}`, SIZE / 2, 780)

  // ✦ purse — a little brag + a hook back into the meta
  if (opts.stardust && opts.stardust > 0) {
    ctx.fillStyle = PALETTE.goldDeep
    ctx.font = `56px ${font}`
    ctx.fillText(`✦ ${opts.stardust} stardust`, SIZE / 2, 866)
  }

  ctx.fillStyle = PALETTE.inkSoft
  ctx.font = `44px ${font}`
  ctx.fillText('Pull the pins. Pour the stars. ✦', SIZE / 2, 960)

  return new Promise((resolve) => c.toBlob((b) => resolve(b), 'image/png'))
}

/** The level's constellation, fully lit, mapped into the box [x,y,w,h]. */
function drawConstellation(
  ctx: CanvasRenderingContext2D,
  levelId: number,
  deco: string,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const pts = constellationPoints(levelId).map((p) => ({ x: x + p.x * w, y: y + p.y * h }))
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'

  // connecting lines
  ctx.strokeStyle = deco
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.globalAlpha = 0.55
  ctx.beginPath()
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
  ctx.stroke()

  // glowing star nodes
  for (const p of pts) {
    const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 60)
    halo.addColorStop(0, PALETTE.gold)
    halo.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.globalAlpha = 0.7
    ctx.fillStyle = halo
    ctx.beginPath()
    ctx.arc(p.x, p.y, 60, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.fillStyle = '#FFF6DC'
    ctx.beginPath()
    ctx.arc(p.x, p.y, 12, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
