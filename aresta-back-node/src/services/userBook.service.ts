import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/error.middleware.js';
import { CreateUserBookInput, UpdateUserBookInput } from '../schemas/userBook.schema.js';

export class UserBookService {
  private mapUserBook(ub: any) {
    const bookThemes = ub.book?.bookThemes || [];
    return {
      id: ub.id,
      userId: ub.user_id,
      bookId: ub.book_id,
      title: ub.book?.title ?? '',
      coverPath: ub.book?.cover_path ?? null,
      filePath: ub.book?.file_path ?? '',
      status: ub.status,
      currentPage: ub.current_page,
      lastAccessedAt: ub.last_accessed_at,
      createdAt: ub.created_at,
      updatedAt: ub.updated_at,
      themes: bookThemes.map((bt: any) => ({
        id: bt.theme.id,
        name: bt.theme.name,
        color: bt.theme.color || '#E57B55',
        description: bt.theme.description || '',
      })),
    };
  }

  async getByUserId(userId: number) {
    const userBooks = await prisma.userBook.findMany({
      where: { user_id: userId },
      include: {
        book: {
          include: {
            bookThemes: {
              include: {
                theme: true,
              },
            },
          },
        },
      },
      orderBy: [
        { last_accessed_at: 'desc' },
        { updated_at: 'desc' },
      ],
    });

    return userBooks.map((ub) => this.mapUserBook(ub));
  }

  async getById(id: number) {
    const ub = await prisma.userBook.findUnique({
      where: { id },
      include: {
        book: {
          include: {
            bookThemes: {
              include: {
                theme: true,
              },
            },
          },
        },
      },
    });

    if (!ub) {
      throw new AppError(`Livro do usuário não encontrado com ID: ${id}`, 404);
    }

    return this.mapUserBook(ub);
  }

  async addUserBook(userId: number, input: CreateUserBookInput) {
    const book = await prisma.book.findUnique({
      where: { id: input.bookId },
    });

    if (!book) {
      throw new AppError('Livro não encontrado.', 404);
    }

    const now = new Date();
    const saved = await prisma.userBook.upsert({
      where: {
        user_id_book_id: {
          user_id: userId,
          book_id: input.bookId,
        },
      },
      update: {
        status: input.status || 'QUERO_LER',
        current_page: input.currentPage ?? 0,
        last_accessed_at: input.lastAccessedAt ?? now,
      },
      create: {
        user_id: userId,
        book_id: input.bookId,
        status: input.status || 'QUERO_LER',
        current_page: input.currentPage ?? 0,
        last_accessed_at: input.lastAccessedAt ?? now,
      },
      include: {
        book: {
          include: {
            bookThemes: {
              include: {
                theme: true,
              },
            },
          },
        },
      },
    });

    return this.mapUserBook(saved);
  }

  async updateUserBook(id: number, input: UpdateUserBookInput) {
    const existing = await prisma.userBook.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Livro da estante não encontrado.', 404);
    }

    const dataToUpdate: any = {
      last_accessed_at: input.lastAccessedAt !== undefined ? input.lastAccessedAt : new Date(),
    };
    if (input.status !== undefined) dataToUpdate.status = input.status;
    if (input.currentPage !== undefined) dataToUpdate.current_page = input.currentPage;

    const updated = await prisma.userBook.update({
      where: { id },
      data: dataToUpdate,
      include: {
        book: {
          include: {
            bookThemes: {
              include: {
                theme: true,
              },
            },
          },
        },
      },
    });

    return this.mapUserBook(updated);
  }

  async recordAccess(id: number, userId: number) {
    const existing = await prisma.userBook.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      throw new AppError('Livro da estante não encontrado.', 404);
    }

    const updated = await prisma.userBook.update({
      where: { id },
      data: {
        last_accessed_at: new Date(),
      },
      include: {
        book: {
          include: {
            bookThemes: {
              include: {
                theme: true,
              },
            },
          },
        },
      },
    });

    return this.mapUserBook(updated);
  }

  async setThemes(userBookId: number, _userId: number, themeIds: number[]) {
    const userBook = await prisma.userBook.findUnique({
      where: { id: userBookId },
    });

    if (!userBook) {
      throw new AppError('Livro não encontrado na estante do usuário.', 404);
    }

    await prisma.$transaction([
      prisma.bookTheme.deleteMany({
        where: { book_id: userBook.book_id },
      }),
      ...themeIds.map((tId) =>
        prisma.bookTheme.create({
          data: {
            book_id: userBook.book_id,
            theme_id: tId,
          },
        })
      ),
    ]);

    return this.getById(userBookId);
  }

  async addTheme(userBookId: number, _userId: number, themeId: number) {
    const userBook = await prisma.userBook.findUnique({
      where: { id: userBookId },
    });

    if (!userBook) {
      throw new AppError('Livro não encontrado na estante do usuário.', 404);
    }

    await prisma.bookTheme.upsert({
      where: {
        book_id_theme_id: {
          book_id: userBook.book_id,
          theme_id: themeId,
        },
      },
      update: {},
      create: {
        book_id: userBook.book_id,
        theme_id: themeId,
      },
    });

    return this.getById(userBookId);
  }

  async removeTheme(userBookId: number, _userId: number, themeId: number) {
    const userBook = await prisma.userBook.findUnique({
      where: { id: userBookId },
    });

    if (!userBook) {
      throw new AppError('Livro não encontrado na estante do usuário.', 404);
    }

    await prisma.bookTheme.deleteMany({
      where: {
        book_id: userBook.book_id,
        theme_id: themeId,
      },
    });

    return this.getById(userBookId);
  }

  async deleteUserBook(id: number, userId: number) {
    const existing = await prisma.userBook.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      throw new AppError('Livro não encontrado na estante do usuário.', 404);
    }

    await prisma.userBook.delete({
      where: { id },
    });

    return true;
  }

  async deleteByBookId(userId: number, bookId: number) {
    const existing = await prisma.userBook.findUnique({
      where: {
        user_id_book_id: {
          user_id: userId,
          book_id: bookId,
        },
      },
    });

    if (!existing) {
      throw new AppError('Livro não encontrado na estante do usuário.', 404);
    }

    await prisma.userBook.delete({
      where: { id: existing.id },
    });

    return true;
  }
}
