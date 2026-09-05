import type { IDatabaseAdapter } from './IDatabaseAdapter';
import type {
  LocalBook,
  LocalAnnotation,
  LocalFlashcard,
  LocalCanvasItem,
  LocalStreak,
  LocalMutation
} from './types';

export class InMemoryAdapter implements IDatabaseAdapter {
  private books = new Map<number, LocalBook>();
  private annotations = new Map<number, LocalAnnotation>();
  private flashcards = new Map<number, LocalFlashcard>();
  private canvases = new Map<string, LocalCanvasItem>();
  private streak: LocalStreak | null = null;
  private mutationQueue = new Map<string, LocalMutation>();

  async init(): Promise<void> {}

  // Books
  async getBooks(): Promise<LocalBook[]> {
    return Array.from(this.books.values()).filter((b) => !b.deleted_at);
  }

  async getBookById(id: number): Promise<LocalBook | null> {
    const b = this.books.get(id);
    return b && !b.deleted_at ? b : null;
  }

  async saveBook(book: LocalBook): Promise<void> {
    this.books.set(book.id, { ...book });
  }

  async deleteBook(id: number): Promise<void> {
    const existing = this.books.get(id);
    if (existing) {
      existing.deleted_at = new Date().toISOString();
      existing.sync_status = 'pending';
      this.books.set(id, existing);
    }
  }

  // Annotations
  async getAnnotations(filters?: { bookId?: number; themeId?: number }): Promise<LocalAnnotation[]> {
    let list = Array.from(this.annotations.values()).filter((a) => !a.deleted_at);
    if (filters?.bookId) {
      list = list.filter((a) => a.bookId === filters.bookId);
    }
    if (filters?.themeId) {
      list = list.filter((a) => a.themes?.some((t) => t.id === filters.themeId));
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAnnotationById(id: number): Promise<LocalAnnotation | null> {
    const a = this.annotations.get(id);
    return a && !a.deleted_at ? a : null;
  }

  async saveAnnotation(annotation: LocalAnnotation): Promise<void> {
    this.annotations.set(annotation.id, { ...annotation });
  }

  async deleteAnnotation(id: number): Promise<void> {
    const existing = this.annotations.get(id);
    if (existing) {
      existing.deleted_at = new Date().toISOString();
      existing.sync_status = 'pending';
      this.annotations.set(id, existing);
    }
  }

  // Flashcards
  async getFlashcards(filters?: { dateStr?: string; onlyDue?: boolean }): Promise<LocalFlashcard[]> {
    let list = Array.from(this.flashcards.values()).filter((f) => !f.deleted_at);
    if (filters?.onlyDue) {
      const now = filters.dateStr ? new Date(filters.dateStr).getTime() : Date.now();
      list = list.filter((f) => new Date(f.nextReviewAt).getTime() <= now);
    }
    return list;
  }

  async getFlashcardById(id: number): Promise<LocalFlashcard | null> {
    const f = this.flashcards.get(id);
    return f && !f.deleted_at ? f : null;
  }

  async saveFlashcard(flashcard: LocalFlashcard): Promise<void> {
    this.flashcards.set(flashcard.id, { ...flashcard });
  }

  async deleteFlashcard(id: number): Promise<void> {
    const existing = this.flashcards.get(id);
    if (existing) {
      existing.deleted_at = new Date().toISOString();
      existing.sync_status = 'pending';
      this.flashcards.set(id, existing);
    }
  }

  // Canvas
  async getCanvases(): Promise<LocalCanvasItem[]> {
    return Array.from(this.canvases.values()).filter((c) => !c.deleted_at);
  }

  async getCanvasById(id: string): Promise<LocalCanvasItem | null> {
    const c = this.canvases.get(id);
    return c && !c.deleted_at ? c : null;
  }

  async saveCanvas(canvas: LocalCanvasItem): Promise<void> {
    this.canvases.set(canvas.id, { ...canvas });
  }

  async deleteCanvas(id: string): Promise<void> {
    const existing = this.canvases.get(id);
    if (existing) {
      existing.deleted_at = new Date().toISOString();
      existing.sync_status = 'pending';
      this.canvases.set(id, existing);
    }
  }

  // Reading Streak
  async getStreak(): Promise<LocalStreak | null> {
    return this.streak;
  }

  async saveStreak(streak: LocalStreak): Promise<void> {
    this.streak = { ...streak };
  }

  // Mutation Queue
  async getPendingMutations(): Promise<LocalMutation[]> {
    return Array.from(this.mutationQueue.values()).filter((m) => m.sync_status === 'pending');
  }

  async enqueueMutation(mutation: LocalMutation): Promise<void> {
    this.mutationQueue.set(mutation.id, { ...mutation });
  }

  async markMutationsSynced(ids: string[]): Promise<void> {
    for (const id of ids) {
      const mut = this.mutationQueue.get(id);
      if (mut) {
        mut.sync_status = 'synced';
      }
    }
  }

  async clearPendingMutations(): Promise<void> {
    this.mutationQueue.clear();
  }
}
