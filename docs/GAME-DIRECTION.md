# Cosmic Pull — 遊戲方向重定義（Fable 5 survey + 診斷 + 改造提案，2026-08-14）

> ⚠️ **SUPERSEDED（2026-08-15）**：三輪難度量測後證實「拔栓」核心循環的決策
> 空間結構性過淺（暴力可破 25/36，重建後使用者仍不滿意）。全案 pivot 到
> **確定性 sort 解謎（Star Sort）**，見 **`docs/REBOOT-PLAN.md`**。本文件的
> meta/juice/上架部分仍有效（資產 ~70% 存活），核心循環部分作廢。

> 定案方向：**A「療癒爽感」為主軸 80% ＋ B「聰明尖峰」調味 20%。**
> 這份文件取代「把關卡做難」的舊思路。三輪 playtest 證明：問題不是難度，
> 是**回饋密度**和**留下來的理由**。工程執行請對照 `REDESIGN.md` 的
> guardrails（測試全綠、`npm run shot`、cup-offset 規則）。

---

## Phase 1 — 標竿 Survey：贏家到底贏在哪

### 逐款萃取

**Pull the Pin（Popcore）** — 品類始祖，2019 靠病毒廣告起飛。
- 爽感時刻：不是「拔」，是拔完後**看著球流動、變色、灌進管子**的結果演出。
- 關鍵機制：無色球碰到有色球會**被染色**——把「路徑選擇」變成看得見的表達。
- 原則：*每一次拔栓都要有看得見的後果；演出比決策重要。*

**Sand Balls（SayGames，2200 萬下載）** — 品類裡感官體驗的天花板。
- 互動是**連續類比的**（劃線挖沙開路），不是離散點擊——手指本身就很爽。
- 官方文案直接把賣點寫成「音效設計讓解謎變成純粹的感官享受」——
  pops、clangs、clatter，聲音就是產品。
- 卡車裝球數 = 即時計分 = 貨幣。機制工具箱（炸彈、渦輪、管道、觸發器）
  用「千百種微變化」撐幾百關。
- 原則：*聲音和觸感是核心功能，不是點綴；收集數字要跳給玩家看。*

**Screw Jam / 螺絲品類（Rollic 等）** — 2025 Q1 單季 $27M 的成長品類。
- 空間規劃的「小聰明感」：每一步都覺得自己有想，但從不真的卡死。
- 靠 boosters、meta 層、精緻化營收把 hypercasual 核心變成長線遊戲。

**Water Sort（多家）** — zen 留存的教科書。
- **無計時、無懲罰、可悔步**——低壓力是留存基礎，不是缺點。
- 新機制（隱藏色、冰塊）加變化但**從不打破放鬆節奏**。
- 幕後精算 hard / super-hard 關的配比。

**Royal Match（Dream Games）** — 難度節奏的黃金標準。
- **每 10 關一個放鬆拍**（bonus 關/小遊戲）；困難關**明確標示**，
  玩家心理有預期就不覺得被騙。
- 用遙測（勝率、嘗試次數、流失點）持續重調，不靠設計師直覺。
- 原則：*難度是節奏，不是水位。玩家要的是「起伏」，不是「更高」。*

**Hero Rescue / Rescue Hero** — 同品類 + 敘事外殼。
- 「救公主、奪寶藏」給每一關一個**微小的故事理由**；
  收集的金幣拿去**蓋王國**——拔栓品類接 meta 層的成功先例。

**Hybridcasual 市場數據（AppMagic 2025）**
- 收集機制出現在 **80%** 的頭部遊戲裡；puzzle 佔 hybridcasual 營收 48%。
- 加上 meta 層後 D7 留存 ~20%、D30 ~10%，遠高於 hypercasual。
- 結論：*沒有 meta 層的 hypercasual 核心，2025 之後已經不成立。*

### 五軸通用原則（診斷用的尺）

1. **核心循環**：爽感時刻要被放大成演出；互動要有表達感。
2. **難度曲線**：聰明感 ≠ 解謎難度；節奏起伏 + 標示的尖峰 + 放鬆拍。
3. **回饋 game feel**：即時響應、每個動作都有回饋、粒子/音效/慢動作/震動
   分層堆疊。聲音是產品。
4. **Meta 進度**：收集 + 貨幣 + 每日理由。80% 頭部遊戲有收集層。
5. **視覺語言**：可讀性 + 個性 + 可分享的瞬間。

---

## Phase 2 — Cosmic Pull 誠實診斷（對照五軸）

| 軸 | 現況（實測/讀碼確認） | 對照贏家 | 分數 |
|---|---|---|---|
| 核心循環 | 點擊拔栓 OK，但**傾瀉沒有被當主角**：collect 只有 4 顆小粒子 + 限流 drip 音 | Pull the Pin 的變色流、Sand Balls 的感官盛宴 | **2/5** |
| 難度曲線 | 平坦偏易；無節奏設計、無標示尖峰、無放鬆拍（rote rule 破 18/20 關） | Royal Match 的 10 關節奏 | **1/5** |
| 回饋 | 粒子/音效**存在但刻意收斂**（particles.ts 自註 "kept tasteful"）；無連續傾瀉聲、無音樂、無慢動作、無滿杯高潮演出 | 「聲音就是產品」 | **2/5** |
| Meta | **零**。storage.ts 只有星數+解鎖。無收集、無貨幣、無每日、無裝飾 | 收集層在 80% 頭部遊戲 | **0/5** |
| 視覺 | 手繪 ink-on-paper + 宇宙題材**是真差異化資產**；已有 sharecard | 個性 ✓，但缺「值得分享的瞬間」 | **3.5/5** |

**總診斷：玩家說「無聊」，指的其實不是「太簡單」，而是「贏了也沒感覺」。**
最大缺口按嚴重度排序：**Meta（0 分）> 回饋 > 節奏 > 核心循環演出**。
過去三輪都在改第 4 名的問題（關卡幾何），前三名一次都沒動過——
這就是為什麼怎麼改都「還是無聊」。

### 路線拍板

- ❌ 純 B（硬核解謎）：拔栓互動天生淺，做深要砍掉重練；受眾小、挫折流失高。
- ❌ 純 A（無腦爽）：兩天就膩，playtest 已證明。
- ✅ **A80/B20**：爽感為底、每章固定位置放「標示過的」聰明尖峰
  （L5/L10 的陷阱模式 + cascade 引擎是現成的好材料——它們是 playtest 裡
  唯二被稱讚的關）。

---

## Phase 3 — 改造提案

### 3.1 一句話定位

**「把星塵倒進杯子」要從物理模擬變成一場煙火。** 玩家留下來的理由：
看星塵流動很爽（回饋）、想把星空拼完（meta）、偶爾一關讓我覺得自己聰明（尖峰）。

### 3.2 核心循環改造 —「傾瀉是主角」

1. **星塵發光拖尾**：grains 加 glow trail / comet tail，流動時整條河在發光。
2. **連續傾瀉音**：granular shimmer（顆粒感的沙沙+風鈴），隨杯子填充度
   **音高爬升**——slot-machine 式的期待感。現有 `sfxDrip` 保留做點綴。
3. **滿杯高潮**：杯內液面可見上升 + 計數器滾動跳字；達標瞬間
   **短慢動作（0.4s）+ 鏡頭微推 + 爆發**。最後一顆關鍵星塵接近杯口時觸發。
4. **勝利 = 畫星座**（連接 meta，見 3.4）：收集的星塵飛上天空，
   在夜空連出本關的星座線——這是可分享的瞬間，取代通用彩帶。
5. **溢出變獎勵**：超過目標的星塵 = **星屑貨幣**（+N 跳字）。
   把「浪費」的懲罰感翻轉成「多撈的都是賺的」——cozy 方向的關鍵一翻。

### 3.3 難度節奏改造（不是難度提升）

- 以 8 關為一拍：6 關流暢贏（A）→ 1 關標示「✦ 星雲試煉」的尖峰（B，
  用 L5/L10 陷阱模式 + cascade 引擎）→ 1 關純爽放鬆拍（大量星塵、必 3★）。
- 尖峰關**明確標示**，玩家被騙的感覺會變成「來了，這關要動腦」。
- 現有 25 關重新排列 + 補寫放鬆拍即可起步，不必全部重做。
- rote 指標只對「✦ 尖峰關」嚴格要求，A 關不再追難度指標。

### 3.4 Meta 層 —「重建星空」（從 0 到 1，最大缺口）

- **星空圖**：每章 = 一個星座；每關贏 = 點亮一顆星，3★ = 星更亮。
  章節完成 = 星座連線動畫。題材完全貼合 Cosmic 宇宙，實作便宜（SVG 夜空頁）。
- **星屑貨幣**：來自溢出星塵 + 3★，兌換**墨水主題/拖尾樣式**（裝飾性，
  不影響平衡）。給重玩舊關一個理由。
- （P2）**每日流星關**：既有關卡 + 修飾符（顏色反轉、雙倍星塵）隨機重組，
  低成本的每日回訪理由。

### 3.5 視覺方向

保留 ink-on-paper 手繪風（這是資產，別丟）。只加「發光層」：星塵、
星座、傾瀉拖尾用加法混合的光暈疊在紙上——「**紙上的星光**」，
和市場上千篇一律的 3D 卡通渲染徹底區隔，截圖自帶識別度。

### 3.6 優先級（給實作 session 的順序）

**P0 — 讓贏有感覺（回饋層，全部可用 `npm run shot` 驗證）**
1. 連續傾瀉音 + 填充音高爬升（audio.ts 重寫，維持零資產合成）
2. 星塵 glow trail（render.ts/particles.ts）
3. 滿杯演出：液面 + 計數跳字 + 最後一顆慢動作 + 鏡頭微推
4. 勝利星座動畫（先做單關版，不含星空圖頁）
5. 溢出→星屑 +N 跳字（先只做演出，貨幣結算掛 P1）

**P1 — 讓人留下來（節奏 + meta 骨架）**
6. 星空圖頁 + 星屑貨幣 + storage schema v2（含遷移）
7. 25 關重排成 8 關節奏；補寫放鬆拍關卡；尖峰關掛「✦」標示
8. 背景音樂/環境音 loop（合成或 CC0）

**P2 — 讓它更好玩（表達層）**
9. 星雲染色區：星塵穿過變色（Pull the Pin 的染色流，接色杯關卡）
10. 彗星輕推：有限次數的 swipe 微調空中星塵——cozy 的「救回來」機制
11. 墨水主題商店（裝飾兌換）
12. 每日流星關

### 3.7 必須人工 playtest 的項目（不可用測試代替）

- 傾瀉音的「爽」與否（合成參數要用耳朵調）
- 慢動作觸發時機（太頻繁會膩，只留最後一顆）
- 尖峰關的難度手感 + 8 關節奏的實際體感
- 星屑兌換的定價感

### 3.8 工程 guardrails（沿用 REDESIGN.md，不重複詳述）

76 tests 全綠；新關卡過 solvability/traps/stuck；`REF_WASTE` 規則；
視覺一律 `npm run shot` 驗證；cup-offset 物理規則；**注意**：3.2-5 的
「溢出變獎勵」與現行 dual-axis 星星規則（waste 懲罰）衝突，P0 實作時
星星規則改回 pulls-only、waste 轉為正向貨幣。

---

## ▶ 實作狀態（2026-08-14，Opus P0 pass）

**P0 全數落地，86 tests 綠、tsc 乾淨、build 過、live 實玩無 runtime error。**

- [x] **P0-1 傾瀉音**：`audio.ts` 加 `pourUpdate/pourStop` — 濾波白噪音床，隨
  填充度爬升 bandpass 中心頻率（360→1510Hz），音量隨流動星塵數。零資產合成。
- [x] **P0-2 星塵 glow trail**：`render.ts` 拖尾+光暈改加法混合（`lighter`）。
  ⚠️ 密堆會過曝 → 已把光暈 alpha 0.42→0.28、半徑 2.4→2.05 保住顆粒辨識度。
- [x] **P0-3 滿杯演出**：勝利前 `timeScale=0.45` 慢動作收尾 + 鏡頭朝杯心微推
  （最多 +5%，ease-out）。液面上升沿用既有。
- [x] **P0-4 勝利星座**：`render.ts` `drawWinConstellation` — 每關由 id 決定性
  生成 4–6 星，隨 `winProgress`(0→1，1.4s) 在夜空依序點亮+連線（加法發光）。
- [x] **P0-5 溢出→星屑 + pulls-only 星標**：`logic.ts` `computeStars` 改純 pulls
  （移除 waste 軸 + `REF_WASTE`），`logic.test.ts` 重寫。溢出星塵跳 `+N ✦`
  floater（`main.ts`）。**貨幣結算仍掛 P1**（目前只有演出）。

**已用 `npm run shot` / live playthrough 螢幕驗證**：加法光暈（L01 鬆散堆疊漂亮、
L07 密堆已收斂）、勝利星座（L03-win）、完整 live win（`live-win-*.png`：慢動作、
鏡頭推、星座、勝利卡皆正確）。dev 用 `--win` flag 已加進 `shot.ts` + `shoot.mjs`。

**仍需人工 playtest 驗收（機制已成、手感未調）**：
- 傾瀉音的「爽度」與音量/頻率曲線（耳朵調）。
- 慢動作 0.45× 的時長手感、鏡頭推 5% 幅度。
- floater `+N ✦` 出現頻率（目前全域 150ms 節流）與定價感。
- 星座在勝利卡 backdrop-blur 後方的可見度（live 圖看來 OK，真機再確認）。
- reduce-motion 下星座/floater 仍會播（僅 shake/flash/鏡頭推被關）——是否要一併關。

## ▶ 實作狀態（2026-08-14，Opus P1 pass — meta 骨架）

**P1-6（星空 meta + 星屑貨幣）落地，92 tests 綠、tsc 乾淨、build 過、live 無 error。**

- [x] **星屑貨幣閉環**：`logic.ts` `earnedStardust(overflow, stars)` = 溢出 +
  3★/2★ 獎勵(5/2)；`storage.ts` `Progress.stardust` + `addStardust()`
  （storage v2，**純加法遷移**：舊 v1 存檔 stardust 補 0，不丟關卡/星星）。
  勝利結算在 pour 完全結束時（含慢動作尾），P0-5 的 `+N ✦` floater 現在真的
  進帳。勝利卡顯示 `✦ +N · ✦ 總額`。
- [x] **星空地圖**：選單改三章分組 **Pour / Route / Machine**（`main.ts`
  `CHAPTERS`），各章顯示星數進度；副標顯示 ✦ 餘額；3★ 關 = 點亮的金色星格
  （`.level-cell.full` 發光）；選單卡加夜空星點底。
- [x] **測試**：`logic.test.ts` +earnedStardust、新增 `storage.test.ts`
  （v1→v2 遷移、餘額累積/持久化/不為負、recordWin 不動餘額）。
- 螢幕驗證：`meta-win-reward.png`（勝利卡 ✦ 行）、`meta-starmap.png`（章節星空）。

**待人工 playtest / 決策**：earnedStardust 的數值曲線（獎勵感/定價）；章節邊界
8/8/9 是否隨關卡重排調整。

### ✦ 花費出口：墨水主題商店（DONE，2026-08-14 Opus）
貨幣不再只進不出。`config.THEMES` 定義 5 個天空主題（Parchment 免費 /
Dusk 30 / Dawn·Meadow 40 / Deep Space 80），**只換背景+夜空色調，絕不動
星塵/杯/岩漿等遊戲色**（colour-lock 可讀性零損失，已用 dusk/deep/dawn 截圖
在有岩漿的 L2 驗證）。`storage` 加 `owned[]`+`theme`（同 v2 加法遷移）、
`pickTheme()`（買+選，餘額不足回 null）。選單「✦ Styles」→ `#shop` overlay：
主題卡（漸層預覽+狀態）、即時套用、買不起有 deny 抖動。`renderer.setTheme()`。
96 tests 綠（+pickTheme 4 條）。截圖 shop-open/shop-dusk-selected/shop-applied-live。
**待人工**：主題定價曲線、是否要更多主題/拖尾樣式（doc 原構想含拖尾，但拖尾＝
星塵色＝遊戲語意，故先只做背景主題；拖尾樣式可做「形狀/長度」變體不碰顏色）。

### 分享卡升級（DONE，2026-08-14 Opus）
Survey 頭號發現是「可分享的瞬間」（Pull the Pin 靠分享起飛）。`sharecard.ts`
重寫：主視覺改成**本關的星座**（與勝利畫面同一形狀——星座生成抽成
`config.constellationPoints()` 共用純函式，renderer 也改用它、輸出不變），
套用玩家選的**主題背景**，並秀 **✦ 總數**。截圖 `share-card.png`（dusk 主題、
L1 星座、✦82）。強化「重建星空」的病毒鉤子。

### P1-7 尖峰標示系統（DONE，2026-08-14 Opus）— 節奏的「可讀」半
不做有風險的整體重排/供給收緊（那是難度手感、易錯難復原，留給你 hands-on）。
改做 Royal Match 的核心洞察：**把challenge關「標示」出來，難度就從 gotcha 變成
公平的節奏尖峰**。用 `rote.test.ts` 客觀量測選尖峰（不猜）：真正抵抗 rote rule 的
只有 **L5、L10、L21–25**（7 關；其餘 18 關 rote 都能破）。`LevelDef.spike` 標這 7 關，
HUD 名稱掛金色 `✦`、選單格掛紫色 ✦ 徽章。新測試：每個 `spike` 關必須真的抵抗
rote rule（標示不能造假）。截圖 spike-hud/spike-menu。
**留給你 hands-on**：實體重排成 8 關一拍 + 供給收緊（最 feel-sensitive、易破壞
solvability 的槓桿）。尖峰已標好，重排時照節奏擺即可。

### P1-8 背景環境音（DONE，2026-08-14 Opus）
`audio.ts` `ambientStart()`：極輕（level 0.022）的合成 drone 和弦（A/E/A + 慢速
lowpass LFO 呼吸），首次 Play gesture 後淡入，`setMuted` 即時開關（♪ 鈕）。
headless 確認不 crash、不擋其他音效。**聲音爽度/音量留你耳朵驗收**。

### 章節 3「Machine」L21–25（本 commit 一併收入）
這批多步 gate/chain 關卡是前面 session 寫好但一直沒 commit 的working 內容
（REDESIGN.md 早有記載，rote/solve/logic 測試都依賴它們）。本次隨尖峰標示一起
提交，並非本 session 新作。

### 難度稽核（DONE，2026-08-15 Opus）— 量測驅動，非盲改
「全面收緊供給」在 cozy 80/20 + pulls-only 下是**錯的槓桿**（會弄壞 cozy flow 關；
且供給不再影響星等）。改用量測找真正該動的：
- **3★ pull budget 全部已最優緊**（slack=0：每關 3★ 門檻＝最優解拔栓數）——
  「該拔哪幾根」的精通 chase 已存在，無鬆門檻可收。
- **供給緩衝稽核**：flow 關 78-150%（對的 cozy 寬鬆，不動）；Machine 尖峰
  L21/22/23/25 已緊（7-17%）。兩個尖峰偏鬆 → 針對性處理：
  - **L5**（單 emitter order-trap）：24→17（85%→31%），現在有 spill 張力。✓ 測試綠。
  - **L24**（gated 多步）：試收即破 solvability → 證明 53% 緩衝是 gate 機制**必需**的
    餘裕，非浪費 → 回退保留。
教訓再證：複雜 gated 關不能盲收供給；簡單 order-trap 關可以。全程 97 tests 護欄。

**仍是人工/協作區**：實體 8 關重排（低價值高風險，尖峰已標好，非必要）；
深化 flow 關成更多尖峰＝authoring（要 measured harness + 你的眼），建議一關一關來。

**P2（未做）**：星雲染色、彗星輕推、每日流星關；主題「拖尾樣式」變體（不碰顏色）。

## Survey 來源

- Pull the Pin: [Grokipedia](https://grokipedia.com/page/Pull_the_Pin) · [MWM](https://mwm.ai/apps/pull-the-pin/1496150467) · [CISIN 分析](https://www.cisin.com/growth-hacks/cost-and-feature-to-develop-software-like-pull-the-pin/)
- Sand Balls: [SayGames 官方](https://say.games/en/puzzle/sand-balls) · [AppBrain](https://www.appbrain.com/app/sand-balls-classic/com.iron.balls)
- Screw 品類: [AppMagic Q1 2025 Hybridcasual](https://appmagic.rocks/blog/hybridcasual-q1-2025/?hl=en) · [Mobilegamer.biz](https://mobilegamer.biz/data-digest-sensor-tower-highlights-applovin-max-stats-puzzle-genre-insights-financials-investments-and-more/)
- Water Sort: [Easybrain Water Sort Zen](https://play.google.com/store/apps/details?id=com.easybrain.water.sorting.game&hl=en_US) · [Naavik: Grand Games](https://naavik.co/digest/why-peak-games-investors-backed-grand-games/)
- Royal Match: [Playliner 難度曲線](https://playliner.com/tpost/l8zzrb9el1-how-difficulty-curve-increases-retention) · [Deconstructor of Fun](https://www.deconstructoroffun.com/blog/2021/3/21/royal-match-the-new-king-from-turkey) · [Cubix](https://www.cubix.co/blog/the-design-decisions-that-made-royal-match-a-top-grossing-game/)
- Hero Rescue: [App Store](https://apps.apple.com/us/app/rescue-hero-pull-the-pin/id1524625218)
- Hybridcasual meta: [Lancaric 市場數據](https://lancaric.substack.com/p/2025-hybridcasual-market-overview) · [iLogos meta progression](https://ilogos.biz/how-to-add-meta-progression-to-a-mobile-game)
- Game juice: [Egmatic game feel 指南](https://egmatic.com/blog/how-to-make-your-game-feel-good) · [GameAnalytics juice](https://www.gameanalytics.com/blog/squeezing-more-juice-out-of-your-game-design)
- Dig This / 沙物理: [minigamesville](https://minigamesville.com/game/dig-this/)
