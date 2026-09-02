import { ref } from 'vue'

export interface DidacticChapterItem {
  id: string
  order_index: number
  title: string
  topic: string
  diagram_count: number
  created_at: string
  raw_markdown?: string
}

export interface DidacticBookletItem {
  id: string
  user_id: number
  book_id: number
  title: string
  description?: string
  created_at: string
  updated_at: string
  book?: {
    id: number
    title: string
    format_type: string
    is_ai_generated: boolean
  }
  chapters: DidacticChapterItem[]
}

const API_BASE = 'http://localhost:7070/api'

const booklets = ref<DidacticBookletItem[]>([])
const currentBooklet = ref<DidacticBookletItem | null>(null)
const isLoading = ref(false)
const isGenerating = ref(false)
const error = ref<string | null>(null)

export const useDidacticBooklet = () => {
  const getHeaders = () => {
    const token = typeof useCookie === 'function' ? useCookie('aresta_token').value : null
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  const fetchBooklets = async (themeId?: number) => {
    isLoading.value = true
    error.value = null
    try {
      const url = themeId
        ? `${API_BASE}/v1/didactic/booklets?theme_id=${themeId}`
        : `${API_BASE}/v1/didactic/booklets`
      const res = await fetch(url, { headers: getHeaders() })
      if (!res.ok) throw new Error('Falha ao carregar livretos didáticos')
      const data = await res.json()
      booklets.value = data.booklets || []
      return booklets.value
    } catch (err: any) {
      error.value = err.message || 'Erro desconhecido'
      return []
    } finally {
      isLoading.value = false
    }
  }

  const loadBooklet = async (id: number | string) => {
    isLoading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/v1/didactic/booklets/${id}`, { headers: getHeaders() })
      if (!res.ok) throw new Error('Livreto didático não encontrado')
      const data = await res.json()
      currentBooklet.value = data.booklet
      return currentBooklet.value
    } catch (err: any) {
      error.value = err.message || 'Erro ao carregar livreto'
      return null
    } finally {
      isLoading.value = false
    }
  }

  const createBooklet = async (payload: {
    title?: string
    topic: string
    theme_id?: number
    flashcard_id?: number
    annotation_id?: number
    depth_level?: 'quick_summary' | 'standard' | 'deep_dive'
  }) => {
    isGenerating.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/v1/didactic/booklets`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Falha ao gerar livreto didático com IA')
      }
      const data = await res.json()
      if (data.booklet) {
        booklets.value.unshift(data.booklet)
      }
      return data
    } catch (err: any) {
      error.value = err.message || 'Erro ao criar livreto'
      throw err
    } finally {
      isGenerating.value = false
    }
  }

  const appendChapter = async (
    targetBookIdOrBookletId: number | string,
    payload: {
      title?: string
      topic: string
      theme_id?: number
      flashcard_id?: number
      annotation_id?: number
      depth_level?: 'quick_summary' | 'standard' | 'deep_dive'
    }
  ) => {
    isGenerating.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/v1/didactic/booklets/${targetBookIdOrBookletId}/append`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Falha ao anexar capítulo ao livreto')
      }
      const data = await res.json()
      await fetchBooklets()
      return data
    } catch (err: any) {
      error.value = err.message || 'Erro ao anexar capítulo'
      throw err
    } finally {
      isGenerating.value = false
    }
  }

  return {
    booklets,
    currentBooklet,
    isLoading,
    isGenerating,
    error,
    fetchBooklets,
    loadBooklet,
    createBooklet,
    appendChapter,
  }
}
