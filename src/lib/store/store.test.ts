import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { openStore, type EncryptedStore } from './store'
import { deriveKey, generateSalt } from '../crypto/crypto'

function testKey(phrase: string): Promise<CryptoKey> {
  // Each test uses a fresh salt; keys are only compared within a single test.
  return deriveKey(phrase, generateSalt())
}

function openRawDb(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

describe('encrypted store', () => {
  const collections = ['activities', 'secrets']
  let store: EncryptedStore

  beforeEach(async () => {
    store = await openStore('test-store', collections)
  })

  afterEach(async () => {
    await store.destroy()
    indexedDB.deleteDatabase('test-store')
  })

  it('persists and retrieves a record round-trip', async () => {
    const key = await testKey('store test key')
    const record = { domain: 'Health', type: 'meditation', minutes: 20 }

    await store.save({ collection: 'activities', id: 'a1', record, key })
    const loaded = await store.load({ collection: 'activities', id: 'a1', key })

    expect(loaded).toEqual(record)
  })

  it('returns undefined when loading a record that does not exist', async () => {
    const key = await testKey('store test key')
    const loaded = await store.load({
      collection: 'activities',
      id: 'missing',
      key,
    })
    expect(loaded).toBeUndefined()
  })

  it('stores ciphertext, not plaintext, at rest', async () => {
    const key = await testKey('store test key')
    const secret = 'super-secret-plaintext-value'
    await store.save({ collection: 'secrets', id: 's1', record: { secret }, key })

    // Read the raw row directly from IndexedDB — it must not contain the plaintext.
    const db = await openRawDb('test-store')
    const raw = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction('secrets', 'readonly')
      const req = tx.objectStore('secrets').get('s1')
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    db.close()

    const serialized = JSON.stringify(raw)
    expect(serialized).not.toContain(secret)
  })

  it('fails to retrieve a record with the wrong key', async () => {
    const rightKey = await testKey('right')
    const wrongKey = await testKey('wrong')
    await store.save({ collection: 'secrets', id: 's2', record: { v: 1 }, key: rightKey })

    await expect(
      store.load({ collection: 'secrets', id: 's2', key: wrongKey }),
    ).rejects.toThrow()
  })

  it('overwrites an existing record with the same id', async () => {
    const key = await testKey('store test key')
    await store.save({ collection: 'activities', id: 'a2', record: { n: 1 }, key })
    await store.save({ collection: 'activities', id: 'a2', record: { n: 2 }, key })

    const loaded = await store.load({ collection: 'activities', id: 'a2', key })
    expect(loaded).toEqual({ n: 2 })
  })

  it('deletes a record by id', async () => {
    const key = await testKey('store test key')
    await store.save({ collection: 'activities', id: 'a3', record: { n: 1 }, key })
    await store.delete({ collection: 'activities', id: 'a3' })

    const loaded = await store.load({ collection: 'activities', id: 'a3', key })
    expect(loaded).toBeUndefined()
  })

  it('persists records across store instances (same database)', async () => {
    const key = await testKey('store test key')
    await store.save({ collection: 'activities', id: 'a4', record: { keep: true }, key })

    // Reopen a fresh handle on the same database.
    const reopened = await openStore('test-store', collections)
    const loaded = await reopened.load({ collection: 'activities', id: 'a4', key })
    expect(loaded).toEqual({ keep: true })
    await reopened.destroy()
  })

  it('lists all decrypted records in a collection as id/value pairs', async () => {
    const key = await testKey('store test key')
    await store.save({ collection: 'activities', id: 'a1', record: { n: 1 }, key })
    await store.save({ collection: 'activities', id: 'a2', record: { n: 2 }, key })
    await store.save({ collection: 'activities', id: 'a3', record: { n: 3 }, key })

    const all = await store.list({ collection: 'activities', key })
    const byId = Object.fromEntries(all.map((e) => [e.id, e.value]))
    expect(byId).toEqual({ a1: { n: 1 }, a2: { n: 2 }, a3: { n: 3 } })
  })

  it('lists an empty array for a collection with no records', async () => {
    const key = await testKey('store test key')
    await expect(store.list({ collection: 'secrets', key })).resolves.toEqual([])
  })
})
