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

// ── continuous pour bed ───────────────────────────────────────
// A soft granular shimmer that plays *while stardust is flowing* and rises in
// pitch as the cups fill — the slot-machine "almost there" tension that makes a
// pour feel like the main event, not an afterthought (see docs/GAME-DIRECTION).
// Synthesized from filtered noise: zero assets, cozy, never a harsh loop.
let pourFilter: BiquadFilterNode | null = null
let pourGain: GainNode | null = null

function ensurePour(c: AudioContext): boolean {
  if (pourGain) return true
  try {
    // 1s of white noise, looped — the "hiss" of pouring grains. The looping
    // source stays alive via its graph connections, so we don't keep a handle.
    const buf = c.createBuffer(1, c.sampleRate, c.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5
    const src = c.createBufferSource()
    src.buffer = buf
    src.loop = true
    const filt = c.createBiquadFilter()
    filt.type = 'bandpass'
    filt.frequency.value = 500
    filt.Q.value = 3.5 // a little resonance → shimmer, not static
    const g = c.createGain()
    g.gain.value = 0.0001
    src.connect(filt).connect(g).connect(c.destination)
    src.start()
    pourFilter = filt
    pourGain = g
    return true
  } catch {
    return false
  }
}

/**
 * Drive the pour bed each frame.
 * @param active   is stardust currently flowing?
 * @param fillRatio overall cup-fill 0..1 → maps to rising pitch
 * @param intensity how much is flowing 0..1 → maps to loudness
 */
export function pourUpdate(active: boolean, fillRatio: number, intensity: number): void {
  const c = ac()
  if (!c) {
    // Muted (or no audio): make sure any lingering bed is silenced.
    if (pourGain) pourGain.gain.setTargetAtTime(0.0001, (ctx as AudioContext).currentTime, 0.05)
    return
  }
  if (!ensurePour(c)) return
  const now = c.currentTime
  const target = active ? 0.012 + Math.min(1, intensity) * 0.05 : 0.0001
  pourGain!.gain.setTargetAtTime(target, now, 0.09)
  const freq = 360 + Math.min(1, Math.max(0, fillRatio)) * 1150
  pourFilter!.frequency.setTargetAtTime(freq, now, 0.12)
}

/** Silence the pour bed immediately (level change / win / lose). */
export function pourStop(): void {
  if (pourGain && ctx) pourGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.04)
}
