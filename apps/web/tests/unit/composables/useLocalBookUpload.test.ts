import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLocalBookUpload } from '~/composables/useLocalBookUpload'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'
import { getBinaryStorage } from '~/adapters/storage/StorageManager'
import { getCachedBook } from '~/utils/bookCache'

// Mock BookDocumentFactory
const mockLoad = vi.fn().mockResolvedValue(undefined)
const mockMetadata = {
  title: 'Memórias Póstumas de Brás Cubas',
  author: 'Machado de Assis',
  coverUrl: 'data:image/jpeg;base64,mockcoverdata'
}

vi.mock('~/adapters/BookDocumentFactory', () => ({
  createBookDocument: vi.fn((type: string) => ({
    type,
    metadata: mockMetadata,
    totalPages: 100,
    isLoaded: true,
    load: mockLoad,
    getPage: vi.fn(),
    destroy: vi.fn(),
  }))
}))

describe('useLocalBookUpload Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('salva livro no banco de dados local (bookRepo) e storage binário no upload', async () => {
    const fileBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04]) // Fake zip/epub bytes
    const fakeFile = new File([fileBytes], 'memorias.epub', { type: 'application/epub+zip' })

    const { isUploading, uploadError, uploadBookLocally } = useLocalBookUpload()

    expect(isUploading.value).toBe(false)
    expect(uploadError.value).toBeNull()

    const result = await uploadBookLocally({
      file: fakeFile,
      type: 'epub',
      initialFontSize: 18,
      initialFontFamily: 'Newsreader'
    })

    // Valida retorno
    expect(result.bookId).toBeGreaterThan(0)
    expect(result.title).toBe('memorias')
    expect(result.author).toBe('Machado de Assis')
    expect(result.localBook).toBeDefined()
    expect(result.localBook.status).toBe('LENDO')
    expect(result.localBook.currentPage).toBe(1)
    expect(result.localBook.coverPath).toBe('data:image/jpeg;base64,mockcoverdata')

    // Valida persistência no banco local (bookRepo)
    const stored = await bookRepo.getById(result.bookId)
    expect(stored).not.toBeNull()
    expect(stored?.title).toBe('memorias')
    expect(stored?.author).toBe('Machado de Assis')
    expect(stored?.status).toBe('LENDO')

    // Valida persistência de binário no StorageManager ou cache
    const storage = getBinaryStorage()
    const storedBinary = await storage.getFile(String(result.bookId))
    const cachedBinary = await getCachedBook(String(result.bookId))

    const foundBytes = storedBinary || cachedBinary?.arrayBuffer
    expect(foundBytes).not.toBeNull()
    expect(foundBytes?.byteLength).toBe(fileBytes.byteLength)
  })

  it('usa fallback de nome do arquivo truncado a no máximo 30 caracteres se não houver customTitle', async () => {
    const fileBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]) // %PDF
    const longFileName = 'este-nome-de-arquivo-e-muito-longo-e-deve-ser-truncado.pdf'
    const fakeFile = new File([fileBytes], longFileName, { type: 'application/pdf' })

    const { uploadBookLocally } = useLocalBookUpload()
    const result = await uploadBookLocally({
      file: fakeFile,
      type: 'pdf'
    })

    const expectedTitle = 'este-nome-de-arquivo-e-muito-longo-e-deve-ser-truncado'.slice(0, 30)
    expect(expectedTitle.length).toBe(30)
    expect(result.title).toBe(expectedTitle)
    expect(result.title.length).toBeLessThanOrEqual(30)

    const stored = await bookRepo.getById(result.bookId)
    expect(stored?.title).toBe(expectedTitle)
  })

  it('permite escolher opcionalmente o título e o limita a 30 caracteres', async () => {
    const fileBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04])
    const fakeFile = new File([fileBytes], 'original.epub', { type: 'application/epub+zip' })

    const { uploadBookLocally } = useLocalBookUpload()
    const result = await uploadBookLocally({
      file: fakeFile,
      type: 'epub',
      customTitle: 'Título Personalizado 123'
    })

    expect(result.title).toBe('Título Personalizado 123')

    const stored = await bookRepo.getById(result.bookId)
    expect(stored?.title).toBe('Título Personalizado 123')
  })

  it('trunca customTitle para no máximo 30 caracteres caso ultrapasse o limite', async () => {
    const fileBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04])
    const fakeFile = new File([fileBytes], 'original.epub', { type: 'application/epub+zip' })

    const { uploadBookLocally } = useLocalBookUpload()
    const result = await uploadBookLocally({
      file: fakeFile,
      type: 'epub',
      customTitle: '123456789012345678901234567890EXTRA'
    })

    expect(result.title).toBe('123456789012345678901234567890')
    expect(result.title.length).toBe(30)
  })

  it('registra erro e relança exceção caso ocorra falha no parsing', async () => {
    mockLoad.mockRejectedValueOnce(new Error('Corrompido'))

    const fakeFile = new File([new Uint8Array([])], 'corrompido.epub', { type: 'application/epub+zip' })
    const { uploadBookLocally, uploadError } = useLocalBookUpload()

    await expect(uploadBookLocally({
      file: fakeFile,
      type: 'epub'
    })).rejects.toThrow('Corrompido')

    expect(uploadError.value).toBe('Corrompido')
  })
})
