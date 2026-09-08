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
})
