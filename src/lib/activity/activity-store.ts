import { openStore, type EncryptedStore } from '../store/store'
import type { JsonValue } from '../crypto/crypto'
import type { Domain } from '../archetype'
import type { Activity } from './activity'

export const ACTIVITIES_COLLECTION = 'activities'
export const ACTIVITY_TYPES_COLLECTION = 'activityTypes'

export interface ActivityType {
  value: string
  domain: Domain
}

export interface ActivityStore {
  logActivity(activity: Activity, key: CryptoKey): Promise<void>
  getActivity(id: string, key: CryptoKey): Promise<Activity | undefined>
  listActivities(key: CryptoKey): Promise<Activity[]>
  deleteActivity(id: string): Promise<void>
  setActivityType(value: string, domain: Domain, key: CryptoKey): Promise<void>
  listActivityTypes(key: CryptoKey): Promise<ActivityType[]>
  destroy(): Promise<void>
}

/**
 * Open the activity store backed by the encrypted IndexedDB store.
 * Both logged activities and custom activity types live in encrypted
 * collections — they reveal habit patterns and are treated as sensitive.
 */
export async function openActivityStore(dbName: string): Promise<ActivityStore> {
  const store = await openStore(dbName, [ACTIVITIES_COLLECTION, ACTIVITY_TYPES_COLLECTION])

  return {
    async logActivity(activity: Activity, key: CryptoKey): Promise<void> {
      await store.save({
        collection: ACTIVITIES_COLLECTION,
        id: activity.id,
        record: activity as unknown as JsonValue,
        key,
      })
    },

    async getActivity(id: string, key: CryptoKey): Promise<Activity | undefined> {
      const value = await store.load({ collection: ACTIVITIES_COLLECTION, id, key })
      return value as unknown as Activity | undefined
    },

    async listActivities(key: CryptoKey): Promise<Activity[]> {
      const entries = await store.list({ collection: ACTIVITIES_COLLECTION, key })
      const activities = entries.map((e) => e.value as unknown as Activity)
      return activities.sort((a, b) =>
        b.completedAt.localeCompare(a.completedAt),
      )
    },

    async deleteActivity(id: string): Promise<void> {
      await store.delete({ collection: ACTIVITIES_COLLECTION, id })
    },

    async setActivityType(value: string, domain: Domain, key: CryptoKey): Promise<void> {
      // Key on `domain:value` so the same type name can live in two domains.
      await store.save({
        collection: ACTIVITY_TYPES_COLLECTION,
        id: `${domain}:${value}`,
        record: { value, domain },
        key,
      })
    },

    async listActivityTypes(key: CryptoKey): Promise<ActivityType[]> {
      const entries = await store.list({ collection: ACTIVITY_TYPES_COLLECTION, key })
      return entries.map((e) => e.value as unknown as ActivityType)
    },

    async destroy(): Promise<void> {
      await store.destroy()
    },
  }
}
