/**
 * Dev-only headless render harness (not shipped). Drives the sim + renderer
 * synchronously so screenshots don't depend on requestAnimationFrame (which
 * headless Chromium throttles). Usage:
 *   /shot.html?level=3&steps=90&pull=hold
 */
import { GameSim } from './sim.ts'
import { Renderer } from './render.ts'
import { getLevel, LEVEL_COUNT } from './levels.ts'

const p = new URLSearchParams(location.search)
const levelId = Math.min(LEVEL_COUNT, Math.max(1, Number(p.get('level') || '1')))
const steps = Number(p.get('steps') || '0')
const pulls = (p.get('pull') || '').split(',').filter(Boolean)
const winProgress = Number(p.get('win') || '0') // 0..1, drives the win constellation reveal
const theme = p.get('theme') || 'parchment' // sky-theme id for previewing shop styles

const canvas = document.getElementById('c') as HTMLCanvasElement
canvas.width = 460
canvas.height = 690
const ctx = canvas.getContext('2d')!
const renderer = new Renderer(ctx)
renderer.setTheme(theme)
const sim = new GameSim(getLevel(levelId)!)

for (const id of pulls) sim.pull(id)
const dt = 1000 / 60
for (let i = 0; i < steps; i++) sim.step(dt)

const t = renderer.transformFor(canvas.width, canvas.height)
ctx.setTransform(1, 0, 0, 1, 0, 0)
renderer.draw(sim, t, steps * dt, null, null, winProgress)
;(window as unknown as { __png: string; __status: string }).__png = canvas.toDataURL('image/png')
;(window as unknown as { __status: string }).__status = sim.status
document.title = 'READY'
