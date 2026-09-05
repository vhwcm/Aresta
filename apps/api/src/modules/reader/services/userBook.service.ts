import { prisma } from '../config/database'

export class UserBookService {
  async findByUser(userId: number) {
    return prisma.userBook.findMany({
      where: { user_id: userId },
      include: { book: { include: { publicInfo: true } } },
      orderBy: { last_accessed_at: 'desc' },
    })
  }

  async upsert(userId: number, bookId: number, data: { status?: string; currentPage?: number }) {
    return prisma.userBook.upsert({
      where: { user_id_book_id: { user_id: userId, book_id: bookId } },
      create: {
        user_id: userId,
        book_id: bookId,
        status: data.status ?? 'LENDO',
        current_page: data.currentPage ?? 0,
        last_accessed_at: new Date(),
      },
      update: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.currentPage !== undefined && { current_page: data.currentPage }),
        last_accessed_at: new Date(),
      },
    })
  }
}

export const userBookService = new UserBookService()
