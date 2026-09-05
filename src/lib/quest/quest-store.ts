import type { Activity } from '../activity'
import {
  ACTIVITIES_COLLECTION,
  ACTIVITY_TYPES_COLLECTION,
} from '../activity/activity-store'
import type { ArchetypeId, Domain } from '../archetype'
import { getCurrentArchetype } from '../archetype/archetype-store'
import type { JsonValue } from '../crypto/crypto'
import { openStore, type EncryptedStore } from '../store/store'
import {
  generateChain,
  pickQuestTarget,
  questXpDelta,
  randomStepCount,
  starsForProgress,
  type QuestStar,
  type QuestThresholds,
} from './quest'

export const QUEST_COLLECTION = 'quests'
export const CHAIN_RECORD_ID = 'chain'

export type QuestStepStatus = 'locked' | 'current' | 'completed'

export interface QuestStep {
  id: string
  /** Identity of the catalog template this quest was rendered from. */
  templateId: string
  text: string
  domain: Domain
  activityType: string
  thresholds: QuestThresholds
  status: QuestStepStatus
  /** How many qualifying activities have been recorded for this step. */
  progress: number
  /** Star grade earned so far: 0 until the baseline win, then 1-3. */
  stars: QuestStar | 0
  /** Cumulative XP banked by completing and stretching this quest. */
  xpEarned: number
  startedAt: string
  completedAt?: string
}

export interface QuestChain {
  id: string
  archetype: ArchetypeId
  enemy: string
  stepCount: number
  status: 'active' | 'complete'
  createdAt: string
  completedAt?: string
  /** Index of the first step that is neither completed nor locked. */
  currentIndex: number
  steps: QuestStep[]
}

export interface QuestActivityEvent {
  /** XP awarded by completing quests or reaching stretch goals this recording. */
  xpEarned: number
  /** Ids of steps that reached their win state in this recording. */
  completedStepIds: string[]
  /** Ids of completed steps that climbed a star grade in this recording. */
  upgradedStepIds: string[]
  chainCompleted: boolean
  /** A fresh saga was generated as part of this recording. */
  newChainStarted: boolean
}

export interface QuestStore {
  getChain(key: CryptoKey): Promise<QuestChain | null>
  startChain(key: CryptoKey): Promise<QuestChain>
  recordActivity(activity: Activity, key: CryptoKey): Promise<QuestActivityEvent>
  destroy(): Promise<void>
}

export interface QuestStoreOptions {
  /** Archetype the saga is framed through; defaults to the saved choice. */
  archetype?: ArchetypeId
  /** Pin the chain length; defaults to a random 3-7. */
  stepCount?: number
  /** Injectable randomness; defaults to Math.random. */
  random?: () => number
  /** Injectable clock; defaults to the real current time. */
  now?: () => Date
}

/**
 * Open the quest store backed by the encrypted IndexedDB store. The quest
 * chain lives in the same encrypted vault as the activities it is generated
 * from: it is themed on the player's most-logged activity type, advanced by
 * qualifying activity recordings, and persisted as a single chain record.
 */
export async function openQuestStore(
  dbName: string,
  options: QuestStoreOptions = {},
): Promise<QuestStore> {
  const now = options.now ?? (() => new Date())
  const random = options.random ?? Math.random
  const stepCount = options.stepCount ?? randomStepCount(random)
  const archetype = options.archetype ?? getCurrentArchetype()?.id ?? 'warrior'
  const store = await openStore(dbName, [
    ACTIVITIES_COLLECTION,
    ACTIVITY_TYPES_COLLECTION,
    QUEST_COLLECTION,
  ])

  async function loadChain(key: CryptoKey): Promise<QuestChain | undefined> {
    const value = await store.load({
      collection: QUEST_COLLECTION,
      id: CHAIN_RECORD_ID,
      key,
    })
    return value as QuestChain | undefined
  }

  async function saveChain(chain: QuestChain, key: CryptoKey): Promise<void> {
    await store.save({
      collection: QUEST_COLLECTION,
      id: CHAIN_RECORD_ID,
      record: chain as unknown as JsonValue,
      key,
    })
  }

  /**
   * Theme the next saga on where the player's momentum already lives: the
   * activity type they have logged most. This is what makes a generated
   * quest feel personal instead of arbitrary.
   */
  async function pickTarget(
    key: CryptoKey,
  ): Promise<{ domain: Domain; activityType: string }> {
    const entries = await store.list({ collection: ACTIVITIES_COLLECTION, key })
    const activities = entries.map((e) => e.value as unknown as Activity)
    return pickQuestTarget(activities)
  }

  async function newChain(key: CryptoKey, nowDate: Date): Promise<QuestChain> {
    const { domain, activityType } = await pickTarget(key)
    const id = `chain-${crypto.randomUUID()}`
    const createdAt = nowDate.toISOString()
    const generation = generateChain({
      archetype,
      domain,
      activityType,
      stepCount,
      random,
    })
    const steps: QuestStep[] = generation.steps.map((step, i) => ({
      id: `${id}-${i}`,
      templateId: step.templateId,
      text: step.text,
      domain: step.domain,
      activityType: step.activityType,
      thresholds: step.thresholds,
      status: i === 0 ? ('current' as const) : ('locked' as const),
      progress: 0,
      stars: 0,
      xpEarned: 0,
      startedAt: createdAt,
    }))
    const chain: QuestChain = {
      id,
      archetype,
      enemy: generation.enemy,
      stepCount,
      status: 'active',
      createdAt,
      currentIndex: 0,
      steps,
    }
    await saveChain(chain, key)
    return chain
  }

  function matches(step: QuestStep, activity: Activity): boolean {
    return (
      activity.domain === step.domain &&
      activity.type.toLowerCase() === step.activityType.toLowerCase()
    )
  }

  async function applyActivity(
    chain: QuestChain,
    activity: Activity,
    nowDate: Date,
  ): Promise<QuestActivityEvent> {
    const event: QuestActivityEvent = {
      xpEarned: 0,
      completedStepIds: [],
      upgradedStepIds: [],
      chainCompleted: false,
      newChainStarted: false,
    }
    // Only unlocked steps count: the in-flight quest plus any completed steps
    // the same activity can stretch toward more stars. Locked steps wait.
    const affected = chain.steps.filter((step) => step.status !== 'locked')

    for (const step of affected) {
      if (matches(step, activity)) step.progress += 1
    }

    // Completed steps climb toward their elevated and maximum goals as the
    // player keeps training for later steps in the saga.
    for (const step of chain.steps) {
      if (step.status !== 'completed') continue
      const grade = starsForProgress(step.progress, step.thresholds)
      const from = step.stars
      if (grade > from) {
        const delta = questXpDelta(from, grade)
        step.xpEarned += delta
        step.stars = grade
        event.xpEarned += delta
        event.upgradedStepIds.push(step.id)
      }
    }

    // The in-flight quest wins the moment its baseline is reached, unlocking
    // the next step of the chain (or closing the saga when it was the last).
    const current = chain.steps[chain.currentIndex]
    if (
      current?.status === 'current' &&
      current.progress >= current.thresholds.baseline
    ) {
      const grade = starsForProgress(current.progress, current.thresholds)
      if (grade > 0) {
        const delta = questXpDelta(0, grade)
        current.xpEarned += delta
        current.stars = grade
        current.status = 'completed'
        current.completedAt = nowDate.toISOString()
        event.xpEarned += delta
        event.completedStepIds.push(current.id)
      }

      chain.currentIndex += 1
      const next = chain.steps[chain.currentIndex]
      if (next) {
        next.status = 'current'
        next.startedAt = nowDate.toISOString()
      } else {
        chain.status = 'complete'
        chain.completedAt = nowDate.toISOString()
        event.chainCompleted = true
      }
    }

    return event
  }

  return {
    async getChain(key: CryptoKey): Promise<QuestChain | null> {
      return (await loadChain(key)) ?? null
    },

    async startChain(key: CryptoKey): Promise<QuestChain> {
      return newChain(key, now())
    },

    async recordActivity(
      activity: Activity,
      key: CryptoKey,
    ): Promise<QuestActivityEvent> {
      const nowDate = now()
      let chain = await loadChain(key)
      let newChainStarted = false
      if (!chain || chain.status === 'complete') {
        chain = await newChain(key, nowDate)
        newChainStarted = true
      }
      const event = await applyActivity(chain, activity, nowDate)
      event.newChainStarted = newChainStarted
      await saveChain(chain, key)
      return event
    },

    async destroy(): Promise<void> {
      await store.destroy()
    },
  }
}