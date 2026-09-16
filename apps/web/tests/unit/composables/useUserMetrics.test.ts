import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUserMetrics } from '../../../app/composables/useUserMetrics'
import * as authComposable from '../../../app/composables/useAuth'
import { bookRepo } from '../../../app/adapters/database/repositories/BookRepository'
import { canvasRepo } from '../../../app/adapters/database/repositories/CanvasRepository'
import { flashcardRepo } from '../../../app/adapters/database/repositories/FlashcardRepository'
import { annotationRepo } from '../../../app/adapters/database/repositories/AnnotationRepository'
import { ref, computed } from 'vue'

describe('useUserMetrics composable (Local-First Architecture)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    const { resetMetrics } = useUserMetrics()
    resetMetrics()
  })

  it('inicializa com métricas zeradas por padrão', () => {
    const { metrics, isLoading, hasFetched, error, memberSinceFormatted } = useUserMetrics()

    expect(metrics.value.books.total).toBe(0)
    expect(metrics.value.books.activeReading).toBe(0)
    expect(metrics.value.readingTime.totalSeconds).toBe(0)
    expect(metrics.value.readingTime.totalHoursFormatted).toBe('0.0')
    expect(metrics.value.readingTime.averageMinutesPerDay).toBe(0)
    expect(metrics.value.knowledge.totalNodes).toBe(0)
    expect(metrics.value.knowledge.canvasCount).toBe(0)
    expect(metrics.value.memory.retentionRate).toBe(100)
    expect(isLoading.value).toBe(false)
    expect(hasFetched.value).toBe(false)
    expect(error.value).toBeNull()
    expect(memberSinceFormatted.value).toBe('Membro do Aresta')
  })

  it('calcula métricas agregadas reais a partir dos repositórios locais', async () => {
    vi.spyOn(authComposable, 'useAuth').mockReturnValue({
      token: ref('mock_jwt_token'),
      user: computed(() => ({
        id: 1,
        name: 'Leitor Teste',
        email: 'teste@aresta.app',
        role: 'USER',
        created_at: '2026-08-10T12:00:00.000Z',
      })) as any,
      isLoggedIn: computed(() => true),
      isAdmin: computed(() => false),
    } as any)

    vi.spyOn(bookRepo, 'getAll').mockResolvedValue([
      { id: 1, bookId: 1, title: 'B1', status: 'LENDO', currentPage: 10, updated_at: '', sync_status: 'synced' },
      { id: 2, bookId: 2, title: 'B2', status: 'LIDO', currentPage: 100, updated_at: '', sync_status: 'synced' },
    ])

    vi.spyOn(canvasRepo, 'getAll').mockResolvedValue([
      { id: 'c1', name: 'Canvas 1', nodeCount: 5, document: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }, updated_at: '', sync_status: 'synced' },
    ])

    vi.spyOn(flashcardRepo, 'getAll').mockResolvedValue([
      { id: 1, question: 'Q1', answer: 'A1', repetitionLevel: 1, nextReviewAt: '', cardType: 'basic', isReviewed: true, updated_at: '', sync_status: 'synced' },
      { id: 2, question: 'Q2', answer: 'A2', repetitionLevel: 1, nextReviewAt: '', cardType: 'basic', isReviewed: false, updated_at: '', sync_status: 'synced' },
    ])

    vi.spyOn(annotationRepo, 'getAll').mockResolvedValue([
      { id: 1, bookId: 1, cfi: 'cfi1', createdAt: '', updated_at: '', sync_status: 'synced' },
    ])

    const { metrics, fetchMetrics, hasFetched, memberSinceFormatted } = useUserMetrics()

    await fetchMetrics({ force: true })

    expect(hasFetched.value).toBe(true)
    expect(metrics.value.books.total).toBe(2)
    expect(metrics.value.books.activeReading).toBe(2)
    expect(metrics.value.knowledge.canvasCount).toBe(1)
    expect(metrics.value.memory.totalFlashcards).toBe(2)
    expect(metrics.value.memory.reviewedCount).toBe(1)
    expect(metrics.value.memory.retentionRate).toBe(50)
    expect(memberSinceFormatted.value).toContain('Agosto de 2026')
  })
})
