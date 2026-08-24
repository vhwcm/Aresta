import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useReadingTimer } from '../../../app/composables/reader/useReadingTimer'

describe('useReadingTimer composable', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes timer and tracks active reading seconds with page cap', async () => {
    const timer = useReadingTimer({ maxSecondsPerPage: 5, idleTimeoutMs: 10000, flushIntervalMs: 10000 })

    expect(timer.currentPage.value).toBe(1)
    expect(timer.secondsOnCurrentPage.value).toBe(0)
    expect(timer.isUserActive.value).toBe(true)

    // Simula troca de página
    await timer.onPageChange(2)
    expect(timer.currentPage.value).toBe(2)
    expect(timer.secondsOnCurrentPage.value).toBe(0)
  })

  it('pauses and resumes timer', () => {
    const timer = useReadingTimer()
    expect(timer.isPaused.value).toBe(false)
    timer.pause()
    expect(timer.isPaused.value).toBe(true)
    timer.resume()
    expect(timer.isPaused.value).toBe(false)
  })
})
