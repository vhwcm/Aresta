import { ref, computed } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'
import { streakRepo } from '~/adapters/database/repositories/StreakRepository'
import { canvasRepo } from '~/adapters/database/repositories/CanvasRepository'
import { flashcardRepo } from '~/adapters/database/repositories/FlashcardRepository'
import { annotationRepo } from '~/adapters/database/repositories/AnnotationRepository'

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
    const rawUser = auth.user.value as any
    const rawDate = metrics.value.memberSince || rawUser?.created_at || rawUser?.createdAt
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

  const fetchMetrics = async (options: { force?: boolean } = {}) => {
    if (isLoading.value) return
    if (hasFetched.value && !options.force) return

    isLoading.value = true
    error.value = null

    try {
      // Calcula a partir do banco local
      const [books, streak, canvases, flashcards, annotations] = await Promise.all([
        bookRepo.getAll().catch(() => []),
        streakRepo.get().catch(() => null),
        canvasRepo.getAll().catch(() => []),
        flashcardRepo.getAll().catch(() => []),
        annotationRepo.getAll().catch(() => []),
      ])

      const totalBooks = books.length
      const activeBooks = books.filter((b) => (b.currentPage || 0) > 0 || b.status === 'LENDO').length

      let readingSeconds = 0
      if (streak?.todayActivity?.readingSeconds) {
        readingSeconds += streak.todayActivity.readingSeconds
      }
      if (Array.isArray(streak?.weeklyActivity)) {
        streak.weeklyActivity.forEach((w) => {
          readingSeconds += w.readingSeconds || 0
        })
      }
      const totalHours = (readingSeconds / 3600).toFixed(1)
      const avgMinutes = Math.round(readingSeconds / 60 / 7)

      let totalNodes = 0
      canvases.forEach((c) => {
        totalNodes += c.nodeCount || c.document?.nodes?.length || 0
      })
      totalNodes += annotations.length

      const totalCards = flashcards.length
      const reviewedCards = flashcards.filter((f) => f.isReviewed).length
      const retentionRate = totalCards > 0 ? Math.round((reviewedCards / totalCards) * 100) : 100

      const rawUser = auth.user.value as any
      const memberSince = rawUser?.created_at || rawUser?.createdAt || new Date().toISOString()

      metrics.value = {
        books: {
          total: totalBooks,
          activeReading: activeBooks,
        },
        readingTime: {
          totalSeconds: readingSeconds,
          totalHoursFormatted: totalHours,
          averageMinutesPerDay: avgMinutes,
        },
        knowledge: {
          totalNodes,
          canvasCount: canvases.length,
        },
        memory: {
          retentionRate,
          totalFlashcards: totalCards,
          reviewedCount: reviewedCards,
        },
        memberSince,
      }
      hasFetched.value = true
    } catch (err: any) {
      console.warn('[useUserMetrics] Falha ao calcular métricas locais:', err)
      error.value = err.message || 'Falha ao calcular métricas locais'
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
