import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'

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

  const fetchAnnotations = async (filters?: { bookId?: number; themeId?: number }) => {
    loading.value = true
    error.value = null
    try {
      const params: Record<string, string> = {}
      if (filters?.bookId) params.bookId = String(filters.bookId)
      if (filters?.themeId) params.themeId = String(filters.themeId)

      const query = new URLSearchParams(params).toString()
      const url = `${API_BASE}/annotations${query ? `?${query}` : ''}`

      const data = await $fetch<AnnotationItem[]>(url, {
        headers: getHeaders(),
      })
      annotations.value = data || []
      return data
    } catch (err: any) {
      console.error('Erro ao buscar anotações:', err)
      error.value = 'Falha ao carregar anotações.'
      return []
    } finally {
      loading.value = false
    }
  }

  const createAnnotation = async (payload: CreateAnnotationPayload): Promise<AnnotationItem> => {
    loading.value = true
    error.value = null
    try {
      const created = await $fetch<AnnotationItem>(`${API_BASE}/annotations`, {
        method: 'POST',
        headers: getHeaders(),
        body: payload,
      })
      annotations.value = [created, ...annotations.value]
      return created
    } catch (err: any) {
      console.error('Erro ao criar anotação:', err)
      error.value = 'Falha ao salvar anotação.'
      throw err
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
        body: payload,
      })
      annotations.value = [created, ...annotations.value]
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
    try {
      const updated = await $fetch<AnnotationItem>(`${API_BASE}/annotations/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: { note },
      })
      const idx = annotations.value.findIndex((a) => a.id === id)
      if (idx !== -1) {
        annotations.value[idx] = updated
      }
      return updated
    } catch (err: any) {
      console.error('Erro ao atualizar nota da anotação:', err)
      error.value = 'Falha ao atualizar nota.'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteAnnotation = async (id: number): Promise<boolean> => {
    loading.value = true
    error.value = null
    try {
      await $fetch(`${API_BASE}/annotations/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      })
      annotations.value = annotations.value.filter((a) => a.id !== id)
      return true
    } catch (err: any) {
      console.error('Erro ao deletar anotação:', err)
      error.value = 'Falha ao excluir anotação.'
      throw err
    } finally {
      loading.value = false
    }
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
  }
}
