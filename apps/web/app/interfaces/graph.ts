export interface BookThemeItem {
  id: number
  name: string
  color?: string | null
  description?: string | null
  emoji?: string | null
}

export interface BookItem {
  id: number
  title: string
  author?: string
  summary?: string | null
  coverPath?: string | null
  filePath?: string
  themes?: BookThemeItem[]
}

export interface UserBookItem {
  userBookId: number
  bookId: number
  title: string
  author?: string
  summary?: string | null
  coverPath?: string | null
  filePath?: string
  status: string
  currentPage: number
  lastAccessedAt?: string | null
  themes?: BookThemeItem[]
}

export interface AnnotationThemeItem {
  id: number
  userId: number
  bookId: number
  bookTitle?: string
  bookCover?: string | null
  cfi?: string | null
  selectedText?: string | null
  note?: string | null
  color?: string | null
  chapterTitle?: string | null
  progress?: number | null
  themes?: BookThemeItem[]
  createdAt: string
}

export type GraphNodeType = 'theme' | 'book' | 'annotation' | 'note' | 'canvas' | 'folder'

export interface GraphNode {
  id: string | number
  rawId?: string | number
  type?: GraphNodeType
  name: string
  title?: string
  fullTitle?: string
  author?: string
  summary?: string | null
  color?: string
  description?: string
  emoji?: string
  coverPath?: string | null
  filePath?: string
  bookCount?: number
  annotationCount?: number
  noteCount?: number
  canvasCount?: number
  itemCount?: number
  books?: any[]
  isRoot?: boolean
  isHtml?: boolean
  isDrawing?: boolean
  // Campos de Anotações do Leitor
  bookId?: number
  bookTitle?: string
  bookCover?: string | null
  cfi?: string | null
  selectedText?: string | null
  note?: string | null
  chapterTitle?: string | null
  progress?: number | null
  // Campos de Notas & Quadros
  folder?: string | null
  tags?: string[]
  createdAt?: string
  updatedAt?: string
  // D3 force fields
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
  // Layout e Animação Flutuante
  baseX?: number
  baseY?: number
  currentX?: number
  currentY?: number
  startX?: number
  startY?: number
  targetX?: number
  targetY?: number
  phaseX?: number
  phaseY?: number
  targetAngle?: number
}

export interface GraphEdge {
  id: string | number
  source: string | number | GraphNode
  target: string | number | GraphNode
  type?: 'root' | 'theme-hierarchy' | 'book-theme' | 'annotation-book' | 'annotation-theme' | 'note-book' | 'note-canvas' | 'note-note' | 'canvas-note' | 'note-theme' | 'note-folder' | 'canvas-folder' | string
}

export interface GraphCounts {
  themes: number
  books: number
  annotations: number
  notes: number
  canvases: number
  folders?: number
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  counts?: GraphCounts
}
