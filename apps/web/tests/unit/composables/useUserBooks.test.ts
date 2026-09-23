import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useUserBooks } from '~/composables/useUserBooks'
import * as authComposable from '~/composables/useAuth'
import { dbManager } from '~/adapters/database/DatabaseManager'
import { InMemoryAdapter } from '~/adapters/database/InMemoryAdapter'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'

describe('useUserBooks Composable (Local-First Architecture)', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    dbManager.setAdapter(new InMemoryAdapter())
    vi.spyOn(authComposable, 'useAuth').mockReturnValue({
      token: ref('fake-token'),
      user: ref({ id: 1, name: 'viktor', email: 'viktor@aresta.org' }),
      isLoggedIn: ref(true),
      isAdmin: ref(true),
    } as any)
  })

  it('fetchUserBooks carrega a estante do banco local', async () => {
    await bookRepo.save({
      id: 10,
      bookId: 1,
      title: 'Contos Fluminenses',
      status: 'LIDO',
      currentPage: 180,
    })

    const { userBooks, fetchUserBooks } = useUserBooks()
    await fetchUserBooks()

    expect(userBooks.value?.length).toBe(1)
    expect(userBooks.value?.[0]?.title).toBe('Contos Fluminenses')
    expect(userBooks.value?.[0]?.status).toBe('LIDO')
  })

  it('addUserBook adiciona novo livro à estante local', async () => {
    const { addUserBook, userBooks } = useUserBooks()
    await addUserBook(2, 'LENDO', 45, 'Livro Novo')

    expect(userBooks.value.some((b) => b.title === 'Livro Novo')).toBe(true)
    const saved = await bookRepo.getAll()
    expect(saved.some((b) => b.title === 'Livro Novo')).toBe(true)
  })

  it('updateUserBook atualiza status e página atual no banco local', async () => {
    await bookRepo.save({
      id: 10,
      bookId: 10,
      title: 'Livro Para Atualizar',
      status: 'LENDO',
      currentPage: 50,
    })

    const { updateUserBook, userBooks, fetchUserBooks } = useUserBooks()
    await fetchUserBooks()
    await updateUserBook(10, 'LIDO', 200)

    const updated = userBooks.value.find((b) => b.userBookId === 10)
    expect(updated?.status).toBe('LIDO')
    expect(updated?.currentPage).toBe(200)
  })

  it('deleteUserBook remove livro, anotações e flashcards locais', async () => {
    const { annotationRepo } = await import('~/adapters/database/repositories/AnnotationRepository')
    const { flashcardRepo } = await import('~/adapters/database/repositories/FlashcardRepository')

    await bookRepo.save({
      id: 20,
      bookId: 5,
      title: 'Livro com Notas',
      status: 'LENDO',
      currentPage: 10,
    })

    await annotationRepo.save({
      id: 101,
      bookId: 5,
      cfi: 'epubcfi(/6/2[chap1]!/4/2/1:0)',
      note: 'Minha nota importante',
      selectedText: 'Trecho do livro',
    })

    await flashcardRepo.save({
      id: 201,
      question: 'O que significa?',
      answer: 'Significado',
      bookId: 5,
    } as any)

    const { userBooks, fetchUserBooks, deleteUserBook } = useUserBooks()
    await fetchUserBooks()

    expect(userBooks.value.length).toBe(1)
    expect(await annotationRepo.getAll({ bookId: 5 })).toHaveLength(1)

    await deleteUserBook(20)

    // Livro, anotações e flashcards devem ter sido excluídos
    expect(await bookRepo.getById(20)).toBeNull()
    expect(await annotationRepo.getAll({ bookId: 5 })).toHaveLength(0)
    const cardsAfter = await flashcardRepo.getAll()
    expect(cardsAfter.some((c) => c.bookId === 5)).toBe(false)
  })

  it('deleteUserBook remove de forma otimista e chama deleteBookFromDrive quando Drive está conectado', async () => {
    const driveSyncComposable = await import('~/composables/useGoogleDriveSync')
    const mockDeleteFromDrive = vi.fn().mockResolvedValue(true)
    const mockListDriveBooks = vi.fn().mockResolvedValue([
      { title: 'Livro do Drive', folderId: 'folder-123' }
    ])

    vi.spyOn(driveSyncComposable, 'useGoogleDriveSync').mockReturnValue({
      isGoogleDriveConnected: ref(true),
      isSyncing: ref(false),
      syncError: ref(null),
      syncBookToDrive: vi.fn(),
      listDriveBooks: mockListDriveBooks,
      downloadBookFromDrive: vi.fn().mockResolvedValue(null),
      downloadBookCoverFromDrive: vi.fn().mockResolvedValue(null),
      deleteBookFromDrive: mockDeleteFromDrive,
      deleteAllDriveData: vi.fn(),
    } as any)

    await bookRepo.save({
      id: 30,
      bookId: 30,
      title: 'Livro do Drive',
      filePath: 'drive:folder-123',
      status: 'QUERO_LER',
      currentPage: 0,
    })

    const { userBooks, fetchUserBooks, deleteUserBook } = useUserBooks()
    await fetchUserBooks()
    expect(userBooks.value.some((b) => b.title === 'Livro do Drive')).toBe(true)

    await deleteUserBook(30)

    // Deve ter chamado deleteBookFromDrive
    expect(mockDeleteFromDrive).toHaveBeenCalledWith('Livro do Drive', 'folder-123')

    // Deve ter sido removido de userBooks
    expect(userBooks.value.some((b) => b.title === 'Livro do Drive')).toBe(false)
    expect(await bookRepo.getById(30)).toBeNull()

    // Ao rodar fetchUserBooks novamente, não deve ressuscitar mesmo que listDriveBooks ainda liste a pasta
    await fetchUserBooks()
    expect(userBooks.value.some((b) => b.title === 'Livro do Drive')).toBe(false)
  })
})
