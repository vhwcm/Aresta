export interface PageData {
  width: number
  height: number
  aspectRatio: number
  render(ctx: CanvasRenderingContext2D, viewport?: PageViewport): Promise<void>
}

export interface PageViewport {
  width: number
  height: number
  scale: number
  rotation: number
}

export interface BookMetadata {
  title: string
  author?: string
  language?: string
  coverUrl?: string
  description?: string
  publishedDate?: string
}

export interface IBookDocument {
  readonly type: 'pdf' | 'epub'
  readonly metadata: BookMetadata
  readonly totalPages: number
  readonly isLoaded: boolean

  load(file: File): Promise<void>
  getPage(pageNumber: number): Promise<PageData>
  destroy(): void
}
