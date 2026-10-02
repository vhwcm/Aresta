import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref, nextTick } from 'vue'
import PageCurlCanvas from '~/components/reader/engine/PageCurlCanvas.vue'
import { useReaderStore } from '~/stores/readerStore'

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

// Mock canvas 2D context
let canvasCount = 0
const origCreate = document.createElement.bind(document)
document.createElement = function (tag: string, options?: any) {
  const el = origCreate(tag, options)
  if (tag.toLowerCase() === 'canvas') {
    (el as any)._debugId = `canvas-${++canvasCount}`
  }
  return el
}

const mock2DContext = {
  fillRect: vi.fn(),
  drawImage: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 100 })),
  canvas: { width: 800, height: 1100 },
}
HTMLCanvasElement.prototype.getContext = function (type: string) {
  if (type === '2d') {
    return {
      ...mock2DContext,
      canvas: this,
    }
  }
  return null
} as any

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
      triggerTurn: vi.fn(async (direction: string) => {
        isAnimatingRef.value = true
        await physicsOptions?.onComplete?.(direction)
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

describe('PageTurnBlankBug reproduction', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    isAnimatingRef.value = false
  })

  it('PDF 2 páginas: ao avançar e voltar, a página 2 deve ser renderizada e não ficar em branco', async () => {
    const store = useReaderStore()
    const renderPageMock = vi.fn().mockImplementation((ctx) => {
      // desenha algo no canvas
      ctx.fillStyle = '#123456'
      ctx.fillRect(10, 10, 50, 50)
      return Promise.resolve()
    })

    const getPageMock = vi.fn().mockImplementation(async (pageNum: number) => {
      return {
        width: 800,
        height: 1100,
        aspectRatio: 0.72,
        render: renderPageMock,
      }
    })

    store.setDocument({
      type: 'pdf',
      metadata: { title: 'Avaliacao Estagio' },
      totalPages: 2,
      isLoaded: true,
      load: vi.fn(),
      getPage: getPageMock,
      destroy: vi.fn(),
    } as any, 'estagio.pdf')

    store.isTwoPageMode = true
    store.currentPage = 1

    const wrapper = mount(PageCurlCanvas, { attachTo: document.body })
    const stage = wrapper.find('.page-curl-wrapper').element as HTMLElement
    Object.defineProperty(stage, 'clientWidth', { value: 1200, configurable: true })
    Object.defineProperty(stage, 'clientHeight', { value: 800, configurable: true })
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    await new Promise(r => setTimeout(r, 50))

    // Avançar
    await (wrapper.vm as any).next()
    await nextTick()
    await new Promise(r => setTimeout(r, 300))

    // Voltar
    await (wrapper.vm as any).previous()
    await nextTick()
    await new Promise(r => setTimeout(r, 300))

    // Verificar se a página direita base contém canvas e se page 2 foi renderizada
    const baseRightCanvas = wrapper.find('.page-sheet--right canvas')
    expect(baseRightCanvas.exists()).toBe(true)
    const rightPageNumber = wrapper.find('.page-sheet--right .page-corner-number--right')
    expect(rightPageNumber.text()).toBe('2')

    // Deve ter chamado getPage para a página 2 após voltar
    const lastCalls = getPageMock.mock.calls.slice(-4).map(c => c[0])
    console.log('Recent getPage calls:', lastCalls)
    expect(lastCalls).toContain(2)
  })

  it('PDF 3 páginas: ao avançar para página 3 e voltar para 1-2, a página 2 deve ser renderizada', async () => {
    const store = useReaderStore()
    const renderPageMock = vi.fn().mockImplementation((ctx) => {
      ctx.fillStyle = '#123456'
      ctx.fillRect(10, 10, 50, 50)
      return Promise.resolve()
    })

    const getPageMock = vi.fn().mockImplementation(async (pageNum: number) => {
      return {
        width: 800,
        height: 1100,
        aspectRatio: 0.72,
        render: renderPageMock,
      }
    })

    store.setDocument({
      type: 'pdf',
      metadata: { title: 'Livro 3 Páginas' },
      totalPages: 3,
      isLoaded: true,
      load: vi.fn(),
      getPage: getPageMock,
      destroy: vi.fn(),
    } as any, 'tres_paginas.pdf')

    store.isTwoPageMode = true
    store.currentPage = 1

    const wrapper = mount(PageCurlCanvas, { attachTo: document.body })
    const stage = wrapper.find('.page-curl-wrapper').element as HTMLElement
    Object.defineProperty(stage, 'clientWidth', { value: 1200, configurable: true })
    Object.defineProperty(stage, 'clientHeight', { value: 800, configurable: true })
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    await new Promise(r => setTimeout(r, 300))

    // Avançar (vai para página 3, onde rightPage é null)
    await (wrapper.vm as any).next()
    await nextTick()
    await new Promise(r => setTimeout(r, 300))
    expect(store.currentPage).toBe(3)

    // Voltar (volta para páginas 1-2)
    await (wrapper.vm as any).previous()
    await nextTick()
    await new Promise(r => setTimeout(r, 300))
    expect(store.currentPage).toBe(1)

    // Verifica se a página 2 está no DOM e se seu canvas existe
    const baseRightCanvas = wrapper.find('.page-sheet--right canvas')
    expect(baseRightCanvas.exists()).toBe(true)

    // Verificar se renderPageMock foi chamado para o canvas atual da página 2
    const renderedCanvases = renderPageMock.mock.calls.map(c => (c[0]?.canvas as any)?._debugId)
    expect(renderedCanvases).toContain((baseRightCanvas.element as any)._debugId)
  })

  it('PDF 4 páginas: ao avançar para páginas 3-4 e voltar para 1-2, a página 2 deve ser renderizada', async () => {
    const store = useReaderStore()
    const renderPageMock = vi.fn().mockImplementation((ctx) => {
      ctx.fillStyle = '#123456'
      ctx.fillRect(10, 10, 50, 50)
      return Promise.resolve()
    })

    const getPageMock = vi.fn().mockImplementation(async (pageNum: number) => {
      return {
        width: 800,
        height: 1100,
        aspectRatio: 0.72,
        render: renderPageMock,
      }
    })

    store.setDocument({
      type: 'pdf',
      metadata: { title: 'Livro 4 Páginas' },
      totalPages: 4,
      isLoaded: true,
      load: vi.fn(),
      getPage: getPageMock,
      destroy: vi.fn(),
    } as any, 'quatro_paginas.pdf')

    store.isTwoPageMode = true
    store.currentPage = 1

    const wrapper = mount(PageCurlCanvas, { attachTo: document.body })
    const stage = wrapper.find('.page-curl-wrapper').element as HTMLElement
    Object.defineProperty(stage, 'clientWidth', { value: 1200, configurable: true })
    Object.defineProperty(stage, 'clientHeight', { value: 800, configurable: true })
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    await new Promise(r => setTimeout(r, 300))

    // Avançar (vai para páginas 3-4)
    await (wrapper.vm as any).next()
    await nextTick()
    await new Promise(r => setTimeout(r, 300))
    expect(store.currentPage).toBe(3)

    // Voltar (volta para páginas 1-2)
    await (wrapper.vm as any).previous()
    await nextTick()
    await new Promise(r => setTimeout(r, 300))
    expect(store.currentPage).toBe(1)

    const baseRightCanvas = wrapper.find('.page-sheet--right canvas')
    expect(baseRightCanvas.exists()).toBe(true)

    const renderedCanvases = renderPageMock.mock.calls.map(c => (c[0]?.canvas as any)?._debugId)
    expect(renderedCanvases).toContain((baseRightCanvas.element as any)._debugId)
  })
})
