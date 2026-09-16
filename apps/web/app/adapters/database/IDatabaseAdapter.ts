import type {
  LocalBook,
  LocalAnnotation,
  LocalFlashcard,
  LocalCanvasItem,
  LocalStreak,
  LocalMutation,
  LocalNote,
  LocalDrawingNote,
  LocalUserSettings
} from './types';

export interface IDatabaseAdapter {
  init(): Promise<void>;
  
  // Books
  getBooks(): Promise<LocalBook[]>;
  getBookById(id: number): Promise<LocalBook | null>;
  /** Retorna o livro pelo ID sem filtrar por deleted_at (uso interno do BookRepository). */
  getBookRawById?(id: number): Promise<LocalBook | null>;
  saveBook(book: LocalBook): Promise<void>;
  deleteBook(id: number): Promise<void>;
  clearBooks(): Promise<void>;

  // Annotations
  getAnnotations(filters?: { bookId?: number; themeId?: number }): Promise<LocalAnnotation[]>;
  getAnnotationById(id: number): Promise<LocalAnnotation | null>;
  saveAnnotation(annotation: LocalAnnotation): Promise<void>;
  deleteAnnotation(id: number): Promise<void>;

  // Flashcards
  getFlashcards(filters?: { dateStr?: string; onlyDue?: boolean }): Promise<LocalFlashcard[]>;
  getFlashcardById(id: number): Promise<LocalFlashcard | null>;
  saveFlashcard(flashcard: LocalFlashcard): Promise<void>;
  deleteFlashcard(id: number): Promise<void>;

  // Canvas
  getCanvases(): Promise<LocalCanvasItem[]>;
  getCanvasById(id: string): Promise<LocalCanvasItem | null>;
  saveCanvas(canvas: LocalCanvasItem): Promise<void>;
  deleteCanvas(id: string): Promise<void>;

  // Notes
  getNotes(): Promise<LocalNote[]>;
  getNoteById(id: string): Promise<LocalNote | null>;
  saveNote(note: LocalNote): Promise<void>;
  deleteNote(id: string): Promise<void>;

  // Drawing notes
  getDrawingNotes(): Promise<LocalDrawingNote[]>;
  getDrawingNoteById(id: string): Promise<LocalDrawingNote | null>;
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

  // Session Purge
  clearAll?(): Promise<void>;
}
