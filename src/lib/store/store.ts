import {
  decryptRecord,
  encryptRecord,
  type EncryptedRecord,
  type JsonValue,
} from '../crypto/crypto'

interface SaveArgs {
  collection: string
  id: string
  record: JsonValue
  key: CryptoKey
}

interface LoadArgs {
  collection: string
  id: string
  key: CryptoKey
}

interface DeleteArgs {
  collection: string
  id: string
}

interface ListArgs {
  collection: string
  key: CryptoKey
}

export interface StoredEntry {
  id: string
  value: JsonValue
}

export interface EncryptedStore {
  save(args: SaveArgs): Promise<void>
  load(args: LoadArgs): Promise<JsonValue | undefined>
  delete(args: DeleteArgs): Promise<void>
  list(args: ListArgs): Promise<StoredEntry[]>
  destroy(): Promise<void>
}

/**
 * Open (or create) the encrypted local store backed by IndexedDB.
 * `collections` are declared up front and created as object stores on
 * schema upgrade. Records are encrypted with AES-256-GCM before they are
 * written to disk.
 */
export async function openStore(
  dbName: string,
  collections: string[] = [],
): Promise<EncryptedStore> {
  const db = await openDatabase(dbName, collections)
  return {
    async save({ collection, id, record, key }: SaveArgs): Promise<void> {
      const encrypted = await encryptRecord(key, record)
      await withStore(db, collection, 'readwrite', (objectStore) => {
        objectStore.put(encrypted, id)
      })
    },

    async load({ collection, id, key }: LoadArgs): Promise<JsonValue | undefined> {
      const encrypted = await withStore(
        db,
        collection,
        'readonly',
        (objectStore) =>
          new Promise<unknown>((resolve, reject) => {
            const req = objectStore.get(id)
            req.onsuccess = () => resolve(req.result)
            req.onerror = () => reject(req.error)
          }),
      )
      if (encrypted === undefined) return undefined
      return decryptRecord(key, encrypted as EncryptedRecord)
    },

    async delete({ collection, id }: DeleteArgs): Promise<void> {
      await withStore(db, collection, 'readwrite', (objectStore) => {
        objectStore.delete(id)
      })
    },

    async list({ collection, key }: ListArgs): Promise<StoredEntry[]> {
      const rows = await withStore(
        db,
        collection,
        'readonly',
        (objectStore) =>
          new Promise<{ id: string; record: unknown }[]>((resolve, reject) => {
            const rows: { id: string; record: unknown }[] = []
            const req = objectStore.openCursor()
            req.onsuccess = () => {
              const cursor = req.result
              if (!cursor) {
                resolve(rows)
                return
              }
              rows.push({ id: cursor.key as string, record: cursor.value })
              cursor.continue()
            }
            req.onerror = () => reject(req.error)
          }),
      )
      const entries: StoredEntry[] = []
      for (const row of rows) {
        const value = await decryptRecord(key, row.record as EncryptedRecord)
        entries.push({ id: row.id, value })
      }
      return entries
    },

    async destroy(): Promise<void> {
      db.close()
    },
  }
}

/**
 * Open the database at its current version, creating missing object stores
 * by bumping the schema version once when the caller asks for a collection
 * that does not exist yet. This lets later modules extend a shared vault
 * database regardless of which store opened it first.
 */
function openDatabase(
  dbName: string,
  collections: string[],
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName)
    request.onupgradeneeded = () => {
      const db = request.result
      for (const collection of collections) {
        if (!db.objectStoreNames.contains(collection)) {
          db.createObjectStore(collection)
        }
      }
    }
    request.onsuccess = () => {
      const db = request.result
      const missing = collections.filter(
        (c) => !db.objectStoreNames.contains(c),
      )
      if (missing.length === 0) {
        resolve(db)
        return
      }
      // The caller needs stores this database version does not have yet —
      // close and reopen one version higher to create them.
      db.close()
      const upgrade = indexedDB.open(dbName, db.version + 1)
      upgrade.onupgradeneeded = () => {
        for (const collection of missing) {
          if (!upgrade.result.objectStoreNames.contains(collection)) {
            upgrade.result.createObjectStore(collection)
          }
        }
      }
      upgrade.onsuccess = () => resolve(upgrade.result)
      upgrade.onerror = () => reject(upgrade.error)
      upgrade.onblocked = () => reject(new Error(`Database upgrade blocked: ${dbName}`))
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Run a transaction against a named object store.
 */
function withStore<T>(
  db: IDBDatabase,
  collection: string,
  mode: IDBTransactionMode,
  run: (objectStore: IDBObjectStore) => T,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(collection, mode)
    const objectStore = tx.objectStore(collection)
    let result: T
    try {
      result = run(objectStore)
    } catch (error) {
      tx.abort()
      reject(error)
      return
    }
    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}
