import type { Activity } from '../activity'
import {
  ACTIVITIES_COLLECTION,
  ACTIVITY_TYPES_COLLECTION,
} from '../activity/activity-store'
import { openStore, type EncryptedStore } from '../store/store'
import {
  buildProgression,
  completionDayKey,
  type ProgressionInfo,
  type Tier,
  uniqueCompletionDays,
} from './progression'
import type { JsonValue } from '../crypto/crypto'

const PROGRESSION_COLLECTION = 'progression'
const PROGRESSION_RECORD_ID = 'progression'

export interface ProgressionRecord {
  level: number
  totalXp: number
  tier: Tier | null
  cumulativeCompletions: number
  /** One calendar-day key per day an activity was completed. */
  completionDays: string[]
  updatedAt: string
}

export interface ProgressionEvent {
  progression: ProgressionInfo
  previous: ProgressionInfo
  leveledUp: boolean
}

export interface ProgressionStore {
  get(key: CryptoKey): Promise<ProgressionInfo>
  recordActivity(activity: Activity, key: CryptoKey): Promise<ProgressionEvent>
  recordQuestXp(xp: number, key: CryptoKey): Promise<ProgressionEvent>
  destroy(): Promise<void>
}

export interface ProgressionStoreOptions {
  /** Injectable clock; defaults to the real current time. */
  now?: () => Date
}

/**
 * Open the progression store backed by the encrypted IndexedDB store. The
 * progression record lives in the same encrypted vault as the activities:
 * cumulative completions are a stored, monotonic counter that never
 * decreases, and total XP, level, tier, and streaks are derived from it
 * whenever the record is read.
 */
export async function openProgressionStore(
  dbName: string,
  options: ProgressionStoreOptions = {},
): Promise<ProgressionStore> {
  const now = options.now ?? (() => new Date())
  const store = await openStore(dbName, [
    ACTIVITIES_COLLECTION,
    ACTIVITY_TYPES_COLLECTION,
    PROGRESSION_COLLECTION,
  ])

  async function loadRecord(key: CryptoKey): Promise<ProgressionRecord | undefined> {
    const value = await store.load({
      collection: PROGRESSION_COLLECTION,
      id: PROGRESSION_RECORD_ID,
      key,
    })
    return value as ProgressionRecord | undefined
  }

  async function saveRecord(
    record: ProgressionRecord,
    key: CryptoKey,
  ): Promise<void> {
    await store.save({
      collection: PROGRESSION_COLLECTION,
      id: PROGRESSION_RECORD_ID,
      record: record as unknown as JsonValue,
      key,
    })
  }

  function fromRecord(record: ProgressionRecord): ProgressionInfo {
    // Recompute level, tier, XP progress, and streaks from the stored
    // totals and completion days so the displayed snapshot can never drift
    // from the curve or the grace logic.
    return buildProgression(
      record.totalXp,
      record.cumulativeCompletions,
      record.completionDays,
      now(),
    )
  }

  function toRecord(
    info: ProgressionInfo,
    completionDays: string[],
    updatedAt = new Date(),
  ): ProgressionRecord {
    return {
      level: info.level,
      totalXp: info.totalXp,
      tier: info.tier,
      cumulativeCompletions: info.cumulativeCompletions,
      completionDays,
      updatedAt: updatedAt.toISOString(),
    }
  }

  /**
   * Load the stored progression record, or — when the user has activities
   * logged before this record existed — derive one once from the activity
   * history and persist it. Fresh players get no persisted record. This is
   * the single on-demand backfill point shared by every read and write; it
   * runs at most once because a backfilled record is then always present.
   */
  async function currentRecord(key: CryptoKey): Promise<ProgressionRecord | undefined> {
    const existing = await loadRecord(key)
    if (existing) return existing

    const entries = await store.list({ collection: ACTIVITIES_COLLECTION, key })
    const activities = entries.map((e) => e.value as unknown as Activity)
    if (activities.length === 0) return undefined

    const completionDays = uniqueCompletionDays(
      activities.map((activity) => completionDayKey(activity.completedAt)),
    )
    const totalXp = activities.reduce((sum, activity) => sum + activity.xp, 0)
    const record = toRecord(
      buildProgression(totalXp, activities.length, completionDays),
      completionDays,
    )
    await saveRecord(record, key)
    return record
  }

  return {
    async get(key: CryptoKey): Promise<ProgressionInfo> {
      const record = await currentRecord(key)
      return record ? fromRecord(record) : buildProgression(0, 0, [], now())
    },

    async recordActivity(activity: Activity, key: CryptoKey): Promise<ProgressionEvent> {
      const record = await currentRecord(key)
      const previous = record ? fromRecord(record) : buildProgression(0, 0, [], now())
      const completionDays = uniqueCompletionDays([
        ...(record?.completionDays ?? []),
        completionDayKey(activity.completedAt),
      ])
      const progression = buildProgression(
        previous.totalXp + activity.xp,
        previous.cumulativeCompletions + 1,
        completionDays,
        now(),
      )
      await saveRecord(toRecord(progression, completionDays), key)
      return {
        progression,
        previous,
        leveledUp: progression.level > previous.level,
      }
    },

    async recordQuestXp(xp: number, key: CryptoKey): Promise<ProgressionEvent> {
      const record = await currentRecord(key)
      const previous = record ? fromRecord(record) : buildProgression(0, 0, [], now())
      const completionDays = record?.completionDays ?? []
      const progression = buildProgression(
        previous.totalXp + xp,
        previous.cumulativeCompletions,
        completionDays,
        now(),
      )
      await saveRecord(toRecord(progression, completionDays), key)
      return {
        progression,
        previous,
        leveledUp: progression.level > previous.level,
      }
    },

    async destroy(): Promise<void> {
      await store.destroy()
    },
  }
}