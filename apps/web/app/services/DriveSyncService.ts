import type { IDataSyncProvider, DataSubFolder } from '~/adapters/storage/cloud/IDataSyncProvider'
import { getDatabase } from '~/adapters/database/DatabaseManager'
import type { BaseLocalEntity, LocalAnnotation, LocalBook, LocalCanvasItem, LocalDrawingNote, LocalFlashcard, LocalNote, LocalStreak, LocalUserSettings } from '~/adapters/database/types'
import { mutationQueueService } from './MutationQueueService'
import { loadGraphMeta, saveGraphMeta, type GraphMeta } from '~/utils/graphMeta'
import type { GraphEdge } from '~/interfaces/graph'
import type { GraphThemeRecord } from '~/utils/buildLocalGraph'

export interface SyncResult {
  fileName: string
  uploaded: number
  downloaded: number
  conflicts: number
  skipped?: boolean
}

export interface SyncSummary {
  results: SyncResult[]
  syncedAt: string
}

export interface SyncEnvelope<T> {
  schema_version: 1
  entity_type: string
  updated_at: string
  updated_by: string
  content_hash?: string
  payload: T
}

const DEVICE_KEY = 'aresta_drive_sync_device_id'
const ETAG_CACHE_KEY = 'aresta_drive_etag_cache'
const now = () => new Date().toISOString()

const getDeviceId = () => {
  if (typeof localStorage === 'undefined') return 'server'
  const existing = localStorage.getItem(DEVICE_KEY)
  if (existing) return existing
  const id = crypto.randomUUID ? crypto.randomUUID() : `dev_${Date.now()}`
  try {
    localStorage.setItem(DEVICE_KEY, id)
  } catch {}
  return id
}

const getETagCache = (): Record<string, string> => {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(ETAG_CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const setETagCache = (key: string, hash: string) => {
  if (typeof localStorage === 'undefined') return
  try {
    const cache = getETagCache()
    cache[key] = hash
    localStorage.setItem(ETAG_CACHE_KEY, JSON.stringify(cache))
  } catch {}
}

const computeHash = (data: unknown): string => {
  const str = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36)
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 400
): Promise<T> {
  let attempt = 0
  while (true) {
    attempt++
    try {
      return await fn()
    } catch (err: any) {
      if (attempt >= maxAttempts) throw err
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 100
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

export class DriveSyncService {
  private inFlight: Promise<SyncSummary> | null = null
  private readonly deviceId = getDeviceId()

  constructor(private readonly provider: IDataSyncProvider) {}

  private envelope<T>(entityType: string, payload: T): SyncEnvelope<T> {
    const hash = computeHash(payload)
    return {
      schema_version: 1,
      entity_type: entityType,
      updated_at: now(),
      updated_by: this.deviceId,
      content_hash: hash,
      payload
    }
  }

  private newer<T extends BaseLocalEntity>(local: T, remote: T): T {
    const localTs = local.updated_at || ''
    const remoteTs = remote.updated_at || ''
    const timestampCmp = localTs.localeCompare(remoteTs)
    if (timestampCmp !== 0) return timestampCmp > 0 ? local : remote
    const localDevice = (local as T & { updated_by?: string }).updated_by || ''
    const remoteDevice = (remote as T & { updated_by?: string }).updated_by || ''
    return localDevice >= remoteDevice ? local : remote
  }

  private async syncCollection<T extends BaseLocalEntity>(
    fileName: string,
    entityType: string,
    getLocal: () => Promise<T[]>,
    saveLocal: (item: T) => Promise<void>,
    deleteLocal: (id: any) => Promise<void>
  ): Promise<SyncResult> {
    const local = await getLocal()
    const remote = await withRetry(() => this.provider.downloadDataFile<SyncEnvelope<T[]>>(fileName))
    
    const byId = new Map<string | number, T>()
    local.forEach((item) => byId.set(item.id, item))

    let downloaded = 0
    let conflicts = 0

    if (remote?.payload && Array.isArray(remote.payload)) {
      for (const remoteItem of remote.payload) {
        const current = byId.get(remoteItem.id)
        if (!current) {
          if (remoteItem.deleted_at) {
            // Se já veio como tombstone e não existe local, preserva no payload remoto
            byId.set(remoteItem.id, remoteItem)
            continue
          }
          byId.set(remoteItem.id, remoteItem)
          await saveLocal({ ...remoteItem, sync_status: 'synced' })
          downloaded++
          continue
        }

        const winner = this.newer(current, remoteItem)
        byId.set(winner.id, winner)
        if (winner.deleted_at) {
          await deleteLocal(winner.id)
        } else {
          await saveLocal({ ...winner, sync_status: 'synced' })
        }
        if (winner !== current) {
          downloaded++
          conflicts++
        } else if (winner !== remoteItem) {
          conflicts++
        }
      }
    } else {
      // Nenhum arquivo remoto ainda, certifique-se de limpar local se current tiver tombstone
      for (const item of local) {
        if (item.deleted_at) {
          await deleteLocal(item.id)
        }
      }
    }

    const merged = [...byId.values()]
    const mergedHash = computeHash(merged)
    const cachedHash = getETagCache()[fileName]

    if (cachedHash === mergedHash && remote?.content_hash === mergedHash) {
      return { fileName, uploaded: 0, downloaded, conflicts, skipped: true }
    }

    const env = this.envelope(entityType, merged)
    await withRetry(() => this.provider.uploadDataFile(fileName, env))
    setETagCache(fileName, mergedHash)

    return { fileName, uploaded: merged.length, downloaded, conflicts }
  }

  private async syncItems<T extends BaseLocalEntity>(
    subFolder: DataSubFolder,
    entityType: string,
    getLocal: () => Promise<T[]>,
    saveLocal: (item: T) => Promise<void>,
    deleteLocal: (id: any) => Promise<void>
  ): Promise<SyncResult> {
    const local = await getLocal()
    const remoteFiles = await withRetry(() => this.provider.listSubFolderFiles(subFolder))
    const byId = new Map<string | number, T>(local.map((item) => [item.id, item]))
    
    let downloaded = 0
    let conflicts = 0

    for (const fileName of remoteFiles) {
      const remote = await withRetry(() => this.provider.downloadSubFolderDataFile<SyncEnvelope<T>>(subFolder, fileName))
      if (!remote?.payload) continue

      const current = byId.get(remote.payload.id)
      if (!current) {
        if (remote.payload.deleted_at) continue
        byId.set(remote.payload.id, remote.payload)
        await saveLocal({ ...remote.payload, sync_status: 'synced' })
        downloaded++
        continue
      }

      const winner = this.newer(current, remote.payload)
      if (winner !== current) {
        byId.set(remote.payload.id, winner)
        if (winner.deleted_at) {
          await deleteLocal(winner.id)
        } else {
          await saveLocal({ ...winner, sync_status: 'synced' })
        }
        downloaded++
        conflicts++
      }
    }

    let uploaded = 0
    for (const item of byId.values()) {
      const itemKey = `${subFolder}/${item.id}.json`
      const itemHash = computeHash(item)
      const cachedHash = getETagCache()[itemKey]

      if (cachedHash === itemHash && item.sync_status === 'synced') {
        continue
      }

      const env = this.envelope(entityType, item)
      await withRetry(() => this.provider.uploadSubFolderDataFile(subFolder, `${item.id}.json`, env))
      setETagCache(itemKey, itemHash)
      uploaded++
    }

    return { fileName: `${subFolder}/*`, uploaded, downloaded, conflicts }
  }

  async syncAnnotations(): Promise<SyncResult> {
    const db = getDatabase()
    return this.syncCollection<LocalAnnotation>(
      'annotations.json',
      'annotation',
      () => db.getAnnotations(),
      (item) => db.saveAnnotation(item),
      (id) => db.deleteAnnotation(id)
    )
  }

  async syncFlashcards(): Promise<SyncResult> {
    const db = getDatabase()
    return this.syncCollection<LocalFlashcard>(
      'flashcards.json',
      'flashcard',
      () => db.getFlashcards(),
      (item) => db.saveFlashcard(item),
      (id) => db.deleteFlashcard(id)
    )
  }

  async syncCanvas(): Promise<SyncResult> {
    const db = getDatabase()
    return this.syncItems<LocalCanvasItem>(
      'canvas',
      'canvas',
      () => db.getCanvases(),
      (item) => db.saveCanvas(item),
      (id) => db.deleteCanvas(id)
    )
  }

  async syncNotes(): Promise<SyncResult> {
    const db = getDatabase()
    return this.syncItems<LocalNote>(
      'notes',
      'note',
      () => db.getNotes(),
      (item) => db.saveNote(item),
      (id) => db.deleteNote(id)
    )
  }

  async syncDrawingNotes(): Promise<SyncResult> {
    const db = getDatabase()
    return this.syncItems<LocalDrawingNote>(
      'drawing_notes',
      'drawing_note',
      () => db.getDrawingNotes(),
      (item) => db.saveDrawingNote(item),
      (id) => db.deleteDrawingNote(id)
    )
  }

  async syncProfile(): Promise<SyncResult> {
    const db = getDatabase()
    const local = { settings: await db.getSettings(), streak: await db.getStreak() }
    const remote = await withRetry(() => this.provider.downloadDataFile<SyncEnvelope<typeof local>>('profile.json'))
    
    let downloaded = 0
    let conflicts = 0

    if (remote?.payload) {
      if (remote.payload.settings) {
        if (!local.settings || remote.payload.settings.updated_at > local.settings.updated_at) {
          await db.saveSettings({ ...remote.payload.settings, sync_status: 'synced' } as LocalUserSettings)
          downloaded++
        }
      }
      if (remote.payload.streak) {
        if (!local.streak || remote.payload.streak.updated_at > local.streak.updated_at) {
          await db.saveStreak({ ...remote.payload.streak, sync_status: 'synced' } as LocalStreak)
          downloaded++
        }
      }
    }

    const merged = { settings: await db.getSettings(), streak: await db.getStreak() }
    const profileHash = computeHash(merged)
    const cachedHash = getETagCache()['profile.json']

    if (cachedHash !== profileHash) {
      const env = this.envelope('profile', merged)
      await withRetry(() => this.provider.uploadDataFile('profile.json', env))
      setETagCache('profile.json', profileHash)
    }

    return { fileName: 'profile.json', uploaded: 1, downloaded, conflicts }
  }

  async syncLibrary(): Promise<SyncResult> {
    const db = getDatabase()
    const local = await db.getBooks()
    const fileName = 'library.json'
    const remote = await withRetry(() => this.provider.downloadDataFile<SyncEnvelope<LocalBook[]>>(fileName))

    const byId = new Map<string | number, LocalBook>()
    const byTitle = new Map<string, LocalBook>()
    local.forEach((item) => {
      byId.set(item.id, item)
      if (item.title) byTitle.set(item.title.trim().toLowerCase(), item)
    })

    let downloaded = 0
    let conflicts = 0

    if (remote?.payload && Array.isArray(remote.payload)) {
      for (const remoteItem of remote.payload) {
        const normTitle = (remoteItem.title || '').trim().toLowerCase()
        const current = byId.get(remoteItem.id) || (normTitle ? byTitle.get(normTitle) : undefined)

        if (!current) {
          if (remoteItem.deleted_at) {
            byId.set(remoteItem.id, remoteItem)
            continue
          }
          byId.set(remoteItem.id, remoteItem)
          if (normTitle) byTitle.set(normTitle, remoteItem)
          await db.saveBook({ ...remoteItem, sync_status: 'synced' })
          downloaded++
          continue
        }

        const winner = this.newer(current, remoteItem)
        const targetToSave: LocalBook = {
          ...winner,
          id: current.id,
          bookId: current.bookId || current.id,
          sync_status: 'synced',
        }
        byId.set(current.id, targetToSave)

        if (winner.deleted_at) {
          await db.deleteBook(current.id)
        } else {
          await db.saveBook(targetToSave)
        }

        if (winner !== current) {
          downloaded++
          conflicts++
        } else if (winner !== remoteItem) {
          conflicts++
        }
      }
    } else {
      for (const item of local) {
        if (item.deleted_at) {
          await db.deleteBook(item.id)
        }
      }
    }

    const merged = [...byId.values()]
    const mergedHash = computeHash(merged)
    const cachedHash = getETagCache()[fileName]

    if (cachedHash === mergedHash && remote?.content_hash === mergedHash) {
      return { fileName, uploaded: 0, downloaded, conflicts, skipped: true }
    }

    const env = this.envelope('book', merged)
    await withRetry(() => this.provider.uploadDataFile(fileName, env))
    setETagCache(fileName, mergedHash)

    return { fileName, uploaded: merged.length, downloaded, conflicts }
  }

  async syncGraphMeta(): Promise<SyncResult> {
    const fileName = 'graph_meta.json'
    const local = loadGraphMeta()
    const remote = await withRetry(() => this.provider.downloadDataFile<SyncEnvelope<GraphMeta>>(fileName))

    let downloaded = 0
    let conflicts = 0

    const themesMap = new Map<string | number, GraphThemeRecord>()
    const themesByName = new Map<string, GraphThemeRecord>()
    local.themes.forEach((t) => {
      themesMap.set(t.id, t)
      const norm = (t.name || '').trim().toLowerCase()
      if (norm) themesByName.set(norm, t)
    })

    if (remote?.payload?.themes && Array.isArray(remote.payload.themes)) {
      for (const remoteTheme of remote.payload.themes) {
        const norm = (remoteTheme.name || '').trim().toLowerCase()
        const current = themesMap.get(remoteTheme.id) || (norm ? themesByName.get(norm) : undefined)
        if (!current) {
          themesMap.set(remoteTheme.id, remoteTheme)
          if (norm) themesByName.set(norm, remoteTheme)
          downloaded++
        } else {
          const mergedTheme: GraphThemeRecord = {
            id: current.id,
            name: current.name || remoteTheme.name,
            color: current.color || remoteTheme.color || '#E57B55',
            description: current.description || remoteTheme.description || '',
          }
          themesMap.set(current.id, mergedTheme)
        }
      }
    }

    const edgesMap = new Map<string, GraphEdge>()
    const edgeKey = (e: GraphEdge) => `${String(e.source)}---${String(e.target)}`
    const reverseKey = (e: GraphEdge) => `${String(e.target)}---${String(e.source)}`

    local.edges.forEach((e) => {
      edgesMap.set(edgeKey(e), e)
    })

    if (remote?.payload?.edges && Array.isArray(remote.payload.edges)) {
      for (const remoteEdge of remote.payload.edges) {
        const k = edgeKey(remoteEdge)
        const rk = reverseKey(remoteEdge)
        if (!edgesMap.has(k) && !edgesMap.has(rk)) {
          edgesMap.set(k, remoteEdge)
          downloaded++
        }
      }
    }

    const mergedMeta: GraphMeta = {
      themes: Array.from(themesMap.values()),
      edges: Array.from(edgesMap.values()),
    }

    saveGraphMeta(mergedMeta)

    const metaHash = computeHash(mergedMeta)
    const cachedHash = getETagCache()[fileName]

    if (cachedHash === metaHash && remote?.content_hash === metaHash) {
      return { fileName, uploaded: 0, downloaded, conflicts, skipped: true }
    }

    const env = this.envelope('graph_meta', mergedMeta)
    await withRetry(() => this.provider.uploadDataFile(fileName, env))
    setETagCache(fileName, metaHash)

    return { fileName, uploaded: mergedMeta.themes.length, downloaded, conflicts }
  }

  async fullSync(): Promise<SyncSummary> {
    if (this.inFlight) return this.inFlight
    this.inFlight = (async () => {
      await withRetry(() => this.provider.ensureDataFolders())
      const results = await Promise.all([
        this.syncProfile(),
        this.syncLibrary(),
        this.syncGraphMeta(),
        this.syncAnnotations(),
        this.syncFlashcards(),
        this.syncCanvas(),
        this.syncNotes(),
        this.syncDrawingNotes(),
      ])
      const pending = await mutationQueueService.getPending()
      if (pending.length) {
        await mutationQueueService.markSynced(pending.map((item) => item.id))
      }
      return { results, syncedAt: now() }
    })()

    try {
      return await this.inFlight
    } finally {
      this.inFlight = null
    }
  }

  async syncCanvases(): Promise<SyncResult> {
    return this.syncCanvas()
  }

  async syncAll(): Promise<{
    success: boolean
    provider: string
    syncedAt: string
    stats: Record<string, { uploaded: number; downloaded: number; conflicts: number }>
  }> {
    const summary = await this.fullSync()
    const getStat = (name: string) => {
      const res = summary.results.find((r) => r.fileName.toLowerCase().includes(name.toLowerCase()))
      return res ? { uploaded: res.uploaded, downloaded: res.downloaded, conflicts: res.conflicts } : { uploaded: 0, downloaded: 0, conflicts: 0 }
    }
    return {
      success: true,
      provider: this.provider.providerName,
      syncedAt: summary.syncedAt,
      stats: {
        books: getStat('library'),
        themes: getStat('graph_meta'),
        canvases: getStat('canvas'),
        notes: getStat('note'),
        drawingNotes: getStat('drawing'),
        annotations: getStat('annotation'),
        flashcards: getStat('flashcard'),
        streak: getStat('profile'),
        settings: getStat('profile'),
      },
    }
  }

  async initialPull(): Promise<SyncSummary> {
    return this.fullSync()
  }
}
