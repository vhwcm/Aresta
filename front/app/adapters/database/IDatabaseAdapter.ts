import type {
  LocalBook,
  LocalAnnotation,
  LocalFlashcard,
  LocalCanvasItem,
  LocalStreak,
  LocalMutation
} from './types';

export interface IDatabaseAdapter {
  init(): Promise<void>;
  
  // Books
  getBooks(): Promise<LocalBook[]>;
  getBookById(id: number): Promise<LocalBook | null>;
  saveBook(book: LocalBook): Promise<void>;
  deleteBook(id: number): Promise<void>;

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

  // Reading Streak
  getStreak(): Promise<LocalStreak | null>;
  saveStreak(streak: LocalStreak): Promise<void>;

  // Mutation Queue
  getPendingMutations(): Promise<LocalMutation[]>;
  enqueueMutation(mutation: LocalMutation): Promise<void>;
  markMutationsSynced(ids: string[]): Promise<void>;
  clearPendingMutations(): Promise<void>;
}
