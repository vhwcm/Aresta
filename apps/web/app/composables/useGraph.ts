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
import { ThemeManagementService } from '~/services/ThemeManagementService'
import { getCanonicalEdgeId, parseNodeId, normalizeThemeName } from '~/utils/themeIdentity'

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
  const raw = String(value).replace(/^(book-|theme-|note-|canvas-|annotation-|folder-|link-)/, '')
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

      // Elimina reinjeção de arestas antigas em memória (Fix Achado 7)
      graphData.value = assembled
    } catch (e: any) {
      console.error('Erro ao carregar dados do Grafo:', e)
      error.value = 'Falha ao carregar o Mapa Mental.'
    } finally {
      loading.value = false
    }
  }

  const fetchThemeBooks = async (themeId: number | string): Promise<BookItem[]> => {
    try {
      const books = await bookRepo.getAll()
      const rawThemeId = String(themeId).replace(/^theme-/, '')
      return books
        .filter((book) => (book.themes || []).some((t) => String(t.id) === rawThemeId || normalizeThemeName(t.name) === normalizeThemeName(rawThemeId)))
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

  const fetchThemeAnnotations = async (themeId: number | string): Promise<AnnotationThemeItem[]> => {
    try {
      const annotations = await annotationRepo.getAll({ themeId: typeof themeId === 'number' ? themeId : numericId(themeId) })
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

    const created = await ThemeManagementService.createTheme(rawName, color, description)
    await fetchGraph()

    return {
      id: toNodeId('theme', created.id),
      rawId: created.id,
      name: created.name,
      color: created.color || color,
      description: created.description || description,
      type: 'theme' as const,
    }
  }

  const updateNode = async (id: number | string, name: string, color?: string, description?: string) => {
    await ThemeManagementService.renameTheme(id, name, color, description)
    await fetchGraph()
    return graphData.value.nodes.find((node) => String(node.rawId) === String(id) || String(node.id) === String(id) || toNodeId('theme', node.rawId || '') === String(id))
  }

  const deleteNode = async (id: number | string) => {
    await ThemeManagementService.deleteTheme(id)
    await fetchGraph()
  }

  const createConnection = async (sourceId: number | string, targetId: number | string, type = 'theme-hierarchy') => {
    const sourceStr = String(sourceId)
    const targetStr = String(targetId)

    const parsedA = parseNodeId(sourceStr)
    const parsedB = parseNodeId(targetStr)

    // Caso 1: Vínculo com Tema (Nota/Desenho/Quadro/Link/Livro/Anotação ↔ Tema)
    if (parsedA.type === 'theme' && parsedB.type !== 'theme' && parsedB.type !== 'unknown') {
      await ThemeManagementService.linkEntityToTheme(targetStr, sourceStr)
      await fetchGraph()
      return { id: getCanonicalEdgeId(sourceStr, targetStr), source: sourceStr, target: targetStr, type: `${parsedB.type}-theme` }
    } else if (parsedB.type === 'theme' && parsedA.type !== 'theme' && parsedA.type !== 'unknown') {
      await ThemeManagementService.linkEntityToTheme(sourceStr, targetStr)
      await fetchGraph()
      return { id: getCanonicalEdgeId(sourceStr, targetStr), source: sourceStr, target: targetStr, type: `${parsedA.type}-theme` }
    }

    // Caso 2: Vínculo Nota ↔ Livro / Quadro / Nota
    if (parsedA.type === 'note' && (parsedB.type === 'book' || parsedB.type === 'canvas' || parsedB.type === 'note')) {
      const note = await noteRepo.getById(parsedA.rawId) || await noteRepo.getById(sourceStr)
      if (note) {
        const links = [...(note.links || [])]
        const targetType = parsedB.type.toUpperCase() as any
        const targetId = parsedB.type === 'book' ? Number(parsedB.rawId) : parsedB.rawId
        if (!links.some((l) => l.targetType === targetType && String(l.targetId) === String(targetId))) {
          links.push({ targetType, targetId, targetTitle: targetStr })
          await noteRepo.save({ ...note, links })
        }
      }
      await fetchGraph()
      return { id: getCanonicalEdgeId(sourceStr, targetStr), source: sourceStr, target: targetStr, type: `note-${parsedB.type}` }
    }

    // Caso 3: Aresta customizada / pura em graphMeta.edges (ex: Theme ↔ Theme, Livro ↔ Livro)
    const edgeId = getCanonicalEdgeId(sourceStr, targetStr)
    const meta = loadGraphMeta()
    const now = Date.now()

    const existingIndex = meta.edges.findIndex((e) => e.id === edgeId)
    if (existingIndex !== -1) {
      meta.edges[existingIndex] = {
        ...meta.edges[existingIndex]!,
        source: sourceStr,
        target: targetStr,
        type,
        updated_at: now,
        deleted_at: null,
      }
    } else {
      meta.edges.push({
        id: edgeId,
        source: sourceStr,
        target: targetStr,
        type,
        updated_at: now,
        deleted_at: null,
      })
    }

    saveGraphMeta(meta)
    await fetchGraph()
    return { id: edgeId, source: sourceStr, target: targetStr, type }
  }

  const deleteConnection = async (sourceId: number | string, targetId: number | string) => {
    const sourceStr = String(sourceId)
    const targetStr = String(targetId)
    const edgeId = getCanonicalEdgeId(sourceStr, targetStr)
    const meta = loadGraphMeta()
    const now = Date.now()

    let changed = false
    for (const edge of meta.edges) {
      if (edge.id === edgeId || (edge.source === sourceStr && edge.target === targetStr) || (edge.source === targetStr && edge.target === sourceStr)) {
        edge.deleted_at = now
        edge.updated_at = now
        changed = true
      }
    }

    if (changed) {
      saveGraphMeta(meta)
    }

    if (graphData.value?.edges) {
      graphData.value.edges = graphData.value.edges.filter((e) => {
        const s = String(typeof e.source === 'object' ? (e.source as any)?.id : e.source)
        const t = String(typeof e.target === 'object' ? (e.target as any)?.id : e.target)
        return getCanonicalEdgeId(s, t) !== edgeId
      })
    }

    await fetchGraph()
  }

  const unlinkEdge = async (edgeInput: { id?: string; source: any; target: any; type?: string }) => {
    const rawSource = typeof edgeInput.source === 'object' ? edgeInput.source?.id : edgeInput.source
    const rawTarget = typeof edgeInput.target === 'object' ? edgeInput.target?.id : edgeInput.target
    const sourceStr = String(rawSource || '')
    const targetStr = String(rawTarget || '')

    const parsedA = parseNodeId(sourceStr)
    const parsedB = parseNodeId(targetStr)

    // 1. Desconectar de Tema
    if (parsedA.type === 'theme' && parsedB.type !== 'theme' && parsedB.type !== 'unknown') {
      await ThemeManagementService.unlinkEntityFromTheme(targetStr, sourceStr)
      await fetchGraph()
      return
    } else if (parsedB.type === 'theme' && parsedA.type !== 'theme' && parsedA.type !== 'unknown') {
      await ThemeManagementService.unlinkEntityFromTheme(sourceStr, targetStr)
      await fetchGraph()
      return
    }

    // 2. Desconectar Nota ↔ Livro
    if ((parsedA.type === 'note' && parsedB.type === 'book') || (parsedB.type === 'note' && parsedA.type === 'book')) {
      const noteParsed = parsedA.type === 'note' ? parsedA : parsedB
      const bookParsed = parsedA.type === 'book' ? parsedA : parsedB
      const note = await noteRepo.getById(noteParsed.rawId) || await noteRepo.getById(noteParsed.canonicalId)
      if (note && note.links) {
        await noteRepo.save({
          ...note,
          links: note.links.filter((l) => !(l.targetType === 'BOOK' && String(l.targetId) === String(bookParsed.rawId))),
        })
      }
      await fetchGraph()
      return
    }

    // 3. Desconectar Nota ↔ Canvas
    if ((parsedA.type === 'note' && parsedB.type === 'canvas') || (parsedB.type === 'note' && parsedA.type === 'canvas')) {
      const noteParsed = parsedA.type === 'note' ? parsedA : parsedB
      const canvasParsed = parsedA.type === 'canvas' ? parsedA : parsedB
      const note = await noteRepo.getById(noteParsed.rawId) || await noteRepo.getById(noteParsed.canonicalId)
      if (note && note.links) {
        await noteRepo.save({
          ...note,
          links: note.links.filter((l) => !(l.targetType === 'CANVAS' && String(l.targetId) === String(canvasParsed.rawId))),
        })
      }
      await fetchGraph()
      return
    }

    // 4. Desconectar Nota ↔ Nota
    if (parsedA.type === 'note' && parsedB.type === 'note') {
      const noteA = await noteRepo.getById(parsedA.rawId) || await noteRepo.getById(parsedA.canonicalId)
      if (noteA && noteA.links) {
        await noteRepo.save({
          ...noteA,
          links: noteA.links.filter((l) => !(l.targetType === 'NOTE' && String(l.targetId) === String(parsedB.rawId))),
        })
      }
      await fetchGraph()
      return
    }

    // 5. Desconectar aresta em graphMeta (Theme-Theme, etc.)
    await deleteConnection(sourceStr, targetStr)
  }

  const linkBookToNode = async (nodeId: number | string, bookId: number | string) => {
    await ThemeManagementService.linkEntityToTheme(toNodeId('book', bookId), toNodeId('theme', nodeId))
    await fetchGraph()
  }

  const unlinkBookFromNode = async (nodeId: number | string, bookId: number | string) => {
    await ThemeManagementService.unlinkEntityFromTheme(toNodeId('book', bookId), toNodeId('theme', nodeId))
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
    unlinkEdge,
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
