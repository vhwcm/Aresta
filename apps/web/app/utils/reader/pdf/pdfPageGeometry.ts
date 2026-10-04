import { ChunkScheduler } from '../scheduling/chunkScheduler'

export interface PageGeometry {
  page: number
  width: number
  height: number
  aspectRatio: number
}

export class PdfPageGeometry {
  private readonly numPages: number
  private readonly geometryCache = new Map<number, PageGeometry>()
  private readonly pdfDoc: any
  private defaultAspectRatio: number
  private scheduler: ChunkScheduler<{ index: number; startPage: number }> | null = null

  constructor(pdfDoc: any, initialDefaultAspectRatio = 0.75) {
    this.pdfDoc = pdfDoc
    this.numPages = pdfDoc.numPages || 1
    this.defaultAspectRatio = initialDefaultAspectRatio
  }

  get totalPages(): number {
    return this.numPages
  }

  getAspectRatio(page: number): number {
    const geom = this.geometryCache.get(page)
    if (geom) return geom.aspectRatio
    return this.defaultAspectRatio
  }

  getGeometry(page: number): PageGeometry | null {
    return this.geometryCache.get(page) ?? null
  }

  async loadPageGeometry(pageNumber: number): Promise<PageGeometry> {
    const cached = this.geometryCache.get(pageNumber)
    if (cached) return cached

    try {
      const page = await this.pdfDoc.getPage(pageNumber)
      const viewport = page.getViewport({ scale: 1 })
      const width = viewport.width || 600
      const height = viewport.height || 800
      const aspectRatio = height > 0 ? width / height : this.defaultAspectRatio

      const geom: PageGeometry = {
        page: pageNumber,
        width,
        height,
        aspectRatio
      }

      this.geometryCache.set(pageNumber, geom)
      this.defaultAspectRatio = aspectRatio
      return geom
    } catch {
      const fallback: PageGeometry = {
        page: pageNumber,
        width: 600,
        height: 800,
        aspectRatio: this.defaultAspectRatio
      }
      this.geometryCache.set(pageNumber, fallback)
      return fallback
    }
  }

  /**
   * Carrega lote de 10 páginas sequenciais em idle (apenas metadados de viewport, sem raster).
   */
  async loadBatch(startPage: number, count: number = 10): Promise<PageGeometry[]> {
    const promises: Promise<PageGeometry>[] = []
    const end = Math.min(this.numPages, startPage + count - 1)
    for (let p = startPage; p <= end; p++) {
      promises.push(this.loadPageGeometry(p))
    }
    return Promise.all(promises)
  }

  /**
   * Precarrega todas as geometrias do PDF em background em blocos de 10 páginas,
   * priorizando a distância da página-alvo.
   */
  preloadAllInIdle(targetPage: number = 1, onGeometryReady?: () => void): void {
    if (this.scheduler) {
      this.scheduler.cancel()
    }

    const batchSize = 10
    const batchCount = Math.ceil(this.numPages / batchSize)
    const items = Array.from({ length: batchCount }, (_, i) => ({
      index: i,
      startPage: i * batchSize + 1
    }))

    const targetBatch = Math.floor((targetPage - 1) / batchSize)

    this.scheduler = new ChunkScheduler<{ index: number; startPage: number }>({
      onItemCompleted: () => {
        if (onGeometryReady) onGeometryReady()
      }
    })

    this.scheduler.start(items, targetBatch, async (item) => {
      await this.loadBatch(item.startPage, batchSize)
    })
  }

  cancelPreload(): void {
    if (this.scheduler) {
      this.scheduler.cancel()
      this.scheduler = null
    }
  }
}
