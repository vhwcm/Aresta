import { describe, it, expect, beforeEach, vi } from 'vitest'
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
    expect(todayActivity.value.readingSeconds).toBe(initialSecs + 120)
    expect(todayActivity.value.readingMinutes).toBe(Math.floor((initialSecs + 120) / 60))

    const initialCards = todayActivity.value.flashcardsReviewed
    await recordFlashcardReview(2)
    expect(todayActivity.value.flashcardsReviewed).toBe(initialCards + 2)
  })

  it('aumenta a ofensiva (streak) quando o tempo de leitura atinge a meta diária de 10 minutos (600s)', async () => {
    const { currentStreak, longestStreak, todayActivity, isGoalReachedToday, recordReadingTime, applyStreakPayload } = useReadingStreak()

    // Reseta estado base
    applyStreakPayload({
      currentStreak: 2,
      longestStreak: 5,
      streakFreezeCount: 0,
      targetStreakDays: 7,
      isGoalReachedToday: false,
      todayActivity: {
        date: new Date().toISOString().split('T')[0],
        readingSeconds: 0,
        readingMinutes: 0,
        requiredReadingSeconds: 600,
        flashcardsReviewed: 0,
        requiredFlashcards: 5,
        isReadingCompleted: false,
        isFlashcardsCompleted: false,
        isCompleted: false,
        isFrozen: false
      }
    })

    expect(isGoalReachedToday.value).toBe(false)
    expect(currentStreak.value).toBe(2)

    // Lê 5 minutos (300s) -> ainda não atinge a meta de 600s
    await recordReadingTime(300)
    expect(todayActivity.value.readingSeconds).toBe(300)
    expect(todayActivity.value.readingMinutes).toBe(5)
    expect(todayActivity.value.isReadingCompleted).toBe(false)
    expect(isGoalReachedToday.value).toBe(false)
    expect(currentStreak.value).toBe(2)

    // Lê mais 5 minutos (300s) -> total 600s -> meta atingida e ofensiva aumenta!
    await recordReadingTime(300)
    expect(todayActivity.value.readingSeconds).toBe(600)
    expect(todayActivity.value.readingMinutes).toBe(10)
    expect(todayActivity.value.isReadingCompleted).toBe(true)
    expect(isGoalReachedToday.value).toBe(true)
    expect(todayActivity.value.isCompleted).toBe(true)
    expect(currentStreak.value).toBe(3)
    expect(longestStreak.value).toBe(5)

    // Leituras subsequentes no mesmo dia continuam acumulando tempo sem duplicar o incremento do streak
    await recordReadingTime(120)
    expect(todayActivity.value.readingSeconds).toBe(720)
    expect(todayActivity.value.readingMinutes).toBe(12)
    expect(currentStreak.value).toBe(3)
  })

  it('adiciona streak freeze a cada 7 dias consecutivos de ofensiva', async () => {
    const { currentStreak, streakFreezeCount, recordReadingTime, applyStreakPayload } = useReadingStreak()

    applyStreakPayload({
      currentStreak: 6,
      longestStreak: 6,
      streakFreezeCount: 0,
      targetStreakDays: 7,
      isGoalReachedToday: false,
      todayActivity: {
        date: new Date().toISOString().split('T')[0],
        readingSeconds: 0,
        readingMinutes: 0,
        requiredReadingSeconds: 600,
        flashcardsReviewed: 0,
        requiredFlashcards: 5,
        isReadingCompleted: false,
        isFlashcardsCompleted: false,
        isCompleted: false,
        isFrozen: false
      }
    })

    await recordReadingTime(600)
    expect(currentStreak.value).toBe(7)
    expect(streakFreezeCount.value).toBe(1)
  })
})
