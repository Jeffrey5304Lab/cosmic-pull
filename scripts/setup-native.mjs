/**
 * Re-applies our native configuration after `npx cap add ios|android`.
 *
 * The `ios/` and `android/` folders are gitignored (they're regenerated), so any
 * hand-edit to Info.plist / AndroidManifest.xml would be lost. This script makes
 * those edits reproducible: run it after adding a platform.
 *
 *   node scripts/setup-native.mjs
 *
 * What it does:
 *  - registers the AdMob **App ID** (required by the SDK, distinct from the
 *    per-format ad-unit IDs in src/config.ts)
 *  - adds NSUserTrackingUsageDescription (iOS ATT prompt copy)
 *
 * ⚠️ Replace the TEST app ids below with your real ones from the AdMob console
 * before a store release (see docs/SHIPPING.md).
 */
import { readFile, writeFile, access } from 'node:fs/promises'

// Google's public *sample* App IDs — safe for development, replace for release.
const ADMOB_APP_ID_IOS = 'ca-app-pub-3940256099942544~1458002511'
const ADMOB_APP_ID_ANDROID = 'ca-app-pub-3940256099942544~3347511713'
const ATT_MESSAGE = 'This identifier is used to show you more relevant ads. Cosmic Pull works fully without it.'

const exists = (p) => access(p).then(() => true, () => false)

async function patchIOS() {
  const p = 'ios/App/App/Info.plist'
  if (!(await exists(p))) return console.log('· ios not present, skipped')
  let x = await readFile(p, 'utf8')
  if (x.includes('GADApplicationIdentifier')) return console.log('· ios Info.plist already configured')
  x = x.replace(
    /<\/dict>\s*<\/plist>\s*$/,
    `	<key>GADApplicationIdentifier</key>
	<string>${ADMOB_APP_ID_IOS}</string>
	<key>NSUserTrackingUsageDescription</key>
	<string>${ATT_MESSAGE}</string>
</dict>
</plist>
`,
  )
  await writeFile(p, x)
  console.log('✔ ios Info.plist: GADApplicationIdentifier + ATT description')
}

async function patchAndroid() {
  const p = 'android/app/src/main/AndroidManifest.xml'
  if (!(await exists(p))) return console.log('· android not present, skipped')
  let x = await readFile(p, 'utf8')
  if (x.includes('com.google.android.gms.ads.APPLICATION_ID')) return console.log('· android manifest already configured')
  x = x.replace(
    /(\n\s*)<\/application>/,
    `$1    <meta-data
$1        android:name="com.google.android.gms.ads.APPLICATION_ID"
$1        android:value="${ADMOB_APP_ID_ANDROID}" />$1</application>`,
  )
  await writeFile(p, x)
  console.log('✔ android manifest: AdMob APPLICATION_ID')
}

await patchIOS()
await patchAndroid()
console.log('\nDone. Remember to swap the TEST app ids for your real ones before release.')
