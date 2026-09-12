import { ref } from 'vue'
import type { UserBookItem } from '~/interfaces/graph'
import { useAuth } from '~/composables/useAuth'
import { useGoogleDriveSync } from '~/composables/useGoogleDriveSync'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'
import { annotationRepo } from '~/adapters/database/repositories/AnnotationRepository'
import { flashcardRepo } from '~/adapters/database/repositories/FlashcardRepository'

const getApiBase = () => {
  if (typeof useRuntimeConfig === 'function') {
    try {
      const config = useRuntimeConfig()
      if (config?.public?.apiUrl) {
        return `${config.public.apiUrl}/api`
      }
    } catch {
      // fallback gracioso se runtime config não estiver disponível
    }
  }
  return 'http://localhost:3001/api'
}

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
    author: b.author,
    summary: b.summary,
    coverPath: b.coverPath,
    filePath: b.filePath,
    status: b.status || 'QUERO_LER',
    currentPage: b.currentPage || 0,
    lastAccessedAt: b.lastAccessedAt || b.updated_at,
    themes: b.themes || []
  })

  const clearLocalBooks = async () => {
    userBooks.value = []
    try {
      await bookRepo.clear()
    } catch (e) {
      console.warn('[useUserBooks] Falha ao limpar cache local de livros:', e)
    }
  }

  const fetchUserBooks = async () => {
    loading.value = true
    error.value = null

    // Se o usuário não estiver autenticado, a estante deve ficar vazia
    if (!auth.isLoggedIn.value) {
      userBooks.value = []
      loading.value = false
      return
    }

    const apiBase = getApiBase()

    // 1. Tenta sincronizar com o backend (fonte da verdade do usuário)
    try {
      const data = await $fetch<any>(`${apiBase}/user-books`, {
        headers: getHeaders()
      })
      const rawItems = Array.isArray(data) ? data : (data?.books || [])
      const remoteItems: UserBookItem[] = rawItems.map((item: any) => ({
        userBookId: item.userBookId || item.id,
        bookId: item.bookId || item.book_id || item.id,
        title: item.title,
        author: item.author,
        summary: item.summary,
        coverPath: item.coverPath || item.cover_path,
        filePath: item.filePath || item.file_path,
        status: item.status || 'QUERO_LER',
        currentPage: item.currentPage ?? item.current_page ?? 0,
        lastAccessedAt: item.lastAccessedAt || item.last_accessed_at,
        themes: item.themes || []
      }))

      // Mescla livros remotos com possíveis livros exclusivos salvos localmente offline nesta sessão
      try {
        const localBooks = await bookRepo.getAll()
        const localOnly: any[] = []

        for (const lb of localBooks) {
          const matchingRemote = remoteItems.find((r: any) => {
            const idMatches = r.bookId === (lb.bookId || lb.id) || r.userBookId === lb.id
            const titleMatches = Boolean(r.title && lb.title && r.title.trim().toLowerCase() === lb.title.trim().toLowerCase())
            const fileMatches = Boolean(r.filePath && lb.filePath && r.filePath === lb.filePath)
            return idMatches || titleMatches || fileMatches
          })

          if (matchingRemote) {
            // Se o timestamp de acesso local for mais recente que o remoto, atualiza
            if (lb.lastAccessedAt) {
              const localTime = new Date(lb.lastAccessedAt).getTime()
              const remoteTime = matchingRemote.lastAccessedAt ? new Date(matchingRemote.lastAccessedAt).getTime() : 0
              if (localTime > remoteTime) {
                matchingRemote.lastAccessedAt = lb.lastAccessedAt
              }
            }
            if (typeof lb.currentPage === 'number' && lb.currentPage > (matchingRemote.currentPage || 0)) {
              matchingRemote.currentPage = lb.currentPage
            }

            // Se o ID local for diferente dos IDs oficiais remotos (ex: ID temporário Date.now()),
            // limpa o registro antigo para evitar acúmulo de duplicatas no armazenamento local
            if (lb.id !== matchingRemote.userBookId && lb.id !== matchingRemote.bookId) {
              try {
                await bookRepo.delete(lb.id)
              } catch (delErr) {
                console.warn('[useUserBooks] Erro ao limpar livro duplicado do banco local:', delErr)
              }
            }
          } else {
            localOnly.push(lb)
          }
        }

        const candidateBooks = [...remoteItems, ...localOnly.map(mapLocalToUserBookItem)]
        
        // Garante unicidade estrita por bookId, userBookId e título normalizado
        const seenIds = new Set<number>()
        const seenTitles = new Set<string>()
        const uniqueBooks: UserBookItem[] = []

        for (const book of candidateBooks) {
          const normTitle = book.title ? book.title.trim().toLowerCase() : ''
          if (seenIds.has(book.bookId) || seenIds.has(book.userBookId) || (normTitle && seenTitles.has(normTitle))) {
            continue
          }
          seenIds.add(book.bookId)
          seenIds.add(book.userBookId)
          if (normTitle) seenTitles.add(normTitle)
          uniqueBooks.push(book)
        }

        // Ordena estritamente pelo acesso mais recente
        uniqueBooks.sort((a, b) => {
          const timeA = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0
          const timeB = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0
          return timeB - timeA
        })

        userBooks.value = uniqueBooks

        // Atualiza o banco local com os dados remotos oficiais
        for (const item of remoteItems) {
          await bookRepo.save({
            id: item.userBookId,
            bookId: item.bookId,
            title: item.title,
            author: item.author,
            coverPath: item.coverPath || undefined,
            filePath: item.filePath,
            status: item.status,
            currentPage: item.currentPage,
            lastAccessedAt: item.lastAccessedAt || undefined,
            themes: item.themes
          })
        }

        // 2. Se o Google Drive estiver conectado, mescla livros existentes na pasta Aresta do Drive
        try {
          const { isGoogleDriveConnected, listDriveBooks } = useGoogleDriveSync()
          if (isGoogleDriveConnected.value) {
            const driveBooks = await listDriveBooks()
            for (const dbBook of driveBooks) {
              const normDbTitle = dbBook.title.toLowerCase().trim()
              const alreadyExists = userBooks.value.some(
                (b) => b.title.toLowerCase().trim() === normDbTitle
              )
              if (!alreadyExists) {
                const driveBookId = Date.now() + Math.floor(Math.random() * 1000)
                const driveBookItem: UserBookItem = {
                  userBookId: driveBookId,
                  bookId: driveBookId,
                  title: dbBook.title,
                  author: 'Google Drive',
                  filePath: `drive:${dbBook.folderId}`,
                  status: 'QUERO_LER',
                  currentPage: 0,
                  themes: [],
                }
                userBooks.value.push(driveBookItem)
                await bookRepo.save({
                  id: driveBookItem.userBookId,
                  bookId: driveBookItem.bookId,
                  title: driveBookItem.title,
                  author: driveBookItem.author,
                  filePath: driveBookItem.filePath,
                  status: driveBookItem.status,
                  currentPage: 0,
                })
              }
            }
          }
        } catch (driveErr) {
          console.warn('[useUserBooks] Aviso ao sincronizar com Google Drive:', driveErr)
        }
      } catch (err) {
        console.warn('[useUserBooks] Falha ao sincronizar banco local com livros remotos:', err)
        userBooks.value = remoteItems
      }
    } catch (e: any) {
      // Se estiver offline ou backend temporariamente indisponível, carrega do banco local
      console.warn('[useUserBooks] Backend indisponível, tentando repositório local:', e)
      try {
        const localBooks = await bookRepo.getAll()
        if (localBooks && localBooks.length > 0) {
          const seenIds = new Set<number>()
          const seenTitles = new Set<string>()
          const uniqueLocal: UserBookItem[] = []
          for (const lb of localBooks) {
            const item = mapLocalToUserBookItem(lb)
            const normTitle = item.title ? item.title.trim().toLowerCase() : ''
            if (seenIds.has(item.bookId) || (normTitle && seenTitles.has(normTitle))) {
              continue
            }
            seenIds.add(item.bookId)
            if (normTitle) seenTitles.add(normTitle)
            uniqueLocal.push(item)
          }
          uniqueLocal.sort((a, b) => {
            const timeA = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0
            const timeB = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0
            return timeB - timeA
          })
          userBooks.value = uniqueLocal
        } else {
          userBooks.value = []
        }
      } catch (localErr) {
        console.warn('[useUserBooks] Falha ao carregar livros locais:', localErr)
        userBooks.value = []
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
      const res = await $fetch<any>(`${getApiBase()}/user-books`, {
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
      const res = await $fetch<any>(`${getApiBase()}/user-books/${userBookId}`, {
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

  const setBookThemes = async (userBookId: number, themeIds: number[], themesList?: any[]) => {
    // 1. Atualização Otimista local
    const bookIndex = userBooks.value.findIndex(b => b.userBookId === userBookId || b.bookId === userBookId)
    if (bookIndex !== -1 && userBooks.value[bookIndex]) {
      const book = userBooks.value[bookIndex]!
      const existingThemes = themesList || book.themes || []
      const updatedThemes = themeIds.map(tid => {
        const found = existingThemes.find((t: any) => Number(t.id) === Number(tid))
        return found || { id: Number(tid), name: `Tema ${tid}` }
      })
      userBooks.value[bookIndex] = {
        ...book,
        themes: updatedThemes
      }
      try {
        await bookRepo.save({
          id: book.userBookId,
          bookId: book.bookId,
          title: book.title,
          status: book.status,
          currentPage: book.currentPage,
          themes: updatedThemes
        })
      } catch (repoErr) {
        console.warn('[useUserBooks] Erro ao persistir temas localmente:', repoErr)
      }
    }

    try {
      const res = await $fetch<any>(`${getApiBase()}/user-books/${userBookId}/themes`, {
        method: 'PUT',
        headers: getHeaders(),
        body: { themeIds }
      })
      await fetchUserBooks()
      return res
    } catch (e: any) {
      console.warn('Operação de temas sincronizada localmente (offline/fallback):', e)
      return { success: true, localOnly: true }
    }
  }

  const addThemeToBook = async (userBookId: number, themeId: number) => {
    try {
      const res = await $fetch<any>(`${getApiBase()}/user-books/${userBookId}/themes`, {
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
      const res = await $fetch<any>(`${getApiBase()}/user-books/${userBookId}/themes/${themeId}`, {
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
    const item = userBooks.value.find((b: UserBookItem) => b.userBookId === userBookId)
    const targetBookId = item?.bookId || userBookId

    await bookRepo.delete(userBookId)
    if (item && item.bookId !== userBookId) {
      try {
        await bookRepo.delete(item.bookId)
      } catch {}
    }
    if (item?.title) {
      try {
        const all = await bookRepo.getAll()
        const norm = item.title.trim().toLowerCase()
        for (const b of all) {
          if (b.title && b.title.trim().toLowerCase() === norm) {
            await bookRepo.delete(b.id)
          }
        }
      } catch {}
    }

    // Exclui anotações e flashcards locais vinculados a este livro
    try {
      const notes = await annotationRepo.getAll({ bookId: targetBookId })
      const noteIds = notes.map((n) => n.id)
      await annotationRepo.deleteByBookId(targetBookId)
      await flashcardRepo.deleteByBookId(targetBookId, noteIds)
      if (item && item.userBookId !== targetBookId) {
        const ubNotes = await annotationRepo.getAll({ bookId: item.userBookId })
        const ubNoteIds = ubNotes.map((n) => n.id)
        await annotationRepo.deleteByBookId(item.userBookId)
        await flashcardRepo.deleteByBookId(item.userBookId, ubNoteIds)
      }
    } catch (cleanErr) {
      console.warn('[useUserBooks] Erro ao limpar notas e flashcards locais do livro:', cleanErr)
    }

    try {
      await $fetch(`${getApiBase()}/user-books/${userBookId}`, {
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

  const recordBookAccess = async (userBookOrBookId: number) => {
    const nowIso = new Date().toISOString()
    const existing = userBooks.value.find((b: UserBookItem) => b.userBookId === userBookOrBookId || b.bookId === userBookOrBookId)
    if (existing) {
      existing.lastAccessedAt = nowIso
      // Move para a primeira posição otimisticamente
      const rest = userBooks.value.filter(b => b !== existing)
      userBooks.value = [existing, ...rest]

      try {
        await bookRepo.save({
          id: existing.userBookId,
          bookId: existing.bookId,
          title: existing.title,
          author: existing.author,
          coverPath: existing.coverPath || undefined,
          filePath: existing.filePath,
          status: existing.status,
          currentPage: existing.currentPage,
          lastAccessedAt: nowIso,
          themes: existing.themes
        })
      } catch (repoErr) {
        console.warn('[useUserBooks] Erro ao salvar acesso no bookRepo:', repoErr)
      }
    } else {
      try {
        const local = await bookRepo.getById(userBookOrBookId)
        if (local) {
          await bookRepo.save({
            ...local,
            lastAccessedAt: nowIso
          })
        }
      } catch {}
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('aresta_last_accessed_book_id', String(userBookOrBookId))
        localStorage.setItem('aresta_last_accessed_at', nowIso)
      } catch {}
    }

    try {
      const res = await $fetch<any>(`${getApiBase()}/user-books/${userBookOrBookId}/access`, {
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
    clearLocalBooks,
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
