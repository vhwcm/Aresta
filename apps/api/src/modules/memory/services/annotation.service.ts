import { prisma } from '../config/database'
import axios from 'axios'
import { SERVICES } from '../config/services.config'
import { aiService } from '../../ai/services/ai.service'

export class AnnotationService {
  async create(data: {
    userId: number
    bookId: number
    cfi?: string
    selectedText?: string
    note?: string
    chapterTitle?: string
    progress?: number
    themeIds?: number[]
    bookTitle?: string
    token: string
  }) {
    const { token, themeIds, bookTitle, ...rest } = data
    const numericBookId = parseInt(String(rest.bookId), 10) || 1

    // Garantir existência do livro na tabela 'books' para evitar violação de FK no Postgres
    const bookExists = await prisma.book.findUnique({ where: { id: numericBookId } })
    if (!bookExists) {
      await prisma.book.upsert({
        where: { id: numericBookId },
        update: {},
        create: {
          id: numericBookId,
          title: bookTitle || 'Livro Sem Título',
          file_path: 'local/book.epub',
          file_type: 'epub',
        },
      })
    }

    // Criar anotação com temas vinculados e progresso normalizado
    const annotation = await prisma.annotation.create({
      data: {
        user_id: rest.userId,
        book_id: numericBookId,
        cfi: rest.cfi,
        selected_text: rest.selectedText,
        note: rest.note,
        chapter_title: rest.chapterTitle,
        progress: rest.progress ? Number(rest.progress) : 0,
        ...(Array.isArray(themeIds) && themeIds.length > 0
          ? {
              annotationThemes: {
                create: themeIds.map((tid) => ({
                  theme_id: Number(tid),
                })),
              },
            }
          : {}),
      },
      include: {
        book: { select: { id: true, title: true, cover_path: true } },
        annotationThemes: { include: { theme: true } },
        flashcard: true,
      },
    })

    // Generate embedding asynchronously (fire and forget)
    if (rest.selectedText) {
      this.generateAndSaveEmbedding(annotation.id, rest.selectedText, token).catch(console.error)
    }

    return annotation
  }

  private async generateAndSaveEmbedding(annotationId: number, text: string, token: string) {
    try {
      let vector: number[] | null = null
      try {
        vector = await aiService.embed(text)
      } catch {
        if (token && SERVICES.ai && !SERVICES.ai.includes('3002')) {
          const { data } = await axios.post(
            `${SERVICES.ai}/api/ai/embed`,
            { text },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          vector = data.embedding as number[]
        }
      }

      if (vector && vector.length > 0) {
        // Use raw SQL to update the pgvector column
        await prisma.$executeRaw`
          UPDATE annotations
          SET embedding = ${JSON.stringify(vector)}::vector
          WHERE id = ${annotationId}
        `
      }
    } catch (err) {
      console.error('[annotation] Failed to generate embedding:', err)
    }
  }

  async findByUser(userId: number) {
    return prisma.annotation.findMany({
      where: { user_id: userId },
      include: {
        book: { select: { id: true, title: true, cover_path: true } },
        annotationThemes: { include: { theme: true } },
        flashcard: true,
      },
      orderBy: { created_at: 'desc' },
    })
  }

  async findByBook(userId: number, bookId: number) {
    return prisma.annotation.findMany({
      where: { user_id: userId, book_id: bookId },
      include: {
        book: { select: { id: true, title: true, cover_path: true } },
        annotationThemes: { include: { theme: true } },
        flashcard: true,
      },
      orderBy: { progress: 'asc' },
    })
  }

  async findSimilar(annotationId: number, userId: number, limit = 10) {
    // Semantic similarity search using pgvector
    return prisma.$queryRaw`
      SELECT a.id, a.selected_text, a.note, a.book_id,
             1 - (a.embedding <=> b.embedding) AS similarity
      FROM annotations a
      CROSS JOIN annotations b
      WHERE b.id = ${annotationId}
        AND a.user_id = ${userId}
        AND a.id != ${annotationId}
        AND a.embedding IS NOT NULL
      ORDER BY similarity DESC
      LIMIT ${limit}
    `
  }

  async delete(id: number, userId: number) {
    return prisma.annotation.delete({ where: { id, user_id: userId } })
  }
}

export const annotationService = new AnnotationService()
