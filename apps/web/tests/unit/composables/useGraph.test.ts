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

  it('updateNode rejeita nomes com mais de 30 caracteres', async () => {
    const { updateNode } = useGraph()
    await expect(
      updateNode(1, 'Este nome de tema tem mais de trinta caracteres com certeza')
    ).rejects.toThrow('30 caracteres')
  })
})
