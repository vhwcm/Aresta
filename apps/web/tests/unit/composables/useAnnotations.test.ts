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
      'http://localhost:7070/api/annotations?bookId=1',
      expect.objectContaining({
        headers: { Authorization: 'Bearer fake-token' },
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
    const existing = { id: 1, userId: 10, bookId: 1, cfi: 'page:1', selectedText: 'Original', note: 'Nota Velha', createdAt: '2026-08-24' }
    const updated = { ...existing, note: 'Nota Atualizada' }
    mockFetch.mockResolvedValueOnce(updated)

    const { annotations, updateAnnotationNote } = useAnnotations()
    annotations.value = [existing]

    const res = await updateAnnotationNote(1, 'Nota Atualizada')
    expect(res.note).toBe('Nota Atualizada')
    expect(annotations.value[0]?.note).toBe('Nota Atualizada')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:7070/api/annotations/1',
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

  it('createAnnotationWithOcr envia imagem para /annotations/with-ocr e atualiza a lista', async () => {
    const ocrCreatedItem = {
      id: 3,
      userId: 10,
      bookId: 1,
      cfi: 'page:5',
      selectedText: 'Citação da página 5',
      note: 'Texto manuscrito transcrito pelo OCR',
      themes: [{ id: 7, name: 'História' }],
    }
    mockFetch.mockResolvedValueOnce(ocrCreatedItem)

    const { annotations, createAnnotationWithOcr } = useAnnotations()
    const res = await createAnnotationWithOcr({
      bookId: 1,
      cfi: 'page:5',
      selectedText: 'Citação da página 5',
      imageBase64: 'data:image/png;base64,iVBORw0KGgo...',
      themeIds: [7],
    })

    expect(res).toEqual(ocrCreatedItem)
    expect(annotations.value[0]).toEqual(ocrCreatedItem)
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:7070/api/annotations/with-ocr',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          bookId: 1,
          cfi: 'page:5',
          imageBase64: 'data:image/png;base64,iVBORw0KGgo...',
          themeIds: [7],
        }),
      })
    )
  })
})
