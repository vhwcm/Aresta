import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/error.middleware.js';
import { CreateAnnotationInput, UpdateAnnotationInput } from '../schemas/annotation.schema.js';

export class AnnotationService {
  async createAnnotation(userId: number, input: CreateAnnotationInput) {
    // 1. Validar se o livro existe
    const book = await prisma.book.findUnique({
      where: { id: input.bookId },
      include: {
        bookThemes: true,
      },
    });

    if (!book) {
      throw new AppError('Livro não encontrado.', 404);
    }

    // 2. Validar se os temas informados pertencem ao livro
    const allowedThemeIds = new Set(book.bookThemes.map((bt) => bt.theme_id));

    let finalThemeIds: number[] = [];
    if (input.themeIds && input.themeIds.length > 0) {
      for (const tid of input.themeIds) {
        if (!allowedThemeIds.has(tid)) {
          throw new AppError(
            `O tema ID ${tid} não pertence a este livro. Anotações só podem ser vinculadas a temas do livro.`,
            400
          );
        }
      }
      finalThemeIds = input.themeIds;
    } else if (book.bookThemes.length > 0) {
      // Se não foram informados temas específicos, herdar automaticamente os temas do livro
      finalThemeIds = book.bookThemes.map((bt) => bt.theme_id);
    }

    // 3. Criar a anotação (CFI é opcional para notas soltas)
    const annotation = await prisma.annotation.create({
      data: {
        user_id: userId,
        book_id: input.bookId,
        cfi: input.cfi || null,
        selected_text: input.selectedText || null,
        note: input.note || null,
        chapter_title: input.chapterTitle || null,
        progress: input.progress ?? 0.0,
      },
    });

    // 4. Vincular temas
    if (finalThemeIds.length > 0) {
      await prisma.annotationTheme.createMany({
        data: finalThemeIds.map((themeId) => ({
          annotation_id: annotation.id,
          theme_id: themeId,
        })),
      });
    }

    return this.getAnnotationById(userId, annotation.id);
  }

  async getAnnotations(userId: number, filters?: { bookId?: number; themeId?: number }) {
    const whereClause: any = {
      user_id: userId,
    };

    if (filters?.bookId) {
      whereClause.book_id = filters.bookId;
    }

    if (filters?.themeId) {
      whereClause.OR = [
        {
          annotationThemes: {
            some: {
              theme_id: filters.themeId,
            },
          },
        },
        {
          book: {
            bookThemes: {
              some: {
                theme_id: filters.themeId,
              },
            },
          },
        },
      ];
    }

    const annotations = await prisma.annotation.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            cover_path: true,
            bookThemes: {
              include: {
                theme: true,
              },
            },
          },
        },
        annotationThemes: {
          include: {
            theme: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    return annotations.map((a) => {
      const themes =
        a.annotationThemes.length > 0
          ? a.annotationThemes.map((at) => ({
              id: at.theme.id,
              name: at.theme.name,
              color: at.theme.color,
            }))
          : (a.book.bookThemes || []).map((bt) => ({
              id: bt.theme.id,
              name: bt.theme.name,
              color: bt.theme.color,
            }));

      return {
        id: a.id,
        userId: a.user_id,
        bookId: a.book_id,
        bookTitle: a.book.title,
        bookCover: a.book.cover_path,
        cfi: a.cfi,
        selectedText: a.selected_text,
        note: a.note,
        chapterTitle: a.chapter_title,
        progress: a.progress,
        themes,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      };
    });
  }

  async getAnnotationById(userId: number, id: number) {
    const a = await prisma.annotation.findFirst({
      where: { id, user_id: userId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            cover_path: true,
            bookThemes: {
              include: {
                theme: true,
              },
            },
          },
        },
        annotationThemes: {
          include: {
            theme: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    if (!a) {
      throw new AppError('Anotação não encontrada.', 404);
    }

    const themes =
      a.annotationThemes.length > 0
        ? a.annotationThemes.map((at) => ({
            id: at.theme.id,
            name: at.theme.name,
            color: at.theme.color,
          }))
        : (a.book.bookThemes || []).map((bt) => ({
            id: bt.theme.id,
            name: bt.theme.name,
            color: bt.theme.color,
          }));

    return {
      id: a.id,
      userId: a.user_id,
      bookId: a.book_id,
      bookTitle: a.book.title,
      bookCover: a.book.cover_path,
      cfi: a.cfi,
      selectedText: a.selected_text,
      note: a.note,
      chapterTitle: a.chapter_title,
      progress: a.progress,
      themes,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    };
  }

  async updateAnnotation(userId: number, id: number, input: UpdateAnnotationInput) {
    const existing = await prisma.annotation.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      throw new AppError('Anotação não encontrada.', 404);
    }

    if (input.themeIds && input.themeIds.length > 0) {
      const bookThemes = await prisma.bookTheme.findMany({
        where: { book_id: existing.book_id },
        select: { theme_id: true },
      });
      const allowedThemeIds = new Set(bookThemes.map((bt) => bt.theme_id));

      for (const tid of input.themeIds) {
        if (!allowedThemeIds.has(tid)) {
          throw new AppError(
            `O tema ID ${tid} não pertence a este livro. Anotações só podem ser vinculadas a temas do livro.`,
            400
          );
        }
      }
    }

    const dataToUpdate: any = {};
    if (input.note !== undefined) dataToUpdate.note = input.note;
    if (input.chapterTitle !== undefined) dataToUpdate.chapter_title = input.chapterTitle;
    if (input.progress !== undefined) dataToUpdate.progress = input.progress;

    if (input.themeIds !== undefined) {
      await prisma.annotationTheme.deleteMany({
        where: { annotation_id: id },
      });

      if (input.themeIds.length > 0) {
        await prisma.annotationTheme.createMany({
          data: input.themeIds.map((themeId) => ({
            annotation_id: id,
            theme_id: themeId,
          })),
        });
      }
    }

    await prisma.annotation.update({
      where: { id },
      data: dataToUpdate,
    });

    return this.getAnnotationById(userId, id);
  }

  async deleteAnnotation(userId: number, id: number) {
    const existing = await prisma.annotation.findFirst({
      where: { id, user_id: userId },
    });

    if (!existing) {
      throw new AppError('Anotação não encontrada.', 404);
    }

    await prisma.annotation.delete({
      where: { id },
    });

    return true;
  }
}
