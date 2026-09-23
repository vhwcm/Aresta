import Dexie, { type Table } from 'dexie';
import type { IDatabaseAdapter } from './IDatabaseAdapter';
import type {
  LocalBook,
  LocalAnnotation,
  LocalFlashcard,
  LocalCanvasItem,
  LocalStreak,
  LocalMutation,
  LocalNote,
  LocalDrawingNote,
  LocalUserSettings,
  LocalDidacticBooklet,
  LocalLinkItem,
  LocalJournalEntry
} from './types';

class ArestaDexieDB extends Dexie {
  books!: Table<LocalBook, number>;
  annotations!: Table<LocalAnnotation, number>;
  flashcards!: Table<LocalFlashcard, number>;
  canvases!: Table<LocalCanvasItem, string>;
  streaks!: Table<LocalStreak, string>;
  mutation_queue!: Table<LocalMutation, string>;
  notes!: Table<LocalNote, string>;
  drawing_notes!: Table<LocalDrawingNote, string>;
  user_settings!: Table<LocalUserSettings, string>;
  didactic_booklets!: Table<LocalDidacticBooklet, string>;
  links!: Table<LocalLinkItem, string>;
  journals!: Table<LocalJournalEntry, string>;

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
    this.version(2).stores({
      books: 'id, bookId, status, updated_at, deleted_at',
      annotations: 'id, bookId, cfi, createdAt, updated_at, deleted_at',
      flashcards: 'id, bookId, annotationId, nextReviewAt, repetitionLevel, updated_at, deleted_at',
      canvases: 'id, name, updated_at, deleted_at',
      streaks: 'id, updated_at',
      mutation_queue: 'id, entity_type, entity_id, action, client_timestamp, sync_status',
      notes: 'id, updated_at, deleted_at, folder',
      drawing_notes: 'id, updated_at, deleted_at, folder',
      user_settings: 'id, updated_at'
    });
    this.version(3).stores({
      books: 'id, bookId, status, updated_at, deleted_at',
      annotations: 'id, bookId, cfi, createdAt, updated_at, deleted_at',
      flashcards: 'id, bookId, annotationId, nextReviewAt, repetitionLevel, updated_at, deleted_at',
      canvases: 'id, name, updated_at, deleted_at',
      streaks: 'id, updated_at',
      mutation_queue: 'id, entity_type, entity_id, action, client_timestamp, sync_status',
      notes: 'id, updated_at, deleted_at, folder',
      drawing_notes: 'id, updated_at, deleted_at, folder',
      user_settings: 'id, updated_at',
      didactic_booklets: 'id, bookId, themeId, createdAt, updated_at, deleted_at'
    });
    this.version(4).stores({
      books: 'id, bookId, status, updated_at, deleted_at',
      annotations: 'id, bookId, cfi, createdAt, updated_at, deleted_at',
      flashcards: 'id, bookId, annotationId, nextReviewAt, repetitionLevel, updated_at, deleted_at',
      canvases: 'id, name, updated_at, deleted_at',
      streaks: 'id, updated_at',
      mutation_queue: 'id, entity_type, entity_id, action, client_timestamp, sync_status',
      notes: 'id, updated_at, deleted_at, folder',
      drawing_notes: 'id, updated_at, deleted_at, folder',
      user_settings: 'id, updated_at',
      didactic_booklets: 'id, bookId, themeId, createdAt, updated_at, deleted_at',
      links: 'id, url, updated_at, deleted_at, folder'
    });
    this.version(5).stores({
      books: 'id, bookId, status, updated_at, deleted_at',
      annotations: 'id, bookId, cfi, createdAt, updated_at, deleted_at',
      flashcards: 'id, bookId, annotationId, nextReviewAt, repetitionLevel, updated_at, deleted_at',
      canvases: 'id, name, updated_at, deleted_at',
      streaks: 'id, updated_at',
      mutation_queue: 'id, entity_type, entity_id, action, client_timestamp, sync_status',
      notes: 'id, updated_at, deleted_at, folder',
      drawing_notes: 'id, updated_at, deleted_at, folder',
      user_settings: 'id, updated_at',
      didactic_booklets: 'id, bookId, themeId, createdAt, updated_at, deleted_at',
      links: 'id, url, updated_at, deleted_at, folder',
      journals: 'id, date, updated_at, deleted_at'
    });
  }
}

function toCloneable<T>(obj: T): T {
  if (obj === undefined || obj === null) return obj;
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (err) {
    console.warn('[DexieAdapter] Falha ao serializar para clone limpo:', err);
    return obj;
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
      try {
        await this.db.open();
        this.isInitialized = true;
      } catch (err) {
        console.warn('[DexieAdapter] Falha ao abrir IndexedDB aresta_local_db:', err);
        try {
          if (this.db.isOpen()) {
            this.isInitialized = true;
          }
        } catch {}
      }
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

  async getBookRawById(id: number): Promise<LocalBook | null> {
    await this.init();
    return (await this.db.books.get(Number(id))) ?? null;
  }

  async getBooksRaw(): Promise<LocalBook[]> {
    await this.init();
    return await this.db.books.toArray();
  }

  async saveBook(book: LocalBook): Promise<void> {
    await this.init();
    if (!book || book.id === undefined || book.id === null || isNaN(Number(book.id))) {
      console.warn('[DexieAdapter] Tentativa de salvar livro com ID inválido:', book);
      return;
    }
    const cleanId = Number(book.id);
    const existing = await this.db.books.get(cleanId);
    if (existing?.deleted_at && !book.deleted_at) {
      return;
    }
    const cleanBook: LocalBook = {
      ...book,
      id: cleanId,
      bookId: Number(book.bookId || book.id),
    };
    await this.db.books.put(toCloneable(cleanBook));
  }

  async deleteBook(id: number): Promise<void> {
    await this.init();
    const numId = Number(id);
    if (isNaN(numId)) return;
    const now = new Date().toISOString();
    const existing = await this.db.books.get(numId);
    if (existing) {
      existing.deleted_at = now;
      existing.sync_status = 'pending';
      existing.updated_at = now;
      await this.db.books.put(toCloneable(existing));
    }
    const matchingByBookId = await this.db.books.where('bookId').equals(numId).toArray();
    for (const b of matchingByBookId) {
      if (!b.deleted_at) {
        b.deleted_at = now;
        b.sync_status = 'pending';
        b.updated_at = now;
        await this.db.books.put(toCloneable(b));
      }
    }
  }

  async clearBooks(): Promise<void> {
    await this.init();
    await this.db.books.clear();
  }

  // Annotations
  async getAnnotations(filters?: { bookId?: number; themeId?: number }): Promise<LocalAnnotation[]> {
    await this.init();
    let query = this.db.annotations.toCollection();
    let list = await query.toArray();
    list = list.filter((a) => !a.deleted_at);

    if (filters?.bookId !== undefined && filters?.bookId !== null) {
      list = list.filter((a) => Number(a.bookId) === Number(filters.bookId));
    }
    if (filters?.themeId !== undefined && filters?.themeId !== null) {
      list = list.filter((a) => a.themes?.some((t) => Number(t.id) === Number(filters.themeId)));
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAnnotationsRaw(): Promise<LocalAnnotation[]> {
    await this.init();
    return await this.db.annotations.toArray();
  }

  async getAnnotationById(id: number): Promise<LocalAnnotation | null> {
    await this.init();
    const note = await this.db.annotations.get(id);
    return note && !note.deleted_at ? note : null;
  }

  async saveAnnotation(annotation: LocalAnnotation): Promise<void> {
    await this.init();
    await this.db.annotations.put(toCloneable(annotation));
  }

  async deleteAnnotation(id: number): Promise<void> {
    await this.init();
    const existing = await this.db.annotations.get(id);
    if (existing) {
      existing.deleted_at = new Date().toISOString();
      existing.sync_status = 'pending';
      existing.updated_at = new Date().toISOString();
      await this.db.annotations.put(toCloneable(existing));
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

  async getFlashcardsRaw(): Promise<LocalFlashcard[]> {
    await this.init();
    return await this.db.flashcards.toArray();
  }

  async getFlashcardById(id: number): Promise<LocalFlashcard | null> {
    await this.init();
    const card = await this.db.flashcards.get(id);
    return card && !card.deleted_at ? card : null;
  }

  async saveFlashcard(flashcard: LocalFlashcard): Promise<void> {
    await this.init();
    await this.db.flashcards.put(toCloneable(flashcard));
  }

  async deleteFlashcard(id: number): Promise<void> {
    await this.init();
    const existing = await this.db.flashcards.get(id);
    if (existing) {
      existing.deleted_at = new Date().toISOString();
      existing.sync_status = 'pending';
      existing.updated_at = new Date().toISOString();
      await this.db.flashcards.put(toCloneable(existing));
    }
  }

  // Canvas
  async getCanvases(): Promise<LocalCanvasItem[]> {
    await this.init();
    const all = await this.db.canvases.toArray();
    return all.filter((c) => !c.deleted_at).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  async getCanvasesRaw(): Promise<LocalCanvasItem[]> {
    await this.init();
    return await this.db.canvases.toArray();
  }

  async getCanvasById(id: string): Promise<LocalCanvasItem | null> {
    await this.init();
    const canvas = await this.db.canvases.get(id);
    return canvas && !canvas.deleted_at ? canvas : null;
  }

  async saveCanvas(canvas: LocalCanvasItem): Promise<void> {
    await this.init();
    await this.db.canvases.put(toCloneable(canvas));
  }

  async deleteCanvas(id: string): Promise<void> {
    await this.init();
    const existing = await this.db.canvases.get(id);
    if (existing) {
      existing.deleted_at = new Date().toISOString();
      existing.sync_status = 'pending';
      existing.updated_at = new Date().toISOString();
      await this.db.canvases.put(toCloneable(existing));
    }
  }

  async getNotes(): Promise<LocalNote[]> {
    await this.init();
    return (await this.db.notes.toArray()).filter((item) => !item.deleted_at).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }
  async getNotesRaw(): Promise<LocalNote[]> {
    await this.init();
    return await this.db.notes.toArray();
  }
  async getNoteById(id: string): Promise<LocalNote | null> {
    await this.init(); const item = await this.db.notes.get(id); return item && !item.deleted_at ? item : null;
  }
  async saveNote(note: LocalNote): Promise<void> { await this.init(); await this.db.notes.put(toCloneable(note)); }
  async deleteNote(id: string): Promise<void> {
    await this.init(); const item = await this.db.notes.get(id); if (item) await this.db.notes.put(toCloneable({ ...item, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString(), sync_status: 'pending' }));
  }

  async getDrawingNotes(): Promise<LocalDrawingNote[]> {
    await this.init();
    const all = await this.db.drawing_notes.toArray();
    return all.filter((item) => !item.deleted_at).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }
  async getDrawingNotesRaw(): Promise<LocalDrawingNote[]> {
    await this.init();
    return await this.db.drawing_notes.toArray();
  }
  async getDrawingNoteById(id: string): Promise<LocalDrawingNote | null> {
    await this.init(); const item = await this.db.drawing_notes.get(id); return item && !item.deleted_at ? item : null;
  }
  async saveDrawingNote(note: LocalDrawingNote): Promise<void> { await this.init(); await this.db.drawing_notes.put(toCloneable(note)); }
  async deleteDrawingNote(id: string): Promise<void> {
    await this.init(); const item = await this.db.drawing_notes.get(id); if (item) await this.db.drawing_notes.put(toCloneable({ ...item, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString(), sync_status: 'pending' }));
  }
  async getSettings(): Promise<LocalUserSettings | null> { await this.init(); return (await this.db.user_settings.get('user_settings')) || null; }
  async saveSettings(settings: LocalUserSettings): Promise<void> { await this.init(); await this.db.user_settings.put(toCloneable({ ...settings, id: 'user_settings' })); }

  // Reading Streak
  async getStreak(): Promise<LocalStreak | null> {
    await this.init();
    const streak = await this.db.streaks.get('user_streak');
    return streak || null;
  }

  async saveStreak(streak: LocalStreak): Promise<void> {
    await this.init();
    streak.id = 'user_streak';
    await this.db.streaks.put(toCloneable(streak));
  }

  // Mutation Queue
  async getPendingMutations(): Promise<LocalMutation[]> {
    await this.init();
    const all = await this.db.mutation_queue.where('sync_status').equals('pending').toArray();
    return all.sort((a, b) => new Date(a.client_timestamp).getTime() - new Date(b.client_timestamp).getTime());
  }

  async enqueueMutation(mutation: LocalMutation): Promise<void> {
    await this.init();
    await this.db.mutation_queue.put(toCloneable(mutation));
  }

  async markMutationsSynced(ids: string[]): Promise<void> {
    await this.init();
    if (ids.length === 0) return;
    await this.db.mutation_queue.where('id').anyOf(ids).modify({ sync_status: 'synced' });
  }

  async clearPendingMutations(): Promise<void> {
    await this.init();
    await this.db.mutation_queue.clear();
  }

  async clearAll(): Promise<void> {
    await this.init();
    await Promise.allSettled([
      this.db.books.clear(),
      this.db.annotations.clear(),
      this.db.flashcards.clear(),
      this.db.canvases.clear(),
      this.db.streaks.clear(),
      this.db.mutation_queue.clear(),
      this.db.notes.clear(),
      this.db.drawing_notes.clear(),
      this.db.user_settings.clear(),
      this.db.didactic_booklets.clear(),
      this.db.links.clear()
    ]);
  }

  // Didactic Booklets
  async getDidacticBooklets(filters?: { bookId?: number; themeId?: number }): Promise<LocalDidacticBooklet[]> {
    await this.init();
    let list = (await this.db.didactic_booklets.toArray()).filter((b) => !b.deleted_at);
    if (filters?.bookId !== undefined && filters.bookId !== null) {
      list = list.filter((b) => Number(b.bookId) === Number(filters.bookId));
    }
    if (filters?.themeId !== undefined && filters?.themeId !== null) {
      list = list.filter((b) => Number(b.themeId) === Number(filters.themeId));
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getDidacticBookletsRaw(): Promise<LocalDidacticBooklet[]> {
    await this.init();
    return await this.db.didactic_booklets.toArray();
  }

  async getDidacticBookletById(id: string): Promise<LocalDidacticBooklet | null> {
    await this.init();
    const item = await this.db.didactic_booklets.get(id);
    return item && !item.deleted_at ? item : null;
  }

  async saveDidacticBooklet(booklet: LocalDidacticBooklet): Promise<void> {
    await this.init();
    await this.db.didactic_booklets.put(toCloneable(booklet));
  }

  async deleteDidacticBooklet(id: string): Promise<void> {
    await this.init();
    const existing = await this.db.didactic_booklets.get(id);
    if (existing) {
      existing.deleted_at = new Date().toISOString();
      existing.sync_status = 'pending';
      existing.updated_at = new Date().toISOString();
      await this.db.didactic_booklets.put(toCloneable(existing));
    }
  }

  // Links
  async getLinks(): Promise<LocalLinkItem[]> {
    await this.init();
    const all = await this.db.links.toArray();
    return all
      .filter((l) => !l.deleted_at)
      .sort((a, b) => new Date(b.updated_at || b.createdAt || 0).getTime() - new Date(a.updated_at || a.createdAt || 0).getTime());
  }

  async getLinksRaw(): Promise<LocalLinkItem[]> {
    await this.init();
    return await this.db.links.toArray();
  }

  async getLinkById(id: string): Promise<LocalLinkItem | null> {
    await this.init();
    const item = await this.db.links.get(id);
    return item && !item.deleted_at ? item : null;
  }

  async saveLink(link: LocalLinkItem): Promise<void> {
    await this.init();
    await this.db.links.put(toCloneable(link));
  }

  async deleteLink(id: string): Promise<void> {
    await this.init();
    const existing = await this.db.links.get(id);
    if (existing) {
      existing.deleted_at = new Date().toISOString();
      existing.sync_status = 'pending';
      existing.updated_at = new Date().toISOString();
      await this.db.links.put(toCloneable(existing));
    }
  }

  // Journal
  async getJournalEntries(): Promise<LocalJournalEntry[]> {
    await this.init();
    const all = await this.db.journals.toArray();
    return all
      .filter((j) => !j.deleted_at && j.content && j.content.trim().length > 0)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async getJournalEntriesRaw(): Promise<LocalJournalEntry[]> {
    await this.init();
    return await this.db.journals.toArray();
  }

  async getJournalEntryByDate(date: string): Promise<LocalJournalEntry | null> {
    await this.init();
    const item = await this.db.journals.get(date);
    return item && !item.deleted_at ? item : null;
  }

  async saveJournalEntry(entry: LocalJournalEntry): Promise<void> {
    await this.init();
    await this.db.journals.put(toCloneable(entry));
  }

  async deleteJournalEntry(date: string): Promise<void> {
    await this.init();
    const existing = await this.db.journals.get(date);
    if (existing) {
      existing.deleted_at = new Date().toISOString();
      existing.sync_status = 'pending';
      existing.updated_at = new Date().toISOString();
      await this.db.journals.put(toCloneable(existing));
    }
  }
}

