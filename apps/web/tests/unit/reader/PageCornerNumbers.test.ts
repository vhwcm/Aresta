import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import PageCurlCanvas from '~/components/reader/engine/PageCurlCanvas.vue'
import ReaderScrollEngine from '~/components/reader/engine/ReaderScrollEngine.vue'
import ReaderViewer from '~/components/reader/Viewer.vue'
import { useReaderStore } from '~/stores/readerStore'

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

describe('Page Corner Numbers & Title Bar Cleanup', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('PageCurlCanvas - Numeração nos Cantos das Folhas', () => {
    it('renderiza números de página nos cantos das folhas em modo 2 páginas (EPUB e PDF)', async () => {
      const store = useReaderStore()
      store.setDocument({
        type: 'epub',
        metadata: { title: 'A Startup Enxuta' },
        totalPages: 320,
        isLoaded: true,
        load: vi.fn(),
        getPage: vi.fn(),
        renderTextLayer: vi.fn(),
        destroy: vi.fn(),
      } as any, 'startup.epub')

      store.isTwoPageMode = true
      store.currentPage = 21

      const wrapper = mount(PageCurlCanvas, { attachTo: document.body })
      const stage = wrapper.find('.page-curl-wrapper').element as HTMLElement
      Object.defineProperty(stage, 'clientWidth', { value: 1200, configurable: true })
      Object.defineProperty(stage, 'clientHeight', { value: 800, configurable: true })
      window.dispatchEvent(new Event('resize'))
      await wrapper.vm.$nextTick()

      // Folha esquerda: canto inferior esquerdo com a página ímpar (21)
      const leftCornerNumber = wrapper.find('.page-corner-number--left')
      expect(leftCornerNumber.exists()).toBe(true)
      expect(leftCornerNumber.text()).toBe('21')

      // Folha direita: canto inferior direito com a página par seguinte (22)
      const rightCornerNumber = wrapper.find('.page-corner-number--right')
      expect(rightCornerNumber.exists()).toBe(true)
      expect(rightCornerNumber.text()).toBe('22')
    })

    it('renderiza número de página no canto inferior direito em modo 1 página', async () => {
      const store = useReaderStore()
      store.setDocument({
        type: 'pdf',
        metadata: { title: 'Livro Técnico' },
        totalPages: 150,
        isLoaded: true,
        load: vi.fn(),
        getPage: vi.fn(),
        destroy: vi.fn(),
      } as any, 'livro.pdf')

      store.isTwoPageMode = false
      store.currentPage = 45

      const wrapper = mount(PageCurlCanvas, { attachTo: document.body })
      const stage = wrapper.find('.page-curl-wrapper').element as HTMLElement
      Object.defineProperty(stage, 'clientWidth', { value: 600, configurable: true })
      Object.defineProperty(stage, 'clientHeight', { value: 800, configurable: true })
      window.dispatchEvent(new Event('resize'))
      await wrapper.vm.$nextTick()

      const singleCornerNumber = wrapper.find('.page-corner-number--single')
      expect(singleCornerNumber.exists()).toBe(true)
      expect(singleCornerNumber.text()).toBe('45')
    })
  })

  describe('ReaderViewer - Limpeza da Barra de Título', () => {
    it('renderiza o título sem o badge de progresso de página ao lado', async () => {
      const store = useReaderStore()
      store.setDocument({
        type: 'epub',
        metadata: { title: 'A Startup Enxuta' },
        totalPages: 320,
        isLoaded: true,
        load: vi.fn(),
        getPage: vi.fn(),
        destroy: vi.fn(),
      } as any, 'startup.epub')
      store.currentPage = 21

      const wrapper = mount(ReaderViewer, {
        global: {
          stubs: {
            ReaderEnginePageCurlCanvas: true,
            ReaderBookNotesPanel: true,
            ReaderGraphPanel: true,
            ReaderBottomBar: true,
            ReaderSavedPagesModal: true,
            ReaderAnnotationModal: true,
            ReaderAnnotationDrawer: true,
            ReaderTypographyPopover: true,
            ReaderSelectionTooltip: true,
            ReaderDictionaryCard: true,
          },
        },
      })

      const titleBar = wrapper.find('.reader-viewer__book-title-bar')
      expect(titleBar.exists()).toBe(true)
      expect(titleBar.text()).toBe('A Startup Enxuta')
      expect(titleBar.find('.reader-viewer__book-progress-badge').exists()).toBe(false)
      expect(titleBar.attributes('title')).toBe('A Startup Enxuta')
    })
  })

  describe('ReaderScrollEngine - Numeração no Modo Scroll', () => {
    it('renderiza badge com número de página nas páginas PDF no modo scroll', async () => {
      const store = useReaderStore()
      store.setDocument({
        type: 'pdf',
        metadata: { title: 'Documento PDF' },
        totalPages: 5,
        isLoaded: true,
        load: vi.fn(),
        getPage: vi.fn(),
        destroy: vi.fn(),
      } as any, 'doc.pdf')
      store.readingMode = 'scroll'

      const wrapper = mount(ReaderScrollEngine)
      const badges = wrapper.findAll('.scroll-page-slot__badge')
      expect(badges.length).toBeGreaterThan(0)
      expect(badges[0]?.text()).toBe('1')
    })
  })
})
