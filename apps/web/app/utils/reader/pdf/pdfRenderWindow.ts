export interface RenderTaskLike {
  cancel(): void
  promise: Promise<void>
}

export interface CachedCanvasEntry {
  page: number
  canvas: HTMLCanvasElement
  scale: number
  isThumbnail: boolean
}

export class PdfRenderWindow {
  private readonly maxCanvases: number = 6
  private readonly lruCanvases = new Map<number, CachedCanvasEntry>()
  private readonly inFlightRenders = new Map<number, RenderTaskLike>()
  private currentPage: number = 1
  private totalPages: number = 1

  constructor(totalPages: number = 1, maxCanvases: number = 6) {
    this.totalPages = Math.max(1, totalPages)
    this.maxCanvases = maxCanvases
  }

  setTotalPages(total: number): void {
    this.totalPages = Math.max(1, total)
  }

  setCurrentPage(page: number): void {
    this.currentPage = Math.max(1, Math.min(page, this.totalPages))
    this.cancelOutOfWindowRenders()
  }

  get highResRange(): [number, number] {
    return [
      Math.max(1, this.currentPage - 1),
      Math.min(this.totalPages, this.currentPage + 1)
    ]
  }

  get idleRange(): [number, number] {
    return [
      Math.max(1, this.currentPage - 2),
      Math.min(this.totalPages, this.currentPage + 2)
    ]
  }

  isPageInWindow(page: number): boolean {
    const [min, max] = this.idleRange
    return page >= min && page <= max
  }

  getCanvas(page: number): CachedCanvasEntry | null {
    const entry = this.lruCanvases.get(page)
    if (entry) {
      // Atualiza posição no LRU
      this.lruCanvases.delete(page)
      this.lruCanvases.set(page, entry)
      return entry
    }
    return null
  }

  storeCanvas(page: number, canvas: HTMLCanvasElement, scale: number, isThumbnail: boolean = false): void {
    if (this.lruCanvases.has(page)) {
      this.lruCanvases.delete(page)
    } else if (this.lruCanvases.size >= this.maxCanvases) {
      // Evict LRU: descarta o elemento mais antigo
      const oldestKey = this.lruCanvases.keys().next().value
      if (oldestKey !== undefined) {
        const oldEntry = this.lruCanvases.get(oldestKey)
        if (oldEntry?.canvas) {
          try {
            oldEntry.canvas.getContext('2d')?.clearRect(0, 0, oldEntry.canvas.width, oldEntry.canvas.height)
            oldEntry.canvas.width = 0
            oldEntry.canvas.height = 0
          } catch {
            /* ignorar */
          }
        }
        this.lruCanvases.delete(oldestKey)
      }
    }

    this.lruCanvases.set(page, {
      page,
      canvas,
      scale,
      isThumbnail
    })
  }

  registerInFlightRender(page: number, task: RenderTaskLike): void {
    this.inFlightRenders.set(page, task)
  }

  unregisterInFlightRender(page: number): void {
    this.inFlightRenders.delete(page)
  }

  cancelOutOfWindowRenders(): void {
    const [min, max] = this.idleRange
    for (const [page, task] of this.inFlightRenders.entries()) {
      if (page < min || page > max) {
        try {
          task.cancel()
        } catch {
          /* ignorar RenderingCancelledException */
        }
        this.inFlightRenders.delete(page)
      }
    }
  }

  clear(): void {
    for (const task of this.inFlightRenders.values()) {
      try {
        task.cancel()
      } catch {
        /* ignorar */
      }
    }
    this.inFlightRenders.clear()

    for (const entry of this.lruCanvases.values()) {
      try {
        entry.canvas.getContext('2d')?.clearRect(0, 0, entry.canvas.width, entry.canvas.height)
        entry.canvas.width = 0
        entry.canvas.height = 0
      } catch {
        /* ignorar */
      }
    }
    this.lruCanvases.clear()
  }

  get size(): number {
    return this.lruCanvases.size
  }
}
