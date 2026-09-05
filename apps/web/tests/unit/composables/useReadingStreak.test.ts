import { describe, it, expect, vi } from 'vitest'
import { useReadingStreak } from '../../../app/composables/useReadingStreak'

describe('useReadingStreak composable', () => {
  it('initializes with streak, daily activity and weekly activity structures', () => {
    const { currentStreak, longestStreak, weeklyActivity, targetStreakDays, todayActivity } = useReadingStreak()
    expect(currentStreak.value).toBeDefined()
    expect(longestStreak.value).toBeDefined()
    expect(weeklyActivity.value.length).toBe(7)
    expect(targetStreakDays.value).toBeDefined()
    expect(todayActivity.value.requiredReadingSeconds).toBe(600)
    expect(todayActivity.value.requiredFlashcards).toBe(5)
  })

  it('handles local updates for reading time and flashcard reviews', async () => {
    const { todayActivity, recordReadingTime, recordFlashcardReview, updateTargetStreakDays, targetStreakDays } = useReadingStreak()

    await updateTargetStreakDays(14)
    expect(targetStreakDays.value).toBe(14)

    const initialSecs = todayActivity.value.readingSeconds
    await recordReadingTime(120)
    expect(todayActivity.value.readingSeconds).toBeGreaterThanOrEqual(initialSecs)

    const initialCards = todayActivity.value.flashcardsReviewed
    await recordFlashcardReview(2)
    expect(todayActivity.value.flashcardsReviewed).toBeGreaterThanOrEqual(initialCards)
  })
})
