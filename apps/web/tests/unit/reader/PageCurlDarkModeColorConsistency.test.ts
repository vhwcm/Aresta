import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import PageCurlCanvas from '~/components/reader/engine/PageCurlCanvas.vue'
import { useReaderStore } from '~/stores/readerStore'
import { rasterizeElementToCanvas, drawPlainTextToCanvas } from '~/utils/pageRasterizer'

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

describe('PageCurl - Consistência de Cor no Dark Mode (Preto Puro #000000)', () => {
  let mockCtx: any

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      drawImage: vi.fn(),
      measureText: vi.fn((text: string) => ({ width: text.length * 8 })),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray([255, 255, 255, 255]),
        width: 1,
        height: 1,
      })),
      putImageData: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      globalCompositeOperation: 'source-over',
    }

    HTMLCanvasElement.prototype.getContext = vi.fn(function (contextId: string) {
      if (contextId === '2d') return mockCtx
      return null
    }) as any
  })

  it('o leitor e as páginas base possuem fundo #000000 (preto puro) no dark mode', async () => {
    const store = useReaderStore()
    const mockDoc = {
      type: 'epub',
      metadata: { title: 'Livro Preto Puro' },
      totalPages: 10,
      isLoaded: true,
      load: vi.fn(),
      getPage: vi.fn(),
      renderTextLayer: vi.fn(async (pageNumber: number, container: HTMLElement, width: number, height: number) => {
        container.innerHTML = `<div class="epub-text-layer-viewport" style="width:${width}px;height:${height}px"><div class="epub-text-layer-content"><p>Página de teste dark mode</p></div></div>`
      }),
      destroy: vi.fn(),
    }
    store.setDocument(mockDoc as any, 'livro.epub')
    store.setReaderTheme('black')
    store.isTwoPageMode = true
    store.currentPage = 1

    const wrapper = mount(PageCurlCanvas, { attachTo: document.body })
    await wrapper.vm.$nextTick()

    // Verifica que o wrapper possui classe theme-black e background #000000
    expect(wrapper.classes()).toContain('theme-black')
    const wrapperEl = wrapper.find('.page-curl-wrapper').element as HTMLElement
    expect(wrapperEl.style.backgroundColor).toBe('#000000')

    // Verifica que a base e o palco também possuem background #000000
    const stageEl = wrapper.find('.book-3d-stage').element as HTMLElement
    expect(stageEl.style.backgroundColor).toBe('#000000')

    wrapper.unmount()
  })

  it('as texturas 3D rasterizadas via rasterizeElementToCanvas utilizam #000000 puro e não cinza #121214', () => {
    const fillStyles: string[] = []
    mockCtx.fillRect.mockImplementation(() => {
      fillStyles.push(mockCtx.fillStyle)
    })

    const targetCanvas = document.createElement('canvas')
    const container = document.createElement('div')
    const p = document.createElement('p')
    p.textContent = 'Parágrafo do livro virando'
    container.appendChild(p)

    const result = rasterizeElementToCanvas(container, targetCanvas, 400, 600, 'black')
    expect(result).toBe(true)

    // O fundo preenchido deve ser estritamente #000000 (preto puro)
    expect(fillStyles).toContain('#000000')
    expect(fillStyles).not.toContain('#121214')

    // A borda delimitadora branca deve ser desenhada para acabamento premium
    expect(mockCtx.strokeStyle).toBe('rgba(255, 255, 255, 0.22)')
    expect(mockCtx.strokeRect).toHaveBeenCalled()
  })

  it('o fallback drawPlainTextToCanvas utiliza #000000 puro e não cinza #121214', () => {
    const fillStyles: string[] = []
    mockCtx.fillRect.mockImplementation(() => {
      fillStyles.push(mockCtx.fillStyle)
    })

    const targetCanvas = document.createElement('canvas')
    drawPlainTextToCanvas(targetCanvas, 'Texto fallback', 400, 600, 'black')

    expect(fillStyles).toContain('#000000')
    expect(fillStyles).not.toContain('#121214')
    expect(mockCtx.strokeStyle).toBe('rgba(255, 255, 255, 0.22)')
    expect(mockCtx.strokeRect).toHaveBeenCalled()
  })
})
