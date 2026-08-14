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
}

const DEFAULT: Progress = { unlocked: 1, stars: {}, muted: false, stardust: 0 }

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    // Schema is grown additively: a v1 save (no `stardust`) simply defaults to 0,
    // so old players keep every level + star and just start with an empty purse.
    const p = JSON.parse(raw) as Partial<Progress>
    return { unlocked: p.unlocked ?? 1, stars: p.stars ?? {}, muted: p.muted ?? false, stardust: p.stardust ?? 0 }
  } catch {
    return { ...DEFAULT }
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
