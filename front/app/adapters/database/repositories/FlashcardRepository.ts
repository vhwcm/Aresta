import { getDatabase, dbManager } from '../DatabaseManager';
import type { LocalFlashcard, LocalAnnotation } from '../types';

export class FlashcardRepository {
  private db = getDatabase();

  async getAll(filters?: { dateStr?: string; onlyDue?: boolean }): Promise<LocalFlashcard[]> {
    return this.db.getFlashcards(filters);
  }

  async getById(id: number): Promise<LocalFlashcard | null> {
    return this.db.getFlashcardById(id);
  }

  async save(flashcard: Partial<LocalFlashcard> & { id: number; question: string; answer: string }): Promise<LocalFlashcard> {
    const existing = await this.db.getFlashcardById(flashcard.id);
    const now = new Date().toISOString();
    const entity: LocalFlashcard = {
      ...existing,
      ...flashcard,
      cardType: flashcard.cardType || existing?.cardType || 'recall',
      repetitionLevel: flashcard.repetitionLevel ?? existing?.repetitionLevel ?? 0,
      nextReviewAt: flashcard.nextReviewAt || existing?.nextReviewAt || now,
      updated_at: now,
      deleted_at: null,
      sync_status: 'pending'
    };
    await this.db.saveFlashcard(entity);
    await dbManager.recordMutation('flashcard', entity.id, existing ? 'UPDATE' : 'INSERT', entity);
    return entity;
  }

  async createFromAnnotation(
    annotation: LocalAnnotation,
    question?: string,
    answer?: string
  ): Promise<LocalFlashcard> {
    const now = new Date().toISOString();
    const generatedId = Date.now(); // ID local provisório caso offline
    const entity: LocalFlashcard = {
      id: generatedId,
      userId: annotation.userId,
      annotationId: annotation.id,
      bookId: annotation.bookId,
      bookTitle: annotation.bookTitle,
      bookCover: annotation.bookCover,
      chapterTitle: annotation.chapterTitle,
      selectedText: annotation.selectedText,
      note: annotation.note,
      cardType: 'annotation_recall',
      question: question || (annotation.note ? `O que significa a anotação: "${annotation.note}"?` : `Revisão do trecho destacado em ${annotation.chapterTitle || 'livro'}`),
      answer: answer || annotation.selectedText || annotation.note || '',
      contextSummary: annotation.note || null,
      repetitionLevel: 0,
      nextReviewAt: now,
      updated_at: now,
      deleted_at: null,
      sync_status: 'pending'
    };
    await this.db.saveFlashcard(entity);
    await dbManager.recordMutation('flashcard', entity.id, 'INSERT', entity);
    return entity;
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFlashcard(id);
    await dbManager.recordMutation('flashcard', id, 'DELETE', { id });
  }
}

export const flashcardRepo = new FlashcardRepository();
