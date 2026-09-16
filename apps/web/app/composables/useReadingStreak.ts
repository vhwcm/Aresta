import { ref, computed } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useStreakCelebration } from '~/composables/useStreakCelebration'
import { streakRepo } from '~/adapters/database/repositories/StreakRepository'

export interface StreakDay {
  date: string
  dayLabel: string
  readingSeconds: number
  readingMinutes: number
  flashcardsReviewed: number
  completed: boolean
  frozen: boolean
}

export interface TodayActivity {
  date: string
  readingSeconds: number
  readingMinutes: number
  requiredReadingSeconds: number
  flashcardsReviewed: number
  requiredFlashcards: number
  isReadingCompleted: boolean
  isFlashcardsCompleted: boolean
  isCompleted: boolean
  isFrozen: boolean
}

// Shared module-level reactive state
const currentStreak = ref(0)
const longestStreak = ref(0)
const streakFreezeCount = ref(0)
const targetStreakDays = ref(7)
const isGoalReachedToday = ref(false)

const todayActivity = ref<TodayActivity>({
  date: new Date().toISOString().split('T')[0] ?? '',
  readingSeconds: 0,
  readingMinutes: 0,
  requiredReadingSeconds: 600,
  flashcardsReviewed: 0,
  requiredFlashcards: 5,
  isReadingCompleted: false,
  isFlashcardsCompleted: false,
  isCompleted: false,
  isFrozen: false
})

const weeklyActivity = ref<StreakDay[]>([
  { date: '', dayLabel: 'D', readingSeconds: 0, readingMinutes: 0, flashcardsReviewed: 0, completed: false, frozen: false },
  { date: '', dayLabel: 'S', readingSeconds: 0, readingMinutes: 0, flashcardsReviewed: 0, completed: false, frozen: false },
  { date: '', dayLabel: 'T', readingSeconds: 0, readingMinutes: 0, flashcardsReviewed: 0, completed: false, frozen: false },
  { date: '', dayLabel: 'Q', readingSeconds: 0, readingMinutes: 0, flashcardsReviewed: 0, completed: false, frozen: false },
  { date: '', dayLabel: 'Q', readingSeconds: 0, readingMinutes: 0, flashcardsReviewed: 0, completed: false, frozen: false },
  { date: '', dayLabel: 'S', readingSeconds: 0, readingMinutes: 0, flashcardsReviewed: 0, completed: false, frozen: false },
  { date: '', dayLabel: 'S', readingSeconds: 0, readingMinutes: 0, flashcardsReviewed: 0, completed: false, frozen: false }
])

const isLoading = ref(false)
const hasFetched = ref(false)

export const useReadingStreak = () => {
  const auth = useAuth()
  const { triggerCelebration } = useStreakCelebration()

  const applyStreakPayload = (data: any) => {
    if (!data) return
    currentStreak.value = data.currentStreak ?? 0
    longestStreak.value = data.longestStreak ?? 0
    streakFreezeCount.value = data.streakFreezeCount ?? 0
    targetStreakDays.value = data.targetStreakDays ?? 7
    isGoalReachedToday.value = data.isGoalReachedToday ?? false

    if (data.todayActivity || data.today) {
      const t = data.todayActivity || data.today
      todayActivity.value = {
        date: t.date || new Date().toISOString().split('T')[0],
        readingSeconds: t.readingSeconds ?? 0,
        readingMinutes: t.readingMinutes ?? Math.floor((t.readingSeconds || 0) / 60),
        requiredReadingSeconds: t.requiredReadingSeconds ?? 600,
        flashcardsReviewed: t.flashcardsReviewed ?? 0,
        requiredFlashcards: t.requiredFlashcards ?? 5,
        isReadingCompleted: t.isReadingCompleted ?? false,
        isFlashcardsCompleted: t.isFlashcardsCompleted ?? false,
        isCompleted: t.isCompleted ?? false,
        isFrozen: t.isFrozen ?? false
      }
    }

    if (Array.isArray(data.weeklyActivity)) {
      weeklyActivity.value = data.weeklyActivity
    }

    streakRepo.save({
      currentStreak: currentStreak.value,
      longestStreak: longestStreak.value,
      streakFreezeCount: streakFreezeCount.value,
      targetStreakDays: targetStreakDays.value,
      isGoalReachedToday: isGoalReachedToday.value,
      todayActivity: todayActivity.value,
      weeklyActivity: weeklyActivity.value
    }).catch((e) => console.warn('[useReadingStreak] Falha ao persistir streak local:', e))
  }

  const fetchStreak = async () => {
    isLoading.value = true
    try {
      const localStreak = await streakRepo.get()
      if (localStreak) {
        applyStreakPayload(localStreak)
      }
      hasFetched.value = true
    } catch (e) {
      console.warn('[useReadingStreak] Falha ao ler streak local:', e)
    } finally {
      isLoading.value = false
    }
  }

  const recordReadingTime = async (seconds: number) => {
    if (seconds <= 0) return
    todayActivity.value.readingSeconds = (todayActivity.value.readingSeconds ?? 0) + seconds
    todayActivity.value.readingMinutes = Math.floor(todayActivity.value.readingSeconds / 60)
    todayActivity.value.isReadingCompleted = todayActivity.value.readingSeconds >= 600
    if ((todayActivity.value.isReadingCompleted || todayActivity.value.isFlashcardsCompleted) && !isGoalReachedToday.value) {
      isGoalReachedToday.value = true
      currentStreak.value += 1
      longestStreak.value = Math.max(longestStreak.value, currentStreak.value)
      triggerCelebration(currentStreak.value, targetStreakDays.value)
    }

    applyStreakPayload({
      currentStreak: currentStreak.value,
      longestStreak: longestStreak.value,
      streakFreezeCount: streakFreezeCount.value,
      targetStreakDays: targetStreakDays.value,
      isGoalReachedToday: isGoalReachedToday.value,
      todayActivity: todayActivity.value,
      weeklyActivity: weeklyActivity.value
    })
  }

  const recordFlashcardReview = async (count: number = 1) => {
    if (count <= 0) return
    todayActivity.value.flashcardsReviewed = (todayActivity.value.flashcardsReviewed ?? 0) + count
    todayActivity.value.isFlashcardsCompleted = todayActivity.value.flashcardsReviewed >= 5
    if ((todayActivity.value.isReadingCompleted || todayActivity.value.isFlashcardsCompleted) && !isGoalReachedToday.value) {
      isGoalReachedToday.value = true
      currentStreak.value += 1
      longestStreak.value = Math.max(longestStreak.value, currentStreak.value)
      triggerCelebration(currentStreak.value, targetStreakDays.value)
    }

    applyStreakPayload({
      currentStreak: currentStreak.value,
      longestStreak: longestStreak.value,
      streakFreezeCount: streakFreezeCount.value,
      targetStreakDays: targetStreakDays.value,
      isGoalReachedToday: isGoalReachedToday.value,
      todayActivity: todayActivity.value,
      weeklyActivity: weeklyActivity.value
    })
  }

  const updateTargetStreakDays = async (newTargetDays: number) => {
    targetStreakDays.value = newTargetDays
    applyStreakPayload({
      currentStreak: currentStreak.value,
      longestStreak: longestStreak.value,
      streakFreezeCount: streakFreezeCount.value,
      targetStreakDays: newTargetDays,
      isGoalReachedToday: isGoalReachedToday.value,
      todayActivity: todayActivity.value,
      weeklyActivity: weeklyActivity.value
    })
  }

  if (typeof window !== 'undefined' && !hasFetched.value) {
    fetchStreak()
  }

  const dailyGoalMinutes = computed(() => 10)
  const todayMinutesRead = computed(() => todayActivity.value.readingMinutes)
  const isGoalReached = computed(() => isGoalReachedToday.value)

  return {
    currentStreak,
    longestStreak,
    streakFreezeCount,
    targetStreakDays,
    todayActivity,
    weeklyActivity,
    isLoading,
    isGoalReachedToday,
    dailyGoalMinutes,
    todayMinutesRead,
    isGoalReached,
    applyStreakPayload,
    fetchStreak,
    recordReadingTime,
    recordFlashcardReview,
    updateTargetStreakDays
  }
}
