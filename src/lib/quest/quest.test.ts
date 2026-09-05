import { describe, expect, it } from 'vitest'
import type { Domain } from '../archetype'
import {
  ENEMIES,
  MAX_CHAIN_STEPS,
  MIN_CHAIN_STEPS,
  QUEST_STAR_XP,
  fillQuestText,
  generateChain,
  pickQuestTarget,
  questXpDelta,
  questXpForStars,
  randomStepCount,
  starsForProgress,
} from './quest'

describe('fillQuestText', () => {
  it('fills every variable slot into the template', () => {
    const rendered = fillQuestText(
      '{archetype}, complete {count} {activity} sessions to defeat {enemy} in {domain}.',
      {
        archetype: 'Warrior',
        count: 3,
        activity: 'Exercise',
        enemy: 'the Sloth',
        domain: 'Health',
      },
    )

    expect(rendered).toBe(
      'Warrior, complete 3 Exercise sessions to defeat the Sloth in Health.',
    )
  })

  it('leaves no unresolved variable braces behind', () => {
    const rendered = fillQuestText(
      '{archetype} · {count} · {activity} · {domain} · {enemy}',
      {
        archetype: 'Sage',
        count: 5,
        activity: 'Reading',
        enemy: 'the Doubt Demon',
        domain: 'Learning',
      },
    )

    expect(rendered).not.toMatch(/\{/)
    expect(rendered).not.toMatch(/\}/)
    expect(rendered).toBe('Sage · 5 · Reading · Learning · the Doubt Demon')
  })
})

describe('generateChain', () => {
  const base = {
    archetype: 'warrior' as const,
    domain: 'Health' as Domain,
    activityType: 'Exercise',
  }

  it('produces exactly the requested step count', () => {
    for (const stepCount of [3, 5, 7]) {
      const chain = generateChain({ ...base, stepCount })
      expect(chain.steps).toHaveLength(stepCount)
    }
  })

  it('keeps chain lengths within 3-7 steps', () => {
    expect(MIN_CHAIN_STEPS).toBe(3)
    expect(MAX_CHAIN_STEPS).toBe(7)
  })

  it('escalates the baseline from a quick win to harder goals', () => {
    const chain = generateChain({ ...base, stepCount: 5 })
    expect(chain.steps[0].thresholds.baseline).toBeLessThanOrEqual(3)
    for (let i = 1; i < chain.steps.length; i++) {
      expect(chain.steps[i].thresholds.baseline).toBeGreaterThan(
        chain.steps[i - 1].thresholds.baseline,
      )
    }
  })

  it('orders thresholds baseline < elevated < maximum on every step', () => {
    const chain = generateChain({ ...base, stepCount: 7 })
    for (const step of chain.steps) {
      const { baseline, elevated, maximum } = step.thresholds
      expect(baseline).toBeLessThan(elevated)
      expect(elevated).toBeLessThan(maximum)
    }
  })

  it('opens with the archetype and fills activity and enemy into every step', () => {
    const chain = generateChain({ ...base, stepCount: 4 })
    expect(chain.steps[0].text).toContain('Warrior')
    for (const step of chain.steps) {
      expect(step.text).toContain('Exercise')
      expect(step.text).toContain(chain.enemy)
      expect(step.text).not.toMatch(/[{}]/)
    }
    expect(chain.steps.some((step) => step.text.includes('Health'))).toBe(true)
  })

  it('tags every step with the catalog template it came from', () => {
    const chain = generateChain({ ...base, stepCount: 4 })
    expect(chain.steps[0].templateId).toMatch(/^opening:/)
    expect(chain.steps[1].templateId).toMatch(/^middle:/)
    expect(chain.steps[2].templateId).toMatch(/^middle:/)
    expect(chain.steps[3].templateId).toMatch(/^climax:/)
  })

  it('draws the enemy from the enemy catalog', () => {
    const chain = generateChain({ ...base, stepCount: 3 })
    expect(ENEMIES).toContain(chain.enemy)
  })

  it('draws the first enemy when the random source returns zero', () => {
    const chain = generateChain({ ...base, stepCount: 3, random: () => 0 })
    expect(chain.enemy).toBe(ENEMIES[0])
  })

  it('throws when the step count is outside 3-7', () => {
    expect(() => generateChain({ ...base, stepCount: 2 })).toThrow()
    expect(() => generateChain({ ...base, stepCount: 8 })).toThrow()
  })
})

describe('randomStepCount', () => {
  it('stays within the 3-7 step range', () => {
    for (let i = 0; i < 100; i++) {
      const n = randomStepCount()
      expect(n).toBeGreaterThanOrEqual(MIN_CHAIN_STEPS)
      expect(n).toBeLessThanOrEqual(MAX_CHAIN_STEPS)
    }
  })

  it('returns the minimum when the random source returns zero', () => {
    expect(randomStepCount(() => 0)).toBe(MIN_CHAIN_STEPS)
  })

  it('returns the maximum when the random source tops out', () => {
    expect(randomStepCount(() => 0.99)).toBe(MAX_CHAIN_STEPS)
  })
})

describe('starsForProgress', () => {
  const thresholds = { baseline: 3, elevated: 5, maximum: 8 }

  it('returns 0 stars before the baseline win state', () => {
    expect(starsForProgress(0, thresholds)).toBe(0)
    expect(starsForProgress(2, thresholds)).toBe(0)
  })

  it('returns 1 star at the baseline', () => {
    expect(starsForProgress(3, thresholds)).toBe(1)
    expect(starsForProgress(4, thresholds)).toBe(1)
  })

  it('returns 2 stars at the elevated threshold', () => {
    expect(starsForProgress(5, thresholds)).toBe(2)
    expect(starsForProgress(7, thresholds)).toBe(2)
  })

  it('returns 3 stars at the maximum threshold', () => {
    expect(starsForProgress(8, thresholds)).toBe(3)
    expect(starsForProgress(20, thresholds)).toBe(3)
  })
})

describe('quest XP', () => {
  it('awards more XP for more stars', () => {
    expect(QUEST_STAR_XP[1]).toBe(25)
    expect(QUEST_STAR_XP[2]).toBe(50)
    expect(QUEST_STAR_XP[3]).toBe(100)
  })

  it('exposes per-star totals via questXpForStars', () => {
    expect(questXpForStars(1)).toBe(25)
    expect(questXpForStars(2)).toBe(50)
    expect(questXpForStars(3)).toBe(100)
  })

  it('computes the incremental XP delta between star grades', () => {
    expect(questXpDelta(0, 1)).toBe(25)
    expect(questXpDelta(1, 2)).toBe(25)
    expect(questXpDelta(2, 3)).toBe(50)
  })
})

describe('pickQuestTarget', () => {
  it('picks the most frequently logged activity type', () => {
    const target = pickQuestTarget([
      { domain: 'Learning', type: 'Reading' },
      { domain: 'Health', type: 'Exercise' },
      { domain: 'Learning', type: 'Reading' },
      { domain: 'Learning', type: 'Reading' },
    ])

    expect(target).toEqual({ domain: 'Learning', activityType: 'Reading' })
  })

  it('falls back to a Health default for a player with no history', () => {
    expect(pickQuestTarget([])).toEqual({
      domain: 'Health',
      activityType: 'Exercise',
    })
  })
})