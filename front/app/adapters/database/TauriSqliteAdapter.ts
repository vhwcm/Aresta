import Database from '@tauri-apps/plugin-sql';
import type { IDatabaseAdapter } from './IDatabaseAdapter';
import type {
  LocalBook,
  LocalAnnotation,
  LocalFlashcard,
  LocalCanvasItem,
  LocalStreak,
  LocalMutation
} from './types';

export class TauriSqliteAdapter implements IDatabaseAdapter {
  private db: Database | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized && this.db) return;
    try {
      this.db = await Database.load('sqlite:aresta.db');
      await this.createTables();
      this.isInitialized = true;
    } catch (e) {
      console.error('[TauriSqliteAdapter] Erro ao carregar SQLite nativo:', e);
      throw e;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY,
        book_id INTEGER,
        title TEXT NOT NULL,
        author TEXT,
        cover_path TEXT,
        file_path TEXT,
        status TEXT DEFAULT 'QUERO_LER',
        current_page INTEGER DEFAULT 0,
        last_accessed_at TEXT,
        themes_json TEXT,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'pending'
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS annotations (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        book_id INTEGER NOT NULL,
        book_title TEXT,
        book_cover TEXT,
        cfi TEXT NOT NULL,
        selected_text TEXT,
        note TEXT,
        chapter_title TEXT,
        progress REAL,
        themes_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'pending'
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS flashcards (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        annotation_id INTEGER,
        book_id INTEGER,
        book_title TEXT,
        book_cover TEXT,
        chapter_title TEXT,
        selected_text TEXT,
        note TEXT,
        card_type TEXT DEFAULT 'recall',
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        context_summary TEXT,
        repetition_level INTEGER DEFAULT 0,
        next_review_at TEXT NOT NULL,
        last_reviewed_at TEXT,
        review_count INTEGER DEFAULT 0,
        difficulty INTEGER DEFAULT 0,
        is_reviewed INTEGER DEFAULT 0,
        rating TEXT,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'pending'
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS canvases (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        document_json TEXT NOT NULL,
        node_count INTEGER DEFAULT 0,
        edge_count INTEGER DEFAULT 0,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'pending'
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS streaks (
        id TEXT PRIMARY KEY,
        payload_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS mutation_queue (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        client_timestamp TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0
      );
    `);
  }

  // Books
  async getBooks(): Promise<LocalBook[]> {
    await this.init();
    const rows = await this.db!.select<any[]>('SELECT * FROM books WHERE deleted_at IS NULL ORDER BY updated_at DESC');
    return rows.map((r) => ({
      id: r.id,
      bookId: r.book_id,
      title: r.title,
      author: r.author,
      coverPath: r.cover_path,
      filePath: r.file_path,
      status: r.status,
      currentPage: r.current_page,
      lastAccessedAt: r.last_accessed_at,
      themes: r.themes_json ? JSON.parse(r.themes_json) : [],
      updated_at: r.updated_at,
      deleted_at: r.deleted_at,
      sync_status: r.sync_status
    }));
  }

  async getBookById(id: number): Promise<LocalBook | null> {
    await this.init();
    const rows = await this.db!.select<any[]>('SELECT * FROM books WHERE id = ? AND deleted_at IS NULL', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      bookId: r.book_id,
      title: r.title,
      author: r.author,
      coverPath: r.cover_path,
      filePath: r.file_path,
      status: r.status,
      currentPage: r.current_page,
      lastAccessedAt: r.last_accessed_at,
      themes: r.themes_json ? JSON.parse(r.themes_json) : [],
      updated_at: r.updated_at,
      deleted_at: r.deleted_at,
      sync_status: r.sync_status
    };
  }

  async saveBook(book: LocalBook): Promise<void> {
    await this.init();
    await this.db!.execute(
      `INSERT INTO books (id, book_id, title, author, cover_path, file_path, status, current_page, last_accessed_at, themes_json, updated_at, deleted_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         book_id = excluded.book_id,
         title = excluded.title,
         author = excluded.author,
         cover_path = excluded.cover_path,
         file_path = excluded.file_path,
         status = excluded.status,
         current_page = excluded.current_page,
         last_accessed_at = excluded.last_accessed_at,
         themes_json = excluded.themes_json,
         updated_at = excluded.updated_at,
         deleted_at = excluded.deleted_at,
         sync_status = excluded.sync_status`,
      [
        book.id,
        book.bookId,
        book.title,
        book.author || null,
        book.coverPath || null,
        book.filePath || null,
        book.status,
        book.currentPage,
        book.lastAccessedAt || null,
        JSON.stringify(book.themes || []),
        book.updated_at,
        book.deleted_at || null,
        book.sync_status
      ]
    );
  }

  async deleteBook(id: number): Promise<void> {
    await this.init();
    const now = new Date().toISOString();
    await this.db!.execute('UPDATE books SET deleted_at = ?, sync_status = "pending", updated_at = ? WHERE id = ?', [now, now, id]);
  }

  // Annotations
  async getAnnotations(filters?: { bookId?: number; themeId?: number }): Promise<LocalAnnotation[]> {
    await this.init();
    let query = 'SELECT * FROM annotations WHERE deleted_at IS NULL';
    const params: any[] = [];
    if (filters?.bookId) {
      query += ' AND book_id = ?';
      params.push(filters.bookId);
    }
    query += ' ORDER BY created_at DESC';
    const rows = await this.db!.select<any[]>(query, params);
    let list: LocalAnnotation[] = rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      bookId: r.book_id,
      bookTitle: r.book_title,
      bookCover: r.book_cover,
      cfi: r.cfi,
      selectedText: r.selected_text,
      note: r.note,
      chapterTitle: r.chapter_title,
      progress: r.progress,
      themes: r.themes_json ? JSON.parse(r.themes_json) : [],
      createdAt: r.created_at,
      updated_at: r.updated_at,
      deleted_at: r.deleted_at,
      sync_status: r.sync_status
    }));

    if (filters?.themeId) {
      list = list.filter((a) => a.themes?.some((t) => t.id === filters.themeId));
    }
    return list;
  }

  async getAnnotationById(id: number): Promise<LocalAnnotation | null> {
    await this.init();
    const rows = await this.db!.select<any[]>('SELECT * FROM annotations WHERE id = ? AND deleted_at IS NULL', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      bookId: r.book_id,
      bookTitle: r.book_title,
      bookCover: r.book_cover,
      cfi: r.cfi,
      selectedText: r.selected_text,
      note: r.note,
      chapterTitle: r.chapter_title,
      progress: r.progress,
      themes: r.themes_json ? JSON.parse(r.themes_json) : [],
      createdAt: r.created_at,
      updated_at: r.updated_at,
      deleted_at: r.deleted_at,
      sync_status: r.sync_status
    };
  }

  async saveAnnotation(annotation: LocalAnnotation): Promise<void> {
    await this.init();
    await this.db!.execute(
      `INSERT INTO annotations (id, user_id, book_id, book_title, book_cover, cfi, selected_text, note, chapter_title, progress, themes_json, created_at, updated_at, deleted_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         user_id = excluded.user_id,
         book_id = excluded.book_id,
         book_title = excluded.book_title,
         book_cover = excluded.book_cover,
         cfi = excluded.cfi,
         selected_text = excluded.selected_text,
         note = excluded.note,
         chapter_title = excluded.chapter_title,
         progress = excluded.progress,
         themes_json = excluded.themes_json,
         created_at = excluded.created_at,
         updated_at = excluded.updated_at,
         deleted_at = excluded.deleted_at,
         sync_status = excluded.sync_status`,
      [
        annotation.id,
        annotation.userId || null,
        annotation.bookId,
        annotation.bookTitle || null,
        annotation.bookCover || null,
        annotation.cfi,
        annotation.selectedText || null,
        annotation.note || null,
        annotation.chapterTitle || null,
        annotation.progress || null,
        JSON.stringify(annotation.themes || []),
        annotation.createdAt,
        annotation.updated_at,
        annotation.deleted_at || null,
        annotation.sync_status
      ]
    );
  }

  async deleteAnnotation(id: number): Promise<void> {
    await this.init();
    const now = new Date().toISOString();
    await this.db!.execute('UPDATE annotations SET deleted_at = ?, sync_status = "pending", updated_at = ? WHERE id = ?', [now, now, id]);
  }

  // Flashcards
  async getFlashcards(filters?: { dateStr?: string; onlyDue?: boolean }): Promise<LocalFlashcard[]> {
    await this.init();
    let query = 'SELECT * FROM flashcards WHERE deleted_at IS NULL';
    const params: any[] = [];
    if (filters?.onlyDue) {
      const now = filters.dateStr || new Date().toISOString();
      query += ' AND next_review_at <= ?';
      params.push(now);
    }
    const rows = await this.db!.select<any[]>(query, params);
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      annotationId: r.annotation_id,
      bookId: r.book_id,
      bookTitle: r.book_title,
      bookCover: r.book_cover,
      chapterTitle: r.chapter_title,
      selectedText: r.selected_text,
      note: r.note,
      cardType: r.card_type,
      question: r.question,
      answer: r.answer,
      contextSummary: r.context_summary,
      repetitionLevel: r.repetition_level,
      nextReviewAt: r.next_review_at,
      lastReviewedAt: r.last_reviewed_at,
      reviewCount: r.review_count,
      difficulty: r.difficulty,
      isReviewed: Boolean(r.is_reviewed),
      rating: r.rating,
      updated_at: r.updated_at,
      deleted_at: r.deleted_at,
      sync_status: r.sync_status
    }));
  }

  async getFlashcardById(id: number): Promise<LocalFlashcard | null> {
    await this.init();
    const rows = await this.db!.select<any[]>('SELECT * FROM flashcards WHERE id = ? AND deleted_at IS NULL', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      annotationId: r.annotation_id,
      bookId: r.book_id,
      bookTitle: r.book_title,
      bookCover: r.book_cover,
      chapterTitle: r.chapter_title,
      selectedText: r.selected_text,
      note: r.note,
      cardType: r.card_type,
      question: r.question,
      answer: r.answer,
      contextSummary: r.context_summary,
      repetitionLevel: r.repetition_level,
      nextReviewAt: r.next_review_at,
      lastReviewedAt: r.last_reviewed_at,
      reviewCount: r.review_count,
      difficulty: r.difficulty,
      isReviewed: Boolean(r.is_reviewed),
      rating: r.rating,
      updated_at: r.updated_at,
      deleted_at: r.deleted_at,
      sync_status: r.sync_status
    };
  }

  async saveFlashcard(flashcard: LocalFlashcard): Promise<void> {
    await this.init();
    await this.db!.execute(
      `INSERT INTO flashcards (id, user_id, annotation_id, book_id, book_title, book_cover, chapter_title, selected_text, note, card_type, question, answer, context_summary, repetition_level, next_review_at, last_reviewed_at, review_count, difficulty, is_reviewed, rating, updated_at, deleted_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         user_id = excluded.user_id,
         annotation_id = excluded.annotation_id,
         book_id = excluded.book_id,
         book_title = excluded.book_title,
         book_cover = excluded.book_cover,
         chapter_title = excluded.chapter_title,
         selected_text = excluded.selected_text,
         note = excluded.note,
         card_type = excluded.card_type,
         question = excluded.question,
         answer = excluded.answer,
         context_summary = excluded.context_summary,
         repetition_level = excluded.repetition_level,
         next_review_at = excluded.next_review_at,
         last_reviewed_at = excluded.last_reviewed_at,
         review_count = excluded.review_count,
         difficulty = excluded.difficulty,
         is_reviewed = excluded.is_reviewed,
         rating = excluded.rating,
         updated_at = excluded.updated_at,
         deleted_at = excluded.deleted_at,
         sync_status = excluded.sync_status`,
      [
        flashcard.id,
        flashcard.userId || null,
        flashcard.annotationId || null,
        flashcard.bookId || null,
        flashcard.bookTitle || null,
        flashcard.bookCover || null,
        flashcard.chapterTitle || null,
        flashcard.selectedText || null,
        flashcard.note || null,
        flashcard.cardType,
        flashcard.question,
        flashcard.answer,
        flashcard.contextSummary || null,
        flashcard.repetitionLevel,
        flashcard.nextReviewAt,
        flashcard.lastReviewedAt || null,
        flashcard.reviewCount || 0,
        flashcard.difficulty || 0,
        flashcard.isReviewed ? 1 : 0,
        flashcard.rating || null,
        flashcard.updated_at,
        flashcard.deleted_at || null,
        flashcard.sync_status
      ]
    );
  }

  async deleteFlashcard(id: number): Promise<void> {
    await this.init();
    const now = new Date().toISOString();
    await this.db!.execute('UPDATE flashcards SET deleted_at = ?, sync_status = "pending", updated_at = ? WHERE id = ?', [now, now, id]);
  }

  // Canvas
  async getCanvases(): Promise<LocalCanvasItem[]> {
    await this.init();
    const rows = await this.db!.select<any[]>('SELECT * FROM canvases WHERE deleted_at IS NULL ORDER BY updated_at DESC');
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      document: JSON.parse(r.document_json),
      nodeCount: r.node_count,
      edgeCount: r.edge_count,
      updated_at: r.updated_at,
      deleted_at: r.deleted_at,
      sync_status: r.sync_status
    }));
  }

  async getCanvasById(id: string): Promise<LocalCanvasItem | null> {
    await this.init();
    const rows = await this.db!.select<any[]>('SELECT * FROM canvases WHERE id = ? AND deleted_at IS NULL', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      document: JSON.parse(r.document_json),
      nodeCount: r.node_count,
      edgeCount: r.edge_count,
      updated_at: r.updated_at,
      deleted_at: r.deleted_at,
      sync_status: r.sync_status
    };
  }

  async saveCanvas(canvas: LocalCanvasItem): Promise<void> {
    await this.init();
    await this.db!.execute(
      `INSERT INTO canvases (id, name, description, document_json, node_count, edge_count, updated_at, deleted_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         description = excluded.description,
         document_json = excluded.document_json,
         node_count = excluded.node_count,
         edge_count = excluded.edge_count,
         updated_at = excluded.updated_at,
         deleted_at = excluded.deleted_at,
         sync_status = excluded.sync_status`,
      [
        canvas.id,
        canvas.name,
        canvas.description || null,
        JSON.stringify(canvas.document),
        canvas.nodeCount || 0,
        canvas.edgeCount || 0,
        canvas.updated_at,
        canvas.deleted_at || null,
        canvas.sync_status
      ]
    );
  }

  async deleteCanvas(id: string): Promise<void> {
    await this.init();
    const now = new Date().toISOString();
    await this.db!.execute('UPDATE canvases SET deleted_at = ?, sync_status = "pending", updated_at = ? WHERE id = ?', [now, now, id]);
  }

  // Streak
  async getStreak(): Promise<LocalStreak | null> {
    await this.init();
    const rows = await this.db!.select<any[]>('SELECT * FROM streaks WHERE id = "user_streak"');
    if (rows.length === 0) return null;
    const data = JSON.parse(rows[0].payload_json);
    return {
      id: 'user_streak',
      ...data,
      updated_at: rows[0].updated_at,
      sync_status: 'pending'
    };
  }

  async saveStreak(streak: LocalStreak): Promise<void> {
    await this.init();
    const now = new Date().toISOString();
    await this.db!.execute(
      `INSERT INTO streaks (id, payload_json, updated_at)
       VALUES ("user_streak", ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         payload_json = excluded.payload_json,
         updated_at = excluded.updated_at`,
      [JSON.stringify(streak), now]
    );
  }

  // Mutation Queue
  async getPendingMutations(): Promise<LocalMutation[]> {
    await this.init();
    const rows = await this.db!.select<any[]>('SELECT * FROM mutation_queue WHERE sync_status = "pending" ORDER BY client_timestamp ASC');
    return rows.map((r) => ({
      id: r.id,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      action: r.action,
      payload: JSON.parse(r.payload_json),
      client_timestamp: r.client_timestamp,
      sync_status: r.sync_status,
      retry_count: r.retry_count
    }));
  }

  async enqueueMutation(mutation: LocalMutation): Promise<void> {
    await this.init();
    await this.db!.execute(
      `INSERT INTO mutation_queue (id, entity_type, entity_id, action, payload_json, client_timestamp, sync_status, retry_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         sync_status = excluded.sync_status,
         retry_count = excluded.retry_count`,
      [
        mutation.id,
        mutation.entity_type,
        String(mutation.entity_id),
        mutation.action,
        JSON.stringify(mutation.payload),
        mutation.client_timestamp,
        mutation.sync_status,
        mutation.retry_count
      ]
    );
  }

  async markMutationsSynced(ids: string[]): Promise<void> {
    await this.init();
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    await this.db!.execute(`UPDATE mutation_queue SET sync_status = "synced" WHERE id IN (${placeholders})`, ids);
  }

  async clearPendingMutations(): Promise<void> {
    await this.init();
    await this.db!.execute('DELETE FROM mutation_queue');
  }
}
