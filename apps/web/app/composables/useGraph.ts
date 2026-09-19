import { ref } from 'vue'
import type { GraphData, GraphEdge, BookItem, AnnotationThemeItem } from '~/interfaces/graph'
import { useAuth } from '~/composables/useAuth'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'
import { annotationRepo } from '~/adapters/database/repositories/AnnotationRepository'
import { noteRepo } from '~/adapters/database/repositories/NoteRepository'
import { canvasRepo } from '~/adapters/database/repositories/CanvasRepository'
import { drawingNoteRepo } from '~/adapters/database/repositories/DrawingNoteRepository'
import { linkRepo } from '~/adapters/database/repositories/LinkRepository'
import { buildLocalGraph } from '~/utils/buildLocalGraph'
import { loadGraphMeta, saveGraphMeta } from '~/utils/graphMeta'

const sharedGraphData = ref<GraphData>({ nodes: [], edges: [] })
const sharedLoading = ref(false)
const sharedError = ref<string | null>(null)

export const resetGraphMemory = () => {
  sharedGraphData.value = { nodes: [], edges: [] }
  sharedLoading.value = false
  sharedError.value = null
}

const toNodeId = (type: string, id: number | string) => {
  const raw = String(id)
  return raw.startsWith(`${type}-`) ? raw : `${type}-${raw}`
}

const numericId = (value: number | string | undefined | null) => {
  if (value === undefined || value === null) return NaN
  const raw = String(value).replace(/^(book-|theme-|note-|canvas-|annotation-|folder-)/, '')
  return Number(raw)
}

export const useGraph = () => {
  const graphData = sharedGraphData
  const loading = sharedLoading
  const error = sharedError
  const auth = useAuth()

  const fetchGraph = async () => {
    if (!auth.isLoggedIn.value) {
      graphData.value = { nodes: [], edges: [] }
      loading.value = false
      return
    }

    if (!graphData.value.nodes || graphData.value.nodes.length === 0) {
      loading.value = true
    }
    error.value = null
    try {
      const [books, annotations, notes, canvases, drawingNotes, links] = await Promise.all([
        bookRepo.getAll().catch(() => []),
        annotationRepo.getAll().catch(() => []),
        noteRepo.getAll().catch(() => []),
        canvasRepo.getAll().catch(() => []),
        drawingNoteRepo.getAll().catch(() => []),
        linkRepo.getAll().catch(() => []),
      ])
      const meta = loadGraphMeta()
      const assembled = buildLocalGraph({
        books,
        annotations,
        notes,
        canvases,
        drawingNotes,
        links,
        extraThemes: meta.themes,
        extraEdges: meta.edges,
      })

      const currentEdges = graphData.value?.edges || []
      const assembledKeys = new Set(assembled.edges.map((edge) => `${String(edge.source)}---${String(edge.target)}`))
      const activeIds = new Set(assembled.nodes.map((node) => String(node.id)))
      for (const edge of currentEdges) {
        const key = `${String(edge.source)}---${String(edge.target)}`
        const reverse = `${String(edge.target)}---${String(edge.source)}`
        if (!assembledKeys.has(key) && !assembledKeys.has(reverse) && activeIds.has(String(edge.source)) && activeIds.has(String(edge.target))) {
          assembled.edges.push(edge)
        }
      }

      graphData.value = assembled
    } catch (e: any) {
      console.error('Erro ao carregar dados do Grafo:', e)
      error.value = 'Falha ao carregar o Mapa Mental.'
    } finally {
      loading.value = false
    }
  }

  const fetchThemeBooks = async (themeId: number): Promise<BookItem[]> => {
    try {
      const books = await bookRepo.getAll()
      return books
        .filter((book) => (book.themes || []).some((theme) => Number(theme.id) === Number(themeId)))
        .map((book) => ({
          id: Number(book.bookId || book.id),
          title: book.title,
          author: book.author || undefined,
          coverPath: book.coverPath || null,
          filePath: book.filePath || undefined,
          themes: book.themes || [],
        }))
    } catch (e: any) {
      console.error(`Erro ao buscar livros do tema ${themeId}:`, e)
      return []
    }
  }

  const fetchThemeAnnotations = async (themeId: number): Promise<AnnotationThemeItem[]> => {
    try {
      const annotations = await annotationRepo.getAll({ themeId })
      return annotations.map(mapAnnotation)
    } catch (e: any) {
      console.error(`Erro ao buscar anotações do tema ${themeId}:`, e)
      return []
    }
  }

  const fetchBookAnnotations = async (bookId: number): Promise<AnnotationThemeItem[]> => {
    try {
      const annotations = await annotationRepo.getAll({ bookId })
      return annotations.map(mapAnnotation)
    } catch (e: any) {
      console.error(`Erro ao buscar anotações do livro ${bookId}:`, e)
      return []
    }
  }

  const createLooseAnnotation = async (
    bookId: number,
    note: string,
    themeIds: number[] = []
  ): Promise<AnnotationThemeItem> => {
    const books = await bookRepo.getAll()
    const book = books.find((item) => Number(item.bookId || item.id) === Number(bookId))
    const themes = (book?.themes || []).filter((theme) => themeIds.includes(Number(theme.id)))
    const created = await annotationRepo.save({
      id: Date.now(),
      bookId,
      cfi: '',
      note,
      bookTitle: book?.title,
      bookCover: book?.coverPath || undefined,
      themes,
    })
    await fetchGraph()
    return mapAnnotation(created)
  }

  const createNode = async (
    nameOrPayload: string | { name?: string; label?: string; color?: string; description?: string },
    colorParam = '#E57B55',
    descriptionParam = ''
  ) => {
    const rawName = typeof nameOrPayload === 'string'
      ? nameOrPayload
      : (nameOrPayload?.name || nameOrPayload?.label || '')
    const color = typeof nameOrPayload === 'object' && nameOrPayload.color ? nameOrPayload.color : colorParam
    const description = typeof nameOrPayload === 'object' && nameOrPayload.description ? nameOrPayload.description : descriptionParam

    const name = (rawName || '').trim()
    if (!name) {
      throw new Error('Nome do nó/tema é obrigatório')
    }
    if (name.length > 30) {
      throw new Error('O nome do tema deve ter no máximo 30 caracteres')
    }

    const meta = loadGraphMeta()
    const existing = meta.themes.find((theme) => theme.name.trim().toLowerCase() === name.toLowerCase())
    if (existing) {
      await fetchGraph()
      return {
        id: toNodeId('theme', existing.id),
        rawId: existing.id,
        name: existing.name,
        color: existing.color || color,
        description: existing.description || description,
        type: 'theme' as const,
      }
    }

    const newTheme = {
      id: Date.now(),
      name,
      color,
      description,
    }
    meta.themes.push(newTheme)
    saveGraphMeta(meta)
    await fetchGraph()
    return {
      id: toNodeId('theme', newTheme.id),
      rawId: newTheme.id,
      name,
      color,
      description,
      type: 'theme' as const,
    }
  }

  const updateNode = async (id: number | string, name: string, color?: string, description?: string) => {
    const trimmed = name !== undefined ? name.trim() : ''
    if (name !== undefined) {
      if (!trimmed) {
        throw new Error('Nome do tema não pode ser vazio')
      }
      if (trimmed.length > 30) {
        throw new Error('O nome do tema deve ter no máximo 30 caracteres')
      }
    }

    const themeId = numericId(id)
    const meta = loadGraphMeta()
    const index = meta.themes.findIndex((theme) => Number(theme.id) === themeId)
    if (index !== -1) {
      meta.themes[index] = {
        ...meta.themes[index]!,
        name: trimmed || meta.themes[index]!.name,
        color: color || meta.themes[index]!.color,
        description: description !== undefined ? description : meta.themes[index]!.description,
      }
      saveGraphMeta(meta)
    }

    const books = await bookRepo.getAll()
    for (const book of books) {
      const themes = book.themes || []
      if (!themes.some((theme) => Number(theme.id) === themeId)) continue
      await bookRepo.save({
        ...book,
        themes: themes.map((theme) => Number(theme.id) === themeId
          ? { ...theme, name: trimmed || theme.name, color: color || theme.color }
          : theme),
      })
    }

    const annotations = await annotationRepo.getAll()
    for (const annotation of annotations) {
      const themes = annotation.themes || []
      if (!themes.some((theme) => Number(theme.id) === themeId)) continue
      await annotationRepo.save({
        ...annotation,
        themes: themes.map((theme) => Number(theme.id) === themeId
          ? { ...theme, name: trimmed || theme.name, color: color || theme.color }
          : theme),
      })
    }

    await fetchGraph()
    return graphData.value.nodes.find((node) => String(node.rawId) === String(themeId) || String(node.id) === String(id))
  }

  const deleteNode = async (id: number | string) => {
    const themeId = numericId(id)
    const meta = loadGraphMeta()
    meta.themes = meta.themes.filter((theme) => Number(theme.id) !== themeId)
    meta.edges = meta.edges.filter((edge) => String(edge.source) !== String(id) && String(edge.target) !== String(id)
      && String(edge.source) !== toNodeId('theme', themeId) && String(edge.target) !== toNodeId('theme', themeId))
    saveGraphMeta(meta)

    const books = await bookRepo.getAll()
    for (const book of books) {
      const themes = book.themes || []
      if (!themes.some((theme) => Number(theme.id) === themeId)) continue
      await bookRepo.save({
        ...book,
        themes: themes.filter((theme) => Number(theme.id) !== themeId),
      })
    }

    const annotations = await annotationRepo.getAll()
    for (const annotation of annotations) {
      const themes = annotation.themes || []
      if (!themes.some((theme) => Number(theme.id) === themeId)) continue
      await annotationRepo.save({
        ...annotation,
        themes: themes.filter((theme) => Number(theme.id) !== themeId),
      })
    }

    await fetchGraph()
  }

  const createConnection = async (sourceId: number | string, targetId: number | string, type = 'theme-hierarchy') => {
    const source = String(sourceId)
    const target = String(targetId)
    const conn: GraphEdge = {
      id: `edge-${source}-${target}`,
      source,
      target,
      type,
    }
    const meta = loadGraphMeta()
    const exists = meta.edges.some((edge) =>
      (`${edge.source}---${edge.target}` === `${source}---${target}`)
      || (`${edge.target}---${edge.source}` === `${source}---${target}`)
    )
    if (!exists) {
      meta.edges.push(conn)
      saveGraphMeta(meta)
    }
    await fetchGraph()
    return conn
  }

  const deleteConnection = async (sourceId: number | string, targetId: number | string) => {
    const source = String(sourceId)
    const target = String(targetId)
    const meta = loadGraphMeta()
    meta.edges = meta.edges.filter((edge) => {
      const key = `${edge.source}---${edge.target}`
      const reverse = `${edge.target}---${edge.source}`
      return key !== `${source}---${target}` && reverse !== `${source}---${target}`
    })
    saveGraphMeta(meta)
    await fetchGraph()
  }

  const linkBookToNode = async (nodeId: number | string, bookId: number | string) => {
    const themeId = numericId(nodeId)
    const resolvedBookId = numericId(bookId)
    const books = await bookRepo.getAll()
    const book = books.find((item) => Number(item.bookId) === resolvedBookId || Number(item.id) === resolvedBookId)
    if (!book) return

    const meta = loadGraphMeta()
    const theme = meta.themes.find((item) => Number(item.id) === themeId)
      || graphData.value.nodes.find((node) => node.type === 'theme' && Number(node.rawId) === themeId)

    const nextThemes = [...(book.themes || [])]
    if (!nextThemes.some((item) => Number(item.id) === themeId)) {
      nextThemes.push({
        id: themeId,
        name: theme?.name || `Tema ${themeId}`,
        color: theme?.color || '#E57B55',
      })
      await bookRepo.save({
        ...book,
        themes: nextThemes,
      })
    }
    await fetchGraph()
  }

  const unlinkBookFromNode = async (nodeId: number | string, bookId: number | string) => {
    const themeId = numericId(nodeId)
    const resolvedBookId = numericId(bookId)
    const books = await bookRepo.getAll()
    const book = books.find((item) => Number(item.bookId) === resolvedBookId || Number(item.id) === resolvedBookId)
    if (!book) return
    await bookRepo.save({
      ...book,
      themes: (book.themes || []).filter((theme) => Number(theme.id) !== themeId),
    })
    await fetchGraph()
  }

  return {
    graphData,
    loading,
    error,
    fetchGraph,
    fetchThemeBooks,
    fetchThemeAnnotations,
    fetchBookAnnotations,
    createLooseAnnotation,
    createNode,
    updateNode,
    deleteNode,
    createConnection,
    deleteConnection,
    linkBookToNode,
    unlinkBookFromNode,
    resetGraph: resetGraphMemory,
  }
}

const mapAnnotation = (item: any): AnnotationThemeItem => ({
  id: Number(item.id),
  userId: item.userId ?? item.user_id ?? 0,
  bookId: Number(item.bookId ?? item.book_id ?? 0),
  bookTitle: item.bookTitle || item.book?.title,
  bookCover: item.bookCover || item.book?.cover_path,
  cfi: item.cfi || null,
  selectedText: item.selectedText || item.selected_text || item.text || null,
  note: item.note || item.comment || null,
  color: item.color || null,
  chapterTitle: item.chapterTitle || item.chapter_title || null,
  progress: item.progress ?? null,
  themes: Array.isArray(item.themes) ? item.themes : [],
  createdAt: item.createdAt || item.created_at || '',
})
