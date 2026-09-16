export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface BaseLocalEntity {
  id: string | number;
  updated_at: string; // ISO UTC
  deleted_at?: string | null;
  sync_status: SyncStatus;
}

export interface LocalBook extends BaseLocalEntity {
  id: number;
  bookId: number;
  title: string;
  author?: string | null;
  coverPath?: string | null;
  filePath?: string | null;
  status: string;
  currentPage: number;
  lastAccessedAt?: string | null;
  themes?: Array<{ id: number; name: string; color?: string | null }>;
}

export interface LocalAnnotation extends BaseLocalEntity {
  id: number;
  userId?: number;
  bookId: number;
  bookTitle?: string;
  bookCover?: string;
  cfi: string;
  selectedText?: string | null;
  note?: string | null;
  chapterTitle?: string | null;
  progress?: number | null;
  color?: string | null;
  themes?: Array<{ id: number; name: string; color?: string | null }>;
  createdAt: string;
}

export interface LocalFlashcard extends BaseLocalEntity {
  id: number;
  userId?: number;
  annotationId?: number | null;
  bookId?: number | null;
  bookTitle?: string;
  bookCover?: string | null;
  chapterTitle?: string | null;
  selectedText?: string | null;
  note?: string | null;
  cardType: string;
  question: string;
  answer: string;
  contextSummary?: string | null;
  repetitionLevel: number;
  nextReviewAt: string;
  lastReviewedAt?: string | null;
  reviewCount?: number;
  difficulty?: number;
  isReviewed?: boolean;
  rating?: 'hard' | 'good' | 'easy' | null;
  sourceType?: 'book_annotation' | 'canvas_note';
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  noteId?: string | null;
}

export interface LocalCanvasItem extends BaseLocalEntity {
  id: string; // uuid
  name: string;
  description?: string | null;
  document: {
    nodes: any[];
    edges: any[];
    viewport: { x: number; y: number; zoom: number };
  };
  nodeCount?: number;
  edgeCount?: number;
}

export interface LocalNote extends BaseLocalEntity {
  id: string;
  title: string;
  content: string;
  folder?: string | null;
  tags?: string[];
  links?: Array<{ targetType: 'CANVAS' | 'BOOK' | 'NOTE'; targetId: string }>;
  createdAt?: string;
  created_at?: string;
}

export interface LocalDrawingNote extends BaseLocalEntity {
  id: string;
  title: string;
  folder?: string | null;
  tags?: string[];
  pagesData?: unknown;
  pages_data?: unknown;
  previewUrl?: string | null;
  preview_url?: string | null;
  createdAt?: string;
  created_at?: string;
}

export interface LocalUserSettings extends BaseLocalEntity {
  id: 'user_settings';
  pageAnimationEnabled?: boolean;
  pageCreaseEnabled?: boolean;
  language?: string;
  nativeLanguage?: string;
  targetTranslationLanguage?: string;
  epubFontSize?: number;
  epubFontFamily?: string;
  themeMode?: string;
  readerTheme?: string;
  desktopHomeGraphOpen?: boolean;
  desktopReaderGraphOpen?: boolean;
  readerTwoPageMode?: boolean;
  readerWidthMode?: string;
  values?: Record<string, unknown>;
}

export interface LocalStreak extends BaseLocalEntity {
  id: string; // ex: 'user_streak'
  currentStreak: number;
  longestStreak: number;
  streakFreezeCount: number;
  targetStreakDays: number;
  isGoalReachedToday: boolean;
  todayActivity: {
    date: string;
    readingSeconds: number;
    readingMinutes: number;
    requiredReadingSeconds: number;
    flashcardsReviewed: number;
    requiredFlashcards: number;
    isReadingCompleted: boolean;
    isFlashcardsCompleted: boolean;
    isCompleted: boolean;
    isFrozen: boolean;
  };
  weeklyActivity: Array<{
    date: string;
    dayLabel: string;
    readingSeconds: number;
    readingMinutes: number;
    flashcardsReviewed: number;
    completed: boolean;
    frozen: boolean;
  }>;
}

export interface LocalMutation {
  id: string; // UUID v4
  entity_type: 'book' | 'annotation' | 'flashcard' | 'canvas' | 'streak' | 'note' | 'drawing_note' | 'settings';
  entity_id: string | number;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  client_timestamp: string;
  sync_status: SyncStatus;
  retry_count: number;
}
