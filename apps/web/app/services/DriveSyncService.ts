import type { IDataSyncProvider, DataSubFolder } from '~/adapters/storage/cloud/IDataSyncProvider'
import { getDatabase } from '~/adapters/database/DatabaseManager'
import type { BaseLocalEntity, LocalAnnotation, LocalCanvasItem, LocalDrawingNote, LocalFlashcard, LocalNote, LocalStreak, LocalUserSettings } from '~/adapters/database/types'
import { mutationQueueService } from './MutationQueueService'

export interface SyncResult { fileName: string; uploaded: number; downloaded: number; conflicts: number }
export interface SyncSummary { results: SyncResult[]; syncedAt: string }
export interface SyncEnvelope<T> { schema_version: 1; entity_type: string; updated_at: string; updated_by: string; payload: T }

const DEVICE_KEY = 'aresta_drive_sync_device_id'
const now = () => new Date().toISOString()
const getDeviceId = () => {
  if (typeof localStorage === 'undefined') return 'server'
  const existing = localStorage.getItem(DEVICE_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(DEVICE_KEY, id)
  return id
}

export class DriveSyncService {
  private inFlight: Promise<SyncSummary> | null = null
  private readonly deviceId = getDeviceId()

  constructor(private readonly provider: IDataSyncProvider) {}

  private envelope<T>(entityType: string, payload: T): SyncEnvelope<T> {
    return { schema_version: 1, entity_type: entityType, updated_at: now(), updated_by: this.deviceId, payload }
  }

  private newer<T extends BaseLocalEntity>(local: T, remote: T): T {
    const timestamp = local.updated_at.localeCompare(remote.updated_at)
    if (timestamp !== 0) return timestamp > 0 ? local : remote
    const localDevice = (local as T & { updated_by?: string }).updated_by || ''
    const remoteDevice = (remote as T & { updated_by?: string }).updated_by || ''
    return localDevice >= remoteDevice ? local : remote
  }

  private async syncCollection<T extends BaseLocalEntity>(
    fileName: string,
    entityType: string,
    getLocal: () => Promise<T[]>,
    saveLocal: (item: T) => Promise<void>,
  ): Promise<SyncResult> {
    const local = await getLocal()
    const remote = await this.provider.downloadDataFile<SyncEnvelope<T[]>>(fileName)
    const byId = new Map<string | number, T>()
    local.forEach((item) => byId.set(item.id, item))
    let downloaded = 0
    let conflicts = 0
    for (const remoteItem of remote?.payload || []) {
      const current = byId.get(remoteItem.id)
      if (!current) { byId.set(remoteItem.id, remoteItem); await saveLocal({ ...remoteItem, sync_status: 'synced' }); downloaded++; continue }
      const winner = this.newer(current, remoteItem)
      if (winner !== current) { byId.set(remoteItem.id, winner); await saveLocal({ ...winner, sync_status: 'synced' }); downloaded++; conflicts++ }
      else if (winner !== remoteItem) conflicts++
    }
    const merged = [...byId.values()]
    await this.provider.uploadDataFile(fileName, this.envelope(entityType, merged))
    return { fileName, uploaded: merged.length, downloaded, conflicts }
  }

  private async syncItems<T extends BaseLocalEntity>(
    subFolder: DataSubFolder,
    entityType: string,
    getLocal: () => Promise<T[]>,
    saveLocal: (item: T) => Promise<void>,
  ): Promise<SyncResult> {
    const local = await getLocal()
    const remoteFiles = await this.provider.listSubFolderFiles(subFolder)
    const byId = new Map<string | number, T>(local.map((item) => [item.id, item]))
    let downloaded = 0; let conflicts = 0
    for (const fileName of remoteFiles) {
      const remote = await this.provider.downloadSubFolderDataFile<SyncEnvelope<T>>(subFolder, fileName)
      if (!remote?.payload) continue
      const current = byId.get(remote.payload.id)
      if (!current || this.newer(current, remote.payload) === remote.payload) {
        if (current) conflicts++
        byId.set(remote.payload.id, remote.payload)
        await saveLocal({ ...remote.payload, sync_status: 'synced' })
        downloaded++
      }
    }
    for (const item of byId.values()) await this.provider.uploadSubFolderDataFile(subFolder, `${item.id}.json`, this.envelope(entityType, item))
    return { fileName: `${subFolder}/*`, uploaded: byId.size, downloaded, conflicts }
  }

  async syncAnnotations() { const db = getDatabase(); return this.syncCollection<LocalAnnotation>('annotations.json', 'annotation', () => db.getAnnotations(), (item) => db.saveAnnotation(item)) }
  async syncFlashcards() { const db = getDatabase(); return this.syncCollection<LocalFlashcard>('flashcards.json', 'flashcard', () => db.getFlashcards(), (item) => db.saveFlashcard(item)) }
  async syncCanvas() { const db = getDatabase(); return this.syncItems<LocalCanvasItem>('canvas', 'canvas', () => db.getCanvases(), (item) => db.saveCanvas(item)) }
  async syncNotes() { const db = getDatabase(); return this.syncItems<LocalNote>('notes', 'note', () => db.getNotes(), (item) => db.saveNote(item)) }
  async syncDrawingNotes() { const db = getDatabase(); return this.syncItems<LocalDrawingNote>('drawing_notes', 'drawing_note', () => db.getDrawingNotes(), (item) => db.saveDrawingNote(item)) }
  async syncProfile() {
    const db = getDatabase()
    const local = { settings: await db.getSettings(), streak: await db.getStreak() }
    const remote = await this.provider.downloadDataFile<SyncEnvelope<typeof local>>('profile.json')
    if (remote?.payload.settings && (!local.settings || remote.payload.settings.updated_at > local.settings.updated_at)) await db.saveSettings({ ...remote.payload.settings, sync_status: 'synced' } as LocalUserSettings)
    if (remote?.payload.streak && (!local.streak || remote.payload.streak.updated_at > local.streak.updated_at)) await db.saveStreak({ ...remote.payload.streak, sync_status: 'synced' } as LocalStreak)
    const merged = { settings: await db.getSettings(), streak: await db.getStreak() }
    await this.provider.uploadDataFile('profile.json', this.envelope('profile', merged))
    return { fileName: 'profile.json', uploaded: 1, downloaded: remote ? 1 : 0, conflicts: 0 }
  }

  async fullSync(): Promise<SyncSummary> {
    if (this.inFlight) return this.inFlight
    this.inFlight = (async () => {
      await this.provider.ensureDataFolders()
      const results = await Promise.all([this.syncProfile(), this.syncAnnotations(), this.syncFlashcards(), this.syncCanvas(), this.syncNotes(), this.syncDrawingNotes()])
      const pending = await mutationQueueService.getPending()
      if (pending.length) await mutationQueueService.markSynced(pending.map((item) => item.id))
      return { results, syncedAt: now() }
    })()
    try { return await this.inFlight } finally { this.inFlight = null }
  }

  async initialPull(): Promise<SyncSummary> { return this.fullSync() }
}
