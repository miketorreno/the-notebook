import { describe, expect, it } from 'vitest'
import {
  buildProgression,
  cumulativeXpForLevel,
  levelFromTotalXp,
  tierFromLevel,
  xpForLevel,
} from './progression'

describe('xpForLevel', () => {
  it('requires 100 XP to advance from level 1 to 2', () => {
    expect(xpForLevel(1)).toBe(100)
  })

  it('follows the 100 * (level ^ 1.5) curve', () => {
    expect(xpForLevel(2)).toBe(283)
    expect(xpForLevel(3)).toBe(520)
    expect(xpForLevel(4)).toBe(800)
    expect(xpForLevel(10)).toBe(3162)
  })
})

describe('cumulativeXpForLevel', () => {
  it('needs no XP to be at level 1', () => {
    expect(cumulativeXpForLevel(1)).toBe(0)
  })

  it('sums the incremental requirements up to the level', () => {
    expect(cumulativeXpForLevel(2)).toBe(100)
    expect(cumulativeXpForLevel(3)).toBe(383)
    expect(cumulativeXpForLevel(4)).toBe(903)
    expect(cumulativeXpForLevel(5)).toBe(1703)
    expect(cumulativeXpForLevel(10)).toBe(11106)
  })
})

describe('levelFromTotalXp', () => {
  it('stays at level 1 below the first threshold', () => {
    expect(levelFromTotalXp(0)).toBe(1)
    expect(levelFromTotalXp(99)).toBe(1)
  })

  it('levels up exactly when the threshold is reached', () => {
    expect(levelFromTotalXp(100)).toBe(2)
    expect(levelFromTotalXp(383)).toBe(3)
    expect(levelFromTotalXp(903)).toBe(4)
    expect(levelFromTotalXp(1703)).toBe(5)
  })

  it('holds the current level below the next threshold', () => {
    expect(levelFromTotalXp(102)).toBe(2)
    expect(levelFromTotalXp(382)).toBe(2)
    expect(levelFromTotalXp(1702)).toBe(4)
  })
})

describe('tierFromLevel', () => {
  it('has no tier before the Bronze milestone', () => {
    expect(tierFromLevel(1)).toBeNull()
    expect(tierFromLevel(9)).toBeNull()
  })

  it('recognizes the Bronze, Silver, Gold, and Platinum milestones', () => {
    expect(tierFromLevel(10)).toBe('Bronze')
    expect(tierFromLevel(24)).toBe('Bronze')
    expect(tierFromLevel(25)).toBe('Silver')
    expect(tierFromLevel(49)).toBe('Silver')
    expect(tierFromLevel(50)).toBe('Gold')
    expect(tierFromLevel(99)).toBe('Gold')
    expect(tierFromLevel(100)).toBe('Platinum')
    expect(tierFromLevel(101)).toBe('Platinum')
  })
})

describe('buildProgression', () => {
  it('describes a fresh player', () => {
    const fresh = buildProgression(0, 0)

    expect(fresh).toEqual({
      level: 1,
      totalXp: 0,
      xpIntoLevel: 0,
      xpToNextLevel: 100,
      tier: null,
      cumulativeCompletions: 0,
    })
  })

  it('reports XP progress within the current level', () => {
    const midLevel = buildProgression(283, 12)

    expect(midLevel.level).toBe(2)
    expect(midLevel.xpIntoLevel).toBe(183)
    expect(midLevel.xpToNextLevel).toBe(283)
    expect(midLevel.cumulativeCompletions).toBe(12)
  })

  it('reflects the tier of the current level', () => {
    const atManagerLevel = buildProgression(11106, 45)

    expect(atManagerLevel.level).toBe(10)
    expect(atManagerLevel.tier).toBe('Bronze')
    expect(atManagerLevel.xpIntoLevel).toBe(0)
    expect(atManagerLevel.xpToNextLevel).toBe(3162)
  })
})