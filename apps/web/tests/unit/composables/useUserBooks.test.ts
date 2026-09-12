import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useUserBooks } from '~/composables/useUserBooks'
import * as authComposable from '~/composables/useAuth'
import { dbManager } from '~/adapters/database/DatabaseManager'
import { InMemoryAdapter } from '~/adapters/database/InMemoryAdapter'

const mockFetch = vi.fn()
;(globalThis as any).$fetch = mockFetch

describe('useUserBooks Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dbManager.setAdapter(new InMemoryAdapter())
    vi.spyOn(authComposable, 'useAuth').mockReturnValue({
      token: ref('fake-token'),
      user: ref({ id: 1, name: 'viktor', email: 'viktor@aresta.org' }),
      isLoggedIn: ref(true),
      isAdmin: ref(true),
    } as any)
  })

  it('fetchUserBooks carrega a estante do usuário', async () => {
    const mockData = [
      { id: 10, bookId: 1, title: 'Contos Fluminenses', status: 'LIDO', currentPage: 180 }
    ]
    mockFetch.mockResolvedValueOnce(mockData)

    const { userBooks, fetchUserBooks } = useUserBooks()
    await fetchUserBooks()

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/user-books', expect.any(Object))
    expect(userBooks.value?.length).toBe(1)
    expect(userBooks.value?.[0]?.title).toBe('Contos Fluminenses')
    expect(userBooks.value?.[0]?.status).toBe('LIDO')
  })

  it('addUserBook adiciona novo livro à estante', async () => {
    mockFetch.mockResolvedValueOnce({ id: 11, bookId: 2, status: 'LENDO', currentPage: 45 }) // POST
    mockFetch.mockResolvedValueOnce([]) // GET recarregado

    const { addUserBook } = useUserBooks()
    await addUserBook(2, 'LENDO', 45)

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/user-books', expect.objectContaining({
      method: 'POST',
      body: { bookId: 2, status: 'LENDO', currentPage: 45 }
    }))
  })

  it('updateUserBook atualiza status e página atual', async () => {
    mockFetch.mockResolvedValueOnce({ id: 10, status: 'LIDO', currentPage: 200 }) // PATCH
    mockFetch.mockResolvedValueOnce([]) // GET recarregado

    const { updateUserBook } = useUserBooks()
    await updateUserBook(10, 'LIDO', 200)

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/user-books/10', expect.objectContaining({
      method: 'PATCH',
      body: { status: 'LIDO', currentPage: 200 }
    }))
  })

  it('recordBookAccess registra último acesso do livro', async () => {
    mockFetch.mockResolvedValueOnce({ id: 10, lastAccessedAt: new Date().toISOString() }) // PATCH
    mockFetch.mockResolvedValueOnce([]) // GET recarregado

    const { recordBookAccess } = useUserBooks()
    await recordBookAccess(10)

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/user-books/10/access', expect.objectContaining({
      method: 'PATCH'
    }))
  })

  it('fetchUserBooks preserva livros exclusivos do banco local ao sincronizar com backend', async () => {
    const { bookRepo } = await import('~/adapters/database/repositories/BookRepository')
    await bookRepo.save({
      id: 999,
      bookId: 999,
      title: 'Livro Upload Local Offline',
      status: 'LENDO',
      currentPage: 12
    })

    const mockRemote = [
      { id: 10, bookId: 1, title: 'Livro Remoto', status: 'LIDO', currentPage: 50 }
    ]
    mockFetch.mockResolvedValueOnce(mockRemote)

    const { userBooks, fetchUserBooks } = useUserBooks()
    await fetchUserBooks()

    expect(userBooks.value.some(b => b.title === 'Livro Remoto')).toBe(true)
    expect(userBooks.value.some(b => b.title === 'Livro Upload Local Offline')).toBe(true)
  })

  it('fetchUserBooks não duplica livro após upload local quando sincronizado com backend', async () => {
    const { bookRepo } = await import('~/adapters/database/repositories/BookRepository')
    // Simula registro temporário salvo no upload local
    await bookRepo.save({
      id: 1725712345678,
      bookId: 1725712345678,
      title: 'O Alquimista',
      filePath: '1725712345678.epub',
      status: 'LENDO',
      currentPage: 1
    })

    // Backend retorna o registro oficial criado
    const mockRemote = [
      {
        id: 42,
        bookId: 15,
        title: 'O Alquimista',
        filePath: '1725712345678.epub',
        status: 'LENDO',
        currentPage: 1
      }
    ]
    mockFetch.mockResolvedValueOnce(mockRemote)

    const { userBooks, fetchUserBooks } = useUserBooks()
    await fetchUserBooks()

    // Não deve aparecer duplicado na estante
    const matching = userBooks.value.filter(b => b.title === 'O Alquimista')
    expect(matching.length).toBe(1)
    expect(matching[0]?.bookId).toBe(15)

    // O ID temporário antigo deve ter sido removido do repositório local
    const oldTemp = await bookRepo.getById(1725712345678)
    expect(oldTemp).toBeNull()

    // O ID oficial remoto deve estar salvo no repositório local
    const officialLocal = await bookRepo.getById(42)
    expect(officialLocal).not.toBeNull()
    expect(officialLocal?.title).toBe('O Alquimista')
  })

  it('deleteUserBook remove livro, anotações e flashcards locais e notifica API', async () => {
    const { bookRepo } = await import('~/adapters/database/repositories/BookRepository')
    const { annotationRepo } = await import('~/adapters/database/repositories/AnnotationRepository')
    const { flashcardRepo } = await import('~/adapters/database/repositories/FlashcardRepository')

    await bookRepo.save({
      id: 20,
      bookId: 5,
      title: 'Livro com Notas',
      status: 'LENDO',
      currentPage: 10
    })

    await annotationRepo.save({
      id: 101,
      bookId: 5,
      cfi: 'epubcfi(/6/2[chap1]!/4/2/1:0)',
      note: 'Minha nota importante',
      selectedText: 'Trecho do livro'
    })

    await flashcardRepo.save({
      id: 201,
      question: 'O que significa?',
      answer: 'Significado',
      bookId: 5
    } as any)

    mockFetch.mockResolvedValueOnce([{ id: 20, bookId: 5, title: 'Livro com Notas', status: 'LENDO', currentPage: 10 }])
    const { userBooks, fetchUserBooks, deleteUserBook } = useUserBooks()
    await fetchUserBooks()

    expect(userBooks.value.length).toBe(1)
    expect(await annotationRepo.getAll({ bookId: 5 })).toHaveLength(1)
    const cardsBefore = await flashcardRepo.getAll()
    expect(cardsBefore.some(c => c.bookId === 5)).toBe(true)

    mockFetch.mockResolvedValueOnce({ success: true }) // DELETE
    mockFetch.mockResolvedValueOnce([]) // GET recarregado

    await deleteUserBook(20)

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/user-books/20', expect.objectContaining({
      method: 'DELETE'
    }))

    // Livro, anotações e flashcards devem ter sido excluídos
    expect(await bookRepo.getById(20)).toBeNull()
    expect(await annotationRepo.getAll({ bookId: 5 })).toHaveLength(0)
    const cardsAfter = await flashcardRepo.getAll()
    expect(cardsAfter.some(c => c.bookId === 5)).toBe(false)
  })
})
