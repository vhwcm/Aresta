import { prisma } from '../config/prisma.js';

export interface DailyActivityDTO {
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
}

export interface StreakStatusDTO {
  currentStreak: number;
  longestStreak: number;
  streakFreezeCount: number;
  targetStreakDays: number;
  isGoalReachedToday: boolean;
  today: DailyActivityDTO;
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

export class StreakService {
  public static readonly REQUIRED_READING_SECONDS = 600; // 10 minutos
  public static readonly REQUIRED_FLASHCARDS = 5; // 5 flashcards

  public getUtcDateString(d = new Date()): string {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public getDayLabel(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    const days = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    return days[date.getUTCDay()];
  }

  public getDiffInDays(dateStrA: string, dateStrB: string): number {
    const [y1, m1, d1] = dateStrA.split('-').map(Number);
    const [y2, m2, d2] = dateStrB.split('-').map(Number);
    const dateA = Date.UTC(y1, m1 - 1, d1);
    const dateB = Date.UTC(y2, m2 - 1, d2);
    const diffMs = dateB - dateA;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  public addDaysToUtcDateString(dateStr: string, daysToAdd: number): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + daysToAdd));
    return this.getUtcDateString(date);
  }

  public async getStreakStatus(userId: number): Promise<StreakStatusDTO> {
    const todayStr = this.getUtcDateString();
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    let currentStreak = user.current_streak;
    let longestStreak = user.longest_streak;
    let streakFreezeCount = user.streak_freeze_count;
    let targetStreakDays = user.target_streak_days || 7;
    let lastActiveDate = user.last_active_date;

    // Checar continuidade e consumo de congelamento se mudou de dia
    if (lastActiveDate && lastActiveDate !== todayStr) {
      const daysDiff = this.getDiffInDays(lastActiveDate, todayStr);

      if (daysDiff > 1) {
        const missedDays = daysDiff - 1;

        if (missedDays <= streakFreezeCount) {
          // Consumir congelamentos para cobrir os dias perdidos
          for (let i = 1; i <= missedDays; i++) {
            const missedDateStr = this.addDaysToUtcDateString(lastActiveDate, i);
            await prisma.dailyActivity.upsert({
              where: {
                user_id_date: {
                  user_id: userId,
                  date: missedDateStr
                }
              },
              create: {
                user_id: userId,
                date: missedDateStr,
                is_frozen: true,
                is_completed: false
              },
              update: {
                is_frozen: true
              }
            });
          }
          streakFreezeCount -= missedDays;
          lastActiveDate = this.addDaysToUtcDateString(lastActiveDate, missedDays);

          user = await prisma.user.update({
            where: { id: userId },
            data: {
              streak_freeze_count: streakFreezeCount,
              last_active_date: lastActiveDate
            }
          });
        } else {
          // Perdeu mais dias do que congelamentos disponíveis -> reseta streak
          currentStreak = 0;
          user = await prisma.user.update({
            where: { id: userId },
            data: {
              current_streak: 0,
              last_active_date: lastActiveDate
            }
          });
        }
      }
    }

    // Buscar ou criar atividade de hoje
    const todayActivity = await prisma.dailyActivity.upsert({
      where: {
        user_id_date: {
          user_id: userId,
          date: todayStr
        }
      },
      create: {
        user_id: userId,
        date: todayStr,
        reading_seconds: 0,
        flashcards_reviewed: 0,
        is_completed: false,
        is_frozen: false
      },
      update: {}
    });

    // Buscar histórico dos últimos 7 dias (incluindo hoje)
    const last7DaysList: string[] = [];
    for (let i = 6; i >= 0; i--) {
      last7DaysList.push(this.addDaysToUtcDateString(todayStr, -i));
    }

    const pastActivities = await prisma.dailyActivity.findMany({
      where: {
        user_id: userId,
        date: { in: last7DaysList }
      }
    });

    const activityMap = new Map(pastActivities.map((a) => [a.date, a]));

    const weeklyActivity = last7DaysList.map((dateStr) => {
      const act = activityMap.get(dateStr);
      return {
        date: dateStr,
        dayLabel: this.getDayLabel(dateStr),
        readingSeconds: act?.reading_seconds || 0,
        readingMinutes: Math.floor((act?.reading_seconds || 0) / 60),
        flashcardsReviewed: act?.flashcards_reviewed || 0,
        completed: act?.is_completed || false,
        frozen: act?.is_frozen || false
      };
    });

    const isReadingCompleted = todayActivity.reading_seconds >= StreakService.REQUIRED_READING_SECONDS;
    const isFlashcardsCompleted = todayActivity.flashcards_reviewed >= StreakService.REQUIRED_FLASHCARDS;

    return {
      currentStreak,
      longestStreak,
      streakFreezeCount,
      targetStreakDays,
      isGoalReachedToday: todayActivity.is_completed,
      today: {
        date: todayActivity.date,
        readingSeconds: todayActivity.reading_seconds,
        readingMinutes: Math.floor(todayActivity.reading_seconds / 60),
        requiredReadingSeconds: StreakService.REQUIRED_READING_SECONDS,
        flashcardsReviewed: todayActivity.flashcards_reviewed,
        requiredFlashcards: StreakService.REQUIRED_FLASHCARDS,
        isReadingCompleted,
        isFlashcardsCompleted,
        isCompleted: todayActivity.is_completed,
        isFrozen: todayActivity.is_frozen
      },
      weeklyActivity
    };
  }

  public async recordReadingTime(userId: number, seconds: number): Promise<{ status: StreakStatusDTO; justCompleted: boolean }> {
    // Garante que o status e eventuais congelamentos foram avaliados
    await this.getStreakStatus(userId);

    const todayStr = this.getUtcDateString();
    const currentActivity = await prisma.dailyActivity.findUnique({
      where: {
        user_id_date: {
          user_id: userId,
          date: todayStr
        }
      }
    });

    const newReadingSeconds = (currentActivity?.reading_seconds || 0) + seconds;
    const flashcardsCount = currentActivity?.flashcards_reviewed || 0;
    const wasCompleted = currentActivity?.is_completed || false;
    const isNowCompleted =
      newReadingSeconds >= StreakService.REQUIRED_READING_SECONDS &&
      flashcardsCount >= StreakService.REQUIRED_FLASHCARDS;

    const justCompleted = !wasCompleted && isNowCompleted;

    await prisma.dailyActivity.update({
      where: {
        user_id_date: {
          user_id: userId,
          date: todayStr
        }
      },
      data: {
        reading_seconds: newReadingSeconds,
        is_completed: wasCompleted || isNowCompleted
      }
    });

    if (justCompleted) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const newStreak = (user?.current_streak || 0) + 1;
      const newLongest = Math.max(user?.longest_streak || 0, newStreak);
      let freezeCount = user?.streak_freeze_count || 0;

      // Ganha +1 congelamento a cada 7 dias de ofensiva completados (máximo 2)
      if (newStreak % 7 === 0 && freezeCount < 2) {
        freezeCount = Math.min(2, freezeCount + 1);
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          current_streak: newStreak,
          longest_streak: newLongest,
          streak_freeze_count: freezeCount,
          last_active_date: todayStr
        }
      });
    }

    const updatedStatus = await this.getStreakStatus(userId);
    return { status: updatedStatus, justCompleted };
  }

  public async recordFlashcardReview(userId: number, count = 1): Promise<{ status: StreakStatusDTO; justCompleted: boolean }> {
    await this.getStreakStatus(userId);

    const todayStr = this.getUtcDateString();
    const currentActivity = await prisma.dailyActivity.findUnique({
      where: {
        user_id_date: {
          user_id: userId,
          date: todayStr
        }
      }
    });

    const readingSecs = currentActivity?.reading_seconds || 0;
    const newFlashcardsCount = (currentActivity?.flashcards_reviewed || 0) + count;
    const wasCompleted = currentActivity?.is_completed || false;
    const isNowCompleted =
      readingSecs >= StreakService.REQUIRED_READING_SECONDS &&
      newFlashcardsCount >= StreakService.REQUIRED_FLASHCARDS;

    const justCompleted = !wasCompleted && isNowCompleted;

    await prisma.dailyActivity.update({
      where: {
        user_id_date: {
          user_id: userId,
          date: todayStr
        }
      },
      data: {
        flashcards_reviewed: newFlashcardsCount,
        is_completed: wasCompleted || isNowCompleted
      }
    });

    if (justCompleted) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const newStreak = (user?.current_streak || 0) + 1;
      const newLongest = Math.max(user?.longest_streak || 0, newStreak);
      let freezeCount = user?.streak_freeze_count || 0;

      if (newStreak % 7 === 0 && freezeCount < 2) {
        freezeCount = Math.min(2, freezeCount + 1);
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          current_streak: newStreak,
          longest_streak: newLongest,
          streak_freeze_count: freezeCount,
          last_active_date: todayStr
        }
      });
    }

    const updatedStatus = await this.getStreakStatus(userId);
    return { status: updatedStatus, justCompleted };
  }

  public async updateStreakTarget(userId: number, targetDays: number): Promise<{ targetStreakDays: number }> {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        target_streak_days: targetDays
      }
    });

    return { targetStreakDays: updated.target_streak_days };
  }
}
