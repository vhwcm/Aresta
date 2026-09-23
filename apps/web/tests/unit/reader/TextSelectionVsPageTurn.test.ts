import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref, nextTick } from 'vue'
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

// Mock de usePagePhysics
let physicsOptions: any = null
const isAnimatingRef = ref(false)
const isDraggingRef = ref(false)
const startDragMock = vi.fn()
const updateDragMock = vi.fn()
const endDragMock = vi.fn()

vi.mock('~/composables/reader/usePagePhysics', () => ({
  usePagePhysics: (opts: any) => {
    physicsOptions = opts
    return {
      progress: ref(0),
      isDragging: isDraggingRef,
      isAnimating: isAnimatingRef,
      activeDirection: ref('next'),
      gripRegion: ref('edge-center'),
      triggerTurn: vi.fn((direction: string) => {
        isAnimatingRef.value = true
        physicsOptions?.onComplete?.(direction)
        isAnimatingRef.value = false
      }),
      startDrag: startDragMock,
      updateDrag: updateDragMock,
      endDrag: endDragMock,
      cancelDrag: vi.fn(),
      destroy: vi.fn(),
    }
  },
}))

describe('TextSelectionVsPageTurn - Precisão de Seleção de Texto vs Virada de Folha', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    isAnimatingRef.value = false
    isDraggingRef.value = false
  })

  function setupReader(totalPages = 50, initialPage = 2) {
    const store = useReaderStore()
    store.setDocument({
      type: 'epub',
      metadata: { title: 'Dom Casmurro' },
      totalPages,
      isLoaded: true,
      load: vi.fn(),
      destroy: vi.fn(),
      renderTextLayer: vi.fn().mockResolvedValue(true),
    } as any, 'casmurro.epub')

    store.isTwoPageMode = false
    store.currentPage = initialPage
    return store
  }

  it('não vira a página quando o clique ocorre sobre elemento de texto no canto', async () => {
    const store = setupReader(50, 5)
    const wrapper = mount(PageCurlCanvas, { attachTo: document.body })

    const stage = wrapper.find('.page-curl-wrapper').element as HTMLElement
    Object.defineProperty(stage, 'clientWidth', { value: 1000, configurable: true })
    Object.defineProperty(stage, 'clientHeight', { value: 800, configurable: true })
    vi.spyOn(stage, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 1000,
      bottom: 800,
      width: 1000,
      height: 800,
      x: 0,
      y: 0,
      toJSON: () => {},
    })

    // Cria elemento de texto (ex: span dentro da camada de texto no canto direito)
    const textEl = document.createElement('span')
    textEl.className = 'epub-paragraph'
    textEl.textContent = 'Palavra no canto da folha'
    stage.appendChild(textEl)

    // Simula clique (pointerdown + pointerup com movimento < 6px no canto direito x = 850)
    textEl.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 850,
        clientY: 100,
      }),
    )

    textEl.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 852,
        clientY: 101,
      }),
    )

    // A página NÃO deve ter virado porque o clique foi em cima de texto
    expect(store.currentPage).toBe(5)
    wrapper.unmount()
  })

  it('não ativa virada nem apaga seleção se houver texto selecionado no documento', async () => {
    const store = setupReader(50, 5)
    const wrapper = mount(PageCurlCanvas, { attachTo: document.body })

    const stage = wrapper.find('.page-curl-wrapper').element as HTMLElement
    Object.defineProperty(stage, 'clientWidth', { value: 1000, configurable: true })
    Object.defineProperty(stage, 'clientHeight', { value: 800, configurable: true })
    vi.spyOn(stage, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 1000,
      bottom: 800,
      width: 1000,
      height: 800,
      x: 0,
      y: 0,
      toJSON: () => {},
    })

    // Simula seleção ativa no window
    const removeAllRangesSpy = vi.fn()
    const mockSelection = {
      isCollapsed: false,
      toString: () => 'trecho selecionado',
      removeAllRanges: removeAllRangesSpy,
      rangeCount: 1,
    }
    vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection as any)

    // Pointer down no canto direito
    stage.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 880,
        clientY: 200,
      }),
    )

    // Pointer move arrastando para a esquerda (dx = -50)
    stage.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 830,
        clientY: 200,
      }),
    )

    // Não deve chamar removeAllRanges (não deve apagar a seleção do usuário)
    expect(removeAllRangesSpy).not.toHaveBeenCalled()
    // startDrag da física não deve ter sido invocado
    expect(startDragMock).not.toHaveBeenCalled()
    // A página não deve ter mudado
    expect(store.currentPage).toBe(5)
    wrapper.unmount()
  })

  it('não ativa virada de página se o arraste for predominantemente vertical (seleção entre linhas)', async () => {
    const store = setupReader(50, 5)
    const wrapper = mount(PageCurlCanvas, { attachTo: document.body })

    const stage = wrapper.find('.page-curl-wrapper').element as HTMLElement
    Object.defineProperty(stage, 'clientWidth', { value: 1000, configurable: true })
    Object.defineProperty(stage, 'clientHeight', { value: 800, configurable: true })
    vi.spyOn(stage, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 1000,
      bottom: 800,
      width: 1000,
      height: 800,
      x: 0,
      y: 0,
      toJSON: () => {},
    })

    vi.spyOn(window, 'getSelection').mockReturnValue(null)

    // Pointer down
    stage.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 800,
        clientY: 150,
      }),
    )

    // Arraste vertical para baixo (dy = 40, dx = -5)
    stage.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 795,
        clientY: 190,
      }),
    )

    // Não deve disparar virada de página 3D
    expect(startDragMock).not.toHaveBeenCalled()
    expect(store.currentPage).toBe(5)
    wrapper.unmount()
  })

  it('não ativa virada se o movimento horizontal for no sentido oposto à lombada', async () => {
    const store = setupReader(50, 5)
    const wrapper = mount(PageCurlCanvas, { attachTo: document.body })

    const stage = wrapper.find('.page-curl-wrapper').element as HTMLElement
    Object.defineProperty(stage, 'clientWidth', { value: 1000, configurable: true })
    Object.defineProperty(stage, 'clientHeight', { value: 800, configurable: true })
    vi.spyOn(stage, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 1000,
      bottom: 800,
      width: 1000,
      height: 800,
      x: 0,
      y: 0,
      toJSON: () => {},
    })

    vi.spyOn(window, 'getSelection').mockReturnValue(null)

    // Pointer down no lado direito (próxima página)
    stage.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 700,
        clientY: 300,
      }),
    )

    // Arraste para a direita (afastando da lombada, dx = +40)
    stage.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        clientX: 740,
        clientY: 300,
      }),
    )

    // Não deve ativar virada
    expect(startDragMock).not.toHaveBeenCalled()
    expect(store.currentPage).toBe(5)
    wrapper.unmount()
  })

  it('vira a página corretamente ao clicar na margem externa livre sem texto', async () => {
    const store = setupReader(50, 5)
    const wrapper = mount(PageCurlCanvas, { attachTo: document.body })

    const stage = wrapper.find('.page-curl-wrapper').element as HTMLElement
    Object.defineProperty(stage, 'clientWidth', { value: 1000, configurable: true })
    Object.defineProperty(stage, 'clientHeight', { value: 800, configurable: true })
    vi.spyOn(stage, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 1000,
      bottom: 800,
      width: 1000,
      height: 800,
      x: 0,
      y: 0,
      toJSON: () => {},
    })

    vi.spyOn(window, 'getSelection').mockReturnValue(null)

    // Clique direto na margem direita externa (x = 950 > bounds.width * 0.88), fora do texto
    stage.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 950,
        clientY: 400,
      }),
    )

    stage.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        button: 0,
        clientX: 951,
        clientY: 401,
      }),
    )

    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 20))

    // Deve avançar para a página 6
    expect(store.currentPage).toBe(6)
    wrapper.unmount()
  })

  it('não intercepta nem ativa virada de página quando o arraste em touch/caneta inicia sobre a camada de texto', async () => {
    const store = setupReader(50, 5)
    const wrapper = mount(PageCurlCanvas, { attachTo: document.body })

    const stage = wrapper.find('.page-curl-wrapper').element as HTMLElement
    Object.defineProperty(stage, 'clientWidth', { value: 1000, configurable: true })
    Object.defineProperty(stage, 'clientHeight', { value: 800, configurable: true })
    vi.spyOn(stage, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 1000,
      bottom: 800,
      width: 1000,
      height: 800,
      x: 0,
      y: 0,
      toJSON: () => {},
    })

    const textLayer = stage.querySelector('.page-text-layer') as HTMLElement
    expect(textLayer).toBeTruthy()

    // Touch down na camada de texto (pointerType: 'touch')
    textLayer.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 2,
        pointerType: 'touch',
        button: 0,
        clientX: 750,
        clientY: 300,
      }),
    )

    // Touch drag amplo horizontal simulando seleção de texto de várias palavras no tablet (dx = -120)
    textLayer.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        pointerId: 2,
        pointerType: 'touch',
        clientX: 630,
        clientY: 305,
      }),
    )

    // Não deve iniciar arraste de página 3D
    expect(startDragMock).not.toHaveBeenCalled()
    expect(store.currentPage).toBe(5)
    wrapper.unmount()
  })
})
