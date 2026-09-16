import { prisma } from '../config/database'
import { cacheManager } from '../../../shared/cache/cache.manager'

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
      select: { id: true, name: true, email: true, role: true, is_active: true, created_at: true },
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
        created_at: true,
      },
    })
  }

  async getMetrics(userId: number): Promise<UserMetricsResult> {
    const cacheKey = `user:${userId}:metrics`
    const cached = cacheManager.get<UserMetricsResult>(cacheKey)
    if (cached) {
      return cached
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { created_at: true },
    })

    const result: UserMetricsResult = {
      books: {
        total: 0,
        activeReading: 0,
      },
      readingTime: {
        totalSeconds: 0,
        totalHoursFormatted: '0.0',
        averageMinutesPerDay: 0,
      },
      knowledge: {
        totalNodes: 0,
        canvasCount: 0,
      },
      memory: {
        retentionRate: 100,
        totalFlashcards: 0,
        reviewedCount: 0,
      },
      memberSince: user?.created_at ? user.created_at.toISOString() : new Date().toISOString(),
    }

    cacheManager.set(cacheKey, result, 300, [`user:${userId}:metrics`, `user:${userId}`])
    return result
  }
}

export const userService = new UserService()
