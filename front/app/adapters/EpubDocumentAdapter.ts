import type { IBookDocument, BookMetadata, PageData } from '~/interfaces/reader/IBookDocument'
import { logWarn } from '~/utils/logger'
import { readerProfiler } from '~/utils/readerProfiler'

interface FoliateSection {
  id: string
  load: () => Promise<unknown>
  unload: () => void
  createDocument: () => Promise<Document>
  linear?: boolean
  properties?: string[]
}

interface FoliateEpub {
  metadata: Record<string, unknown>
  sections: (FoliateSection | null)[]
  toc?: unknown[]
  init(): Promise<void>
  getCover(): Promise<Blob | null>
}

interface PageMapping {
  globalPage: number
  sectionIndex: number
  pageIndexInSection: number
  totalPagesInSection: number
}

async function buildEpubLoader(arrayBuffer: ArrayBuffer) {
  const { unzipSync } = await readerProfiler.measureAsync('4.1. Importação Dinâmica fflate', async () => {
    return await import('fflate')
  }, 'parse')

  const zipData = new Uint8Array(arrayBuffer)
  const unzipped = await readerProfiler.measureAsync('4.2. Descompactação EPUB (fflate.unzipSync)', async () => {
    return unzipSync(zipData)
  }, 'parse', { entriesCount: Object.keys(zipData).length })

  const decoder = new TextDecoder()

  function loadText(uri: string): string | null {
    const normalized = uri.startsWith('/') ? uri.slice(1) : uri
    const data = unzipped[normalized]
    if (!data) return null
    return decoder.decode(data)
  }

  function loadBlob(uri: string): Blob | null {
    const normalized = uri.startsWith('/') ? uri.slice(1) : uri
    const data = unzipped[normalized]
    if (!data) return null
    return new Blob([data])
  }

  function getSize(uri: string): number {
    const normalized = uri.startsWith('/') ? uri.slice(1) : uri
    return unzipped[normalized]?.byteLength ?? 0
  }

  return { loadText, loadBlob, getSize, sha1: undefined }
}

function calculateSectionPages(doc: Document | null): number {
  if (!doc || !doc.body) return 1
  if (typeof document === 'undefined' || !document.createElement) {
    const textLen = (doc.body.textContent || '').trim().length
    return Math.max(1, Math.ceil(textLen / 1200))
  }

  try {
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.visibility = 'hidden'
    container.style.left = '-99999px'
    container.style.top = '-99999px'
    container.style.width = '800px'
    container.style.height = '1200px'
    container.style.padding = '48px'
    container.style.boxSizing = 'border-box'
    container.style.columnWidth = '704px'
    container.style.columnGap = '96px'
    container.style.columnFill = 'auto'
    container.style.overflow = 'hidden'
    container.style.fontFamily = 'Georgia, serif'
    container.style.fontSize = '18px'
    container.style.lineHeight = '1.7'
    container.style.wordWrap = 'break-word'
    container.innerHTML = doc.body.innerHTML

    document.body.appendChild(container)
    const scrollW = container.scrollWidth
    document.body.removeChild(container)

    if (scrollW > 800) {
      return Math.max(1, Math.ceil(scrollW / 800))
    }
    const textLen = (doc.body.textContent || '').trim().length
    return Math.max(1, Math.ceil(textLen / 1200))
  } catch {
    const textLen = (doc.body?.textContent || '').trim().length
    return Math.max(1, Math.ceil(textLen / 1200))
  }
}

export class EpubDocumentAdapter implements IBookDocument {
  readonly type = 'epub' as const
  private _epub: FoliateEpub | null = null
  private _metadata: BookMetadata = { title: '' }
  private _totalPages = 0
  private _isLoaded = false
  private _pageCanvases: Map<number, HTMLCanvasElement> = new Map()
  private _sections: FoliateSection[] = []
  private _sectionDocs: Map<number, Document> = new Map()
  private _pageMap: PageMapping[] = []

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
    const foliateModule: any = await readerProfiler.measureAsync('4.3. Importação foliate-js/epub.js', async () => {
      return await import('foliate-js/epub.js')
    }, 'parse')
    const EPUB = foliateModule.EPUB || foliateModule.default || foliateModule.Book

    let arrayBuffer: ArrayBuffer
    let defaultTitle = fileName || 'document.epub'

    if (source instanceof File) {
      arrayBuffer = await source.arrayBuffer()
      defaultTitle = source.name
    } else {
      arrayBuffer = source
    }

    defaultTitle = defaultTitle.replace(/\.epub$/i, '')

    const loader = await buildEpubLoader(arrayBuffer)

    const epub = new EPUB(loader) as FoliateEpub
    await readerProfiler.measureAsync('4.4. foliate-js epub.init()', async () => {
      await epub.init()
    }, 'parse')
    this._epub = epub

    const meta = epub.metadata ?? {}
    this._metadata = {
      title: String(meta['title'] ?? defaultTitle),
      author: meta['creator'] ? String(meta['creator']) : undefined,
      language: meta['language'] ? String(meta['language']) : undefined,
      description: meta['description'] ? String(meta['description']) : undefined,
    }

    this._sections = (epub.sections ?? []).filter(
      (s): s is FoliateSection => s !== null && s.linear !== false,
    )
    this._totalPages = this._sections.length

    this._pageMap = []
    this._sectionDocs.clear()
    let globalPageCounter = 1

    for (let sIdx = 0; sIdx < this._sections.length; sIdx++) {
      const section = this._sections[sIdx]
      let doc: Document | null = null
      if (section) {
        try {
          doc = await section.createDocument()
          this._sectionDocs.set(sIdx, doc)
        } catch (err) {
          logWarn(`[EpubAdapter] Erro ao carregar documento da seção ${sIdx}:`, err)
        }
      }

      const pagesInSection = calculateSectionPages(doc)
      for (let pIdx = 0; pIdx < pagesInSection; pIdx++) {
        this._pageMap.push({
          globalPage: globalPageCounter++,
          sectionIndex: sIdx,
          pageIndexInSection: pIdx,
          totalPagesInSection: pagesInSection,
        })
      }
    }

    this._totalPages = Math.max(1, this._pageMap.length)
    this._isLoaded = true
  }

  async getPage(pageNumber: number): Promise<PageData> {
    if (!this._epub) throw new Error('EPUB não carregado')

    const cached = this._pageCanvases.get(pageNumber)
    if (cached) return this._canvasToPageData(cached)

    const canvas = await this._renderPageToCanvas(pageNumber)
    this._pageCanvases.set(pageNumber, canvas)
    return this._canvasToPageData(canvas)
  }

  async getTextContent(pageNumber: number): Promise<string> {
    if (!this._epub) throw new Error('EPUB não carregado')
    const mapping = this._pageMap[pageNumber - 1]
    if (!mapping) return ''

    const section = this._sections[mapping.sectionIndex]
    if (!section) return ''

    try {
      let doc = this._sectionDocs.get(mapping.sectionIndex)
      if (!doc) {
        doc = await section.createDocument()
        this._sectionDocs.set(mapping.sectionIndex, doc)
      }
      const body = doc.body ?? doc
      const fullText = (body.innerText || body.textContent || '').replace(/\s+/g, ' ').trim()
      if (mapping.totalPagesInSection <= 1) {
        return fullText
      }
      const charsPerPage = Math.ceil(fullText.length / mapping.totalPagesInSection)
      const start = mapping.pageIndexInSection * charsPerPage
      const end = Math.min(fullText.length, start + charsPerPage)
      return fullText.slice(start, end).trim()
    } catch {
      return ''
    }
  }

  async renderTextLayer(pageNumber: number, container: HTMLElement, targetWidth?: number, targetHeight?: number): Promise<void> {
    if (!this._epub) throw new Error('EPUB não carregado')
    const mapping = this._pageMap[pageNumber - 1]
    if (!mapping) return

    const section = this._sections[mapping.sectionIndex]
    if (!section) return

    try {
      let doc = this._sectionDocs.get(mapping.sectionIndex)
      if (!doc) {
        doc = await section.createDocument()
        this._sectionDocs.set(mapping.sectionIndex, doc)
      }

      const baseWidth = 800
      const baseHeight = 1200
      const scaleX = targetWidth && targetWidth > 0 ? targetWidth / baseWidth : 1
      const scaleY = targetHeight && targetHeight > 0 ? targetHeight / baseHeight : 1
      const colOffset = mapping.pageIndexInSection * baseWidth

      container.innerHTML = ''
      const viewportWrapper = document.createElement('div')
      viewportWrapper.className = 'epub-text-layer-viewport'
      viewportWrapper.style.position = 'absolute'
      viewportWrapper.style.top = '0'
      viewportWrapper.style.left = '0'
      viewportWrapper.style.width = `${baseWidth}px`
      viewportWrapper.style.height = `${baseHeight}px`
      viewportWrapper.style.overflow = 'hidden'
      viewportWrapper.style.transform = `scale(${scaleX}, ${scaleY})`
      viewportWrapper.style.transformOrigin = 'top left'
      viewportWrapper.style.pointerEvents = 'auto'

      const contentWrapper = document.createElement('div')
      contentWrapper.className = 'epub-text-layer-content'
      contentWrapper.style.width = `${baseWidth}px`
      contentWrapper.style.height = `${baseHeight}px`
      contentWrapper.style.padding = '48px'
      contentWrapper.style.boxSizing = 'border-box'
      contentWrapper.style.columnWidth = '704px'
      contentWrapper.style.columnGap = '96px'
      contentWrapper.style.columnFill = 'auto'
      contentWrapper.style.fontFamily = 'Georgia, serif'
      contentWrapper.style.fontSize = '18px'
      contentWrapper.style.lineHeight = '1.7'
      contentWrapper.style.wordWrap = 'break-word'
      contentWrapper.style.marginLeft = `-${colOffset}px`
      contentWrapper.style.color = 'transparent'
      contentWrapper.style.userSelect = 'text'
      contentWrapper.style.webkitUserSelect = 'text'
      contentWrapper.innerHTML = doc.body ? doc.body.innerHTML : ''

      viewportWrapper.appendChild(contentWrapper)
      container.appendChild(viewportWrapper)
    } catch (err) {
      logWarn('[EpubAdapter] textLayer render error:', err)
    }
  }

  private async _renderPageToCanvas(pageNumber: number): Promise<HTMLCanvasElement> {
    const baseWidth = 800
    const baseHeight = 1200
    const renderScale = 2.5
    const width = Math.round(baseWidth * renderScale)
    const height = Math.round(baseHeight * renderScale)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.fillStyle = '#faf9f7'
    ctx.fillRect(0, 0, width, height)

    const mapping = this._pageMap[pageNumber - 1]
    if (!mapping) return canvas

    const section = this._sections[mapping.sectionIndex]
    if (!section) return canvas

    try {
      let doc = this._sectionDocs.get(mapping.sectionIndex)
      if (!doc) {
        doc = await section.createDocument()
        this._sectionDocs.set(mapping.sectionIndex, doc)
      }
      const bodyContent = doc.body ? doc.body.innerHTML : ''
      const fontSize = Math.round(18 * renderScale)
      const padding = Math.round(48 * renderScale)
      const columnWidth = Math.round(704 * renderScale)
      const columnGap = Math.round(96 * renderScale)
      const colOffset = mapping.pageIndexInSection * width

      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml"
              style="width:${width}px;height:${height}px;overflow:hidden;background:#faf9f7;margin:0;padding:0;box-sizing:border-box;">
              <div style="width:${width}px;height:${height}px;padding:${padding}px;box-sizing:border-box;column-width:${columnWidth}px;column-gap:${columnGap}px;column-fill:auto;font-family:Georgia,serif;font-size:${fontSize}px;color:#1a1a1a;line-height:1.7;word-wrap:break-word;margin-left:-${colOffset}px;">
                ${bodyContent}
              </div>
            </div>
          </foreignObject>
        </svg>
      `
      const blob = new Blob([svgContent], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      await new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height)
          URL.revokeObjectURL(url)
          resolve()
        }
        img.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('Falha ao renderizar página EPUB'))
        }
        img.src = url
      })
    } catch (err) {
      ctx.fillStyle = '#555'
      ctx.font = '24px Georgia, serif'
      ctx.fillText(`Página ${pageNumber} — erro ao renderizar`, 40, 80)
      logWarn('[EpubAdapter] render error:', err)
    }

    return canvas
  }

  private _canvasToPageData(canvas: HTMLCanvasElement): PageData {
    return {
      width: canvas.width,
      height: canvas.height,
      aspectRatio: canvas.width / canvas.height,
      render: async (ctx: CanvasRenderingContext2D): Promise<void> => {
        ctx.drawImage(canvas, 0, 0, ctx.canvas.width, ctx.canvas.height)
      },
    }
  }

  destroy(): void {
    this._sections.forEach((s) => {
      try { s.unload?.() } catch { /* ignorar erros ao descarregar */ }
    })
    this._pageCanvases.forEach((canvas) => {
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
    })
    this._pageCanvases.clear()
    this._sectionDocs.clear()
    this._pageMap = []
    this._epub = null
    this._sections = []
    this._totalPages = 0
    this._isLoaded = false
  }
}
