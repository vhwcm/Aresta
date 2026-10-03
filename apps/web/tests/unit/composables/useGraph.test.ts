import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useGraph, resetGraphMemory } from '~/composables/useGraph'
import * as authComposable from '~/composables/useAuth'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'
import { annotationRepo } from '~/adapters/database/repositories/AnnotationRepository'
import { noteRepo } from '~/adapters/database/repositories/NoteRepository'
import { canvasRepo } from '~/adapters/database/repositories/CanvasRepository'
import { drawingNoteRepo } from '~/adapters/database/repositories/DrawingNoteRepository'
import { GRAPH_META_STORAGE_KEY, resetGraphMeta } from '~/utils/graphMeta'

describe('useGraph Composable', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetGraphMemory()
    resetGraphMeta()
    vi.spyOn(authComposable, 'useAuth').mockReturnValue({
      token: ref('fake-token'),
      user: ref({ id: 1, name: 'viktor', email: 'viktor@aresta.org' }),
      isLoggedIn: ref(true),
      isAdmin: ref(true),
    } as any)

    vi.spyOn(bookRepo, 'getAll').mockResolvedValue([])
    vi.spyOn(annotationRepo, 'getAll').mockResolvedValue([])
    vi.spyOn(noteRepo, 'getAll').mockResolvedValue([])
    vi.spyOn(canvasRepo, 'getAll').mockResolvedValue([])
    vi.spyOn(drawingNoteRepo, 'getAll').mockResolvedValue([])
  })

  it('fetchGraph monta nós e arestas a partir dos repositórios locais', async () => {
    vi.spyOn(bookRepo, 'getAll').mockResolvedValue([
      {
        id: 1,
        bookId: 1,
        title: 'Contos Fluminenses',
        author: 'Machado de Assis',
        status: 'LENDO',
        currentPage: 1,
        updated_at: '',
        sync_status: 'synced',
        themes: [{ id: 1, name: 'Literatura Brasileira', color: '#E57B55' }],
      },
    ])

    const { graphData, fetchGraph, loading } = useGraph()
    await fetchGraph()

    expect(graphData.value?.nodes?.some((node) => node.name === 'Literatura Brasileira')).toBe(true)
    expect(graphData.value?.nodes?.some((node) => node.type === 'book')).toBe(true)
    expect(loading.value).toBe(false)
  })

  it('fetchThemeBooks busca livros do tema no repositório local', async () => {
    vi.spyOn(bookRepo, 'getAll').mockResolvedValue([
      {
        id: 1,
        bookId: 1,
        title: 'O Programador Pragmático',
        author: 'Andy Hunt',
        status: 'LENDO',
        currentPage: 1,
        updated_at: '',
        sync_status: 'synced',
        themes: [{ id: 7, name: 'Engenharia' }],
      },
      {
        id: 2,
        bookId: 2,
        title: 'Outro Livro',
        status: 'QUERO_LER',
        currentPage: 0,
        updated_at: '',
        sync_status: 'synced',
        themes: [{ id: 9, name: 'Ficção' }],
      },
    ])

    const { fetchThemeBooks } = useGraph()
    const books = await fetchThemeBooks(7)

    expect(books).toHaveLength(1)
    expect(books[0]?.title).toBe('O Programador Pragmático')
  })

  it('fetchThemeAnnotations busca anotações do tema no repositório local', async () => {
    vi.spyOn(annotationRepo, 'getAll').mockResolvedValue([
      { id: 10, bookId: 1, cfi: '', bookTitle: 'O Programador Pragmático', note: 'Automação é chave', createdAt: '', updated_at: '', sync_status: 'synced' },
    ])

    const { fetchThemeAnnotations } = useGraph()
    const annotations = await fetchThemeAnnotations(7)

    expect(annotationRepo.getAll).toHaveBeenCalledWith({ themeId: 7 })
    expect(annotations).toHaveLength(1)
    expect(annotations[0]?.note).toBe('Automação é chave')
  })

  it('createLooseAnnotation persiste anotação local vinculada aos temas do livro', async () => {
    vi.spyOn(bookRepo, 'getAll').mockResolvedValue([
      {
        id: 1,
        bookId: 1,
        title: 'Livro',
        status: 'LENDO',
        currentPage: 1,
        updated_at: '',
        sync_status: 'synced',
        themes: [{ id: 7, name: 'Tema A' }, { id: 9, name: 'Tema B' }],
      },
    ])
    const saveSpy = vi.spyOn(annotationRepo, 'save').mockResolvedValue({
      id: 50,
      bookId: 1,
      cfi: '',
      note: 'Nota Solta Geral',
      createdAt: '',
      updated_at: '',
      sync_status: 'pending',
    })

    const { createLooseAnnotation } = useGraph()
    const res = await createLooseAnnotation(1, 'Nota Solta Geral', [7, 9])

    expect(saveSpy).toHaveBeenCalled()
    expect(res.note).toBe('Nota Solta Geral')
    expect(res.id).toBe(50)
  })

  it('createNode persiste o tema localmente e atualiza o grafo', async () => {
    const { createNode, graphData } = useGraph()
    const result = await createNode('Filosofia', '#3B82F6', 'Stoicismo')

    expect(result.name).toBe('Filosofia')
    expect(graphData.value.nodes.some((node) => node.name === 'Filosofia')).toBe(true)
    expect(localStorage.getItem(GRAPH_META_STORAGE_KEY)).toContain('Filosofia')
  })

  it('exibe todos os nós de temas no grafo para permitir conexões magnéticas', async () => {
    vi.spyOn(bookRepo, 'getAll').mockResolvedValue([
      {
        id: 1,
        bookId: 1,
        title: 'Livro Teste',
        status: 'LENDO',
        currentPage: 1,
        updated_at: '',
        sync_status: 'synced',
        themes: [{ id: 10, name: 'Tema Com Livro' }],
      },
    ])
    vi.spyOn(annotationRepo, 'getAll').mockResolvedValue([
      {
        id: 99,
        bookId: 1,
        cfi: '',
        createdAt: '',
        updated_at: '',
        sync_status: 'synced',
        themes: [{ id: 20, name: 'Tema Com Nota' }],
      },
    ])
    localStorage.setItem(GRAPH_META_STORAGE_KEY, JSON.stringify({
      themes: [{ id: 30, name: 'Tema Disponível Para Conexão' }],
      edges: [],
    }))

    const { graphData, fetchGraph } = useGraph()
    await fetchGraph()

    const nodeNames = graphData.value.nodes.map((n) => n.name)
    expect(nodeNames).toContain('Tema Com Livro')
    expect(nodeNames).toContain('Tema Com Nota')
    expect(nodeNames).toContain('Livro Teste')
    expect(nodeNames).toContain('Tema Disponível Para Conexão')
  })

  it('fetchBookAnnotations lê anotações locais do livro', async () => {
    vi.spyOn(annotationRepo, 'getAll').mockResolvedValue([
      { id: 1, bookId: 10, cfi: '', note: 'Nota importante sobre Rei Artur', selectedText: 'Excalibur', createdAt: '', updated_at: '', sync_status: 'synced' },
      { id: 2, bookId: 10, cfi: '', note: 'Távola redonda', selectedText: 'Cavaleiros', createdAt: '', updated_at: '', sync_status: 'synced' },
    ])

    const { fetchBookAnnotations } = useGraph()
    const result = await fetchBookAnnotations(10)

    expect(annotationRepo.getAll).toHaveBeenCalledWith({ bookId: 10 })
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(2)
    expect(result[0]?.note).toBe('Nota importante sobre Rei Artur')
  })

  it('createNode rejeita nomes com mais de 30 caracteres', async () => {
    const { createNode } = useGraph()
    await expect(
      createNode('Este nome de tema tem mais de trinta caracteres com certeza')
    ).rejects.toThrow('30 caracteres')
  })

  it('unlinkEdge desvincula livro de um tema', async () => {
    const saveSpy = vi.spyOn(bookRepo, 'save').mockResolvedValue({} as any)
    vi.spyOn(bookRepo, 'getById').mockResolvedValue({
      id: 1,
      bookId: 1,
      title: 'Livro Teste',
      themes: [
        { id: 10, name: 'Filosofia' },
        { id: 20, name: 'História' },
      ],
    } as any)

    const { unlinkEdge } = useGraph()
    await unlinkEdge({
      type: 'book-theme',
      source: 'book-1',
      target: 'theme-10',
    })

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        themes: [{ id: 20, name: 'História' }],
      })
    )
  })

  it('unlinkEdge desvincula anotação de um tema', async () => {
    const saveSpy = vi.spyOn(annotationRepo, 'save').mockResolvedValue({} as any)
    vi.spyOn(annotationRepo, 'getById').mockResolvedValue({
      id: 5,
      bookId: 1,
      note: 'Nota profunda',
      themes: [
        { id: 10, name: 'Filosofia' },
      ],
    } as any)

    const { unlinkEdge } = useGraph()
    await unlinkEdge({
      type: 'annotation-theme',
      source: 'annotation-5',
      target: 'theme-10',
    })

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 5,
        themes: [],
      })
    )
  })

  it('unlinkEdge desvincula nota de um tema removendo a tag correspondente', async () => {
    const saveSpy = vi.spyOn(noteRepo, 'save').mockResolvedValue({} as any)
    vi.spyOn(noteRepo, 'getById').mockResolvedValue({
      id: 12,
      title: 'Minha Nota',
      tags: ['Filosofia', 'Ciência'],
    } as any)

    localStorage.setItem(GRAPH_META_STORAGE_KEY, JSON.stringify({
      themes: [
        { id: 10, name: 'Filosofia', color: '#E57B55', updated_at: 1000, deleted_at: null },
      ],
      edges: [],
    }))

    const { graphData, unlinkEdge } = useGraph()
    graphData.value.nodes = [
      { id: 'theme-10', rawId: 10, name: 'Filosofia', type: 'theme' } as any,
    ]

    await unlinkEdge({
      type: 'note-theme',
      source: 'note-12',
      target: 'theme-10',
    })

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 12,
        tags: ['Ciência'],
      })
    )
  })

  it('unlinkEdge remove conexão customizada em meta.edges aplicando tombstone CRDT', async () => {
    localStorage.setItem(GRAPH_META_STORAGE_KEY, JSON.stringify({
      themes: [],
      edges: [
        { id: 'theme-1---theme-2', source: 'theme-1', target: 'theme-2', type: 'theme-hierarchy', updated_at: 1000, deleted_at: null },
      ],
    }))

    const { unlinkEdge } = useGraph()
    await unlinkEdge({
      id: 'theme-1---theme-2',
      source: 'theme-1',
      target: 'theme-2',
      type: 'theme-hierarchy',
    })

    const stored = JSON.parse(localStorage.getItem(GRAPH_META_STORAGE_KEY) || '{}')
    expect(stored.edges).toHaveLength(1)
    expect(stored.edges[0].deleted_at).toBeTypeOf('number')
  })
})
