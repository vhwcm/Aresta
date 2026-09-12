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

const getApiBase = () => {
  if (typeof useRuntimeConfig === 'function') {
    try {
      const config = useRuntimeConfig()
      if (config?.public?.memoryApiUrl) {
        return `${config.public.memoryApiUrl}/api`
      }
      if (config?.public?.apiUrl) {
        return `${config.public.apiUrl}/api`
      }
    } catch {
      // fallback gracioso
    }
  }
  return 'http://localhost:3001/api'
}

// Estado reativo compartilhado a nível de módulo
const sharedAnnotations = ref<AnnotationItem[]>([])
const sharedLoading = ref(false)
const sharedError = ref<string | null>(null)

export const useAnnotations = () => {
  const annotations = sharedAnnotations
  const loading = sharedLoading
  const error = sharedError
  const auth = useAuth()

  const getHeaders = (includeContentType = true): Record<string, string> => {
    let token: string | null = auth.token.value ?? null
    if (!token && typeof useCookie === 'function') {
      try {
        const cookieVal = useCookie<string | null | undefined>('aresta_token').value
        token = cookieVal ?? null
      } catch {
        token = null
      }
    }
    const headers: Record<string, string> = {}
    if (includeContentType) {
      headers['Content-Type'] = 'application/json'
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

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
    if (a.color) item.color = a.color
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
    loading.value = true
    error.value = null

    // 1. Carrega imediatamente do IndexedDB local (Local-First instantâneo)
    try {
      const localNotes = await annotationRepo.getAll(filters)
      if (localNotes && localNotes.length > 0) {
        annotations.value = localNotes.map(normalizeItem)
      }
    } catch (e) {
      console.warn('[useAnnotations] Falha ao carregar anotações locais:', e)
    }

    // 2. Tenta sincronizar com a API remota se houver conexão
    try {
      const params: Record<string, string> = {}
      if (filters?.bookId !== undefined && filters?.bookId !== null) params.bookId = String(filters.bookId)
      if (filters?.themeId !== undefined && filters?.themeId !== null) params.themeId = String(filters.themeId)

      const query = new URLSearchParams(params).toString()
      const url = `${getApiBase()}/annotations${query ? `?${query}` : ''}`

      const data = await $fetch<any>(url, {
        headers: getHeaders()
      })
      const list = Array.isArray(data) ? data : (Array.isArray(data?.annotations) ? data.annotations : null)
      if (list !== null) {
        const mapped: AnnotationItem[] = list.map(normalizeItem)
        for (const item of mapped) {
          await annotationRepo.save({
            id: item.id,
            userId: item.userId,
            bookId: item.bookId,
            bookTitle: item.bookTitle,
            bookCover: item.bookCover,
            cfi: item.cfi,
            selectedText: item.selectedText,
            note: item.note,
            color: item.color,
            chapterTitle: item.chapterTitle,
            progress: item.progress,
            themes: item.themes,
            createdAt: item.createdAt
          })
        }
        try {
          const currentLocal = await annotationRepo.getAll(filters)
          const pending = currentLocal.filter((l: any) => !mapped.some((m: AnnotationItem) => m.id === l.id))
          annotations.value = [...pending.map(normalizeItem), ...mapped]
        } catch {
          annotations.value = mapped
        }
      }
    } catch (err: any) {
      if (annotations.value.length === 0) {
        console.warn('Backend indisponível ou offline:', err)
      }
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

    const localItem: AnnotationItem = {
      id: localId,
      userId: 0,
      bookId: payload.bookId,
      bookTitle: payload.bookTitle,
      bookCover: payload.bookCover,
      cfi: payload.cfi,
      selectedText: payload.selectedText,
      note: payload.note,
      ...(payload.color ? { color: payload.color } : {}),
      chapterTitle: payload.chapterTitle,
      progress: payload.progress,
      themes: [],
      hasFlashcard: Boolean(payload.generateFlashcard),
      sourceType: isNote ? 'canvas_note' : 'book',
      noteId,
      createdAt: now
    }

    // 1. Grava no banco local primeiro (Local-First instantâneo)
    await annotationRepo.save({
      id: localId,
      bookId: payload.bookId,
      bookTitle: payload.bookTitle,
      bookCover: payload.bookCover,
      cfi: payload.cfi,
      selectedText: payload.selectedText,
      note: payload.note,
      ...(payload.color ? { color: payload.color } : {}),
      chapterTitle: payload.chapterTitle,
      progress: payload.progress,
      createdAt: now
    })
    annotations.value = [localItem, ...annotations.value]

    // 2. Dispara requisição HTTP em background se online
    let finalItem = localItem
    try {
      const response = await $fetch<any>(`${getApiBase()}/annotations`, {
        method: 'POST',
        headers: getHeaders(),
        body: payload
      })
      const createdRaw = response?.annotation || response
      if (createdRaw) {
        const created = normalizeItem(createdRaw)
        if (!created.bookTitle && payload.bookTitle) {
          created.bookTitle = payload.bookTitle
        }
        if (!created.bookCover && payload.bookCover) {
          created.bookCover = payload.bookCover
        }
        const idx = annotations.value.findIndex((a) => a.id === localId)
        if (idx !== -1) {
          annotations.value[idx] = created
        } else {
          annotations.value = [created, ...annotations.value.filter((a) => a.id !== localId)]
        }
        await annotationRepo.delete(localId)
        await annotationRepo.save({
          id: created.id,
          userId: created.userId,
          bookId: created.bookId,
          bookTitle: created.bookTitle,
          bookCover: created.bookCover,
          cfi: created.cfi,
          selectedText: created.selectedText,
          note: created.note,
          ...(created.color || payload.color ? { color: created.color || payload.color } : {}),
          chapterTitle: created.chapterTitle,
          progress: created.progress,
          themes: created.themes,
          createdAt: created.createdAt
        })
        finalItem = created
      }
    } catch (err: any) {
      console.warn('Anotação persistida localmente (offline mode):', err)
    } finally {
      loading.value = false
    }

    // 3. Se solicitado, gera flashcard em background com IA
    if (payload.generateFlashcard) {
      const flashcards = useFlashcards()
      flashcards.generateAiFlashcardForAnnotation(finalItem).then((card) => {
        finalItem.hasFlashcard = true
        finalItem.flashcardId = card.id
      }).catch((err) => {
        console.warn('Erro ao gerar flashcard com IA em background:', err)
      })
    }

    return finalItem
  }

  const updateAnnotationNote = async (id: number, note: string): Promise<AnnotationItem> => {
    loading.value = true
    error.value = null

    // Atualiza localmente
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

    try {
      const response = await $fetch<any>(`${getApiBase()}/annotations/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: { note }
      })
      const updatedRaw = response?.annotation || response
      const updated = normalizeItem(updatedRaw)
      const idx = annotations.value.findIndex((a) => a.id === id)
      if (idx !== -1) {
        annotations.value[idx] = updated
      }
      return updated
    } catch (err: any) {
      console.warn('Nota atualizada localmente:', err)
      return existing as AnnotationItem
    } finally {
      loading.value = false
    }
  }

  const deleteAnnotation = async (id: number): Promise<boolean> => {
    loading.value = true
    error.value = null

    await annotationRepo.delete(id)
    await flashcardRepo.deleteByAnnotationId(id)
    annotations.value = annotations.value.filter((a) => a.id !== id)

    try {
      await $fetch(`${getApiBase()}/annotations/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      return true
    } catch (err: any) {
      console.warn('Exclusão agendada localmente:', err)
      return true
    } finally {
      loading.value = false
    }
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

  return {
    annotations,
    loading,
    error,
    fetchAnnotations,
    createAnnotation,
    createStandaloneAnnotation,
    updateAnnotationNote,
    deleteAnnotation,
    toggleAnnotationFlashcard,
    convertAnnotationToFlashcard,
    checkFlashcardStatus
  }
}
