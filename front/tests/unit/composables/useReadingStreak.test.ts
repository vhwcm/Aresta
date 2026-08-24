import { describe, it, expect } from 'vitest'
import { useReadingStreak } from '~/composables/useReadingStreak'

describe('useReadingStreak composable', () => {
  it('initializes with current streak and weekly activity', () => {
    const { currentStreak, longestStreak, weeklyActivity, dailyGoalMinutes } = useReadingStreak()
    expect(currentStreak.value).toBeGreaterThan(0)
    expect(longestStreak.value).toBeGreaterThanOrEqual(currentStreak.value)
    expect(weeklyActivity.value.length).toBe(7)
    expect(dailyGoalMinutes.value).toBe(20)
  })

  it('computes isGoalReached correctly and adds reading minutes', () => {
    const { todayMinutesRead, dailyGoalMinutes, isGoalReached, addReadingMinutes } = useReadingStreak()
    expect(isGoalReached.value).toBe(todayMinutesRead.value >= dailyGoalMinutes.value)

    const initialMinutes = todayMinutesRead.value
    addReadingMinutes(10)
    expect(todayMinutesRead.value).toBe(initialMinutes + 10)
  })
})
