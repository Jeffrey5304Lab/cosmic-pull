/**
 * Rewarded-ad wrapper (the ✦ earn hook). Native-only via Capacitor AdMob; on
 * web/dev it degrades to a no-op so the game is fully playable without ads and
 * the build never depends on a device. Real ad-unit IDs live in config.ts
 * (`REAL_REWARDED_*`) — fill them + set VITE_ADMOB_LIVE=1 for a release build.
 */
import { Capacitor } from '@capacitor/core'
import { AdMob } from '@capacitor-community/admob'
import { rewardedUnitId } from './config.ts'

const native = Capacitor.isNativePlatform()
let initialized = false

/** ✦ granted for watching one rewarded video. */
export const AD_REWARD = 20

/** Is a rewarded-ad flow even available on this platform? (false on web/dev.) */
export function adsAvailable(): boolean {
  return native
}

/** Initialise AdMob once (native only, best-effort). */
export async function initAds(): Promise<void> {
  if (!native || initialized) return
  try {
    await AdMob.initialize()
    initialized = true
  } catch {
    /* ads unavailable — the game plays fine without them */
  }
}

/**
 * Show a rewarded video. Resolves true only if the reward was actually granted
 * (user watched it through); false on web, on any error, or if they bailed.
 */
export async function showRewarded(): Promise<boolean> {
  if (!native) return false
  try {
    if (!initialized) await initAds()
    const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android'
    await AdMob.prepareRewardVideoAd({ adId: rewardedUnitId(platform) })
    const reward = await AdMob.showRewardVideoAd()
    return !!reward
  } catch {
    return false
  }
}
