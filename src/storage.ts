/** LocalStorage-backed progress: highest unlocked level + best stars per level. */

const KEY = 'cosmic-pull.progress.v1'

export interface Progress {
  /** highest level id the player may enter (1-based) */
  unlocked: number
  /** levelId → best star count (1–3) */
  stars: Record<number, number>
  muted: boolean
}

const DEFAULT: Progress = { unlocked: 1, stars: {}, muted: false }

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    const p = JSON.parse(raw) as Partial<Progress>
    return { unlocked: p.unlocked ?? 1, stars: p.stars ?? {}, muted: p.muted ?? false }
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
