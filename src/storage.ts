/** LocalStorage-backed progress: highest unlocked level + best stars per level. */

const KEY = 'cosmic-pull.progress.v1'

export interface Progress {
  /** highest level id the player may enter (1-based) */
  unlocked: number
  /** levelId → best star count (1–3) */
  stars: Record<number, number>
  muted: boolean
  /** ✦ stardust currency — the meta balance (earned from overflow + mastery). */
  stardust: number
  /** unlocked sky-theme ids (always includes the free 'parchment'). */
  owned: string[]
  /** currently selected sky-theme id. */
  theme: string
  /** YYYY-MM-DD of the last claimed daily bonus ('' = never). */
  lastDaily: string
  /** consecutive days claimed (1-based; resets after a missed day). */
  streak: number
}

const DEFAULT: Progress = {
  unlocked: 1,
  stars: {},
  muted: false,
  stardust: 0,
  owned: ['parchment'],
  theme: 'parchment',
  lastDaily: '',
  streak: 0,
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT, owned: [...DEFAULT.owned] }
    // Schema is grown additively: a v1 save (no stardust/owned/theme) just
    // back-fills the defaults, so old players keep every level + star.
    const p = JSON.parse(raw) as Partial<Progress>
    const owned = Array.isArray(p.owned) && p.owned.length ? p.owned : ['parchment']
    if (!owned.includes('parchment')) owned.unshift('parchment')
    return {
      unlocked: p.unlocked ?? 1,
      stars: p.stars ?? {},
      muted: p.muted ?? false,
      stardust: p.stardust ?? 0,
      owned,
      theme: owned.includes(p.theme ?? '') ? (p.theme as string) : 'parchment',
      lastDaily: p.lastDaily ?? '',
      streak: p.streak ?? 0,
    }
  } catch {
    return { ...DEFAULT, owned: [...DEFAULT.owned] }
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* private mode / quota — ignore, game still playable this session */
  }
}

/** Record a win: bump unlocked, keep the best star count. Returns mutated copy. */
export function recordWin(p: Progress, levelId: number, stars: number, levelCount: number): Progress {
  const next: Progress = { ...p, stars: { ...p.stars } }
  next.stars[levelId] = Math.max(next.stars[levelId] ?? 0, stars)
  next.unlocked = Math.min(levelCount, Math.max(next.unlocked, levelId + 1))
  saveProgress(next)
  return next
}

export function totalStars(p: Progress): number {
  return Object.values(p.stars).reduce((a, b) => a + b, 0)
}

/** Add ✦ stardust to the purse and persist. Returns a mutated copy. */
export function addStardust(p: Progress, n: number): Progress {
  const next: Progress = { ...p, stardust: Math.max(0, p.stardust + Math.round(n)) }
  saveProgress(next)
  return next
}

/**
 * Claim today's daily ✦ if it hasn't been claimed yet.
 *
 * Streak grows when you return the next day and restarts after a gap — but a
 * missed day never costs stardust you already earned (cozy: no punishment, just
 * a smaller bonus). Returns the granted amount + the new progress, or null if
 * today is already claimed.
 */
export function claimDaily(p: Progress, todayStr: string, gapDays: number, amountFor: (streak: number) => number): { progress: Progress; amount: number; streak: number } | null {
  if (p.lastDaily === todayStr) return null // already claimed today
  const streak = gapDays === 1 ? p.streak + 1 : 1 // consecutive day extends, else restart
  const amount = amountFor(streak)
  const next: Progress = { ...p, stardust: p.stardust + amount, lastDaily: todayStr, streak }
  saveProgress(next)
  return { progress: next, amount, streak }
}

/**
 * Select a sky theme, buying it first if it isn't owned yet. Returns the
 * mutated+saved progress, or `null` if it costs more ✦ than the purse holds
 * (caller shows a "not enough" nudge). Selecting an owned theme is always free.
 */
export function pickTheme(p: Progress, id: string, cost: number): Progress | null {
  if (p.owned.includes(id)) {
    const next: Progress = { ...p, theme: id }
    saveProgress(next)
    return next
  }
  if (p.stardust < cost) return null
  const next: Progress = { ...p, stardust: p.stardust - cost, owned: [...p.owned, id], theme: id }
  saveProgress(next)
  return next
}
