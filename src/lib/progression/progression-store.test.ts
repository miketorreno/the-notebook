import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildActivity, openActivityStore } from '../activity'
import { deriveKey, generateSalt } from '../crypto/crypto'
import { openProgressionStore, type ProgressionStore } from './progression-store'

const DB = 'test-progression-store'

function testKey(phrase = 'progression test key'): Promise<CryptoKey> {
  return deriveKey(phrase, generateSalt())
}

function easyActivity() {
  return buildActivity({
    domain: 'Health',
    type: 'Exercise',
    difficulty: 'Easy',
  })
}

describe('progression store', () => {
  let store: ProgressionStore

  beforeEach(async () => {
    store = await openProgressionStore(DB)
  })

  afterEach(async () => {
    await store.destroy()
    indexedDB.deleteDatabase(DB)
  })

  it('reports a fresh progression for a new player', async () => {
    const info = await store.get(await testKey())

    expect(info).toEqual({
      level: 1,
      totalXp: 0,
      xpIntoLevel: 0,
      xpToNextLevel: 100,
      tier: null,
      cumulativeCompletions: 0,
    })
  })

  it('accumulates XP and completions as activities are recorded', async () => {
    const key = await testKey()
    await store.recordActivity(
      buildActivity({ domain: 'Health', type: 'Exercise', difficulty: 'Easy' }),
      key,
    )
    await store.recordActivity(
      buildActivity({ domain: 'Learning', type: 'Reading', difficulty: 'Medium' }),
      key,
    )

    const info = await store.get(key)
    expect(info.cumulativeCompletions).toBe(2)
    expect(info.totalXp).toBe(35)
    expect(info.xpIntoLevel).toBe(35)
    expect(info.xpToNextLevel).toBe(100)
  })

  it('signals a level-up exactly when the curve threshold is crossed', async () => {
    const key = await testKey()

    for (let i = 0; i < 9; i++) {
      const event = await store.recordActivity(easyActivity(), key)
      expect(event.leveledUp).toBe(false)
    }

    const tenth = await store.recordActivity(easyActivity(), key)
    expect(tenth.leveledUp).toBe(true)
    expect(tenth.previous.level).toBe(1)
    expect(tenth.progression.level).toBe(2)
    expect(tenth.progression.xpIntoLevel).toBe(0)
  })

  it('persists progression across a reopened store', async () => {
    const key = await testKey()
    await store.recordActivity(easyActivity(), key)
    await store.recordActivity(easyActivity(), key)
    await store.destroy()

    const reopened = await openProgressionStore(DB)
    const info = await reopened.get(key)
    expect(info.totalXp).toBe(20)
    expect(info.cumulativeCompletions).toBe(2)
    await reopened.destroy()
  })

  it('backfills progression from activities logged before progression existed', async () => {
    const key = await testKey()
    const activities = await openActivityStore(DB)
    await activities.logActivity(
      buildActivity({ domain: 'Learning', type: 'Reading', difficulty: 'Medium' }),
      key,
    )
    await activities.logActivity(
      buildActivity({ domain: 'Productivity', type: 'Deep work', difficulty: 'Hard' }),
      key,
    )
    await activities.destroy()

    const info = await store.get(key)
    expect(info.totalXp).toBe(75)
    expect(info.cumulativeCompletions).toBe(2)
    expect(info.xpIntoLevel).toBe(75)
  })

  it('adds the progression collection to a database created by the activity store', async () => {
    const key = await testKey()
    const db = 'test-progression-upgrade'
    const activities = await openActivityStore(db)
    await activities.logActivity(easyActivity(), key)
    await activities.destroy()

    const upgraded = await openProgressionStore(db)
    const info = await upgraded.get(key)
    expect(info.totalXp).toBe(10)
    expect(info.cumulativeCompletions).toBe(1)

    await upgraded.destroy()
    indexedDB.deleteDatabase(db)
  })

  it('continues accumulating from a backfilled starting point', async () => {
    const key = await testKey()
    const activities = await openActivityStore(DB)
    await activities.logActivity(
      buildActivity({ domain: 'Health', type: 'Exercise', difficulty: 'Hard' }),
      key,
    )
    await activities.destroy()

    const event = await store.recordActivity(easyActivity(), key)
    expect(event.progression.totalXp).toBe(60)
    expect(event.progression.cumulativeCompletions).toBe(2)
  })

  it('keeps cumulative completions when an activity is later deleted', async () => {
    const key = await testKey()
    const seed = await openActivityStore(DB)
    const a = easyActivity()
    const b = easyActivity()
    await seed.logActivity(a, key)
    await seed.logActivity(b, key)
    await seed.destroy()

    let info = await store.get(key)
    expect(info.cumulativeCompletions).toBe(2)

    const remover = await openActivityStore(DB)
    await remover.deleteActivity(a.id)
    await remover.destroy()

    info = await store.get(key)
    expect(info.totalXp).toBe(20)
    expect(info.cumulativeCompletions).toBe(2)
  })
})