import { beforeEach, describe, expect, it } from 'vitest'
import { addStardust, claimDaily, loadProgress, pickTheme, recordWin } from './storage.ts'
import { dailyReward, daysBetween, today } from './logic.ts'

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

describe('daily stardust', () => {
  beforeEach(() => store.clear())

  it('grants on the first play and starts a streak', () => {
    const got = claimDaily(loadProgress(), '2026-08-15', Number.NaN, dailyReward)!
    expect(got.streak).toBe(1)
    expect(got.amount).toBe(dailyReward(1))
    expect(got.progress.stardust).toBe(dailyReward(1))
  })

  it('cannot be claimed twice on the same day', () => {
    const first = claimDaily(loadProgress(), '2026-08-15', Number.NaN, dailyReward)!
    expect(claimDaily(first.progress, '2026-08-15', 0, dailyReward)).toBeNull()
    expect(loadProgress().stardust).toBe(first.amount) // no double-dip
  })

  it('extends the streak on consecutive days and pays more', () => {
    let p = claimDaily(loadProgress(), '2026-08-15', Number.NaN, dailyReward)!
    const day1 = p.amount
    p = claimDaily(p.progress, '2026-08-16', 1, dailyReward)!
    expect(p.streak).toBe(2)
    expect(p.amount).toBeGreaterThan(day1)
  })

  it('restarts the streak after a missed day but keeps earned stardust', () => {
    let p = claimDaily(loadProgress(), '2026-08-15', Number.NaN, dailyReward)!
    p = claimDaily(p.progress, '2026-08-16', 1, dailyReward)!
    const banked = p.progress.stardust
    p = claimDaily(p.progress, '2026-08-20', 4, dailyReward)! // gap
    expect(p.streak).toBe(1) // restarted
    expect(p.progress.stardust).toBeGreaterThan(banked) // never loses what was earned
  })

  it('caps the reward so it cannot grow forever', () => {
    expect(dailyReward(7)).toBe(dailyReward(50))
    expect(dailyReward(1)).toBeLessThan(dailyReward(7))
  })

  it('daysBetween / today behave on real calendar dates', () => {
    expect(daysBetween('2026-08-15', '2026-08-16')).toBe(1)
    expect(daysBetween('2026-08-31', '2026-09-01')).toBe(1) // month rollover
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1) // year rollover
    expect(today(new Date(2026, 7, 5))).toBe('2026-08-05') // zero-padded, local
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
