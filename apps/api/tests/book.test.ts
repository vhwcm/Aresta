import { describe, it, expect, vi } from 'vitest'
import { userBookService } from '../src/modules/reader/services/userBook.service'
import { prisma } from '../src/modules/reader/config/database'

describe('BookService & UserBookService', () => {
  it('deve registrar livro enviado no banco e associar ao usuario via registerUploadedBook', async () => {
    const mockBook = {
      id: 999,
      title: 'O Pequeno Príncipe',
      file_path: '999.epub',
      cover_path: 'data:image/webp;base64,...',
      file_type: 'epub',
    }

    const mockUserBook = {
      id: 1001,
      user_id: 1,
      book_id: 999,
      status: 'LENDO',
      current_page: 1,
      book: mockBook,
    }

    vi.spyOn(prisma.book, 'create').mockResolvedValue(mockBook as any)
    vi.spyOn(prisma.userBook, 'create').mockResolvedValue(mockUserBook as any)

    const result = await userBookService.registerUploadedBook(1, {
      title: 'O Pequeno Príncipe',
      author: 'Antoine de Saint-Exupéry',
      coverPath: 'data:image/webp;base64,...',
      filePath: '999.epub',
      fileType: 'epub',
      status: 'LENDO',
      currentPage: 1,
    })

    expect(result.id).toBe(1001)
    expect(result.user_id).toBe(1)
    expect(result.book.title).toBe('O Pequeno Príncipe')
  })

  it('deve truncar titulo para no maximo 30 caracteres ao registrar livro enviado', async () => {
    const bookCreateSpy = vi.spyOn(prisma.book, 'create').mockImplementation(async (args: any) => ({
      id: 1000,
      title: args.data.title,
      file_path: args.data.file_path,
      cover_path: args.data.cover_path,
      file_type: args.data.file_type,
    } as any))

    vi.spyOn(prisma.userBook, 'create').mockResolvedValue({
      id: 1002,
      user_id: 1,
      book_id: 1000,
      status: 'LENDO',
      current_page: 1,
      book: { id: 1000, title: 'Um Livro com Titulo Extremame' },
    } as any)

    await userBookService.registerUploadedBook(1, {
      title: 'Um Livro com Titulo Extremamente Longo Que Passa Dos Limites',
      author: 'Autor Teste',
    })

    expect(bookCreateSpy).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        title: 'Um Livro com Titulo Extremamen',
      }),
    }))
  })

  it('deve excluir flashcards e anotacoes associadas ao livro ao deletar userBook', async () => {
    vi.spyOn(prisma.userBook, 'findFirst').mockResolvedValue({
      id: 50,
      user_id: 1,
      book_id: 123,
      status: 'LENDO',
      current_page: 10,
      last_accessed_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    } as any)

    const flashcardDeleteSpy = vi.spyOn(prisma.flashcard, 'deleteMany').mockResolvedValue({ count: 2 } as any)
    const annotationDeleteSpy = vi.spyOn(prisma.annotation, 'deleteMany').mockResolvedValue({ count: 3 } as any)
    const userBookDeleteSpy = vi.spyOn(prisma.userBook, 'deleteMany').mockResolvedValue({ count: 1 } as any)

    await userBookService.delete(1, 50)

    expect(flashcardDeleteSpy).toHaveBeenCalledWith({
      where: {
        user_id: 1,
        OR: [
          { book_id: 123 },
          { annotation: { book_id: 123 } },
        ],
      },
    })

    expect(annotationDeleteSpy).toHaveBeenCalledWith({
      where: {
        user_id: 1,
        book_id: 123,
      },
    })

    expect(userBookDeleteSpy).toHaveBeenCalledWith({
      where: {
        user_id: 1,
        OR: [{ id: 50 }, { book_id: 50 }],
      },
    })
  })
})
