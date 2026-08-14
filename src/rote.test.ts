import { describe, expect, it } from 'vitest'
import { GameSim } from './sim.ts'
import { LEVELS } from './levels.ts'
import { PHYS } from './config.ts'

const step = (s: GameSim, ms: number): void => {
  for (let t = 0; t < ms; t += PHYS.stepMs) s.step(PHYS.stepMs)
}

/**
 * THE metric that matches how humans actually experience this game.
 *
 * A random-pull "monkey" failing a level does NOT mean a person has to think:
 * people don't pull at random, they learn a rule. By L3/L4 the rule is obvious —
 * "pull the flat pins top-to-bottom, never touch a slanted one" — and if that
 * rule alone clears a level, the level is mindless no matter what the monkey
 * stats say. (Playtest feedback: "the first ten levels have no difficulty at
 * all"; the rote rule beat 20/20 levels at the time.)
 *
 * So: some levels MUST punish the rote rule. That's what makes the ramp a thing
 * you have to read ("where does this one actually lead?") instead of a shape you
 * pattern-match.
 */
function roteRuleBeats(level: (typeof LEVELS)[number]): boolean {
  const sim = new GameSim(level)
  const flats = level.pins.filter((p) => Math.abs(p.angle ?? 0) < 0.15).sort((a, b) => a.y - b.y)
  for (const p of flats) {
    if (sim.status !== 'playing') break
    sim.pull(p.id)
    step(sim, 2500)
  }
  step(sim, 14000)
  return sim.status === 'won'
}

describe('rote-rule resistance', () => {
  it('the learned "flat=pull, slanted=never" rule does not beat the whole game', () => {
    const beaten = LEVELS.filter(roteRuleBeats)
    const resisted = LEVELS.length - beaten.length
    // Guard against regressing to a game with exactly one idea in it.
    expect(resisted, `rote rule cleared ${beaten.length}/${LEVELS.length} levels`).toBeGreaterThan(0)
  })

  it('L5 "The False Bridge" specifically punishes the rote rule', () => {
    const l5 = LEVELS.find((l) => l.id === 5)!
    expect(roteRuleBeats(l5), 'L5 must break the rule, not reward it').toBe(false)
  })

  it('every ✦ spike-tagged level actually resists the rote rule (marks stay honest)', () => {
    // A level advertised as a challenge must earn it — if the flat-top-down habit
    // clears a "spike", the badge is a lie. (Spikes were chosen from this exact
    // measurement; this guards against a future edit softening one.)
    for (const lv of LEVELS.filter((l) => l.spike)) {
      expect(roteRuleBeats(lv), `L${lv.id} "${lv.name}" is tagged spike but the rote rule clears it`).toBe(false)
    }
  })

  // Chapter 3 "Machine" (21–25) is the answer to "太簡單、不用動腦": every one of
  // these gate/chain multi-step levels is built so the rote rule loses. If a
  // future tweak lets the flat-top-down habit clear one, it stopped being a
  // puzzle — fail loudly.
  for (const id of [21, 22, 23, 24, 25]) {
    it(`L${id} (Chapter 3) resists the rote rule`, () => {
      const lv = LEVELS.find((l) => l.id === id)!
      expect(roteRuleBeats(lv), `L${id} must not fall to flat-pull-top-to-bottom`).toBe(false)
    })
  }
})
