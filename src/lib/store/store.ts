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

export interface EncryptedStore {
  save(args: SaveArgs): Promise<void>
  load(args: LoadArgs): Promise<JsonValue | undefined>
  delete(args: DeleteArgs): Promise<void>
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

    async destroy(): Promise<void> {
      db.close()
    },
  }
}

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
    request.onsuccess = () => resolve(request.result)
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
