import { ref, onUnmounted } from 'vue'
import { useReadingStreak } from '../useReadingStreak'

export const useReadingTimer = () => {
  const isRunning = ref(false)
  const secondsElapsed = ref(0)
  let timerId: any = null
  const { recordReadingTime } = useReadingStreak()

  const startTimer = () => {
    if (isRunning.value) return
    isRunning.value = true
    timerId = setInterval(() => {
      secondsElapsed.value += 1
      if (secondsElapsed.value >= 60) {
        recordReadingTime(secondsElapsed.value)
        secondsElapsed.value = 0
      }
    }, 1000)
  }

  const stopTimer = () => {
    if (!isRunning.value) return
    isRunning.value = false
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
    if (secondsElapsed.value > 0) {
      recordReadingTime(secondsElapsed.value)
      secondsElapsed.value = 0
    }
  }

  return {
    isRunning,
    secondsElapsed,
    startTimer,
    stopTimer
  }
}
