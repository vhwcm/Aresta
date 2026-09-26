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
  readonly type: 'pdf' | 'epub' | 'didactic'
  readonly metadata: BookMetadata
  readonly totalPages: number
  readonly isLoaded: boolean
  readonly fontSize?: number
  readonly fontFamily?: string

  getAspectRatio?(pageNumber?: number): number
  setFontSize?(fontSize: number, currentPage?: number): number
  setFontFamily?(fontFamily: string, currentPage?: number): number
  setPageDimensions?(width: number, height: number, currentPage?: number): number
  load(source: File | ArrayBuffer, fileName?: string, initialFontSize?: number, initialFontFamily?: string, coverUrl?: string): Promise<void>
  getPage(pageNumber: number, targetWidth?: number, targetHeight?: number): Promise<PageData>
  getTextContent?(pageNumber: number): Promise<string>
  renderTextLayer?(pageNumber: number, container: HTMLElement, targetWidth?: number, targetHeight?: number): Promise<void>
  getSectionCount?(): number
  getPageForSection?(sectionIndex: number): number
  getSectionForPage?(pageNumber: number): number
  renderSectionContinuous?(sectionIndex: number, container: HTMLElement): Promise<void>
  destroy(): void
}
