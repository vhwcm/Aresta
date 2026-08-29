import Dexie, { type Table } from 'dexie';
import type { IDatabaseAdapter } from './IDatabaseAdapter';
import type {
  LocalBook,
  LocalAnnotation,
  LocalFlashcard,
  LocalCanvasItem,
  LocalStreak,
  LocalMutation
} from './types';

class ArestaDexieDB extends Dexie {
  books!: Table<LocalBook, number>;
  annotations!: Table<LocalAnnotation, number>;
  flashcards!: Table<LocalFlashcard, number>;
  canvases!: Table<LocalCanvasItem, string>;
  streaks!: Table<LocalStreak, string>;
  mutation_queue!: Table<LocalMutation, string>;

  constructor() {
    super('aresta_local_db');
    this.version(1).stores({
      books: 'id, bookId, status, updated_at, deleted_at',
      annotations: 'id, bookId, cfi, createdAt, updated_at, deleted_at',
      flashcards: 'id, bookId, annotationId, nextReviewAt, repetitionLevel, updated_at, deleted_at',
      canvases: 'id, name, updated_at, deleted_at',
      streaks: 'id, updated_at',
      mutation_queue: 'id, entity_type, entity_id, action, client_timestamp, sync_status'
    });
  }
}

export class DexieAdapter implements IDatabaseAdapter {
  private db: ArestaDexieDB;
  private isInitialized = false;

  constructor() {
    this.db = new ArestaDexieDB();
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    if (typeof window !== 'undefined') {
      await this.db.open();
      this.isInitialized = true;
    }
  }

  // Books
  async getBooks(): Promise<LocalBook[]> {
    await this.init();
    const all = await this.db.books.toArray();
    return all.filter((b) => !b.deleted_at);
  }

  async getBookById(id: number): Promise<LocalBook | null> {
    await this.init();
    const book = await this.db.books.get(id);
    return book && !book.deleted_at ? book : null;
  }

  async saveBook(book: LocalBook): Promise<void> {
    await this.init();
    await this.db.books.put(book);
  }

  async deleteBook(id: number): Promise<void> {
    await this.init();
    const existing = await this.db.books.get(id);
    if (existing) {
      existing.deleted_at = new Date().toISOString();
      existing.sync_status = 'pending';
      existing.updated_at = new Date().toISOString();
      await this.db.books.put(existing);
    }
  }

  // Annotations
  async getAnnotations(filters?: { bookId?: number; themeId?: number }): Promise<LocalAnnotation[]> {
    await this.init();
    let query = this.db.annotations.toCollection();
    let list = await query.toArray();
    list = list.filter((a) => !a.deleted_at);

    if (filters?.bookId) {
      list = list.filter((a) => a.bookId === filters.bookId);
    }
    if (filters?.themeId) {
      list = list.filter((a) => a.themes?.some((t) => t.id === filters.themeId));
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAnnotationById(id: number): Promise<LocalAnnotation | null> {
    await this.init();
    const note = await this.db.annotations.get(id);
    return note && !note.deleted_at ? note : null;
  }

  async saveAnnotation(annotation: LocalAnnotation): Promise<void> {
    await this.init();
    await this.db.annotations.put(annotation);
  }

  async deleteAnnotation(id: number): Promise<void> {
    await this.init();
    const existing = await this.db.annotations.get(id);
    if (existing) {
      existing.deleted_at = new Date().toISOString();
      existing.sync_status = 'pending';
      existing.updated_at = new Date().toISOString();
      await this.db.annotations.put(existing);
    }
  }

  // Flashcards
  async getFlashcards(filters?: { dateStr?: string; onlyDue?: boolean }): Promise<LocalFlashcard[]> {
    await this.init();
    const all = await this.db.flashcards.toArray();
    let list = all.filter((f) => !f.deleted_at);

    if (filters?.onlyDue) {
      const now = filters.dateStr ? new Date(filters.dateStr).getTime() : Date.now();
      list = list.filter((f) => new Date(f.nextReviewAt).getTime() <= now);
    }
    return list;
  }

  async getFlashcardById(id: number): Promise<LocalFlashcard | null> {
    await this.init();
    const card = await this.db.flashcards.get(id);
    return card && !card.deleted_at ? card : null;
  }

  async saveFlashcard(flashcard: LocalFlashcard): Promise<void> {
    await this.init();
    await this.db.flashcards.put(flashcard);
  }

  async deleteFlashcard(id: number): Promise<void> {
    await this.init();
    const existing = await this.db.flashcards.get(id);
    if (existing) {
      existing.deleted_at = new Date().toISOString();
      existing.sync_status = 'pending';
      existing.updated_at = new Date().toISOString();
      await this.db.flashcards.put(existing);
    }
  }

  // Canvas
  async getCanvases(): Promise<LocalCanvasItem[]> {
    await this.init();
    const all = await this.db.canvases.toArray();
    return all.filter((c) => !c.deleted_at).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  async getCanvasById(id: string): Promise<LocalCanvasItem | null> {
    await this.init();
    const canvas = await this.db.canvases.get(id);
    return canvas && !canvas.deleted_at ? canvas : null;
  }

  async saveCanvas(canvas: LocalCanvasItem): Promise<void> {
    await this.init();
    await this.db.canvases.put(canvas);
  }

  async deleteCanvas(id: string): Promise<void> {
    await this.init();
    const existing = await this.db.canvases.get(id);
    if (existing) {
      existing.deleted_at = new Date().toISOString();
      existing.sync_status = 'pending';
      existing.updated_at = new Date().toISOString();
      await this.db.canvases.put(existing);
    }
  }

  // Reading Streak
  async getStreak(): Promise<LocalStreak | null> {
    await this.init();
    const streak = await this.db.streaks.get('user_streak');
    return streak || null;
  }

  async saveStreak(streak: LocalStreak): Promise<void> {
    await this.init();
    streak.id = 'user_streak';
    await this.db.streaks.put(streak);
  }

  // Mutation Queue
  async getPendingMutations(): Promise<LocalMutation[]> {
    await this.init();
    const all = await this.db.mutation_queue.where('sync_status').equals('pending').toArray();
    return all.sort((a, b) => new Date(a.client_timestamp).getTime() - new Date(b.client_timestamp).getTime());
  }

  async enqueueMutation(mutation: LocalMutation): Promise<void> {
    await this.init();
    await this.db.mutation_queue.put(mutation);
  }

  async markMutationsSynced(ids: string[]): Promise<void> {
    await this.init();
    await this.db.mutation_queue.where('id').anyOf(ids).modify({ sync_status: 'synced' });
  }

  async clearPendingMutations(): Promise<void> {
    await this.init();
    await this.db.mutation_queue.clear();
  }
}
