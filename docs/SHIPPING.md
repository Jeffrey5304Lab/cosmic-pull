# Shipping notes

## Locale (done)
The UI + level hints are bilingual and **auto-detect** from the device locale:
`zh*` → Traditional Chinese, everything else → English (`src/i18n.ts`). The brand
name "Cosmic Pull" stays untranslated. To test, change the device/browser
language. No user-facing toggle by design (keeps the first run clean); add one to
`i18n.ts` later if wanted.

## Rewarded ads (AdMob) — needs your real IDs to go live
Integration is done and safe: on web/dev it's a no-op; on device it shows a
rewarded video from the **✦ Styles** shop ("Watch ad for ✦ 20") and grants
`AD_REWARD` (20) stardust on completion (`src/ads.ts`). It currently runs on
**Google's public test ad unit** — real ads require:

1. **Create rewarded ad units** in the AdMob console (one iOS, one Android).
2. **Fill the IDs** in `src/config.ts` → `REAL_REWARDED_IOS` / `REAL_REWARDED_ANDROID`.
3. **Register your AdMob App ID** in the native projects:
   - iOS: `ios/App/App/Info.plist` → `GADApplicationIdentifier`.
   - Android: `android/app/src/main/AndroidManifest.xml` →
     `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" .../>`.
4. **Build for release with live ads on**: `rewardedUnitId()` only returns the
   real ID when `VITE_ADMOB_LIVE=1`. Set it for the release build, e.g.
   `VITE_ADMOB_LIVE=1 npm run build:release` (or add it to a `.env.release`), then
   `npx cap sync`.

Until steps 1–2 are done a release build logs a warning and falls back to the
test unit, so you can never accidentally serve a broken ad or risk the account.

## Other pre-submission TODOs (not code)
- App icons / splash (Capacitor assets), `manifest.webmanifest`, version bump.
- Store listing copy + screenshots (the share card art is a good source).
