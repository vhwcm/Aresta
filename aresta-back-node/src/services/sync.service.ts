import { prisma } from '../config/prisma.js';

export interface LocalMutationPayload {
  id: string;
  entity_type: 'book' | 'annotation' | 'flashcard' | 'canvas' | 'streak';
  entity_id: string | number;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  client_timestamp: string;
  sync_status: string;
}

export interface SyncRequest {
  last_sync_timestamp: string | null;
  mutations: LocalMutationPayload[];
}

export interface SyncResponse {
  server_timestamp: string;
  processed_mutation_ids: string[];
  conflicts: Array<{
    mutation_id: string;
    reason: string;
    resolved_with: 'server_state' | 'client_state';
  }>;
  deltas: {
    books: any[];
    annotations: any[];
    flashcards: any[];
    canvases: any[];
    deleted_ids: {
      books: number[];
      annotations: number[];
      flashcards: number[];
      canvases: string[];
    };
  };
}

export class SyncService {
  async processSync(userId: number, request: SyncRequest): Promise<SyncResponse> {
    const serverTimestamp = new Date().toISOString();
    const processedIds: string[] = [];
    const conflicts: SyncResponse['conflicts'] = [];

    // 1. Process mutations in an isolated transaction
    if (request.mutations && request.mutations.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const mut of request.mutations) {
          try {
            switch (mut.entity_type) {
              case 'book': {
                const bookId = Number(mut.payload.bookId || mut.entity_id);
                if (mut.action === 'DELETE') {
                  await tx.userBook.deleteMany({
                    where: { user_id: userId, book_id: bookId }
                  });
                } else {
                  await tx.userBook.upsert({
                    where: {
                      user_id_book_id: {
                        user_id: userId,
                        book_id: bookId
                      }
                    },
                    create: {
                      user_id: userId,
                      book_id: bookId,
                      status: mut.payload.status || 'QUERO_LER',
                      current_page: mut.payload.currentPage || 0,
                      last_accessed_at: mut.payload.lastAccessedAt ? new Date(mut.payload.lastAccessedAt) : new Date()
                    },
                    update: {
                      status: mut.payload.status,
                      current_page: mut.payload.currentPage,
                      last_accessed_at: mut.payload.lastAccessedAt ? new Date(mut.payload.lastAccessedAt) : new Date()
                    }
                  });
                }
                break;
              }

              case 'annotation': {
                const annotationId = Number(mut.entity_id);
                if (mut.action === 'DELETE') {
                  await tx.annotation.deleteMany({
                    where: { id: annotationId, user_id: userId }
                  });
                } else if (mut.action === 'INSERT') {
                  await tx.annotation.create({
                    data: {
                      user_id: userId,
                      book_id: Number(mut.payload.bookId),
                      cfi: mut.payload.cfi,
                      selected_text: mut.payload.selectedText || null,
                      note: mut.payload.note || null,
                      chapter_title: mut.payload.chapterTitle || null,
                      progress: mut.payload.progress || 0.0
                    }
                  });
                } else if (mut.action === 'UPDATE') {
                  await tx.annotation.updateMany({
                    where: { id: annotationId, user_id: userId },
                    data: {
                      note: mut.payload.note,
                      selected_text: mut.payload.selectedText,
                      chapter_title: mut.payload.chapterTitle,
                      progress: mut.payload.progress
                    }
                  });
                }
                break;
              }

              case 'flashcard': {
                const flashcardId = Number(mut.entity_id);
                if (mut.action === 'DELETE') {
                  await tx.flashcard.deleteMany({
                    where: { id: flashcardId, user_id: userId }
                  });
                } else if (mut.action === 'UPDATE' || mut.action === 'INSERT') {
                  const existing = await tx.flashcard.findFirst({
                    where: { id: flashcardId, user_id: userId }
                  });
                  if (existing) {
                    await tx.flashcard.update({
                      where: { id: flashcardId },
                      data: {
                        question: mut.payload.question,
                        answer: mut.payload.answer,
                        repetition_level: mut.payload.repetitionLevel ?? existing.repetition_level,
                        next_review_at: mut.payload.nextReviewAt ? new Date(mut.payload.nextReviewAt) : existing.next_review_at,
                        last_reviewed_at: mut.payload.lastReviewedAt ? new Date(mut.payload.lastReviewedAt) : existing.last_reviewed_at,
                        review_count: mut.payload.reviewCount ?? existing.review_count,
                        difficulty: mut.payload.difficulty ?? existing.difficulty
                      }
                    });
                  }
                }
                break;
              }

              case 'canvas': {
                const canvasId = String(mut.entity_id);
                const dataJson = typeof mut.payload.document === 'string'
                  ? mut.payload.document
                  : JSON.stringify(mut.payload.document || { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } });

                if (mut.action === 'DELETE') {
                  await tx.canvas.deleteMany({
                    where: { id: canvasId, user_id: userId }
                  });
                } else {
                  await tx.canvas.upsert({
                    where: { id: canvasId },
                    create: {
                      id: canvasId,
                      user_id: userId,
                      title: mut.payload.name || mut.payload.title || 'Quadro sem título',
                      description: mut.payload.description || null,
                      data: dataJson
                    },
                    update: {
                      title: mut.payload.name || mut.payload.title,
                      description: mut.payload.description,
                      data: dataJson
                    }
                  });
                }
                break;
              }

              case 'streak': {
                if (mut.payload.todayActivity) {
                  const todayStr = mut.payload.todayActivity.date || new Date().toISOString().split('T')[0];
                  await tx.dailyActivity.upsert({
                    where: {
                      user_id_date: {
                        user_id: userId,
                        date: todayStr
                      }
                    },
                    create: {
                      user_id: userId,
                      date: todayStr,
                      reading_seconds: mut.payload.todayActivity.readingSeconds || 0,
                      flashcards_reviewed: mut.payload.todayActivity.flashcardsReviewed || 0,
                      is_completed: mut.payload.todayActivity.isCompleted || false,
                      is_frozen: mut.payload.todayActivity.isFrozen || false
                    },
                    update: {
                      reading_seconds: mut.payload.todayActivity.readingSeconds,
                      flashcards_reviewed: mut.payload.todayActivity.flashcardsReviewed,
                      is_completed: mut.payload.todayActivity.isCompleted,
                      is_frozen: mut.payload.todayActivity.isFrozen
                    }
                  });
                }

                await tx.user.update({
                  where: { id: userId },
                  data: {
                    current_streak: mut.payload.currentStreak,
                    longest_streak: mut.payload.longestStreak,
                    streak_freeze_count: mut.payload.streakFreezeCount,
                    target_streak_days: mut.payload.targetStreakDays
                  }
                });
                break;
              }
            }
            processedIds.push(mut.id);
          } catch (e: any) {
            conflicts.push({
              mutation_id: mut.id,
              reason: e.message || 'Erro ao aplicar mutação',
              resolved_with: 'server_state'
            });
          }
        }
      });
    }

    // 2. Fetch server deltas modified since last_sync_timestamp
    const sinceDate = request.last_sync_timestamp ? new Date(request.last_sync_timestamp) : new Date(0);

    const [userBooks, annotations, flashcards, canvases] = await Promise.all([
      prisma.userBook.findMany({
        where: { user_id: userId, updated_at: { gt: sinceDate } },
        include: { book: true }
      }),
      prisma.annotation.findMany({
        where: { user_id: userId, updated_at: { gt: sinceDate } },
        include: {
          book: true,
          annotationThemes: { include: { theme: true } }
        }
      }),
      prisma.flashcard.findMany({
        where: { user_id: userId, updated_at: { gt: sinceDate } },
        include: { book: true, annotation: true }
      }),
      prisma.canvas.findMany({
        where: { user_id: userId, updated_at: { gt: sinceDate } }
      })
    ]);

    return {
      server_timestamp: serverTimestamp,
      processed_mutation_ids: processedIds,
      conflicts,
      deltas: {
        books: userBooks.map((ub) => ({
          userBookId: ub.id,
          bookId: ub.book_id,
          title: ub.book.title,
          coverPath: ub.book.cover_path,
          filePath: ub.book.file_path,
          status: ub.status,
          currentPage: ub.current_page,
          lastAccessedAt: ub.last_accessed_at,
          updated_at: ub.updated_at
        })),
        annotations: annotations.map((a) => ({
          id: a.id,
          userId: a.user_id,
          bookId: a.book_id,
          bookTitle: a.book?.title,
          bookCover: a.book?.cover_path,
          cfi: a.cfi,
          selectedText: a.selected_text,
          note: a.note,
          chapterTitle: a.chapter_title,
          progress: a.progress,
          themes: a.annotationThemes.map((at) => ({ id: at.theme.id, name: at.theme.name, color: at.theme.color })),
          createdAt: a.created_at,
          updated_at: a.updated_at
        })),
        flashcards: flashcards.map((f) => ({
          id: f.id,
          userId: f.user_id,
          annotationId: f.annotation_id,
          bookId: f.book_id,
          bookTitle: f.book?.title,
          bookCover: f.book?.cover_path,
          chapterTitle: f.annotation?.chapter_title,
          selectedText: f.annotation?.selected_text,
          note: f.annotation?.note,
          cardType: f.card_type,
          question: f.question,
          answer: f.answer,
          contextSummary: f.context_summary,
          repetitionLevel: f.repetition_level,
          nextReviewAt: f.next_review_at,
          lastReviewedAt: f.last_reviewed_at,
          reviewCount: f.review_count,
          difficulty: f.difficulty,
          updated_at: f.updated_at
        })),
        canvases: canvases.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          data: c.data,
          updated_at: c.updated_at
        })),
        deleted_ids: {
          books: [],
          annotations: [],
          flashcards: [],
          canvases: []
        }
      }
    };
  }
}
