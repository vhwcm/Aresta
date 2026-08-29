import { ref } from 'vue'
import type { UserBookItem } from '~/interfaces/graph'
import { useAuth } from '~/composables/useAuth'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'

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

  const mapLocalToUserBookItem = (b: any): UserBookItem => ({
    userBookId: b.id,
    bookId: b.bookId || b.id,
    title: b.title,
    coverPath: b.coverPath,
    filePath: b.filePath,
    status: b.status || 'QUERO_LER',
    currentPage: b.currentPage || 0,
    lastAccessedAt: b.lastAccessedAt || b.updated_at,
    themes: b.themes || []
  })

  const fetchUserBooks = async () => {
    loading.value = true
    error.value = null

    // 1. Carrega imediatamente do repositório local (Local-First)
    try {
      const localBooks = await bookRepo.getAll()
      if (localBooks && localBooks.length > 0) {
        userBooks.value = localBooks.map(mapLocalToUserBookItem)
      }
    } catch (e) {
      console.warn('[useUserBooks] Falha ao carregar do banco local:', e)
    }

    // 2. Se online / autenticado, sincroniza com o backend em background
    try {
      const data = await $fetch<any[]>(`${API_BASE}/user-books`, {
        headers: getHeaders()
      })
      if (Array.isArray(data)) {
        userBooks.value = data.map((item) => ({
          userBookId: item.id,
          bookId: item.bookId,
          title: item.title,
          coverPath: item.coverPath,
          filePath: item.filePath,
          status: item.status,
          currentPage: item.currentPage,
          lastAccessedAt: item.lastAccessedAt,
          themes: item.themes || []
        }))

        // Atualiza banco local com os dados remotos
        for (const item of data) {
          await bookRepo.save({
            id: item.id,
            bookId: item.bookId,
            title: item.title,
            coverPath: item.coverPath,
            filePath: item.filePath,
            status: item.status,
            currentPage: item.currentPage,
            lastAccessedAt: item.lastAccessedAt,
            themes: item.themes || []
          })
        }
      }
    } catch (e: any) {
      // Se estiver offline, mantém os dados locais sem travar
      if (userBooks.value.length === 0) {
        console.warn('Backend indisponível e sem livros locais:', e)
      }
    } finally {
      loading.value = false
    }
  }

  const addUserBook = async (bookId: number, status = 'QUERO_LER', currentPage = 0, title = 'Livro') => {
    const id = Date.now()
    // Grava localmente primeiro
    await bookRepo.save({
      id,
      bookId,
      title,
      status,
      currentPage
    })

    try {
      const res = await $fetch<any>(`${API_BASE}/user-books`, {
        method: 'POST',
        headers: getHeaders(),
        body: { bookId, status, currentPage }
      })
      await fetchUserBooks()
      return res
    } catch (e: any) {
      console.warn('Operação salva localmente (offline mode):', e)
      await fetchUserBooks()
      return { id, bookId, status, currentPage }
    }
  }

  const updateUserBook = async (userBookId: number, status: string, currentPage: number) => {
    const existing = userBooks.value.find((b: UserBookItem) => b.userBookId === userBookId)
    if (existing) {
      await bookRepo.save({
        id: userBookId,
        bookId: existing.bookId,
        title: existing.title,
        status,
        currentPage
      })
    }

    try {
      const res = await $fetch<any>(`${API_BASE}/user-books/${userBookId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: { status, currentPage }
      })
      await fetchUserBooks()
      return res
    } catch (e: any) {
      console.warn('Atualização salva localmente (offline):', e)
      await fetchUserBooks()
      return { userBookId, status, currentPage }
    }
  }

  const setBookThemes = async (userBookId: number, themeIds: number[]) => {
    try {
      const res = await $fetch<any>(`${API_BASE}/user-books/${userBookId}/themes`, {
        method: 'PUT',
        headers: getHeaders(),
        body: { themeIds }
      })
      await fetchUserBooks()
      return res
    } catch (e: any) {
      console.error('Erro ao definir temas do livro:', e)
      throw e
    }
  }

  const addThemeToBook = async (userBookId: number, themeId: number) => {
    try {
      const res = await $fetch<any>(`${API_BASE}/user-books/${userBookId}/themes`, {
        method: 'POST',
        headers: getHeaders(),
        body: { themeId }
      })
      await fetchUserBooks()
      return res
    } catch (e: any) {
      console.error('Erro ao adicionar tema ao livro:', e)
      throw e
    }
  }

  const removeThemeFromBook = async (userBookId: number, themeId: number) => {
    try {
      const res = await $fetch<any>(`${API_BASE}/user-books/${userBookId}/themes/${themeId}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      await fetchUserBooks()
      return res
    } catch (e: any) {
      console.error('Erro ao remover tema do livro:', e)
      throw e
    }
  }

  const deleteUserBook = async (userBookId: number) => {
    await bookRepo.delete(userBookId)
    try {
      await $fetch(`${API_BASE}/user-books/${userBookId}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
    } catch (e: any) {
      console.warn('Exclusão persistida localmente para sincronização:', e)
    } finally {
      await fetchUserBooks()
    }
  }

  const deleteUserBookByBookId = async (bookId: number) => {
    const item = userBooks.value.find((b: UserBookItem) => b.bookId === bookId)
    if (item) {
      await deleteUserBook(item.userBookId)
    }
  }

  const recordBookAccess = async (userBookId: number) => {
    const existing = userBooks.value.find((b: UserBookItem) => b.userBookId === userBookId)
    if (existing) {
      await bookRepo.save({
        id: userBookId,
        bookId: existing.bookId,
        title: existing.title,
        status: existing.status,
        currentPage: existing.currentPage,
        lastAccessedAt: new Date().toISOString()
      })
    }

    try {
      const res = await $fetch<any>(`${API_BASE}/user-books/${userBookId}/access`, {
        method: 'PATCH',
        headers: getHeaders()
      })
      await fetchUserBooks()
      return res
    } catch (e: any) {
      console.warn('Acesso registrado localmente:', e)
    }
  }

  const isBookInShelf = (bookId: number) => {
    return userBooks.value.some((b: UserBookItem) => b.bookId === bookId)
  }

  const getUserBookByBookId = (bookId: number) => {
    return userBooks.value.find((b: UserBookItem) => b.bookId === bookId)
  }

  return {
    userBooks,
    loading,
    error,
    fetchUserBooks,
    addUserBook,
    updateUserBook,
    setBookThemes,
    addThemeToBook,
    removeThemeFromBook,
    recordBookAccess,
    deleteUserBook,
    deleteUserBookByBookId,
    isBookInShelf,
    getUserBookByBookId
  }
}
