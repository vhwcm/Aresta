import type { LocalAnnotation, LocalBook, LocalCanvasItem, LocalDrawingNote, LocalNote } from '~/adapters/database/types'
import type { GraphData, GraphEdge, GraphNode } from '~/interfaces/graph'

export interface GraphThemeRecord {
  id: number
  name: string
  color?: string | null
  description?: string | null
}

export interface BuildLocalGraphInput {
  books?: LocalBook[]
  annotations?: LocalAnnotation[]
  notes?: LocalNote[]
  canvases?: LocalCanvasItem[]
  drawingNotes?: LocalDrawingNote[]
  extraThemes?: GraphThemeRecord[]
  extraEdges?: GraphEdge[]
}

const DEFAULT_THEME_COLOR = '#E57B55'

const truncateTitle = (title: string, max = 18) => {
  const value = (title || '').trim()
  if (value.length <= max) return value
  return `${value.slice(0, max)}...`
}

const themeNodeId = (id: number | string) => {
  const raw = String(id)
  return raw.startsWith('theme-') ? raw : `theme-${raw}`
}

export const buildLocalGraph = (input: BuildLocalGraphInput = {}): GraphData => {
  const books = input.books || []
  const annotations = input.annotations || []
  const notes = input.notes || []
  const canvases = input.canvases || []
  const drawingNotes = input.drawingNotes || []
  const extraThemes = input.extraThemes || []
  const extraEdges = input.extraEdges || []

  const themeMap = new Map<string, GraphThemeRecord>()
  const upsertTheme = (theme?: { id?: number | string; name?: string; color?: string | null; description?: string | null }) => {
    if (!theme) return
    const numericId = Number(theme.id)
    const name = (theme.name || '').trim()
    if (!name && Number.isNaN(numericId)) return
    const id = Number.isFinite(numericId) && numericId !== 0 ? numericId : Math.abs(hashString(name || String(theme.id)))
    const key = String(id)
    const existing = themeMap.get(key)
    themeMap.set(key, {
      id,
      name: name || existing?.name || `Tema ${id}`,
      color: theme.color || existing?.color || DEFAULT_THEME_COLOR,
      description: theme.description ?? existing?.description ?? null,
    })
    return id
  }

  for (const theme of extraThemes) upsertTheme(theme)
  for (const book of books) {
    for (const theme of book.themes || []) upsertTheme(theme)
  }
  for (const annotation of annotations) {
    for (const theme of annotation.themes || []) upsertTheme(theme)
  }

  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const edgeKeys = new Set<string>()

  const addEdge = (source: string, target: string, type: string, id?: string) => {
    const key = `${source}---${target}`
    const reverse = `${target}---${source}`
    if (edgeKeys.has(key) || edgeKeys.has(reverse)) return
    edgeKeys.add(key)
    edges.push({
      id: id || `${type}-${source}-${target}`,
      source,
      target,
      type,
    })
  }

  for (const theme of themeMap.values()) {
    nodes.push({
      id: themeNodeId(theme.id),
      rawId: theme.id,
      type: 'theme',
      name: theme.name,
      title: theme.name,
      color: theme.color || DEFAULT_THEME_COLOR,
      description: theme.description || undefined,
    })
  }

  for (const book of books) {
    const bookId = Number(book.bookId || book.id)
    const nodeId = `book-${bookId}`
    const title = book.title || 'Livro sem título'
    nodes.push({
      id: nodeId,
      rawId: bookId,
      type: 'book',
      name: truncateTitle(title),
      title,
      fullTitle: title,
      author: book.author || undefined,
      coverPath: book.coverPath || null,
      filePath: book.filePath || undefined,
      color: '#3B82F6',
    })
    for (const theme of book.themes || []) {
      const themeId = upsertTheme(theme)
      if (themeId) addEdge(nodeId, themeNodeId(themeId), 'book-theme')
    }
  }

  for (const annotation of annotations) {
    const annotationId = Number(annotation.id)
    const nodeId = `annotation-${annotationId}`
    const bookId = Number(annotation.bookId)
    nodes.push({
      id: nodeId,
      rawId: annotationId,
      type: 'annotation',
      name: truncateTitle(annotation.selectedText || annotation.note || 'Anotação', 22),
      title: annotation.note || annotation.selectedText || 'Anotação',
      bookId,
      bookTitle: annotation.bookTitle,
      bookCover: annotation.bookCover,
      cfi: annotation.cfi,
      selectedText: annotation.selectedText,
      note: annotation.note,
      chapterTitle: annotation.chapterTitle,
      progress: annotation.progress,
      color: annotation.color || '#F59E0B',
      createdAt: annotation.createdAt,
    })
    if (bookId) addEdge(nodeId, `book-${bookId}`, 'annotation-book')
    for (const theme of annotation.themes || []) {
      const themeId = upsertTheme(theme)
      if (themeId) addEdge(nodeId, themeNodeId(themeId), 'annotation-theme')
    }
  }

  const folders = new Set<string>()
  for (const note of notes) {
    if (note.folder?.trim()) folders.add(note.folder.trim())
  }
  for (const drawing of drawingNotes) {
    if (drawing.folder?.trim()) folders.add(drawing.folder.trim())
  }

  for (const folder of folders) {
    nodes.push({
      id: `folder-${folder}`,
      rawId: folder,
      type: 'folder',
      name: folder,
      title: folder,
      color: '#F59E0B',
    })
  }

  for (const note of notes) {
    const nodeId = `note-${note.id}`
    const isHtml = /<([a-z]+)[^>]*>[\s\S]*?<\/\1>/i.test(note.content || '') || (note.content || '').includes('synthesized-html-container') || (note.content || '').includes('aresta-drawing-synthesis')
    nodes.push({
      id: nodeId,
      rawId: note.id,
      type: 'note',
      isHtml,
      name: truncateTitle(note.title || 'Nota sem título'),
      title: note.title || 'Nota sem título',
      description: note.content ? note.content.slice(0, 140) : undefined,
      folder: note.folder || null,
      tags: note.tags || [],
      color: isHtml ? '#F59E0B' : '#6366F1',
      createdAt: note.createdAt || note.created_at,
      updatedAt: note.updated_at,
    })
    if (note.folder?.trim()) addEdge(nodeId, `folder-${note.folder.trim()}`, 'note-folder')
    for (const tag of note.tags || []) {
      const match = [...themeMap.values()].find((theme) => theme.name.toLowerCase() === tag.toLowerCase())
      if (match) addEdge(nodeId, themeNodeId(match.id), 'note-theme')
    }
    for (const link of note.links || []) {
      if (link.targetType === 'BOOK') addEdge(nodeId, `book-${link.targetId}`, 'note-book')
      if (link.targetType === 'CANVAS') addEdge(nodeId, `canvas-${link.targetId}`, 'note-canvas')
      if (link.targetType === 'NOTE') addEdge(nodeId, `note-${link.targetId}`, 'note-note')
    }
  }

  for (const drawing of drawingNotes) {
    const nodeId = `note-${drawing.id}`
    nodes.push({
      id: nodeId,
      rawId: drawing.id,
      type: 'note',
      isDrawing: true,
      name: truncateTitle(drawing.title || 'Desenho'),
      title: drawing.title || 'Desenho',
      folder: drawing.folder || null,
      tags: drawing.tags || [],
      color: '#8B5CF6',
      createdAt: drawing.createdAt || drawing.created_at,
      updatedAt: drawing.updated_at,
    })
    if (drawing.folder?.trim()) addEdge(nodeId, `folder-${drawing.folder.trim()}`, 'note-folder')
  }

  for (const canvas of canvases) {
    const nodeId = `canvas-${canvas.id}`
    nodes.push({
      id: nodeId,
      rawId: canvas.id,
      type: 'canvas',
      name: truncateTitle(canvas.name || 'Quadro'),
      title: canvas.name || 'Quadro',
      description: canvas.description || undefined,
      color: '#10B981',
      updatedAt: canvas.updated_at,
    })
  }

  const activeIds = new Set(nodes.map((node) => String(node.id)))
  for (const edge of extraEdges) {
    const source = String(typeof edge.source === 'object' ? (edge.source as GraphNode).id : edge.source)
    const target = String(typeof edge.target === 'object' ? (edge.target as GraphNode).id : edge.target)
    if (activeIds.has(source) && activeIds.has(target)) {
      addEdge(source, target, edge.type || 'theme-hierarchy', String(edge.id))
    }
  }

  return {
    nodes,
    edges,
    counts: {
      themes: nodes.filter((n) => n.type === 'theme').length,
      books: nodes.filter((n) => n.type === 'book').length,
      annotations: nodes.filter((n) => n.type === 'annotation').length,
      notes: nodes.filter((n) => n.type === 'note').length,
      canvases: nodes.filter((n) => n.type === 'canvas').length,
      folders: nodes.filter((n) => n.type === 'folder').length,
    },
  }
}

const hashString = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i)
    hash |= 0
  }
  return hash === 0 ? 1 : Math.abs(hash)
}
