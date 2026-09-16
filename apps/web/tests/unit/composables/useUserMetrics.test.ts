import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUserMetrics } from '../../../app/composables/useUserMetrics'
import * as authComposable from '../../../app/composables/useAuth'
import { ref, computed } from 'vue'

describe('useUserMetrics composable', () => {
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

  it('busca e popula métricas reais a partir da API', async () => {
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

    const mockApiResponse = {
      metrics: {
        books: { total: 12, activeReading: 4 },
        readingTime: { totalSeconds: 153000, totalHoursFormatted: '42.5', averageMinutesPerDay: 35 },
        knowledge: { totalNodes: 64, canvasCount: 4 },
        memory: { retentionRate: 91, totalFlashcards: 25, reviewedCount: 20 },
        memberSince: '2026-08-10T12:00:00.000Z',
      },
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as any)

    const { metrics, fetchMetrics, hasFetched, memberSinceFormatted } = useUserMetrics()

    await fetchMetrics({ force: true })

    expect(hasFetched.value).toBe(true)
    expect(metrics.value.books.total).toBe(12)
    expect(metrics.value.books.activeReading).toBe(4)
    expect(metrics.value.readingTime.totalHoursFormatted).toBe('42.5')
    expect(metrics.value.readingTime.averageMinutesPerDay).toBe(35)
    expect(metrics.value.knowledge.totalNodes).toBe(64)
    expect(metrics.value.knowledge.canvasCount).toBe(4)
    expect(metrics.value.memory.retentionRate).toBe(91)
    expect(memberSinceFormatted.value).toContain('Agosto de 2026')
  })

  it('lida com falha de rede ou resposta HTTP não 200', async () => {
    vi.spyOn(authComposable, 'useAuth').mockReturnValue({
      token: ref('mock_jwt_token'),
      user: computed(() => ({ id: 1 })) as any,
      isLoggedIn: computed(() => true),
      isAdmin: computed(() => false),
    } as any)

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as any)

    const { fetchMetrics, error } = useUserMetrics()
    await fetchMetrics({ force: true })

    expect(error.value).toContain('HTTP 500')
  })
})

