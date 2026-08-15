/**
 * Tiny i18n. The game shipped with an English shell but zh-TW level hints — a
 * submission-flagging inconsistency. This makes it consistently bilingual with
 * auto-detect: a Chinese-locale device gets all-Chinese, everyone else gets
 * all-English. Brand name "Cosmic Pull" stays as-is in both.
 *
 * Static markup carries `data-i18n` / `data-i18n-aria` attributes; applyI18n()
 * fills them on boot. Dynamic strings call t()/tn()/hintFor().
 */
export type Lang = 'en' | 'zh'

export const LANG: Lang = detectLang()

function detectLang(): Lang {
  try {
    return (navigator?.language ?? 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en'
  } catch {
    return 'en'
  }
}

type Dict = Record<string, string>

const EN: Dict = {
  play: 'Play',
  tagline: 'Pull the pins · pour the stars ✦',
  aria_levels: 'Levels',
  aria_restart: 'Restart level',
  aria_sound: 'Sound',
  win_perfect: 'Perfect pour!',
  win_nice: 'Nicely done!',
  win_cleared: 'Cleared!',
  replay: 'Replay',
  next: 'Next ›',
  menu: 'Menu',
  share: 'Share ✦',
  lose_title: 'So close!',
  lose_sub: 'Some stardust slipped away — give it another pour.',
  retry: 'Try again',
  levels: 'Levels',
  more_games: '✦ More: Cosmic Merge',
  styles: '✦ Styles',
  close: 'Close',
  back: 'Back',
  sky_styles: 'Sky Styles',
  to_spend: 'to spend',
  selected: 'Selected',
  select: 'Select',
  stuck: 'No flow left — tap ↻ to try again',
  chapter_pour: 'Pour',
  chapter_route: 'Route',
  chapter_machine: 'Machine',
  chapter_voyage: 'Voyage',
  watch_ad: 'Watch ad for ✦ 20',
  ad_unavailable: 'No ad right now — try later',
  privacy_options: 'Ad privacy options',
  double_reward: 'Watch ad · ✦ ×2',
  hint_ad: 'Stuck? Watch an ad for a hint',
  daily_title: 'Daily stardust',
  daily_collect: 'Collect',
  daily_more: 'come back tomorrow for more',
  theme_parchment: 'Parchment',
  theme_dusk: 'Dusk',
  theme_dawn: 'Dawn',
  theme_meadow: 'Meadow',
  theme_deep: 'Deep Space',
}

const ZH: Dict = {
  play: '開始',
  tagline: '拔木栓 · 倒星塵 ✦',
  aria_levels: '關卡',
  aria_restart: '重玩本關',
  aria_sound: '音效',
  win_perfect: '完美傾瀉！',
  win_nice: '漂亮！',
  win_cleared: '過關！',
  replay: '重玩',
  next: '下一關 ›',
  menu: '選單',
  share: '分享 ✦',
  lose_title: '差一點！',
  lose_sub: '有些星塵溜走了——再倒一次吧。',
  retry: '再試一次',
  levels: '關卡',
  more_games: '✦ 更多：Cosmic Merge',
  styles: '✦ 主題',
  close: '關閉',
  back: '返回',
  sky_styles: '天空主題',
  to_spend: '可花',
  selected: '已選',
  select: '選用',
  stuck: '星塵流不動了 — 點 ↻ 再試一次',
  chapter_pour: '傾瀉',
  chapter_route: '導流',
  chapter_machine: '機關',
  chapter_voyage: '遠航',
  watch_ad: '看廣告換 ✦ 20',
  ad_unavailable: '暫時沒有廣告——晚點再試',
  privacy_options: '廣告隱私設定',
  double_reward: '看廣告 · ✦ ×2',
  hint_ad: '卡住了？看廣告拿提示',
  daily_title: '每日星塵',
  daily_collect: '收下',
  daily_more: '明天再來還有更多',
  theme_parchment: '羊皮紙',
  theme_dusk: '暮色',
  theme_dawn: '晨曦',
  theme_meadow: '草原',
  theme_deep: '深空',
}

const DICT = LANG === 'zh' ? ZH : EN

export function t(key: string): string {
  return DICT[key] ?? EN[key] ?? key
}

/** Pull count with correct wording per language. */
export function pullsLabel(n: number): string {
  return LANG === 'zh' ? `${n} 拔` : n === 1 ? '1 pull' : `${n} pulls`
}

/** Daily streak line — the ordinal sits before the number in zh, after in en. */
export function streakLabel(day: number): string {
  return LANG === 'zh' ? `第 ${day} 天 · ${t('daily_more')}` : `Day ${day} · ${t('daily_more')}`
}

// English level hints (the inline zh-TW `hint` on each level is the zh copy).
const HINT_EN: Record<number, string> = {
  1: 'Tap the peg to pull it ✦ let the stardust pour into the cup',
  2: 'Stardust slides down the slope, past the lava, into the cup',
  3: "A slanted peg is a bridge! It holds the path — don't pull it, only pull the one above",
  4: 'Both slants are bridges carrying stardust to the middle. Only pull the top two!',
  5: "A slant isn't always a bridge — look where it actually leads first",
  6: "Colours must match! Each rides its own bridge out — pull it and it's gone for good",
  7: 'Stardust hits the peak and splits both ways — fill both cups',
  8: "A black hole sweeps below — the bridge is the only way across, don't pull it",
  9: 'The lava sweeps back and forth — the stardust waits on the ledge; drop it on the gap',
  10: 'Pull top-to-bottom? This one punishes that — release the lower pile first, then the flood above',
  11: "The upper pile is a flood — drain the lower one first, then release it",
  12: "Match the colours. The middle is a black hole; each bridge carries a colour out — don't touch them",
  13: "Two bridges each hold a pile — you can't pull either one",
  14: "Both shelves are loaded — release the lower one first or it gets buried",
  15: "Three shelves — bottom-up, one layer at a time",
  16: 'Two colours each ride a bridge out, and the black hole roams the middle',
  17: 'Three colours, each to its place',
  18: "Every colour rides its own bridge — pull the wrong one and that colour's lost",
  19: "A whole flood sits on top — let the lower layer clear out first",
  20: 'Finale ✦ split the stream, hold both bridges; the gate opens once the left cup fills — release the right last',
  21: 'Three shelves stacked over lava — pull bottom-up, drop the lowest first',
  22: 'Fill the left key-cup bottom-up to open the right gate, then pour the stardust in',
  23: "Pulling that peg chain-releases the next shelf — again bottom-up, don't let the top crush the bottom",
  24: 'The middle pile locks two gates — fill both key-cups, left and right, to release it',
  25: 'Fill the left cup bottom-up to open the gate, then pull the right peg to drop the whole stack',
  26: "A long drop — the slanted bridge catches the stardust and carries it across. Don't pull it",
  27: 'Two bridges in relay, all the way to the far corner — neither can be moved',
  28: 'Zig-zag all the way down — every stepping stone is part of the path',
  29: 'Two shelves stacked between lava — release the lower one first, or it spills',
  30: "Lower first, then upper — the top pile crashes down and knocks the other one wide",
  31: 'The lava sweeps slowly below — the long bridge is the only way across',
  32: "Two colours flow outward past the black hole — don't touch either bridge",
  33: 'The right side is gated — fill the little key cup on the left to open it',
  34: 'Two dangers sweep across; the long bridge holds the whole route',
  35: "Pulling the top peg chain-releases the middle — drop the bottom pile first",
  36: 'Three shelves over a lava corridor — bottom-up, and not one step out of order',
}

/** Localised hint for a level (zh uses the inline `hint`; en uses the map). */
export function hintFor(id: number, zhHint?: string): string | undefined {
  if (LANG === 'zh') return zhHint
  return HINT_EN[id] ?? zhHint
}

// Chinese level titles (the inline `name` on each level is the English copy).
const NAME_ZH: Record<number, string> = {
  1: '第一拔',
  2: '小心岩漿',
  3: '別拔那座橋',
  4: '該拔哪幾根？',
  5: '假橋',
  6: '顏色歸位',
  7: '噴泉',
  8: '掃描者',
  9: '灼熱時機',
  10: '順序反了',
  11: '拱心石',
  12: '顏色守衛',
  13: '雙拱心石',
  14: '雙重橫掃',
  15: '清空層架',
  16: '虛空穿越',
  17: '彩虹列',
  18: '彩色橋',
  19: '雪崩',
  20: '終章',
  21: '層瀑',
  22: '鎖與鑰',
  23: '連鎖反應',
  24: '雙鎖',
  25: '大機關',
  26: '長墜',
  27: '雙橋接力',
  28: '踏石',
  29: '雙層瀑',
  30: '鏡橋',
  31: '緩掃',
  32: '兩條河',
  33: '側門鑰匙',
  34: '交叉火網',
  35: '拉鍊',
  36: '深層瀑',
}

/** Localised level title (keeps the level list readable in either language). */
export function nameFor(id: number, enName: string): string {
  return LANG === 'zh' ? (NAME_ZH[id] ?? enName) : enName
}

/** Fill every [data-i18n] textContent and [data-i18n-aria] aria-label on boot. */
export function applyI18n(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n
    if (key) el.textContent = t(key)
  })
  root.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
    const key = el.dataset.i18nAria
    if (key) el.setAttribute('aria-label', t(key))
  })
  if (LANG) document.documentElement.lang = LANG === 'zh' ? 'zh-TW' : 'en'
}
