# Cosmic Pull — 開發計劃 & 進度紀錄 (resume-point log)

> 姊妹作 of Cosmic Merge。拔栓解謎 (Pull-the-Pin physics puzzle)。
> Web-first (TypeScript + Vite + Canvas + matter-js) → Capacitor iOS/Android。
> 手工設計關卡 + 手繪太空質感 = 無 AI 感。與 Cosmic Merge 同世界觀，互相導流。

## 一句話玩法
拔出插銷 (pins) → 讓「星塵」(stardust) 流下 → 填滿杯子 (cups) 過關 → 避開岩漿/黑洞等危險。
一根手指、一看就會、每關 3 星評分、關卡制可無限擴充內容。

## 為什麼會爆紅 / 好上手
- 「拔栓」是手機廣告最紅的類型之一，玩家看一眼就懂。
- 每關 5–20 秒，失敗即重來，「再試一次」上癮迴圈。
- 物理流動很療癒、很適合 TikTok/Reels 短片。
- 手工關卡 + 手繪質感 → 不像量產 AI 遊戲。

## 技術棧 (沿用 Cosmic Merge 成功經驗)
- TypeScript + Vite (`base: './'`)，Canvas 2D 手繪渲染。
- matter-js 物理引擎。
- Capacitor 7 打包 iOS/Android；AdMob 獎勵廣告 (測試 ID 開發、release 才用正式)。
- @capacitor/haptics 觸覺、WebAudio 音效。
- vitest 測試：邏輯測試 + headless 物理 sim 驗證每關可解。
- 手繪字體 gochi-hand、奶油紙底色 `#F4E9D7` (與 Cosmic Merge 一致)。

## 核心物件
- **Pin (插銷)**：靜態 body，玩家點擊即移除。移除後其阻擋的星塵/物件開始流動。
- **Stardust (星塵)**：一堆小圓粒子，受重力流動。也可做成「發光液體」metaball 效果。
- **Cup (杯子)**：sensor 區域，統計落入的星塵量；達標即該杯滿。
- **Hazard (危險)**：岩漿/黑洞 sensor，碰到就銷毀星塵（浪費），全部浪費光=失敗。
- **可選機制**：多杯 / 顏色配對 / 會動的擋板 / 重力翻轉 / 連鎖插銷。

## 過關 / 評分
- 所有杯子填滿 → 過關。
- 3 星 = 剩餘星塵越多 / 拔栓次數越少 / 越快。
- 失敗 = 星塵在杯子填滿前全部流失/落入危險。

## 開發階段 (見 TaskList)
- Phase 0 Scaffold ✅ 進行中
- Phase 1 核心物理 + 渲染
- Phase 2 關卡系統 + 20+ 手工關
- Phase 3 手感 juice + 音效 + 手繪質感
- Phase 4 Meta：關卡地圖、星星存檔、教學、每日、分享卡、AdMob、導流
- Phase 5 測試 + 可解性 sim
- Phase 6 PWA/圖示/隱私頁/README/送審文件/截圖/部署

## 命名 / 品牌
- 產品名工作代號：**Cosmic Pull**
- repo：`cosmic-pull`
- bundle id 預定：`io.github.jeffrey5304lab.cosmicpull` (送審前可改)
- 底色 `#F4E9D7`，主色系沿用太空 + 星塵金色。

## 送審沿用 Cosmic Merge 既有經驗
- 隱私頁掛 GitHub Pages。
- Info.plist：AdMob App ID、ATT 字串、ITSAppUsesNonExemptEncryption=false、直向鎖定。
- 免費 App + AdMob（無 Apple IAP）。

## 進度快照（overnight autonomous run，2026-08-12）
- ✅ Phase 0 Scaffold（TS+Vite+Capacitor+matter-js）
- ✅ Phase 1 核心物理 + 手繪渲染（可玩 web build）
- ✅ Phase 2 16 關手工關卡，全部 vitest 驗證可解
- ✅ Phase 3 juice：粒子 FX（木屑/火花/餘燼/黑洞內縮/星星噴泉）+ 螢幕震動 + 合成音效
- ✅ Phase 6 送審準備：privacy.html、README、deploy.yml、docs/IOS_SUBMISSION.md、assets/icon.svg
- 🔜 Phase 4 Meta 加值：每日挑戰、分享卡（選配；核心已完整）
- 🔜 Phase 5 補測試：render smoke（需 node-canvas，暫略）
- 待人工：瀏覽器實機試玩（睡醒後開 `npm run dev`）、`npx cap add ios` 產生原生專案

## 試玩回饋後的第二輪改善（2026-08-12，使用者試玩後）
使用者回饋：前幾關太簡單、沒有邏輯、星塵像普通球跟 Cosmic 無關。已修：
- **核心邏輯重做**：木栓有兩種角色——**blocker（拔它放行）** vs **bridge 斜橋（撐住去路，拔錯就把星塵倒進岩漿→輸）**。星塵「剛好夠」，拔錯會失敗。L1 教基本、L2 教岩漿、L3「別拔橋」、L4「哪幾根是橋」。`traps.test.ts` 保證拔陷阱一定輸。
- **Cosmic 質感**：星塵改成會閃爍的四角星；背景加行星＋星座＋軌道環（呼應 Cosmic Merge）；快速掉落有彗星拖尾；加了暈影 vignette。
- **重大 bug 修正**：關卡會在「玩家還沒動」時自己判定失敗（tight supply + 沉降）。現在**第一次拔栓前永不判輸**；木栓依角度給不同摩擦（平的抓得住星堆、斜的才滑）。
- **UI**：杯子顯示還差幾顆的數字目標；L1 有「點這裡」提示箭頭。
- 測試擴充到 **41 個**（可解性、陷阱有牙、閒置不自輸/不自贏、亂拔不卡死）。
- 待辦：7–20 關仍是舊的 timing/color 設計（可玩但沒有 bridge 陷阱機制）；需要使用者實機確認手感與各關「橋」路由是否漂亮。

## 關鍵技術筆記（踩過的坑）
- matter-js collisionFilter 一定要帶 `group: 0`，否則 undefined===undefined 會被當同組而**停用碰撞**。
- 世界太小會穿透：物理以 6× SCALE 建置，view getter 再換回 world 單位。
- 杯子在「杯口」就收集顆粒（不等靜止），避免高速穿過薄杯底流失。
- 重力調到 0.5、顆粒 restitution 0.04 → 療癒慢流、不亂彈出杯。

## Resume 指引
每個 Phase 完成就 git commit。此檔為 resume 起點。中斷後讀本檔 + TaskList 即可接續。
