import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildActivity, openActivityStore } from '../activity'
import { deriveKey, generateSalt } from '../crypto/crypto'
import { openQuestStore, type QuestActivityEvent, type QuestStore } from './quest-store'
import { ENEMIES } from './quest'

const DB = 'test-quest-store'
const PINNED = {
  stepCount: 3,
  random: () => 0,
  archetype: 'warrior' as const,
  now: () => new Date('2025-01-02T12:00:00.000Z'),
}

function testKey(phrase = 'quest store test key'): Promise<CryptoKey> {
  return deriveKey(phrase, generateSalt())
}

function exercise() {
  return buildActivity({ domain: 'Health', type: 'Exercise', difficulty: 'Easy' })
}

function reading() {
  return buildActivity({ domain: 'Learning', type: 'Reading', difficulty: 'Easy' })
}

describe('quest store', () => {
  let store: QuestStore

  beforeEach(async () => {
    store = await openQuestStore(DB, PINNED)
  })

  afterEach(async () => {
    await store.destroy()
    indexedDB.deleteDatabase(DB)
  })

  it('returns no chain before the first is started', async () => {
    expect(await store.getChain(await testKey())).toBeNull()
  })

  it('creates a saga from templates with the first step active', async () => {
    const key = await testKey()
    const chain = await store.startChain(key)

    expect(chain.steps).toHaveLength(3)
    expect(chain.status).toBe('active')
    expect(chain.enemy).toBe(ENEMIES[0])
    expect(chain.steps[0].status).toBe('current')
    expect(chain.steps[1].status).toBe('locked')
    expect(chain.steps[2].status).toBe('locked')
    expect(chain.steps[0].text).toContain('Warrior')
    expect(chain.steps[0].text).toContain('Exercise')
    expect(chain.steps[0].text).toContain(ENEMIES[0])
  })

  it('persists the saga across a reopened store', async () => {
    const key = await testKey()
    const first = await store.startChain(key)
    await store.destroy()

    const reopened = await openQuestStore(DB, PINNED)
    const chain = await reopened.getChain(key)
    expect(chain?.id).toBe(first.id)
    expect(chain?.steps).toHaveLength(3)
    await reopened.destroy()
  })

  it('only advances a quest for matching activities', async () => {
    const key = await testKey()
    await store.startChain(key)

    await store.recordActivity(exercise(), key)
    await store.recordActivity(reading(), key)

    const chain = await store.getChain(key)
    expect(chain?.steps[0].progress).toBe(1)
  })

  it('completes the win state and unlocks the next step', async () => {
    const key = await testKey()
    await store.startChain(key)

    let event = await store.recordActivity(exercise(), key)
    expect(event.completedStepIds).toEqual([])
    event = await store.recordActivity(exercise(), key)

    const chain = await store.getChain(key)!
    expect(event.completedStepIds).toHaveLength(1)
    expect(event.xpEarned).toBe(25)
    expect(chain?.steps[0].status).toBe('completed')
    expect(chain?.steps[0].stars).toBe(1)
    expect(chain?.steps[0].xpEarned).toBe(25)
    expect(chain?.steps[0].completedAt).toBe('2025-01-02T12:00:00.000Z')
    expect(chain?.steps[1].status).toBe('current')
  })

  it('awards stretch-goal XP as completed steps climb star grades', async () => {
    const key = await testKey()
    await store.startChain(key)
    await store.recordActivity(exercise(), key)
    await store.recordActivity(exercise(), key)

    const upgrades: QuestActivityEvent[] = []
    upgrades.push(await store.recordActivity(exercise(), key))
    upgrades.push(await store.recordActivity(exercise(), key))
    upgrades.push(await store.recordActivity(exercise(), key))
    upgrades.push(await store.recordActivity(exercise(), key))

    const chain = await store.getChain(key)!
    expect(chain?.steps[0].stars).toBe(3)
    expect(chain?.steps[0].xpEarned).toBe(100)
    expect(chain?.steps[1].stars).toBe(1)

    const earned = upgrades.reduce((sum, e) => sum + e.xpEarned, 0)
    expect(earned).toBe(25 + 25 + 50)
  })

  it('reports completed and upgraded steps in one event', async () => {
    const key = await testKey()
    await store.startChain(key)
    await store.recordActivity(exercise(), key)
    await store.recordActivity(exercise(), key)
    await store.recordActivity(exercise(), key)
    await store.recordActivity(exercise(), key)
    await store.recordActivity(exercise(), key)
    await store.recordActivity(exercise(), key)
    await store.recordActivity(exercise(), key)
    await store.recordActivity(exercise(), key)
    // The final push completes the last step while maxing a prior one.
    const event = await store.recordActivity(exercise(), key)

    expect(event.completedStepIds).toHaveLength(1)
    expect(event.upgradedStepIds).toHaveLength(1)
    expect(event.xpEarned).toBe(50 + 25)
  })

  it('closes the saga and starts a fresh one on the next activity', async () => {
    const key = await testKey()
    await store.startChain(key)
    await store.recordActivity(exercise(), key)
    await store.recordActivity(exercise(), key)
    await store.recordActivity(exercise(), key)
    await store.recordActivity(exercise(), key)
    await store.recordActivity(exercise(), key)
    await store.recordActivity(exercise(), key)
    await store.recordActivity(exercise(), key)
    await store.recordActivity(exercise(), key)
    await store.recordActivity(exercise(), key)

    const completed = await store.getChain(key)
    expect(completed?.status).toBe('complete')
    expect(completed?.steps.every((s) => s.status === 'completed')).toBe(true)

    const event = await store.recordActivity(exercise(), key)
    expect(event.newChainStarted).toBe(true)
    const fresh = await store.getChain(key)
    expect(fresh?.id).not.toBe(completed?.id)
    expect(fresh?.steps[0].progress).toBe(1)
    expect(fresh?.steps[0].status).toBe('current')
  })

  it('generates a chain on the first recorded activity if none exists', async () => {
    const key = await testKey()
    const event = await store.recordActivity(exercise(), key)

    expect(event.newChainStarted).toBe(true)
    const chain = await store.getChain(key)
    expect(chain?.steps[0].progress).toBe(1)
  })

  it('themes the saga on the player\u2019s most-logged activity type', async () => {
    const key = await testKey()
    const seed = await openActivityStore(DB)
    await seed.logActivity(reading(), key)
    await seed.logActivity(reading(), key)
    await seed.logActivity(reading(), key)
    await seed.logActivity(exercise(), key)
    await seed.destroy()

    const chain = await store.startChain(key)
    for (const step of chain.steps) {
      expect(step.domain).toBe('Learning')
      expect(step.activityType).toBe('Reading')
    }
  })

  it('never advances a locked step before its predecessor completes', async () => {
    const key = await testKey()
    await store.startChain(key)
    await store.recordActivity(exercise(), key)

    const chain = await store.getChain(key)
    expect(chain?.steps[1].progress).toBe(0)
    expect(chain?.steps[2].progress).toBe(0)
  })

  it('adds the quest collection to a database created by the activity store', async () => {
    const key = await testKey()
    const db = 'test-quest-upgrade'
    const activities = await openActivityStore(db)
    await activities.logActivity(exercise(), key)
    await activities.destroy()

    const upgraded = await openQuestStore(db, PINNED)
    const chain = await upgraded.startChain(key)
    expect(chain.steps[0].domain).toBe('Health')
    expect(chain.steps[0].activityType).toBe('Exercise')

    await upgraded.destroy()
    indexedDB.deleteDatabase(db)
  })
})