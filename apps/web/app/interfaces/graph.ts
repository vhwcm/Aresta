export interface BookThemeItem {
  id: number
  name: string
  color?: string
  description?: string
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
  chapterTitle?: string | null
  progress?: number | null
  themes?: BookThemeItem[]
  createdAt: string
}

export interface GraphNode {
  id: string | number
  rawId?: number
  type?: 'theme' | 'book'
  name: string
  title?: string
  fullTitle?: string
  author?: string
  summary?: string | null
  color?: string
  description?: string
  coverPath?: string | null
  filePath?: string
  bookCount?: number
  books?: any[]
  isRoot?: boolean
  // D3 force fields
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

export interface GraphEdge {
  id: string | number
  source: string | number | GraphNode
  target: string | number | GraphNode
  type?: 'root' | 'theme-hierarchy' | 'book-theme' | string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}
