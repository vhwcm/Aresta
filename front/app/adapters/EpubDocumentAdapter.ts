import type { IBookDocument, BookMetadata, PageData } from '~/interfaces/reader/IBookDocument'
import { logWarn } from '~/utils/logger'

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

async function buildEpubLoader(arrayBuffer: ArrayBuffer) {
  const { unzipSync } = await import('fflate')

  const zipData = new Uint8Array(arrayBuffer)
  const unzipped = unzipSync(zipData)

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

export class EpubDocumentAdapter implements IBookDocument {
  readonly type = 'epub' as const
  private _epub: FoliateEpub | null = null
  private _metadata: BookMetadata = { title: '' }
  private _totalPages = 0
  private _isLoaded = false
  private _pageCanvases: Map<number, HTMLCanvasElement> = new Map()
  private _sections: FoliateSection[] = []

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
    const { EPUB } = await import('foliate-js/epub.js')

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
    await epub.init()
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
    this._isLoaded = true
  }

  async getPage(pageNumber: number): Promise<PageData> {
    if (!this._epub) throw new Error('EPUB não carregado')

    const cached = this._pageCanvases.get(pageNumber)
    if (cached) return this._canvasToPageData(cached)

    const canvas = await this._renderSectionToCanvas(pageNumber)
    this._pageCanvases.set(pageNumber, canvas)
    return this._canvasToPageData(canvas)
  }

  private async _renderSectionToCanvas(pageNumber: number): Promise<HTMLCanvasElement> {
    const width = 600
    const height = 900
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return canvas

    ctx.fillStyle = '#faf9f7'
    ctx.fillRect(0, 0, width, height)

    const section = this._sections[pageNumber - 1]
    if (!section) return canvas

    try {
      const doc = await section.createDocument()
      const serialized = new XMLSerializer().serializeToString(doc.body ?? doc)

      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml"
              style="font-family:Georgia,serif;font-size:14px;padding:32px;color:#1a1a1a;line-height:1.7;word-wrap:break-word;">
              ${serialized}
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
          reject(new Error('Falha ao renderizar seção EPUB'))
        }
        img.src = url
      })
    } catch (err) {
      ctx.fillStyle = '#555'
      ctx.font = '13px Georgia, serif'
      ctx.fillText(`Página ${pageNumber} — erro ao renderizar`, 20, 40)
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
    this._epub = null
    this._sections = []
    this._isLoaded = false
  }
}
