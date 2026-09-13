import { prisma } from '../config/database'

export class GraphService {
  async getGraph(userId: number) {
    const annotations = await prisma.annotation.findMany({
      where: { user_id: userId },
      include: {
        annotationThemes: { include: { theme: true } },
        book: true,
        flashcard: true,
      },
    })

    const themes = await prisma.theme.findMany({
      include: {
        parentHierarchies: true,
        childHierarchies: true,
        bookThemes: true,
        annotationThemes: { where: { annotation: { user_id: userId } } },
      },
    })

    const themeHierarchies = await prisma.themeHierarchy.findMany()

    const userBooks = await prisma.userBook.findMany({
      where: { user_id: userId },
      include: {
        book: {
          include: {
            publicInfo: true,
            bookThemes: { include: { theme: true } },
          },
        },
      },
    })

    const userBookIds = new Set(userBooks.map((ub) => ub.book.id))
    const referencedBookIds = new Set<number>()
    for (const t of themes) {
      for (const bt of t.bookThemes || []) {
        if (!userBookIds.has(bt.book_id)) {
          referencedBookIds.add(bt.book_id)
        }
      }
    }

    const additionalBooks = referencedBookIds.size > 0
      ? await prisma.book.findMany({
          where: { id: { in: Array.from(referencedBookIds) } },
          include: {
            publicInfo: true,
            bookThemes: { include: { theme: true } },
          },
        })
      : []

    const allBooksMap = new Map<number, any>()
    for (const ub of userBooks) {
      allBooksMap.set(ub.book.id, ub.book)
    }
    for (const b of additionalBooks) {
      if (!allBooksMap.has(b.id)) {
        allBooksMap.set(b.id, b)
      }
    }
    const allBooks = Array.from(allBooksMap.values())


    const notes = await prisma.note.findMany({
      where: { user_id: userId },
      include: {
        noteLinks: true,
      },
    })

    const canvases = await prisma.canvas.findMany({
      where: { user_id: userId },
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

    // Mapear tags de notas que batem com nomes de temas
    const noteThemeIds = new Set<number>()
    const parsedNoteTagsMap = new Map<string, string[]>()
    for (const n of notes) {
      let parsedTags: string[] = []
      try {
        parsedTags = JSON.parse(n.tags || '[]')
      } catch {
        parsedTags = []
      }
      parsedNoteTagsMap.set(n.id, parsedTags)

      for (const tag of parsedTags) {
        const cleanTag = tag.replace(/^#/, '').trim().toLowerCase()
        for (const t of themes) {
          if (t.name.trim().toLowerCase() === cleanTag) {
            noteThemeIds.add(t.id)
          }
        }
      }
    }

    // No Grafo de Conhecimento, todos os temas cadastrados estão disponíveis para visualização e conexão
    const activeThemes = themes
    const activeThemeIds = new Set(activeThemes.map((t) => t.id))

    // 1. Nós de Temas
    const themeNodes = activeThemes.map((t) => {
      const themeLower = t.name.trim().toLowerCase()
      let matchingNotesCount = 0
      for (const [, tags] of parsedNoteTagsMap.entries()) {
        if (tags.some((tag) => tag.replace(/^#/, '').trim().toLowerCase() === themeLower)) {
          matchingNotesCount++
        }
      }

      return {
        id: t.id,
        rawId: t.id,
        type: 'theme' as const,
        name: t.name,
        title: t.name,
        color: t.color || '#E57B55',
        description: t.description || '',
        bookCount: t.bookThemes?.filter((bt) => userBooks.some((ub) => ub.book.id === bt.book_id)).length || (userBooks.length === 0 ? t.bookThemes?.length || 0 : 0),
        annotationCount: t.annotationThemes?.length || 0,
        noteCount: matchingNotesCount,
      }
    })

    // 2. Nós de Livros
    const bookNodes = allBooks.map((b) => ({
      id: `book-${b.id}`,
      rawId: b.id,
      type: 'book' as const,
      name: b.title,
      title: b.title,
      fullTitle: b.title,
      coverPath: b.cover_path,
      filePath: b.file_path,
      author: b.publicInfo?.author || 'Autor Desconhecido',
      summary: b.publicInfo?.summary || null,
      color: '#3B82F6',
    }))

    // 3. Nós de Notas Livres
    const noteNodes = notes.map((n) => {
      const tags = parsedNoteTagsMap.get(n.id) || []
      const cleanSnippet = n.content
        ? n.content.replace(/[#*`_\[\]]/g, '').trim().substring(0, 60)
        : ''

      return {
        id: `note-${n.id}`,
        rawId: n.id,
        type: 'note' as const,
        name: n.title || 'Nota sem título',
        title: n.title || 'Nota sem título',
        description: cleanSnippet,
        folder: n.folder || null,
        tags,
        color: '#6366F1',
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      }
    })

    // 4. Nós de Quadros (Canvases)
    const canvasNodes = canvases.map((c) => {
      let parsedTags: string[] = []
      try {
        parsedTags = JSON.parse(c.tags || '[]')
      } catch {
        parsedTags = []
      }

      return {
        id: `canvas-${c.id}`,
        rawId: c.id,
        type: 'canvas' as const,
        name: c.title || 'Quadro sem título',
        title: c.title || 'Quadro sem título',
        description: c.description || '',
        folder: c.folder || null,
        tags: parsedTags,
        color: '#10B981',
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }
    })

    const allNodes = [
      ...themeNodes,
      ...bookNodes,
      ...noteNodes,
      ...canvasNodes,
    ]

    const edges: Array<{ id: string; source: any; target: any; type: string }> = []
    const existingPairs = new Set<string>()

    const addEdge = (id: string, source: any, target: any, type: string) => {
      const s = String(source)
      const t = String(target)
      if (s === t) return
      const k1 = `${s}---${t}`
      const k2 = `${t}---${s}`
      if (existingPairs.has(k1) || existingPairs.has(k2)) return
      existingPairs.add(k1)
      existingPairs.add(k2)
      edges.push({ id, source, target, type })
    }

    // Arestas: Hierarquia de Temas
    for (const th of themeHierarchies) {
      if (activeThemeIds.has(th.parent_theme_id) && activeThemeIds.has(th.child_theme_id)) {
        addEdge(`edge-th-${th.parent_theme_id}-${th.child_theme_id}`, th.parent_theme_id, th.child_theme_id, 'theme-hierarchy')
      }
    }

    // Arestas: Livro com Tema
    const processedBookThemePairs = new Set<string>()
    for (const b of allBooks) {
      for (const bt of b.bookThemes || []) {
        if (activeThemeIds.has(bt.theme_id)) {
          const pairKey = `${b.id}-${bt.theme_id}`
          if (!processedBookThemePairs.has(pairKey)) {
            processedBookThemePairs.add(pairKey)
            addEdge(`edge-bt-${b.id}-${bt.theme_id}`, `book-${b.id}`, bt.theme_id, 'book-theme')
          }
        }
      }
    }

    // Arestas: Livreto Didático vinculado ao Livro de Origem
    for (const ann of annotations) {
      if (ann.note && ann.note.includes('didactic_booklet')) {
        try {
          const parsed = JSON.parse(ann.note)
          if (parsed.type === 'didactic_booklet' && parsed.bookletBookId) {
            addEdge(
              `edge-booklet-${ann.book_id}-${parsed.bookletBookId}`,
              `book-${ann.book_id}`,
              `book-${parsed.bookletBookId}`,
              'book-booklet'
            )
          }
        } catch {
          // ignore
        }
      }
    }

    // Arestas: Nota com Livros, Quadros e outras Notas
    for (const n of notes) {
      const noteKey = `note-${n.id}`
      for (const link of n.noteLinks || []) {
        if (link.target_type === 'BOOK') {
          addEdge(`edge-nb-${n.id}-${link.target_id}`, noteKey, `book-${link.target_id}`, 'note-book')
        } else if (link.target_type === 'CANVAS') {
          addEdge(`edge-nc-${n.id}-${link.target_id}`, noteKey, `canvas-${link.target_id}`, 'note-canvas')
        } else if (link.target_type === 'NOTE') {
          addEdge(`edge-nn-${n.id}-${link.target_id}`, noteKey, `note-${link.target_id}`, 'note-note')
        }
      }

      // Embeds em Markdown
      if (n.content) {
        for (const m of n.content.matchAll(/!?\[\[book:(\d+)\]\]/gi)) {
          addEdge(`edge-nb-emb-${n.id}-${m[1]}`, noteKey, `book-${m[1]}`, 'note-book')
        }
        for (const m of n.content.matchAll(/!?\[\[canvas:([a-zA-Z0-9_-]+)\]\]/gi)) {
          addEdge(`edge-nc-emb-${n.id}-${m[1]}`, noteKey, `canvas-${m[1]}`, 'note-canvas')
        }
        for (const m of n.content.matchAll(/!?\[\[note:([a-zA-Z0-9_-]+)\]\]/gi)) {
          addEdge(`edge-nn-emb-${n.id}-${m[1]}`, noteKey, `note-${m[1]}`, 'note-note')
        }
      }

      // Correspondência semântica: Tag da Nota com Nome de Tema Ativo
      const tags = parsedNoteTagsMap.get(n.id) || []
      for (const tag of tags) {
        const cleanTag = tag.replace(/^#/, '').trim().toLowerCase()
        for (const t of activeThemes) {
          if (t.name.trim().toLowerCase() === cleanTag) {
            addEdge(`edge-nt-${n.id}-${t.id}`, noteKey, t.id, 'note-theme')
          }
        }
      }
    }

    // Arestas: Quadro com Notas embutidas
    for (const c of canvases) {
      const canvasKey = `canvas-${c.id}`
      try {
        const parsed = JSON.parse(c.data || '{}')
        if (Array.isArray(parsed.nodes)) {
          for (const node of parsed.nodes) {
            if (node.type === 'note' && node.noteId) {
              addEdge(`edge-cn-${c.id}-${node.noteId}`, canvasKey, `note-${node.noteId}`, 'canvas-note')
            }
          }
        }
      } catch {}
    }

    // Filtrar arestas cujos nós de origem ou destino não estejam nos nós retornados
    const activeNodeIdSet = new Set(allNodes.map((n) => String(n.id)))
    const validEdges = edges.filter(
      (e) => activeNodeIdSet.has(String(e.source)) && activeNodeIdSet.has(String(e.target))
    )

    return {
      nodes: allNodes,
      edges: validEdges,
      annotations,
      themes: activeThemes,
      counts: {
        themes: themeNodes.length,
        books: bookNodes.length,
        annotations: annotations.length,
        notes: noteNodes.length,
        canvases: canvasNodes.length,
      },
    }
  }

  async getThemes() {
    return prisma.theme.findMany({ orderBy: { name: 'asc' } })
  }

  async createNode(name: string, color = '#E57B55', description = '') {
    const trimmed = (name || '').trim()
    if (!trimmed) {
      throw new Error('Nome do nó/tema é obrigatório')
    }
    if (trimmed.length > 30) {
      throw new Error('O nome do tema deve ter no máximo 30 caracteres')
    }

    const theme = await prisma.theme.upsert({
      where: { name: trimmed },
      create: {
        name: trimmed,
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
    if (name !== undefined) {
      const trimmed = name.trim()
      if (!trimmed) {
        throw new Error('Nome do tema não pode ser vazio')
      }
      if (trimmed.length > 30) {
        throw new Error('O nome do tema deve ter no máximo 30 caracteres')
      }
    }

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

  async linkBook(themeId: number, bookId: number) {
    return prisma.bookTheme.upsert({
      where: {
        book_id_theme_id: {
          book_id: bookId,
          theme_id: themeId,
        },
      },
      create: {
        book_id: bookId,
        theme_id: themeId,
      },
      update: {},
    })
  }

  async unlinkBook(themeId: number, bookId: number) {
    return prisma.bookTheme.deleteMany({
      where: {
        book_id: bookId,
        theme_id: themeId,
      },
    })
  }

  async createConnection(sourceId: number, targetId: number) {
    return prisma.themeHierarchy.upsert({
      where: {
        parent_theme_id_child_theme_id: {
          parent_theme_id: sourceId,
          child_theme_id: targetId,
        },
      },
      create: {
        parent_theme_id: sourceId,
        child_theme_id: targetId,
      },
      update: {},
    })
  }

  async deleteConnection(sourceId: number, targetId: number) {
    return prisma.themeHierarchy.deleteMany({
      where: {
        parent_theme_id: sourceId,
        child_theme_id: targetId,
      },
    })
  }
}

export const graphService = new GraphService()


