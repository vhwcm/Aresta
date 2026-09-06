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
  return 'http://localhost:7070/api'
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

  const getHeaders = (includeContentType = false) => {
    const headers: Record<string, string> = {}
    if (includeContentType) {
      headers['Content-Type'] = 'application/json'
    }
    let token: string | null = auth.token.value ?? null
    if (!token && typeof useCookie === 'function') {
      try {
        const cookieVal = useCookie<string | null | undefined>('aresta_token').value
        token = cookieVal ?? null
      } catch {}
    }
    if (!token && typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)aresta_token=([^;]+)/)
      if (match && match[1]) {
        token = decodeURIComponent(match[1])
      }
    }
    if (!token && typeof localStorage !== 'undefined') {
      token = localStorage.getItem('aresta_token') || localStorage.getItem('token') || null
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  const normalizeItem = (a: any): AnnotationItem => {
    if (!a) return a
    const item: any = {
      id: Number(a.id),
      userId: a.userId ?? a.user_id ?? 0,
      bookId: Number(a.bookId ?? a.book_id),
      cfi: a.cfi,
      selectedText: a.selectedText ?? a.selected_text ?? '',
      note: a.note ?? '',
      themes: a.themes || (a.annotationThemes ? a.annotationThemes.map((at: any) => at.theme) : []),
    }
    if (a.chapterTitle || a.chapter_title) item.chapterTitle = a.chapterTitle || a.chapter_title
    if (a.progress !== undefined) item.progress = a.progress
    if (a.bookTitle || a.book?.title) item.bookTitle = a.bookTitle || a.book?.title
    if (a.bookCover || a.book?.cover_path) item.bookCover = a.bookCover || a.book?.cover_path
    if (a.createdAt || a.created_at) item.createdAt = a.createdAt || a.created_at
    if (a.updatedAt || a.updated_at) item.updatedAt = a.updatedAt || a.updated_at
    return item as AnnotationItem
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
      if (list && list.length > 0) {
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

    return annotations.value
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
      const response = await $fetch<any>(`${getApiBase()}/annotations/with-ocr`, {
        method: 'POST',
        headers: getHeaders(),
        body: payload
      })
      const createdRaw = response?.annotation || response
      const created = normalizeItem(createdRaw)
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
