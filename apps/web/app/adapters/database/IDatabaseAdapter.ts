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
  LocalLinkItem
} from './types';

export interface IDatabaseAdapter {
  init(): Promise<void>;
  
  // Books
  getBooks(): Promise<LocalBook[]>;
  getBookById(id: number): Promise<LocalBook | null>;
  /** Retorna o livro pelo ID sem filtrar por deleted_at (uso interno do BookRepository). */
  getBookRawById?(id: number): Promise<LocalBook | null>;
  /** Retorna todos os livros sem filtrar por deleted_at (para sync e checagem de exclusão). */
  getBooksRaw?(): Promise<LocalBook[]>;
  saveBook(book: LocalBook): Promise<void>;
  deleteBook(id: number): Promise<void>;
  clearBooks(): Promise<void>;

  // Annotations
  getAnnotations(filters?: { bookId?: number; themeId?: number }): Promise<LocalAnnotation[]>;
  getAnnotationById(id: number): Promise<LocalAnnotation | null>;
  /** Retorna todas as anotações sem filtrar por deleted_at (para sync). */
  getAnnotationsRaw?(): Promise<LocalAnnotation[]>;
  saveAnnotation(annotation: LocalAnnotation): Promise<void>;
  deleteAnnotation(id: number): Promise<void>;

  // Flashcards
  getFlashcards(filters?: { dateStr?: string; onlyDue?: boolean }): Promise<LocalFlashcard[]>;
  getFlashcardById(id: number): Promise<LocalFlashcard | null>;
  /** Retorna todos os flashcards sem filtrar por deleted_at (para sync). */
  getFlashcardsRaw?(): Promise<LocalFlashcard[]>;
  saveFlashcard(flashcard: LocalFlashcard): Promise<void>;
  deleteFlashcard(id: number): Promise<void>;

  // Canvas
  getCanvases(): Promise<LocalCanvasItem[]>;
  getCanvasById(id: string): Promise<LocalCanvasItem | null>;
  /** Retorna todos os quadros sem filtrar por deleted_at (para sync). */
  getCanvasesRaw?(): Promise<LocalCanvasItem[]>;
  saveCanvas(canvas: LocalCanvasItem): Promise<void>;
  deleteCanvas(id: string): Promise<void>;

  // Notes
  getNotes(): Promise<LocalNote[]>;
  getNoteById(id: string): Promise<LocalNote | null>;
  /** Retorna todas as notas sem filtrar por deleted_at (para sync). */
  getNotesRaw?(): Promise<LocalNote[]>;
  saveNote(note: LocalNote): Promise<void>;
  deleteNote(id: string): Promise<void>;

  // Drawing notes
  getDrawingNotes(): Promise<LocalDrawingNote[]>;
  getDrawingNoteById(id: string): Promise<LocalDrawingNote | null>;
  /** Retorna todas as notas de desenho sem filtrar por deleted_at (para sync). */
  getDrawingNotesRaw?(): Promise<LocalDrawingNote[]>;
  saveDrawingNote(note: LocalDrawingNote): Promise<void>;
  deleteDrawingNote(id: string): Promise<void>;

  // Settings
  getSettings(): Promise<LocalUserSettings | null>;
  saveSettings(settings: LocalUserSettings): Promise<void>;

  // Reading Streak
  getStreak(): Promise<LocalStreak | null>;
  saveStreak(streak: LocalStreak): Promise<void>;

  // Mutation Queue
  getPendingMutations(): Promise<LocalMutation[]>;
  enqueueMutation(mutation: LocalMutation): Promise<void>;
  markMutationsSynced(ids: string[]): Promise<void>;
  clearPendingMutations(): Promise<void>;

  // Didactic Booklets (Local First)
  getDidacticBooklets(filters?: { bookId?: number; themeId?: number }): Promise<LocalDidacticBooklet[]>;
  getDidacticBookletById(id: string): Promise<LocalDidacticBooklet | null>;
  /** Retorna todos os livretos sem filtrar por deleted_at (para sync). */
  getDidacticBookletsRaw?(): Promise<LocalDidacticBooklet[]>;
  saveDidacticBooklet(booklet: LocalDidacticBooklet): Promise<void>;
  deleteDidacticBooklet(id: string): Promise<void>;

  // Links (Nós de Links)
  getLinks(): Promise<LocalLinkItem[]>;
  getLinkById(id: string): Promise<LocalLinkItem | null>;
  /** Retorna todos os links sem filtrar por deleted_at (para sync). */
  getLinksRaw?(): Promise<LocalLinkItem[]>;
  saveLink(link: LocalLinkItem): Promise<void>;
  deleteLink(id: string): Promise<void>;

  // Session Purge
  clearAll?(): Promise<void>;
}
