import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/error.middleware.js';
import { CreateUserBookInput, UpdateUserBookInput } from '../schemas/userBook.schema.js';

export class UserBookService {
  async getByUserId(userId: number) {
    const userBooks = await prisma.userBook.findMany({
      where: { user_id: userId },
      include: {
        book: true,
      },
      orderBy: [
        { last_accessed_at: 'desc' },
        { updated_at: 'desc' },
      ],
    });

    return userBooks.map((ub) => ({
      id: ub.id,
      userId: ub.user_id,
      bookId: ub.book_id,
      title: ub.book.title,
      coverPath: ub.book.cover_path,
      filePath: ub.book.file_path,
      status: ub.status,
      currentPage: ub.current_page,
      lastAccessedAt: ub.last_accessed_at,
      createdAt: ub.created_at,
      updatedAt: ub.updated_at,
    }));
  }

  async getById(id: number) {
    const ub = await prisma.userBook.findUnique({
      where: { id },
      include: {
        book: true,
      },
    });

    if (!ub) {
      throw new AppError(`Livro do usuário não encontrado com ID: ${id}`, 404);
    }

    return {
      id: ub.id,
      userId: ub.user_id,
      bookId: ub.book_id,
      title: ub.book.title,
      coverPath: ub.book.cover_path,
      filePath: ub.book.file_path,
      status: ub.status,
      currentPage: ub.current_page,
      lastAccessedAt: ub.last_accessed_at,
      createdAt: ub.created_at,
      updatedAt: ub.updated_at,
    };
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
        book: true,
      },
    });

    return {
      id: saved.id,
      userId: saved.user_id,
      bookId: saved.book_id,
      title: saved.book.title,
      coverPath: saved.book.cover_path,
      filePath: saved.book.file_path,
      status: saved.status,
      currentPage: saved.current_page,
      lastAccessedAt: saved.last_accessed_at,
      createdAt: saved.created_at,
      updatedAt: saved.updated_at,
    };
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
        book: true,
      },
    });

    return {
      id: updated.id,
      userId: updated.user_id,
      bookId: updated.book_id,
      title: updated.book.title,
      coverPath: updated.book.cover_path,
      filePath: updated.book.file_path,
      status: updated.status,
      currentPage: updated.current_page,
      lastAccessedAt: updated.last_accessed_at,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
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
        book: true,
      },
    });

    return {
      id: updated.id,
      userId: updated.user_id,
      bookId: updated.book_id,
      title: updated.book.title,
      coverPath: updated.book.cover_path,
      filePath: updated.book.file_path,
      status: updated.status,
      currentPage: updated.current_page,
      lastAccessedAt: updated.last_accessed_at,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
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

