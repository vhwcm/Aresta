import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  ChunkScheduler,
  type IdleDeadlineLike
} from '~/utils/reader/scheduling/chunkScheduler'

describe('ChunkScheduler', () => {
  let pendingCallbacks: Array<(deadline: IdleDeadlineLike) => void> = []
  let nextHandle = 1

  const mockRequestIdle = vi.fn((cb: (deadline: IdleDeadlineLike) => void) => {
    const handle = nextHandle++
    pendingCallbacks.push(cb)
    return handle
  })

  const mockCancelIdle = vi.fn((_handle: number) => {
    pendingCallbacks = []
  })

  beforeEach(() => {
    vi.useFakeTimers()
    pendingCallbacks = []
    nextHandle = 1
    mockRequestIdle.mockClear()
    mockCancelIdle.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('processa itens em ordem de distância em relação ao targetIndex', async () => {
    const processed: number[] = []
    const items = [
      { index: 0 },
      { index: 1 },
      { index: 2 },
      { index: 3 },
      { index: 4 }
    ]

    const scheduler = new ChunkScheduler({
      requestIdle: mockRequestIdle,
      cancelIdle: mockCancelIdle
    })

    scheduler.start(items, 2, (item) => {
      processed.push(item.index)
    })

    // Executa a primeira chamada idle fornecendo bastante tempo
    expect(pendingCallbacks.length).toBe(1)
    const cb = pendingCallbacks.shift()!
    await cb({ timeRemaining: () => 50 })

    // Em torno do 2: 2 (dist 0), 1 e 3 (dist 1), 0 e 4 (dist 2)
    expect(processed[0]).toBe(2)
    expect([processed[1], processed[2]]).toEqual([1, 3])
    expect([processed[3], processed[4]]).toEqual([0, 4])
  })

  it('respeita o deadline de tempo e divide em múltiplos batches', async () => {
    const processed: number[] = []
    const items = [
      { index: 0 },
      { index: 1 },
      { index: 2 },
      { index: 3 }
    ]

    const scheduler = new ChunkScheduler({
      requestIdle: mockRequestIdle,
      cancelIdle: mockCancelIdle,
      minRemainingTimeMs: 10
    })

    scheduler.start(items, 0, (item) => {
      processed.push(item.index)
    })

    // 1º batch: tempo cai após 1 item
    let time = 20
    const cb1 = pendingCallbacks.shift()!
    await cb1({
      timeRemaining: () => {
        const curr = time
        time -= 15 // vai cair para 5ms (< 10ms min)
        return curr
      }
    })

    expect(processed.length).toBe(1)
    expect(scheduler.isRunning).toBe(true)

    // O scheduler deve ter agendado o próximo batch
    expect(pendingCallbacks.length).toBe(1)
    const cb2 = pendingCallbacks.shift()!
    await cb2({ timeRemaining: () => 50 })

    expect(processed.length).toBe(4)
    expect(scheduler.isRunning).toBe(false)
  })

  it('permite cancelamento e limpa a fila', async () => {
    const processed: number[] = []
    const items = [{ index: 0 }, { index: 1 }]

    const scheduler = new ChunkScheduler({
      requestIdle: mockRequestIdle,
      cancelIdle: mockCancelIdle
    })

    scheduler.start(items, 0, (item) => {
      processed.push(item.index)
    })

    expect(scheduler.isRunning).toBe(true)
    scheduler.cancel()

    expect(scheduler.isRunning).toBe(false)
    expect(scheduler.remainingCount).toBe(0)
    expect(mockCancelIdle).toHaveBeenCalled()
  })

  it('permite repriorização dinâmica durante o processamento', async () => {
    const processed: number[] = []
    const items = [
      { index: 0 },
      { index: 1 },
      { index: 2 },
      { index: 10 },
      { index: 11 }
    ]

    const scheduler = new ChunkScheduler({
      requestIdle: mockRequestIdle,
      cancelIdle: mockCancelIdle,
      minRemainingTimeMs: 10
    })

    scheduler.start(items, 0, (item) => {
      processed.push(item.index)
    })

    // Processa só 1 item em torno de 0
    let time = 15
    const cb1 = pendingCallbacks.shift()!
    await cb1({
      timeRemaining: () => {
        const curr = time
        time = 0
        return curr
      }
    })

    expect(processed).toEqual([0])

    // Agora o usuário saltou para o índice 11!
    scheduler.reprioritize(11)

    // Próximo batch processa o resto
    const cb2 = pendingCallbacks.shift()!
    await cb2({ timeRemaining: () => 50 })

    // O próximo deve ser 11, depois 10, depois 1, depois 2
    expect(processed[1]).toBe(11)
    expect(processed[2]).toBe(10)
  })
})
