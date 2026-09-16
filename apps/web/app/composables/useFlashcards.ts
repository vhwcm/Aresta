import { ref, computed } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useReadingStreak } from '~/composables/useReadingStreak'
import { flashcardRepo } from '~/adapters/database/repositories/FlashcardRepository'
import { getApiBase } from '~/utils/apiBase'

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
  sourceType?: 'book_annotation' | 'canvas_note'
  sourceUrl?: string | null
  sourceTitle?: string | null
  noteId?: string | null
}

export interface DailyDeckResponse {
  date: string
  totalCards: number
  reviewedCount: number
  cards: FlashcardItem[]
}

// Shared module-level reactive state
const dailyDeck = ref<FlashcardItem[]>([])
const firstCard = ref<FlashcardItem | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const deckDate = ref('')
const totalCards = ref(0)
const reviewedCount = ref(0)

export const resetFlashcardsMemory = () => {
  dailyDeck.value = []
  firstCard.value = null
  isLoading.value = false
  isSubmitting.value = false
  error.value = null
  deckDate.value = ''
  totalCards.value = 0
  reviewedCount.value = 0
}

export const useFlashcards = () => {
  const auth = useAuth()
  const streak = useReadingStreak()

  const getHeaders = () => {
    const token = auth.token?.value || (typeof useCookie === 'function' ? useCookie('aresta_token').value : null)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  const mapLocalToFlashcardItem = (f: any): FlashcardItem => {
    const isNote = f.sourceType === 'canvas_note' || f.noteId || f.cfi?.startsWith('note:')
    const noteId = f.noteId || (f.cfi?.startsWith('note:') ? f.cfi.replace(/^note:/, '') : null)
    return {
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
      rating: f.rating || null,
      sourceType: f.sourceType || (isNote ? 'canvas_note' : 'book_annotation'),
      sourceUrl: f.sourceUrl || (isNote
        ? `/canvas?tab=notes&noteId=${noteId}`
        : (f.bookId ? `/reader?bookId=${f.bookId}` : null)),
      sourceTitle: f.sourceTitle || f.bookTitle || (isNote ? 'Nota no Canvas' : 'Obra'),
      noteId
    }
  }

  const fetchDailyDeck = async (dateStr?: string): Promise<DailyDeckResponse | null> => {
    if (dailyDeck.value.length === 0) {
      isLoading.value = true
    }
    error.value = null

    try {
      const localCards = await flashcardRepo.getAll({ dateStr, onlyDue: false })
      const mapped = localCards.map(mapLocalToFlashcardItem)
      dailyDeck.value = mapped
      deckDate.value = dateStr || new Date().toISOString().split('T')[0]!
      totalCards.value = mapped.length
      reviewedCount.value = mapped.filter((c) => c.isReviewed).length
      if (mapped.length > 0) {
        firstCard.value = mapped[0] || null
      }
      return {
        date: deckDate.value,
        totalCards: totalCards.value,
        reviewedCount: reviewedCount.value,
        cards: mapped
      }
    } catch (e: any) {
      console.warn('[useFlashcards] Falha ao carregar flashcards locais:', e)
      error.value = 'Falha ao carregar deck diário de flashcards'
      return {
        date: dateStr || new Date().toISOString().split('T')[0]!,
        totalCards: 0,
        reviewedCount: 0,
        cards: []
      }
    } finally {
      isLoading.value = false
    }
  }

  const fetchFirstDailyCard = async (dateStr?: string): Promise<FlashcardItem | null> => {
    if (firstCard.value) return firstCard.value
    await fetchDailyDeck(dateStr)
    return firstCard.value
  }

  const reviewFlashcard = async (
    flashcardId: number,
    rating: 'hard' | 'good' | 'easy'
  ) => {
    isSubmitting.value = true

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

    await streak.recordFlashcardReview(1)
    isSubmitting.value = false
    return { flashcard: dailyDeck.value[idx] || null, streak: null, justCompletedStreakGoal: false }
  }

  const generateBatch = async (_limit = 50) => {
    await fetchDailyDeck()
    return {
      totalPendingFound: 0,
      totalGenerated: 0,
      flashcards: dailyDeck.value
    }
  }

  const generateAiFlashcardForAnnotation = async (annotation: any) => {
    isLoading.value = true
    let question = ''
    let answer = ''
    let contextSummary: string | null = null

    const isNote = annotation.cfi?.startsWith('note:') || annotation.sourceType === 'canvas_note' || Boolean(annotation.noteId)
    const noteId = annotation.noteId || (annotation.cfi?.startsWith('note:') ? annotation.cfi.replace(/^note:/, '') : null)
    const title = annotation.bookTitle || annotation.chapterTitle || (isNote ? 'Nota' : 'Livro')
    const selectedText = annotation.selectedText || ''
    const noteContent = annotation.note || ''

    try {
      const res = await $fetch<{ question: string; answer: string; contextSummary: string }>(
        `${getApiBase()}/ai/flashcard`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: {
            selectedText: selectedText || noteContent,
            note: noteContent || undefined,
            bookTitle: title,
            chapterTitle: annotation.chapterTitle || undefined,
            cardType: 'CONCEPT_RECALL'
          }
        }
      )
      if (res?.question && res?.answer) {
        question = res.question
        answer = res.answer
        contextSummary = res.contextSummary || null
      }
    } catch {
      // Fallback socrático inteligente se IA indisponível
    }

    if (!question || !answer) {
      if (noteContent && selectedText) {
        question = `O que significa a reflexão "${noteContent}" em relação ao trecho grifado?`
        answer = selectedText
      } else if (noteContent) {
        question = `Qual o conceito principal sintetizado nesta anotação?`
        answer = noteContent
      } else {
        const snippet = selectedText.slice(0, 80)
        question = `Explique a ideia central do trecho: "${snippet}${selectedText.length > 80 ? '...' : ''}"`
        answer = selectedText
      }
      contextSummary = noteContent || selectedText.slice(0, 100)
    }

    const saved = await flashcardRepo.createFromAnnotation(
      {
        id: annotation.id,
        userId: annotation.userId || 0,
        bookId: annotation.bookId || 1,
        bookTitle: title,
        bookCover: annotation.bookCover || null,
        chapterTitle: annotation.chapterTitle || null,
        selectedText,
        note: noteContent,
        cfi: annotation.cfi || (isNote ? `note:${noteId}` : ''),
        createdAt: annotation.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sync_status: 'pending'
      },
      question,
      answer,
      {
        sourceType: isNote ? 'canvas_note' : 'book_annotation',
        sourceUrl: isNote
          ? `/canvas?tab=notes&noteId=${noteId}`
          : `/reader?bookId=${annotation.bookId || 1}${annotation.cfi ? `&cfi=${encodeURIComponent(annotation.cfi)}` : ''}`,
        sourceTitle: title,
        noteId
      }
    )

    await fetchDailyDeck()
    isLoading.value = false
    return saved
  }

  const deleteFlashcardByAnnotationId = async (annotationId: number) => {
    await flashcardRepo.deleteByAnnotationId(annotationId)
    dailyDeck.value = dailyDeck.value.filter((c) => c.annotationId !== annotationId)
    totalCards.value = dailyDeck.value.length
    if (firstCard.value?.annotationId === annotationId) {
      firstCard.value = dailyDeck.value[0] || null
    }
  }

  const deleteFlashcardByNoteId = async (noteId: string) => {
    await flashcardRepo.deleteByNoteId(noteId)
    dailyDeck.value = dailyDeck.value.filter((c) => c.noteId !== noteId && !c.sourceUrl?.includes(noteId))
    totalCards.value = dailyDeck.value.length
    if (firstCard.value?.noteId === noteId) {
      firstCard.value = dailyDeck.value[0] || null
    }
  }

  const deleteFlashcardsByBookId = async (bookId: number) => {
    try {
      await flashcardRepo.deleteByBookId(bookId)
      dailyDeck.value = dailyDeck.value.filter((c) => Number(c.bookId) !== Number(bookId))
      totalCards.value = dailyDeck.value.length
      if (firstCard.value && Number(firstCard.value.bookId) === Number(bookId)) {
        firstCard.value = dailyDeck.value[0] || null
      }
    } catch (e) {
      console.warn('[useFlashcards] Erro ao excluir flashcards por bookId:', e)
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
    generateBatch,
    generateAiFlashcardForAnnotation,
    deleteFlashcardByAnnotationId,
    deleteFlashcardByNoteId,
    deleteFlashcardsByBookId
  }
}
