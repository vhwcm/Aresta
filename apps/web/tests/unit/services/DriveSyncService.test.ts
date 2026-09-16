import { describe, expect, it, vi, beforeEach } from 'vitest'
import { InMemoryAdapter } from '~/adapters/database/InMemoryAdapter'
import { dbManager } from '~/adapters/database/DatabaseManager'
import { DriveSyncService } from '~/services/DriveSyncService'
import type { IDataSyncProvider, DataSubFolder } from '~/adapters/storage/cloud/IDataSyncProvider'

describe('DriveSyncService (Local-First Sync Engine)', () => {
  let db: InMemoryAdapter

  beforeEach(() => {
    db = new InMemoryAdapter()
    dbManager.setAdapter(db)
  })

  it('1. Aplica a entidade remota quando o timestamp remoto for mais recente', async () => {
    await db.saveAnnotation({
      id: 1,
      bookId: 2,
      cfi: 'epubcfi(/6/4)',
      createdAt: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      sync_status: 'synced',
      note: 'local',
    })

    let uploadedPayload: any = null
    const provider: IDataSyncProvider = {
      providerName: 'google-drive',
      ensureDataFolders: async () => {},
      downloadDataFile: async () => ({
        schema_version: 1,
        entity_type: 'annotation',
        updated_at: '2026-01-02T00:00:00.000Z',
        updated_by: 'remote_device',
        payload: [
          {
            id: 1,
            bookId: 2,
            cfi: 'epubcfi(/6/4)',
            createdAt: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-02T00:00:00.000Z',
            sync_status: 'synced',
            note: 'remota mais recente',
          },
        ],
      }),
      uploadDataFile: async (_name: string, data: unknown) => {
        uploadedPayload = data
        return { fileName: 'annotations.json', itemCount: 1, syncedAt: '2026-01-02T00:00:00.000Z' }
      },
      uploadSubFolderDataFile: async () => ({ fileName: '', itemCount: 0, syncedAt: '' }),
      downloadSubFolderDataFile: async () => null,
      listSubFolderFiles: async () => [],
      deleteDataFile: async () => {},
      deleteSubFolderDataFile: async () => {},
    }

    const service = new DriveSyncService(provider)
    await service.syncAnnotations()

    const localSaved = await db.getAnnotationById(1)
    expect(localSaved?.note).toBe('remota mais recente')
    expect(uploadedPayload?.payload?.[0]?.note).toBe('remota mais recente')
  })

  it('2. Preserva a entidade local quando o timestamp local for mais recente (LWW)', async () => {
    await db.saveAnnotation({
      id: 2,
      bookId: 2,
      cfi: 'epubcfi(/6/6)',
      createdAt: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-05T00:00:00.000Z',
      sync_status: 'pending',
      note: 'local mais recente',
    })

    let uploadedPayload: any = null
    const provider: IDataSyncProvider = {
      providerName: 'onedrive',
      ensureDataFolders: async () => {},
      downloadDataFile: async () => ({
        schema_version: 1,
        entity_type: 'annotation',
        updated_at: '2026-01-02T00:00:00.000Z',
        updated_by: 'remote_device',
        payload: [
          {
            id: 2,
            bookId: 2,
            cfi: 'epubcfi(/6/6)',
            createdAt: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-02T00:00:00.000Z',
            sync_status: 'synced',
            note: 'remota antiga',
          },
        ],
      }),
      uploadDataFile: async (_name: string, data: unknown) => {
        uploadedPayload = data
        return { fileName: 'annotations.json', itemCount: 1, syncedAt: '2026-01-05T00:00:00.000Z' }
      },
      uploadSubFolderDataFile: async () => ({ fileName: '', itemCount: 0, syncedAt: '' }),
      downloadSubFolderDataFile: async () => null,
      listSubFolderFiles: async () => [],
      deleteDataFile: async () => {},
      deleteSubFolderDataFile: async () => {},
    }

    const service = new DriveSyncService(provider)
    await service.syncAnnotations()

    const localSaved = await db.getAnnotationById(2)
    expect(localSaved?.note).toBe('local mais recente')
    expect(uploadedPayload?.payload?.[0]?.note).toBe('local mais recente')
  })

  it('3. Aplica tombstone remoto mais recente e remove o item local', async () => {
    await db.saveFlashcard({
      id: 10,
      question: 'Q',
      answer: 'A',
      cardType: 'basic',
      repetitionLevel: 1,
      nextReviewAt: '2026-01-01',
      updated_at: '2026-01-01T00:00:00.000Z',
      deleted_at: null,
      sync_status: 'synced',
    })

    let uploadedPayload: any = null
    const provider: IDataSyncProvider = {
      providerName: 'icloud-folder',
      ensureDataFolders: async () => {},
      downloadDataFile: async () => ({
        schema_version: 1,
        entity_type: 'flashcard',
        updated_at: '2026-01-10T00:00:00.000Z',
        updated_by: 'other_device',
        payload: [
          {
            id: 10,
            question: 'Q',
            answer: 'A',
            cardType: 'basic',
            repetitionLevel: 1,
            nextReviewAt: '2026-01-01',
            updated_at: '2026-01-10T00:00:00.000Z',
            deleted_at: '2026-01-10T00:00:00.000Z',
            sync_status: 'synced',
          },
        ],
      }),
      uploadDataFile: async (_name: string, data: unknown) => {
        uploadedPayload = data
        return { fileName: 'flashcards.json', itemCount: 1, syncedAt: '2026-01-10T00:00:00.000Z' }
      },
      uploadSubFolderDataFile: async () => ({ fileName: '', itemCount: 0, syncedAt: '' }),
      downloadSubFolderDataFile: async () => null,
      listSubFolderFiles: async () => [],
      deleteDataFile: async () => {},
      deleteSubFolderDataFile: async () => {},
    }

    const service = new DriveSyncService(provider)
    await service.syncFlashcards()

    const card = await db.getFlashcardById(10)
    expect(card).toBeNull()
    expect(uploadedPayload?.payload?.[0]?.deleted_at).toBe('2026-01-10T00:00:00.000Z')
  })

  it('4. Sincroniza subpastas de quadros, notas e desenhos individualmente', async () => {
    await db.saveCanvas({
      id: 'canvas-uuid-1',
      name: 'Quadro Local',
      document: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
      updated_at: '2026-01-01T00:00:00.000Z',
      sync_status: 'pending',
    })

    const subFolderUploads: Array<{ subFolder: DataSubFolder; fileName: string; data: any }> = []
    const provider: IDataSyncProvider = {
      providerName: 'google-drive',
      ensureDataFolders: async () => {},
      downloadDataFile: async () => null,
      uploadDataFile: async () => ({ fileName: '', itemCount: 0, syncedAt: '' }),
      listSubFolderFiles: async () => [],
      downloadSubFolderDataFile: async () => null,
      uploadSubFolderDataFile: async (subFolder, fileName, data) => {
        subFolderUploads.push({ subFolder, fileName, data })
        return { fileName, itemCount: 1, syncedAt: new Date().toISOString() }
      },
      deleteDataFile: async () => {},
      deleteSubFolderDataFile: async () => {},
    }

    const service = new DriveSyncService(provider)
    await service.syncCanvas()

    expect(subFolderUploads.length).toBe(1)
    expect(subFolderUploads[0]?.subFolder).toBe('canvas')
    expect(subFolderUploads[0]?.fileName).toBe('canvas-uuid-1.json')
    expect(subFolderUploads[0]?.data?.payload?.name).toBe('Quadro Local')
  })

  it('5. Executa fullSync integrando todas as coleções de dados', async () => {
    const provider: IDataSyncProvider = {
      providerName: 'google-drive',
      ensureDataFolders: async () => {},
      downloadDataFile: async () => null,
      uploadDataFile: async (fileName) => ({ fileName, itemCount: 0, syncedAt: new Date().toISOString() }),
      listSubFolderFiles: async () => [],
      downloadSubFolderDataFile: async () => null,
      uploadSubFolderDataFile: async (_sf, fileName) => ({ fileName, itemCount: 0, syncedAt: new Date().toISOString() }),
      deleteDataFile: async () => {},
      deleteSubFolderDataFile: async () => {},
    }

    const service = new DriveSyncService(provider)
    const result = await service.fullSync()

    expect(result.results.length).toBe(6)
    expect(result.syncedAt).toBeDefined()
  })
})
