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
    expect(result.title).toBe('Memórias Póstumas de Brás Cubas')
    expect(result.author).toBe('Machado de Assis')
    expect(result.localBook).toBeDefined()
    expect(result.localBook.status).toBe('LENDO')
    expect(result.localBook.currentPage).toBe(1)
    expect(result.localBook.coverPath).toBe('data:image/jpeg;base64,mockcoverdata')

    // Valida persistência no banco local (bookRepo)
    const stored = await bookRepo.getById(result.bookId)
    expect(stored).not.toBeNull()
    expect(stored?.title).toBe('Memórias Póstumas de Brás Cubas')
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

  it('usa fallback de nome do arquivo caso os metadados do documento não tenham título', async () => {
    mockMetadata.title = ''
    mockMetadata.author = ''

    const fileBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]) // %PDF
    const fakeFile = new File([fileBytes], 'meu-livro-favorito.pdf', { type: 'application/pdf' })

    const { uploadBookLocally } = useLocalBookUpload()
    const result = await uploadBookLocally({
      file: fakeFile,
      type: 'pdf'
    })

    expect(result.title).toBe('meu-livro-favorito')
    expect(result.author).toBe('Autor Desconhecido')

    const stored = await bookRepo.getById(result.bookId)
    expect(stored?.title).toBe('meu-livro-favorito')
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
