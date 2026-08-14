/**
 * Dev-only screenshot harness. Boots the Vite dev server, drives `shot.html`
 * (which renders the sim synchronously — no rAF, so headless can't throttle it)
 * and writes PNGs to docs/shots/.
 *
 *   node scripts/shoot.mjs                  # every level, settled
 *   node scripts/shoot.mjs 3 11             # only levels 3 and 11
 *   node scripts/shoot.mjs --steps 0        # the untouched starting board
 *   node scripts/shoot.mjs 3 --pull hold    # after pulling specific pins
 *   node scripts/shoot.mjs --ui             # the real game UI (index.html)
 */
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { mkdir } from 'node:fs/promises'

const argv = process.argv.slice(2)
const flag = (name, dflt) => {
  const i = argv.indexOf('--' + name)
  return i >= 0 ? argv[i + 1] : dflt
}
const has = (name) => argv.includes('--' + name)
const levels = argv.filter((a) => /^\d+$/.test(a)).map(Number)
const steps = Number(flag('steps', 150))
const pull = flag('pull', '')
const win = flag('win', '')

const outDir = 'docs/shots'
await mkdir(outDir, { recursive: true })

const server = await createServer({ server: { port: 5199 }, logLevel: 'error' })
await server.listen()
const base = 'http://localhost:5199'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 460, height: 760 }, deviceScaleFactor: 2 })
page.on('pageerror', (e) => console.error('  page error:', e.message))

async function shotLevel(id) {
  const q = new URLSearchParams({ level: String(id), steps: String(steps) })
  if (pull) q.set('pull', pull)
  if (win) q.set('win', win)
  await page.goto(`${base}/shot.html?${q}`, { waitUntil: 'load' })
  await page.waitForFunction(() => document.title === 'READY', null, { timeout: 15000 })
  const status = await page.evaluate(() => window.__status)
  const file = `${outDir}/L${String(id).padStart(2, '0')}${pull ? '-pull' : ''}${win ? '-win' : ''}${steps === 0 ? '-start' : ''}.png`
  await page.locator('#c').screenshot({ path: file })
  console.log(`${file}  (status: ${status})`)
}

if (has('ui')) {
  // the real game shell — HUD, title screen, overlays
  await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: `${outDir}/ui-title.png` })
  console.log(`${outDir}/ui-title.png`)
  await page.getByRole('button', { name: 'Play' }).click()
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${outDir}/ui-game.png` })
  console.log(`${outDir}/ui-game.png`)
} else {
  const ids = levels.length ? levels : Array.from({ length: 20 }, (_, i) => i + 1)
  for (const id of ids) await shotLevel(id)
}

await browser.close()
await server.close()
