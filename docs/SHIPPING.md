# Shipping notes

## Locale (done)
The UI + level hints are bilingual and **auto-detect** from the device locale:
`zh*` → Traditional Chinese, everything else → English (`src/i18n.ts`). The brand
name "Cosmic Pull" stays untranslated. To test, change the device/browser
language. No user-facing toggle by design (keeps the first run clean); add one to
`i18n.ts` later if wanted.

## Native projects & assets (done — reproducible)
`ios/` and `android/` exist now (`npx cap add …`) but are **gitignored** (they're
regenerated build output). Anything we customise in them is therefore scripted so
it survives a regeneration:

```bash
npm run build          # webDir must exist first
npx cap add ios        # / android   (only when the folder is missing)
npm run setup:native   # re-applies AdMob App ID + iOS ATT description
npm run assets         # regenerates every icon/splash size from resources/
npx cap sync
```

- `resources/icon.png` + `resources/splash.png` (1024²) are the **sources** —
  edit those, then `npm run assets`.
- PWA icons live in `public/icons/` and are wired into `manifest.webmanifest`.

## Rewarded ads (AdMob) — needs your real IDs to go live
Integration is done and safe: on web/dev it's a no-op; on device it shows a
rewarded video from the **✦ Styles** shop ("Watch ad for ✦ 20") and grants
`AD_REWARD` (20) stardust on completion (`src/ads.ts`). It currently runs on
**Google's public test ad unit** — real ads require:

1. **Create rewarded ad units** in the AdMob console (one iOS, one Android).
2. **Fill the IDs** in `src/config.ts` → `REAL_REWARDED_IOS` / `REAL_REWARDED_ANDROID`.
3. **Register your AdMob App ID**: edit the two constants at the top of
   `scripts/setup-native.mjs` (currently Google's public *test* App IDs), then run
   `npm run setup:native`. It writes `GADApplicationIdentifier` (iOS) and the
   `com.google.android.gms.ads.APPLICATION_ID` meta-data (Android).
4. **Build for release with live ads on**: `rewardedUnitId()` only returns the
   real ID when `VITE_ADMOB_LIVE=1`. Set it for the release build, e.g.
   `VITE_ADMOB_LIVE=1 npm run build:release` (or add it to a `.env.release`), then
   `npx cap sync`.

Until steps 1–2 are done a release build logs a warning and falls back to the
test unit, so you can never accidentally serve a broken ad or risk the account.

5. **GDPR/UMP consent** is implemented (`src/ads.ts` runs `requestConsentInfo` →
   `showConsentForm` before initialising, and never requests ads unless
   `canRequestAds`). In the AdMob console you must still **create the consent
   message** under *Privacy & messaging → European regulations*, otherwise no
   form can be shown. A "Ad privacy options" button in the shop lets users
   change their choice (required where `privacyOptionsRequirementStatus` is REQUIRED).

## Other pre-submission TODOs (not code)
- Version bump (`package.json` is still `1.0.0`).
- Store listing copy + screenshots (`docs/shots/` has usable ones; the share
  card art is a good feature-graphic source).
- **Device pass** — nothing below has been verified on real hardware yet:
  touch latency, notch/safe-area, low-end frame rate, the iOS mute-switch
  behaviour for WebAudio, and a run through all 25 levels to confirm the physics
  matches the test environment (spike levels have only 7–17% supply buffer).
