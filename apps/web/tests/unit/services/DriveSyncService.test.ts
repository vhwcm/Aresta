import { describe, expect, it } from 'vitest'
import { InMemoryAdapter } from '~/adapters/database/InMemoryAdapter'
import { dbManager } from '~/adapters/database/DatabaseManager'
import { DriveSyncService } from '~/services/DriveSyncService'
import type { IDataSyncProvider } from '~/adapters/storage/cloud/IDataSyncProvider'

describe('DriveSyncService', () => {
  it('aplica a entidade remota mais recente e reenviará a coleção mesclada', async () => {
    const db = new InMemoryAdapter()
    dbManager.setAdapter(db)
    await db.saveAnnotation({
      id: 1, bookId: 2, cfi: 'epubcfi(/6/4)', createdAt: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z', sync_status: 'synced', note: 'local'
    })
    let uploaded: any = null
    const provider = {
      providerName: 'test', ensureDataFolders: async () => {},
      downloadDataFile: async () => ({ schema_version: 1, entity_type: 'annotation', updated_at: '2026-01-02T00:00:00.000Z', updated_by: 'remote', payload: [{ id: 1, bookId: 2, cfi: 'epubcfi(/6/4)', createdAt: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-02T00:00:00.000Z', sync_status: 'synced', note: 'remota' }] }),
      uploadDataFile: async (_name: string, data: unknown) => { uploaded = data; return { fileName: 'annotations.json', itemCount: 1, syncedAt: '2026-01-02T00:00:00.000Z' } },
    } as unknown as IDataSyncProvider

    await new DriveSyncService(provider).syncAnnotations()
    expect((await db.getAnnotationById(1))?.note).toBe('remota')
    expect(uploaded.payload[0].note).toBe('remota')
  })
})
