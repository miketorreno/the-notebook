export type Tier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum'

export interface ProgressionInfo {
  level: number
  totalXp: number
  /** XP earned within the current level, toward the next one. */
  xpIntoLevel: number
  /** XP required to advance from the current level to the next. */
  xpToNextLevel: number
  tier: Tier | null
  cumulativeCompletions: number
}

/**
 * XP required to advance from `level` to `level + 1`, per the exponential
 * curve 100 * (level ^ 1.5). Each level costs more than the last, so early
 * levels come quickly and later levels feel earned.
 */
export function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5))
}

/**
 * Total XP accumulated by a player who has just reached `level` (the sum of
 * every level-up requirement below it).
 */
export function cumulativeXpForLevel(level: number): number {
  let total = 0
  for (let current = 1; current < level; current++) {
    total += xpForLevel(current)
  }
  return total
}

/**
 * The highest level whose cumulative requirement has been met by `totalXp`.
 * A player always starts at level 1.
 */
export function levelFromTotalXp(totalXp: number): number {
  let level = 1
  while (totalXp >= cumulativeXpForLevel(level + 1)) {
    level++
  }
  return level
}

/**
 * The tier milestone reached by `level`. Levels below the first milestone
 * have no tier yet.
 */
export function tierFromLevel(level: number): Tier | null {
  if (level >= 100) return 'Platinum'
  if (level >= 50) return 'Gold'
  if (level >= 25) return 'Silver'
  if (level >= 10) return 'Bronze'
  return null
}

/**
 * Derive the full progression snapshot from accumulated totals. Level, XP
 * progress, and tier follow from the curve; cumulative completions are the
 * primary progress metric and always rise, never reset.
 */
export function buildProgression(
  totalXp: number,
  cumulativeCompletions: number,
): ProgressionInfo {
  const level = levelFromTotalXp(totalXp)
  return {
    level,
    totalXp,
    xpIntoLevel: totalXp - cumulativeXpForLevel(level),
    xpToNextLevel: xpForLevel(level),
    tier: tierFromLevel(level),
    cumulativeCompletions,
  }
}