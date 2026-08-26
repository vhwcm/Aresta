export interface BookThemeItem {
  id: number
  name: string
  color?: string
  description?: string
}

export interface UserBookItem {
  userBookId: number
  bookId: number
  title: string
  coverPath?: string
  filePath?: string
  status: 'QUERO_LER' | 'LENDO' | 'LIDO' | 'ABANDONADO' | string
  currentPage: number
  lastAccessedAt?: string
  themes?: BookThemeItem[]
}

export interface GraphNode {
  id: number
  name: string
  color: string
  description?: string
  books?: UserBookItem[]
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
  id: number
  source: number | GraphNode
  target: number | GraphNode
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}
