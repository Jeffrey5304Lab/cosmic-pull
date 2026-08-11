/**
 * Global constants + AdMob wiring.
 *
 * AdMob follows the exact pattern proven in Cosmic Merge: test IDs everywhere
 * except an explicit `build:release`, so tapping ads during dev never risks the
 * account. Fill REAL_* + Info.plist before shipping.
 */

/** Authoring resolution. All level data is in these units. Portrait 2:3. */
export const WORLD = { w: 100, h: 150 } as const

/** Physics tuning (world units, seconds). */
export const PHYS = {
  /** gentle gravity → cozy, floaty pour + fewer fast-body tunnelling artifacts */
  gravityY: 0.5,
  /** stardust grain radius */
  grainR: 1.5,
  /** fixed simulation timestep (ms) — deterministic for the solvability sim */
  stepMs: 1000 / 60,
} as const

/** Cream-paper palette shared with Cosmic Merge (kills cold-start white flash). */
export const PALETTE = {
  paper: '#F4E9D7',
  ink: '#2B2620',
  inkSoft: '#5B5348',
  gold: '#F5B942',
  goldDeep: '#D98A1F',
  rose: '#E86A8E',
  aqua: '#4FC6C0',
  lava: '#E5533B',
  voidCore: '#3A2A55',
  wood: '#B07A46',
  woodDark: '#7A5230',
} as const

export function grainHex(color: 'gold' | 'rose' | 'aqua'): string {
  return color === 'rose' ? PALETTE.rose : color === 'aqua' ? PALETTE.aqua : PALETTE.gold
}

// ─────────────────────────── AdMob ───────────────────────────
export const ADMOB_LIVE = import.meta.env?.VITE_ADMOB_LIVE === '1'

// Google official public test IDs (safe to tap):
const TEST_REWARDED_IOS = 'ca-app-pub-3940256099942544/1712485313'
const TEST_REWARDED_ANDROID = 'ca-app-pub-3940256099942544/5224354917'

// 📋 上架前填入正式 Rewarded 廣告單元 ID（申請於 https://apps.admob.com）：
const REAL_REWARDED_IOS = ''
const REAL_REWARDED_ANDROID = ''

export function rewardedUnitId(platform: 'ios' | 'android'): string {
  const real = platform === 'ios' ? REAL_REWARDED_IOS : REAL_REWARDED_ANDROID
  const test = platform === 'ios' ? TEST_REWARDED_IOS : TEST_REWARDED_ANDROID
  if (ADMOB_LIVE && real) return real
  if (ADMOB_LIVE && !real) console.warn('[ads] release build but REAL rewarded ID empty — falling back to test ID')
  return test
}
