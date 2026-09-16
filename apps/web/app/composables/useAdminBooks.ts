import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import type { BookItem } from '~/interfaces/graph'
import { getApiBase } from '~/utils/apiBase'

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
      const res = await $fetch<BookItem>(`${getApiBase()}/books/admin-upload`, {
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

  return {
    loading,
    error,
    uploadBook,
  }
}
