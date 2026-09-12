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
    answer?: string,
    extra?: {
      sourceType?: 'book_annotation' | 'canvas_note'
      sourceUrl?: string | null
      sourceTitle?: string | null
      noteId?: string | null
    }
  ): Promise<LocalFlashcard> {
    const now = new Date().toISOString();
    const generatedId = Date.now(); // ID local provisório caso offline

    const isNote = annotation.cfi?.startsWith('note:') || extra?.sourceType === 'canvas_note';
    const extractedNoteId = extra?.noteId || (annotation.cfi?.startsWith('note:') ? annotation.cfi.replace(/^note:/, '') : null);

    const sourceType: 'book_annotation' | 'canvas_note' = isNote ? 'canvas_note' : 'book_annotation';
    const sourceUrl = extra?.sourceUrl || (isNote
      ? `/canvas?tab=notes&noteId=${extractedNoteId}`
      : `/reader?bookId=${annotation.bookId}${annotation.cfi ? `&cfi=${encodeURIComponent(annotation.cfi)}` : ''}`);
    const sourceTitle = extra?.sourceTitle || (isNote
      ? (annotation.chapterTitle || 'Nota no Canvas')
      : (annotation.bookTitle || 'Obra'));

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
      sourceType,
      sourceUrl,
      sourceTitle,
      noteId: extractedNoteId,
      updated_at: now,
      deleted_at: null,
      sync_status: 'pending'
    };
    await this.db.saveFlashcard(entity);
    await dbManager.recordMutation('flashcard', entity.id, 'INSERT', entity);
    return entity;
  }

  async getByAnnotationId(annotationId: number): Promise<LocalFlashcard | null> {
    const cards = await this.getAll();
    return cards.find((c) => c.annotationId === annotationId) || null;
  }

  async deleteByAnnotationId(annotationId: number): Promise<void> {
    const card = await this.getByAnnotationId(annotationId);
    if (card) {
      await this.delete(card.id);
    }
  }

  async deleteByNoteId(noteId: string): Promise<void> {
    const cards = await this.getAll();
    for (const card of cards) {
      if (card.noteId === noteId || (card.sourceUrl && card.sourceUrl.includes(noteId))) {
        await this.delete(card.id);
      }
    }
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFlashcard(id);
    await dbManager.recordMutation('flashcard', id, 'DELETE', { id });
  }

  async deleteByBookId(bookId: number, annotationIds?: number[]): Promise<void> {
    const cards = await this.getAll();
    const annIdSet = new Set(annotationIds || []);
    for (const card of cards) {
      if (
        Number(card.bookId) === Number(bookId) ||
        (card.annotationId && annIdSet.has(card.annotationId))
      ) {
        await this.delete(card.id);
      }
    }
  }
}

export const flashcardRepo = new FlashcardRepository();
