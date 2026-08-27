import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminBooks } from '~/composables/useAdminBooks'

const mockFetch = vi.fn()
;(globalThis as any).$fetch = mockFetch

describe('useAdminBooks Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uploadBook envia payload e enriquece com IA', async () => {
    const mockCreated = {
      id: 99,
      title: 'Clean Code',
      author: 'Robert C. Martin',
      summary: 'Boas práticas de software',
    }
    mockFetch.mockResolvedValueOnce(mockCreated)

    const { uploadBook, loading } = useAdminBooks()
    const result = await uploadBook({
      title: 'Clean Code',
      author: 'Robert C. Martin',
      fileName: 'clean_code.epub',
      fileBase64: 'UEsDBBQAAAA...',
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:7070/api/books/admin-upload',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          title: 'Clean Code',
          author: 'Robert C. Martin',
        }),
      })
    )
    expect(result.id).toBe(99)
    expect(loading.value).toBe(false)
  })

  it('enrichBook dispara endpoint de enriquecimento', async () => {
    const mockEnriched = {
      id: 1,
      title: 'Contos Fluminenses',
      author: 'Machado de Assis',
    }
    mockFetch.mockResolvedValueOnce(mockEnriched)

    const { enrichBook } = useAdminBooks()
    const result = await enrichBook(1)

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:7070/api/books/1/enrich',
      expect.objectContaining({
        method: 'POST',
      })
    )
    expect(result.title).toBe('Contos Fluminenses')
  })
})
