import { it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { LEVELS } from '../src/levels.ts'
import { PALETTE } from '../src/config.ts'
import type { LevelDef, StardustColor } from '../src/types.ts'

/**
 * Not a test — a headless preview generator. Emits a single SVG montage of all
 * levels' starting layouts, mirroring the in-game palette/shapes, so the design
 * can be eyeballed without a browser. Run: `npx vitest run scripts/gen-preview`.
 */

const CW = 210
const CH = 320
const COLS = 4
const PAD = 16

function color(c: StardustColor | undefined): string {
  return c === 'rose' ? PALETTE.rose : c === 'aqua' ? PALETTE.aqua : PALETTE.gold
}

function cell(lv: LevelDef, ox: number, oy: number): string {
  const s = (CW - PAD * 2) / lv.world.w // world→cell scale
  const X = (x: number) => ox + PAD + x * s
  const Y = (y: number) => oy + 30 + y * s
  const parts: string[] = []

  // frame + paper
  parts.push(
    `<rect x="${ox + 4}" y="${oy + 4}" width="${CW - 8}" height="${CH - 8}" rx="14" fill="#F7EFE0" stroke="${PALETTE.ink}" stroke-width="2"/>`,
  )
  parts.push(
    `<text x="${ox + CW / 2}" y="${oy + 22}" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-size="15" fill="${PALETTE.goldDeep}">${lv.id}. ${lv.name}</text>`,
  )

  // hazards
  for (const h of lv.hazards) {
    const fill = h.kind === 'lava' ? PALETTE.lava : PALETTE.voidCore
    parts.push(
      `<rect x="${X(h.x - h.w / 2)}" y="${Y(h.y - h.h / 2)}" width="${h.w * s}" height="${h.h * s}" rx="4" fill="${fill}" opacity="0.9"/>`,
    )
    if (h.moveRange)
      parts.push(
        `<line x1="${X(h.x - h.moveRange)}" y1="${Y(h.y)}" x2="${X(h.x + h.moveRange)}" y2="${Y(h.y)}" stroke="${fill}" stroke-width="1" stroke-dasharray="3 3" opacity="0.5"/>`,
      )
  }

  // walls
  for (const w of lv.walls) {
    const cx = X(w.x)
    const cy = Y(w.y)
    const deg = ((w.angle ?? 0) * 180) / Math.PI
    parts.push(
      `<g transform="rotate(${deg.toFixed(1)} ${cx} ${cy})"><rect x="${cx - (w.w * s) / 2}" y="${cy - (w.h * s) / 2}" width="${w.w * s}" height="${w.h * s}" rx="${(Math.min(w.w, w.h) * s) / 2}" fill="${PALETTE.ink}"/></g>`,
    )
  }

  // cups
  for (const c of lv.cups) {
    const left = X(c.x - c.w / 2)
    const top = Y(c.y - c.h / 2)
    const w = c.w * s
    const h = c.h * s
    if (c.color)
      parts.push(`<rect x="${left}" y="${top}" width="${w}" height="${h}" fill="${color(c.color)}" opacity="0.12"/>`)
    parts.push(
      `<path d="M${left} ${top} L${left} ${top + h} L${left + w} ${top + h} L${left + w} ${top}" fill="none" stroke="${PALETTE.ink}" stroke-width="2.5" stroke-linejoin="round"/>`,
    )
    parts.push(
      `<text x="${left + w / 2}" y="${top + h / 2 + 4}" text-anchor="middle" font-family="sans-serif" font-size="11" fill="${PALETTE.inkSoft}">${c.need}</text>`,
    )
  }

  // stardust piles (mirror the sim's deterministic grid)
  for (const em of lv.emitters) {
    const r = 1.5
    const perRow = Math.max(1, Math.floor(em.w / (r * 2.1)))
    const dots: string[] = []
    for (let i = 0; i < em.count; i++) {
      const col = i % perRow
      const row = Math.floor(i / perRow)
      const x = em.x - em.w / 2 + r + col * (r * 2.1)
      const y = em.y - em.h / 2 + r + row * (r * 2.05)
      dots.push(`<circle cx="${X(x)}" cy="${Y(y)}" r="${r * s * 0.9}" fill="${color(em.color)}"/>`)
    }
    parts.push(dots.join(''))
  }

  // pins (wood bar + gold knob)
  for (const p of lv.pins) {
    const cx = X(p.x)
    const cy = Y(p.y)
    const deg = ((p.angle ?? 0) * 180) / Math.PI
    const len = p.len * s
    const th = p.thick * s
    parts.push(
      `<g transform="rotate(${deg.toFixed(1)} ${cx} ${cy})">` +
        `<rect x="${cx - len / 2}" y="${cy - th / 2}" width="${len}" height="${th}" rx="${th / 2}" fill="${PALETTE.wood}" stroke="${PALETTE.woodDark}" stroke-width="1"/>` +
        `<circle cx="${cx + len / 2}" cy="${cy}" r="${th * 0.75}" fill="${PALETTE.gold}" stroke="${PALETTE.woodDark}" stroke-width="1"/>` +
        `</g>`,
    )
  }

  return `<g>${parts.join('')}</g>`
}

it('generate level preview montage', () => {
  const rows = Math.ceil(LEVELS.length / COLS)
  const W = COLS * CW
  const H = rows * CH + 60
  const cells = LEVELS.map((lv, i) => cell(lv, (i % COLS) * CW, 60 + Math.floor(i / COLS) * CH)).join('\n')
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<rect width="${W}" height="${H}" fill="${PALETTE.paper}"/>` +
    `<text x="${W / 2}" y="38" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-size="28" fill="${PALETTE.ink}">Cosmic Pull — 20 Levels</text>` +
    cells +
    `</svg>`
  writeFileSync(new URL('../docs/level-previews.svg', import.meta.url), svg)
  console.log('wrote docs/level-previews.svg')
})
