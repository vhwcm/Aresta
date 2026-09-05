import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { useReaderStore } from '~/stores/readerStore'
import PageCurlCanvas from '~/components/reader/engine/PageCurlCanvas.vue'

// Mock de Three.js para ambiente headless
vi.mock('three', async () => {
  const actual = await vi.importActual<any>('three')
  class MockWebGLRenderer {
    domElement = document.createElement('canvas')
    toneMapping = 0
    render = vi.fn()
    setSize = vi.fn()
    setPixelRatio = vi.fn()
    dispose = vi.fn()
    forceContextLoss = vi.fn()
  }
  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
  }
})

// Mock de usePagePhysics para simular ciclo de vida de animação sob controle do teste
let physicsOptions: any = null
const isAnimatingRef = ref(false)
vi.mock('~/composables/reader/usePagePhysics', () => ({
  usePagePhysics: (opts: any) => {
    physicsOptions = opts
    return {
      progress: ref(0),
      isDragging: ref(false),
      isAnimating: isAnimatingRef,
      activeDirection: ref('next'),
      gripRegion: ref('edge-center'),
      triggerTurn: vi.fn((direction: string) => {
        isAnimatingRef.value = true
        // Simula conclusão da virada
        physicsOptions?.onComplete?.(direction)
        isAnimatingRef.value = false
      }),
      startDrag: vi.fn(),
      updateDrag: vi.fn(),
      endDrag: vi.fn(),
      cancelDrag: vi.fn(),
      destroy: vi.fn(),
    }
  },
}))

describe('PageTurnClickDeduplication - Prevenção de Avanço Duplo por Clique', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    isAnimatingRef.value = false
  })

  it('no modo de página única (1 folha), o clique deve avançar exatamente 1 página (e não 2)', async () => {
    const store = useReaderStore()
    store.setDocument({
      type: 'epub',
      metadata: { title: 'O Alienista' },
      totalPages: 80,
      isLoaded: true,
      load: vi.fn(),
      destroy: vi.fn(),
      renderTextLayer: vi.fn().mockResolvedValue(true),
    } as any, 'alienista.epub')

    store.isTwoPageMode = false
    store.currentPage = 1

    const wrapper = mount(PageCurlCanvas)

    // Invoca next uma vez
    await (wrapper.vm as any).next()

    // Com a virada executada no modo 1 folha, a próxima página de destino deve ser 2, e não 3
    expect(store.currentPage).toBe(2)
  })

  it('rejeita chamadas duplicadas sintéticas de requestTurn disparadas em sequência imediata (< 250ms)', async () => {
    const store = useReaderStore()
    store.setDocument({
      type: 'epub',
      metadata: { title: 'O Alienista' },
      totalPages: 80,
      isLoaded: true,
      load: vi.fn(),
      destroy: vi.fn(),
      renderTextLayer: vi.fn().mockResolvedValue(true),
    } as any, 'alienista.epub')

    store.isTwoPageMode = false
    store.currentPage = 1

    const wrapper = mount(PageCurlCanvas)

    // Primeiro clique dispara a virada: 1 -> 2
    await (wrapper.vm as any).next()
    expect(store.currentPage).toBe(2)

    // Segundo clique imediato (simulando evento click sintético disparado logo após pointerup)
    // Deve ser bloqueado pelo debounce para não pular mais uma página
    await (wrapper.vm as any).next()
    expect(store.currentPage).toBe(2)
  })

  it('ignora cliques durante animação ativa que chegam dentro da janela de debounce sintético (< 350ms)', async () => {
    const store = useReaderStore()
    store.setDocument({
      type: 'epub',
      metadata: { title: 'O Alienista' },
      totalPages: 80,
      isLoaded: true,
      load: vi.fn(),
      destroy: vi.fn(),
      renderTextLayer: vi.fn().mockResolvedValue(true),
    } as any, 'alienista.epub')

    store.isTwoPageMode = false
    store.currentPage = 1

    const wrapper = mount(PageCurlCanvas)

    // Simula que a animação está em andamento
    isAnimatingRef.value = true
    await (wrapper.vm as any).next()

    // O clique rápido durante a animação não deve ter sido executado imediatamente
    expect(store.currentPage).toBe(1)
  })

  it('o contêiner stage existe e está montado corretamente no DOM', () => {
    const store = useReaderStore()
    store.setDocument({
      type: 'epub',
      metadata: { title: 'O Alienista' },
      totalPages: 80,
      isLoaded: true,
      load: vi.fn(),
      destroy: vi.fn(),
    } as any, 'alienista.epub')

    const wrapper = mount(PageCurlCanvas)
    const stage = wrapper.find('.page-curl-wrapper')
    expect(stage.exists()).toBe(true)
  })
})
