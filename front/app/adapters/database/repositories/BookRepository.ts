import { getDatabase, dbManager } from '../DatabaseManager';
import type { LocalBook } from '../types';

export class BookRepository {
  private db = getDatabase();

  async getAll(): Promise<LocalBook[]> {
    return this.db.getBooks();
  }

  async getById(id: number): Promise<LocalBook | null> {
    return this.db.getBookById(id);
  }

  async save(book: Partial<LocalBook> & { id: number; bookId: number; title: string }): Promise<LocalBook> {
    const existing = await this.db.getBookById(book.id);
    const now = new Date().toISOString();
    const entity: LocalBook = {
      ...existing,
      ...book,
      updated_at: now,
      deleted_at: null,
      sync_status: 'pending',
      status: book.status || existing?.status || 'QUERO_LER',
      currentPage: book.currentPage ?? existing?.currentPage ?? 0
    };
    await this.db.saveBook(entity);
    await dbManager.recordMutation('book', entity.id, existing ? 'UPDATE' : 'INSERT', entity);
    return entity;
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteBook(id);
    await dbManager.recordMutation('book', id, 'DELETE', { id });
  }
}

export const bookRepo = new BookRepository();
