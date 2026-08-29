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

const EPUB_TYPOGRAPHY_STYLES = `
  .epub-text-layer-content h1, .epub-text-layer-content .chapter-title, .epub-text-layer-content .title, .epub-text-layer-content [class*="title"] {
    font-size: 2em !important;
    font-weight: 700 !important;
    line-height: 1.25 !important;
    margin-top: 0.8em !important;
    margin-bottom: 0.5em !important;
    display: block !important;
  }
  .epub-text-layer-content h2, .epub-text-layer-content .chapter-subtitle, .epub-text-layer-content .subtitle, .epub-text-layer-content [class*="subtitle"] {
    font-size: 1.5em !important;
    font-weight: 700 !important;
    line-height: 1.3 !important;
    margin-top: 0.75em !important;
    margin-bottom: 0.4em !important;
    display: block !important;
  }
  .epub-text-layer-content h3 {
    font-size: 1.25em !important;
    font-weight: 600 !important;
    line-height: 1.35 !important;
    margin-top: 0.7em !important;
    margin-bottom: 0.35em !important;
    display: block !important;
  }
  .epub-text-layer-content h4 {
    font-size: 1.1em !important;
    font-weight: 600 !important;
    line-height: 1.4 !important;
    margin-top: 0.6em !important;
    margin-bottom: 0.3em !important;
    display: block !important;
  }
  .epub-text-layer-content h5 {
    font-size: 1em !important;
    font-weight: 600 !important;
    margin-top: 0.55em !important;
    margin-bottom: 0.25em !important;
    display: block !important;
  }
  .epub-text-layer-content h6 {
    font-size: 0.9em !important;
    font-weight: 600 !important;
    margin-top: 0.5em !important;
    margin-bottom: 0.2em !important;
    display: block !important;
  }
  .epub-text-layer-content p {
    margin-top: 0 !important;
    margin-bottom: 0.85em !important;
    line-height: 1.7 !important;
    text-align: justify !important;
    text-justify: inter-word !important;
  }
  .epub-text-layer-content strong, .epub-text-layer-content b { font-weight: 700 !important; }
  .epub-text-layer-content em, .epub-text-layer-content i { font-style: italic !important; }
  .epub-text-layer-content blockquote {
    margin: 1em 1.5em !important;
    padding-left: 1em !important;
    border-left: 2px solid rgba(0, 0, 0, 0.15) !important;
    font-style: italic !important;
  }
  .epub-text-layer-content hr {
    margin: 1.5em auto !important;
    border: none !important;
    border-top: 1px solid rgba(0, 0, 0, 0.15) !important;
    width: 60% !important;
  }
  .epub-text-layer-content ul, .epub-text-layer-content ol {
    margin: 0.75em 0 0.75em 1.5em !important;
    padding-left: 1em !important;
  }
  .epub-text-layer-content li { margin-bottom: 0.35em !important; line-height: 1.6 !important; }
  .epub-text-layer-content sub { font-size: 0.75em !important; vertical-align: sub !important; }
  .epub-text-layer-content sup { font-size: 0.75em !important; vertical-align: super !important; }
`

function calculateSectionPages(
  doc: Document | null,
  fontSize: number = 18,
  fontFamily: string = "'Newsreader', Georgia, 'Times New Roman', serif",
): number {
  if (!doc || !doc.body) return 1
  const textLen = (doc.body.textContent || '').trim().length
  if (typeof document === 'undefined' || !document.createElement) {
    const baseCharsPerPage = Math.max(300, Math.round(1200 * (18 / Math.max(12, fontSize))))
    return Math.max(1, Math.ceil(textLen / baseCharsPerPage))
  }

  try {
    const container = document.createElement('div')
    container.className = 'epub-text-layer-content'
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
    container.style.fontFamily = fontFamily
    container.style.fontSize = `${fontSize}px`
    container.style.lineHeight = '1.7'
    container.style.wordWrap = 'break-word'
    container.innerHTML = doc.body.innerHTML

    document.body.appendChild(container)
    const scrollW = container.scrollWidth
    document.body.removeChild(container)

    if (scrollW > 800) {
      return Math.max(1, Math.ceil(scrollW / 800))
    }
    const baseCharsPerPage = Math.max(300, Math.round(1200 * (18 / Math.max(12, fontSize))))
    return Math.max(1, Math.ceil(textLen / baseCharsPerPage))
  } catch {
    const baseCharsPerPage = Math.max(300, Math.round(1200 * (18 / Math.max(12, fontSize))))
    return Math.max(1, Math.ceil(textLen / baseCharsPerPage))
  }
}

export class EpubDocumentAdapter implements IBookDocument {
  readonly type = 'epub' as const
  private _epub: FoliateEpub | null = null
  private _metadata: BookMetadata = { title: '' }
  private _totalPages = 0
  private _isLoaded = false
  private _fontSize = 18
  private _fontFamily = "'Newsreader', Georgia, 'Times New Roman', serif"
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

  get fontSize(): number {
    return this._fontSize
  }

  get fontFamily(): string {
    return this._fontFamily
  }

  setFontFamily(newFontFamily: string, currentPage = 1): number {
    if (!newFontFamily || (this._fontFamily === newFontFamily && this._isLoaded)) {
      return currentPage
    }

    const oldMapping = this._pageMap[currentPage - 1]
    const targetSectionIndex = oldMapping ? oldMapping.sectionIndex : 0
    const targetFraction = oldMapping && oldMapping.totalPagesInSection > 0
      ? oldMapping.pageIndexInSection / oldMapping.totalPagesInSection
      : 0

    this._fontFamily = newFontFamily
    this._pageCanvases.clear()

    if (!this._isLoaded || this._sections.length === 0) {
      return currentPage
    }

    this._pageMap = []
    let globalPageCounter = 1

    for (let sIdx = 0; sIdx < this._sections.length; sIdx++) {
      const doc = this._sectionDocs.get(sIdx) || null
      const pagesInSection = calculateSectionPages(doc, this._fontSize, this._fontFamily)
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

    const matchingPages = this._pageMap.filter((m) => m.sectionIndex === targetSectionIndex)
    if (matchingPages.length > 0) {
      const newIndex = Math.min(
        matchingPages.length - 1,
        Math.max(0, Math.floor(targetFraction * matchingPages.length)),
      )
      return matchingPages[newIndex].globalPage
    }

    return Math.max(1, Math.min(currentPage, this._totalPages))
  }

  setFontSize(newFontSize: number, currentPage = 1): number {
    const clampedSize = Math.max(12, Math.min(36, Math.round(newFontSize)))
    if (this._fontSize === clampedSize && this._isLoaded) {
      return currentPage
    }

    const oldMapping = this._pageMap[currentPage - 1]
    const targetSectionIndex = oldMapping ? oldMapping.sectionIndex : 0
    const targetFraction = oldMapping && oldMapping.totalPagesInSection > 0
      ? oldMapping.pageIndexInSection / oldMapping.totalPagesInSection
      : 0

    this._fontSize = clampedSize
    this._pageCanvases.clear()

    if (!this._isLoaded || this._sections.length === 0) {
      return currentPage
    }

    this._pageMap = []
    let globalPageCounter = 1

    for (let sIdx = 0; sIdx < this._sections.length; sIdx++) {
      const doc = this._sectionDocs.get(sIdx) || null
      const pagesInSection = calculateSectionPages(doc, this._fontSize, this._fontFamily)
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

    const matchingPages = this._pageMap.filter((m) => m.sectionIndex === targetSectionIndex)
    if (matchingPages.length > 0) {
      const newIndex = Math.min(
        matchingPages.length - 1,
        Math.max(0, Math.floor(targetFraction * matchingPages.length)),
      )
      return matchingPages[newIndex].globalPage
    }

    return Math.max(1, Math.min(currentPage, this._totalPages))
  }

  async load(
    source: File | ArrayBuffer,
    fileName?: string,
    initialFontSize?: number,
    initialFontFamily?: string,
  ): Promise<void> {
    if (typeof initialFontSize === 'number' && !isNaN(initialFontSize)) {
      this._fontSize = Math.max(12, Math.min(36, Math.round(initialFontSize)))
    }
    if (initialFontFamily) {
      this._fontFamily = initialFontFamily
    }
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

      const pagesInSection = calculateSectionPages(doc, this._fontSize, this._fontFamily)
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

  async getPage(pageNumber: number, targetWidth?: number, targetHeight?: number): Promise<PageData> {
    if (!this._epub) throw new Error('EPUB não carregado')

    const cached = this._pageCanvases.get(pageNumber)
    if (cached) return this._canvasToPageData(cached)

    const canvas = await this._renderPageToCanvas(pageNumber, targetWidth, targetHeight)
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

      const docStyles = doc && typeof doc.querySelectorAll === 'function' ? Array.from(doc.querySelectorAll('style')).map((s) => s.innerHTML).join('\n') : ''

      const baseWidth = 800
      const baseHeight = 1200
      const scale = targetWidth && targetWidth > 0
        ? targetWidth / baseWidth
        : (targetHeight && targetHeight > 0 ? targetHeight / baseHeight : 1)
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
      viewportWrapper.style.transform = `scale(${scale}, ${scale})`
      viewportWrapper.style.transformOrigin = 'top left'
      viewportWrapper.style.pointerEvents = 'auto'

      if (docStyles) {
        const styleTag = document.createElement('style')
        styleTag.innerHTML = docStyles
        viewportWrapper.appendChild(styleTag)
      }

      const contentWrapper = document.createElement('div')
      contentWrapper.className = 'epub-text-layer-content'
      contentWrapper.style.width = `${baseWidth}px`
      contentWrapper.style.height = `${baseHeight}px`
      contentWrapper.style.padding = '48px'
      contentWrapper.style.boxSizing = 'border-box'
      contentWrapper.style.columnWidth = '704px'
      contentWrapper.style.columnGap = '96px'
      contentWrapper.style.columnFill = 'auto'
      contentWrapper.style.fontFamily = this._fontFamily
      contentWrapper.style.fontSize = `${this._fontSize}px`
      contentWrapper.style.lineHeight = '1.7'
      contentWrapper.style.wordWrap = 'break-word'
      contentWrapper.style.marginLeft = `-${colOffset}px`
      contentWrapper.style.color = '#1a1a1a'
      contentWrapper.style.userSelect = 'text'
      contentWrapper.style.webkitUserSelect = 'text'
      contentWrapper.innerHTML = doc.body ? doc.body.innerHTML : ''

      viewportWrapper.appendChild(contentWrapper)
      container.appendChild(viewportWrapper)
    } catch (err) {
      logWarn('[EpubAdapter] textLayer render error:', err)
    }
  }

  private async _renderPageToCanvas(pageNumber: number, targetWidth?: number, targetHeight?: number): Promise<HTMLCanvasElement> {
    const baseWidth = 800
    const baseHeight = 1200
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1

    let renderScale = dpr * 1.25
    if (targetWidth && targetWidth > 0) {
      renderScale = targetWidth / baseWidth
    } else if (targetHeight && targetHeight > 0) {
      renderScale = targetHeight / baseHeight
    }
    renderScale = Math.max(1.0, renderScale)

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
      const docStyles = doc && typeof doc.querySelectorAll === 'function' ? Array.from(doc.querySelectorAll('style')).map((s) => s.innerHTML).join('\n') : ''
      const bodyContent = doc.body ? doc.body.innerHTML : ''
      const colOffset = mapping.pageIndexInSection * baseWidth

      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${baseWidth} ${baseHeight}" width="${width}" height="${height}">
          <style>
            ${EPUB_TYPOGRAPHY_STYLES}
            ${docStyles}
          </style>
          <foreignObject width="${baseWidth}" height="${baseHeight}">
            <div xmlns="http://www.w3.org/1999/xhtml"
              style="width:${baseWidth}px;height:${baseHeight}px;overflow:hidden;background:#faf9f7;margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;">
              <div class="epub-text-layer-content"
                style="width:${baseWidth}px;height:${baseHeight}px;padding:48px;box-sizing:border-box;column-width:704px;column-gap:96px;column-fill:auto;font-family:${this._fontFamily};font-size:${this._fontSize}px;color:#1a1a1a;line-height:1.7;word-wrap:break-word;margin-left:-${colOffset}px;">
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
