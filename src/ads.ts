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
/** Set once consent has been resolved; false blocks ad requests (GDPR). */
let canRequestAds = false
/** Whether the OS/region requires us to offer a "privacy options" re-consent entry. */
let privacyOptionsRequired = false

/** ✦ granted for watching one rewarded video. */
export const AD_REWARD = 20

/** Is a rewarded-ad flow even available on this platform? (false on web/dev.) */
export function adsAvailable(): boolean {
  return native
}

/** Should the settings UI offer a "Privacy options" re-consent button? (EEA/UK/CH) */
export function privacyOptionsAvailable(): boolean {
  return native && privacyOptionsRequired
}

/**
 * Initialise AdMob once, **after** resolving GDPR/UMP consent.
 *
 * Google's User Messaging Platform decides whether a consent form is required
 * (EEA / UK / Switzerland) and collects the choice. We only request ads when
 * `canRequestAds` is true, so a user who refuses simply never sees an ad — the
 * whole game remains playable. This is what the privacy policy promises.
 */
export async function initAds(): Promise<void> {
  if (!native || initialized) return
  try {
    let info = await AdMob.requestConsentInfo()
    if (info.status === 'REQUIRED' && info.isConsentFormAvailable) {
      info = await AdMob.showConsentForm()
    }
    canRequestAds = info.canRequestAds !== false
    privacyOptionsRequired = info.privacyOptionsRequirementStatus === 'REQUIRED'
  } catch {
    // Consent flow unavailable (offline, older SDK…): fail CLOSED — no ads.
    canRequestAds = false
  }
  try {
    await AdMob.initialize()
    initialized = true
  } catch {
    /* ads unavailable — the game plays fine without them */
  }
}

/** Re-open the consent/privacy options form so a user can change their choice. */
export async function showPrivacyOptions(): Promise<void> {
  if (!native) return
  try {
    await AdMob.showPrivacyOptionsForm()
  } catch {
    /* nothing to show */
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
    if (!canRequestAds) return false // consent refused/unresolved — never request
    const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android'
    await AdMob.prepareRewardVideoAd({ adId: rewardedUnitId(platform) })
    const reward = await AdMob.showRewardVideoAd()
    return !!reward
  } catch {
    return false
  }
}
