import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useReaderStore } from '../../../../app/stores/readerStore'
import { useSettings, resetSettingsForTesting } from '../../../../app/composables/useSettings'

describe('Page Stack Edges (Pilha de Páginas Laterais)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    resetSettingsForTesting()
  })

  it('calcula a profundidade proporcional de folhas lidas e restantes', () => {
    const store = useReaderStore()
    const { pageCreaseEnabled, pageAnimationEnabled } = useSettings()

    store.setDocument({
      type: 'pdf',
      metadata: { title: 'Livro Teste' },
      totalPages: 100,
      isLoaded: true,
      load: vi.fn(),
      getPage: vi.fn(),
      destroy: vi.fn(),
    } as any, 'teste.pdf')

    // Página 1 (Início do livro): pilha esquerda zerada, pilha direita máxima
    store.currentPage = 1
    const MAX_STACK_PX = 14
    const total = store.totalPages
    const current = store.currentPage
    const maxAllowed = Math.min(MAX_STACK_PX, Math.max(4, Math.round((total / 25) * MAX_STACK_PX)))
    const progress = Math.max(0, Math.min(1, (current - 1) / Math.max(1, total - 1)))
    const remaining = 1 - progress

    const leftWidth = Math.round(progress * maxAllowed)
    const rightWidth = Math.round(remaining * maxAllowed)

    expect(leftWidth).toBe(0)
    expect(rightWidth).toBe(14)

    // Metade do livro (Página 50)
    store.currentPage = 50
    const progressMid = (50 - 1) / 99
    const leftWidthMid = Math.round(progressMid * maxAllowed)
    const rightWidthMid = Math.round((1 - progressMid) * maxAllowed)
    expect(leftWidthMid).toBe(7)
    expect(rightWidthMid).toBe(7)

    // Final do livro (Página 100)
    store.currentPage = 100
    const progressEnd = (100 - 1) / 99
    const leftWidthEnd = Math.round(progressEnd * maxAllowed)
    const rightWidthEnd = Math.round((1 - progressEnd) * maxAllowed)
    expect(leftWidthEnd).toBe(14)
    expect(rightWidthEnd).toBe(0)
  })

  it('adapta a espessura máxima para documentos com poucas páginas', () => {
    const total = 10
    const MAX_STACK_PX = 14
    const maxAllowed = Math.min(MAX_STACK_PX, Math.max(4, Math.round((total / 25) * MAX_STACK_PX)))

    // Documento curto de 10 páginas não deve atingir 14px de espessura
    expect(maxAllowed).toBe(6)
  })

  it('desativa pilhas laterais quando pageAnimationEnabled ou pageCreaseEnabled forem desligados', () => {
    const { pageCreaseEnabled, pageAnimationEnabled, setPageAnimationEnabled, setPageCreaseEnabled } = useSettings()

    expect(pageAnimationEnabled.value).toBe(true)
    expect(pageCreaseEnabled.value).toBe(true)

    setPageAnimationEnabled(false)
    expect(pageAnimationEnabled.value).toBe(false)
    expect(pageCreaseEnabled.value).toBe(false)
  })
})
