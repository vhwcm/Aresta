import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUserBooks } from '~/composables/useUserBooks'

const mockFetch = vi.fn()
;(globalThis as any).$fetch = mockFetch

describe('useUserBooks Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchUserBooks carrega a estante do usuário', async () => {
    const mockData = [
      { id: 10, bookId: 1, title: 'Contos Fluminenses', status: 'LIDO', currentPage: 180 }
    ]
    mockFetch.mockResolvedValueOnce(mockData)

    const { userBooks, fetchUserBooks } = useUserBooks()
    await fetchUserBooks()

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:7070/api/user-books', expect.any(Object))
    expect(userBooks.value?.length).toBe(1)
    expect(userBooks.value?.[0]?.title).toBe('Contos Fluminenses')
    expect(userBooks.value?.[0]?.status).toBe('LIDO')
  })

  it('addUserBook adiciona novo livro à estante', async () => {
    mockFetch.mockResolvedValueOnce({ id: 11, bookId: 2, status: 'LENDO', currentPage: 45 }) // POST
    mockFetch.mockResolvedValueOnce([]) // GET recarregado

    const { addUserBook } = useUserBooks()
    await addUserBook(2, 'LENDO', 45)

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:7070/api/user-books', expect.objectContaining({
      method: 'POST',
      body: { bookId: 2, status: 'LENDO', currentPage: 45 }
    }))
  })

  it('updateUserBook atualiza status e página atual', async () => {
    mockFetch.mockResolvedValueOnce({ id: 10, status: 'LIDO', currentPage: 200 }) // PATCH
    mockFetch.mockResolvedValueOnce([]) // GET recarregado

    const { updateUserBook } = useUserBooks()
    await updateUserBook(10, 'LIDO', 200)

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:7070/api/user-books/10', expect.objectContaining({
      method: 'PATCH',
      body: { status: 'LIDO', currentPage: 200 }
    }))
  })

  it('recordBookAccess registra último acesso do livro', async () => {
    mockFetch.mockResolvedValueOnce({ id: 10, lastAccessedAt: new Date().toISOString() }) // PATCH
    mockFetch.mockResolvedValueOnce([]) // GET recarregado

    const { recordBookAccess } = useUserBooks()
    await recordBookAccess(10)

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:7070/api/user-books/10/access', expect.objectContaining({
      method: 'PATCH'
    }))
  })
})
