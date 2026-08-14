# Cosmic Pull — 全面體檢報告（2026-08-15）

> 基於實際程式碼量測 + 市場資料，非印象評分。
> 現況：25 關、97 tests 綠、重設計已併入 main、PR #2（locale + AdMob）待合併。

---

## 0. 三個必須先知道的發現

| # | 發現 | 嚴重度 |
|---|---|---|
| 1 | **隱私權政策與 AdMob 直接矛盾**：`public/privacy.html` 白紙黑字寫 "no advertising, and no third-party trackers"，但已接入 AdMob | 🔴 **送審必被打回 / 合規風險** |
| 2 | **原生專案根本不存在**：`ios/`、`android/` 目錄沒有（`cap add` 從未執行）→ 目前**無法產生任何可上架的 build** | 🔴 **上架的絕對前提** |
| 3 | **內容量嚴重不足**：25 關 vs 同類競品 100–1000+ 關。留存曲線會在第 1 天斷掉 | 🟠 **最大的長期營收風險** |

---

## 1. 遊戲性分析

### 核心循環：✅ 完整
`看盤面 → 決定拔哪根 → 傾瀉演出 → 星星評分 → 賺 ✦ → 花在天空主題 → 下一關`
賺→花的迴圈已閉合（主題商店 + 廣告賺取）。這是本次重設計最大的補強（meta 從 0/5 → 可用）。

### 上癮機制：⚠️ 有骨架，缺「回訪理由」
| 機制 | 狀態 |
|---|---|
| 即時回饋（傾瀉音、拖尾、慢動作、星座） | ✅ 已做 |
| 收集/進度（星空圖、章節、✦） | ✅ 已做 |
| 精通追求（3★ pull budget，全關已最優緊） | ✅ 已做 |
| **每日回訪理由**（每日獎勵/任務/限時） | ❌ **完全沒有** |
| **無限內容**（關卡耗盡後玩什麼） | ❌ **25 關就結束** |
| 社交/競爭（排行榜、好友） | ❌ 無（可不做） |

**判斷**：目前是「一口氣玩完 25 關就刪掉」的結構。Hybridcasual 的 D7 留存 ~20% 靠的是 meta + 每日 + 源源不絕的關卡，我們缺後兩者。

### 難度曲線建議
實測數據：**只有 L5、L10、L21–25（7 關）真正抵抗 rote rule**，其餘 18 關「拔平的、別碰斜的」就能過。

- 現況並非全錯：cozy 方向下前段簡單是**正確的**，且尖峰已標示（✦），難度有了「意圖感」。
- **問題在密度**：Ch1（L1–8）只有 1 個尖峰、Ch2（L9–16）只有 1 個 → 中段有連續 6–7 關的「無決策帶」，這正是「玩一下就膩」的來源。
- **建議節奏**：每 8 關至少 2 個尖峰（1 個中段、1 個章末），即 Ch1 補 1 個、Ch2 補 1 個。
- **做法**：用已驗證的 bottom-up cascade 引擎（L21 模式）改造 L7 和 L14，而非新增關卡。改完必須通過 rote/solvability/traps 三套測試。

---

## 2. UI / UX 體驗

### 視覺一致性：✅ 強（本作最大資產）
手繪 ink-on-paper × 宇宙題材，在這個品類裡**極度罕見**（競品清一色 3D 卡通渲染），截圖自帶識別度。每章天空基調（暖→晨曦→暮色）已解決「每關長一樣」。

**待補**：
- 星塵/木栓/杯的素材庫仍小（4 關後看完）→ 建議每章給木栓一個材質變體（Ch3 金屬感），成本低。
- 盤面留白仍偏多（飄移微粒只緩解、未解決）。

### 動畫與回饋：✅ 已達標
傾瀉音（隨填充爬升）、加法星光拖尾、滿杯慢動作 + 鏡頭微推、勝利星座、`+N ✦` 跳字、震動。**這一塊已從 2/5 提升到接近同類水準**。

**待補**：連續傾瀉的音量曲線、慢動作時長仍需真人耳朵/手感驗收（headless 驗不到）。

### 手機操作：✅ 良好，但有 2 個未驗證項
- 已做：44pt 觸控目標、safe-area、`dvh`、`touch-action: none`、reduce-motion。
- ⚠️ **未在真機驗證過**（全程 headless）：實際觸控延遲、iPhone 瀏海/動態島裁切、低階 Android 幀率。
- ⚠️ **reduce-motion 未涵蓋新效果**：星座、`+✦` floater、鏡頭微推、飄移微粒目前仍會播（只有 shake/flash 被關）。Apple 審查會檢查。

---

## 3. 技術風險

### Matter.js 手機效能：🟢 低風險（實測）
- **最大單關 46 個 grain**（L24），全 25 關合計 776 個。matter.js 處理 <100 個圓形是**輕鬆**的。
- `enableSleeping: true` 讓靜止堆完全凍結，CPU 幾乎歸零。
- 真正的效能熱點不是物理，是 **Canvas 繪製**：每個 grain 畫 radial gradient + 加法混合光暈 + 拖尾。46 grain × 每幀重建 gradient 在低階機可能掉幀。
- **建議**：把 grain 光暈預渲染成離屏 sprite（一次性），而非每幀 `createRadialGradient`。工作量小、效益明確。

### Capacitor 跨平台已知問題
- **WebAudio 自動播放**：已正確處理（首次 gesture 後才建 AudioContext）✅
- **iOS 靜音鍵**：iOS 實體靜音開關會**靜掉 WebAudio**——玩家開音效卻沒聲音會以為是 bug。需在原生層設定 audio session category。⚠️ 未處理
- **Android WebView 版本碎片化**：舊 WebView 對 `globalCompositeOperation = 'lighter'` + gradient 效能較差 → 對應上面的 sprite 優化。
- **安全區/瀏海**：CSS 已處理，但需真機確認。

### Deterministic 模擬：🟡 中風險（重要）
- ✅ **好消息**：`sim.ts` **零 `Math.random`**，grain 生成用確定性 jitter，固定 timestep（1/60）。同一台機器完全可重現。`Math.random` 只在 particles/audio/main（純表現層），不影響邏輯。
- ⚠️ **風險**：matter.js **不保證跨平台/跨版本浮點一致**。Node（測試環境）與 iOS/Android WebView 的浮點行為可能有微小差異。
- **為什麼要緊**：Machine 尖峰的供給緩衝只有 **7–17%**（L21 僅 2 顆餘裕）。物理些微偏移就可能讓**測試裡能過的關，在真機上過不了**。
- **建議**：① 真機跑一次全 25 關 solution 自動驗證（可寫成 in-app debug 模式）；② 給最緊的 L21/L23 各加 1–2 顆緩衝當保險。工作量小，避險價值高。

---

## 4. 上架準備清單

### 🔴 共同前提（目前完全缺）
- [ ] **執行 `npx cap add ios` / `cap add android`** — 原生專案不存在，現在無法產出任何 build。
- [ ] **修正隱私權政策**（見 §0-1）：必須說明 AdMob 會蒐集裝置識別碼用於廣告。
- [ ] **App icon 全尺寸 + splash** — 目前只有 `favicon.svg`，無 PNG。用 `@capacitor/assets`（已安裝）從一張 1024×1024 生成。
- [ ] 版本號策略（目前固定 `1.0.0`）。

### iOS App Store
- [ ] Apple Developer 帳號（$99/年）
- [ ] App icon 1024×1024（無 alpha）
- [ ] 截圖：6.7" 與 6.5" 各至少 3 張（可直接用遊戲截圖 + 分享卡）
- [ ] `Info.plist`：`GADApplicationIdentifier`（AdMob App ID）、`NSUserTrackingUsageDescription`（若做 ATT）
- [ ] **ATT（App Tracking Transparency）**：AdMob 個人化廣告需要，否則只能投非個人化
- [ ] App Privacy「營養標籤」：必須申報 AdMob 蒐集的識別碼
- [ ] 年齡分級、支援網址、隱私權政策 URL

### Android Google Play
- [ ] Play Console 帳號（$25 一次性）
- [ ] 圖示 512×512、功能圖片 1024×500、截圖 ≥2 張
- [ ] `AndroidManifest.xml`：AdMob `APPLICATION_ID` meta-data
- [ ] **Data Safety 表單**（必填，須與隱私權政策一致）
- [ ] 目標 API 等級符合當年要求、AAB 格式、簽章金鑰
- [ ] 內容分級問卷、家庭政策（若標示兒童向需特別注意廣告規範）

### AdMob 正式上線
1. 建立兩個 rewarded 廣告單元（iOS/Android 各一）
2. 填入 `src/config.ts` 的 `REAL_REWARDED_IOS` / `REAL_REWARDED_ANDROID`
3. 原生層註冊 App ID（見上）
4. `VITE_ADMOB_LIVE=1 npm run build:release` → `npx cap sync`
5. AdMob 後台綁定收款資料、ads.txt（若有網站）
6. **GDPR/UMP 同意訊息**：歐盟使用者必須有同意流程（AdMob UMP SDK）⚠️ 尚未接
> 詳細步驟已寫在 `docs/SHIPPING.md`

### 隱私權政策必須改寫的點
現行文案「no advertising, no third-party trackers, collects nothing」在接入 AdMob 後**全部失效**。必須新增：
- Google AdMob 為第三方廣告商，會蒐集**裝置識別碼、粗略位置、廣告互動資料**
- 連結 Google 隱私權政策與「廣告設定」退出方式
- GDPR（歐盟）、CCPA（加州）、COPPA（兒童）對應條款
- 若標示為兒童向 → 必須關閉個人化廣告

---

## 5. 商業化優化

### 目前狀態
只有 **rewarded 廣告 → ✦**，且**觸發點只有商店裡的按鈕**（玩家幾乎不會主動去點）。**零 IAP**。

### Rewarded 最佳觸發時機（依產業實證）
研究顯示最有效的是**綁在「失敗/卡關」時刻**，完成率常 >90%，eCPM 也最高（tier-1 市場 $15–40）：

| 觸發點 | 建議 | 優先 |
|---|---|---|
| **失敗後「再來一次」** | 輸了 → 「看廣告，保留這次進度重試」 | ⭐ 最高 |
| **卡關 30 秒無操作** | 「看廣告拿提示」（本作可高亮正確的栓） | ⭐ 高 |
| **勝利後雙倍 ✦** | 「看廣告，本關 ✦ ×2」 | ⭐ 高 |
| 商店按鈕（現況） | 保留但別當主力 | 低 |

⚠️ 注意：本作是 cozy 方向，**失敗頻率低**（只有真死路才輸）→「再來一次」的觸發量會偏少。因此**「勝利雙倍」和「提示」更適合本作**。

### 是否加其他廣告形式
- **插頁（Interstitial）**：⚠️ 建議「每 3–4 關一次、且不在失敗後立刻跳」。這是最傷 cozy 體感的形式，但也是收入主力。折衷：只在「章節結束」時播。
- **橫幅（Banner）**：❌ **不建議**。會破壞手繪全螢幕美術，且 eCPM 低。
- **原生廣告**：❌ 不適合此類遊戲。

### 定價策略建議
市場數據：puzzle ARPDAU ≈ $0.08；hybrid casual puzzle 收入結構約 **59% IAP / 41% 廣告**。純廣告會浪費一半潛力。

建議最小 IAP 組合（依實作成本排序）：
1. **移除廣告 $2.99–3.99**（最簡單、轉換最穩，cozy 玩家願付）
2. **✦ 星塵包**（$0.99 / $4.99 / $9.99 三階）——已有貨幣系統，接上即可
3. **啟動包 Starter Pack $1.99**（✦ + 獨家主題，限時首購）
4. 主題直購（現在只能用 ✦ 換 → 可加「直接買」選項）

> 「移除廣告」對本作特別合理：cozy 玩家最討厭被打斷，付費動機明確。

---

## 6. 競品分析

| 遊戲 | 規模/表現 | 對我們的意義 |
|---|---|---|
| **Pull the Pin**（Popcore） | 品類始祖、廣告病毒起家 | 直接對手。它靠「球變色」增加表達層，我們可用星雲染色對應 |
| **Sand Balls**（SayGames） | 2200 萬下載 | 感官體驗天花板（音效即產品）。它是**連續類比互動**（劃線），我們是離散點擊 → 手感天生較弱 |
| **Hero Rescue** | 同品類 + 敘事 | 證明「拔栓 + 故事外殼 + 蓋王國 meta」可行 |
| **Screw Jam** 等螺絲品類 | 2025 Q1 單季 $27M | 說明此品類 2025 仍在成長，且靠 meta + boosters 變現 |
| **Water Sort** | zen 留存教科書 | 無計時無懲罰 + 持續新增關卡。**我們缺的正是「持續新增」** |
| **Royal Match** | 難度節奏黃金標準 | 每 10 關一個放鬆拍、困難關標示（我們已學到並實作 ✦ 尖峰） |

### 我們的差異化優勢 ✅
1. **視覺獨特性極高** — 手繪 ink-on-paper × 宇宙，競品全是 3D 卡通渲染。這是最難被抄的資產。
2. **星座 meta 主題契合** — 「重建星空」與題材天然一致，比「蓋王國」更有品味。
3. **cozy 定位清晰** — 無計時、無懲罰、溢出算獎勵（多撈多賺），與市場上的高壓設計區隔。
4. **技術體質好** — 97 個自動化測試、可解性/難度都有量測護欄，這在此品類極罕見。

### 我們的劣勢 ⚠️
1. **內容量 25 關 vs 競品數百至上千關** ← 最致命
2. **互動較淺**（離散點擊 vs Sand Balls 的連續劃線）
3. **無使用者獲取預算**——此品類靠廣告買量起飛，自然量極難
4. **單一機制**（拔栓）——競品多有 3–5 種變體機制
5. 無社交/競爭層

---

## 7. 優先執行計畫（依「不做會死」→「做了會賺」排序）

### 🔴 P0：不做就上不了架（1–2 週）
| # | 項目 | 工作量 |
|---|---|---|
| 1 | **改寫隱私權政策**涵蓋 AdMob（含 GDPR/CCPA/COPPA 條款） | **小** |
| 2 | **`cap add ios/android`** 建立原生專案 + 註冊 AdMob App ID | **小** |
| 3 | **App icon + splash 全尺寸**（`@capacitor/assets` 從 1024 生成） | **小** |
| 4 | **AdMob UMP 同意流程**（歐盟必要） | **中** |
| 5 | **真機驗證**：觸控、安全區、幀率、iOS 靜音鍵、25 關可解性 | **中** |
| 6 | 商店素材：截圖、說明文案、分級問卷、Data Safety 表單 | **中** |

### 🟠 P1：直接影響留存與收入（2–4 週）
| # | 項目 | 工作量 |
|---|---|---|
| 7 | **關卡量 25 → 60+**（最重要的留存投資；可用現有機制排列組合） | **大** |
| 8 | **Rewarded 觸發點改到「勝利雙倍 ✦」+「卡關提示」** | **小** |
| 9 | **每日獎勵 / 每日一關**（回訪理由，現在完全沒有） | **中** |
| 10 | **IAP：移除廣告 + ✦ 星塵包** | **中** |
| 11 | **reduce-motion 涵蓋新效果**（星座/floater/鏡頭推/微粒）— 審查會看 | **小** |
| 12 | **grain 光暈改預渲染 sprite**（低階機幀率保險） | **小** |

### 🟡 P2：品質與差異化（1–2 個月）
| # | 項目 | 工作量 |
|---|---|---|
| 13 | **難度密度**：Ch1/Ch2 各補 1 個 ✦ 尖峰（改造 L7、L14，用 cascade 引擎） | **中** |
| 14 | **新機制：星雲染色**（星塵穿過變色，對應 Pull the Pin 的表達層） | **中** |
| 15 | 章節專屬素材變體（木栓材質等），降低視覺重複 | **中** |
| 16 | 插頁廣告（僅章節結束處，別破壞 cozy） | **小** |
| 17 | 排行榜 / 週賽（社交層） | **大** |

### 建議的第一步
**先做 P0-1 和 P0-2**（各半天內可完成）：隱私權政策是**現在就存在的合規錯誤**，原生專案是所有後續的前提。這兩項完成後，你就能第一次產出真正可安裝的 build，之後所有真機驗證才有意義。

---

## 資料來源
- [AppSamurai — Rewarded Ads 策略與最佳實務 2025](https://appsamurai.com/blog/rewarded-ads-in-mobile-games-strategy-data-and-best-practices/)
- [Tenjin — Ad Monetization Benchmark Report 2025](https://tenjin.com/blog/ad-monetization-benchmark-report-2025-ecpm-ad-revenue/)
- [Juego Studio — ARPDAU Benchmarks by Genre](https://www.juegostudio.com/blog/arpdau-benchmarks-by-game-genre)
- [GGA — Hybrid Casual Games 2026 收入結構](https://gamegrowthadvisor.com/blog/2026-04-16-hybrid-casual-game-design-strategy-2026/)
- [AppMagic — Top Hybridcasual Q1 2025](https://appmagic.rocks/blog/hybridcasual-q1-2025/?hl=en)
- [SayGames — Sand Balls](https://say.games/en/puzzle/sand-balls) · [Grokipedia — Pull the Pin](https://grokipedia.com/page/Pull_the_Pin)
- [Playliner — Royal Match 難度曲線](https://playliner.com/tpost/l8zzrb9el1-how-difficulty-curve-increases-retention)
