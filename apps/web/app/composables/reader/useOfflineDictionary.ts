import { ref, computed } from 'vue'
import { useLemmatizer, cleanWord } from './useLemmatizer'

export interface DictionaryDefinition {
  meaning: string
  example?: string
  synonyms?: string[]
}

export interface DictionaryEntry {
  word: string
  phonetic?: string
  pos: string[]
  translations?: string[]
  definitions: DictionaryDefinition[]
  matchedLemma?: string
}

export interface DictionaryPackage {
  version: string
  sourceLang: string
  targetLang: string
  entries: Record<string, Omit<DictionaryEntry, 'matchedLemma'>>
}

const DB_NAME = 'aresta_dictionary_db'
const DB_VERSION = 1
const STORE_ENTRIES = 'dictionary_entries'
const STORE_META = 'installed_dictionaries'

// Cache em memória para acesso síncrono instantâneo
const memoryCache = new Map<string, DictionaryEntry>()
const loadingPromises = new Map<string, Promise<boolean>>()
const installedPairs = ref<string[]>([])
const isDownloading = ref(false)

function getPairKey(sourceLang: string, targetLang: string): string {
  const s = (sourceLang.split('-')[0] ?? sourceLang).toLowerCase()
  const t = (targetLang.split('-')[0] ?? targetLang).toLowerCase()
  return `${s}-${t}`
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB não suportado neste ambiente'))
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase
      if (!db.objectStoreNames.contains(STORE_ENTRIES)) {
        // Chave composta: 'pair:word' (ex: 'en-pt:manuscript')
        db.createObjectStore(STORE_ENTRIES)
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'pair' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function useOfflineDictionary() {
  const lemmatizer = useLemmatizer()

  /**
   * Salva um pacote completo de dicionário no IndexedDB
   */
  async function savePackageToDB(pair: string, pkg: DictionaryPackage): Promise<void> {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ENTRIES, STORE_META], 'readwrite')
      const entriesStore = tx.objectStore(STORE_ENTRIES)
      const metaStore = tx.objectStore(STORE_META)

      // Grava cada verbete no store
      for (const [wordKey, entry] of Object.entries(pkg.entries)) {
        const normalizedKey = cleanWord(wordKey)
        const storageKey = `${pair}:${normalizedKey}`
        entriesStore.put(entry, storageKey)
        memoryCache.set(storageKey, { ...entry, word: normalizedKey })
      }

      // Grava metadados
      metaStore.put({
        pair,
        version: pkg.version,
        sourceLang: pkg.sourceLang,
        targetLang: pkg.targetLang,
        entriesCount: Object.keys(pkg.entries).length,
        downloadedAt: new Date().toISOString(),
      })

      tx.oncomplete = () => {
        if (!installedPairs.value.includes(pair)) {
          installedPairs.value.push(pair)
        }
        resolve()
      }
      tx.onerror = () => reject(tx.error)
    })
  }

  /**
   * Carrega um verbete diretamente do IndexedDB ou Cache
   */
  async function getEntryFromDB(pair: string, word: string): Promise<DictionaryEntry | null> {
    const normalized = cleanWord(word)
    const storageKey = `${pair}:${normalized}`

    if (memoryCache.has(storageKey)) {
      return memoryCache.get(storageKey) || null
    }

    try {
      const db = await openDB()
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_ENTRIES, 'readonly')
        const store = tx.objectStore(STORE_ENTRIES)
        const req = store.get(storageKey)

        req.onsuccess = () => {
          if (req.result) {
            memoryCache.set(storageKey, req.result)
            resolve(req.result)
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

  /**
   * Garante que o pacote de dicionário para o par de línguas esteja baixado no IndexedDB
   */
  async function ensureDictionaryInstalled(sourceLang: string, targetLang: string): Promise<boolean> {
    const pair = getPairKey(sourceLang, targetLang)

    if (installedPairs.value.includes(pair)) {
      return true
    }

    if (loadingPromises.has(pair)) {
      return loadingPromises.get(pair)!
    }

    const downloadPromise = (async () => {
      isDownloading.value = true
      try {
        // Tenta verificar se já está no IndexedDB
        const db = await openDB()
        const isInstalled = await new Promise<boolean>((resolve) => {
          const tx = db.transaction(STORE_META, 'readonly')
          const store = tx.objectStore(STORE_META)
          const req = store.get(pair)
          req.onsuccess = () => resolve(!!req.result)
          req.onerror = () => resolve(false)
        })

        if (isInstalled) {
          if (!installedPairs.value.includes(pair)) {
            installedPairs.value.push(pair)
          }
          return true
        }

        // Caso não esteja instalado, faz o fetch do arquivo JSON em public/dictionaries
        const fileName = `dict-${pair}.json`
        const url = `/dictionaries/${fileName}`
        const res = await fetch(url)
        if (!res.ok) {
          console.warn(`[Dictionary] Pacote não encontrado no servidor: ${url}`)
          return false
        }

        const data: DictionaryPackage = await res.json()
        await savePackageToDB(pair, data)
        return true
      } catch (err) {
        console.error(`[Dictionary] Erro ao carregar dicionário ${pair}:`, err)
        return false
      } finally {
        isDownloading.value = false
        loadingPromises.delete(pair)
      }
    })()

    loadingPromises.set(pair, downloadPromise)
    return downloadPromise
  }

  /**
   * Consulta uma palavra com lematização inteligente offline
   */
  async function lookup(
    rawWord: string,
    sourceLang: string = 'en',
    targetLang: string = 'pt',
  ): Promise<DictionaryEntry | null> {
    if (!rawWord) return null

    const pair = getPairKey(sourceLang, targetLang)
    await ensureDictionaryInstalled(sourceLang, targetLang)

    const candidates = lemmatizer.getCandidateLemmas(rawWord, sourceLang)

    for (const candidate of candidates) {
      const entry = await getEntryFromDB(pair, candidate)
      if (entry) {
        return {
          ...entry,
          matchedLemma: candidate !== cleanWord(rawWord) ? candidate : undefined,
        }
      }
    }

    // Se a língua de destino for a mesma da fonte e não achar, tenta fallback monolíngue
    const monoPair = getPairKey(sourceLang, sourceLang)
    if (monoPair !== pair) {
      await ensureDictionaryInstalled(sourceLang, sourceLang)
      for (const candidate of candidates) {
        const monoEntry = await getEntryFromDB(monoPair, candidate)
        if (monoEntry) {
          return {
            ...monoEntry,
            matchedLemma: candidate !== cleanWord(rawWord) ? candidate : undefined,
          }
        }
      }
    }

    return null
  }

  /**
   * Retorna os pares de idiomas suportados no momento
   */
  const availablePairs = computed(() => [
    { source: 'en', target: 'pt', label: 'Inglês → Português' },
    { source: 'es', target: 'pt', label: 'Espanhol → Português' },
    { source: 'pt', target: 'pt', label: 'Português (Definições)' },
    { source: 'en', target: 'en', label: 'Inglês (Definições)' },
    { source: 'es', target: 'es', label: 'Espanhol (Definições)' },
    { source: 'pt', target: 'en', label: 'Português → Inglês' },
  ])

  return {
    lookup,
    ensureDictionaryInstalled,
    savePackageToDB,
    availablePairs,
    installedPairs,
    isDownloading,
  }
}

