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

const API_BASE = 'http://localhost:7070/api'

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

  const getHeaders = () => {
    const headers: Record<string, string> = {}
    if (auth.token?.value) {
      headers['Authorization'] = `Bearer ${auth.token.value}`
    }
    return headers
  }

  const applyStreakPayload = (data: any) => {
    if (!data) return
    currentStreak.value = data.currentStreak ?? 0
    longestStreak.value = data.longestStreak ?? 0
    streakFreezeCount.value = data.streakFreezeCount ?? 0
    targetStreakDays.value = data.targetStreakDays ?? 7
    isGoalReachedToday.value = data.isGoalReachedToday ?? false

    if (data.today) {
      todayActivity.value = {
        date: data.today.date || new Date().toISOString().split('T')[0],
        readingSeconds: data.today.readingSeconds ?? 0,
        readingMinutes: data.today.readingMinutes ?? Math.floor((data.today.readingSeconds || 0) / 60),
        requiredReadingSeconds: data.today.requiredReadingSeconds ?? 600,
        flashcardsReviewed: data.today.flashcardsReviewed ?? 0,
        requiredFlashcards: data.today.requiredFlashcards ?? 5,
        isReadingCompleted: data.today.isReadingCompleted ?? false,
        isFlashcardsCompleted: data.today.isFlashcardsCompleted ?? false,
        isCompleted: data.today.isCompleted ?? false,
        isFrozen: data.today.isFrozen ?? false
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

    // 1. Carrega do banco local primeiro
    try {
      const localStreak = await streakRepo.get()
      if (localStreak) {
        applyStreakPayload(localStreak)
      }
    } catch (e) {
      console.warn('[useReadingStreak] Falha ao ler streak local:', e)
    }

    // 2. Se online, sincroniza com o backend
    try {
      const data = await $fetch<any>(`${API_BASE}/users/me/streak`, {
        headers: getHeaders()
      })
      applyStreakPayload(data)
      hasFetched.value = true
    } catch (e) {
      console.warn('Não foi possível sincronizar ofensiva com o backend (mantendo local):', e)
    } finally {
      isLoading.value = false
    }
  }

  const recordReadingTime = async (seconds: number) => {
    if (seconds <= 0) return
    try {
      const res = await $fetch<{ status: any; justCompleted: boolean }>(`${API_BASE}/users/me/activity/reading-time`, {
        method: 'POST',
        headers: getHeaders(),
        body: { reading_seconds: Math.min(300, seconds) }
      })

      if (res?.status) {
        applyStreakPayload(res.status)
      }

      if (res?.justCompleted) {
        triggerCelebration(currentStreak.value, targetStreakDays.value)
      }
    } catch (e) {
      console.error('Erro ao registrar tempo de leitura:', e)
      // Otimista local
      todayActivity.value.readingSeconds = (todayActivity.value.readingSeconds ?? 0) + seconds
      todayActivity.value.readingMinutes = Math.floor(todayActivity.value.readingSeconds / 60)
      todayActivity.value.isReadingCompleted = todayActivity.value.readingSeconds >= 600
      if (todayActivity.value.isReadingCompleted && todayActivity.value.isFlashcardsCompleted && !isGoalReachedToday.value) {
        isGoalReachedToday.value = true
        currentStreak.value += 1
        longestStreak.value = Math.max(longestStreak.value, currentStreak.value)
        triggerCelebration(currentStreak.value, targetStreakDays.value)
      }
    }
  }

  const recordFlashcardReview = async (count: number = 1) => {
    if (count <= 0) return
    try {
      const res = await $fetch<{ status: any; justCompleted: boolean }>(`${API_BASE}/users/me/activity/flashcards`, {
        method: 'POST',
        headers: getHeaders(),
        body: { flashcards_count: count }
      })

      if (res?.status) {
        applyStreakPayload(res.status)
      }

      if (res?.justCompleted) {
        triggerCelebration(currentStreak.value, targetStreakDays.value)
      }
    } catch (e) {
      console.error('Erro ao registrar flashcard:', e)
      todayActivity.value.flashcardsReviewed = (todayActivity.value.flashcardsReviewed ?? 0) + count
      todayActivity.value.isFlashcardsCompleted = todayActivity.value.flashcardsReviewed >= 5
      if (todayActivity.value.isReadingCompleted && todayActivity.value.isFlashcardsCompleted && !isGoalReachedToday.value) {
        isGoalReachedToday.value = true
        currentStreak.value += 1
        longestStreak.value = Math.max(longestStreak.value, currentStreak.value)
        triggerCelebration(currentStreak.value, targetStreakDays.value)
      }
    }
  }

  const updateTargetStreakDays = async (newTargetDays: number) => {
    targetStreakDays.value = newTargetDays
    try {
      await $fetch(`${API_BASE}/users/me/streak/target`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: { target_days: newTargetDays }
      })
    } catch (e) {
      console.error('Erro ao atualizar meta de dias da ofensiva:', e)
    }
  }

  // Auto-fetch na primeira inicialização se ainda não tiver buscado
  if (typeof window !== 'undefined' && !hasFetched.value) {
    fetchStreak()
  }

  // Compatibilidade com uso anterior
  const dailyGoalMinutes = computed(() => 10) // 10 minutos fixos por dia
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
    // Compatibilidade
    dailyGoalMinutes,
    todayMinutesRead,
    isGoalReached,
    fetchStreak,
    recordReadingTime,
    recordFlashcardReview,
    updateTargetStreakDays
  }
}
