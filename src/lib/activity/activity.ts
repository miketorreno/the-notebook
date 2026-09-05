import type { Domain } from '../archetype'

export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard']

/**
 * Default quick-log activity types for each domain, giving the user a
 * one-tap way to log common activities. Custom types extend these.
 */
export const DEFAULT_ACTIVITY_TYPES: Record<Domain, string[]> = {
  Health: ['Exercise', 'Sleep', 'Nutrition', 'Meditation'],
  Learning: ['Reading', 'Course', 'Practice'],
  Productivity: ['Deep work', 'Routine', 'Project'],
}

export interface Activity {
  id: string
  domain: Domain
  type: string
  difficulty: Difficulty
  notes?: string
  completedAt: string
  xp: number
}

export interface NewActivity {
  domain: Domain
  type: string
  difficulty: Difficulty
  notes?: string
  /** Override the completion timestamp; defaults to now. */
  now?: Date
}

/**
 * Construct an Activity from user input, generating a unique id, stamping
 * the completion time, and computing the XP from the chosen difficulty.
 */
export function buildActivity(input: NewActivity): Activity {
  const id = `${input.domain}-${input.type}-${crypto.randomUUID()}`
  return {
    id,
    domain: input.domain,
    type: input.type,
    difficulty: input.difficulty,
    notes: input.notes,
    completedAt: (input.now ?? new Date()).toISOString(),
    xp: calculateXp(input.difficulty),
  }
}

const BASE_XP: Record<Difficulty, number> = {
  Easy: 10,
  Medium: 25,
  Hard: 50,
}

/**
 * Base XP awarded for completing an activity of the given difficulty.
 * Harder activities are worth more; the total XP/level accumulation is a
 * separate concern (see the progression module).
 */
export function calculateXp(difficulty: Difficulty): number {
  return BASE_XP[difficulty]
}
