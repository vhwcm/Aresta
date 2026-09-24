import type { IBookDocument, BookMetadata, PageData } from '~/interfaces/reader/IBookDocument'
import { readerProfiler } from '~/utils/readerProfiler'
import { setupPdfJs, getPdfDocumentParams } from '~/utils/pdfjsSetup'

export class PdfDocumentAdapter implements IBookDocument {
  readonly type = 'pdf' as const
  private _pdfDocument: unknown = null
  private _defaultAspectRatio = 0.707
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

  getAspectRatio(_pageNumber?: number): number {
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

        await (pdfPage.render as any)({
          canvasContext: ctx,
          canvas,
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

  destroy(): void {
    if (this._pdfDocument) {
      const pdfDoc = this._pdfDocument as any
      pdfDoc.destroy?.()
      this._pdfDocument = null
    }
    this._isLoaded = false
  }
}
