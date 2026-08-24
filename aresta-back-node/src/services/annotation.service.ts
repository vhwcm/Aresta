import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/error.middleware.js';
import { CreateAnnotationInput, UpdateAnnotationInput } from '../schemas/annotation.schema.js';

export class AnnotationService {
  async createAnnotation(userId: number, input: CreateAnnotationInput) {
    // 1. Validar se o livro existe
    const book = await prisma.book.findUnique({
      where: { id: input.bookId },
    });

    if (!book) {
      throw new AppError('Livro não encontrado.', 404);
    }

    // 2. Criar a anotação
    const annotation = await prisma.annotation.create({
      data: {
        user_id: userId,
        book_id: input.bookId,
        cfi: input.cfi,
        selected_text: input.selectedText || null,
        note: input.note || null,
        chapter_title: input.chapterTitle || null,
        progress: input.progress ?? 0.0,
      },
    });

    // 3. Vincular temas caso fornecidos
    if (input.themeIds && input.themeIds.length > 0) {
      // Validar temas pertencentes ao usuário
      const validThemes = await prisma.theme.findMany({
        where: {
          id: { in: input.themeIds },
          user_id: userId,
        },
      });

      if (validThemes.length > 0) {
        await prisma.annotationTheme.createMany({
          data: validThemes.map((theme) => ({
            annotation_id: annotation.id,
            theme_id: theme.id,
          })),
        });
      }
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
      whereClause.annotationThemes = {
        some: {
          theme_id: filters.themeId,
        },
      };
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

    return annotations.map((a) => ({
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
      themes: a.annotationThemes.map((at) => ({
        id: at.theme.id,
        name: at.theme.name,
        color: at.theme.color,
      })),
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    }));
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
      themes: a.annotationThemes.map((at) => ({
        id: at.theme.id,
        name: at.theme.name,
        color: at.theme.color,
      })),
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

    const dataToUpdate: any = {};
    if (input.cfi !== undefined) dataToUpdate.cfi = input.cfi;
    if (input.selectedText !== undefined) dataToUpdate.selected_text = input.selectedText;
    if (input.note !== undefined) dataToUpdate.note = input.note;
    if (input.chapterTitle !== undefined) dataToUpdate.chapter_title = input.chapterTitle;
    if (input.progress !== undefined) dataToUpdate.progress = input.progress;

    await prisma.annotation.update({
      where: { id },
      data: dataToUpdate,
    });

    // Re-sincronizar temas se fornecidos
    if (input.themeIds !== undefined) {
      // Remover vínculos anteriores
      await prisma.annotationTheme.deleteMany({
        where: { annotation_id: id },
      });

      if (input.themeIds.length > 0) {
        const validThemes = await prisma.theme.findMany({
          where: {
            id: { in: input.themeIds },
            user_id: userId,
          },
        });

        if (validThemes.length > 0) {
          await prisma.annotationTheme.createMany({
            data: validThemes.map((t) => ({
              annotation_id: id,
              theme_id: t.id,
            })),
          });
        }
      }
    }

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

  async linkToTheme(annotationId: number, themeId: number) {
    const annotation = await prisma.annotation.findUnique({
      where: { id: annotationId },
    });
    const theme = await prisma.theme.findUnique({
      where: { id: themeId },
    });

    if (!annotation || !theme) {
      throw new AppError('Anotação ou Tema não encontrado.', 404);
    }

    await prisma.annotationTheme.upsert({
      where: {
        annotation_id_theme_id: {
          annotation_id: annotationId,
          theme_id: themeId,
        },
      },
      update: {},
      create: {
        annotation_id: annotationId,
        theme_id: themeId,
      },
    });

    return { success: true };
  }

  async unlinkFromTheme(annotationId: number, themeId: number) {
    const link = await prisma.annotationTheme.findUnique({
      where: {
        annotation_id_theme_id: {
          annotation_id: annotationId,
          theme_id: themeId,
        },
      },
    });

    if (!link) {
      throw new AppError('Vínculo entre anotação e tema não encontrado.', 404);
    }

    await prisma.annotationTheme.delete({
      where: { id: link.id },
    });

    return true;
  }
}

