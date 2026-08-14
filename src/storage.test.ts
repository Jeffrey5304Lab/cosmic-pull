import { beforeEach, describe, expect, it } from 'vitest'
import { addStardust, loadProgress, pickTheme, recordWin } from './storage.ts'

// Minimal localStorage shim (vitest runs in node — no DOM storage by default).
const store = new Map<string, string>()
;(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
} as Storage

const KEY = 'cosmic-pull.progress.v1'

describe('storage schema v2 (additive stardust migration)', () => {
  beforeEach(() => store.clear())

  it('defaults stardust to 0 for a fresh player', () => {
    expect(loadProgress().stardust).toBe(0)
  })

  it('migrates a v1 save (no stardust) without losing levels or stars', () => {
    store.set(KEY, JSON.stringify({ unlocked: 7, stars: { 1: 3, 2: 2 }, muted: true }))
    const p = loadProgress()
    expect(p.unlocked).toBe(7)
    expect(p.stars).toEqual({ 1: 3, 2: 2 })
    expect(p.muted).toBe(true)
    expect(p.stardust).toBe(0) // the only new field, back-filled
  })

  it('addStardust accumulates, persists, and never goes negative', () => {
    let p = loadProgress()
    p = addStardust(p, 5)
    expect(p.stardust).toBe(5)
    p = addStardust(p, 3)
    expect(p.stardust).toBe(8)
    expect(loadProgress().stardust).toBe(8) // persisted
    p = addStardust(p, -100)
    expect(p.stardust).toBe(0) // clamped
  })

  it('recordWin keeps the existing stardust balance intact', () => {
    let p = addStardust(loadProgress(), 9)
    p = recordWin(p, 1, 3, 25)
    expect(p.stardust).toBe(9)
    expect(p.stars[1]).toBe(3)
  })
})

describe('pickTheme (✦ sink)', () => {
  beforeEach(() => store.clear())

  it('starts owning only the free parchment theme', () => {
    const p = loadProgress()
    expect(p.owned).toEqual(['parchment'])
    expect(p.theme).toBe('parchment')
  })

  it('refuses a purchase you cannot afford (returns null, no change)', () => {
    const p = addStardust(loadProgress(), 10)
    expect(pickTheme(p, 'dusk', 30)).toBeNull()
    expect(loadProgress().owned).not.toContain('dusk')
  })

  it('buys, deducts ✦, selects, and persists', () => {
    let p = addStardust(loadProgress(), 50)
    p = pickTheme(p, 'dusk', 30)!
    expect(p.stardust).toBe(20)
    expect(p.owned).toContain('dusk')
    expect(p.theme).toBe('dusk')
    expect(loadProgress().theme).toBe('dusk')
  })

  it('re-selecting an owned theme is free', () => {
    let p = addStardust(loadProgress(), 50)
    p = pickTheme(p, 'dusk', 30)! // buy dusk → 20 left
    p = pickTheme(p, 'parchment', 0)! // switch back, free
    p = pickTheme(p, 'dusk', 30)! // re-select owned dusk, must not charge again
    expect(p.stardust).toBe(20)
    expect(p.theme).toBe('dusk')
  })
})
