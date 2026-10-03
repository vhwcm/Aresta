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

  it('fetchStreak carrega streak existente sem corromper updated_at com data atual', async () => {
    const { streakRepo } = await import('../../../app/adapters/database/repositories/StreakRepository')
    const historicalTimestamp = '2026-09-01T12:00:00.000Z'
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    await streakRepo.save({
      id: 'user_streak',
      currentStreak: 15,
      longestStreak: 20,
      streakFreezeCount: 1,
      targetStreakDays: 14,
      isGoalReachedToday: false,
      todayActivity: {
        date: today,
        readingSeconds: 200,
        readingMinutes: 3,
        requiredReadingSeconds: 600,
        flashcardsReviewed: 1,
        requiredFlashcards: 5,
        isReadingCompleted: false,
        isFlashcardsCompleted: false,
        isCompleted: false,
        isFrozen: false
      },
      weeklyActivity: [],
      updated_at: historicalTimestamp
    })

    const { fetchStreak, currentStreak } = useReadingStreak()
    await fetchStreak()

    expect(currentStreak.value).toBe(15)

    const fromDb = await streakRepo.get()
    expect(fromDb?.updated_at).toBe(historicalTimestamp)
  })

  it('atualiza o estado reativo ao receber evento aresta:data-synced e despacha aresta:streak-updated nas mutações', async () => {
    const { streakRepo } = await import('../../../app/adapters/database/repositories/StreakRepository')
    const { currentStreak, recordReadingTime } = useReadingStreak()
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    // Simula sincronização em nuvem salvando no repositório
    await streakRepo.save({
      id: 'user_streak',
      currentStreak: 42,
      longestStreak: 50,
      todayActivity: {
        date: today,
        readingSeconds: 600,
        readingMinutes: 10,
        requiredReadingSeconds: 600,
        flashcardsReviewed: 5,
        requiredFlashcards: 5,
        isReadingCompleted: true,
        isFlashcardsCompleted: true,
        isCompleted: true,
        isFrozen: false
      },
      updated_at: new Date().toISOString()
    })

    // Dispara o evento de sincronização que o useDriveSync emite
    window.dispatchEvent(new CustomEvent('aresta:data-synced'))

    // Aguarda microtask
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(currentStreak.value).toBe(42)

    // Ao registrar leitura, deve emitir aresta:streak-updated
    let streakUpdateEventFired = false
    const handleUpdate = () => { streakUpdateEventFired = true }
    window.addEventListener('aresta:streak-updated', handleUpdate)

    await recordReadingTime(10)
    expect(streakUpdateEventFired).toBe(true)
    window.removeEventListener('aresta:streak-updated', handleUpdate)
  })
})
