import type { Activity } from '../activity'
import {
  ACTIVITIES_COLLECTION,
  ACTIVITY_TYPES_COLLECTION,
} from '../activity/activity-store'
import type { JsonValue } from '../crypto/crypto'
import { openStore, type EncryptedStore } from '../store/store'
import { isWellRounded, WELL_ROUNDED_XP_MULTIPLIER } from './well-rounded'

export const WELL_ROUNDED_COLLECTION = 'wellRounded'
export const WELL_ROUNDED_RECORD_ID = 'well-rounded'

/**
 * The persisted "Well-Rounded" achievement. Only the first unlock is ever
 * stored: the achievement is permanent, even though the weekly bonus itself
 * comes and goes as domains fall out of the window.
 */
export interface WellRoundedRecord {
  type: 'well-rounded'
  unlockedAt: string
}

export interface WellRoundedStatus {
  /** Whether the 1.5x bonus is in effect right now. */
  active: boolean
  /** 1.5 while active, 1 otherwise. */
  multiplier: number
  /** Whether the permanent achievement has ever been earned. */
  unlocked: boolean
  /** When the achievement was first earned. */
  unlockedAt?: string
}

export interface WellRoundedStore {
  /**
   * Evaluate the current state of the Well-Rounded bonus from the stored
   * activities, persisting the achievement the first time the bonus becomes
   * active (an on-demand backfill, like the progression store's record).
   */
  getStatus(key: CryptoKey): Promise<WellRoundedStatus>
  destroy(): Promise<void>
}

export interface WellRoundedStoreOptions {
  /** Injectable clock; defaults to the real current time. */
  now?: () => Date
}

/**
 * Open the well-rounded store backed by the encrypted IndexedDB store. The
 * achievement record lives in the same encrypted vault as the activities it
 * is computed from; the weekly state is always derived live from the
 * activity history so it can never drift from what the user actually logged.
 */
export async function openWellRoundedStore(
  dbName: string,
  options: WellRoundedStoreOptions = {},
): Promise<WellRoundedStore> {
  const now = options.now ?? (() => new Date())
  const store = await openStore(dbName, [
    ACTIVITIES_COLLECTION,
    ACTIVITY_TYPES_COLLECTION,
    WELL_ROUNDED_COLLECTION,
  ])

  async function loadRecord(key: CryptoKey): Promise<WellRoundedRecord | undefined> {
    const value = await store.load({
      collection: WELL_ROUNDED_COLLECTION,
      id: WELL_ROUNDED_RECORD_ID,
      key,
    })
    return value as WellRoundedRecord | undefined
  }

  async function saveRecord(
    record: WellRoundedRecord,
    key: CryptoKey,
  ): Promise<void> {
    await store.save({
      collection: WELL_ROUNDED_COLLECTION,
      id: WELL_ROUNDED_RECORD_ID,
      record: record as unknown as JsonValue,
      key,
    })
  }

  return {
    async getStatus(key: CryptoKey): Promise<WellRoundedStatus> {
      const nowDate = now()
      const entries = await store.list({ collection: ACTIVITIES_COLLECTION, key })
      const activities = entries.map((e) => e.value as unknown as Activity)
      const active = isWellRounded(activities, nowDate)

      const record = await loadRecord(key)
      if (active && !record) {
        await saveRecord(
          { type: 'well-rounded', unlockedAt: nowDate.toISOString() },
          key,
        )
      }

      const unlockedAt =
        record?.unlockedAt ?? (active ? nowDate.toISOString() : undefined)
      return {
        active,
        multiplier: active ? WELL_ROUNDED_XP_MULTIPLIER : 1,
        unlocked: active || record !== undefined,
        ...(unlockedAt ? { unlockedAt } : {}),
      }
    },

    async destroy(): Promise<void> {
      await store.destroy()
    },
  }
}