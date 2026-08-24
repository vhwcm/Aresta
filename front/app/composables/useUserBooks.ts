import { ref } from 'vue'
import type { UserBookItem } from '~/interfaces/graph'
import { useAuth } from '~/composables/useAuth'

const API_BASE = 'http://localhost:7070/api'

export const useUserBooks = () => {
  const userBooks = ref<UserBookItem[]>([])
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

  const fetchUserBooks = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<any[]>(`${API_BASE}/user-books`, {
        headers: getHeaders()
      })
      userBooks.value = Array.isArray(data)
        ? data.map(item => ({
            userBookId: item.id,
            bookId: item.bookId,
            title: item.title,
            coverPath: item.coverPath,
            filePath: item.filePath,
            status: item.status,
            currentPage: item.currentPage,
            lastAccessedAt: item.lastAccessedAt
          }))
        : []
    } catch (e: any) {
      console.error('Erro ao buscar estante do usuário:', e)
      error.value = 'Falha ao carregar seus livros.'
    } finally {
      loading.value = false
    }
  }

  const addUserBook = async (bookId: number, status = 'QUERO_LER', currentPage = 0) => {
    try {
      const res = await $fetch<any>(`${API_BASE}/user-books`, {
        method: 'POST',
        headers: getHeaders(),
        body: { bookId, status, currentPage }
      })
      await fetchUserBooks()
      return res
    } catch (e: any) {
      console.error('Erro ao adicionar livro à estante:', e)
      throw e
    }
  }

  const updateUserBook = async (userBookId: number, status: string, currentPage: number) => {
    try {
      const res = await $fetch<any>(`${API_BASE}/user-books/${userBookId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: { status, currentPage }
      })
      await fetchUserBooks()
      return res
    } catch (e: any) {
      console.error('Erro ao atualizar livro da estante:', e)
      throw e
    }
  }

  const deleteUserBook = async (userBookId: number) => {
    try {
      await $fetch(`${API_BASE}/user-books/${userBookId}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      await fetchUserBooks()
    } catch (e: any) {
      console.error('Erro ao remover livro da estante:', e)
      throw e
    }
  }

  const deleteUserBookByBookId = async (bookId: number) => {
    try {
      await $fetch(`${API_BASE}/user-books/book/${bookId}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      await fetchUserBooks()
    } catch (e: any) {
      console.error('Erro ao remover livro por bookId:', e)
      throw e
    }
  }

  const recordBookAccess = async (userBookId: number) => {
    try {
      const res = await $fetch<any>(`${API_BASE}/user-books/${userBookId}/access`, {
        method: 'PATCH',
        headers: getHeaders()
      })
      await fetchUserBooks()
      return res
    } catch (e: any) {
      console.error('Erro ao registrar acesso ao livro:', e)
      throw e
    }
  }

  const isBookInShelf = (bookId: number) => {
    return userBooks.value.some(b => b.bookId === bookId)
  }

  const getUserBookByBookId = (bookId: number) => {
    return userBooks.value.find(b => b.bookId === bookId)
  }

  return {
    userBooks,
    loading,
    error,
    fetchUserBooks,
    addUserBook,
    updateUserBook,
    recordBookAccess,
    deleteUserBook,
    deleteUserBookByBookId,
    isBookInShelf,
    getUserBookByBookId
  }
}
