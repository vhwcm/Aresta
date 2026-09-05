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
  author?: string;
  coverPath?: string;
  filePath?: string;
  status: string;
  currentPage: number;
  lastAccessedAt?: string;
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
  entity_type: 'book' | 'annotation' | 'flashcard' | 'canvas' | 'streak';
  entity_id: string | number;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  client_timestamp: string;
  sync_status: SyncStatus;
  retry_count: number;
}
