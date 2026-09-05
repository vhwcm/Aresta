import { prisma } from '../config/database'

export interface LocalMutationPayload {
  id: string
  entity_type: 'book' | 'user_book'
  entity_id: string | number
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  payload: any
  client_timestamp: string
}

export interface SyncRequest {
  last_sync_timestamp: string | null
  mutations: LocalMutationPayload[]
}

export interface SyncResponse {
  server_timestamp: string
  processed_mutation_ids: string[]
  conflicts: Array<{
    mutation_id: string
    reason: string
    resolved_with: 'server_state' | 'client_state'
  }>
  deltas: {
    books: any[]
    user_books: any[]
    deleted_ids: {
      books: number[]
      user_books: number[]
    }
  }
}

/**
 * SyncService — aresta-reader
 * Handles offline-first sync for books and user_books.
 * Annotations, flashcards, and canvases are synced by their own services.
 */
export class SyncService {
  async processSync(userId: number, request: SyncRequest): Promise<SyncResponse> {
    const serverTimestamp = new Date().toISOString()
    const processedIds: string[] = []
    const conflicts: SyncResponse['conflicts'] = []

    if (request.mutations && request.mutations.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const mut of request.mutations) {
          try {
            switch (mut.entity_type) {
              case 'user_book':
              case 'book': {
                const bookId = Number(mut.payload.bookId || mut.entity_id)
                if (mut.action === 'DELETE') {
                  await tx.userBook.deleteMany({ where: { user_id: userId, book_id: bookId } })
                } else {
                  await tx.userBook.upsert({
                    where: { user_id_book_id: { user_id: userId, book_id: bookId } },
                    create: {
                      user_id: userId,
                      book_id: bookId,
                      status: mut.payload.status || 'QUERO_LER',
                      current_page: mut.payload.currentPage || 0,
                      last_accessed_at: mut.payload.lastAccessedAt
                        ? new Date(mut.payload.lastAccessedAt)
                        : new Date(),
                    },
                    update: {
                      status: mut.payload.status,
                      current_page: mut.payload.currentPage,
                      last_accessed_at: mut.payload.lastAccessedAt
                        ? new Date(mut.payload.lastAccessedAt)
                        : new Date(),
                    },
                  })
                }
                break
              }
            }
            processedIds.push(mut.id)
          } catch (e: any) {
            conflicts.push({
              mutation_id: mut.id,
              reason: e.message || 'Erro ao aplicar mutação',
              resolved_with: 'server_state',
            })
          }
        }
      })
    }

    const sinceDate = request.last_sync_timestamp
      ? new Date(request.last_sync_timestamp)
      : new Date(0)

    const userBooks = await prisma.userBook.findMany({
      where: { user_id: userId, updated_at: { gt: sinceDate } },
      include: { book: { include: { publicInfo: true } } },
    })

    return {
      server_timestamp: serverTimestamp,
      processed_mutation_ids: processedIds,
      conflicts,
      deltas: {
        books: userBooks.map((ub) => ({
          userBookId: ub.id,
          bookId: ub.book_id,
          title: ub.book.title,
          author: ub.book.publicInfo?.author || 'Autor Desconhecido',
          coverPath: ub.book.cover_path,
          filePath: ub.book.file_path,
          fileType: ub.book.file_type,
          status: ub.status,
          currentPage: ub.current_page,
          lastAccessedAt: ub.last_accessed_at,
          updated_at: ub.updated_at,
        })),
        user_books: [],
        deleted_ids: { books: [], user_books: [] },
      },
    }
  }
}

export const syncService = new SyncService()
