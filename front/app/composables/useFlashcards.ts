import { ref, computed } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useReadingStreak } from '~/composables/useReadingStreak'

export interface FlashcardItem {
  id: number
  userId: number
  annotationId: number
  bookId: number
  bookTitle: string
  bookCover: string | null
  chapterTitle: string | null
  selectedText: string | null
  note: string | null
  cardType: string
  question: string
  answer: string
  contextSummary: string | null
  repetitionLevel: number
  nextReviewAt: string
  lastReviewedAt?: string | null
  reviewCount?: number
  difficulty?: number
  isReviewed?: boolean
  rating?: 'hard' | 'good' | 'easy' | null
  position?: number
}

export interface DailyDeckResponse {
  date: string
  totalCards: number
  reviewedCount: number
  cards: FlashcardItem[]
}

const API_BASE = 'http://localhost:7070/api'

// Shared module-level reactive state
const dailyDeck = ref<FlashcardItem[]>([])
const firstCard = ref<FlashcardItem | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const deckDate = ref('')
const totalCards = ref(0)
const reviewedCount = ref(0)

export const useFlashcards = () => {
  const auth = useAuth()
  const streak = useReadingStreak()

  const getHeaders = () => {
    const token = typeof useCookie === 'function' ? useCookie('aresta_token').value : null
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  /**
   * Busca o deck de até 50 flashcards do dia para o usuário logado
   */
  const fetchDailyDeck = async (dateStr?: string): Promise<DailyDeckResponse | null> => {
    isLoading.value = true
    error.value = null
    try {
      const url = dateStr
        ? `${API_BASE}/v1/flashcards/daily?date=${encodeURIComponent(dateStr)}`
        : `${API_BASE}/v1/flashcards/daily`

      const res = await $fetch<DailyDeckResponse>(url, {
        method: 'GET',
        headers: getHeaders()
      })

      dailyDeck.value = res.cards || []
      deckDate.value = res.date
      totalCards.value = res.totalCards
      reviewedCount.value = res.reviewedCount

      if (dailyDeck.value.length > 0 && !firstCard.value) {
        firstCard.value = dailyDeck.value[0]
      }

      return res
    } catch (err: any) {
      error.value = err?.message || 'Falha ao carregar deck diário de flashcards'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Busca o primeiro flashcard do dia para exibir no feed da Home
   */
  const fetchFirstDailyCard = async (dateStr?: string): Promise<FlashcardItem | null> => {
    try {
      const url = dateStr
        ? `${API_BASE}/v1/flashcards/daily/first?date=${encodeURIComponent(dateStr)}`
        : `${API_BASE}/v1/flashcards/daily/first`

      const res = await $fetch<{ card: FlashcardItem | null }>(url, {
        method: 'GET',
        headers: getHeaders()
      })

      if (res?.card) {
        firstCard.value = res.card
      }
      return res?.card || null
    } catch (err: any) {
      console.warn('[useFlashcards] Falha ao obter 1º card do dia:', err)
      return null
    }
  }

  /**
   * Registra a autoavaliação (hard, good, easy), atualiza agendamento e incrementa streak
   */
  const reviewFlashcard = async (
    flashcardId: number,
    rating: 'hard' | 'good' | 'easy'
  ) => {
    isSubmitting.value = true
    try {
      const res = await $fetch<{
        flashcard: FlashcardItem
        streak: any
        justCompletedStreakGoal: boolean
      }>(`${API_BASE}/v1/flashcards/${flashcardId}/review`, {
        method: 'POST',
        headers: getHeaders(),
        body: { rating }
      })

      // Atualiza o estado local do card
      const idx = dailyDeck.value.findIndex((c) => c.id === flashcardId)
      if (idx !== -1) {
        dailyDeck.value[idx] = {
          ...dailyDeck.value[idx],
          ...res.flashcard,
          isReviewed: true,
          rating
        }
      }

      // Atualiza contadores
      reviewedCount.value = dailyDeck.value.filter((c) => c.isReviewed).length

      // Sincroniza streak no composable
      await streak.fetchStatus()

      return res
    } catch (err: any) {
      console.error('[useFlashcards] Erro ao avaliar flashcard:', err)
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Dispara geração de flashcards para anotações pendentes
   */
  const generateBatch = async (limit = 50) => {
    isLoading.value = true
    try {
      const res = await $fetch<{
        totalPendingFound: number
        totalGenerated: number
        flashcards: FlashcardItem[]
      }>(`${API_BASE}/v1/flashcards/generate-batch`, {
        method: 'POST',
        headers: getHeaders(),
        body: { limit }
      })

      if (res.totalGenerated > 0) {
        await fetchDailyDeck()
      }

      return res
    } catch (err: any) {
      console.error('[useFlashcards] Erro na geração em lote:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    dailyDeck: computed(() => dailyDeck.value),
    firstCard: computed(() => firstCard.value),
    isLoading: computed(() => isLoading.value),
    isSubmitting: computed(() => isSubmitting.value),
    error: computed(() => error.value),
    deckDate: computed(() => deckDate.value),
    totalCards: computed(() => totalCards.value),
    reviewedCount: computed(() => reviewedCount.value),
    fetchDailyDeck,
    fetchFirstDailyCard,
    reviewFlashcard,
    generateBatch
  }
}
