import { ref } from 'vue'
import type { UserBookItem } from '~/interfaces/graph'
import { useAuth } from '~/composables/useAuth'
import { useGoogleDriveSync } from '~/composables/useGoogleDriveSync'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'
import { annotationRepo } from '~/adapters/database/repositories/AnnotationRepository'
import { flashcardRepo } from '~/adapters/database/repositories/FlashcardRepository'

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

// Estado Compartilhado Singleton (SWR - 0ms de latência)
const sharedUserBooks = ref<UserBookItem[]>([])
const sharedLoading = ref(false)
const sharedError = ref<string | null>(null)
let isInitialized = false

export const resetUserBooksMemory = () => {
  sharedUserBooks.value = []
  sharedLoading.value = false
  sharedError.value = null
  isInitialized = false
}

const initFromLocalRepo = async () => {
  if (isInitialized && sharedUserBooks.value.length > 0) return
  try {
    const localBooks = await bookRepo.getAll()
    if (localBooks && localBooks.length > 0 && sharedUserBooks.value.length === 0) {
      sharedUserBooks.value = localBooks.map(mapLocalToUserBookItem)
    }
  } catch (err) {
    console.warn('[useUserBooks] Erro na inicialização local:', err)
  } finally {
    isInitialized = true
  }
}

export const useUserBooks = () => {
  const userBooks = sharedUserBooks
  const loading = sharedLoading
  const error = sharedError
  const auth = useAuth()

  if (typeof window !== 'undefined' && !isInitialized) {
    initFromLocalRepo()
  }

  const clearLocalBooks = async () => {
    userBooks.value = []
    try {
      await bookRepo.clear()
    } catch (e) {
      console.warn('[useUserBooks] Falha ao limpar cache local de livros:', e)
    }
  }

  const fetchUserBooks = async () => {
    if (userBooks.value.length === 0) {
      loading.value = true
    }
    error.value = null

    if (!auth.isLoggedIn.value && !auth.user.value) {
      userBooks.value = []
      loading.value = false
      return
    }

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

      // Sincroniza livros do Google Drive se conectado
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
    } catch (e: any) {
      console.warn('[useUserBooks] Erro ao carregar livros locais:', e)
    } finally {
      loading.value = false
    }
  }

  const addUserBook = async (bookId: number, status = 'QUERO_LER', currentPage = 0, title = 'Livro') => {
    const id = Date.now()
    await bookRepo.save({
      id,
      bookId,
      title,
      status,
      currentPage
    })
    await fetchUserBooks()
    return { id, bookId, status, currentPage }
  }

  const updateUserBook = async (userBookId: number, status: string, currentPage: number) => {
    const existing = userBooks.value.find((b: UserBookItem) => b.userBookId === userBookId)
    if (existing) {
      await bookRepo.save({
        id: userBookId,
        bookId: existing.bookId,
        title: existing.title,
        author: existing.author,
        coverPath: existing.coverPath,
        filePath: existing.filePath,
        status,
        currentPage,
        themes: existing.themes
      })
    }
    await fetchUserBooks()
    return { userBookId, status, currentPage }
  }

  const setBookThemes = async (userBookId: number, themeIds: number[], themesList?: any[]) => {
    const bookIndex = userBooks.value.findIndex(b => b.userBookId === userBookId || b.bookId === userBookId)
    if (bookIndex !== -1 && userBooks.value[bookIndex]) {
      const book = userBooks.value[bookIndex]!
      const existingThemes = themesList || book.themes || []
      const updatedThemes = themeIds.map(tid => {
        const numTid = Number(String(tid).replace(/^theme-/, ''))
        const found = existingThemes.find((t: any) => {
          const tNum = Number(String(t.rawId ?? t.id).replace(/^theme-/, ''))
          return !isNaN(tNum) && tNum === numTid
        })
        return found
          ? {
              id: numTid,
              name: found.name || `Tema ${numTid}`,
              color: found.color || null,
            }
          : { id: numTid, name: `Tema ${numTid}`, color: null }
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
    return { success: true, localOnly: true }
  }

  const addThemeToBook = async (userBookId: number, themeId: number) => {
    const book = userBooks.value.find(b => b.userBookId === userBookId || b.bookId === userBookId)
    const existingThemes = book?.themes || []
    const newTheme = { id: Number(themeId), name: `Tema ${themeId}` }
    return setBookThemes(userBookId, [...existingThemes.map(t => Number(t.id)), Number(themeId)], [...existingThemes, newTheme])
  }

  const removeThemeFromBook = async (userBookId: number, themeId: number) => {
    const book = userBooks.value.find(b => b.userBookId === userBookId || b.bookId === userBookId)
    const existingThemes = book?.themes || []
    const updatedIds = existingThemes.filter(t => Number(t.id) !== Number(themeId)).map(t => Number(t.id))
    return setBookThemes(userBookId, updatedIds)
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

    await fetchUserBooks()
  }

  const deleteUserBookByBookId = async (bookId: number) => {
    const item = userBooks.value.find((b: UserBookItem) => b.bookId === bookId)
    if (item) {
      await deleteUserBook(item.userBookId)
    }
  }

  const recordBookAccess = async (userBookOrBookId: number) => {
    if (!userBookOrBookId || isNaN(Number(userBookOrBookId))) return
    const numericId = Number(userBookOrBookId)
    const nowIso = new Date().toISOString()
    const existing = userBooks.value.find((b: UserBookItem) => b.userBookId === numericId || b.bookId === numericId)
    if (existing) {
      existing.lastAccessedAt = nowIso
      const rest = userBooks.value.filter(b => b !== existing)
      userBooks.value = [existing, ...rest]

      const targetId = Number(existing.userBookId || existing.bookId || numericId)
      const targetBookId = Number(existing.bookId || existing.userBookId || numericId)

      if (!isNaN(targetId) && !isNaN(targetBookId)) {
        try {
          await bookRepo.save({
            id: targetId,
            bookId: targetBookId,
            title: existing.title || 'Livro',
            author: existing.author,
            coverPath: existing.coverPath || undefined,
            filePath: existing.filePath,
            status: existing.status || 'QUERO_LER',
            currentPage: existing.currentPage || 0,
            lastAccessedAt: nowIso,
            themes: existing.themes || []
          })
        } catch (repoErr) {
          console.warn('[useUserBooks] Erro ao salvar acesso no bookRepo:', repoErr)
        }
      }
    } else {
      try {
        const local = await bookRepo.getById(numericId)
        if (local && local.id && !isNaN(Number(local.id))) {
          await bookRepo.save({
            ...local,
            lastAccessedAt: nowIso
          })
        }
      } catch (err) {
        console.warn('[useUserBooks] Erro ao buscar livro local:', err)
      }
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('aresta_last_accessed_book_id', String(userBookOrBookId))
        localStorage.setItem('aresta_last_accessed_at', nowIso)
      } catch {}
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
    getUserBookByBookId,
    resetUserBooks: resetUserBooksMemory
  }
}
