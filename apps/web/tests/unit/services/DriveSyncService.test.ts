import { describe, expect, it, beforeEach } from 'vitest'
import { InMemoryAdapter } from '~/adapters/database/InMemoryAdapter'
import { dbManager } from '~/adapters/database/DatabaseManager'
import { DriveSyncService, mergeStreaks } from '~/services/DriveSyncService'
import type { IDataSyncProvider, DataSubFolder } from '~/adapters/storage/cloud/IDataSyncProvider'

function createMockProvider(overrides: Partial<IDataSyncProvider> = {}): IDataSyncProvider {
  return {
    providerName: 'google-drive',
    ensureDataFolders: async () => {},
    ensureFolder: async () => ({ id: 'f-id', name: 'folder' }),
    uploadFile: async () => ({ id: 'file-id', name: 'file' }),
    getFile: async () => new Blob([]),
    listFolder: async () => [],
    uploadBookPackage: async () => ({
      rootFolderId: 'root',
      bookFolderId: 'book',
      bookFile: { id: 'bf', name: 'book' },
    }),
    uploadDataFile: async (_fileName: string, _data: unknown) => ({
      fileName: _fileName,
      itemCount: 0,
      syncedAt: new Date().toISOString(),
    }),
    uploadSubFolderDataFile: async (_subFolder: DataSubFolder, _fileName: string, _data: unknown) => ({
      fileName: _fileName,
      itemCount: 0,
      syncedAt: new Date().toISOString(),
    }),
    downloadDataFile: async <T>(_fileName: string): Promise<T | null> => null,
    downloadSubFolderDataFile: async <T>(_subFolder: DataSubFolder, _fileName: string): Promise<T | null> => null,
    listSubFolderFiles: async (_subFolder: DataSubFolder) => [],
    deleteDataFile: async (_fileName: string) => {},
    deleteSubFolderDataFile: async (_subFolder: DataSubFolder, _fileName: string) => {},
    ...overrides,
  }
}

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
    const provider = createMockProvider({
      providerName: 'google-drive',
      downloadDataFile: async <T>() => ({
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
      } as unknown as T),
      uploadDataFile: async (_name: string, data: unknown) => {
        uploadedPayload = data
        return { fileName: 'annotations.json', itemCount: 1, syncedAt: '2026-01-02T00:00:00.000Z' }
      },
    })

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
    const provider = createMockProvider({
      providerName: 'onedrive',
      downloadDataFile: async <T>() => ({
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
      } as unknown as T),
      uploadDataFile: async (_name: string, data: unknown) => {
        uploadedPayload = data
        return { fileName: 'annotations.json', itemCount: 1, syncedAt: '2026-01-05T00:00:00.000Z' }
      },
    })

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
    const provider = createMockProvider({
      providerName: 'icloud-folder',
      downloadDataFile: async <T>() => ({
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
      } as unknown as T),
      uploadDataFile: async (_name: string, data: unknown) => {
        uploadedPayload = data
        return { fileName: 'flashcards.json', itemCount: 1, syncedAt: '2026-01-10T00:00:00.000Z' }
      },
    })

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
    const provider = createMockProvider({
      uploadSubFolderDataFile: async (subFolder, fileName, data) => {
        subFolderUploads.push({ subFolder, fileName, data })
        return { fileName, itemCount: 1, syncedAt: new Date().toISOString() }
      },
    })

    const service = new DriveSyncService(provider)
    await service.syncCanvas()

    expect(subFolderUploads.length).toBe(1)
    expect(subFolderUploads[0]?.subFolder).toBe('canvas')
    expect(subFolderUploads[0]?.fileName).toBe('canvas-uuid-1.json')
    expect(subFolderUploads[0]?.data?.payload?.name).toBe('Quadro Local')
  })

  it('5. Executa fullSync integrando todas as coleções de dados', async () => {
    const provider = createMockProvider({
      uploadDataFile: async (fileName) => ({ fileName, itemCount: 0, syncedAt: new Date().toISOString() }),
      uploadSubFolderDataFile: async (_sf, fileName) => ({ fileName, itemCount: 0, syncedAt: new Date().toISOString() }),
    })

    const service = new DriveSyncService(provider)
    const result = await service.fullSync()

    expect(result.results.length).toBe(9)
    expect(result.results.some((r) => r.fileName === 'journal.json')).toBe(true)
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
    const provider = createMockProvider({
      downloadDataFile: async <T>() => ({
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
      } as unknown as T),
      uploadDataFile: async (_name: string, data: unknown) => {
        uploadedPayload = data
        return { fileName: 'library.json', itemCount: 2, syncedAt: new Date().toISOString() }
      },
    })

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
    const provider = createMockProvider({
      downloadDataFile: async <T>() => ({
        schema_version: 1,
        entity_type: 'graph_meta',
        updated_at: '2026-01-02T00:00:00.000Z',
        updated_by: 'remote_device',
        payload: {
          themes: [{ id: 2, name: 'Programação', color: '#10B981' }],
          edges: [{ id: 'edge-2', source: 'theme-2', target: 'book-2', type: 'theme-hierarchy' }],
        },
      } as unknown as T),
      uploadDataFile: async (_name: string, data: unknown) => {
        uploadedPayload = data
        return { fileName: 'graph_meta.json', itemCount: 2, syncedAt: new Date().toISOString() }
      },
    })

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
    await db.saveNote({
      id: 'note-tombstone-1',
      title: 'Nota para Deletar',
      content: 'Conteúdo',
      updated_at: '2026-01-01T00:00:00.000Z',
      sync_status: 'synced',
    })

    await db.deleteNote('note-tombstone-1')

    const subFolderUploads: Array<{ subFolder: DataSubFolder; fileName: string; data: any }> = []
    const provider = createMockProvider({
      listSubFolderFiles: async () => ['note-tombstone-1.json'],
      downloadSubFolderDataFile: async <T>() => ({
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
      } as unknown as T),
      uploadSubFolderDataFile: async (subFolder, fileName, data) => {
        subFolderUploads.push({ subFolder, fileName, data })
        return { fileName, itemCount: 1, syncedAt: new Date().toISOString() }
      },
    })

    const service = new DriveSyncService(provider)
    await service.syncNotes()

    const activeNotes = await db.getNotes()
    expect(activeNotes.find((n) => n.id === 'note-tombstone-1')).toBeUndefined()

    const rawNotes = await db.getNotesRaw()
    const tombstonedNote = rawNotes.find((n) => n.id === 'note-tombstone-1')
    expect(tombstonedNote?.deleted_at).toBeDefined()

    expect(subFolderUploads.length).toBe(1)
    expect(subFolderUploads[0]?.data?.payload?.deleted_at).toBeDefined()
  })

  it('9. Não ressuscita anotação deletada localmente quando Google Drive tem versão anterior sem tombstone', async () => {
    await db.saveAnnotation({
      id: 99,
      bookId: 10,
      cfi: 'epubcfi(/6/2)',
      createdAt: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      sync_status: 'synced',
      note: 'Anotação teste',
    })

    await db.deleteAnnotation(99)

    let uploadedPayload: any = null
    const provider = createMockProvider({
      downloadDataFile: async <T>() => ({
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
      } as unknown as T),
      uploadDataFile: async (_name: string, data: unknown) => {
        uploadedPayload = data
        return { fileName: 'annotations.json', itemCount: 1, syncedAt: new Date().toISOString() }
      },
    })

    const service = new DriveSyncService(provider)
    await service.syncAnnotations()

    const activeAnnotations = await db.getAnnotations()
    expect(activeAnnotations.find((a) => a.id === 99)).toBeUndefined()

    const uploadedAnn = uploadedPayload?.payload?.find((a: any) => a.id === 99)
    expect(uploadedAnn?.deleted_at).toBeDefined()
  })

  it('10. Aplica tombstone remoto mais recente em subpastas e apaga quadro localmente', async () => {
    await db.saveCanvas({
      id: 'canvas-del-1',
      name: 'Quadro a Deletar',
      document: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
      updated_at: '2026-01-01T00:00:00.000Z',
      sync_status: 'synced',
    })

    const provider = createMockProvider({
      listSubFolderFiles: async () => ['canvas-del-1.json'],
      downloadSubFolderDataFile: async <T>() => ({
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
      } as unknown as T),
    })

    const service = new DriveSyncService(provider)
    await service.syncCanvas()

    const activeCanvases = await db.getCanvases()
    expect(activeCanvases.find((c) => c.id === 'canvas-del-1')).toBeUndefined()

    const rawCanvases = await db.getCanvasesRaw()
    const rawItem = rawCanvases.find((c) => c.id === 'canvas-del-1')
    expect(rawItem?.deleted_at).toBeDefined()
  })

  it('11. Preserva coverPath, author e temas remotos quando o registro local for um placeholder recente sem capa', async () => {
    // Simula registro local criado como placeholder recente por listDriveBooks (timestamp mais recente, mas sem capa)
    await db.saveBook({
      id: 101,
      bookId: 101,
      title: 'Dom Casmurro',
      author: 'Google Drive',
      coverPath: null,
      filePath: 'drive:folder_dom_casmurro',
      status: 'QUERO_LER',
      currentPage: 0,
      updated_at: '2026-09-23T20:00:00.000Z',
      sync_status: 'pending',
      themes: [],
    })

    let uploadedPayload: any = null
    const provider = createMockProvider({
      downloadDataFile: async <T>() => ({
        schema_version: 1,
        entity_type: 'book',
        updated_at: '2026-09-20T10:00:00.000Z',
        updated_by: 'original_device',
        payload: [
          {
            id: 101,
            bookId: 101,
            title: 'Dom Casmurro',
            author: 'Machado de Assis',
            coverPath: 'data:image/webp;base64,UklGRm4AAABXRUJQVlA4...',
            filePath: '101.epub',
            status: 'LENDO',
            currentPage: 25,
            updated_at: '2026-09-20T10:00:00.000Z',
            sync_status: 'synced',
            themes: [{ id: 5, name: 'Literatura Brasileira', color: '#10B981' }],
          },
        ],
      } as unknown as T),
      uploadDataFile: async (_name: string, data: unknown) => {
        uploadedPayload = data
        return { fileName: 'library.json', itemCount: 1, syncedAt: new Date().toISOString() }
      },
    })

    const service = new DriveSyncService(provider)
    await service.syncLibrary()

    const savedBook = await db.getBookById(101)
    expect(savedBook).toBeDefined()
    expect(savedBook?.coverPath).toBe('data:image/webp;base64,UklGRm4AAABXRUJQVlA4...')
    expect(savedBook?.author).toBe('Machado de Assis')
    expect(savedBook?.themes?.length).toBe(1)
    expect(savedBook?.themes?.[0]?.name).toBe('Literatura Brasileira')

    const uploadedBook = uploadedPayload?.payload?.find((b: any) => b.id === 101)
    expect(uploadedBook?.coverPath).toBe('data:image/webp;base64,UklGRm4AAABXRUJQVlA4...')
    expect(uploadedBook?.author).toBe('Machado de Assis')
  })

  it('12. Preserva coverPath local se o registro remoto não possuir capa', async () => {
    await db.saveBook({
      id: 202,
      bookId: 202,
      title: 'O Alienista',
      author: 'Machado de Assis',
      coverPath: 'data:image/webp;base64,LOCAL_COVER_DATA...',
      filePath: '202.epub',
      status: 'LENDO',
      currentPage: 10,
      updated_at: '2026-09-20T10:00:00.000Z',
      sync_status: 'synced',
      themes: [],
    })

    const provider = createMockProvider({
      downloadDataFile: async <T>() => ({
        schema_version: 1,
        entity_type: 'book',
        updated_at: '2026-09-23T15:00:00.000Z',
        updated_by: 'other_device',
        payload: [
          {
            id: 202,
            bookId: 202,
            title: 'O Alienista',
            author: 'Machado de Assis',
            coverPath: null,
            filePath: 'drive:folder_alienista',
            status: 'LENDO',
            currentPage: 40,
            updated_at: '2026-09-23T15:00:00.000Z',
            sync_status: 'synced',
            themes: [],
          },
        ],
      } as unknown as T),
    })

    const service = new DriveSyncService(provider)
    await service.syncLibrary()

    const savedBook = await db.getBookById(202)
    expect(savedBook?.coverPath).toBe('data:image/webp;base64,LOCAL_COVER_DATA...')
    expect(savedBook?.currentPage).toBe(40)
  })

  it('13. syncJournal sincroniza diário sequencial (journal.json) com LWW', async () => {
    // Entrada local de ontem (local mais recente)
    await db.saveJournalEntry({
      id: '2026-09-25',
      date: '2026-09-25',
      content: 'Reflexão local mais recente',
      created_at: '2026-09-25T10:00:00.000Z',
      updated_at: '2026-09-25T20:00:00.000Z',
      deleted_at: null,
      sync_status: 'pending',
    })

    // Entrada local de hoje (remoto será mais recente)
    await db.saveJournalEntry({
      id: '2026-09-26',
      date: '2026-09-26',
      content: 'Texto antigo de hoje',
      created_at: '2026-09-26T08:00:00.000Z',
      updated_at: '2026-09-26T08:00:00.000Z',
      deleted_at: null,
      sync_status: 'synced',
    })

    let uploadedPayload: any = null
    const provider = createMockProvider({
      downloadDataFile: async <T>() => ({
        schema_version: 1,
        entity_type: 'journal',
        updated_at: '2026-09-26T12:00:00.000Z',
        updated_by: 'phone_device',
        payload: [
          {
            id: '2026-09-25',
            date: '2026-09-25',
            content: 'Reflexão remota antiga',
            created_at: '2026-09-25T10:00:00.000Z',
            updated_at: '2026-09-25T11:00:00.000Z',
            deleted_at: null,
            sync_status: 'synced',
          },
          {
            id: '2026-09-26',
            date: '2026-09-26',
            content: 'Texto atualizado vindo da nuvem',
            created_at: '2026-09-26T08:00:00.000Z',
            updated_at: '2026-09-26T12:00:00.000Z',
            deleted_at: null,
            sync_status: 'synced',
          },
        ],
      } as unknown as T),
      uploadDataFile: async (_fileName, data) => {
        uploadedPayload = data
        return { fileName: 'journal.json', itemCount: 2, syncedAt: new Date().toISOString() }
      },
    })

    const service = new DriveSyncService(provider)
    const result = await (service as any).syncJournal()

    expect(result.fileName).toBe('journal.json')

    // 2026-09-25 deve manter a versão local mais recente
    const entry25 = await db.getJournalEntryByDate('2026-09-25')
    expect(entry25?.content).toBe('Reflexão local mais recente')

    // 2026-09-26 deve adotar a versão remota mais recente
    const entry26 = await db.getJournalEntryByDate('2026-09-26')
    expect(entry26?.content).toBe('Texto atualizado vindo da nuvem')

    // Payload enviado para o Drive deve conter os 2 dias consolidados
    expect(uploadedPayload?.payload?.length).toBe(2)
  })

  it('14. syncJournal propaga tombstones do diário sem ressuscitar entradas apagadas', async () => {
    // Entrada local apagada com tombstone
    await db.saveJournalEntry({
      id: '2026-09-20',
      date: '2026-09-20',
      content: 'Entrada deletada',
      created_at: '2026-09-20T10:00:00.000Z',
      updated_at: '2026-09-20T15:00:00.000Z',
      deleted_at: '2026-09-20T15:00:00.000Z',
      sync_status: 'pending',
    })

    let uploadedPayload: any = null
    const provider = createMockProvider({
      downloadDataFile: async <T>() => ({
        schema_version: 1,
        entity_type: 'journal',
        updated_at: '2026-09-20T11:00:00.000Z',
        updated_by: 'old_device',
        payload: [
          {
            id: '2026-09-20',
            date: '2026-09-20',
            content: 'Entrada remota anterior (sem tombstone)',
            created_at: '2026-09-20T10:00:00.000Z',
            updated_at: '2026-09-20T11:00:00.000Z',
            deleted_at: null,
            sync_status: 'synced',
          },
        ],
      } as unknown as T),
      uploadDataFile: async (_fileName, data) => {
        uploadedPayload = data
        return { fileName: 'journal.json', itemCount: 1, syncedAt: new Date().toISOString() }
      },
    })

    const service = new DriveSyncService(provider)
    await (service as any).syncJournal()

    const activeEntry = await db.getJournalEntryByDate('2026-09-20')
    expect(activeEntry).toBeNull()

    const uploadedItem = uploadedPayload?.payload?.find((j: any) => j.id === '2026-09-20')
    expect(uploadedItem?.deleted_at).toBe('2026-09-20T15:00:00.000Z')
  })

  it('15. mergeStreaks unifica ofensiva no mesmo dia combinando tempo de leitura e flashcards sem perda', () => {
    const local = {
      id: 'user_streak',
      currentStreak: 4,
      longestStreak: 10,
      streakFreezeCount: 1,
      targetStreakDays: 7,
      isGoalReachedToday: false,
      todayActivity: {
        date: '2026-10-02',
        readingSeconds: 300,
        readingMinutes: 5,
        requiredReadingSeconds: 600,
        flashcardsReviewed: 2,
        requiredFlashcards: 5,
        isReadingCompleted: false,
        isFlashcardsCompleted: false,
        isCompleted: false,
        isFrozen: false,
      },
      weeklyActivity: [
        { date: '2026-10-02', dayLabel: 'S', readingSeconds: 300, readingMinutes: 5, flashcardsReviewed: 2, completed: false, frozen: false }
      ],
      updated_at: '2026-10-02T10:00:00.000Z',
      deleted_at: null,
      sync_status: 'synced' as const,
    }

    const remote = {
      id: 'user_streak',
      currentStreak: 4,
      longestStreak: 10,
      streakFreezeCount: 1,
      targetStreakDays: 7,
      isGoalReachedToday: false,
      todayActivity: {
        date: '2026-10-02',
        readingSeconds: 600, // No outro dispositivo completou a leitura
        readingMinutes: 10,
        requiredReadingSeconds: 600,
        flashcardsReviewed: 1,
        requiredFlashcards: 5,
        isReadingCompleted: true,
        isFlashcardsCompleted: false,
        isCompleted: true,
        isFrozen: false,
      },
      weeklyActivity: [
        { date: '2026-10-02', dayLabel: 'S', readingSeconds: 600, readingMinutes: 10, flashcardsReviewed: 1, completed: true, frozen: false }
      ],
      updated_at: '2026-10-02T11:00:00.000Z',
      deleted_at: null,
      sync_status: 'synced' as const,
    }

    const merged = mergeStreaks(local, remote)
    expect(merged).not.toBeNull()
    expect(merged?.currentStreak).toBe(4)
    expect(merged?.longestStreak).toBe(10)
    expect(merged?.todayActivity.readingSeconds).toBe(600)
    expect(merged?.todayActivity.readingMinutes).toBe(10)
    expect(merged?.todayActivity.flashcardsReviewed).toBe(2)
    expect(merged?.todayActivity.isReadingCompleted).toBe(true)
    expect(merged?.todayActivity.isCompleted).toBe(true)
    expect(merged?.isGoalReachedToday).toBe(true)
  })

  it('16. mergeStreaks preserva ofensiva sem regredir quando um dispositivo cumpriu a meta e outro ainda não', () => {
    const localStale = {
      id: 'user_streak',
      currentStreak: 5,
      longestStreak: 5,
      streakFreezeCount: 0,
      targetStreakDays: 7,
      isGoalReachedToday: false,
      todayActivity: {
        date: '2026-10-02',
        readingSeconds: 0,
        readingMinutes: 0,
        requiredReadingSeconds: 600,
        flashcardsReviewed: 0,
        requiredFlashcards: 5,
        isReadingCompleted: false,
        isFlashcardsCompleted: false,
        isCompleted: false,
        isFrozen: false,
      },
      weeklyActivity: [],
      updated_at: '2026-10-02T12:00:00.000Z',
      deleted_at: null,
      sync_status: 'pending' as const,
    }

    const remoteActive = {
      id: 'user_streak',
      currentStreak: 6,
      longestStreak: 6,
      streakFreezeCount: 0,
      targetStreakDays: 7,
      isGoalReachedToday: true,
      todayActivity: {
        date: '2026-10-02',
        readingSeconds: 650,
        readingMinutes: 10,
        requiredReadingSeconds: 600,
        flashcardsReviewed: 5,
        requiredFlashcards: 5,
        isReadingCompleted: true,
        isFlashcardsCompleted: true,
        isCompleted: true,
        isFrozen: false,
      },
      weeklyActivity: [
        { date: '2026-10-02', dayLabel: 'S', readingSeconds: 650, readingMinutes: 10, flashcardsReviewed: 5, completed: true, frozen: false }
      ],
      updated_at: '2026-10-02T10:00:00.000Z',
      deleted_at: null,
      sync_status: 'synced' as const,
    }

    const merged = mergeStreaks(localStale, remoteActive)
    expect(merged?.currentStreak).toBe(6)
    expect(merged?.longestStreak).toBe(6)
    expect(merged?.isGoalReachedToday).toBe(true)
    expect(merged?.todayActivity.readingSeconds).toBe(650)
  })

  it('17. syncProfile sincroniza profile.json mesclando streak da nuvem com local e atualizando o banco', async () => {
    await db.saveStreak({
      id: 'user_streak',
      currentStreak: 3,
      longestStreak: 5,
      streakFreezeCount: 0,
      targetStreakDays: 7,
      isGoalReachedToday: false,
      todayActivity: {
        date: '2026-10-02',
        readingSeconds: 100,
        readingMinutes: 1,
        requiredReadingSeconds: 600,
        flashcardsReviewed: 0,
        requiredFlashcards: 5,
        isReadingCompleted: false,
        isFlashcardsCompleted: false,
        isCompleted: false,
        isFrozen: false,
      },
      weeklyActivity: [],
      updated_at: '2026-10-02T08:00:00.000Z',
      deleted_at: null,
      sync_status: 'pending',
    })

    let uploadedPayload: any = null
    const provider = createMockProvider({
      downloadDataFile: async <T>() => ({
        schema_version: 1,
        entity_type: 'profile',
        updated_at: '2026-10-02T11:00:00.000Z',
        updated_by: 'phone_device',
        content_hash: 'different_hash',
        payload: {
          settings: null,
          streak: {
            id: 'user_streak',
            currentStreak: 4,
            longestStreak: 6,
            streakFreezeCount: 1,
            targetStreakDays: 14,
            isGoalReachedToday: true,
            todayActivity: {
              date: '2026-10-02',
              readingSeconds: 600,
              readingMinutes: 10,
              requiredReadingSeconds: 600,
              flashcardsReviewed: 3,
              requiredFlashcards: 5,
              isReadingCompleted: true,
              isFlashcardsCompleted: false,
              isCompleted: true,
              isFrozen: false,
            },
            weeklyActivity: [],
            updated_at: '2026-10-02T11:00:00.000Z',
            deleted_at: null,
            sync_status: 'synced',
          }
        },
      } as unknown as T),
      uploadDataFile: async (_fileName, data) => {
        uploadedPayload = data
        return { fileName: 'profile.json', itemCount: 1, syncedAt: new Date().toISOString() }
      },
    })

    const service = new DriveSyncService(provider)
    const result = await service.syncProfile()

    expect(result.fileName).toBe('profile.json')
    expect(result.downloaded).toBe(1)

    const savedInDb = await db.getStreak()
    expect(savedInDb?.currentStreak).toBe(4)
    expect(savedInDb?.longestStreak).toBe(6)
    expect(savedInDb?.isGoalReachedToday).toBe(true)
    expect(savedInDb?.todayActivity.readingSeconds).toBe(600)
    expect(uploadedPayload?.payload?.streak?.currentStreak).toBe(4)
  })

  it('18. syncProfile pula upload redundante se a nuvem já tiver o hash correspondente', async () => {
    await db.saveStreak({
      id: 'user_streak',
      currentStreak: 5,
      longestStreak: 5,
      streakFreezeCount: 0,
      targetStreakDays: 7,
      isGoalReachedToday: true,
      todayActivity: {
        date: '2026-10-02',
        readingSeconds: 600,
        readingMinutes: 10,
        requiredReadingSeconds: 600,
        flashcardsReviewed: 5,
        requiredFlashcards: 5,
        isReadingCompleted: true,
        isFlashcardsCompleted: true,
        isCompleted: true,
        isFrozen: false,
      },
      weeklyActivity: [],
      updated_at: '2026-10-02T10:00:00.000Z',
      deleted_at: null,
      sync_status: 'synced',
    })

    const streakInDb = await db.getStreak()
    const settingsInDb = await db.getSettings()
    const profileData = { settings: settingsInDb, streak: streakInDb }

    let str = JSON.stringify(profileData)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i)
      hash |= 0
    }
    const matchingHash = hash.toString(36)

    let uploadCalled = false
    const provider = createMockProvider({
      downloadDataFile: async <T>() => ({
        schema_version: 1,
        entity_type: 'profile',
        updated_at: '2026-10-02T10:00:00.000Z',
        updated_by: 'same_device',
        content_hash: matchingHash,
        payload: profileData,
      } as unknown as T),
      uploadDataFile: async () => {
        uploadCalled = true
        return { fileName: 'profile.json', itemCount: 1, syncedAt: new Date().toISOString() }
      },
    })

    localStorage.setItem('aresta_drive_etag_cache', JSON.stringify({ 'profile.json': matchingHash }))

    const service = new DriveSyncService(provider)
    const result = await service.syncProfile()

    expect(result.skipped).toBe(true)
    expect(uploadCalled).toBe(false)
  })

  it('19. graph_meta propaga tombstones de tema e aresta sem ressuscitar itens excluídos', async () => {
    localStorage.setItem(
      'aresta_graph_meta',
      JSON.stringify({
        version: 2,
        themes: [
          { id: 1, name: 'Filosofia', updated_at: 1000, deleted_at: 2000, updated_by: 'local' }
        ],
        edges: [
          { id: 'book-1---theme-1', source: 'theme-1', target: 'book-1', updated_at: 1000, deleted_at: 2000, updated_by: 'local' }
        ],
        updated_at: 2000,
      })
    )

    let uploadedPayload: any = null
    const provider = createMockProvider({
      downloadDataFile: async <T>() => ({
        schema_version: 1,
        entity_type: 'graph_meta',
        updated_at: '2026-01-01T00:00:00.000Z',
        updated_by: 'old_device',
        payload: {
          version: 2,
          themes: [
            { id: 1, name: 'Filosofia', updated_at: 1000, deleted_at: null, updated_by: 'old_device' }
          ],
          edges: [
            { id: 'book-1---theme-1', source: 'theme-1', target: 'book-1', updated_at: 1000, deleted_at: null, updated_by: 'old_device' }
          ],
        },
      } as unknown as T),
      uploadDataFile: async (_name: string, data: unknown) => {
        uploadedPayload = data
        return { fileName: 'graph_meta.json', itemCount: 1, syncedAt: new Date().toISOString() }
      },
    })

    const service = new DriveSyncService(provider)
    await service.syncGraphMeta()

    const saved = JSON.parse(localStorage.getItem('aresta_graph_meta') || '{}')
    expect(saved.themes[0]?.deleted_at).toBe(2000)
    expect(saved.edges[0]?.deleted_at).toBe(2000)
    expect(uploadedPayload?.payload?.themes?.[0]?.deleted_at).toBe(2000)
    expect(uploadedPayload?.payload?.edges?.[0]?.deleted_at).toBe(2000)
  })

  it('20. graph_meta aplica LWW ao atualizar nome e cor de temas entre dispositivos', async () => {
    localStorage.setItem(
      'aresta_graph_meta',
      JSON.stringify({
        version: 2,
        themes: [
          { id: 1, name: 'Nome Antigo', color: '#111111', updated_at: 1000, deleted_at: null, updated_by: 'local' }
        ],
        edges: [],
        updated_at: 1000,
      })
    )

    const provider = createMockProvider({
      downloadDataFile: async <T>() => ({
        schema_version: 1,
        entity_type: 'graph_meta',
        updated_at: '2026-01-02T00:00:00.000Z',
        updated_by: 'phone',
        payload: {
          version: 2,
          themes: [
            { id: 1, name: 'Nome Novo Remoto', color: '#FF0000', updated_at: 5000, deleted_at: null, updated_by: 'phone' }
          ],
          edges: [],
        },
      } as unknown as T),
      uploadDataFile: async () => ({ fileName: 'graph_meta.json', itemCount: 1, syncedAt: new Date().toISOString() }),
    })

    const service = new DriveSyncService(provider)
    await service.syncGraphMeta()

    const saved = JSON.parse(localStorage.getItem('aresta_graph_meta') || '{}')
    expect(saved.themes[0]?.name).toBe('Nome Novo Remoto')
    expect(saved.themes[0]?.color).toBe('#FF0000')
    expect(saved.themes[0]?.updated_at).toBe(5000)
  })

  it('21. syncLibrary preserva remoção de todos os temas do livro sem ressuscitar temas remotos (themes: [])', async () => {
    await db.saveBook({
      id: 500,
      bookId: 500,
      title: 'Livro sem Temas',
      updated_at: '2026-01-05T00:00:00.000Z', // local mais recente
      sync_status: 'pending',
      themes: [], // Usuário removeu todos os temas
    })

    let uploadedPayload: any = null
    const provider = createMockProvider({
      downloadDataFile: async <T>() => ({
        schema_version: 1,
        entity_type: 'book',
        updated_at: '2026-01-01T00:00:00.000Z',
        updated_by: 'remote',
        payload: [
          {
            id: 500,
            bookId: 500,
            title: 'Livro sem Temas',
            updated_at: '2026-01-01T00:00:00.000Z',
            sync_status: 'synced',
            themes: [{ id: 1, name: 'Tema Antigo' }],
          },
        ],
      } as unknown as T),
      uploadDataFile: async (_name: string, data: unknown) => {
        uploadedPayload = data
        return { fileName: 'library.json', itemCount: 1, syncedAt: new Date().toISOString() }
      },
    })

    const service = new DriveSyncService(provider)
    await service.syncLibrary()

    const savedInDb = await db.getBookById(500)
    expect(savedInDb?.themes).toEqual([])
    const uploadedBook = uploadedPayload?.payload?.find((b: any) => b.id === 500)
    expect(uploadedBook?.themes).toEqual([])
  })
})
