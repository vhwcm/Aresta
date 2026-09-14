import { prisma } from '../config/database'
import { cacheManager } from '../../../shared/cache/cache.manager'

export class UserBookService {
  async findByUser(userId: number) {
    const cacheKey = `user:${userId}:books`
    const cached = cacheManager.get<any[]>(cacheKey)
    if (cached) {
      return cached
    }

    const books = await prisma.userBook.findMany({
      where: { user_id: userId },
      include: {
        book: {
          include: {
            publicInfo: true,
            bookThemes: { include: { theme: true } },
          },
        },
      },
      orderBy: [
        { last_accessed_at: 'desc' },
        { updated_at: 'desc' },
      ],
    })

    cacheManager.set(cacheKey, books, 600, [`user:${userId}:books`, `user:${userId}`])
    return books
  }

  async upsert(userId: number, bookId: number, data: { status?: string; currentPage?: number }) {
    const result = await prisma.userBook.upsert({
      where: { user_id_book_id: { user_id: userId, book_id: bookId } },
      create: {
        user_id: userId,
        book_id: bookId,
        status: data.status ?? 'LENDO',
        current_page: data.currentPage ?? 0,
        last_accessed_at: new Date(),
      },
      update: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.currentPage !== undefined && { current_page: data.currentPage }),
        last_accessed_at: new Date(),
      },
      include: {
        book: {
          include: {
            publicInfo: true,
            bookThemes: { include: { theme: true } },
          },
        },
      },
    })
    cacheManager.invalidateTags([`user:${userId}:books`, `user:${userId}:graph`])
    return result
  }

  async update(userId: number, idOrBookId: number, data: { status?: string; currentPage?: number }) {
    const result = await prisma.userBook.updateMany({
      where: {
        user_id: userId,
        OR: [{ id: idOrBookId }, { book_id: idOrBookId }],
      },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.currentPage !== undefined && { current_page: data.currentPage }),
        last_accessed_at: new Date(),
      },
    })
    cacheManager.invalidateTags([`user:${userId}:books`, `user:${userId}:graph`])
    return result
  }

  async delete(userId: number, idOrBookId: number) {
    const userBook = await prisma.userBook.findFirst({
      where: {
        user_id: userId,
        OR: [{ id: idOrBookId }, { book_id: idOrBookId }],
      },
    })

    const bookId = userBook ? userBook.book_id : idOrBookId

    // 1. Excluir flashcards vinculados ao livro ou às anotações do livro para este usuário
    await prisma.flashcard.deleteMany({
      where: {
        user_id: userId,
        OR: [
          { book_id: bookId },
          { annotation: { book_id: bookId } },
        ],
      },
    })

    // 2. Excluir anotações do usuário vinculadas a este livro
    await prisma.annotation.deleteMany({
      where: {
        user_id: userId,
        book_id: bookId,
      },
    })

    // 3. Excluir o registro de userBook
    const result = await prisma.userBook.deleteMany({
      where: {
        user_id: userId,
        OR: [{ id: idOrBookId }, { book_id: idOrBookId }],
      },
    })
    cacheManager.invalidateUser(userId)
    return result
  }

  async recordAccess(userId: number, idOrBookId: number) {
    const result = await prisma.userBook.updateMany({
      where: {
        user_id: userId,
        OR: [{ id: idOrBookId }, { book_id: idOrBookId }],
      },
      data: { last_accessed_at: new Date() },
    })
    cacheManager.invalidateTags([`user:${userId}:books`, `user:${userId}:graph`])
    return result
  }

  async registerUploadedBook(
    userId: number,
    data: {
      title: string
      author?: string
      summary?: string
      coverPath?: string
      filePath?: string
      fileType?: string
      status?: string
      currentPage?: number
    }
  ) {
    const sanitizedTitle = (data.title || 'Sem título').trim().slice(0, 30)

    const book = await prisma.book.create({
      data: {
        title: sanitizedTitle,
        file_path: data.filePath || `${Date.now()}.${data.fileType || 'epub'}`,
        cover_path: data.coverPath,
        file_type: data.fileType || 'epub',
        ...(data.author
          ? { publicInfo: { create: { author: data.author, summary: data.summary } } }
          : {}),
      },
    })

    const userBook = await prisma.userBook.create({
      data: {
        user_id: userId,
        book_id: book.id,
        status: data.status || 'LENDO',
        current_page: data.currentPage || 1,
        last_accessed_at: new Date(),
      },
      include: {
        book: {
          include: {
            publicInfo: true,
            bookThemes: { include: { theme: true } },
          },
        },
      },
    })
    cacheManager.invalidateTags([`user:${userId}:books`, `user:${userId}:graph`])
    return userBook
  }

  async setThemes(userId: number, idOrBookId: number, themeIds: number[]) {
    const userBook = await prisma.userBook.findFirst({
      where: {
        user_id: userId,
        OR: [{ id: idOrBookId }, { book_id: idOrBookId }],
      },
    })

    if (!userBook) {
      throw new Error('Livro não encontrado para o usuário')
    }

    await prisma.bookTheme.deleteMany({
      where: { book_id: userBook.book_id },
    })

    if (themeIds && themeIds.length > 0) {
      const validThemes = await prisma.theme.findMany({
        where: { id: { in: themeIds.map(Number) } },
        select: { id: true },
      })

      if (validThemes.length > 0) {
        await prisma.bookTheme.createMany({
          data: validThemes.map((t) => ({
            book_id: userBook.book_id,
            theme_id: t.id,
          })),
          skipDuplicates: true,
        })
      }
    }

    const updated = await prisma.userBook.findUnique({
      where: { id: userBook.id },
      include: {
        book: {
          include: {
            publicInfo: true,
            bookThemes: { include: { theme: true } },
          },
        },
      },
    })
    cacheManager.invalidateTags([`user:${userId}:books`, `user:${userId}:graph`])
    return updated
  }

  async addTheme(userId: number, idOrBookId: number, themeId: number) {
    const userBook = await prisma.userBook.findFirst({
      where: {
        user_id: userId,
        OR: [{ id: idOrBookId }, { book_id: idOrBookId }],
      },
    })

    if (!userBook) {
      throw new Error('Livro não encontrado para o usuário')
    }

    await prisma.bookTheme.upsert({
      where: {
        book_id_theme_id: {
          book_id: userBook.book_id,
          theme_id: Number(themeId),
        },
      },
      create: {
        book_id: userBook.book_id,
        theme_id: Number(themeId),
      },
      update: {},
    })

    const updated = await prisma.userBook.findUnique({
      where: { id: userBook.id },
      include: {
        book: {
          include: {
            publicInfo: true,
            bookThemes: { include: { theme: true } },
          },
        },
      },
    })
    cacheManager.invalidateTags([`user:${userId}:books`, `user:${userId}:graph`])
    return updated
  }

  async removeTheme(userId: number, idOrBookId: number, themeId: number) {
    const userBook = await prisma.userBook.findFirst({
      where: {
        user_id: userId,
        OR: [{ id: idOrBookId }, { book_id: idOrBookId }],
      },
    })

    if (!userBook) {
      throw new Error('Livro não encontrado para o usuário')
    }

    await prisma.bookTheme.deleteMany({
      where: {
        book_id: userBook.book_id,
        theme_id: Number(themeId),
      },
    })

    const updated = await prisma.userBook.findUnique({
      where: { id: userBook.id },
      include: {
        book: {
          include: {
            publicInfo: true,
            bookThemes: { include: { theme: true } },
          },
        },
      },
    })
    cacheManager.invalidateTags([`user:${userId}:books`, `user:${userId}:graph`])
    return updated
  }
}

export const userBookService = new UserBookService()


