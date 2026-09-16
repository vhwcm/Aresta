import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { annotationRepo } from '~/adapters/database/repositories/AnnotationRepository'
import { flashcardRepo } from '~/adapters/database/repositories/FlashcardRepository'
import { useFlashcards } from '~/composables/useFlashcards'

export interface AnnotationTheme {
  id: number
  name: string
  color?: string | null
}

export interface AnnotationItem {
  id: number
  userId: number
  bookId: number
  bookTitle?: string
  bookCover?: string
  cfi: string
  selectedText?: string | null
  note?: string | null
  color?: string | null
  chapterTitle?: string | null
  progress?: number | null
  themes?: AnnotationTheme[]
  hasFlashcard?: boolean
  flashcardId?: number
  sourceType?: 'book' | 'canvas_note'
  noteId?: string | null
  createdAt: string
  updatedAt?: string
}

export interface CreateAnnotationPayload {
  bookId: number
  cfi: string
  selectedText?: string | null
  note?: string | null
  color?: string | null
  chapterTitle?: string | null
  progress?: number
  themeIds?: number[]
  bookTitle?: string
  bookCover?: string
  generateFlashcard?: boolean
  noteId?: string | null
}

// Estado reativo compartilhado a nível de módulo
const sharedAnnotations = ref<AnnotationItem[]>([])
const sharedLoading = ref(false)
const sharedError = ref<string | null>(null)

export const resetAnnotationsMemory = () => {
  sharedAnnotations.value = []
  sharedLoading.value = false
  sharedError.value = null
}

export const useAnnotations = () => {
  const annotations = sharedAnnotations
  const loading = sharedLoading
  const error = sharedError
  const auth = useAuth()

  const normalizeItem = (a: any): AnnotationItem => {
    if (!a) return a
    const isNote = a.cfi?.startsWith('note:') || a.sourceType === 'canvas_note' || Boolean(a.noteId)
    const noteId = a.noteId || (a.cfi?.startsWith('note:') ? a.cfi.replace(/^note:/, '') : null)

    const item: any = {
      id: Number(a.id),
      userId: a.userId ?? a.user_id ?? 0,
      bookId: Number(a.bookId ?? a.book_id ?? 1),
      cfi: a.cfi || '',
      selectedText: a.selectedText ?? a.selected_text ?? '',
      note: a.note ?? '',
      themes: a.themes || (a.annotationThemes ? a.annotationThemes.map((at: any) => at.theme) : []),
      hasFlashcard: Boolean(a.hasFlashcard || a.flashcard),
      flashcardId: a.flashcard?.id || a.flashcardId,
      sourceType: isNote ? 'canvas_note' : 'book',
      noteId
    }

    let resolvedColor: string | null = a.color || null
    if (!resolvedColor && a.cfi && a.cfi.includes('#color=')) {
      const colorMatch = a.cfi.match(/#color=([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/)
      if (colorMatch && colorMatch[1]) {
        resolvedColor = `#${colorMatch[1]}`
      }
    }

    if (resolvedColor) item.color = resolvedColor
    if (a.chapterTitle || a.chapter_title) item.chapterTitle = a.chapterTitle || a.chapter_title
    if (a.progress !== undefined) item.progress = a.progress
    if (a.bookTitle || a.book?.title) item.bookTitle = a.bookTitle || a.book?.title
    if (a.bookCover || a.book?.cover_path) item.bookCover = a.bookCover || a.book?.cover_path
    if (a.createdAt || a.created_at) item.createdAt = a.createdAt || a.created_at
    if (a.updatedAt || a.updated_at) item.updatedAt = a.updatedAt || a.updated_at
    return item as AnnotationItem
  }

  const checkFlashcardStatus = async () => {
    try {
      const allCards = await flashcardRepo.getAll()
      const cardMap = new Map<number, number>()
      for (const card of allCards) {
        if (card.annotationId) {
          cardMap.set(card.annotationId, card.id)
        }
      }
      for (const ann of annotations.value) {
        if (cardMap.has(ann.id)) {
          ann.hasFlashcard = true
          ann.flashcardId = cardMap.get(ann.id)
        } else {
          ann.hasFlashcard = false
          ann.flashcardId = undefined
        }
      }
    } catch {
      // fallback
    }
  }

  const fetchAnnotations = async (filters?: { bookId?: number; themeId?: number }) => {
    if (annotations.value.length === 0) {
      loading.value = true
    }
    error.value = null

    try {
      const localNotes = await annotationRepo.getAll(filters)
      annotations.value = localNotes.map(normalizeItem)
    } catch (e) {
      console.warn('[useAnnotations] Falha ao carregar anotações locais:', e)
      error.value = 'Falha ao carregar anotações locais.'
    } finally {
      loading.value = false
    }

    await checkFlashcardStatus()
    return annotations.value
  }

  const createAnnotation = async (payload: CreateAnnotationPayload): Promise<AnnotationItem> => {
    loading.value = true
    error.value = null
    const localId = Date.now()
    const now = new Date().toISOString()
    const isNote = payload.cfi?.startsWith('note:') || Boolean(payload.noteId)
    const noteId = payload.noteId || (payload.cfi?.startsWith('note:') ? payload.cfi.replace(/^note:/, '') : null)

    const rawCfi = payload.cfi
    const effectiveColor = payload.color || (rawCfi?.includes('#color=') ? `#${rawCfi.match(/#color=([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/)?.[1]}` : null) || '#E57B55'
    const finalCfi = rawCfi && !rawCfi.includes('#color=') ? `${rawCfi}#color=${effectiveColor.replace('#', '')}` : rawCfi

    const localItem: AnnotationItem = {
      id: localId,
      userId: 0,
      bookId: payload.bookId,
      bookTitle: payload.bookTitle,
      bookCover: payload.bookCover,
      cfi: finalCfi,
      selectedText: payload.selectedText,
      note: payload.note,
      color: effectiveColor,
      chapterTitle: payload.chapterTitle,
      progress: payload.progress,
      themes: [],
      hasFlashcard: Boolean(payload.generateFlashcard),
      sourceType: isNote ? 'canvas_note' : 'book',
      noteId,
      createdAt: now
    }

    await annotationRepo.save({
      id: localId,
      bookId: payload.bookId,
      bookTitle: payload.bookTitle,
      bookCover: payload.bookCover,
      cfi: finalCfi,
      selectedText: payload.selectedText,
      note: payload.note,
      color: effectiveColor,
      chapterTitle: payload.chapterTitle,
      progress: payload.progress,
      createdAt: now
    })
    annotations.value = [localItem, ...annotations.value]
    loading.value = false

    if (payload.generateFlashcard) {
      const flashcards = useFlashcards()
      flashcards.generateAiFlashcardForAnnotation(localItem).then((card) => {
        localItem.hasFlashcard = true
        localItem.flashcardId = card.id
      }).catch((err) => {
        console.warn('Erro ao gerar flashcard com IA em background:', err)
      })
    }

    return localItem
  }

  const updateAnnotationNote = async (id: number, note: string): Promise<AnnotationItem> => {
    loading.value = true
    error.value = null

    const existing = annotations.value.find((a) => a.id === id)
    if (existing) {
      existing.note = note
      await annotationRepo.save({
        id: existing.id,
        bookId: existing.bookId,
        cfi: existing.cfi,
        note
      })
    }
    loading.value = false
    return existing as AnnotationItem
  }

  const deleteAnnotation = async (id: number): Promise<boolean> => {
    loading.value = true
    error.value = null

    await annotationRepo.delete(id)
    await flashcardRepo.deleteByAnnotationId(id)
    annotations.value = annotations.value.filter((a) => a.id !== id)
    loading.value = false
    return true
  }

  const toggleAnnotationFlashcard = async (annotationId: number) => {
    const ann = annotations.value.find((a) => a.id === annotationId)
    if (!ann) return
    const flashcards = useFlashcards()
    if (ann.hasFlashcard) {
      await flashcards.deleteFlashcardByAnnotationId(annotationId)
      ann.hasFlashcard = false
      ann.flashcardId = undefined
    } else {
      const card = await flashcards.generateAiFlashcardForAnnotation(ann)
      ann.hasFlashcard = true
      ann.flashcardId = card.id
    }
  }

  const createStandaloneAnnotation = async (payload: {
    note: string
    selectedText?: string
    themeIds?: number[]
    generateFlashcard?: boolean
    title?: string
    noteId?: string
  }) => {
    return createAnnotation({
      bookId: 1,
      bookTitle: payload.title || (payload.noteId ? 'Nota no Canvas' : 'Anotação Avulsa'),
      cfi: payload.noteId ? `note:${payload.noteId}` : `standalone:${Date.now()}`,
      chapterTitle: payload.title || (payload.noteId ? 'Trecho da Nota' : 'Anotações Avulsas'),
      selectedText: payload.selectedText || null,
      note: payload.note,
      themeIds: payload.themeIds || [],
      generateFlashcard: payload.generateFlashcard,
      noteId: payload.noteId
    })
  }

  const convertAnnotationToFlashcard = async (annotationId: number, question?: string, answer?: string) => {
    const note = annotations.value.find((a) => a.id === annotationId)
    if (!note) return null
    const card = await flashcardRepo.createFromAnnotation({
      id: note.id,
      bookId: note.bookId,
      bookTitle: note.bookTitle,
      bookCover: note.bookCover,
      chapterTitle: note.chapterTitle,
      selectedText: note.selectedText,
      note: note.note,
      cfi: note.cfi,
      createdAt: note.createdAt,
      updated_at: new Date().toISOString(),
      sync_status: 'pending'
    }, question, answer)
    note.hasFlashcard = true
    note.flashcardId = card.id
    return card
  }

  const deleteAnnotationsByBookId = async (bookId: number): Promise<void> => {
    try {
      const localNotes = await annotationRepo.getAll({ bookId })
      const noteIds = localNotes.map((n) => n.id)
      await annotationRepo.deleteByBookId(bookId)
      await flashcardRepo.deleteByBookId(bookId, noteIds)
      annotations.value = annotations.value.filter((a) => Number(a.bookId) !== Number(bookId))
    } catch (err) {
      console.warn('[useAnnotations] Erro ao deletar anotações por bookId:', err)
    }
  }

  return {
    annotations,
    loading,
    error,
    fetchAnnotations,
    createAnnotation,
    createStandaloneAnnotation,
    updateAnnotationNote,
    deleteAnnotation,
    deleteAnnotationsByBookId,
    toggleAnnotationFlashcard,
    convertAnnotationToFlashcard,
    checkFlashcardStatus
  }
}
