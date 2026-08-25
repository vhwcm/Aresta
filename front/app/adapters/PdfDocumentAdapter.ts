import type { IBookDocument, BookMetadata, PageData } from '~/interfaces/reader/IBookDocument'
import { readerProfiler } from '~/utils/readerProfiler'

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

  async load(source: File | ArrayBuffer, fileName?: string): Promise<void> {
    const pdfjsLib = await readerProfiler.measureAsync('4.1. Importação Dinâmica do PDF.js', async () => {
      return await import('pdfjs-dist')
    }, 'parse')

    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).href
    }

    let arrayBuffer: ArrayBuffer
    let defaultTitle = fileName || 'document.pdf'

    if (source instanceof File) {
      arrayBuffer = await source.arrayBuffer()
      defaultTitle = source.name
    } else {
      arrayBuffer = source
    }

    defaultTitle = defaultTitle.replace(/\.pdf$/i, '')

    const typedArray = new Uint8Array(arrayBuffer)

    await readerProfiler.measureAsync('4.2. PDF.js getDocument & Parse Estrutura', async () => {
      const pdfjsVersion = pdfjsLib.version || '6.1.200'
      const loadingTask = pdfjsLib.getDocument({
        data: typedArray,
        cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/standard_fonts/`,
        enableXfa: false,
      })
      this._pdfDocument = await loadingTask.promise
    }, 'parse', { sizeBytes: typedArray.byteLength })

    const pdfDoc = this._pdfDocument as import('pdfjs-dist').PDFDocumentProxy
    this._totalPages = pdfDoc.numPages

    await readerProfiler.measureAsync('4.3. PDF.js Obter Metadados', async () => {
      const metadataResult = await pdfDoc.getMetadata()
      const info = (metadataResult.info || {}) as Record<string, string>
      this._metadata = {
        title: info['Title'] || defaultTitle,
        author: info['Author'] ?? undefined,
      }
    }, 'parse', { pages: this._totalPages })

    this._isLoaded = true
  }

  async getPage(pageNumber: number): Promise<PageData> {
    if (!this._pdfDocument) throw new Error('PDF não carregado')

    const pdfDoc = this._pdfDocument as import('pdfjs-dist').PDFDocumentProxy
    const pdfPage = await pdfDoc.getPage(pageNumber)

    // Renderiza em altíssima resolução para texto perfeitamente nítido em qualquer densidade de tela (High-DPI / Retina / 4K)
    const baseViewport = pdfPage.getViewport({ scale: 1.0 })
    const baseMaxDim = Math.max(baseViewport.width, baseViewport.height)
    const dpr = typeof window !== 'undefined' ? Math.max(1, window.devicePixelRatio || 1) : 1
    
    // Escala adaptativa: garante no mínimo 3.0x de densidade de pixels para máxima clareza tipográfica
    const targetDim = Math.max(2800, Math.min(4096, baseMaxDim * Math.max(3.0, dpr * 1.75)))
    const scale = Math.max(3.0, targetDim / baseMaxDim)
    const viewport = pdfPage.getViewport({ scale })

    const pageData: PageData = {
      width: viewport.width,
      height: viewport.height,
      aspectRatio: viewport.width / viewport.height,
      render: async (ctx: CanvasRenderingContext2D): Promise<void> => {
        const canvas = ctx.canvas
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        await pdfPage.render({
          canvasContext: ctx as unknown as CanvasRenderingContext2D,
          viewport,
          intent: 'display',
        }).promise
      },
    }

    return pageData
  }

  async getTextContent(pageNumber: number): Promise<string> {
    if (!this._pdfDocument) throw new Error('PDF não carregado')
    const pdfDoc = this._pdfDocument as import('pdfjs-dist').PDFDocumentProxy
    const pdfPage = await pdfDoc.getPage(pageNumber)
    const textContent = await pdfPage.getTextContent()
    return textContent.items
      .map((item: any) => item.str || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  async renderTextLayer(pageNumber: number, container: HTMLElement, targetWidth?: number, targetHeight?: number): Promise<void> {
    if (!this._pdfDocument) throw new Error('PDF não carregado')
    const pdfjsLib = await import('pdfjs-dist')
    const pdfDoc = this._pdfDocument as import('pdfjs-dist').PDFDocumentProxy
    const pdfPage = await pdfDoc.getPage(pageNumber)

    const baseViewport = pdfPage.getViewport({ scale: 1 })
    const scale = targetWidth && targetWidth > 0
      ? targetWidth / baseViewport.width
      : (targetHeight && targetHeight > 0 ? targetHeight / baseViewport.height : 1.5)
    const viewport = pdfPage.getViewport({ scale })

    container.innerHTML = ''
    container.classList.add('textLayer')
    container.style.setProperty('--scale-factor', `${scale}`)
    container.style.setProperty('--total-scale-factor', `${scale}`)
    container.style.width = `${viewport.width}px`
    container.style.height = `${viewport.height}px`

    const textContent = await pdfPage.getTextContent()

    if (pdfjsLib.TextLayer) {
      const textLayer = new pdfjsLib.TextLayer({
        textContentSource: textContent,
        container,
        viewport,
      })
      await textLayer.render()
    } else if (typeof (pdfjsLib as any).renderTextLayer === 'function') {
      await (pdfjsLib as any).renderTextLayer({
        textContentSource: textContent,
        container,
        viewport,
      }).promise
    }
  }

  destroy(): void {
    if (this._pdfDocument) {
      const pdfDoc = this._pdfDocument as any
      pdfDoc.destroy?.()
      this._pdfDocument = null
    }
    this._isLoaded = false
  }
}
