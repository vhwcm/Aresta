import { logWarn } from './logger'

import type { SupportedFileType } from '~/interfaces/reader/IValidationResult'

const DB_NAME = 'aresta_book_cache'
const DB_VERSION = 1
const STORE_NAME = 'books'

export interface CachedBookEntry {
  id: string
  title: string
  arrayBuffer: ArrayBuffer
  type: SupportedFileType
  sizeBytes: number
  savedAt: number
}

function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = (err) => {
        logWarn('[BookCache] Erro ao abrir IndexedDB:', err)
        resolve(null)
      }
    } catch (err) {
      logWarn('[BookCache] Exceção ao abrir IndexedDB:', err)
      resolve(null)
    }
  })
}

export async function getCachedBook(key: string | number): Promise<CachedBookEntry | null> {
  const db = await openDB()
  if (!db) return null

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(String(key))

      request.onsuccess = () => {
        resolve(request.result || null)
      }

      request.onerror = () => {
        resolve(null)
      }
    } catch {
      resolve(null)
    }
  })
}

export async function saveCachedBook(
  key: string | number,
  arrayBuffer: ArrayBuffer,
  title: string,
  type: SupportedFileType,
): Promise<boolean> {
  const db = await openDB()
  if (!db) return false

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)

      const entry: CachedBookEntry = {
        id: String(key),
        title,
        arrayBuffer,
        type,
        sizeBytes: arrayBuffer.byteLength,
        savedAt: Date.now(),
      }

      const request = store.put(entry)

      request.onsuccess = () => {
        resolve(true)
      }

      request.onerror = (err) => {
        logWarn('[BookCache] Erro ao salvar no cache:', err)
        resolve(false)
      }
    } catch (err) {
      logWarn('[BookCache] Exceção ao salvar:', err)
      resolve(false)
    }
  })
}

export async function deleteCachedBook(key: string | number): Promise<boolean> {
  const db = await openDB()
  if (!db) return false

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.delete(String(key))

      request.onsuccess = () => resolve(true)
      request.onerror = () => resolve(false)
    } catch {
      resolve(false)
    }
  })
}

