import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/error.middleware.js';
import { CreateNodeInput, UpdateNodeInput } from '../schemas/graph.schema.js';

export class GraphService {
  async getUnifiedGraph(userId: number) {
    // 1. Buscar todos os temas globais com hierarquia e livros vinculados
    const themes = await prisma.theme.findMany({
      orderBy: { id: 'asc' },
      include: {
        parentHierarchies: true,
        childHierarchies: true,
        bookThemes: true,
      },
    });

    // 2. Buscar todos os livros com informações públicas
    const books = await prisma.book.findMany({
      orderBy: { id: 'asc' },
      include: {
        publicInfo: true,
        bookThemes: true,
      },
    });

    // 3. Buscar todas as hierarquias de temas
    const hierarchies = await prisma.themeHierarchy.findMany();

    // 4. Montar nós de Temas
    const themeNodes = themes.map((t) => ({
      id: `theme-${t.id}`,
      rawId: t.id,
      type: 'theme' as const,
      name: t.name,
      color: t.color || '#E57B55',
      description: t.description || '',
      bookCount: t.bookThemes.length,
      isRoot: false,
    }));

    // 5. Montar nós de Livros (com título truncado em 10 caracteres se maior)
    const bookNodes = books.map((b) => {
      const truncatedName = b.title.length > 10 ? `${b.title.slice(0, 10)}...` : b.title;
      return {
        id: `book-${b.id}`,
        rawId: b.id,
        type: 'book' as const,
        name: truncatedName,
        fullTitle: b.title,
        author: b.publicInfo?.author || 'Autor Desconhecido',
        summary: b.publicInfo?.summary || null,
        coverPath: b.cover_path || null,
        filePath: b.file_path,
        color: '#3B82F6',
        isRoot: false,
      };
    });

    // 6. Montar Arestas:
    // - Hierarquia de temas (parent -> child)
    const hierarchyEdges = hierarchies.map((h) => ({
      id: `hierarchy-${h.id}`,
      source: `theme-${h.parent_theme_id}`,
      target: `theme-${h.child_theme_id}`,
      type: 'theme-hierarchy' as const,
    }));

    // - Vínculos Livro <-> Tema
    const allBookThemes = await prisma.bookTheme.findMany();
    const bookThemeEdges = allBookThemes.map((bt) => ({
      id: `book-theme-${bt.book_id}-${bt.theme_id}`,
      source: `theme-${bt.theme_id}`,
      target: `book-${bt.book_id}`,
      type: 'book-theme' as const,
    }));

    return {
      nodes: [...themeNodes, ...bookNodes],
      edges: [...hierarchyEdges, ...bookThemeEdges],
    };
  }

  async getThemeBooks(themeId: number) {
    const theme = await prisma.theme.findUnique({
      where: { id: themeId },
      include: {
        bookThemes: {
          include: {
            book: {
              include: {
                publicInfo: true,
              },
            },
          },
        },
      },
    });

    if (!theme) {
      throw new AppError(`Tema não encontrado: ${themeId}`, 404);
    }

    return theme.bookThemes.map((bt) => ({
      id: bt.book.id,
      title: bt.book.title,
      author: bt.book.publicInfo?.author || 'Autor Desconhecido',
      summary: bt.book.publicInfo?.summary || null,
      coverPath: bt.book.cover_path,
      filePath: bt.book.file_path,
    }));
  }

  async getThemeAnnotations(themeId: number, userId: number) {
    const annotations = await prisma.annotation.findMany({
      where: {
        user_id: userId,
        annotationThemes: {
          some: { theme_id: themeId },
        },
      },
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
      orderBy: { created_at: 'desc' },
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
    }));
  }

  async createTheme(input: CreateNodeInput) {
    const created = await prisma.theme.create({
      data: {
        name: input.name,
        color: input.color || '#E57B55',
        description: input.description || null,
      },
    });

    return {
      id: created.id,
      name: created.name,
      color: created.color,
      description: created.description,
      createdAt: created.created_at,
    };
  }

  async updateTheme(themeId: number, input: UpdateNodeInput) {
    const existing = await prisma.theme.findUnique({
      where: { id: themeId },
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
      name: updated.name,
      color: updated.color,
      description: updated.description,
      createdAt: updated.created_at,
    };
  }

  async deleteTheme(themeId: number) {
    const existing = await prisma.theme.findUnique({
      where: { id: themeId },
    });

    if (!existing) {
      throw new AppError('Tema não encontrado.', 404);
    }

    await prisma.theme.delete({
      where: { id: themeId },
    });

    return true;
  }

  async createHierarchy(parentThemeId: number, childThemeId: number) {
    if (parentThemeId === childThemeId) {
      throw new AppError('Não é possível conectar um tema a ele mesmo.', 400);
    }

    const parent = await prisma.theme.findUnique({ where: { id: parentThemeId } });
    const child = await prisma.theme.findUnique({ where: { id: childThemeId } });

    if (!parent || !child) {
      throw new AppError('Um ou ambos os temas não foram encontrados.', 404);
    }

    const hierarchy = await prisma.themeHierarchy.upsert({
      where: {
        parent_theme_id_child_theme_id: {
          parent_theme_id: parentThemeId,
          child_theme_id: childThemeId,
        },
      },
      update: {},
      create: {
        parent_theme_id: parentThemeId,
        child_theme_id: childThemeId,
      },
    });

    return hierarchy;
  }

  async deleteHierarchy(parentThemeId: number, childThemeId: number) {
    const hierarchy = await prisma.themeHierarchy.findUnique({
      where: {
        parent_theme_id_child_theme_id: {
          parent_theme_id: parentThemeId,
          child_theme_id: childThemeId,
        },
      },
    });

    if (!hierarchy) {
      throw new AppError('Hierarquia não encontrada.', 404);
    }

    await prisma.themeHierarchy.delete({
      where: { id: hierarchy.id },
    });

    return true;
  }

  async linkBookToTheme(bookId: number, themeId: number) {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    const theme = await prisma.theme.findUnique({ where: { id: themeId } });

    if (!book || !theme) {
      throw new AppError('Livro ou Tema não encontrado.', 404);
    }

    await prisma.bookTheme.upsert({
      where: {
        book_id_theme_id: {
          book_id: bookId,
          theme_id: themeId,
        },
      },
      update: {},
      create: {
        book_id: bookId,
        theme_id: themeId,
      },
    });

    return { success: true };
  }

  async unlinkBookFromTheme(bookId: number, themeId: number) {
    const bookTheme = await prisma.bookTheme.findUnique({
      where: {
        book_id_theme_id: {
          book_id: bookId,
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
}
