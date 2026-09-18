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

    expect(result.results.length).toBe(8)
    expect(result.syncedAt).toBeDefined()
  })

  it('6. Sincroniza a biblioteca de livros (library.json) mesclando temas e livros remotos', async () => {
    await db.saveBook({
      id: 101,
      bookId: 101,
      title: 'Livro Local',
      status: 'LENDO',
      currentPage: 12,
      updated_at: '2026-01-01T00:00:00.000Z',
      sync_status: 'pending',
      themes: [{ id: 1, name: 'Filosofia' }],
    })

    let uploadedPayload: any = null
    const provider: IDataSyncProvider = {
      providerName: 'google-drive',
      ensureDataFolders: async () => {},
      downloadDataFile: async () => ({
        schema_version: 1,
        entity_type: 'book',
        updated_at: '2026-01-02T00:00:00.000Z',
        updated_by: 'remote_device',
        payload: [
          {
            id: 202,
            bookId: 202,
            title: 'Livro Remoto da Nuvem',
            status: 'LENDO',
            currentPage: 50,
            updated_at: '2026-01-02T00:00:00.000Z',
            sync_status: 'synced',
            themes: [{ id: 2, name: 'Programação' }],
          },
        ],
      }),
      uploadDataFile: async (_name: string, data: unknown) => {
        uploadedPayload = data
        return { fileName: 'library.json', itemCount: 2, syncedAt: new Date().toISOString() }
      },
      uploadSubFolderDataFile: async () => ({ fileName: '', itemCount: 0, syncedAt: '' }),
      downloadSubFolderDataFile: async () => null,
      listSubFolderFiles: async () => [],
      deleteDataFile: async () => {},
      deleteSubFolderDataFile: async () => {},
    }

    const service = new DriveSyncService(provider)
    await service.syncLibrary()

    const allBooks = await db.getBooks()
    expect(allBooks.length).toBe(2)
    const remoteSaved = allBooks.find((b) => b.title === 'Livro Remoto da Nuvem')
    expect(remoteSaved?.currentPage).toBe(50)
    expect(remoteSaved?.themes?.[0]?.name).toBe('Programação')
    expect(uploadedPayload?.payload?.length).toBe(2)
  })

  it('7. Sincroniza metadados do grafo (graph_meta.json) unificando temas e conexões', async () => {
    localStorage.setItem(
      'aresta_graph_meta',
      JSON.stringify({
        themes: [{ id: 1, name: 'Filosofia', color: '#6366F1' }],
        edges: [{ id: 'edge-1', source: 'theme-1', target: 'book-1', type: 'theme-hierarchy' }],
      })
    )

    let uploadedPayload: any = null
    const provider: IDataSyncProvider = {
      providerName: 'google-drive',
      ensureDataFolders: async () => {},
      downloadDataFile: async () => ({
        schema_version: 1,
        entity_type: 'graph_meta',
        updated_at: '2026-01-02T00:00:00.000Z',
        updated_by: 'remote_device',
        payload: {
          themes: [{ id: 2, name: 'Programação', color: '#10B981' }],
          edges: [{ id: 'edge-2', source: 'theme-2', target: 'book-2', type: 'theme-hierarchy' }],
        },
      }),
      uploadDataFile: async (_name: string, data: unknown) => {
        uploadedPayload = data
        return { fileName: 'graph_meta.json', itemCount: 2, syncedAt: new Date().toISOString() }
      },
      uploadSubFolderDataFile: async () => ({ fileName: '', itemCount: 0, syncedAt: '' }),
      downloadSubFolderDataFile: async () => null,
      listSubFolderFiles: async () => [],
      deleteDataFile: async () => {},
      deleteSubFolderDataFile: async () => {},
    }

    const service = new DriveSyncService(provider)
    await service.syncGraphMeta()

    const savedRaw = localStorage.getItem('aresta_graph_meta')
    const parsed = JSON.parse(savedRaw || '{}')
    expect(parsed.themes.length).toBe(2)
    expect(parsed.themes.some((t: any) => t.name === 'Filosofia')).toBe(true)
    expect(parsed.themes.some((t: any) => t.name === 'Programação')).toBe(true)
    expect(parsed.edges.length).toBe(2)
    expect(uploadedPayload?.payload?.themes?.length).toBe(2)
  })

  it('8. Não ressuscita nota deletada localmente e envia tombstone para o Google Drive', async () => {
    // 1. Cria nota localmente
    await db.saveNote({
      id: 'note-tombstone-1',
      title: 'Nota para Deletar',
      content: 'Conteúdo',
      updated_at: '2026-01-01T00:00:00.000Z',
      sync_status: 'synced',
    })

    // 2. Deleta nota localmente (gerando deleted_at e updated_at mais recentes)
    await db.deleteNote('note-tombstone-1')

    const subFolderUploads: Array<{ subFolder: DataSubFolder; fileName: string; data: any }> = []
    const provider: IDataSyncProvider = {
      providerName: 'google-drive',
      ensureDataFolders: async () => {},
      downloadDataFile: async () => null,
      uploadDataFile: async () => ({ fileName: '', itemCount: 0, syncedAt: '' }),
      // O Drive ainda possui o arquivo antigo da nota (sem deleted_at)
      listSubFolderFiles: async () => ['note-tombstone-1.json'],
      downloadSubFolderDataFile: async () => ({
        schema_version: 1,
        entity_type: 'note',
        updated_at: '2026-01-01T00:00:00.000Z',
        updated_by: 'remote_device',
        payload: {
          id: 'note-tombstone-1',
          title: 'Nota Antiga no Drive',
          content: 'Conteúdo Antigo',
          updated_at: '2026-01-01T00:00:00.000Z',
          sync_status: 'synced',
        },
      }),
      uploadSubFolderDataFile: async (subFolder, fileName, data) => {
        subFolderUploads.push({ subFolder, fileName, data })
        return { fileName, itemCount: 1, syncedAt: new Date().toISOString() }
      },
      deleteDataFile: async () => {},
      deleteSubFolderDataFile: async () => {},
    }

    const service = new DriveSyncService(provider)
    await service.syncNotes()

    // Verifica que a nota NÃO ressuscitou no getNotes()
    const activeNotes = await db.getNotes()
    expect(activeNotes.find((n) => n.id === 'note-tombstone-1')).toBeUndefined()

    // Verifica que o tombstone foi preservado no getNotesRaw()
    const rawNotes = await db.getNotesRaw()
    const tombstonedNote = rawNotes.find((n) => n.id === 'note-tombstone-1')
    expect(tombstonedNote?.deleted_at).toBeDefined()

    // Verifica que o tombstone foi enviado para o Google Drive
    expect(subFolderUploads.length).toBe(1)
    expect(subFolderUploads[0]?.data?.payload?.deleted_at).toBeDefined()
  })

  it('9. Não ressuscita anotação deletada localmente quando Google Drive tem versão anterior sem tombstone', async () => {
    // 1. Salva anotação
    await db.saveAnnotation({
      id: 99,
      bookId: 10,
      cfi: 'epubcfi(/6/2)',
      createdAt: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      sync_status: 'synced',
      note: 'Anotação teste',
    })

    // 2. Deleta localmente
    await db.deleteAnnotation(99)

    let uploadedPayload: any = null
    const provider: IDataSyncProvider = {
      providerName: 'google-drive',
      ensureDataFolders: async () => {},
      // Drive tem arquivo anterior sem deleted_at
      downloadDataFile: async () => ({
        schema_version: 1,
        entity_type: 'annotation',
        updated_at: '2026-01-01T00:00:00.000Z',
        updated_by: 'remote_device',
        payload: [
          {
            id: 99,
            bookId: 10,
            cfi: 'epubcfi(/6/2)',
            createdAt: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
            sync_status: 'synced',
            note: 'Anotação antiga no Drive',
          },
        ],
      }),
      uploadDataFile: async (_name: string, data: unknown) => {
        uploadedPayload = data
        return { fileName: 'annotations.json', itemCount: 1, syncedAt: new Date().toISOString() }
      },
      uploadSubFolderDataFile: async () => ({ fileName: '', itemCount: 0, syncedAt: '' }),
      downloadSubFolderDataFile: async () => null,
      listSubFolderFiles: async () => [],
      deleteDataFile: async () => {},
      deleteSubFolderDataFile: async () => {},
    }

    const service = new DriveSyncService(provider)
    await service.syncAnnotations()

    // Não deve aparecer em getAnnotations()
    const activeAnnotations = await db.getAnnotations()
    expect(activeAnnotations.find((a) => a.id === 99)).toBeUndefined()

    // Deve estar no payload uploaded como tombstone com deleted_at
    const uploadedAnn = uploadedPayload?.payload?.find((a: any) => a.id === 99)
    expect(uploadedAnn?.deleted_at).toBeDefined()
  })

  it('10. Aplica tombstone remoto mais recente em subpastas e apaga quadro localmente', async () => {
    // 1. Quadro existe localmente com timestamp antigo
    await db.saveCanvas({
      id: 'canvas-del-1',
      name: 'Quadro a Deletar',
      document: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
      updated_at: '2026-01-01T00:00:00.000Z',
      sync_status: 'synced',
    })

    const provider: IDataSyncProvider = {
      providerName: 'google-drive',
      ensureDataFolders: async () => {},
      downloadDataFile: async () => null,
      uploadDataFile: async () => ({ fileName: '', itemCount: 0, syncedAt: '' }),
      listSubFolderFiles: async () => ['canvas-del-1.json'],
      // O Drive envia um tombstone mais recente criado em outro dispositivo
      downloadSubFolderDataFile: async () => ({
        schema_version: 1,
        entity_type: 'canvas',
        updated_at: '2026-01-05T00:00:00.000Z',
        updated_by: 'remote_device',
        payload: {
          id: 'canvas-del-1',
          name: 'Quadro a Deletar',
          document: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
          updated_at: '2026-01-05T00:00:00.000Z',
          deleted_at: '2026-01-05T00:00:00.000Z',
          sync_status: 'synced',
        },
      }),
      uploadSubFolderDataFile: async () => ({ fileName: '', itemCount: 0, syncedAt: '' }),
      deleteDataFile: async () => {},
      deleteSubFolderDataFile: async () => {},
    }

    const service = new DriveSyncService(provider)
    await service.syncCanvas()

    // Quadro não pode mais aparecer na listagem ativa
    const activeCanvases = await db.getCanvases()
    expect(activeCanvases.find((c) => c.id === 'canvas-del-1')).toBeUndefined()

    // Quadro deve ter deleted_at gravado no banco local
    const rawCanvases = await db.getCanvasesRaw()
    const rawItem = rawCanvases.find((c) => c.id === 'canvas-del-1')
    expect(rawItem?.deleted_at).toBeDefined()
  })
})
