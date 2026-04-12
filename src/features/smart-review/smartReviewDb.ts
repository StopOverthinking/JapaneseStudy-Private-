import {
  clearLegacySmartReviewStorage,
  hasSmartReviewStorageMigrationMarker,
  loadLegacySmartReviewProfiles,
  markSmartReviewStorageMigrated,
} from '@/features/smart-review/smartReviewStorage'
import type { SmartReviewProfileMap, SmartReviewScheduleRecord } from '@/features/smart-review/smartReviewTypes'

const SMART_REVIEW_DB_NAME = 'japanese-study'
const SMART_REVIEW_DB_VERSION = 1
const SMART_REVIEW_STORE_NAME = 'smartReviewSchedule'
const DUE_AT_INDEX = 'dueAt'
const UPDATED_AT_INDEX = 'updatedAt'

let dbPromise: Promise<IDBDatabase> | null = null
let migrationPromise: Promise<void> | null = null

function ensureIndexedDb() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    throw new Error('IndexedDB is not available in this environment.')
  }

  return window.indexedDB
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'))
  })
}

function transactionToPromise(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction was aborted.'))
  })
}

function mapRecords(records: SmartReviewScheduleRecord[]): SmartReviewProfileMap {
  return Object.fromEntries(records.map((record) => [record.wordId, record]))
}

export async function openSmartReviewDb() {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = ensureIndexedDb().open(SMART_REVIEW_DB_NAME, SMART_REVIEW_DB_VERSION)

      request.onupgradeneeded = () => {
        const database = request.result
        const store = database.objectStoreNames.contains(SMART_REVIEW_STORE_NAME)
          ? request.transaction?.objectStore(SMART_REVIEW_STORE_NAME)
          : database.createObjectStore(SMART_REVIEW_STORE_NAME, { keyPath: 'wordId' })

        if (!store) {
          throw new Error('Failed to initialize smart review store.')
        }

        if (!store.indexNames.contains(DUE_AT_INDEX)) {
          store.createIndex(DUE_AT_INDEX, 'dueAt')
        }

        if (!store.indexNames.contains(UPDATED_AT_INDEX)) {
          store.createIndex(UPDATED_AT_INDEX, 'updatedAt')
        }
      }

      request.onsuccess = () => {
        const database = request.result
        database.onversionchange = () => {
          database.close()
          dbPromise = null
        }
        resolve(database)
      }
      request.onerror = () => reject(request.error ?? new Error('Failed to open smart review database.'))
    })
  }

  return dbPromise
}

export async function getAllSmartReviewScheduleRecords() {
  const database = await openSmartReviewDb()
  const transaction = database.transaction(SMART_REVIEW_STORE_NAME, 'readonly')
  const store = transaction.objectStore(SMART_REVIEW_STORE_NAME)
  const records = await requestToPromise(store.getAll() as IDBRequest<SmartReviewScheduleRecord[]>)
  await transactionToPromise(transaction)
  return records
}

export async function getSmartReviewProfileMap() {
  return mapRecords(await getAllSmartReviewScheduleRecords())
}

export async function getDueSmartReviewScheduleRecords(now = new Date()) {
  const database = await openSmartReviewDb()
  const transaction = database.transaction(SMART_REVIEW_STORE_NAME, 'readonly')
  const store = transaction.objectStore(SMART_REVIEW_STORE_NAME)
  const index = store.index(DUE_AT_INDEX)
  const records = await requestToPromise(
    index.getAll(IDBKeyRange.upperBound(now.toISOString())) as IDBRequest<SmartReviewScheduleRecord[]>,
  )
  await transactionToPromise(transaction)
  return records.filter((record) => record.dueAt !== null)
}

export async function bulkPutSmartReviewScheduleRecords(records: SmartReviewScheduleRecord[]) {
  if (records.length === 0) return

  const database = await openSmartReviewDb()
  const transaction = database.transaction(SMART_REVIEW_STORE_NAME, 'readwrite')
  const store = transaction.objectStore(SMART_REVIEW_STORE_NAME)

  for (const record of records) {
    store.put(record)
  }

  await transactionToPromise(transaction)
}

export async function replaceSmartReviewScheduleRecords(records: SmartReviewScheduleRecord[]) {
  const database = await openSmartReviewDb()
  const transaction = database.transaction(SMART_REVIEW_STORE_NAME, 'readwrite')
  const store = transaction.objectStore(SMART_REVIEW_STORE_NAME)

  store.clear()
  for (const record of records) {
    store.put(record)
  }

  await transactionToPromise(transaction)
}

export async function clearSmartReviewScheduleRecords() {
  const database = await openSmartReviewDb()
  const transaction = database.transaction(SMART_REVIEW_STORE_NAME, 'readwrite')
  transaction.objectStore(SMART_REVIEW_STORE_NAME).clear()
  await transactionToPromise(transaction)
}

export async function migrateLegacySmartReviewStorage() {
  if (migrationPromise) {
    return migrationPromise
  }

  migrationPromise = (async () => {
    await openSmartReviewDb()

    if (!hasSmartReviewStorageMigrationMarker()) {
      const legacyProfiles = Object.values(loadLegacySmartReviewProfiles()).filter((record) => record.wordId.length > 0)

      if (legacyProfiles.length > 0) {
        await bulkPutSmartReviewScheduleRecords(legacyProfiles)
      }

      markSmartReviewStorageMigrated()
    }

    clearLegacySmartReviewStorage()
  })()

  try {
    await migrationPromise
  } finally {
    migrationPromise = null
  }
}

export async function initializeSmartReviewDb() {
  await migrateLegacySmartReviewStorage()
  return getSmartReviewProfileMap()
}
