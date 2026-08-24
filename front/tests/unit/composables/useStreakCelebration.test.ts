import { describe, it, expect, beforeEach } from 'vitest'
import { useStreakCelebration } from '../../../app/composables/useStreakCelebration'

describe('useStreakCelebration', () => {
  it('inicializa e dispara celebração corretamente', () => {
    const { isCelebrationOpen, celebrationStreakDays, triggerCelebration, closeCelebration } = useStreakCelebration()

    expect(isCelebrationOpen.value).toBe(false)
    triggerCelebration(5, 7)
    expect(isCelebrationOpen.value).toBe(true)
    expect(celebrationStreakDays.value).toBe(5)

    closeCelebration()
    expect(isCelebrationOpen.value).toBe(false)
  })
})
