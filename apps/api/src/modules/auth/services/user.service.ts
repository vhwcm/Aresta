import { prisma } from '../config/database'
import { cacheManager } from '../../../shared/cache/cache.manager'
import { graphService } from '../../memory/services/graph.service'

export interface UserMetricsResult {
  books: {
    total: number
    activeReading: number
  }
  readingTime: {
    totalSeconds: number
    totalHoursFormatted: string
    averageMinutesPerDay: number
  }
  knowledge: {
    totalNodes: number
    canvasCount: number
  }
  memory: {
    retentionRate: number
    totalFlashcards: number
    reviewedCount: number
  }
  memberSince: string
}

export class UserService {
  async findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, is_active: true,
        current_streak: true, longest_streak: true, created_at: true,
        userSettings: true },
    })
  }

  async findAll() {
    return prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, is_active: true, created_at: true },
    })
  }

  async updateProfile(id: number, data: { name?: string }) {
    return prisma.user.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        current_streak: true,
        longest_streak: true,
        target_streak_days: true,
        created_at: true,
        userSettings: true,
      },
    })
  }

  async getMetrics(userId: number): Promise<UserMetricsResult> {
    const cacheKey = `user:${userId}:metrics`
    const cached = cacheManager.get<UserMetricsResult>(cacheKey)
    if (cached) {
      return cached
    }

    const [
      user,
      totalBooks,
      activeReadingBooks,
      dailyActivities,
      canvasCount,
      flashcards,
      reviewedDailyCards,
      graphData,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { created_at: true },
      }),
      prisma.userBook.count({
        where: { user_id: userId },
      }),
      prisma.userBook.count({
        where: { user_id: userId, status: 'LENDO' },
      }),
      prisma.dailyActivity.findMany({
        where: { user_id: userId },
        select: { reading_seconds: true },
      }),
      prisma.canvas.count({
        where: { user_id: userId },
      }),
      prisma.flashcard.findMany({
        where: { user_id: userId },
        select: { id: true, review_count: true, repetition_level: true },
      }),
      prisma.dailyDeckCard.findMany({
        where: { user_id: userId, is_reviewed: true },
        select: { rating: true },
      }),
      graphService.getGraph(userId).catch(() => ({ nodes: [], edges: [] })),
    ])

    // 1. Tempo de Leitura
    const totalReadingSeconds = dailyActivities.reduce(
      (sum, act) => sum + (act.reading_seconds || 0),
      0
    )
    const totalHoursNum = totalReadingSeconds / 3600
    const totalHoursFormatted = totalHoursNum.toFixed(1)
    const activeDaysCount = dailyActivities.filter(
      (act) => (act.reading_seconds || 0) > 0
    ).length
    const averageMinutesPerDay =
      activeDaysCount > 0
        ? Math.round(totalReadingSeconds / 60 / activeDaysCount)
        : 0

    // 2. Conhecimento & Grafo
    const totalNodes = graphData?.nodes?.length || 0

    // 3. Retenção de Memória (SM-2)
    let retentionRate = 100
    const totalReviewedDaily = reviewedDailyCards.length

    if (totalReviewedDaily > 0) {
      const successfulReviews = reviewedDailyCards.filter(
        (c) => c.rating === 'good' || c.rating === 'easy'
      ).length
      retentionRate = Math.round((successfulReviews / totalReviewedDaily) * 100)
    } else if (flashcards.length > 0) {
      const totalReviews = flashcards.reduce((sum, f) => sum + f.review_count, 0)
      if (totalReviews > 0) {
        const mastered = flashcards.filter((f) => f.repetition_level >= 2).length
        retentionRate = Math.min(
          100,
          Math.max(0, Math.round((mastered / flashcards.length) * 100))
        )
      }
    }

    const result: UserMetricsResult = {
      books: {
        total: totalBooks,
        activeReading: activeReadingBooks,
      },
      readingTime: {
        totalSeconds: totalReadingSeconds,
        totalHoursFormatted,
        averageMinutesPerDay,
      },
      knowledge: {
        totalNodes,
        canvasCount,
      },
      memory: {
        retentionRate,
        totalFlashcards: flashcards.length,
        reviewedCount: totalReviewedDaily,
      },
      memberSince: user?.created_at ? user.created_at.toISOString() : new Date().toISOString(),
    }

    cacheManager.set(cacheKey, result, 300, [`user:${userId}:metrics`, `user:${userId}`])
    return result
  }
}

export const userService = new UserService()
