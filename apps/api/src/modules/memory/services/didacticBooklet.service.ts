import axios from 'axios'
import { prisma } from '../config/database'
import { SERVICES } from '../config/services.config'
import { aiService } from '../../ai/services/ai.service'
import type { CreateBookletInput, AppendChapterInput, GetBookletsQueryInput } from '../schemas/didactic.schema'

export class DidacticBookletService {
  /**
   * Gera o conteúdo Markdown pedagógico estruturado chamando aiService do monólito ou serviço externo.
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

    // 1. Invoca o aiService com cascata completa (Gemini 3.7 -> 3.6 -> 3.5 -> APIs externas)
    try {
      const generated = await aiService.generateDidacticExplanation({
        topic,
        themeName,
        bookTitle,
        flashcardQuestion,
        flashcardAnswer,
        annotationQuote,
        annotationNote,
        depthLevel,
        userLanguage: 'pt-BR',
      })
      if (generated && generated.markdown) {
        return generated
      }
    } catch (err: any) {
      console.warn('[DidacticBookletService] Falha na geração com aiService in-process:', err?.message || err)
    }

    // 2. Se houver token e serviço HTTP externo configurado explicitamente
    if (token && SERVICES.ai && !SERVICES.ai.includes('3002')) {
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
        console.warn('[DidacticBookletService] Falha ao consultar serviço HTTP externo de IA:', err)
      }
    }

    // SEM FALLBACK OFFLINE: Se todas as tentativas falharem, lança erro genérico amigável
    const error: any = new Error(
      'Não foi possível gerar a explicação com Inteligência Artificial no momento. Por favor, verifique sua conexão ou tente novamente em instantes.'
    )
    error.statusCode = 503
    error.code = 'AI_UNAVAILABLE'
    throw error
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

    // Cria registro de Book e UserBook para persistência real e compatibilidade com estante e leitor
    const book = await prisma.book.create({
      data: {
        title,
        file_path: `virtual://didactic/${title}`,
        file_type: 'didactic',
        userBooks: {
          create: {
            user_id: userId,
            status: 'LENDO',
            current_page: 0,
            last_accessed_at: new Date(),
          },
        },
        ...(input.theme_id
          ? {
              bookThemes: {
                create: {
                  theme_id: input.theme_id,
                },
              },
            }
          : {}),
      },
    })

    const booklet = await prisma.didacticBooklet.create({
      data: {
        user_id: userId,
        book_id: book.id,
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
