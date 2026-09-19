import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useReadingTimer } from '../../../app/composables/reader/useReadingTimer'
import { useReadingStreak } from '../../../app/composables/useReadingStreak'

describe('useReadingTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('inicializa com timer pausado', () => {
    const { isRunning, secondsElapsed } = useReadingTimer()
    expect(isRunning.value).toBe(false)
    expect(secondsElapsed.value).toBe(0)
  })

  it('inicia o timer e contabiliza segundos decorridos', async () => {
    const timer = useReadingTimer()
    const streak = useReadingStreak()
    const initialSeconds = streak.todayActivity.value.readingSeconds

    timer.startTimer()
    expect(timer.isRunning.value).toBe(true)

    // Avança 5 segundos
    vi.advanceTimersByTime(5000)
    expect(timer.secondsElapsed.value).toBe(5)

    // Avança mais 5 segundos (total 10s) -> dispara flush automático de lote de 10s
    vi.advanceTimersByTime(5000)
    expect(streak.todayActivity.value.readingSeconds).toBe(initialSeconds + 10)
    expect(timer.secondsElapsed.value).toBe(0)

    // Avança mais 2 segundos
    vi.advanceTimersByTime(2000)
    expect(timer.secondsElapsed.value).toBe(2)

    timer.stopTimer()
    expect(timer.isRunning.value).toBe(false)
    expect(timer.secondsElapsed.value).toBe(0)
    expect(streak.todayActivity.value.readingSeconds).toBe(initialSeconds + 12)
  })

  it('descarrega segundos residuais ao chamar stopTimer', async () => {
    const timer = useReadingTimer()
    const streak = useReadingStreak()
    const initialSeconds = streak.todayActivity.value.readingSeconds

    timer.startTimer()
    vi.advanceTimersByTime(4000)
    expect(timer.secondsElapsed.value).toBe(4)

    timer.stopTimer()
    expect(timer.isRunning.value).toBe(false)
    expect(timer.secondsElapsed.value).toBe(0)
    expect(streak.todayActivity.value.readingSeconds).toBe(initialSeconds + 4)
  })
})
