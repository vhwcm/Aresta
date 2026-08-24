import { describe, it, expect } from 'vitest'
import { useStreakCelebration } from '../../../app/composables/useStreakCelebration'

describe('useStreakCelebration composable', () => {
  it('triggers celebration with correct data and opens modal', () => {
    const { isCelebrationOpen, celebrationData, triggerCelebration, closeCelebration, openShare, isShareModalOpen } = useStreakCelebration()

    expect(isCelebrationOpen.value).toBe(false)

    triggerCelebration(7, 7)
    expect(isCelebrationOpen.value).toBe(true)
    expect(celebrationData.value?.currentStreak).toBe(7)
    expect(celebrationData.value?.reachedMilestone).toBe(true)

    openShare()
    expect(isCelebrationOpen.value).toBe(false)
    expect(isShareModalOpen.value).toBe(true)

    closeCelebration()
  })
})
