import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useWorkspaceSidebar } from '../../../app/composables/useWorkspaceSidebar'

const mockPush = vi.fn()
const mockRoute = ref({ path: '/', query: {} })

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useRoute: () => mockRoute.value,
}))

const mockCreateCanvas = vi.fn()
const mockCreateNote = vi.fn()
const mockCreateDrawing = vi.fn()
const mockFetchGraph = vi.fn().mockResolvedValue(undefined)

const mockCanvasesList = ref<any[]>([])
const mockNotesList = ref<any[]>([])
const mockDrawingsList = ref<any[]>([])
const mockLinksList = ref<any[]>([])
const mockUserBooks = ref<any[]>([])

vi.mock('~/composables/useCanvas', () => ({
  useCanvas: () => ({
    canvasesList: mockCanvasesList,
    fetchCanvases: vi.fn().mockResolvedValue([]),
    createCanvas: mockCreateCanvas,
  }),
}))

vi.mock('~/composables/useNotes', () => ({
  useNotes: () => ({
    notesList: mockNotesList,
    fetchNotes: vi.fn().mockResolvedValue([]),
    createNote: mockCreateNote,
    deleteNote: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('~/composables/useDrawing', () => ({
  useDrawing: () => ({
    drawingsList: mockDrawingsList,
    fetchDrawings: vi.fn().mockResolvedValue([]),
    createDrawing: mockCreateDrawing,
  }),
}))

vi.mock('~/composables/useLinks', () => ({
  useLinks: () => ({
    linksList: mockLinksList,
    fetchLinks: vi.fn().mockResolvedValue([]),
  }),
}))

vi.mock('~/composables/useUserBooks', () => ({
  useUserBooks: () => ({
    userBooks: mockUserBooks,
    fetchUserBooks: vi.fn().mockResolvedValue([]),
  }),
}))

vi.mock('~/composables/useGraph', () => ({
  useGraph: () => ({
    fetchGraph: mockFetchGraph,
  }),
}))

const mockNoteSave = vi.fn()
const mockNoteGetById = vi.fn()
const mockNoteGetAll = vi.fn().mockResolvedValue([])

vi.mock('~/adapters/database/repositories/NoteRepository', () => ({
  noteRepo: {
    save: (...args: any[]) => mockNoteSave(...args),
    getById: (...args: any[]) => mockNoteGetById(...args),
    getAll: (...args: any[]) => mockNoteGetAll(...args),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('~/adapters/database/repositories/CanvasRepository', () => ({
  canvasRepo: {
    save: vi.fn().mockResolvedValue({}),
    getById: vi.fn().mockResolvedValue(null),
    getAll: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('~/adapters/database/repositories/DrawingNoteRepository', () => ({
  drawingNoteRepo: {
    save: vi.fn().mockResolvedValue({}),
    getById: vi.fn().mockResolvedValue(null),
    getAll: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('~/adapters/database/repositories/LinkRepository', () => ({
  linkRepo: {
    save: vi.fn().mockResolvedValue({}),
    getById: vi.fn().mockResolvedValue(null),
    getAll: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('~/adapters/database/repositories/BookRepository', () => ({
  bookRepo: {
    save: vi.fn().mockResolvedValue({}),
    getById: vi.fn().mockResolvedValue(null),
    getAll: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('~/adapters/database/migrations/folderToTagsMigration', () => ({
  runFolderToTagsMigration: vi.fn().mockResolvedValue({
    notesMigrated: 0,
    canvasesMigrated: 0,
    drawingsMigrated: 0,
    linksMigrated: 0,
    booksMigrated: 0,
  }),
}))

describe('useWorkspaceSidebar composable (Unificação de Tags e Pastas)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.value = { path: '/', query: {} }
    mockCanvasesList.value = []
    mockNotesList.value = []
    mockDrawingsList.value = []
    mockLinksList.value = []
    mockUserBooks.value = []
    const sidebar = useWorkspaceSidebar()
    sidebar.activeFolder.value = null
    sidebar.activeTag.value = null
    sidebar.activeItemId.value = null
    sidebar.viewLayout.value = 'graph'
  })

  it('handleCreateNewCanvas cria novo quadro e redireciona para a rota do canvas', async () => {
    mockCreateCanvas.mockResolvedValueOnce({
      id: 'canvas_12345',
      title: 'Quadro sem título',
    })

    const { handleCreateNewCanvas, activeItemId } = useWorkspaceSidebar()
    const result = await handleCreateNewCanvas()

    expect(mockCreateCanvas).toHaveBeenCalledWith({
      title: 'Quadro sem título',
      folder: undefined,
    })
    expect(activeItemId.value).toBe('canvas-canvas_12345')
    expect(mockPush).toHaveBeenCalledWith('/canvas/canvas_12345')
    expect(result?.id).toBe('canvas_12345')
  })

  it('handleCreateNewCanvas respeita a pasta ativa ao criar o quadro', async () => {
    mockCreateCanvas.mockResolvedValueOnce({
      id: 'canvas_999',
      title: 'Quadro sem título',
      folder: 'Projetos',
    })

    const { handleCreateNewCanvas, activeFolder } = useWorkspaceSidebar()
    activeFolder.value = 'Projetos'

    await handleCreateNewCanvas()

    expect(mockCreateCanvas).toHaveBeenCalledWith({
      title: 'Quadro sem título',
      folder: 'Projetos',
    })
    expect(mockPush).toHaveBeenCalledWith('/canvas/canvas_999')
  })

  it('handleCreateNewNote cria nova nota, ativa o item, define layout note-editor e navega com a query note mesmo estando na raiz', async () => {
    mockCreateNote.mockResolvedValueOnce({
      id: 'note_123',
      title: 'Nota sem título',
    })

    const { handleCreateNewNote, activeItemId, viewLayout } = useWorkspaceSidebar()
    const result = await handleCreateNewNote()

    expect(mockCreateNote).toHaveBeenCalledWith({
      title: 'Nota sem título',
      content: '',
      folder: undefined,
      tags: [],
    })
    expect(activeItemId.value).toBe('note-note_123')
    expect(viewLayout.value).toBe('note-editor')
    expect(mockPush).toHaveBeenCalledWith({ path: '/', query: { note: 'note_123' } })
    expect(result?.id).toBe('note_123')
  })

  it('handleSelectItem com kind note define activeItemId, viewLayout como note-editor e navega para query note mesmo estando na raiz', async () => {
    const { handleSelectItem, activeItemId, viewLayout } = useWorkspaceSidebar()
    await handleSelectItem({
      id: 'note-xyz789',
      title: 'Minha Nota',
      kind: 'note',
      folder: null,
      tags: []
    })

    expect(activeItemId.value).toBe('note-xyz789')
    expect(viewLayout.value).toBe('note-editor')
    expect(mockPush).toHaveBeenCalledWith({ path: '/', query: { note: 'xyz789' } })
  })

  it('unifiedFolders agrega tags de notas, temas de livros e quadros unificados', () => {
    mockNotesList.value = [{ id: 'n1', title: 'Nota 1', tags: ['filosofia', 'grecia'] }]
    mockCanvasesList.value = [{ id: 'c1', title: 'Quadro 1', tags: ['arquitetura'] }]
    mockUserBooks.value = [{ id: 'b1', title: 'Livro 1', themes: [{ id: 1, name: 'literatura' }] }]

    const { unifiedFolders } = useWorkspaceSidebar()

    expect(unifiedFolders.value).toContain('filosofia')
    expect(unifiedFolders.value).toContain('grecia')
    expect(unifiedFolders.value).toContain('arquitetura')
    expect(unifiedFolders.value).toContain('literatura')
    expect(unifiedFolders.value).toContain('Livros')
  })

  it('unifiedSidebarItems calcula referenceCount para itens com múltiplas tags', () => {
    mockNotesList.value = [
      { id: 'n1', title: 'Nota 1', tags: ['filosofia', 'grecia'] },
      { id: 'n2', title: 'Nota 2', tags: ['filosofia'] },
    ]

    const { unifiedSidebarItems } = useWorkspaceSidebar()

    const item1 = unifiedSidebarItems.value.find((i) => i.id === 'note-n1')
    const item2 = unifiedSidebarItems.value.find((i) => i.id === 'note-n2')

    expect(item1?.referenceCount).toBe(2)
    expect(item1?.tags).toEqual(['filosofia', 'grecia'])
    expect(item2?.referenceCount).toBe(1)
  })

  it('handleAddReferenceToFolder adiciona nova tag mantendo as existentes', async () => {
    mockNoteGetById.mockResolvedValueOnce({
      id: 'n1',
      title: 'Nota 1',
      tags: ['filosofia'],
    })

    const { handleAddReferenceToFolder } = useWorkspaceSidebar()
    await handleAddReferenceToFolder({ itemId: 'note-n1', toFolder: 'historia' })

    expect(mockNoteSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'n1',
        tags: ['filosofia', 'historia'],
      })
    )
  })

  it('handleMoveItemToFolder substitui a tag de origem pela tag de destino', async () => {
    mockNoteGetById.mockResolvedValueOnce({
      id: 'n1',
      title: 'Nota 1',
      tags: ['filosofia', 'geral'],
    })

    const { handleMoveItemToFolder } = useWorkspaceSidebar()
    await handleMoveItemToFolder({ itemId: 'note-n1', fromFolder: 'filosofia', toFolder: 'ciencias' })

    expect(mockNoteSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'n1',
        tags: ['geral', 'ciencias'],
        folder: 'ciencias',
      })
    )
  })

  it('handleRemoveReferenceFromFolder remove apenas a tag informada', async () => {
    mockNoteGetById.mockResolvedValueOnce({
      id: 'n1',
      title: 'Nota 1',
      tags: ['filosofia', 'historia'],
    })

    const { handleRemoveReferenceFromFolder } = useWorkspaceSidebar()
    await handleRemoveReferenceFromFolder({ itemId: 'note-n1', folder: 'filosofia' })

    expect(mockNoteSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'n1',
        tags: ['historia'],
      })
    )
  })

  it('handleCreateNewBook redireciona para /upload', async () => {
    mockPush.mockClear()
    const { handleCreateNewBook } = useWorkspaceSidebar()
    await handleCreateNewBook()

    expect(mockPush).toHaveBeenCalledWith('/upload')
  })
})
