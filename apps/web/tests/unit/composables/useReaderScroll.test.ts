import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useReaderStore } from '~/stores/readerStore'
import { useReaderScroll } from '~/composables/reader/useReaderScroll'

describe('useReaderScroll', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('inicializa com estado padrão e sem erros', () => {
    const containerRef = ref<HTMLElement | null>(null)
    const { activePage, isScrollingProgrammatically, scrollToPage } = useReaderScroll({
      containerRef,
      totalPages: ref(10),
    })

    expect(activePage.value).toBe(1)
    expect(isScrollingProgrammatically.value).toBe(false)
    expect(typeof scrollToPage).toBe('function')
  })

  it('calcula a página ativa a partir de elementos filhos registrados', () => {
    const container = document.createElement('div')
    const containerRef = ref<HTMLElement | null>(container)

    const { determineActivePageFromSlots } = useReaderScroll({
      containerRef,
      totalPages: ref(3),
    })

    // Simula posições relativas à viewport
    // Página 1 ainda no topo
    const result1 = determineActivePageFromSlots([
      { pageNumber: 1, top: 0, bottom: 800 },
      { pageNumber: 2, top: 800, bottom: 1600 },
      { pageNumber: 3, top: 1600, bottom: 2400 },
    ], 300)
    expect(result1).toBe(1)

    // Scroll desceu: página 2 está no terço superior (baseline 300)
    const result2 = determineActivePageFromSlots([
      { pageNumber: 1, top: -600, bottom: 200 },
      { pageNumber: 2, top: 200, bottom: 1000 },
      { pageNumber: 3, top: 1000, bottom: 1800 },
    ], 300)
    expect(result2).toBe(2)
  })

  it('atualiza o store.currentPage quando a página ativa muda', () => {
    const store = useReaderStore()
    const containerRef = ref<HTMLElement | null>(null)

    const { onPageVisible } = useReaderScroll({
      containerRef,
      totalPages: ref(10),
    })

    onPageVisible(4)
    expect(store.currentPage).toBe(4)
  })

  it('ignora atualização de store quando está rolando programaticamente', () => {
    const store = useReaderStore()
    store.currentPage = 2
    const containerRef = ref<HTMLElement | null>(null)

    const { onPageVisible, isScrollingProgrammatically } = useReaderScroll({
      containerRef,
      totalPages: ref(10),
    })

    isScrollingProgrammatically.value = true
    onPageVisible(5)
    // Não deve sobrescrever durante o salto programático
    expect(store.currentPage).toBe(2)
  })

  it('processa atalhos de teclado de navegação contínua', () => {
    const container = document.createElement('div')
    Object.defineProperty(container, 'clientHeight', { value: 800, configurable: true })
    Object.defineProperty(container, 'scrollHeight', { value: 4000, configurable: true })
    container.scrollTop = 500

    let scrolledTo: { top?: number, behavior?: ScrollBehavior } | null = null
    container.scrollTo = vi.fn((options: any) => {
      scrolledTo = options
    })

    const containerRef = ref<HTMLElement | null>(container)
    const { handleKeyDown } = useReaderScroll({
      containerRef,
      totalPages: ref(5),
    })

    // PageDown desce ~80% da tela (640px)
    const eventPageDown = new KeyboardEvent('keydown', { key: 'PageDown', cancelable: true })
    const handled = handleKeyDown(eventPageDown)
    expect(handled).toBe(true)
    expect(container.scrollTo).toHaveBeenCalled()
    expect(scrolledTo).toEqual({ top: 500 + 640, behavior: 'smooth' })

    // PageUp sobe ~80% da tela (640px)
    const eventPageUp = new KeyboardEvent('keydown', { key: 'PageUp', cancelable: true })
    handleKeyDown(eventPageUp)
    expect(scrolledTo).toEqual({ top: Math.max(0, 500 - 640), behavior: 'smooth' })
  })
})
