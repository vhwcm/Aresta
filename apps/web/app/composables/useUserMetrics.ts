import { ref, computed } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { getApiBase } from '~/utils/apiBase'

export interface UserMetricsData {
  books: {
    total: number
    activeReading: number
  }
  readingTime: {
    totalSeconds: number
    totalHoursFormatted: string
    averageMinutesPerDay: number
  }
  knowledge: {
    totalNodes: number
    canvasCount: number
  }
  memory: {
    retentionRate: number
    totalFlashcards: number
    reviewedCount: number
  }
  memberSince: string
}

const defaultMetrics: UserMetricsData = {
  books: { total: 0, activeReading: 0 },
  readingTime: { totalSeconds: 0, totalHoursFormatted: '0.0', averageMinutesPerDay: 0 },
  knowledge: { totalNodes: 0, canvasCount: 0 },
  memory: { retentionRate: 100, totalFlashcards: 0, reviewedCount: 0 },
  memberSince: '',
}

// Module-level reactive state
const metrics = ref<UserMetricsData>({ ...defaultMetrics })
const isLoading = ref(false)
const hasFetched = ref(false)
const error = ref<string | null>(null)

export const useUserMetrics = () => {
  const auth = useAuth()

  const memberSinceFormatted = computed(() => {
    const rawDate = metrics.value.memberSince || auth.user.value?.created_at
    if (!rawDate) return 'Membro do Aresta'

    try {
      const date = new Date(rawDate)
      if (isNaN(date.getTime())) return 'Membro do Aresta'

      const monthName = date.toLocaleDateString('pt-BR', { month: 'long' })
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)
      const year = date.getFullYear()

      return `Membro desde ${capitalizedMonth} de ${year}`
    } catch {
      return 'Membro do Aresta'
    }
  })

  const getHeaders = () => {
    const headers: Record<string, string> = {}
    if (auth.token?.value) {
      headers['Authorization'] = `Bearer ${auth.token.value}`
    }
    return headers
  }

  const fetchMetrics = async (options: { force?: boolean } = {}) => {
    if (isLoading.value) return
    if (hasFetched.value && !options.force) return
    if (!auth.isLoggedIn.value) return

    isLoading.value = true
    error.value = null

    try {
      const apiBase = getApiBase()
      const res = await fetch(`${apiBase}/api/users/me/metrics`, {
        headers: getHeaders(),
      })

      if (res.ok) {
        const data = await res.json()
        if (data && data.metrics) {
          metrics.value = {
            books: {
              total: Number(data.metrics.books?.total ?? 0),
              activeReading: Number(data.metrics.books?.activeReading ?? 0),
            },
            readingTime: {
              totalSeconds: Number(data.metrics.readingTime?.totalSeconds ?? 0),
              totalHoursFormatted: String(data.metrics.readingTime?.totalHoursFormatted ?? '0.0'),
              averageMinutesPerDay: Number(data.metrics.readingTime?.averageMinutesPerDay ?? 0),
            },
            knowledge: {
              totalNodes: Number(data.metrics.knowledge?.totalNodes ?? 0),
              canvasCount: Number(data.metrics.knowledge?.canvasCount ?? 0),
            },
            memory: {
              retentionRate: Number(data.metrics.memory?.retentionRate ?? 100),
              totalFlashcards: Number(data.metrics.memory?.totalFlashcards ?? 0),
              reviewedCount: Number(data.metrics.memory?.reviewedCount ?? 0),
            },
            memberSince: data.metrics.memberSince || '',
          }
          hasFetched.value = true
        }
      } else {
        error.value = `Erro ao carregar métricas: HTTP ${res.status}`
      }
    } catch (err: any) {
      error.value = err.message || 'Falha na comunicação ao carregar métricas'
    } finally {
      isLoading.value = false
    }
  }

  const resetMetrics = () => {
    metrics.value = { ...defaultMetrics }
    hasFetched.value = false
    isLoading.value = false
    error.value = null
  }

  return {
    metrics,
    isLoading,
    hasFetched,
    error,
    memberSinceFormatted,
    fetchMetrics,
    resetMetrics,
  }
}
