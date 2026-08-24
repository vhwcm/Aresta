import { ref } from 'vue'

export interface CelebrationPayload {
  currentStreak: number
  previousStreak: number
  targetStreakDays: number
  reachedMilestone: boolean
}

// Module-level shared state across all components
const isCelebrationOpen = ref(false)
const isShareModalOpen = ref(false)
const celebrationData = ref<CelebrationPayload>({
  currentStreak: 1,
  previousStreak: 0,
  targetStreakDays: 7,
  reachedMilestone: false
})

export const useStreakCelebration = () => {
  const triggerCelebration = (currentStreak: number, targetStreakDays: number) => {
    celebrationData.value = {
      currentStreak,
      previousStreak: Math.max(0, currentStreak - 1),
      targetStreakDays,
      reachedMilestone: currentStreak >= targetStreakDays
    }
    isCelebrationOpen.value = true
  }

  const closeCelebration = () => {
    isCelebrationOpen.value = false
  }

  const openShare = () => {
    isCelebrationOpen.value = false
    isShareModalOpen.value = true
  }

  const closeShare = () => {
    isShareModalOpen.value = false
  }

  return {
    isCelebrationOpen,
    isShareModalOpen,
    celebrationData,
    triggerCelebration,
    closeCelebration,
    openShare,
    closeShare
  }
}
