import { prisma } from '../config/database'

export class GraphService {
  async getGraph(userId: number) {
    const annotations = await prisma.annotation.findMany({
      where: { user_id: userId },
      include: { annotationThemes: { include: { theme: true } }, flashcard: true },
    })

    const themes = await prisma.theme.findMany({
      include: {
        parentHierarchies: true,
        childHierarchies: true,
        bookThemes: true,
        annotationThemes: { where: { annotation: { user_id: userId } } },
      },
    })

    const userBooks = await prisma.userBook.findMany({
      where: { user_id: userId },
      include: {
        book: {
          include: {
            bookThemes: { include: { theme: true } },
          },
        },
      },
    })

    const userBookThemeIds = new Set<number>()
    for (const ub of userBooks) {
      for (const bt of ub.book.bookThemes || []) {
        userBookThemeIds.add(bt.theme_id)
      }
    }

    const annotationThemeIds = new Set<number>()
    for (const ann of annotations) {
      for (const at of ann.annotationThemes || []) {
        annotationThemeIds.add(at.theme_id)
      }
    }

    // Filtrar temas: devem estar anexados a ao menos um livro ou ao menos uma nota
    const activeThemes = themes.filter((t) => {
      const hasUserBook = userBookThemeIds.has(t.id)
      const hasBook = hasUserBook || (userBooks.length === 0 && Boolean(t.bookThemes && t.bookThemes.length > 0))
      const hasNote = annotationThemeIds.has(t.id) || Boolean(t.annotationThemes && t.annotationThemes.length > 0)
      return hasBook || hasNote
    })

    const activeThemeIds = new Set(activeThemes.map((t) => t.id))

    const themeNodes = activeThemes.map((t) => ({
      id: t.id,
      rawId: t.id,
      type: 'theme' as const,
      name: t.name,
      color: t.color || '#E57B55',
      description: t.description || '',
      bookCount: t.bookThemes?.filter((bt) => userBooks.some((ub) => ub.book.id === bt.book_id)).length || (userBooks.length === 0 ? t.bookThemes?.length || 0 : 0),
      annotationCount: t.annotationThemes?.length || 0,
    }))

    const bookNodes = userBooks.map((ub) => ({
      id: `book-${ub.book.id}`,
      rawId: ub.book.id,
      type: 'book' as const,
      name: ub.book.title,
      title: ub.book.title,
      fullTitle: ub.book.title,
      coverPath: ub.book.cover_path,
      filePath: ub.book.file_path,
    }))

    const edges: Array<{ id: string; source: any; target: any; type?: string }> = []

    for (const t of activeThemes) {
      for (const ch of t.childHierarchies || []) {
        if (activeThemeIds.has(ch.child_theme_id)) {
          edges.push({
            id: `edge-th-${t.id}-${ch.child_theme_id}`,
            source: t.id,
            target: ch.child_theme_id,
            type: 'theme-hierarchy',
          })
        }
      }
    }

    for (const ub of userBooks) {
      for (const bt of ub.book.bookThemes || []) {
        if (activeThemeIds.has(bt.theme_id)) {
          edges.push({
            id: `edge-bt-${ub.book.id}-${bt.theme_id}`,
            source: `book-${ub.book.id}`,
            target: bt.theme_id,
            type: 'book-theme',
          })
        }
      }
    }

    return {
      nodes: [...themeNodes, ...bookNodes],
      edges,
      annotations,
      themes: activeThemes,
    }
  }

  async getThemes() {
    return prisma.theme.findMany({ orderBy: { name: 'asc' } })
  }

  async createNode(name: string, color = '#E57B55', description = '') {
    const theme = await prisma.theme.upsert({
      where: { name: name.trim() },
      create: {
        name: name.trim(),
        color: color || '#E57B55',
        description: description || '',
      },
      update: {
        color: color || '#E57B55',
        ...(description ? { description } : {}),
      },
    })

    return {
      id: theme.id,
      rawId: theme.id,
      name: theme.name,
      color: theme.color,
      description: theme.description,
      type: 'theme',
    }
  }

  async updateNode(id: number, name?: string, color?: string, description?: string) {
    const theme = await prisma.theme.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(color ? { color } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    })

    return {
      id: theme.id,
      rawId: theme.id,
      name: theme.name,
      color: theme.color,
      description: theme.description,
      type: 'theme',
    }
  }

  async deleteNode(id: number) {
    return prisma.theme.delete({
      where: { id },
    })
  }
}

export const graphService = new GraphService()

