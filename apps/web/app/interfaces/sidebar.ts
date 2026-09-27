export interface SidebarTreeItem {
  id: string
  title?: string
  kind?: 'canvas' | 'note' | 'drawing' | 'link' | 'book'
  folder?: string | null
  tags?: string[]
  referenceCount?: number
  bookId?: number
}
