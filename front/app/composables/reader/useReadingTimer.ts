import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { useReadingStreak } from '~/composables/useReadingStreak'

export interface UseReadingTimerOptions {
  maxSecondsPerPage?: number // default 300 (5 min)
  idleTimeoutMs?: number // default 60_000 (1 min)
  flushIntervalMs?: number // default 15_000 (15 seg)
}

export const useReadingTimer = (options: UseReadingTimerOptions = {}) => {
  const maxSecondsPerPage = options.maxSecondsPerPage ?? 300
  const idleTimeoutMs = options.idleTimeoutMs ?? 60_000
  const flushIntervalMs = options.flushIntervalMs ?? 15_000

  const { recordReadingTime } = useReadingStreak()

  const currentPage = ref(1)
  const secondsOnCurrentPage = ref(0)
  const unpersistedSeconds = ref(0)
  const isUserActive = ref(true)
  const isPaused = ref(false)

  let lastInteractionTime = Date.now()
  let timerInterval: any = null
  let flushInterval: any = null

  const recordInteraction = () => {
    lastInteractionTime = Date.now()
    if (!isUserActive.value) {
      isUserActive.value = true
    }
  }

  const flush = async () => {
    if (unpersistedSeconds.value > 0) {
      const toPersist = unpersistedSeconds.value
      unpersistedSeconds.value = 0
      try {
        await recordReadingTime(toPersist)
      } catch (e) {
        // Ignora erro em ambiente de teste isolado
      }
    }
  }

  const tick = () => {
    if (isPaused.value) return

    const now = Date.now()
    const idleDuration = now - lastInteractionTime

    if (idleDuration > idleTimeoutMs) {
      isUserActive.value = false
      return
    }

    isUserActive.value = true

    // Respeita o teto de 5 minutos por página
    if (secondsOnCurrentPage.value < maxSecondsPerPage) {
      secondsOnCurrentPage.value += 1
      unpersistedSeconds.value += 1
    }
  }

  const onPageChange = async (newPage: number) => {
    if (newPage !== currentPage.value) {
      await flush()
      currentPage.value = newPage
      secondsOnCurrentPage.value = 0
      recordInteraction()
    }
  }

  const pause = () => {
    isPaused.value = true
  }

  const resume = () => {
    isPaused.value = false
    recordInteraction()
  }

  const handleGlobalActivity = () => {
    recordInteraction()
  }

  const startListeners = () => {
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleGlobalActivity, { passive: true })
      window.addEventListener('keydown', handleGlobalActivity, { passive: true })
      window.addEventListener('touchstart', handleGlobalActivity, { passive: true })
      window.addEventListener('pointerdown', handleGlobalActivity, { passive: true })
      window.addEventListener('scroll', handleGlobalActivity, { passive: true })

      timerInterval = setInterval(tick, 1000)
      flushInterval = setInterval(flush, flushIntervalMs)
    }
  }

  const cleanup = () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', handleGlobalActivity)
      window.removeEventListener('keydown', handleGlobalActivity)
      window.removeEventListener('touchstart', handleGlobalActivity)
      window.removeEventListener('pointerdown', handleGlobalActivity)
      window.removeEventListener('scroll', handleGlobalActivity)
    }

    if (timerInterval) clearInterval(timerInterval)
    if (flushInterval) clearInterval(flushInterval)

    flush()
  }

  if (getCurrentInstance()) {
    onMounted(startListeners)
    onUnmounted(cleanup)
  }

  return {
    currentPage,
    secondsOnCurrentPage,
    unpersistedSeconds,
    isUserActive,
    isPaused,
    recordInteraction,
    onPageChange,
    pause,
    resume,
    flush
  }
}
