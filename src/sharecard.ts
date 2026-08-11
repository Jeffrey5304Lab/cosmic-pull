import { PALETTE } from './config.ts'
import type { LevelDef } from './types.ts'

/**
 * Renders a square, hand-drawn "I cleared it" card to a PNG blob and shares it
 * (Web Share API with files where available, otherwise a download). This is the
 * TikTok/IG-friendly artefact — deliberately warm and illustrated, not a
 * generic score screenshot.
 */
const SIZE = 1080

export async function shareResult(level: LevelDef, stars: number): Promise<void> {
  const blob = await renderCard(level, stars)
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

function renderCard(level: LevelDef, stars: number): Promise<Blob | null> {
  const c = document.createElement('canvas')
  c.width = SIZE
  c.height = SIZE
  const ctx = c.getContext('2d')
  if (!ctx) return Promise.resolve(null)

  // paper background
  const g = ctx.createLinearGradient(0, 0, 0, SIZE)
  g.addColorStop(0, '#F7EFE0')
  g.addColorStop(1, '#EBDCC2')
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
  ctx.font = `88px ${font}`
  ctx.fillText('COSMIC PULL', SIZE / 2, 210)

  // stars
  ctx.font = `150px ${font}`
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < stars ? PALETTE.gold : '#CBBFA8'
    ctx.fillText('★', SIZE / 2 - 180 + i * 180, 470)
  }

  // pin + falling stardust motif
  drawMotif(ctx, SIZE / 2, 640)

  ctx.fillStyle = PALETTE.ink
  ctx.font = `72px ${font}`
  ctx.fillText(`Level ${level.id} — ${level.name}`, SIZE / 2, 890)
  ctx.fillStyle = PALETTE.inkSoft
  ctx.font = `46px ${font}`
  ctx.fillText('Pull the pins. Pour the stars. ✦', SIZE / 2, 968)

  return new Promise((resolve) => c.toBlob((b) => resolve(b), 'image/png'))
}

function drawMotif(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.save()
  ctx.translate(cx, cy)
  // pin
  ctx.save()
  ctx.rotate(-0.32)
  ctx.fillStyle = PALETTE.wood
  ctx.strokeStyle = PALETTE.woodDark
  ctx.lineWidth = 6
  roundRect(ctx, -140, -26, 240, 52, 26)
  ctx.fill()
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(100, 0, 34, 0, Math.PI * 2)
  ctx.fillStyle = PALETTE.gold
  ctx.fill()
  ctx.stroke()
  ctx.restore()
  // stardust
  ctx.fillStyle = PALETTE.gold
  for (const [dx, dy, r] of [
    [-10, 60, 16],
    [22, 100, 13],
    [-24, 130, 11],
  ] as const) {
    ctx.beginPath()
    ctx.arc(dx, dy, r, 0, Math.PI * 2)
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
