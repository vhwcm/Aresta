import { ref, computed } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useReadingStreak } from '~/composables/useReadingStreak'
import { flashcardRepo } from '~/adapters/database/repositories/FlashcardRepository'

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

  const mapLocalToFlashcardItem = (f: any): FlashcardItem => ({
    id: Number(f.id),
    userId: f.userId || 0,
    annotationId: f.annotationId || 0,
    bookId: f.bookId || 0,
    bookTitle: f.bookTitle || 'Sem Título',
    bookCover: f.bookCover || null,
    chapterTitle: f.chapterTitle || null,
    selectedText: f.selectedText || null,
    note: f.note || null,
    cardType: f.cardType || 'recall',
    question: f.question || '',
    answer: f.answer || '',
    contextSummary: f.contextSummary || null,
    repetitionLevel: f.repetitionLevel || 0,
    nextReviewAt: f.nextReviewAt || new Date().toISOString(),
    lastReviewedAt: f.lastReviewedAt || null,
    reviewCount: f.reviewCount || 0,
    difficulty: f.difficulty || 0,
    isReviewed: f.isReviewed || false,
    rating: f.rating || null
  })

  /**
   * Busca o deck de flashcards do dia para o usuário com Local-First
   */
  const fetchDailyDeck = async (dateStr?: string): Promise<DailyDeckResponse | null> => {
    isLoading.value = true
    error.value = null

    // 1. Carrega primeiro do banco local
    try {
      const localCards = await flashcardRepo.getAll({ dateStr, onlyDue: false })
      if (localCards && localCards.length > 0) {
        dailyDeck.value = localCards.map(mapLocalToFlashcardItem)
        totalCards.value = dailyDeck.value.length
        reviewedCount.value = dailyDeck.value.filter((c) => c.isReviewed).length
        if (dailyDeck.value.length > 0) {
          firstCard.value = dailyDeck.value[0] || null
        }
      }
    } catch (e) {
      console.warn('[useFlashcards] Falha ao carregar flashcards locais:', e)
    }

    // 2. Se online, sincroniza com o backend
    try {
      const url = dateStr
        ? `${API_BASE}/v1/flashcards/daily?date=${encodeURIComponent(dateStr)}`
        : `${API_BASE}/v1/flashcards/daily`

      const res = await $fetch<DailyDeckResponse>(url, {
        method: 'GET',
        headers: getHeaders()
      })

      if (res && res.cards) {
        dailyDeck.value = res.cards
        deckDate.value = res.date
        totalCards.value = res.totalCards
        reviewedCount.value = res.reviewedCount

        if (dailyDeck.value.length > 0) {
          firstCard.value = dailyDeck.value[0] || null
        }

        // Salva cópia local
        for (const card of res.cards) {
          await flashcardRepo.save({
            id: card.id,
            userId: card.userId,
            annotationId: card.annotationId,
            bookId: card.bookId,
            bookTitle: card.bookTitle,
            bookCover: card.bookCover,
            chapterTitle: card.chapterTitle,
            selectedText: card.selectedText,
            note: card.note,
            cardType: card.cardType,
            question: card.question,
            answer: card.answer,
            contextSummary: card.contextSummary,
            repetitionLevel: card.repetitionLevel,
            nextReviewAt: card.nextReviewAt,
            lastReviewedAt: card.lastReviewedAt,
            reviewCount: card.reviewCount,
            difficulty: card.difficulty,
            isReviewed: card.isReviewed,
            rating: card.rating
          })
        }
      }

      return res
    } catch (err: any) {
      if (dailyDeck.value.length === 0) {
        error.value = err?.message || 'Falha ao carregar deck diário de flashcards'
      }
      return {
        date: dateStr || (new Date().toISOString().split('T')[0] ?? ''),
        totalCards: totalCards.value,
        reviewedCount: reviewedCount.value,
        cards: dailyDeck.value
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Busca o primeiro flashcard do dia para exibir no feed da Home
   */
  const fetchFirstDailyCard = async (dateStr?: string): Promise<FlashcardItem | null> => {
    if (firstCard.value) return firstCard.value
    await fetchDailyDeck(dateStr)
    return firstCard.value
  }

  /**
   * Registra a autoavaliação (hard, good, easy), atualiza agendamento e incrementa streak
   */
  const reviewFlashcard = async (
    flashcardId: number,
    rating: 'hard' | 'good' | 'easy'
  ) => {
    isSubmitting.value = true

    // Atualiza localmente
    const idx = dailyDeck.value.findIndex((c) => c.id === flashcardId)
    if (idx !== -1) {
      const card = dailyDeck.value[idx]!
      card.isReviewed = true
      card.rating = rating
      card.reviewCount = (card.reviewCount || 0) + 1
      card.lastReviewedAt = new Date().toISOString()
      await flashcardRepo.save({
        id: card.id,
        question: card.question,
        answer: card.answer,
        isReviewed: true,
        rating,
        lastReviewedAt: card.lastReviewedAt
      })
    }
    reviewedCount.value = dailyDeck.value.filter((c) => c.isReviewed).length

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

      if (res && res.flashcard && idx !== -1) {
        dailyDeck.value[idx] = {
          ...dailyDeck.value[idx],
          ...res.flashcard,
          isReviewed: true,
          rating
        }
      }

      await streak.fetchStreak()
      return res
    } catch (err: any) {
      console.warn('Avaliação gravada localmente (offline):', err)
      await streak.recordFlashcardReview(1)
      return { flashcard: dailyDeck.value[idx]!, streak: null, justCompletedStreakGoal: false }
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Dispara geração de flashcards para anotações pendentes via IA
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
