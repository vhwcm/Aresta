import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGraph } from '~/composables/useGraph'

// Mock global fetch / $fetch
const mockFetch = vi.fn()
;(globalThis as any).$fetch = mockFetch

describe('useGraph Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchGraph carrega nós e arestas com sucesso', async () => {
    const mockGraphData = {
      nodes: [
        { id: 'theme-1', rawId: 1, type: 'theme', name: 'Literatura Brasileira', color: '#E57B55', bookCount: 2 },
        { id: 'book-1', rawId: 1, type: 'book', name: 'Contos Flu...', fullTitle: 'Contos Fluminenses', author: 'Machado de Assis' },
      ],
      edges: [],
    }
    mockFetch.mockResolvedValueOnce(mockGraphData)

    const { graphData, fetchGraph, loading } = useGraph()
    await fetchGraph()

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/graph', expect.any(Object))
    expect(graphData.value?.nodes?.length).toBe(2)
    expect(graphData.value?.nodes?.[0]?.name).toBe('Literatura Brasileira')
    expect(loading.value).toBe(false)
  })

  it('fetchThemeBooks busca livros do tema', async () => {
    const mockBooks = [
      { id: 1, title: 'O Programador Pragmático', author: 'Andy Hunt' },
    ]
    mockFetch.mockResolvedValueOnce(mockBooks)

    const { fetchThemeBooks } = useGraph()
    const books = await fetchThemeBooks(7)

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/graph/themes/7/books', expect.any(Object))
    expect(books).toHaveLength(1)
    expect(books[0]?.title).toBe('O Programador Pragmático')
  })

  it('fetchThemeAnnotations busca anotações do tema', async () => {
    const mockAnnotations = [
      { id: 10, bookTitle: 'O Programador Pragmático', note: 'Automação é chave' },
    ]
    mockFetch.mockResolvedValueOnce(mockAnnotations)

    const { fetchThemeAnnotations } = useGraph()
    const annotations = await fetchThemeAnnotations(7)

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/graph/themes/7/annotations', expect.any(Object))
    expect(annotations).toHaveLength(1)
    expect(annotations[0]?.note).toBe('Automação é chave')
  })

  it('createLooseAnnotation cria anotação solta vinculada aos temas do livro', async () => {
    const mockCreated = { id: 50, bookId: 1, note: 'Nota Solta Geral', cfi: null }
    mockFetch.mockResolvedValueOnce(mockCreated)

    const { createLooseAnnotation } = useGraph()
    const res = await createLooseAnnotation(1, 'Nota Solta Geral', [7, 9])

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/annotations', expect.objectContaining({
      method: 'POST',
      body: { bookId: 1, note: 'Nota Solta Geral', themeIds: [7, 9] },
    }))
    expect(res.id).toBe(50)
  })

  it('createNode envia requisição POST e atualiza o grafo', async () => {
    const mockNewNode = { id: 'theme-2', rawId: 2, name: 'Filosofia', color: '#3B82F6', description: 'Stoicismo', bookCount: 1 }
    mockFetch.mockResolvedValueOnce(mockNewNode) // POST
    mockFetch.mockResolvedValueOnce({ nodes: [mockNewNode], edges: [] }) // GET recarregado

    const { createNode } = useGraph()
    const result = await createNode('Filosofia', '#3B82F6', 'Stoicismo')

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/graph/nodes', expect.objectContaining({
      method: 'POST',
      body: { name: 'Filosofia', color: '#3B82F6', description: 'Stoicismo' },
    }))
    expect(result.name).toBe('Filosofia')
  })

  it('exibe todos os nós de temas no grafo para permitir conexões magnéticas', async () => {
    const mockGraphData = {
      nodes: [
        { id: 10, name: 'Tema Com Livro', type: 'theme' },
        { id: 20, name: 'Tema Com Nota', type: 'theme' },
        { id: 30, name: 'Tema Disponível Para Conexão', type: 'theme' },
        { id: 'book-1', rawId: 1, type: 'book', name: 'Livro Teste', fullTitle: 'Livro Teste' },
      ],
      edges: [
        { id: 'edge-1', source: 'book-1', target: 'theme-attached-book', type: 'book-theme' },
      ],
      annotations: [
        { id: 99, annotationThemes: [{ theme_id: 20 }] },
      ],
    }
    mockFetch.mockResolvedValueOnce(mockGraphData)

    const { graphData, fetchGraph } = useGraph()
    await fetchGraph()

    const nodeNames = graphData.value.nodes.map((n) => n.name)
    expect(nodeNames).toContain('Tema Com Livro')
    expect(nodeNames).toContain('Tema Com Nota')
    expect(nodeNames).toContain('Livro Teste')
    expect(nodeNames).toContain('Tema Disponível Para Conexão')
  })

  it('fetchBookAnnotations desempacota resposta quando a API retorna { annotations: [...] }', async () => {
    const mockResponse = {
      annotations: [
        { id: 1, bookId: 10, note: 'Nota importante sobre Rei Artur', selectedText: 'Excalibur' },
        { id: 2, bookId: 10, note: 'Távola redonda', selectedText: 'Cavaleiros' },
      ],
    }
    mockFetch.mockResolvedValueOnce(mockResponse)

    const { fetchBookAnnotations } = useGraph()
    const result = await fetchBookAnnotations(10)

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/annotations?bookId=10', expect.any(Object))
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(2)
    expect(result[0]?.note).toBe('Nota importante sobre Rei Artur')
  })

  it('fetchBookAnnotations retorna lista direta quando a API retorna array puro', async () => {
    const mockArray = [
      { id: 3, bookId: 10, note: 'Nota direta', selectedText: 'Trecho' },
    ]
    mockFetch.mockResolvedValueOnce(mockArray)

    const { fetchBookAnnotations } = useGraph()
    const result = await fetchBookAnnotations(10)

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe(3)
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
