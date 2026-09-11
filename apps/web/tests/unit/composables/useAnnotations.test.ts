import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAnnotations } from '../../../app/composables/useAnnotations'

const mockFetch = vi.fn()
;(globalThis as any).$fetch = mockFetch

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    token: { value: 'fake-token' },
  }),
}))

describe('useAnnotations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(globalThis as any).$fetch = mockFetch
  })

  it('fetchAnnotations busca e preenche anotações', async () => {
    const fakeData = [
      { id: 1, userId: 10, bookId: 1, cfi: 'page:1', selectedText: 'Trecho 1', note: 'Nota 1', themes: [] },
    ]
    mockFetch.mockResolvedValueOnce(fakeData)

    const { annotations, fetchAnnotations, loading } = useAnnotations()
    expect(loading.value).toBe(false)

    const res = await fetchAnnotations({ bookId: 1 })
    expect(res).toEqual(fakeData)
    expect(annotations.value).toEqual(fakeData)
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/annotations?bookId=1',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer fake-token' }),
      })
    )
  })

  it('createAnnotation adiciona anotação na lista', async () => {
    const createdItem = {
      id: 2,
      userId: 10,
      bookId: 1,
      cfi: 'page:2',
      selectedText: 'Citação',
      note: 'Minha reflexão',
      color: '#E57B55',
      themes: [{ id: 5, name: 'Filosofia' }],
    }
    mockFetch.mockResolvedValueOnce(createdItem)

    const { annotations, createAnnotation } = useAnnotations()
    const res = await createAnnotation({
      bookId: 1,
      cfi: 'page:2',
      selectedText: 'Citação',
      note: 'Minha reflexão',
      themeIds: [5],
    })

    expect(res).toEqual(createdItem)
    expect(annotations.value[0]).toEqual(createdItem)
  })

  it('updateAnnotationNote atualiza a nota na lista', async () => {
    const existing = { id: 1, userId: 10, bookId: 1, cfi: 'page:1', selectedText: 'Original', note: 'Nota Velha', color: '#E57B55', createdAt: '2026-08-24' }
    const updated = { ...existing, note: 'Nota Atualizada' }
    mockFetch.mockResolvedValueOnce(updated)

    const { annotations, updateAnnotationNote } = useAnnotations()
    annotations.value = [existing]

    const res = await updateAnnotationNote(1, 'Nota Atualizada')
    expect(res.note).toBe('Nota Atualizada')
    expect(annotations.value[0]?.note).toBe('Nota Atualizada')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/annotations/1',
      expect.objectContaining({
        method: 'PUT',
        body: { note: 'Nota Atualizada' },
      })
    )
  })

  it('deleteAnnotation remove anotação da lista', async () => {
    mockFetch.mockResolvedValueOnce(true)

    const { annotations, deleteAnnotation } = useAnnotations()
    annotations.value = [{ id: 1, userId: 10, bookId: 1, cfi: 'p1' } as any]

    const success = await deleteAnnotation(1)
    expect(success).toBe(true)
    expect(annotations.value).toHaveLength(0)
  })

  it('preserva anotações salvas localmente quando a API remota retorna vazia ou falha', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { annotations, createAnnotation, fetchAnnotations } = useAnnotations()
    await createAnnotation({
      bookId: 99,
      cfi: 'page:10',
      note: 'Minha nota offline',
    })

    expect(annotations.value.some((a) => a.note === 'Minha nota offline')).toBe(true)

    // Simula abertura da gaveta de anotações com a API remota retornando vazia
    mockFetch.mockResolvedValueOnce([])
    const fetched = await fetchAnnotations({ bookId: 99 })

    expect(fetched.some((a) => a.note === 'Minha nota offline')).toBe(true)
    expect(annotations.value.some((a) => a.note === 'Minha nota offline')).toBe(true)
  })
})
