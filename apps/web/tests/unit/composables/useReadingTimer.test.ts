import { describe, it, expect } from 'vitest'
import { useReadingTimer } from '../../../app/composables/reader/useReadingTimer'

describe('useReadingTimer', () => {
  it('inicializa com timer pausado', () => {
    const { isRunning, secondsElapsed } = useReadingTimer()
    expect(isRunning.value).toBe(false)
    expect(secondsElapsed.value).toBe(0)
  })
})
