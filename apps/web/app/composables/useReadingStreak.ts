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

const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function getTodayIsoString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDayLabelFromDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-').map(Number)
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const d = new Date(parts[0], parts[1] - 1, parts[2])
      return DAY_LABELS[d.getDay()] || 'D'
    }
  } catch {}
  return 'D'
}

function generateWeeklyActivity(todayStr: string, existingList: StreakDay[] = [], currentToday?: Partial<StreakDay>): StreakDay[] {
  const result: StreakDay[] = []
  const existingMap = new Map<string, StreakDay>()
  for (const item of existingList) {
    if (item && item.date) {
      existingMap.set(item.date, item)
    }
  }

  const parts = todayStr.split('-').map(Number)
  const baseYear = parts[0] || new Date().getFullYear()
  const baseMonth = (parts[1] || (new Date().getMonth() + 1)) - 1
  const baseDay = parts[2] || new Date().getDate()
  const baseDate = new Date(baseYear, baseMonth, baseDay)

  for (let i = 6; i >= 0; i--) {
    const d = new Date(baseDate)
    d.setDate(baseDate.getDate() - i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dt = String(d.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${dt}`
    const dayLabel = DAY_LABELS[d.getDay()] || 'D'

    const existing = existingMap.get(dateStr)

    if (dateStr === todayStr && currentToday) {
      result.push({
        date: dateStr,
        dayLabel,
        readingSeconds: currentToday.readingSeconds ?? existing?.readingSeconds ?? 0,
        readingMinutes: currentToday.readingMinutes ?? existing?.readingMinutes ?? 0,
        flashcardsReviewed: currentToday.flashcardsReviewed ?? existing?.flashcardsReviewed ?? 0,
        completed: currentToday.completed ?? existing?.completed ?? false,
        frozen: currentToday.frozen ?? existing?.frozen ?? false
      })
    } else if (existing) {
      result.push({
        ...existing,
        date: dateStr,
        dayLabel
      })
    } else {
      result.push({
        date: dateStr,
        dayLabel,
        readingSeconds: 0,
        readingMinutes: 0,
        flashcardsReviewed: 0,
        completed: false,
        frozen: false
      })
    }
  }

  return result
}

// Shared module-level reactive state
const currentStreak = ref(0)
const longestStreak = ref(0)
const streakFreezeCount = ref(0)
const targetStreakDays = ref(7)
const isGoalReachedToday = ref(false)

const todayActivity = ref<TodayActivity>({
  date: getTodayIsoString(),
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

const weeklyActivity = ref<StreakDay[]>(generateWeeklyActivity(getTodayIsoString()))

const isLoading = ref(false)
const hasFetched = ref(false)

function syncDateRollover() {
  const todayIso = getTodayIsoString()
  if (todayActivity.value.date !== todayIso) {
    const prevDate = todayActivity.value.date
    const prevCompleted = todayActivity.value.isCompleted || isGoalReachedToday.value

    if (prevDate) {
      const prevTime = new Date(prevDate).getTime()
      const todayTime = new Date(todayIso).getTime()
      const diffDays = Math.round((todayTime - prevTime) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        if (!prevCompleted) {
          if (streakFreezeCount.value > 0) {
            streakFreezeCount.value -= 1
          } else {
            currentStreak.value = 0
          }
        }
      } else if (diffDays > 1) {
        const missedDays = diffDays - 1
        if (streakFreezeCount.value >= missedDays && prevCompleted) {
          streakFreezeCount.value -= missedDays
        } else {
          currentStreak.value = 0
        }
      }
    }

    todayActivity.value = {
      date: todayIso,
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
    isGoalReachedToday.value = false
    weeklyActivity.value = generateWeeklyActivity(todayIso, weeklyActivity.value, {
      readingSeconds: 0,
      readingMinutes: 0,
      flashcardsReviewed: 0,
      completed: false,
      frozen: false
    })
  }
}

export const useReadingStreak = () => {
  const auth = useAuth()
  const { triggerCelebration } = useStreakCelebration()

  const syncWeeklyToday = () => {
    weeklyActivity.value = generateWeeklyActivity(todayActivity.value.date, weeklyActivity.value, {
      readingSeconds: todayActivity.value.readingSeconds,
      readingMinutes: todayActivity.value.readingMinutes,
      flashcardsReviewed: todayActivity.value.flashcardsReviewed,
      completed: isGoalReachedToday.value || todayActivity.value.isCompleted,
      frozen: todayActivity.value.isFrozen
    })
  }

  const applyStreakPayload = (data: any) => {
    if (!data) return
    currentStreak.value = data.currentStreak ?? 0
    longestStreak.value = data.longestStreak ?? 0
    streakFreezeCount.value = data.streakFreezeCount ?? 0
    targetStreakDays.value = data.targetStreakDays ?? 7
    isGoalReachedToday.value = data.isGoalReachedToday ?? false

    const todayIso = getTodayIsoString()
    const rawToday = data.todayActivity || data.today

    if (rawToday) {
      const dataDate = rawToday.date || todayIso
      if (dataDate === todayIso) {
        todayActivity.value = {
          date: todayIso,
          readingSeconds: rawToday.readingSeconds ?? 0,
          readingMinutes: rawToday.readingMinutes ?? Math.floor((rawToday.readingSeconds || 0) / 60),
          requiredReadingSeconds: rawToday.requiredReadingSeconds ?? 600,
          flashcardsReviewed: rawToday.flashcardsReviewed ?? 0,
          requiredFlashcards: rawToday.requiredFlashcards ?? 5,
          isReadingCompleted: rawToday.isReadingCompleted ?? ((rawToday.readingSeconds || 0) >= 600),
          isFlashcardsCompleted: rawToday.isFlashcardsCompleted ?? ((rawToday.flashcardsReviewed || 0) >= 5),
          isCompleted: rawToday.isCompleted ?? isGoalReachedToday.value,
          isFrozen: rawToday.isFrozen ?? false
        }
        if (todayActivity.value.isReadingCompleted || todayActivity.value.isFlashcardsCompleted) {
          isGoalReachedToday.value = true
          todayActivity.value.isCompleted = true
        }
      } else {
        todayActivity.value.date = dataDate
        todayActivity.value.readingSeconds = rawToday.readingSeconds ?? 0
        todayActivity.value.isCompleted = rawToday.isCompleted ?? isGoalReachedToday.value
        syncDateRollover()
      }
    } else {
      syncDateRollover()
    }

    const rawWeekly = Array.isArray(data.weeklyActivity) ? data.weeklyActivity : []
    weeklyActivity.value = generateWeeklyActivity(todayIso, rawWeekly, {
      readingSeconds: todayActivity.value.readingSeconds,
      readingMinutes: todayActivity.value.readingMinutes,
      flashcardsReviewed: todayActivity.value.flashcardsReviewed,
      completed: isGoalReachedToday.value || todayActivity.value.isCompleted,
      frozen: todayActivity.value.isFrozen
    })

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
      } else {
        syncDateRollover()
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
    syncDateRollover()

    todayActivity.value.readingSeconds = (todayActivity.value.readingSeconds ?? 0) + seconds
    todayActivity.value.readingMinutes = Math.floor(todayActivity.value.readingSeconds / 60)
    todayActivity.value.isReadingCompleted = todayActivity.value.readingSeconds >= 600

    const newlyCompleted = (todayActivity.value.isReadingCompleted || todayActivity.value.isFlashcardsCompleted) && !isGoalReachedToday.value

    if (newlyCompleted) {
      isGoalReachedToday.value = true
      todayActivity.value.isCompleted = true
      currentStreak.value += 1
      longestStreak.value = Math.max(longestStreak.value, currentStreak.value)

      if (currentStreak.value > 0 && currentStreak.value % 7 === 0 && streakFreezeCount.value < 2) {
        streakFreezeCount.value += 1
      }

      triggerCelebration(currentStreak.value, targetStreakDays.value)
    }

    syncWeeklyToday()

    await streakRepo.save({
      currentStreak: currentStreak.value,
      longestStreak: longestStreak.value,
      streakFreezeCount: streakFreezeCount.value,
      targetStreakDays: targetStreakDays.value,
      isGoalReachedToday: isGoalReachedToday.value,
      todayActivity: todayActivity.value,
      weeklyActivity: weeklyActivity.value
    }).catch((e) => console.warn('[useReadingStreak] Falha ao persistir streak local:', e))
  }

  const recordFlashcardReview = async (count: number = 1) => {
    if (count <= 0) return
    syncDateRollover()

    todayActivity.value.flashcardsReviewed = (todayActivity.value.flashcardsReviewed ?? 0) + count
    todayActivity.value.isFlashcardsCompleted = todayActivity.value.flashcardsReviewed >= 5

    const newlyCompleted = (todayActivity.value.isReadingCompleted || todayActivity.value.isFlashcardsCompleted) && !isGoalReachedToday.value

    if (newlyCompleted) {
      isGoalReachedToday.value = true
      todayActivity.value.isCompleted = true
      currentStreak.value += 1
      longestStreak.value = Math.max(longestStreak.value, currentStreak.value)

      if (currentStreak.value > 0 && currentStreak.value % 7 === 0 && streakFreezeCount.value < 2) {
        streakFreezeCount.value += 1
      }

      triggerCelebration(currentStreak.value, targetStreakDays.value)
    }

    syncWeeklyToday()

    await streakRepo.save({
      currentStreak: currentStreak.value,
      longestStreak: longestStreak.value,
      streakFreezeCount: streakFreezeCount.value,
      targetStreakDays: targetStreakDays.value,
      isGoalReachedToday: isGoalReachedToday.value,
      todayActivity: todayActivity.value,
      weeklyActivity: weeklyActivity.value
    }).catch((e) => console.warn('[useReadingStreak] Falha ao persistir streak local:', e))
  }

  const updateTargetStreakDays = async (newTargetDays: number) => {
    targetStreakDays.value = newTargetDays
    syncWeeklyToday()
    await streakRepo.save({
      currentStreak: currentStreak.value,
      longestStreak: longestStreak.value,
      streakFreezeCount: streakFreezeCount.value,
      targetStreakDays: newTargetDays,
      isGoalReachedToday: isGoalReachedToday.value,
      todayActivity: todayActivity.value,
      weeklyActivity: weeklyActivity.value
    }).catch((e) => console.warn('[useReadingStreak] Falha ao persistir streak local:', e))
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

