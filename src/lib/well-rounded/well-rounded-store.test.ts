import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildActivity, openActivityStore, type ActivityStore } from '../activity'
import type { Domain } from '../archetype'
import { deriveKey, generateSalt } from '../crypto/crypto'
import { openWellRoundedStore, type WellRoundedStore } from './well-rounded-store'

const DB = 'test-well-rounded-store'

function testKey(phrase = 'well rounded test key'): Promise<CryptoKey> {
  return deriveKey(phrase, generateSalt())
}

function activityOn(domain: Domain, day: number) {
  return buildActivity({
    domain,
    type: 'Activity',
    difficulty: 'Easy',
    now: new Date(2025, 0, day, 12),
  })
}

const JAN10_ISO = new Date(2025, 0, 10, 12).toISOString()

describe('well-rounded store', () => {
  let store: WellRoundedStore
  let activities: ActivityStore
  const jan10 = () => new Date(2025, 0, 10, 12)

  beforeEach(async () => {
    store = await openWellRoundedStore(DB, { now: jan10 })
    activities = await openActivityStore(DB)
  })

  afterEach(async () => {
    await activities.destroy()
    await store.destroy()
    indexedDB.deleteDatabase(DB)
  })

  it('reports an inactive bonus and no achievement for a fresh player', async () => {
    const key = await testKey()
    const status = await store.getStatus(key)

    expect(status).toEqual({
      active: false,
      multiplier: 1,
      unlocked: false,
    })
  })

  it('stays inactive while only some domains are tracked', async () => {
    const key = await testKey()
    await activities.logActivity(activityOn('Health', 10), key)
    await activities.logActivity(activityOn('Learning', 9), key)

    const status = await store.getStatus(key)
    expect(status.active).toBe(false)
    expect(status.multiplier).toBe(1)
    expect(status.unlocked).toBe(false)
  })

  it('activates the bonus when all three domains are tracked within the window', async () => {
    const key = await testKey()
    await activities.logActivity(activityOn('Health', 10), key)
    await activities.logActivity(activityOn('Learning', 9), key)
    await activities.logActivity(activityOn('Productivity', 8), key)

    const status = await store.getStatus(key)
    expect(status.active).toBe(true)
    expect(status.multiplier).toBe(1.5)
    expect(status.unlocked).toBe(true)
    expect(status.unlockedAt).toBe(JAN10_ISO)
  })

  it('persists the unlock across a reopened store', async () => {
    const key = await testKey()
    await activities.logActivity(activityOn('Health', 10), key)
    await activities.logActivity(activityOn('Learning', 9), key)
    await activities.logActivity(activityOn('Productivity', 8), key)
    await store.getStatus(key)
    await store.destroy()

    const reopened = await openWellRoundedStore(DB, { now: jan10 })
    const status = await reopened.getStatus(key)
    expect(status.active).toBe(true)
    expect(status.unlocked).toBe(true)
    expect(status.unlockedAt).toBe(JAN10_ISO)

    await reopened.destroy()
  })

  it('deactivates when a domain falls out of the window but keeps the achievement', async () => {
    const key = await testKey()
    await activities.logActivity(activityOn('Productivity', 4), key)
    await activities.logActivity(activityOn('Health', 10), key)
    await activities.logActivity(activityOn('Learning', 9), key)
    await store.getStatus(key)
    await store.destroy()

    const later = await openWellRoundedStore(DB, {
      now: () => new Date(2025, 0, 15, 12),
    })
    const status = await later.getStatus(key)
    expect(status.active).toBe(false)
    expect(status.multiplier).toBe(1)
    expect(status.unlocked).toBe(true)

    await later.destroy()
  })

  it('reports a 1x multiplier while the window is missing a domain', async () => {
    const key = await testKey()
    await activities.logActivity(activityOn('Health', 10), key)
    await activities.logActivity(activityOn('Learning', 4), key)

    const status = await store.getStatus(key)
    expect(status.active).toBe(false)
    expect(status.multiplier).toBe(1)
    expect(status.unlocked).toBe(false)
  })
})