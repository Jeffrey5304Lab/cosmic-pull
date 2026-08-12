/**
 * Tiny WebAudio SFX — synthesized, zero asset files. Cozy, soft, non-annoying.
 * Lazily creates the AudioContext on first user gesture (mobile autoplay rules).
 */

let ctx: AudioContext | null = null
let muted = false

export function setMuted(m: boolean): void {
  muted = m
}
export function isMuted(): boolean {
  return muted
}

function ac(): AudioContext | null {
  if (muted) return null
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function blip(freq: number, dur: number, type: OscillatorType, gain = 0.06, slideTo?: number): void {
  const c = ac()
  if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, c.currentTime)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur)
  g.gain.setValueAtTime(0.0001, c.currentTime)
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur)
  o.connect(g).connect(c.destination)
  o.start()
  o.stop(c.currentTime + dur + 0.02)
}

/** Wooden "pop" when a pin is pulled. */
export function sfxPull(): void {
  blip(320, 0.12, 'triangle', 0.08, 160)
}

/** Soft chime when a grain lands in a cup (rate-limited by the caller). */
export function sfxDrip(pitch = 0): void {
  blip(660 + pitch * 40, 0.08, 'sine', 0.03)
}

/** Warm arpeggio on level complete. */
export function sfxWin(): void {
  const notes = [523, 659, 784, 1047]
  notes.forEach((n, i) => setTimeout(() => blip(n, 0.22, 'sine', 0.07), i * 90))
}

/** Rising chime as each win star pops in (index 0..2). */
export function sfxStar(index: number): void {
  const notes = [659, 880, 1175] // E5, A5, D6 — ascending sparkle
  blip(notes[Math.min(index, 2)], 0.28, 'triangle', 0.08)
  blip(notes[Math.min(index, 2)] * 2, 0.18, 'sine', 0.03) // shimmer octave
}

/** Muted thud on fail. */
export function sfxLose(): void {
  blip(180, 0.3, 'sine', 0.06, 90)
}
