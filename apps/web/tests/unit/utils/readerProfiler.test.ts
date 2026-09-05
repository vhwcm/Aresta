import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readerProfiler } from '~/utils/readerProfiler'

describe('readerProfiler', () => {
  beforeEach(() => {
    readerProfiler.setEnabled(true)
  })

  it('measures synchronous and asynchronous steps accurately', async () => {
    readerProfiler.startSession('Test Book Loading', { bookId: 42 })

    await readerProfiler.measureAsync('Network Fetch', async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
      return 'data'
    }, 'network')

    readerProfiler.measureSync('Parse Metadata', () => {
      let x = 0
      for (let i = 0; i < 1000; i++) x += i
      return x
    }, 'parse')

    const report = readerProfiler.endSession()

    expect(report).not.toBeNull()
    expect(report?.sessionName).toBe('Test Book Loading')
    expect(report?.metadata.bookId).toBe(42)
    expect(report?.steps.length).toBe(2)
    expect(report?.steps[0]?.name).toBe('Network Fetch')
    expect(report?.steps[0]?.category).toBe('network')
    expect(report?.steps[0]?.durationMs).toBeGreaterThan(0)
    expect(report?.totalDurationMs).toBeGreaterThan(0)
  })

  it('detects bottlenecks and provides recommendations', async () => {
    readerProfiler.startSession('Slow Operation Test')

    await readerProfiler.measureAsync('Heavy Unzip', async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }, 'parse', { size: '10MB' })

    const report = readerProfiler.endSession()

    expect(report).not.toBeNull()
    expect(report?.bottlenecks.length).toBeGreaterThan(0)
    expect(report?.bottlenecks[0]?.name).toBe('Heavy Unzip')
  })

  it('allows enabling and disabling through setEnabled', () => {
    readerProfiler.setEnabled(false)
    expect(readerProfiler.isEnabled()).toBe(false)

    readerProfiler.startSession('Disabled Test')
    readerProfiler.startStep('Ignored Step')
    const report = readerProfiler.endSession()

    expect(report).toBeNull()

    readerProfiler.setEnabled(true)
    expect(readerProfiler.isEnabled()).toBe(true)
  })
})

