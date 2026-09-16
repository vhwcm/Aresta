import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userService } from '../src/modules/auth/services/user.service'
import { userController } from '../src/modules/auth/controllers/user.controller'
import { prisma } from '../src/modules/auth/config/database'
import { cacheManager } from '../src/shared/cache/cache.manager'
import { graphService } from '../src/modules/memory/services/graph.service'
import type { Request, Response } from 'express'

describe('User Metrics Service & Controller', () => {
  beforeEach(() => {
    cacheManager.clear()
    vi.restoreAllMocks()
  })

  it('calcula métricas agregadas reais do usuário corretamente', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 10,
      created_at: new Date('2026-08-15T12:00:00Z'),
    } as any)

    vi.spyOn(prisma.userBook, 'count')
      .mockResolvedValueOnce(8) // total books
      .mockResolvedValueOnce(3) // active reading books

    vi.spyOn(prisma.dailyActivity, 'findMany').mockResolvedValue([
      { reading_seconds: 3600 },
      { reading_seconds: 5400 },
    ] as any)

    vi.spyOn(prisma.canvas, 'count').mockResolvedValue(4)

    vi.spyOn(prisma.flashcard, 'findMany').mockResolvedValue([
      { id: 1, review_count: 5, repetition_level: 2 },
      { id: 2, review_count: 3, repetition_level: 3 },
    ] as any)

    vi.spyOn(prisma.dailyDeckCard, 'findMany').mockResolvedValue([
      { rating: 'good' },
      { rating: 'easy' },
      { rating: 'hard' },
    ] as any)

    vi.spyOn(graphService, 'getGraph').mockResolvedValue({
      nodes: new Array(64).fill({ id: 1 }),
      edges: [],
    } as any)

    const metrics = await userService.getMetrics(10)

    expect(metrics.books.total).toBe(8)
    expect(metrics.books.activeReading).toBe(3)
    expect(metrics.readingTime.totalSeconds).toBe(9000)
    expect(metrics.readingTime.totalHoursFormatted).toBe('2.5')
    expect(metrics.readingTime.averageMinutesPerDay).toBe(75) // 9000s / 60 / 2 days = 75 min
    expect(metrics.knowledge.totalNodes).toBe(64)
    expect(metrics.knowledge.canvasCount).toBe(4)
    expect(metrics.memory.retentionRate).toBe(67) // 2 out of 3 = 67%
    expect(metrics.memory.totalFlashcards).toBe(2)
    expect(metrics.memberSince).toBe('2026-08-15T12:00:00.000Z')
  })

  it('retorna valores zerados elegantes para novo usuário sem atividade', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 20,
      created_at: new Date('2026-09-01T00:00:00Z'),
    } as any)

    vi.spyOn(prisma.userBook, 'count').mockResolvedValue(0)
    vi.spyOn(prisma.dailyActivity, 'findMany').mockResolvedValue([])
    vi.spyOn(prisma.canvas, 'count').mockResolvedValue(0)
    vi.spyOn(prisma.flashcard, 'findMany').mockResolvedValue([])
    vi.spyOn(prisma.dailyDeckCard, 'findMany').mockResolvedValue([])
    vi.spyOn(graphService, 'getGraph').mockResolvedValue({ nodes: [], edges: [] } as any)

    const metrics = await userService.getMetrics(20)

    expect(metrics.books.total).toBe(0)
    expect(metrics.books.activeReading).toBe(0)
    expect(metrics.readingTime.totalSeconds).toBe(0)
    expect(metrics.readingTime.totalHoursFormatted).toBe('0.0')
    expect(metrics.readingTime.averageMinutesPerDay).toBe(0)
    expect(metrics.knowledge.totalNodes).toBe(0)
    expect(metrics.knowledge.canvasCount).toBe(0)
    expect(metrics.memory.retentionRate).toBe(100)
    expect(metrics.memory.totalFlashcards).toBe(0)
  })

  it('userController.metrics responde com json contendo as métricas', async () => {
    const mockMetrics = {
      books: { total: 5, activeReading: 2 },
      readingTime: { totalSeconds: 3600, totalHoursFormatted: '1.0', averageMinutesPerDay: 60 },
      knowledge: { totalNodes: 20, canvasCount: 2 },
      memory: { retentionRate: 95, totalFlashcards: 10, reviewedCount: 8 },
      memberSince: '2026-08-01T00:00:00.000Z',
    }

    vi.spyOn(userService, 'getMetrics').mockResolvedValue(mockMetrics)

    const req = {
      user: { userId: 42, email: 'test@aresta.app', role: 'USER' },
    } as unknown as Request

    const jsonMock = vi.fn()
    const res = {
      json: jsonMock,
    } as unknown as Response

    await userController.metrics(req, res)

    expect(userService.getMetrics).toHaveBeenCalledWith(42)
    expect(jsonMock).toHaveBeenCalledWith({ metrics: mockMetrics })
  })
})
