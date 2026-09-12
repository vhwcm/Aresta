import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminBooks } from '~/composables/useAdminBooks'

const mockFetch = vi.fn()
;(globalThis as any).$fetch = mockFetch

describe('useAdminBooks Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uploadBook envia payload de cadastro do livro', async () => {
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
      'http://localhost:3001/api/books/admin-upload',
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
})
