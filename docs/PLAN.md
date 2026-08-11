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

## Resume 指引
每個 Phase 完成就 git commit。此檔為 resume 起點。中斷後讀本檔 + TaskList 即可接續。
