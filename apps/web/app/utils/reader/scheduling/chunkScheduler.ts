export interface IdleDeadlineLike {
  readonly didTimeout?: boolean
  timeRemaining(): number
}

export type RequestIdleCallbackLike = (
  callback: (deadline: IdleDeadlineLike) => void,
  options?: { timeout?: number }
) => number

export type CancelIdleCallbackLike = (handle: number) => void

export interface ChunkSchedulerOptions<T> {
  requestIdle?: RequestIdleCallbackLike
  cancelIdle?: CancelIdleCallbackLike
  minRemainingTimeMs?: number
  onItemCompleted?: (item: T, index: number) => void
  onComplete?: () => void
}

export interface SchedulableItem {
  index: number
}

/**
 * Fallback padrão para ambientes sem requestIdleCallback nativo (Safari, Node/Vitest).
 */
export function defaultRequestIdleCallback(
  cb: (deadline: IdleDeadlineLike) => void
): number {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return (window as any).requestIdleCallback(cb)
  }
  const start = Date.now()
  return setTimeout(() => {
    cb({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 16 - (Date.now() - start))
    })
  }, 1) as unknown as number
}

export function defaultCancelIdleCallback(handle: number): void {
  if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    ;(window as any).cancelIdleCallback(handle)
  } else {
    clearTimeout(handle)
  }
}

export class ChunkScheduler<T extends SchedulableItem> {
  private queue: T[] = []
  private targetIndex: number = 0
  private isProcessing: boolean = false
  private idleHandle: number | null = null
  private taskRunner: ((item: T) => Promise<void> | void) | null = null
  private readonly requestIdle: RequestIdleCallbackLike
  private readonly cancelIdle: CancelIdleCallbackLike
  private readonly minRemainingTimeMs: number
  private readonly onItemCompleted?: (item: T, index: number) => void
  private readonly onComplete?: () => void

  constructor(options: ChunkSchedulerOptions<T> = {}) {
    this.requestIdle = options.requestIdle ?? defaultRequestIdleCallback
    this.cancelIdle = options.cancelIdle ?? defaultCancelIdleCallback
    this.minRemainingTimeMs = options.minRemainingTimeMs ?? 4
    this.onItemCompleted = options.onItemCompleted
    this.onComplete = options.onComplete
  }

  /**
   * Ordena a fila em espiral em torno de targetIndex:
   * Mais próximos de targetIndex têm maior prioridade.
   */
  private sortQueue(): void {
    const t = this.targetIndex
    this.queue.sort((a, b) => {
      const distA = Math.abs(a.index - t)
      const distB = Math.abs(b.index - t)
      if (distA !== distB) {
        return distA - distB
      }
      return a.index - b.index
    })
  }

  /**
   * Inicia o agendamento de itens a serem processados.
   */
  start(
    items: T[],
    initialTargetIndex: number,
    taskRunner: (item: T) => Promise<void> | void
  ): void {
    this.cancel()
    this.queue = [...items]
    this.targetIndex = initialTargetIndex
    this.taskRunner = taskRunner
    this.isProcessing = true
    this.sortQueue()
    this.scheduleNext()
  }

  /**
   * Reprioriza os itens restantes com base em uma nova posição de leitura.
   */
  reprioritize(newTargetIndex: number): void {
    this.targetIndex = newTargetIndex
    this.sortQueue()
  }

  /**
   * Cancela qualquer execução pendente.
   */
  cancel(): void {
    if (this.idleHandle !== null) {
      this.cancelIdle(this.idleHandle)
      this.idleHandle = null
    }
    this.isProcessing = false
    this.queue = []
    this.taskRunner = null
  }

  get isRunning(): boolean {
    return this.isProcessing
  }

  get remainingCount(): number {
    return this.queue.length
  }

  private scheduleNext(): void {
    if (!this.isProcessing || this.queue.length === 0) {
      this.isProcessing = false
      if (this.onComplete) {
        this.onComplete()
      }
      return
    }

    this.idleHandle = this.requestIdle(async deadline => {
      this.idleHandle = null
      await this.runBatch(deadline)
    })
  }

  private async runBatch(deadline: IdleDeadlineLike): Promise<void> {
    if (!this.isProcessing || !this.taskRunner) return

    while (this.queue.length > 0) {
      // Se não houver tempo suficiente no quadro atual, cede para a próxima janela idle
      if (deadline.timeRemaining() < this.minRemainingTimeMs) {
        break
      }

      const item = this.queue.shift()
      if (!item) break

      try {
        await this.taskRunner(item)
        if (this.onItemCompleted) {
          this.onItemCompleted(item, item.index)
        }
      } catch (err) {
        // Falha em um item não derruba o scheduler
        if (typeof console !== 'undefined') {
          console.warn(`[ChunkScheduler] Falha ao processar item índice ${item.index}`, err)
        }
      }

      if (!this.isProcessing) return
    }

    if (this.queue.length > 0) {
      this.scheduleNext()
    } else {
      this.isProcessing = false
      if (this.onComplete) {
        this.onComplete()
      }
    }
  }
}
