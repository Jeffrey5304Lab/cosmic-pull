# iOS App Store 送審手冊（Cosmic Pull）

> v1.0 策略：**先以「零資料收集、無廣告」版本送審**，取得最乾淨、最快的審核通過。
> 廣告（AdMob 獎勵式）留待 v1.1 再加（config.ts 已預留腳手架）。

## 0. 目前就緒狀態（程式面已完成）
- Web 版可 build（`npm run build` 綠燈）、16 關全部可解（vitest 綠燈）。
- `capacitor.config.ts`：`appId = io.github.jeffrey5304lab.cosmicpull`、`appName = Cosmic Pull`、
  背景色 `#F4E9D7`（避免冷啟白屏）。
- 隱私頁 `public/privacy.html` → build 後會在 GitHub Pages：
  `https://jeffrey5304lab.github.io/cosmic-pull/privacy.html`
- 無網路、無帳號、無分析、無廣告 → App Privacy 一律「Data Not Collected」。

## 1. 只有你能做（帳號 / GUI 步驟）
1. Apple Developer 帳號需已啟用（沿用 Cosmic Merge 的 Individual 帳號，
   Apple ID `jeffrey5304@gmail.com`）。
2. 產生原生專案（此 Mac 需已裝 Xcode + CocoaPods）：
   ```bash
   cd ~/cosmic-pull
   npx cap add ios          # 產生 ios/（已 gitignore）
   npm run cap:ios          # build + sync + 開 Xcode
   ```
3. Xcode：選 Team、確認 Bundle ID＝`io.github.jeffrey5304lab.cosmicpull`、
   版本 1.0 / build 1、僅直向（Portrait）。
4. Info.plist 確認：`ITSAppUsesNonExemptEncryption = NO`。
   （v1.0 無廣告 → 不需 GADApplicationIdentifier、不需 ATT 字串、不需 SKAdNetwork。）
5. App Store Connect → 新增 App 記錄 → Archive → 上傳 → 貼下方文案 → 送審。

## 2. 商店文案（可直接貼）

**App 名稱：** Cosmic Pull
**副標題（≤30 字元）：** Pull the pins, pour the stars
**關鍵字（≤100 字元）：** pull the pin,puzzle,physics,relax,stardust,cups,brain,cozy,logic,pin,pour

### 描述 Description（≤4000 字）
```
Pull a pin. Watch the stardust pour. Fill every cup.

Cosmic Pull is a cozy, hand-drawn pull-the-pin puzzle you can play with one thumb.
Tap the wooden pins to release glowing stardust and guide it into the cups — but
mind the lava and the drifting voids, because every grain counts.

• Simple to learn, satisfying to master — one tap is all it takes
• 16 hand-crafted levels that teach a new idea each time: funnels, colour-matching,
  timing past moving hazards, and more
• Earn up to 3 stars per level by solving it in as few pulls as possible
• A warm, illustrated art style with soft, chimey sound — perfect to unwind
• No account, no ads, no internet needed — just pull and relax

From the makers of Cosmic Merge. Pour yourself a quiet moment. ✦
```

**宣傳文字 Promotional Text（≤170 字元）：**
```
A cozy one-thumb pull-the-pin puzzle. Pull the pins, pour the glowing stardust,
fill every cup — mind the lava. 16 hand-crafted levels. No ads, no sign-up.
```

## 3. App Privacy 問卷（App Store Connect → App Privacy）
- **Data Collection：** No, we do not collect data from this app.
- 一路選「Data Not Collected」。理由：進度只存在本機 localStorage，無任何外傳。

## 4. 年齡分級（預期 4+）
- 全部暴力/成人/賭博等問卷選「無」。無使用者生成內容、無網路互動 → 4+。

## 5. App Review Information（Notes 可直接貼）
```
Cosmic Pull is a single-player, offline pull-the-pin physics puzzle.
No login is required. The game collects no data and makes no network requests.
Tap a wooden pin to remove it; released stardust falls and must land in the cups
to clear the level. There is nothing hidden to unlock for review.
```

## 6. 送審前快速檢查（在最終 build:release 上做一次）
- [ ] `npm test` 綠燈（16 關可解 + 資料完整性）
- [ ] `npm run build` 綠燈
- [ ] 實機/模擬器試玩前 3 關 + 最後 1 關，確認觸控、音效、過關動畫正常
- [ ] 直向鎖定、安全區（瀏海）留白正常
- [ ] 隱私頁 URL 可開
- [ ] 版本 1.0 / build 1、Bundle ID 正確

## 7. App 圖示
- 來源圖：`assets/icon.svg`（1024×1024 概念稿）。轉 PNG 後用：
  ```bash
  npx @capacitor/assets generate --iconBackgroundColor '#F4E9D7'
  ```
- 或沿用 Cosmic Merge 的手繪流程，維持同一質感（無 AI 感）。

## 8. Android（後續）
- 此 Mac 目前缺 Android SDK（與 Cosmic Merge 同狀況）。待補齊後：
  `npx cap add android && npm run cap:android`。
