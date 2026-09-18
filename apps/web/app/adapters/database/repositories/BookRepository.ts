import { getDatabase, dbManager } from '../DatabaseManager';
import type { LocalBook } from '../types';

export class BookRepository {
  private get db() {
    return getDatabase();
  }

  async getAll(): Promise<LocalBook[]> {
    return this.db.getBooks();
  }

  async getById(id: number): Promise<LocalBook | null> {
    return this.db.getBookById(id);
  }

  /**
   * Retorna todos os livros independentemente de `deleted_at`.
   */
  async getRawAll(): Promise<LocalBook[]> {
    return this.db.getBooksRaw ? this.db.getBooksRaw() : this.db.getBooks();
  }

  /**
   * Retorna o livro pelo ID independentemente de `deleted_at`,
   * necessário para checagens de estado antes de salvar.
   */
  private async getRawById(id: number): Promise<LocalBook | null> {
    return this.db.getBookRawById ? this.db.getBookRawById(id) : this.db.getBookById(id);
  }

  async save(book: Partial<LocalBook> & { id: number; bookId: number; title: string }): Promise<LocalBook> {
    // Busca o registro real (inclusive se estiver deletado)
    let existing = await this.getRawById(book.id);

    // Se não encontrou por ID, verifica se há registro deletado com mesmo título
    if (!existing && book.title && !('deleted_at' in book)) {
      const allRaw = await this.getRawAll();
      const norm = book.title.trim().toLowerCase();
      existing = allRaw.find((b) => b.title && b.title.trim().toLowerCase() === norm && b.deleted_at) || null;
    }

    // Se o livro foi deletado e não estamos explicitamente restaurando-o,
    // não ressuscitamos — o usuário já o excluiu intencionalmente.
    if (existing?.deleted_at && !('deleted_at' in book)) {
      // Retorna o estado atual sem sobrescrever nada
      return existing;
    }

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

  async clear(): Promise<void> {
    await this.db.clearBooks();
  }
}

export const bookRepo = new BookRepository();
