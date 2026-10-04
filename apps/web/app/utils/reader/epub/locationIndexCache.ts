import { LOCATION_SIZE } from '../position/readingPosition'

const DB_NAME = 'aresta_locations_cache'
const STORE_NAME = 'epub_locations'
const DB_VERSION = 1

export interface CachedLocationData {
  bookHash: string
  locationSize: number
  charsPerSection: number[]
  updatedAt: string
}

/**
 * Calcula um hash rápido e estável para o livro baseado nos primeiros 64 KB + tamanho total.
 */
export async function computeBookHash(data: ArrayBuffer | Uint8Array): Promise<string> {
  const u8 = data instanceof Uint8Array ? data : new Uint8Array(data)
  const sliceSize = Math.min(65536, u8.byteLength)
  const prefix = u8.subarray(0, sliceSize)

  // Prepara cabeçalho com tamanho total
  const sizeTag = new TextEncoder().encode(`size:${u8.byteLength}:`)
  const combined = new Uint8Array(sizeTag.length + prefix.length)
  combined.set(sizeTag, 0)
  combined.set(prefix, sizeTag.length)

  if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-1', combined)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch {
      // Fallback para hash síncrono
    }
  }

  // Fallback FNV-1a se crypto.subtle não estiver disponível
  let h = 0x811c9dc5
  for (let i = 0; i < combined.length; i++) {
    h ^= combined[i]!
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16) + `-${u8.byteLength}`
}

function openCacheDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB indisponível neste ambiente'))
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'bookHash' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getCachedLocations(bookHash: string): Promise<number[] | null> {
  try {
    const db = await openCacheDb()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(bookHash)
      req.onsuccess = () => {
        const result = req.result as CachedLocationData | undefined
        if (result && result.locationSize === LOCATION_SIZE && Array.isArray(result.charsPerSection)) {
          resolve(result.charsPerSection)
        } else {
          resolve(null)
        }
      }
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function setCachedLocations(
  bookHash: string,
  charsPerSection: number[]
): Promise<void> {
  try {
    const db = await openCacheDb()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const entry: CachedLocationData = {
        bookHash,
        locationSize: LOCATION_SIZE,
        charsPerSection,
        updatedAt: new Date().toISOString()
      }
      store.put(entry)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {
    // Falha silenciosa se IndexedDB estiver indisponível
  }
}
