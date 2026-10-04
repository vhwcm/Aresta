import type { IBookDocument, BookMetadata, PageData, INavigableDocument } from '~/interfaces/reader/IBookDocument'
import type { ReadingPosition, TocEntry } from '~/interfaces/reader/IBookDocument'
import { readerProfiler } from '~/utils/readerProfiler'
import { setupPdfJs, getPdfDocumentParams } from '~/utils/pdfjsSetup'
import { PdfPageGeometry } from '~/utils/reader/pdf/pdfPageGeometry'
import { normalizePdfToc } from '~/utils/reader/toc/tocNormalizer'

export class PdfDocumentAdapter implements IBookDocument, INavigableDocument {
  readonly type = 'pdf' as const
  private _pdfDocument: unknown = null
  private _defaultAspectRatio = 0.707
  private _metadata: BookMetadata = { title: '' }
  private _totalPages = 0
  private _isLoaded = false
  private _geometry: PdfPageGeometry | null = null
  private _indexRefinedListeners = new Set<() => void>()
  private _activeRenderTasks = new Map<any, any>()

  get metadata(): BookMetadata {
    return this._metadata
  }

  get totalPages(): number {
    return this._totalPages
  }

  get isLoaded(): boolean {
    return this._isLoaded
  }

  getAspectRatio(pageNumber?: number): number {
    if (pageNumber && this._pdfDocument) {
      if (!this._geometry) {
        this._geometry = new PdfPageGeometry(this._pdfDocument, this._defaultAspectRatio || 0.707)
      }
      return this._geometry.getAspectRatio(pageNumber)
    }
    return this._defaultAspectRatio || 0.707
  }

  setFontSize(_fontSize: number, currentPage = 1): number {
    return currentPage
  }

  async load(source: File | ArrayBuffer, fileName?: string, _initialFontSize?: number, _initialFontFamily?: string, _coverUrl?: string): Promise<void> {
    const pdfjsLib = await readerProfiler.measureAsync('4.1. Importação Dinâmica do PDF.js', async () => {
      return await setupPdfJs()
    }, 'parse')

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
      const loadingTask = pdfjsLib.getDocument(getPdfDocumentParams(typedArray))
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
        coverUrl: _coverUrl,
      }
    }, 'parse', { pages: this._totalPages })

    if (this._totalPages > 0) {
      try {
        const firstPage = await pdfDoc.getPage(1)
        const vp = firstPage.getViewport({ scale: 1.0 })
        this._defaultAspectRatio = vp.width / Math.max(1, vp.height)
      } catch {
        this._defaultAspectRatio = 0.707
      }

      this._geometry = new PdfPageGeometry(pdfDoc, this._defaultAspectRatio)
      this._geometry.loadPageGeometry(1).catch(() => {})
      this._geometry.preloadAllInIdle(1, () => {
        this._notifyIndexRefined()
      })
    }

    this._isLoaded = true
  }

  async getPage(pageNumber: number, targetWidth?: number, targetHeight?: number): Promise<PageData> {
    if (!this._pdfDocument) throw new Error('PDF não carregado')

    const pdfDoc = this._pdfDocument as import('pdfjs-dist').PDFDocumentProxy
    const pdfPage = await pdfDoc.getPage(pageNumber)

    const baseViewport = pdfPage.getViewport({ scale: 1.0 })
    const baseWidth = baseViewport.width
    const baseHeight = baseViewport.height
    const aspectRatio = baseWidth / Math.max(1, baseHeight)

    // Renderização nativa 1:1 calculada exatamente para o tamanho do display e DPR (incluindo zoom do navegador até 4x).
    // Isso elimina distorção de fase, serrilhamento e o efeito de letras alternando entre negrito e fino.
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 4) : 1
    let scale: number
    let offsetX = 0
    let offsetY = 0

    if (targetWidth && targetWidth > 0 && targetHeight && targetHeight > 0) {
      const scaleX = (targetWidth * dpr) / baseWidth
      const scaleY = (targetHeight * dpr) / baseHeight
      scale = Math.min(scaleX, scaleY)
      const renderedW = (baseWidth * scale) / dpr
      const renderedH = (baseHeight * scale) / dpr
      if (targetWidth > renderedW) {
        offsetX = Math.round(((targetWidth - renderedW) / 2) * dpr)
      }
      if (targetHeight > renderedH) {
        offsetY = Math.round(((targetHeight - renderedH) / 2) * dpr)
      }
    } else if (targetWidth && targetWidth > 0) {
      scale = (targetWidth * dpr) / baseWidth
    } else if (targetHeight && targetHeight > 0) {
      scale = (targetHeight * dpr) / baseHeight
    } else {
      scale = Math.max(2.0, dpr * 2.0)
    }

    const viewport = pdfPage.getViewport({ scale, offsetX, offsetY })

    const pageData: PageData = {
      width: viewport.width,
      height: viewport.height,
      aspectRatio,
      render: async (ctx: CanvasRenderingContext2D): Promise<void> => {
        const canvas = ctx.canvas
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // Cancela qualquer renderTask em andamento para esta mesma página no PDF.js
        const existingTask = this._activeRenderTasks.get(pdfPage)
        if (existingTask) {
          try {
            existingTask.cancel()
            await existingTask.promise
          } catch {
            // Ignora cancelamento prévio
          }
        }

        const renderTask = (pdfPage.render as any)({
          canvasContext: ctx,
          canvas,
          viewport,
          intent: 'display',
        })

        this._activeRenderTasks.set(pdfPage, renderTask)
        try {
          await renderTask.promise
        } catch (err: any) {
          if (err?.name === 'RenderingCancelledException') {
            return
          }
          throw err
        } finally {
          if (this._activeRenderTasks.get(pdfPage) === renderTask) {
            this._activeRenderTasks.delete(pdfPage)
          }
        }
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
    const pdfjsLib = await setupPdfJs()
    const pdfDoc = this._pdfDocument as import('pdfjs-dist').PDFDocumentProxy
    const pdfPage = await pdfDoc.getPage(pageNumber)

    const baseViewport = pdfPage.getViewport({ scale: 1.0 })
    const baseWidth = baseViewport.width
    const baseHeight = baseViewport.height

    let cssScale: number
    let offsetX = 0
    let offsetY = 0

    if (targetWidth && targetWidth > 0 && targetHeight && targetHeight > 0) {
      const scaleX = targetWidth / baseWidth
      const scaleY = targetHeight / baseHeight
      cssScale = Math.min(scaleX, scaleY)
      const renderedW = baseWidth * cssScale
      const renderedH = baseHeight * cssScale
      if (targetWidth > renderedW) {
        offsetX = Math.round((targetWidth - renderedW) / 2)
      }
      if (targetHeight > renderedH) {
        offsetY = Math.round((targetHeight - renderedH) / 2)
      }
    } else if (targetWidth && targetWidth > 0) {
      cssScale = targetWidth / baseWidth
    } else if (targetHeight && targetHeight > 0) {
      cssScale = targetHeight / baseHeight
    } else {
      cssScale = 1.0
    }

    const viewport = pdfPage.getViewport({ scale: cssScale })

    container.innerHTML = ''

    // Cria contêiner dedicado para a camada oficial .textLayer do PDF.js
    const textLayerDiv = document.createElement('div')
    textLayerDiv.className = 'textLayer'
    textLayerDiv.style.width = `${Math.round(viewport.width)}px`
    textLayerDiv.style.height = `${Math.round(viewport.height)}px`
    textLayerDiv.style.setProperty('--scale-factor', `${cssScale}`)
    textLayerDiv.style.setProperty('--total-scale-factor', `${cssScale}`)

    if (offsetX > 0) {
      textLayerDiv.style.left = `${offsetX}px`
    }
    if (offsetY > 0) {
      textLayerDiv.style.top = `${offsetY}px`
    }

    container.appendChild(textLayerDiv)

    const textContent = await pdfPage.getTextContent()

    if (pdfjsLib.TextLayer) {
      const textLayer = new pdfjsLib.TextLayer({
        textContentSource: textContent,
        container: textLayerDiv,
        viewport,
      })
      await textLayer.render()
    } else if (typeof (pdfjsLib as any).renderTextLayer === 'function') {
      await (pdfjsLib as any).renderTextLayer({
        textContentSource: textContent,
        container: textLayerDiv,
        viewport,
      }).promise
    }
  }

  async getToc(): Promise<TocEntry[]> {
    if (!this._pdfDocument) return []
    const pdfDoc = this._pdfDocument as any
    if (typeof pdfDoc.getOutline !== 'function') return []

    try {
      const outline = await pdfDoc.getOutline()
      if (!outline || !Array.isArray(outline) || outline.length === 0) return []

      return await normalizePdfToc(outline, async (dest) => {
        try {
          let explicitDest = dest
          if (typeof dest === 'string' && typeof pdfDoc.getDestination === 'function') {
            explicitDest = await pdfDoc.getDestination(dest)
          }
          if (Array.isArray(explicitDest) && explicitDest[0]) {
            const ref = explicitDest[0]
            if (typeof ref === 'object' && typeof pdfDoc.getPageIndex === 'function') {
              const pageIndex = await pdfDoc.getPageIndex(ref)
              return pageIndex + 1
            } else if (typeof ref === 'number') {
              return ref + 1
            }
          } else if (typeof explicitDest === 'number') {
            return explicitDest + 1
          }
        } catch {
          /* fallback */
        }
        return 1
      })
    } catch {
      return []
    }
  }

  getTotalUnits(): number {
    return this.totalPages || 1
  }

  positionToUnit(p: ReadingPosition): number {
    if (p.kind === 'pdf') {
      return Math.max(1, Math.min(p.page, this.totalPages || 1))
    }
    return 1
  }

  unitToPosition(unit: number): ReadingPosition {
    const page = Math.max(1, Math.min(Math.floor(unit), this.totalPages || 1))
    return {
      kind: 'pdf',
      page
    }
  }

  onIndexRefined(cb: () => void): () => void {
    this._indexRefinedListeners.add(cb)
    return () => {
      this._indexRefinedListeners.delete(cb)
    }
  }

  private _notifyIndexRefined(): void {
    for (const listener of this._indexRefinedListeners) {
      try {
        listener()
      } catch {
        /* ignorar */
      }
    }
  }

  destroy(): void {
    for (const task of this._activeRenderTasks.values()) {
      try {
        task?.cancel?.()
      } catch {}
    }
    this._activeRenderTasks.clear()

    if (this._geometry) {
      this._geometry.cancelPreload()
      this._geometry = null
    }
    this._indexRefinedListeners.clear()

    if (this._pdfDocument) {
      const pdfDoc = this._pdfDocument as any
      pdfDoc.destroy?.()
      this._pdfDocument = null
    }
    this._isLoaded = false
  }
}
