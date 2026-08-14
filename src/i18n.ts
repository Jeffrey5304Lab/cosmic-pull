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
  watch_ad: 'Watch ad for ✦ 20',
  ad_unavailable: 'No ad right now — try later',
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
  watch_ad: '看廣告換 ✦ 20',
  ad_unavailable: '暫時沒有廣告——晚點再試',
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
  11: 'A whole pile rests on that long bridge — only pull the peg above',
  12: "Match the colours. The middle is a black hole; each bridge carries a colour out — don't touch them",
  13: "Two bridges each hold a pile — you can't pull either one",
  14: 'Two black holes cross paths. The bridges hold the way — go in two steps, time it',
  15: 'Pulling the middle peg chain-releases the tray below — drop the top pile first to cushion it',
  16: 'Two colours each ride a bridge out, and the black hole roams the middle',
  17: 'Three colours, each to its place',
  18: "Every colour rides its own bridge — pull the wrong one and that colour's lost",
  19: "Big pour! The bridge holds the whole path — release in two steps, don't let it hit the lava",
  20: 'Finale ✦ split the stream, hold both bridges; the gate opens once the left cup fills — release the right last',
  21: 'Three shelves stacked over lava — pull bottom-up, drop the lowest first',
  22: 'Fill the left key-cup bottom-up to open the right gate, then pour the stardust in',
  23: "Pulling that peg chain-releases the next shelf — again bottom-up, don't let the top crush the bottom",
  24: 'The middle pile locks two gates — fill both key-cups, left and right, to release it',
  25: 'Fill the left cup bottom-up to open the gate, then pull the right peg to drop the whole stack',
}

/** Localised hint for a level (zh uses the inline `hint`; en uses the map). */
export function hintFor(id: number, zhHint?: string): string | undefined {
  if (LANG === 'zh') return zhHint
  return HINT_EN[id] ?? zhHint
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
