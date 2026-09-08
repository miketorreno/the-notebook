import { describe, expect, it } from 'vitest'
import {
  buildActivity,
  calculateXp,
  DEFAULT_ACTIVITY_TYPES,
} from './activity'

describe('calculateXp', () => {
  it('awards more XP for harder activities', () => {
    expect(calculateXp('Easy')).toBeLessThan(calculateXp('Medium'))
    expect(calculateXp('Medium')).toBeLessThan(calculateXp('Hard'))
  })

  it('awards the known per-difficulty base values', () => {
    expect(calculateXp('Easy')).toBe(10)
    expect(calculateXp('Medium')).toBe(25)
    expect(calculateXp('Hard')).toBe(50)
  })
})

describe('buildActivity', () => {
  it('builds an activity with a generated id and timestamp', () => {
    const activity = buildActivity({
      domain: 'Health',
      type: 'meditation',
      difficulty: 'Easy',
      notes: '10 min',
      now: new Date('2026-09-03T10:00:00Z'),
    })

    expect(activity.id).toBeTruthy()
    expect(activity.domain).toBe('Health')
    expect(activity.type).toBe('meditation')
    expect(activity.difficulty).toBe('Easy')
    expect(activity.notes).toBe('10 min')
    expect(activity.completedAt).toBe('2026-09-03T10:00:00.000Z')
  })

  it('computes the XP from the difficulty', () => {
    const easy = buildActivity({ domain: 'Learning', type: 'reading', difficulty: 'Easy' })
    const hard = buildActivity({ domain: 'Productivity', type: 'deep work', difficulty: 'Hard' })
    expect(easy.xp).toBe(10)
    expect(hard.xp).toBe(50)
  })

  it('leaves notes undefined when none are provided', () => {
    const activity = buildActivity({ domain: 'Health', type: 'run', difficulty: 'Medium' })
    expect(activity.notes).toBeUndefined()
  })
})

describe('DEFAULT_ACTIVITY_TYPES', () => {
  it('provides at least one quick-log type for each of the three domains', () => {
    expect(DEFAULT_ACTIVITY_TYPES.Health.length).toBeGreaterThan(0)
    expect(DEFAULT_ACTIVITY_TYPES.Learning.length).toBeGreaterThan(0)
    expect(DEFAULT_ACTIVITY_TYPES.Productivity.length).toBeGreaterThan(0)
  })

  it('contains no other domains', () => {
    const domains = Object.keys(DEFAULT_ACTIVITY_TYPES)
    expect(domains).toEqual(['Health', 'Learning', 'Productivity'])
  })
})
