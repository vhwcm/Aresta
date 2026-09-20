import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useDidacticBooklet } from '../../../app/composables/useDidacticBooklet'
import { dbManager } from '../../../app/adapters/database/DatabaseManager'
import { InMemoryAdapter } from '../../../app/adapters/database/InMemoryAdapter'
import { bookRepo } from '../../../app/adapters/database/repositories/BookRepository'

// Mock de fetch global para simular a resposta de /api/ai/didactic
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useDidacticBooklet Composable (Local-First AI Generation)', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const memoryAdapter = new InMemoryAdapter()
    dbManager.setAdapter(memoryAdapter)
    await bookRepo.clear()
  })

  it('cria livreto didático via /api/ai/didactic e persiste localmente na estante e no banco', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        title: 'Didático: Machine Learning',
        html: '<section class="didactic-page" data-page="1"><h1>Machine Learning</h1></section>',
        markdown: '# Machine Learning\n\nConteúdo didático...',
        diagramCount: 1,
      }),
    })

    const didactic = useDidacticBooklet()
    const result = await didactic.createBooklet({
      topic: 'Machine Learning',
      theme_id: 42,
    })

    // 1. Deve chamar a rota da IA (/api/ai/didactic) e não a rota legada (410 Gone)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, options] = (mockFetch.mock.calls[0] || []) as [string, any]
    expect(url).toContain('/ai/didactic')
    expect(url).not.toContain('/didactic/booklets')
    expect(JSON.parse(options?.body || '{}')).toEqual(
      expect.objectContaining({
        topic: 'Machine Learning',
        userLanguage: 'pt-BR',
      })
    )

    // 2. Deve retornar objeto de booklet e book para navegação imediata
    expect(result.book?.id).toBeDefined()
    expect(result.book?.title).toBe('Didático: Machine Learning')
    expect(result.book?.format_type).toBe('DIDACTIC')
    expect(result.booklet.chapters).toHaveLength(1)
    expect(result.booklet.chapters?.[0]?.topic).toBe('Machine Learning')

    // 3. Deve persistir o livro na estante (bookRepo)
    const savedBook = await bookRepo.getById(result.book!.id)
    expect(savedBook).toBeDefined()
    expect(savedBook?.title).toBe('Didático: Machine Learning')
    expect(savedBook?.filePath).toContain('virtual://didactic/')

    // 4. Deve persistir o livreto na tabela local de livretos
    const localBooklets = await dbManager.getAdapter().getDidacticBooklets()
    expect(localBooklets).toHaveLength(1)
    expect(localBooklets[0]?.topic).toBe('Machine Learning')
    expect(localBooklets[0]?.html).toContain('Machine Learning')
  })

  it('busca livretos didáticos do banco local via fetchBooklets', async () => {
    const didactic = useDidacticBooklet()
    await dbManager.getAdapter().saveDidacticBooklet({
      id: 'booklet-uuid-123',
      title: 'Didático: Algoritmos',
      topic: 'Algoritmos de Ordenação',
      html: '<p>Algoritmos</p>',
      markdown: 'Algoritmos',
      diagramCount: 2,
      depthLevel: 'standard',
      bookId: 9999,
      themeId: 10,
      createdAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: 'synced',
    })

    const list = await didactic.fetchBooklets()
    expect(list).toHaveLength(1)
    expect(list[0]?.title).toBe('Didático: Algoritmos')
    expect(list[0]?.book_id).toBe(9999)
  })

  it('propaga erro adequadamente quando a IA falha', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Limite de requisições excedido',
      }),
    })

    const didactic = useDidacticBooklet()
    await expect(
      didactic.createBooklet({
        topic: 'Tópico que falha',
      })
    ).rejects.toThrow('Limite de requisições excedido')

    expect(didactic.error.value).toBe('Limite de requisições excedido')
  })
})
