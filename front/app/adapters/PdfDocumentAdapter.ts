import type { IBookDocument, BookMetadata, PageData } from '~/interfaces/reader/IBookDocument'

export class PdfDocumentAdapter implements IBookDocument {
  readonly type = 'pdf' as const
  private _pdfDocument: unknown = null
  private _metadata: BookMetadata = { title: '' }
  private _totalPages = 0
  private _isLoaded = false

  get metadata(): BookMetadata {
    return this._metadata
  }

  get totalPages(): number {
    return this._totalPages
  }

  get isLoaded(): boolean {
    return this._isLoaded
  }

  async load(file: File): Promise<void> {
    const pdfjsLib = await import('pdfjs-dist')

    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).href
    }

    const arrayBuffer = await file.arrayBuffer()
    const typedArray = new Uint8Array(arrayBuffer)

    const loadingTask = pdfjsLib.getDocument({ data: typedArray })
    this._pdfDocument = await loadingTask.promise

    const pdfDoc = this._pdfDocument as import('pdfjs-dist').PDFDocumentProxy
    this._totalPages = pdfDoc.numPages

    const metadataResult = await pdfDoc.getMetadata()
    const info = metadataResult.info as Record<string, string>
    this._metadata = {
      title: info['Title'] || file.name.replace(/\.pdf$/i, ''),
      author: info['Author'] ?? undefined,
    }

    this._isLoaded = true
  }

  async getPage(pageNumber: number): Promise<PageData> {
    if (!this._pdfDocument) throw new Error('PDF não carregado')

    const pdfDoc = this._pdfDocument as import('pdfjs-dist').PDFDocumentProxy
    const pdfPage = await pdfDoc.getPage(pageNumber)
    const viewport = pdfPage.getViewport({ scale: 1.5 })

    const pageData: PageData = {
      width: viewport.width,
      height: viewport.height,
      aspectRatio: viewport.width / viewport.height,
      render: async (ctx: CanvasRenderingContext2D): Promise<void> => {
        const canvas = ctx.canvas
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        await pdfPage.render({
          canvasContext: ctx as unknown as CanvasRenderingContext2D,
          viewport,
        }).promise
      },
    }

    return pageData
  }

  destroy(): void {
    if (this._pdfDocument) {
      const pdfDoc = this._pdfDocument as import('pdfjs-dist').PDFDocumentProxy
      pdfDoc.destroy()
      this._pdfDocument = null
    }
    this._isLoaded = false
  }
}
