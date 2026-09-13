import { describe, it, expect, vi, beforeEach } from 'vitest'
import { didacticBookletService } from '../src/modules/memory/services/didacticBooklet.service'
import { prisma } from '../src/modules/memory/config/database'
import { aiService } from '../src/modules/ai/services/ai.service'

vi.mock('../src/modules/ai/services/ai.service', () => ({
  aiService: {
    generateDidacticExplanation: vi.fn().mockResolvedValue({
      title: 'Didático: Estruturas de Dados em Árvore',
      markdown: '# Didático: Estruturas de Dados em Árvore\n\n> [!ANALOGY]\n> Analogia\n\n> [!KEY_CONCEPT]\n> Conceito\n\n```mermaid\nflowchart TD\n  A --> B\n```',
      diagramCount: 1,
    }),
    embed: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
  },
}))

vi.mock('../src/modules/memory/config/database', () => {
  const booklets: any[] = []
  const chapters: any[] = []
  let bookletIdCounter = 1
  let chapterIdCounter = 1

  return {
    prisma: {
      theme: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 99) return Promise.resolve({ id: 99, name: 'Algoritmos & Complexidade' })
          return Promise.resolve(null)
        }),
      },
      flashcard: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 10) return Promise.resolve({ id: 10, question: 'O que é Big-O?', answer: 'Complexidade assintótica' })
          return Promise.resolve(null)
        }),
      },
      annotation: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      book: {
        create: vi.fn().mockImplementation(({ data }) => {
          return Promise.resolve({
            id: bookletIdCounter + 500,
            title: data.title,
            file_path: data.file_path,
            file_type: data.file_type || 'didactic',
          })
        }),
      },
      didacticBooklet: {
        create: vi.fn().mockImplementation(({ data }) => {
          const newBooklet: any = {
            id: bookletIdCounter++,
            user_id: data.user_id,
            book_id: data.book_id,
            theme_id: data.theme_id,
            title: data.title,
            description: data.description,
            target_audience: data.target_audience,
            created_at: new Date(),
            updated_at: new Date(),
            chapters: [],
            theme: data.theme_id === 99 ? { id: 99, name: 'Algoritmos & Complexidade' } : null,
          }
          if (data.chapters?.create) {
            const chapData = data.chapters.create
            const newChapter = {
              id: chapterIdCounter++,
              booklet_id: newBooklet.id,
              order_index: chapData.order_index,
              title: chapData.title,
              topic: chapData.topic,
              flashcard_id: chapData.flashcard_id,
              annotation_id: chapData.annotation_id,
              raw_markdown: chapData.raw_markdown,
              diagram_count: chapData.diagram_count,
              depth_level: chapData.depth_level,
              created_at: new Date(),
            }
            chapters.push(newChapter)
            newBooklet.chapters.push(newChapter)
          }
          booklets.push(newBooklet)
          return Promise.resolve(newBooklet)
        }),
        findFirst: vi.fn().mockImplementation(({ where }) => {
          const match = booklets.find((b) => {
            if (where.OR) {
              return where.OR.some((cond: any) =>
                cond.user_id === b.user_id &&
                ((cond.id !== undefined && cond.id === b.id) ||
                 (cond.book_id !== undefined && cond.book_id === b.book_id))
              )
            }
            return (where.user_id === undefined || b.user_id === where.user_id) &&
                   (where.id === undefined || b.id === where.id)
          })
          if (!match) return Promise.resolve(null)
          const bChapters = chapters.filter((c) => c.booklet_id === match.id)
          return Promise.resolve({ ...match, chapters: bChapters })
        }),
        findUnique: vi.fn().mockImplementation(({ where }) => {
          const match = booklets.find((b) => b.id === where.id)
          if (!match) return Promise.resolve(null)
          const bChapters = chapters.filter((c) => c.booklet_id === match.id)
          return Promise.resolve({ ...match, chapters: bChapters })
        }),
        findMany: vi.fn().mockImplementation(({ where }) => {
          return Promise.resolve(booklets.filter((b) => b.user_id === where.user_id))
        }),
        count: vi.fn().mockImplementation(({ where }) => {
          return Promise.resolve(booklets.filter((b) => b.user_id === where.user_id).length)
        }),
        delete: vi.fn().mockResolvedValue({ id: 1 }),
      },
      didacticBookletChapter: {
        create: vi.fn().mockImplementation(({ data }) => {
          const newChap = {
            id: chapterIdCounter++,
            booklet_id: data.booklet_id,
            order_index: data.order_index,
            title: data.title,
            topic: data.topic,
            flashcard_id: data.flashcard_id,
            annotation_id: data.annotation_id,
            raw_markdown: data.raw_markdown,
            diagram_count: data.diagram_count,
            depth_level: data.depth_level,
            created_at: new Date(),
          }
          chapters.push(newChap)
          return Promise.resolve(newChap)
        }),
      },
    },
  }
})

describe('DidacticBookletService (aresta-memory)', () => {
  const userId = 100

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. Deve gerar conteúdo pedagógico com Callouts e Mermaid via generateContent', async () => {
    const result = await didacticBookletService.generateContent({
      topic: 'Estruturas de Dados em Árvore',
    })

    expect(result.title).toContain('Didático')
    expect(result.markdown).toContain('> [!ANALOGY]')
    expect(result.markdown).toContain('> [!KEY_CONCEPT]')
    expect(result.markdown).toContain('```mermaid')
    expect(result.diagramCount).toBeGreaterThanOrEqual(1)
  })

  it('2. Deve criar um novo livreto didático com o primeiro capítulo vinculado', async () => {
    const booklet = await didacticBookletService.createBooklet(userId, {
      title: 'Caderno de Algoritmos',
      topic: 'Notação Big-O e Complexidade',
      theme_id: 99,
      flashcard_id: 10,
      depth_level: 'standard',
      target_audience: 'student',
    })

    expect(booklet).toBeDefined()
    expect(booklet.title).toBe('Caderno de Algoritmos')
    expect(booklet.chapters).toHaveLength(1)
    expect(booklet.chapters[0].order_index).toBe(1)
    expect(booklet.chapters[0].topic).toBe('Notação Big-O e Complexidade')
    expect(booklet.chapters[0].raw_markdown).toContain('> [!ANALOGY]')
  })

  it('3. Deve anexar um novo capítulo sequencialmente incrementando order_index', async () => {
    const booklet = await didacticBookletService.createBooklet(userId, {
      title: 'Livreto de Grafos',
      topic: 'Grafos Direcionados',
      depth_level: 'standard',
      target_audience: 'student',
    })

    const appendResult = await didacticBookletService.appendChapter(userId, booklet.id, {
      topic: 'Algoritmo de Dijkstra',
      depth_level: 'standard',
    })

    expect(appendResult.chapter.order_index).toBe(2)
    expect(appendResult.chapter.topic).toBe('Algoritmo de Dijkstra')
    expect(appendResult.booklet?.chapters).toHaveLength(2)
  })

  it('4. Deve REJEITAR com erro 422 e CANNOT_APPEND_TO_NON_BOOKLET ao tentar appendar em livro que não é livreto didático', async () => {
    const nonExistentOrNonBookletId = 999999

    await expect(
      didacticBookletService.appendChapter(userId, nonExistentOrNonBookletId, {
        topic: 'Tentativa Inválida em EPUB Tradicional',
      })
    ).rejects.toMatchObject({
      statusCode: 422,
      code: 'CANNOT_APPEND_TO_NON_BOOKLET',
    })
  })

  it('5. Deve garantir isolamento entre usuários (usuário B não pode appendar no livreto do usuário A)', async () => {
    const userABooklet = await didacticBookletService.createBooklet(userId, {
      title: 'Livreto Privado do Usuário A',
      topic: 'Tópico Secreto',
    })

    const userBId = 200

    await expect(
      didacticBookletService.appendChapter(userBId, userABooklet.id, {
        topic: 'Intrusão do Usuário B',
      })
    ).rejects.toMatchObject({
      statusCode: 422,
      code: 'CANNOT_APPEND_TO_NON_BOOKLET',
    })
  })

  it('6. Deve lançar erro genérico 503 e não criar registro de livro caso a IA falhe (sem fallback offline)', async () => {
    vi.mocked(aiService.generateDidacticExplanation).mockRejectedValueOnce(new Error('API quota exceeded / network down'))

    await expect(
      didacticBookletService.createBooklet(userId, {
        title: 'Livro que Não Deve Ser Criado',
        topic: 'Tópico Falho',
      })
    ).rejects.toMatchObject({
      statusCode: 503,
      code: 'AI_UNAVAILABLE',
      message: expect.stringContaining('Não foi possível gerar a explicação com Inteligência Artificial no momento'),
    })
  })
})
