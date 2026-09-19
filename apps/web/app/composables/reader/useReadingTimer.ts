import { ref } from 'vue'
import { useReadingStreak } from '../useReadingStreak'

export const useReadingTimer = () => {
  const isRunning = ref(false)
  const secondsElapsed = ref(0)
  let timerId: any = null
  let lastTimestamp = 0
  let isListeningEvents = false
  const { recordReadingTime } = useReadingStreak()

  const flush = async () => {
    if (secondsElapsed.value > 0) {
      const sec = secondsElapsed.value
      secondsElapsed.value = 0
      await recordReadingTime(sec)
    }
  }

  const handleVisibilityChange = () => {
    if (typeof document === 'undefined') return
    if (document.hidden) {
      void flush()
    } else if (isRunning.value) {
      lastTimestamp = Date.now()
    }
  }

  const handleBeforeUnload = () => {
    void flush()
  }

  const startTimer = () => {
    if (isRunning.value) return
    isRunning.value = true
    lastTimestamp = Date.now()

    if (typeof window !== 'undefined' && !isListeningEvents) {
      window.addEventListener('beforeunload', handleBeforeUnload)
      window.addEventListener('pagehide', handleBeforeUnload)
      document.addEventListener('visibilitychange', handleVisibilityChange)
      isListeningEvents = true
    }

    if (timerId) clearInterval(timerId)
    timerId = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) {
        return
      }
      const now = Date.now()
      const deltaSec = Math.max(1, Math.round((now - lastTimestamp) / 1000))
      lastTimestamp = now
      secondsElapsed.value += deltaSec

      // Envia o lote acumulado a cada 10 segundos para atualização reativa
      if (secondsElapsed.value >= 10) {
        void flush()
      }
    }, 1000)
  }

  const stopTimer = () => {
    if (!isRunning.value && secondsElapsed.value === 0) return
    isRunning.value = false
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
    if (typeof window !== 'undefined' && isListeningEvents) {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      isListeningEvents = false
    }
    void flush()
  }

  return {
    isRunning,
    secondsElapsed,
    startTimer,
    stopTimer,
    flush
  }
}
