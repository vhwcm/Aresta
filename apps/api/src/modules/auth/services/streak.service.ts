export class StreakService {
  async getStreakStatus(_userId: number) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      streakFreezeCount: 0,
      targetStreakDays: 7,
      isGoalReachedToday: false,
      today: {
        date: new Date().toISOString().split('T')[0]!,
        readingSeconds: 0,
        readingMinutes: 0,
        requiredReadingSeconds: 600,
        flashcardsReviewed: 0,
        requiredFlashcards: 5,
        isReadingCompleted: false,
        isFlashcardsCompleted: false,
        isCompleted: false,
        isFrozen: false,
      },
      weeklyActivity: [],
    }
  }

  async getStreak(_userId: number) {
    return this.getStreakStatus(_userId)
  }

  async recordReadingTime(_userId: number, _seconds: number) {
    return { status: await this.getStreakStatus(_userId), justCompleted: false }
  }

  async recordFlashcardReview(_userId: number, _count: number) {
    return { status: await this.getStreakStatus(_userId), justCompleted: false }
  }

  async updateStreakTarget(_userId: number, targetDays: number) {
    return { targetStreakDays: targetDays }
  }

  async updateTargetStreakDays(_userId: number, targetDays: number) {
    return this.updateStreakTarget(_userId, targetDays)
  }
}

export const streakService = new StreakService()
