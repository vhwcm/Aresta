import { prisma } from '../config/database'
import { cacheManager } from '../../../shared/cache/cache.manager'

export class GraphService {
  async getGraph(userId: number) {
    const cacheKey = `user:${userId}:graph`
    const cached = cacheManager.get<any>(cacheKey)
    if (cached) {
      return cached
    }

    const annotations = await prisma.annotation.findMany({
      where: { user_id: userId },
      include: {
        annotationThemes: { include: { theme: true } },
        book: true,
        flashcard: true,
      },
    })

    const themes = await prisma.theme.findMany({
      where: { user_id: userId },
      include: {
        parentHierarchies: true,
        childHierarchies: true,
        bookThemes: {
          where: {
            book: {
              userBooks: {
                some: { user_id: userId },
              },
            },
          },
        },
        annotationThemes: { where: { annotation: { user_id: userId } } },
      },
    })

    const themeHierarchies = await prisma.themeHierarchy.findMany({
      where: {
        parentTheme: { user_id: userId },
      },
    })

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

    const allBooks = userBooks.map((ub) => ub.book)


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
        bookCount: t.bookThemes?.length || 0,
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

    // 5. Nós de Pastas (Agrupadores de Notas e Quadros)
    const folderStatsMap = new Map<string, { noteCount: number; canvasCount: number }>()

    for (const n of notes) {
      if (n.folder && n.folder.trim()) {
        const folderName = n.folder.trim()
        const stats = folderStatsMap.get(folderName) || { noteCount: 0, canvasCount: 0 }
        stats.noteCount++
        folderStatsMap.set(folderName, stats)
      }
    }

    for (const c of canvases) {
      if (c.folder && c.folder.trim()) {
        const folderName = c.folder.trim()
        const stats = folderStatsMap.get(folderName) || { noteCount: 0, canvasCount: 0 }
        stats.canvasCount++
        folderStatsMap.set(folderName, stats)
      }
    }

    const folderNodes = Array.from(folderStatsMap.entries()).map(([folderName, stats]) => ({
      id: `folder-${encodeURIComponent(folderName)}`,
      rawId: folderName,
      type: 'folder' as const,
      name: folderName,
      title: folderName,
      description: `${stats.noteCount} nota(s), ${stats.canvasCount} quadro(s)`,
      folder: null,
      tags: [] as string[],
      color: '#F59E0B',
      noteCount: stats.noteCount,
      canvasCount: stats.canvasCount,
      itemCount: stats.noteCount + stats.canvasCount,
    }))

    const allNodes = [
      ...themeNodes,
      ...bookNodes,
      ...folderNodes,
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

    // Arestas: Notas vinculadas à respectiva Pasta
    for (const n of notes) {
      if (n.folder && n.folder.trim()) {
        const folderName = n.folder.trim()
        const folderKey = `folder-${encodeURIComponent(folderName)}`
        addEdge(`edge-nf-${n.id}-${encodeURIComponent(folderName)}`, `note-${n.id}`, folderKey, 'note-folder')
      }
    }

    // Arestas: Quadros vinculados à respectiva Pasta
    for (const c of canvases) {
      if (c.folder && c.folder.trim()) {
        const folderName = c.folder.trim()
        const folderKey = `folder-${encodeURIComponent(folderName)}`
        addEdge(`edge-cf-${c.id}-${encodeURIComponent(folderName)}`, `canvas-${c.id}`, folderKey, 'canvas-folder')
      }
    }

    // Filtrar arestas cujos nós de origem ou destino não estejam nos nós retornados
    const activeNodeIdSet = new Set(allNodes.map((n) => String(n.id)))
    const validEdges = edges.filter(
      (e) => activeNodeIdSet.has(String(e.source)) && activeNodeIdSet.has(String(e.target))
    )

    const result = {
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
        folders: folderNodes.length,
      },
    }

    cacheManager.set(cacheKey, result, 600, [`user:${userId}:graph`, 'graph', `user:${userId}`])
    return result
  }

  async getThemes(userId?: number) {
    return prisma.theme.findMany({
      where: userId ? { user_id: userId } : undefined,
      orderBy: { name: 'asc' },
    })
  }

  async createNode(
    userIdOrName: number | string,
    nameOrColor?: string,
    colorOrDescription?: string,
    descriptionParam?: string
  ) {
    let userId: number
    let name: string
    let color: string
    let description: string

    if (typeof userIdOrName === 'number') {
      userId = userIdOrName
      name = nameOrColor || ''
      color = colorOrDescription || '#E57B55'
      description = descriptionParam || ''
    } else {
      userId = 1
      name = userIdOrName || ''
      color = nameOrColor || '#E57B55'
      description = colorOrDescription || ''
    }

    const trimmed = (name || '').trim()
    if (!trimmed) {
      throw new Error('Nome do nó/tema é obrigatório')
    }
    if (trimmed.length > 30) {
      throw new Error('O nome do tema deve ter no máximo 30 caracteres')
    }

    const theme = await prisma.theme.upsert({
      where: {
        user_id_name: {
          user_id: userId,
          name: trimmed,
        },
      },
      create: {
        user_id: userId,
        name: trimmed,
        color: color || '#E57B55',
        description: description || '',
      },
      update: {
        color: color || '#E57B55',
        ...(description ? { description } : {}),
      },
    })

    cacheManager.invalidateTags([`user:${userId}:graph`, 'graph'])

    return {
      id: theme.id,
      rawId: theme.id,
      name: theme.name,
      color: theme.color,
      description: theme.description,
      type: 'theme',
    }
  }

  async updateNode(
    userIdOrId: number,
    idOrName?: number | string,
    nameOrColor?: string,
    colorOrDesc?: string,
    descriptionParam?: string
  ) {
    let userId: number | undefined
    let id: number
    let name: string | undefined
    let color: string | undefined
    let description: string | undefined

    if (typeof idOrName === 'number') {
      userId = userIdOrId
      id = idOrName
      name = nameOrColor
      color = colorOrDesc
      description = descriptionParam
    } else {
      id = userIdOrId
      name = typeof idOrName === 'string' ? idOrName : undefined
      color = nameOrColor
      description = colorOrDesc
    }

    if (name !== undefined) {
      const trimmed = name.trim()
      if (!trimmed) {
        throw new Error('Nome do tema não pode ser vazio')
      }
      if (trimmed.length > 30) {
        throw new Error('O nome do tema deve ter no máximo 30 caracteres')
      }
    }

    if (userId !== undefined) {
      const existing = await prisma.theme.findFirst({
        where: { id, user_id: userId },
      })
      if (!existing) {
        throw new Error(`Tema não encontrado ou não pertence a este usuário: ${id}`)
      }
    }

    const theme = await prisma.theme.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(color !== undefined ? { color } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    })

    if (userId !== undefined) {
      cacheManager.invalidateTags([`user:${userId}:graph`, 'graph'])
    } else {
      cacheManager.invalidateTag('graph')
    }

    return {
      id: theme.id,
      rawId: theme.id,
      name: theme.name,
      color: theme.color,
      description: theme.description,
      type: 'theme',
    }
  }

  async deleteNode(userIdOrId: number, maybeId?: number) {
    let userId: number | undefined
    let id: number

    if (typeof maybeId === 'number') {
      userId = userIdOrId
      id = maybeId
    } else {
      id = userIdOrId
    }

    if (userId !== undefined) {
      const existing = await prisma.theme.findFirst({
        where: { id, user_id: userId },
      })
      if (!existing) {
        throw new Error(`Tema não encontrado ou não pertence a este usuário: ${id}`)
      }
    }

    await prisma.bookTheme.deleteMany({ where: { theme_id: id } })
    await prisma.annotationTheme.deleteMany({ where: { theme_id: id } })
    await prisma.themeHierarchy.deleteMany({
      where: { OR: [{ parent_theme_id: id }, { child_theme_id: id }] },
    })
    const result = await prisma.theme.delete({
      where: { id },
    })
    if (userId !== undefined) {
      cacheManager.invalidateTags([`user:${userId}:graph`, 'graph'])
    } else {
      cacheManager.invalidateTag('graph')
    }
    return result
  }

  async linkBook(themeId: number, bookId: number) {
    const result = await prisma.bookTheme.upsert({
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
    cacheManager.invalidateTag('graph')
    return result
  }

  async unlinkBook(themeId: number, bookId: number) {
    const result = await prisma.bookTheme.deleteMany({
      where: {
        book_id: bookId,
        theme_id: themeId,
      },
    })
    cacheManager.invalidateTag('graph')
    return result
  }

  async createConnection(sourceId: number, targetId: number) {
    const result = await prisma.themeHierarchy.upsert({
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
    cacheManager.invalidateTag('graph')
    return result
  }

  async deleteConnection(sourceId: number, targetId: number) {
    const result = await prisma.themeHierarchy.deleteMany({
      where: {
        parent_theme_id: sourceId,
        child_theme_id: targetId,
      },
    })
    cacheManager.invalidateTag('graph')
    return result
  }
}

export const graphService = new GraphService()



