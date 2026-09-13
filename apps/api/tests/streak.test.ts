import { describe, it, expect, vi, beforeEach } from 'vitest'
import { streakService, StreakService } from '../src/modules/auth/services/streak.service'
import { prisma } from '../src/modules/auth/config/database'

describe('StreakService (OR rule: 10 min reading OR 5 flashcards)', () => {
  const mockUser = {
    id: 1,
    current_streak: 2,
    longest_streak: 5,
    streak_freeze_count: 1,
    target_streak_days: 7,
    last_active_date: '2026-09-12',
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('completes streak when flashcards count reaches 5 even with 0 reading seconds', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any)
    const updateActivitySpy = vi.spyOn(prisma.dailyActivity, 'update').mockResolvedValue({} as any)
    const updateUserSpy = vi.spyOn(prisma.user, 'update').mockResolvedValue({
      ...mockUser,
      current_streak: 3,
      longest_streak: 5,
    } as any)

    vi.spyOn(prisma.dailyActivity, 'findUnique').mockResolvedValue({
      user_id: 1,
      date: streakService.getUtcDateString(),
      reading_seconds: 0,
      flashcards_reviewed: 4,
      is_completed: false,
      is_frozen: false,
    } as any)

    vi.spyOn(prisma.dailyActivity, 'upsert').mockResolvedValue({
      user_id: 1,
      date: streakService.getUtcDateString(),
      reading_seconds: 0,
      flashcards_reviewed: 4,
      is_completed: false,
      is_frozen: false,
    } as any)

    vi.spyOn(prisma.dailyActivity, 'findMany').mockResolvedValue([])

    const result = await streakService.recordFlashcardReview(1, 1)

    expect(result.justCompleted).toBe(true)
    expect(updateUserSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({ current_streak: 3 }),
      })
    )
  })

  it('completes streak when reading seconds reach 600 even with 0 flashcards', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any)
    const updateActivitySpy = vi.spyOn(prisma.dailyActivity, 'update').mockResolvedValue({} as any)
    const updateUserSpy = vi.spyOn(prisma.user, 'update').mockResolvedValue({
      ...mockUser,
      current_streak: 3,
      longest_streak: 5,
    } as any)

    vi.spyOn(prisma.dailyActivity, 'findUnique').mockResolvedValue({
      user_id: 1,
      date: streakService.getUtcDateString(),
      reading_seconds: 500,
      flashcards_reviewed: 0,
      is_completed: false,
      is_frozen: false,
    } as any)

    vi.spyOn(prisma.dailyActivity, 'upsert').mockResolvedValue({
      user_id: 1,
      date: streakService.getUtcDateString(),
      reading_seconds: 500,
      flashcards_reviewed: 0,
      is_completed: false,
      is_frozen: false,
    } as any)

    vi.spyOn(prisma.dailyActivity, 'findMany').mockResolvedValue([])

    const result = await streakService.recordReadingTime(1, 100)

    expect(result.justCompleted).toBe(true)
    expect(updateUserSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({ current_streak: 3 }),
      })
    )
  })

  it('reconciles and completes streak in getStreakStatus if already reached 5 cards but uncompleted', async () => {
    vi.spyOn(prisma.user, 'findUnique')
      .mockResolvedValueOnce(mockUser as any)
      .mockResolvedValueOnce(mockUser as any)
      .mockResolvedValueOnce({
        ...mockUser,
        current_streak: 3,
        longest_streak: 5,
      } as any)

    vi.spyOn(prisma.dailyActivity, 'upsert').mockResolvedValue({
      user_id: 1,
      date: streakService.getUtcDateString(),
      reading_seconds: 0,
      flashcards_reviewed: 5,
      is_completed: false,
      is_frozen: false,
    } as any)

    vi.spyOn(prisma.dailyActivity, 'findMany').mockResolvedValue([])
    const updateActivitySpy = vi.spyOn(prisma.dailyActivity, 'update').mockResolvedValue({} as any)
    const updateUserSpy = vi.spyOn(prisma.user, 'update').mockResolvedValue({
      ...mockUser,
      current_streak: 3,
    } as any)

    const status = await streakService.getStreakStatus(1)

    expect(updateActivitySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { is_completed: true },
      })
    )
    expect(status.isGoalReachedToday).toBe(true)
    expect(status.currentStreak).toBe(3)
  })
})
