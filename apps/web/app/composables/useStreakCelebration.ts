import { ref } from 'vue'

const isCelebrationOpen = ref(false)
const celebrationStreakDays = ref(0)
const celebrationTargetDays = ref(7)
const isShareModalOpen = ref(false)

export const useStreakCelebration = () => {
  const triggerCelebration = (streakDays: number, targetDays = 7) => {
    celebrationStreakDays.value = streakDays
    celebrationTargetDays.value = targetDays
    isCelebrationOpen.value = true
  }

  const closeCelebration = () => {
    isCelebrationOpen.value = false
  }

  const openShareModal = () => {
    isShareModalOpen.value = true
  }

  const closeShareModal = () => {
    isShareModalOpen.value = false
  }

  return {
    isCelebrationOpen,
    celebrationStreakDays,
    celebrationTargetDays,
    isShareModalOpen,
    triggerCelebration,
    closeCelebration,
    openShareModal,
    closeShareModal
  }
}
