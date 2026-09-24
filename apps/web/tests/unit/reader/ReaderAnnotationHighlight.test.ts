import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import PageCurlCanvas from '../../../app/components/reader/engine/PageCurlCanvas.vue'
import { useReaderStore } from '../../../app/stores/readerStore'
import { applyPageHighlights } from '../../../app/utils/readerHighlight'

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

const mockAnnotations = [
  {
    id: 1,
    userId: 1,
    bookId: 10,
    cfi: 'page:1',
    selectedText: 'Simão Bacamarte',
    color: '#10B981', // Verde Menta
    note: 'Médico alienista',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    userId: 1,
    bookId: 10,
    cfi: 'page:1',
    selectedText: 'Itaguaí',
    color: '#3B82F6', // Azul Celeste
    note: 'Cidade da história',
    createdAt: new Date().toISOString(),
  },
]

vi.mock('~/composables/useAnnotations', () => ({
  useAnnotations: () => ({
    annotations: {
      value: mockAnnotations,
    },
    loading: { value: false },
    fetchAnnotations: vi.fn().mockResolvedValue(mockAnnotations),
    createAnnotation: vi.fn(),
  }),
}))

describe('Reader Annotation Highlight Flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('aplica destaques estilizados com a cor escolhida na camada de texto da página', () => {
    const container = document.createElement('div')
    container.className = 'page-text-layer'
    container.innerHTML = `
      <div class="epub-text-layer-content">
        <p>As crônicas de Itaguaí dizem que Simão Bacamarte foi um dos maiores médicos do Brasil.</p>
      </div>
    `

    const applied = applyPageHighlights(container, 1, mockAnnotations, 10)
    expect(applied).toBe(2)

    const marks = container.querySelectorAll('mark.reader-highlight')
    expect(marks.length).toBe(2)

    const simaoMark = Array.from(marks).find((m) => m.textContent === 'Simão Bacamarte') as HTMLElement
    expect(simaoMark).toBeDefined()
    expect(simaoMark.getAttribute('data-annotation-id')).toBe('1')
    expect(simaoMark.style.backgroundColor).toBe('rgba(16, 185, 129, 0.58)')
    expect(simaoMark.style.borderBottom).toBe('2px solid #10B981')
    expect(simaoMark.title).toBe('Médico alienista')

    const itaguaiMark = Array.from(marks).find((m) => m.textContent === 'Itaguaí') as HTMLElement
    expect(itaguaiMark).toBeDefined()
    expect(itaguaiMark.getAttribute('data-annotation-id')).toBe('2')
    expect(itaguaiMark.style.backgroundColor).toBe('rgba(59, 130, 246, 0.58)')
    expect(itaguaiMark.style.borderBottom).toBe('2px solid #3B82F6')
  })

  it('emite select-annotation ao clicar no destaque', async () => {
    const store = useReaderStore()
    store.bookId = 10
    store.setDocument({
      type: 'epub',
      metadata: { title: 'O Alienista' },
      totalPages: 10,
      isLoaded: true,
      load: vi.fn(),
      getPage: vi.fn(),
      renderTextLayer: vi.fn(async (_page: number, el: HTMLElement) => {
        el.innerHTML = '<p>Simão Bacamarte foi médico em Itaguaí.</p>'
      }),
      destroy: vi.fn(),
    } as any, 'alienista.epub')
    store.currentPage = 1

    const wrapper = mount(PageCurlCanvas, {
      attachTo: document.body,
    })

    await wrapper.vm.$nextTick()

    // Chamar refreshHighlights
    ;(wrapper.vm as any).refreshHighlights?.()

    const textLayer = wrapper.find('.page-text-layer')
    expect(textLayer.exists()).toBe(true)

    // Simula clique no mark
    const mark = document.createElement('mark')
    mark.className = 'reader-highlight'
    mark.setAttribute('data-annotation-id', '1')
    textLayer.element.appendChild(mark)

    await mark.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(wrapper.emitted('select-annotation')).toBeTruthy()
    expect(wrapper.emitted('select-annotation')?.[0]).toEqual([1])

    wrapper.unmount()
  })
})
