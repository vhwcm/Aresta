import axios from 'axios'
import { prisma } from '../config/database'
import { SERVICES } from '../config/services.config'
import type { CreateBookletInput, AppendChapterInput, GetBookletsQueryInput } from '../schemas/didactic.schema'

export class DidacticBookletService {
  /**
   * Gera o conteúdo Markdown pedagógico estruturado chamando aresta-ai ou gerando fallback de alta qualidade.
   */
  async generateContent(params: {
    topic: string
    token?: string
    themeName?: string
    bookTitle?: string
    flashcardQuestion?: string
    flashcardAnswer?: string
    annotationQuote?: string
    annotationNote?: string
    depthLevel?: 'quick_summary' | 'standard' | 'deep_dive'
  }): Promise<{ title: string; markdown: string; diagramCount: number }> {
    const { topic, token, themeName, bookTitle, flashcardQuestion, flashcardAnswer, annotationQuote, annotationNote, depthLevel = 'standard' } = params

    if (token) {
      try {
        const response = await axios.post(
          `${SERVICES.ai}/didactic`,
          {
            topic,
            themeName,
            bookTitle,
            flashcardQuestion,
            flashcardAnswer,
            annotationQuote,
            annotationNote,
            depthLevel,
            userLanguage: 'pt-BR',
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000,
          }
        )
        if (response.data?.markdown) {
          return response.data
        }
      } catch (err) {
        console.warn('[DidacticBookletService] Falha ao consultar aresta-ai, gerando explicação local com fallback:', err)
      }
    }

    // Fallback pedagógico determinístico
    const title = `Didático: ${topic.slice(0, 45)}`
    const markdown = `# ${title}

> [!ANALOGY]
> Pense em **${topic}** como uma engrenagem essencial: isolando a complexidade, cada etapa seguinte se torna intuitiva e previsível.

---

## 1. Princípio Fundamental

> [!KEY_CONCEPT]
> O objetivo principal de ${topic} é criar uma representação mental sólida e sem ambiguidades.

---

## 2. Mapa do Fluxo e Estrutura

\`\`\`mermaid
flowchart TD
    A[🎯 Entrada / Problema] --> B[⚙️ Núcleo: ${topic.slice(0, 25)}]
    B --> C[✅ Resolução & Fixação]
\`\`\`

---

## 3. Aplicação Prática

> [!TIP]
> Ao revisar este conceito, tente explicá-lo com suas próprias palavras antes de ler a resposta.

> [!WARNING]
> Não decore termos isolados; compreenda as conexões de causa e efeito.
`

    return {
      title,
      markdown,
      diagramCount: 1,
    }
  }

  /**
   * Cria um novo livreto didático e adiciona seu primeiro capítulo.
   */
  async createBooklet(userId: number, input: CreateBookletInput, token?: string) {
    let themeName: string | undefined
    if (input.theme_id) {
      const theme = await prisma.theme.findUnique({ where: { id: input.theme_id } })
      themeName = theme?.name
    }

    let flashcardQ: string | undefined
    let flashcardA: string | undefined
    if (input.flashcard_id) {
      const card = await prisma.flashcard.findUnique({ where: { id: input.flashcard_id } })
      flashcardQ = card?.question
      flashcardA = card?.answer
    }

    let annotationQuote: string | undefined
    let annotationNote: string | undefined
    if (input.annotation_id) {
      const ann = await prisma.annotation.findUnique({ where: { id: input.annotation_id } })
      annotationQuote = ann?.selected_text || undefined
      annotationNote = ann?.note || undefined
    }

    const generated = await this.generateContent({
      topic: input.topic,
      token,
      themeName,
      flashcardQuestion: flashcardQ,
      flashcardAnswer: flashcardA,
      annotationQuote,
      annotationNote,
      depthLevel: input.depth_level,
    })

    const title = input.title || generated.title || `Didático: ${input.topic.slice(0, 40)}`

    // ID virtual de livro gerado para compatibilidade com leitor e estante
    const virtualBookId = Date.now()

    const booklet = await prisma.didacticBooklet.create({
      data: {
        user_id: userId,
        book_id: virtualBookId,
        theme_id: input.theme_id || null,
        title,
        description: `Livreto gerado por IA sobre "${input.topic}"`,
        target_audience: input.target_audience || 'student',
        chapters: {
          create: {
            order_index: 1,
            title: `Capítulo 1: ${input.topic.slice(0, 40)}`,
            topic: input.topic,
            flashcard_id: input.flashcard_id || null,
            annotation_id: input.annotation_id || null,
            raw_markdown: generated.markdown,
            diagram_count: generated.diagramCount,
            depth_level: input.depth_level,
          },
        },
      },
      include: {
        chapters: {
          orderBy: { order_index: 'asc' },
        },
        theme: true,
      },
    })

    return booklet
  }

  /**
   * Anexa um novo capítulo a um livreto didático existente.
   * REGRA INEGOCIÁVEL: Apenas livretos didáticos podem receber append.
   */
  async appendChapter(userId: number, bookletIdOrBookId: number, input: AppendChapterInput, token?: string) {
    const booklet = await prisma.didacticBooklet.findFirst({
      where: {
        OR: [
          { id: bookletIdOrBookId, user_id: userId },
          { book_id: bookletIdOrBookId, user_id: userId },
        ],
      },
      include: {
        chapters: {
          orderBy: { order_index: 'asc' },
        },
        theme: true,
      },
    })

    if (!booklet) {
      const error: any = new Error('Operação inválida: só é permitido anexar capítulos a Livretos Didáticos existentes.')
      error.statusCode = 422
      error.code = 'CANNOT_APPEND_TO_NON_BOOKLET'
      throw error
    }

    const nextOrderIndex = booklet.chapters.length > 0
      ? Math.max(...booklet.chapters.map((c) => c.order_index)) + 1
      : 1

    let flashcardQ: string | undefined
    let flashcardA: string | undefined
    if (input.flashcard_id) {
      const card = await prisma.flashcard.findUnique({ where: { id: input.flashcard_id } })
      flashcardQ = card?.question
      flashcardA = card?.answer
    }

    let annotationQuote: string | undefined
    let annotationNote: string | undefined
    if (input.annotation_id) {
      const ann = await prisma.annotation.findUnique({ where: { id: input.annotation_id } })
      annotationQuote = ann?.selected_text || undefined
      annotationNote = ann?.note || undefined
    }

    const generated = await this.generateContent({
      topic: input.topic,
      token,
      themeName: booklet.theme?.name,
      flashcardQuestion: flashcardQ,
      flashcardAnswer: flashcardA,
      annotationQuote,
      annotationNote,
      depthLevel: input.depth_level,
    })

    const chapterTitle = input.title || `Capítulo ${nextOrderIndex}: ${input.topic.slice(0, 40)}`

    const chapter = await prisma.didacticBookletChapter.create({
      data: {
        booklet_id: booklet.id,
        order_index: nextOrderIndex,
        title: chapterTitle,
        topic: input.topic,
        flashcard_id: input.flashcard_id || null,
        annotation_id: input.annotation_id || null,
        raw_markdown: generated.markdown,
        diagram_count: generated.diagramCount,
        depth_level: input.depth_level,
      },
    })

    const updatedBooklet = await prisma.didacticBooklet.findUnique({
      where: { id: booklet.id },
      include: {
        chapters: {
          orderBy: { order_index: 'asc' },
        },
        theme: true,
      },
    })

    return {
      booklet: updatedBooklet,
      chapter,
    }
  }

  /**
   * Lista todos os livretos didáticos do usuário.
   */
  async getBooklets(userId: number, query: GetBookletsQueryInput) {
    const where: any = { user_id: userId }
    if (query.theme_id) {
      where.theme_id = query.theme_id
    }

    const [booklets, total] = await Promise.all([
      prisma.didacticBooklet.findMany({
        where,
        include: {
          chapters: {
            orderBy: { order_index: 'asc' },
            select: {
              id: true,
              order_index: true,
              title: true,
              topic: true,
              diagram_count: true,
              depth_level: true,
              created_at: true,
            },
          },
          theme: true,
        },
        orderBy: { updated_at: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.didacticBooklet.count({ where }),
    ])

    return { booklets, total }
  }

  /**
   * Busca livreto por ID (id do booklet ou book_id virtual).
   */
  async getBookletById(userId: number, bookletIdOrBookId: number) {
    const booklet = await prisma.didacticBooklet.findFirst({
      where: {
        OR: [
          { id: bookletIdOrBookId, user_id: userId },
          { book_id: bookletIdOrBookId, user_id: userId },
        ],
      },
      include: {
        chapters: {
          orderBy: { order_index: 'asc' },
        },
        theme: true,
      },
    })

    if (!booklet) {
      const error: any = new Error('Livreto didático não encontrado.')
      error.statusCode = 404
      throw error
    }

    return booklet
  }

  /**
   * Remove livreto didático.
   */
  async deleteBooklet(userId: number, bookletId: number) {
    const booklet = await prisma.didacticBooklet.findFirst({
      where: { id: bookletId, user_id: userId },
    })

    if (!booklet) {
      const error: any = new Error('Livreto didático não encontrado.')
      error.statusCode = 404
      throw error
    }

    await prisma.didacticBooklet.delete({ where: { id: booklet.id } })
    return { success: true }
  }
}

export const didacticBookletService = new DidacticBookletService()
