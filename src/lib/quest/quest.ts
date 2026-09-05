import {
  getArchetype,
  type ArchetypeId,
  type Domain,
} from '../archetype'
import { DEFAULT_ACTIVITY_TYPES } from '../activity'

export const MIN_CHAIN_STEPS = 3
export const MAX_CHAIN_STEPS = 7

/** Every quest text is built from a template with these variable slots. */
export type QuestSlot = 'count' | 'activity' | 'domain' | 'enemy' | 'archetype'

export interface QuestThresholds {
  /** Required to win the quest; the clear, measurable win state. */
  baseline: number
  /** Stretch goal worth a second star. */
  elevated: number
  /** Stretch goal worth a third star. */
  maximum: number
}

export type QuestStar = 1 | 2 | 3

/**
 * XP awarded for completing a quest at each star grade. Reaching the
 * baseline win is worth 25; pushing to the elevated goal doubles it; hitting
 * the maximum triples it.
 */
export const QUEST_STAR_XP: Record<QuestStar, number> = {
  1: 25,
  2: 50,
  3: 100,
}

/** The story arc a chain follows: the first step opens, the last climaxes. */
export const OPENING_TEMPLATES = [
  '{archetype}, a {domain} quest stirs. {enemy} prowls — complete {count} {activity} sessions to answer the call.',
  '{enemy} has been sighted. Begin by completing {count} {activity} sessions.',
  '{archetype}, the realm needs you. {enemy} rises — log {count} {activity} sessions to begin.',
]

export const MIDDLE_TEMPLATES = [
  '{enemy} presses harder. Complete {count} {activity} sessions to push back.',
  'Hold the {domain} line against {enemy}. Complete {count} {activity} sessions to strike back.',
  '{enemy} grows bolder. Log {count} {activity} sessions to prevail.',
]

export const CLIMAX_TEMPLATES = [
  'Face {enemy}! Complete {count} {activity} sessions to claim victory.',
  'The final battle against {enemy} for {domain} awaits. Complete {count} {activity} sessions to win.',
  'Defeat {enemy}. Complete {count} {activity} sessions to finish the saga.',
]

/** Named adversaries a generated saga is framed around. */
export const ENEMIES = [
  'the Doubt Demon',
  'the Sloth King',
  'the Inner Critic',
  'the Comfort Demon',
  'the Noise',
  'the Endless Scroll',
]

export interface QuestSlots {
  count: number
  activity: string
  domain: Domain
  enemy: string
  archetype: string
}

/**
 * Fill the {count}, {activity}, {domain}, {enemy} and {archetype} slots of a
 * quest template, rendering a personal quest line. Any other braces are left
 * untouched so a malformed template surfaces immediately.
 */
export function fillQuestText(template: string, slots: QuestSlots): string {
  return template
    .replaceAll('{count}', String(slots.count))
    .replaceAll('{activity}', slots.activity)
    .replaceAll('{domain}', slots.domain)
    .replaceAll('{enemy}', slots.enemy)
    .replaceAll('{archetype}', slots.archetype)
}

/**
 * Pick a chain length between 3 and 7 steps. Kept on the pure-logic seam so
 * the store can pin the length through injectable randomness in tests.
 */
export function randomStepCount(random: () => number = Math.random): number {
  const spread = MAX_CHAIN_STEPS - MIN_CHAIN_STEPS + 1
  return MIN_CHAIN_STEPS + Math.floor(random() * spread)
}

/**
 * The star grade earned at a given progress: no star before the baseline win,
 * then one for baseline, two for elevated and three for maximum. Grades are
 * read against the thresholds, so overshooting a goal upgrades the quest.
 */
export function starsForProgress(
  progress: number,
  thresholds: QuestThresholds,
): QuestStar | 0 {
  if (progress >= thresholds.maximum) return 3
  if (progress >= thresholds.elevated) return 2
  if (progress >= thresholds.baseline) return 1
  return 0
}

/** Total XP for a quest completed at the given star grade. */
export function questXpForStars(stars: QuestStar): number {
  return QUEST_STAR_XP[stars]
}

/**
 * Incremental XP earned when a quest climbs from one star grade to another,
 * so a quest that later reaches a stretch goal is paid the difference. A
 * grade of 0 (not yet won) contributes nothing.
 */
export function questXpDelta(
  from: QuestStar | 0,
  to: QuestStar | 0,
): number {
  const current = from === 0 ? 0 : questXpForStars(from)
  const next = to === 0 ? 0 : questXpForStars(to)
  return next - current
}

export interface GeneratedStep {
  /** Identity of the catalog template this step was rendered from. */
  templateId: string
  text: string
  domain: Domain
  activityType: string
  thresholds: QuestThresholds
}

export interface ChainGeneration {
  enemy: string
  steps: GeneratedStep[]
}

export interface ChainInput {
  archetype: ArchetypeId
  domain: Domain
  activityType: string
  /** 3-7; the number of quests in the saga. */
  stepCount: number
  /** Injectable randomness; defaults to Math.random. */
  random?: () => number
}

/**
 * Generate a quest chain from the template catalog. The saga is themed on a
 * single activity type, escalates from a quick first win toward harder later
 * steps, and every step's text is rendered through the archetype's lens with
 * its variable slots filled.
 */
export function generateChain(input: ChainInput): ChainGeneration {
  if (input.stepCount < MIN_CHAIN_STEPS || input.stepCount > MAX_CHAIN_STEPS) {
    throw new Error(
      `Quest chains must have ${MIN_CHAIN_STEPS}-${MAX_CHAIN_STEPS} steps (got ${input.stepCount})`,
    )
  }
  const random = input.random ?? Math.random
  const archetype = getArchetype(input.archetype)
  if (!archetype) {
    throw new Error(`Unknown archetype: ${input.archetype}`)
  }
  const enemy = ENEMIES[Math.floor(random() * ENEMIES.length)]

  const steps: GeneratedStep[] = []
  for (let i = 0; i < input.stepCount; i++) {
    const baseline = 2 + i
    const elevated = baseline + 2
    const maximum = elevated + 2
    const pool =
      i === 0
        ? OPENING_TEMPLATES
        : i === input.stepCount - 1
          ? CLIMAX_TEMPLATES
          : MIDDLE_TEMPLATES
    const template = pool[i % pool.length]
    const position =
      i === 0 ? 'opening' : i === input.stepCount - 1 ? 'climax' : 'middle'
    steps.push({
      templateId: `${position}:${i % pool.length}`,
      text: fillQuestText(template, {
        count: baseline,
        activity: input.activityType,
        domain: input.domain,
        enemy,
        archetype: archetype.name,
      }),
      domain: input.domain,
      activityType: input.activityType,
      thresholds: { baseline, elevated, maximum },
    })
  }

  return { enemy, steps }
}

/**
 * Pick the activity type to theme a generated chain around: the most
 * frequently logged type across the player's history tells the quest system
 * where their momentum already lives. Falls back to a Health default so a
 * brand-new player still gets a sensible first saga.
 */
export function pickQuestTarget(
  activities: Array<{ domain: Domain; type: string }>,
): { domain: Domain; activityType: string } {
  if (activities.length === 0) {
    return { domain: 'Health', activityType: DEFAULT_ACTIVITY_TYPES.Health[0] }
  }
  const counts = new Map<string, number>()
  let best: { domain: Domain; type: string } | undefined
  let bestCount = 0
  for (const activity of activities) {
    const key = `${activity.domain}:${activity.type.toLowerCase()}`
    const count = (counts.get(key) ?? 0) + 1
    counts.set(key, count)
    if (count > bestCount) {
      bestCount = count
      best = activity
    }
  }
  return best
    ? { domain: best.domain, activityType: best.type }
    : { domain: 'Health', activityType: DEFAULT_ACTIVITY_TYPES.Health[0] }
}