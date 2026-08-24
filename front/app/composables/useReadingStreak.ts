import { ref, computed } from 'vue'

export interface StreakDay {
  date: string
  dayLabel: string
  completed: boolean
  minutesRead: number
}

export const useReadingStreak = () => {
  const currentStreak = ref(14)
  const longestStreak = ref(28)
  const dailyGoalMinutes = ref(20)
  const todayMinutesRead = ref(25)
  const isGoalReached = computed(() => todayMinutesRead.value >= dailyGoalMinutes.value)

  const weeklyActivity = ref<StreakDay[]>([
    { date: '2026-08-18', dayLabel: 'S', completed: true, minutesRead: 22 },
    { date: '2026-08-19', dayLabel: 'T', completed: true, minutesRead: 35 },
    { date: '2026-08-20', dayLabel: 'Q', completed: true, minutesRead: 20 },
    { date: '2026-08-21', dayLabel: 'Q', completed: true, minutesRead: 40 },
    { date: '2026-08-22', dayLabel: 'S', completed: true, minutesRead: 18 },
    { date: '2026-08-23', dayLabel: 'S', completed: true, minutesRead: 30 },
    { date: '2026-08-24', dayLabel: 'D', completed: true, minutesRead: 25 },
  ])

  const addReadingMinutes = (minutes: number) => {
    todayMinutesRead.value += minutes
    const todayIndex = weeklyActivity.value.length - 1
    if (weeklyActivity.value[todayIndex]) {
      weeklyActivity.value[todayIndex].minutesRead += minutes
      weeklyActivity.value[todayIndex].completed = todayMinutesRead.value >= dailyGoalMinutes.value
    }
  }

  return {
    currentStreak,
    longestStreak,
    dailyGoalMinutes,
    todayMinutesRead,
    isGoalReached,
    weeklyActivity,
    addReadingMinutes
  }
}
