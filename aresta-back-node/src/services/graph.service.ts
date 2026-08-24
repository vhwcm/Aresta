import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/error.middleware.js';
import { CreateNodeInput, UpdateNodeInput } from '../schemas/graph.schema.js';

export class GraphService {
  async getGraphForUser(userId: number) {
    // 1. Buscar todos os temas (nós) do usuário
    const themes = await prisma.theme.findMany({
      where: { user_id: userId },
      orderBy: { id: 'asc' },
      include: {
        bookThemes: {
          include: {
            userBook: {
              include: {
                book: true,
              },
            },
          },
        },
        annotationThemes: {
          include: {
            annotation: {
              include: {
                book: true,
              },
            },
          },
        },
      },
    });

    const nodes = themes.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color || '#E57B55',
      description: t.description || '',
      books: t.bookThemes.map((bt) => ({
        userBookId: bt.userBook.id,
        bookId: bt.userBook.book_id,
        title: bt.userBook.book.title,
        coverPath: bt.userBook.book.cover_path,
        status: bt.userBook.status,
        currentPage: bt.userBook.current_page,
      })),
      annotations: t.annotationThemes.map((at) => ({
        id: at.annotation.id,
        bookId: at.annotation.book_id,
        bookTitle: at.annotation.book.title,
        cfi: at.annotation.cfi,
        selectedText: at.annotation.selected_text,
        note: at.annotation.note,
        chapterTitle: at.annotation.chapter_title,
        progress: at.annotation.progress,
        createdAt: at.annotation.created_at,
      })),
    }));

    // 2. Buscar todas as conexões (arestas) do usuário
    const connections = await prisma.themeConnection.findMany({
      where: { user_id: userId },
      orderBy: { id: 'asc' },
    });

    const edges = connections.map((c) => ({
      id: c.id,
      source: c.source_theme_id,
      target: c.target_theme_id,
    }));

    return {
      nodes,
      edges,
    };
  }

  async createTheme(userId: number, input: CreateNodeInput) {
    const created = await prisma.theme.create({
      data: {
        user_id: userId,
        name: input.name,
        color: input.color || '#E57B55',
        description: input.description || null,
      },
    });

    return {
      id: created.id,
      userId: created.user_id,
      name: created.name,
      color: created.color,
      description: created.description,
      createdAt: created.created_at,
    };
  }

  async updateTheme(themeId: number, userId: number, input: UpdateNodeInput) {
    const existing = await prisma.theme.findFirst({
      where: { id: themeId, user_id: userId },
    });

    if (!existing) {
      throw new AppError('Tema não encontrado.', 404);
    }

    const dataToUpdate: any = {};
    if (input.name !== undefined) dataToUpdate.name = input.name;
    if (input.color !== undefined) dataToUpdate.color = input.color;
    if (input.description !== undefined) dataToUpdate.description = input.description;

    const updated = await prisma.theme.update({
      where: { id: themeId },
      data: dataToUpdate,
    });

    return {
      id: updated.id,
      userId: updated.user_id,
      name: updated.name,
      color: updated.color,
      description: updated.description,
      createdAt: updated.created_at,
    };
  }

  async deleteTheme(themeId: number, userId: number) {
    const existing = await prisma.theme.findFirst({
      where: { id: themeId, user_id: userId },
    });

    if (!existing) {
      throw new AppError('Tema não encontrado.', 404);
    }

    await prisma.theme.delete({
      where: { id: themeId },
    });

    return true;
  }

  async createConnection(userId: number, sourceId: number, targetId: number) {
    if (sourceId === targetId) {
      throw new AppError('Não é possível conectar um tema a ele mesmo.', 400);
    }

    const sourceTheme = await prisma.theme.findFirst({
      where: { id: sourceId, user_id: userId },
    });
    const targetTheme = await prisma.theme.findFirst({
      where: { id: targetId, user_id: userId },
    });

    if (!sourceTheme || !targetTheme) {
      throw new AppError('Um ou ambos os temas não foram encontrados.', 404);
    }

    const connection = await prisma.themeConnection.upsert({
      where: {
        user_id_source_theme_id_target_theme_id: {
          user_id: userId,
          source_theme_id: sourceId,
          target_theme_id: targetId,
        },
      },
      update: {},
      create: {
        user_id: userId,
        source_theme_id: sourceId,
        target_theme_id: targetId,
      },
    });

    return {
      id: connection.id,
      userId: connection.user_id,
      sourceThemeId: connection.source_theme_id,
      targetThemeId: connection.target_theme_id,
      createdAt: connection.created_at,
    };
  }

  async deleteConnectionBetweenThemes(userId: number, sourceId: number, targetId: number) {
    const connection = await prisma.themeConnection.findFirst({
      where: {
        user_id: userId,
        OR: [
          { source_theme_id: sourceId, target_theme_id: targetId },
          { source_theme_id: targetId, target_theme_id: sourceId },
        ],
      },
    });

    if (!connection) {
      throw new AppError('Conexão não encontrada.', 404);
    }

    await prisma.themeConnection.delete({
      where: { id: connection.id },
    });

    return true;
  }

  async linkBookToTheme(userBookId: number, themeId: number) {
    const userBook = await prisma.userBook.findUnique({
      where: { id: userBookId },
    });
    const theme = await prisma.theme.findUnique({
      where: { id: themeId },
    });

    if (!userBook || !theme) {
      throw new AppError('Livro ou Tema não encontrado.', 404);
    }

    await prisma.bookTheme.upsert({
      where: {
        user_book_id_theme_id: {
          user_book_id: userBookId,
          theme_id: themeId,
        },
      },
      update: {},
      create: {
        user_book_id: userBookId,
        theme_id: themeId,
      },
    });

    return { success: true };
  }

  async unlinkBookFromTheme(userBookId: number, themeId: number) {
    const bookTheme = await prisma.bookTheme.findUnique({
      where: {
        user_book_id_theme_id: {
          user_book_id: userBookId,
          theme_id: themeId,
        },
      },
    });

    if (!bookTheme) {
      throw new AppError('Vínculo entre livro e tema não encontrado.', 404);
    }

    await prisma.bookTheme.delete({
      where: { id: bookTheme.id },
    });

    return true;
  }

  async linkAnnotationToTheme(annotationId: number, themeId: number) {
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

  async unlinkAnnotationFromTheme(annotationId: number, themeId: number) {
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

