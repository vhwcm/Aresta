import { getDatabase, dbManager } from '../DatabaseManager';
import type { LocalStreak } from '../types';

export class StreakRepository {
  private db = getDatabase();

  async get(): Promise<LocalStreak | null> {
    return this.db.getStreak();
  }

  async save(streak: Partial<LocalStreak>): Promise<LocalStreak> {
    const existing = await this.db.getStreak();
    const now = new Date().toISOString();
    const entity: LocalStreak = {
      id: 'user_streak',
      currentStreak: streak.currentStreak ?? existing?.currentStreak ?? 0,
      longestStreak: streak.longestStreak ?? existing?.longestStreak ?? 0,
      streakFreezeCount: streak.streakFreezeCount ?? existing?.streakFreezeCount ?? 0,
      targetStreakDays: streak.targetStreakDays ?? existing?.targetStreakDays ?? 7,
      isGoalReachedToday: streak.isGoalReachedToday ?? existing?.isGoalReachedToday ?? false,
      todayActivity: streak.todayActivity || existing?.todayActivity || {
        date: now.split('T')[0] ?? '',
        readingSeconds: 0,
        readingMinutes: 0,
        requiredReadingSeconds: 600,
        flashcardsReviewed: 0,
        requiredFlashcards: 5,
        isReadingCompleted: false,
        isFlashcardsCompleted: false,
        isCompleted: false,
        isFrozen: false
      },
      weeklyActivity: streak.weeklyActivity || existing?.weeklyActivity || [],
      updated_at: now,
      deleted_at: null,
      sync_status: 'pending'
    };
    await this.db.saveStreak(entity);
    await dbManager.recordMutation('streak', entity.id, 'UPDATE', entity);
    return entity;
  }
}

export const streakRepo = new StreakRepository();
