import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { annotationRepo } from '~/adapters/database/repositories/AnnotationRepository'
import { flashcardRepo } from '~/adapters/database/repositories/FlashcardRepository'

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
  chapterTitle?: string | null
  progress?: number | null
  themes?: AnnotationTheme[]
  createdAt: string
  updatedAt?: string
}

export interface CreateAnnotationPayload {
  bookId: number
  cfi: string
  selectedText?: string | null
  note?: string | null
  chapterTitle?: string | null
  progress?: number
  themeIds?: number[]
  bookTitle?: string
  bookCover?: string
}

export interface CreateAnnotationWithOcrPayload {
  bookId: number
  cfi: string
  selectedText?: string | null
  chapterTitle?: string | null
  progress?: number
  themeIds?: number[]
  imageBase64: string
  mimeType?: 'image/png' | 'image/jpeg' | 'image/webp'
  promptHint?: string
}

const API_BASE = 'http://localhost:7070/api'

export const useAnnotations = () => {
  const annotations = ref<AnnotationItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const auth = useAuth()

  const getHeaders = () => {
    const headers: Record<string, string> = {}
    if (auth.token.value) {
      headers['Authorization'] = `Bearer ${auth.token.value}`
    }
    return headers
  }

  const mapLocalToItem = (a: any): AnnotationItem => ({
    id: Number(a.id),
    userId: a.userId || 0,
    bookId: Number(a.bookId),
    bookTitle: a.bookTitle,
    bookCover: a.bookCover,
    cfi: a.cfi,
    selectedText: a.selectedText,
    note: a.note,
    chapterTitle: a.chapterTitle,
    progress: a.progress,
    themes: a.themes || [],
    createdAt: a.createdAt,
    updatedAt: a.updated_at
  })

  const fetchAnnotations = async (filters?: { bookId?: number; themeId?: number }) => {
    loading.value = true
    error.value = null

    // 1. Carrega imediatamente do IndexedDB local
    try {
      const localNotes = await annotationRepo.getAll(filters)
      if (localNotes && localNotes.length > 0) {
        annotations.value = localNotes.map(mapLocalToItem)
      }
    } catch (e) {
      console.warn('[useAnnotations] Falha ao carregar anotações locais:', e)
    }

    // 2. Tenta sincronizar com a API remota se houver conexão
    try {
      const params: Record<string, string> = {}
      if (filters?.bookId) params.bookId = String(filters.bookId)
      if (filters?.themeId) params.themeId = String(filters.themeId)

      const query = new URLSearchParams(params).toString()
      const url = `${API_BASE}/annotations${query ? `?${query}` : ''}`

      const data = await $fetch<AnnotationItem[]>(url, {
        headers: getHeaders()
      })
      if (Array.isArray(data)) {
        annotations.value = data
        for (const item of data) {
          await annotationRepo.save({
            id: item.id,
            userId: item.userId,
            bookId: item.bookId,
            bookTitle: item.bookTitle,
            bookCover: item.bookCover,
            cfi: item.cfi,
            selectedText: item.selectedText,
            note: item.note,
            chapterTitle: item.chapterTitle,
            progress: item.progress,
            themes: item.themes,
            createdAt: item.createdAt
          })
        }
      }
      return annotations.value
    } catch (err: any) {
      if (annotations.value.length === 0) {
        console.warn('Backend indisponível e sem anotações em cache:', err)
      }
      return annotations.value
    } finally {
      loading.value = false
    }
  }

  const createAnnotation = async (payload: CreateAnnotationPayload): Promise<AnnotationItem> => {
    loading.value = true
    error.value = null
    const localId = Date.now()
    const now = new Date().toISOString()

    const localItem: AnnotationItem = {
      id: localId,
      userId: 0,
      bookId: payload.bookId,
      bookTitle: payload.bookTitle,
      bookCover: payload.bookCover,
      cfi: payload.cfi,
      selectedText: payload.selectedText,
      note: payload.note,
      chapterTitle: payload.chapterTitle,
      progress: payload.progress,
      themes: [],
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
      chapterTitle: payload.chapterTitle,
      progress: payload.progress,
      createdAt: now
    })
    annotations.value = [localItem, ...annotations.value]

    // 2. Dispara requisição HTTP em background se online
    try {
      const created = await $fetch<AnnotationItem>(`${API_BASE}/annotations`, {
        method: 'POST',
        headers: getHeaders(),
        body: payload
      })
      if (created) {
        const idx = annotations.value.findIndex((a) => a.id === localId)
        if (idx !== -1) {
          annotations.value[idx] = created
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
          chapterTitle: created.chapterTitle,
          progress: created.progress,
          themes: created.themes,
          createdAt: created.createdAt
        })
        return created
      }
      return localItem
    } catch (err: any) {
      console.warn('Anotação persistida localmente (offline mode):', err)
      return localItem
    } finally {
      loading.value = false
    }
  }

  const createAnnotationWithOcr = async (payload: CreateAnnotationWithOcrPayload): Promise<AnnotationItem> => {
    loading.value = true
    error.value = null
    try {
      const created = await $fetch<AnnotationItem>(`${API_BASE}/annotations/with-ocr`, {
        method: 'POST',
        headers: getHeaders(),
        body: payload
      })
      annotations.value = [created, ...annotations.value]
      await annotationRepo.save({
        id: created.id,
        userId: created.userId,
        bookId: created.bookId,
        bookTitle: created.bookTitle,
        bookCover: created.bookCover,
        cfi: created.cfi,
        selectedText: created.selectedText,
        note: created.note,
        chapterTitle: created.chapterTitle,
        progress: created.progress,
        themes: created.themes,
        createdAt: created.createdAt
      })
      return created
    } catch (err: any) {
      console.error('Erro ao criar anotação com OCR:', err)
      const msg = err.data?.error || err.message || 'Falha ao processar escrita manual via OCR.'
      error.value = msg
      throw new Error(msg)
    } finally {
      loading.value = false
    }
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
      const updated = await $fetch<AnnotationItem>(`${API_BASE}/annotations/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: { note }
      })
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
    annotations.value = annotations.value.filter((a) => a.id !== id)

    try {
      await $fetch(`${API_BASE}/annotations/${id}`, {
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

  const convertAnnotationToFlashcard = async (annotationId: number, question?: string, answer?: string) => {
    const note = annotations.value.find((a) => a.id === annotationId)
    if (!note) return null
    return flashcardRepo.createFromAnnotation({
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
  }

  return {
    annotations,
    loading,
    error,
    fetchAnnotations,
    createAnnotation,
    createAnnotationWithOcr,
    updateAnnotationNote,
    deleteAnnotation,
    convertAnnotationToFlashcard
  }
}
