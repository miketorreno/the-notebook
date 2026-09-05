import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { openActivityStore, type ActivityStore } from './activity-store'
import { buildActivity } from './activity'
import { deriveKey, generateSalt } from '../crypto/crypto'

const DB = 'test-activity-store'

async function testKey(phrase: string): Promise<CryptoKey> {
  return deriveKey(phrase, generateSalt())
}

describe('activity store', () => {
  let store: ActivityStore

  beforeEach(async () => {
    store = await openActivityStore(DB)
  })

  afterEach(async () => {
    await store.destroy()
    indexedDB.deleteDatabase(DB)
  })

  describe('logActivity / listActivities', () => {
    it('logs an activity and lists it back', async () => {
      const key = await testKey('activity key')
      const activity = buildActivity({
        domain: 'Health',
        type: 'meditation',
        difficulty: 'Easy',
        notes: '10 min',
      })

      await store.logActivity(activity, key)
      const all = await store.listActivities(key)

      expect(all).toHaveLength(1)
      expect(all[0]).toEqual(activity)
    })

    it('returns activities sorted newest first', async () => {
      const key = await testKey('activity key')
      const older = buildActivity({
        domain: 'Health', type: 'run', difficulty: 'Medium',
        now: new Date('2026-09-01T08:00:00Z'),
      })
      const newer = buildActivity({
        domain: 'Learning', type: 'reading', difficulty: 'Easy',
        now: new Date('2026-09-03T08:00:00Z'),
      })

      await store.logActivity(older, key)
      await store.logActivity(newer, key)

      const all = await store.listActivities(key)
      expect(all.map((a) => a.id)).toEqual([newer.id, older.id])
    })

    it('logs one-tap from just a domain/type/difficulty', async () => {
      const key = await testKey('activity key')
      const activity = buildActivity({
        domain: 'Productivity',
        type: 'deep work',
        difficulty: 'Hard',
      })

      await store.logActivity(activity, key)

      const loaded = await store.getActivity(activity.id, key)
      expect(loaded).toEqual(activity)
    })
  })

  describe('deleteActivity', () => {
    it('removes a logged activity', async () => {
      const key = await testKey('activity key')
      const activity = buildActivity({ domain: 'Health', type: 'run', difficulty: 'Medium' })
      await store.logActivity(activity, key)

      await store.deleteActivity(activity.id)

      const all = await store.listActivities(key)
      expect(all).toEqual([])
      expect(await store.getActivity(activity.id, key)).toBeUndefined()
    })
  })

  describe('data is stored encrypted', () => {
    it('does not store the plaintext activity at rest', async () => {
      const key = await testKey('activity key')
      const activity = buildActivity({
        domain: 'Health',
        type: 'private-habit',
        difficulty: 'Medium',
        notes: 'sensitive detail',
      })
      await store.logActivity(activity, key)

      const db = await openRawDb(DB)
      const raw = await new Promise<unknown>((resolve, reject) => {
        const tx = db.transaction('activities', 'readonly')
        const req = tx.objectStore('activities').get(activity.id)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
      db.close()

      expect(JSON.stringify(raw)).not.toContain('private-habit')
      expect(JSON.stringify(raw)).not.toContain('sensitive detail')
    })
  })

  describe('custom activity types', () => {
    it('creates and lists a custom type within a domain', async () => {
      const key = await testKey('activity key')
      await store.setActivityType('yoga', 'Health', key)

      const types = await store.listActivityTypes(key)
      expect(types).toContainEqual({ value: 'yoga', domain: 'Health' })
    })

    it('lists custom types across domains', async () => {
      const key = await testKey('activity key')
      await store.setActivityType('yoga', 'Health', key)
      await store.setActivityType('chess', 'Learning', key)

      const types = await store.listActivityTypes(key)
      expect(types).toContainEqual({ value: 'yoga', domain: 'Health' })
      expect(types).toContainEqual({ value: 'chess', domain: 'Learning' })
    })

    it('keeps same-named custom types distinct across domains', async () => {
      const key = await testKey('activity key')
      await store.setActivityType('Focus', 'Learning', key)
      await store.setActivityType('Focus', 'Productivity', key)

      const types = await store.listActivityTypes(key)
      expect(types).toContainEqual({ value: 'Focus', domain: 'Learning' })
      expect(types).toContainEqual({ value: 'Focus', domain: 'Productivity' })
    })
  })
})

function openRawDb(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
