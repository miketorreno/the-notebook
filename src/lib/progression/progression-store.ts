import type { Activity } from '../activity'
import {
  ACTIVITIES_COLLECTION,
  ACTIVITY_TYPES_COLLECTION,
} from '../activity/activity-store'
import { openStore, type EncryptedStore } from '../store/store'
import { buildProgression, type ProgressionInfo, type Tier } from './progression'
import type { JsonValue } from '../crypto/crypto'

const PROGRESSION_COLLECTION = 'progression'
const PROGRESSION_RECORD_ID = 'progression'

export interface ProgressionRecord {
  level: number
  totalXp: number
  tier: Tier | null
  cumulativeCompletions: number
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
  destroy(): Promise<void>
}

/**
 * Open the progression store backed by the encrypted IndexedDB store. The
 * progression record lives in the same encrypted vault as the activities:
 * cumulative completions are a stored, monotonic counter that never
 * decreases, and total XP, level, and tier are derived from it via the
 * exponential curve whenever the record is read.
 */
export async function openProgressionStore(dbName: string): Promise<ProgressionStore> {
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
    // Recompute level, tier, and XP progress from the totals so the
    // displayed snapshot can never drift from the curve.
    return buildProgression(record.totalXp, record.cumulativeCompletions)
  }

  function toRecord(info: ProgressionInfo, updatedAt = new Date()): ProgressionRecord {
    return {
      level: info.level,
      totalXp: info.totalXp,
      tier: info.tier,
      cumulativeCompletions: info.cumulativeCompletions,
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

    const totalXp = activities.reduce((sum, activity) => sum + activity.xp, 0)
    const record = toRecord(buildProgression(totalXp, activities.length))
    await saveRecord(record, key)
    return record
  }

  return {
    async get(key: CryptoKey): Promise<ProgressionInfo> {
      const record = await currentRecord(key)
      return record ? fromRecord(record) : buildProgression(0, 0)
    },

    async recordActivity(activity: Activity, key: CryptoKey): Promise<ProgressionEvent> {
      const record = await currentRecord(key)
      const previous = record ? fromRecord(record) : buildProgression(0, 0)
      const progression = buildProgression(
        previous.totalXp + activity.xp,
        previous.cumulativeCompletions + 1,
      )
      await saveRecord(toRecord(progression), key)
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