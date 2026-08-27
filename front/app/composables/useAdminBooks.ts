import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import type { BookItem } from '~/interfaces/graph'

const API_BASE = 'http://localhost:7070/api'

export const useAdminBooks = () => {
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

  const uploadBook = async (payload: {
    title: string
    author: string
    summary?: string
    fileBase64?: string
    fileName?: string
    coverBase64?: string
  }): Promise<BookItem> => {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<BookItem>(`${API_BASE}/books/admin-upload`, {
        method: 'POST',
        headers: getHeaders(),
        body: payload,
      })
      return res
    } catch (e: any) {
      console.error('Erro no upload administrativo do livro:', e)
      const msg = e.data?.error || e.message || 'Falha ao cadastrar livro no catálogo público.'
      error.value = msg
      throw new Error(msg)
    } finally {
      loading.value = false
    }
  }

  const enrichBook = async (bookId: number): Promise<BookItem> => {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<BookItem>(`${API_BASE}/books/${bookId}/enrich`, {
        method: 'POST',
        headers: getHeaders(),
      })
      return res
    } catch (e: any) {
      console.error(`Erro ao enriquecer livro ${bookId}:`, e)
      const msg = e.data?.error || e.message || 'Falha no enriquecimento por IA.'
      error.value = msg
      throw new Error(msg)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    uploadBook,
    enrichBook,
  }
}
