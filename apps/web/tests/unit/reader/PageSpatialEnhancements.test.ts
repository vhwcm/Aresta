import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import PageCurlCanvas from '~/components/reader/engine/PageCurlCanvas.vue'
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

describe('PageSpatialEnhancements - Vinco Central e Pilhas de Páginas 3D', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renderiza o vinco central da lombada (.book-spine-crease) no modo 2 páginas', async () => {
    const store = useReaderStore()
    store.setDocument({
      type: 'epub',
      metadata: { title: 'Livro 3D' },
      totalPages: 100,
      isLoaded: true,
      load: vi.fn(),
      getPage: vi.fn(),
      renderTextLayer: vi.fn(),
      destroy: vi.fn(),
    } as any, 'livro.epub')

    store.isTwoPageMode = true
    store.currentPage = 15
    store.readerTheme = 'black'

    const wrapper = mount(PageCurlCanvas, { attachTo: document.body })
    const stage = wrapper.find('.page-curl-wrapper').element as HTMLElement
    Object.defineProperty(stage, 'clientWidth', { value: 1200, configurable: true })
    Object.defineProperty(stage, 'clientHeight', { value: 800, configurable: true })
    window.dispatchEvent(new Event('resize'))
    await wrapper.vm.$nextTick()

    const spineCrease = wrapper.find('.book-spine-crease')
    expect(spineCrease.exists()).toBe(true)
    expect(spineCrease.classes()).not.toContain('book-spine-crease--pdf')
  })

  it('aplica classe .book-spine-crease--pdf quando o documento for PDF para sombreamento em folhas brancas', async () => {
    const store = useReaderStore()
    store.setDocument({
      type: 'pdf',
      metadata: { title: 'Documento PDF' },
      totalPages: 50,
      isLoaded: true,
      load: vi.fn(),
      getPage: vi.fn(),
      destroy: vi.fn(),
    } as any, 'documento.pdf')

    store.isTwoPageMode = true
    store.currentPage = 10
    store.readerTheme = 'black'

    const wrapper = mount(PageCurlCanvas, { attachTo: document.body })
    const stage = wrapper.find('.page-curl-wrapper').element as HTMLElement
    Object.defineProperty(stage, 'clientWidth', { value: 1200, configurable: true })
    Object.defineProperty(stage, 'clientHeight', { value: 800, configurable: true })
    window.dispatchEvent(new Event('resize'))
    await wrapper.vm.$nextTick()

    const spineCrease = wrapper.find('.book-spine-crease')
    expect(spineCrease.exists()).toBe(true)
    expect(spineCrease.classes()).toContain('book-spine-crease--pdf')
  })

  it('calcula e renderiza pilhas inferiores com espessuras assimétricas (esquerda = lidas, direita = restantes)', async () => {
    const store = useReaderStore()
    store.setDocument({
      type: 'epub',
      metadata: { title: 'Livro de Teste' },
      totalPages: 100,
      isLoaded: true,
      load: vi.fn(),
      getPage: vi.fn(),
      renderTextLayer: vi.fn(),
      destroy: vi.fn(),
    } as any, 'livro.epub')

    store.isTwoPageMode = true
    // Página 15 de 100: progresso inicial (~15%)
    store.currentPage = 15

    const wrapper = mount(PageCurlCanvas, { attachTo: document.body })
    const stage = wrapper.find('.page-curl-wrapper').element as HTMLElement
    Object.defineProperty(stage, 'clientWidth', { value: 1200, configurable: true })
    Object.defineProperty(stage, 'clientHeight', { value: 800, configurable: true })
    window.dispatchEvent(new Event('resize'))
    await wrapper.vm.$nextTick()

    const bottomLeftStack = wrapper.find('.book-page-stack-bottom--left')
    const bottomRightStack = wrapper.find('.book-page-stack-bottom--right')

    expect(bottomLeftStack.exists()).toBe(true)
    expect(bottomRightStack.exists()).toBe(true)

    // Altura da pilha esquerda deve ser menor que a da direita no início da leitura
    const leftHeight = parseFloat((bottomLeftStack.element as HTMLElement).style.height)
    const rightHeight = parseFloat((bottomRightStack.element as HTMLElement).style.height)

    expect(leftHeight).toBeGreaterThan(0)
    expect(rightHeight).toBeGreaterThan(0)
    expect(rightHeight).toBeGreaterThan(leftHeight)
  })

  it('inverte a assimetria das pilhas no final do livro (esquerda mais espessa que a direita)', async () => {
    const store = useReaderStore()
    store.setDocument({
      type: 'epub',
      metadata: { title: 'Livro de Teste' },
      totalPages: 100,
      isLoaded: true,
      load: vi.fn(),
      getPage: vi.fn(),
      renderTextLayer: vi.fn(),
      destroy: vi.fn(),
    } as any, 'livro.epub')

    store.isTwoPageMode = true
    // Página 85 de 100: progresso avançado (85% lido)
    store.currentPage = 85

    const wrapper = mount(PageCurlCanvas, { attachTo: document.body })
    const stage = wrapper.find('.page-curl-wrapper').element as HTMLElement
    Object.defineProperty(stage, 'clientWidth', { value: 1200, configurable: true })
    Object.defineProperty(stage, 'clientHeight', { value: 800, configurable: true })
    window.dispatchEvent(new Event('resize'))
    await wrapper.vm.$nextTick()

    const bottomLeftStack = wrapper.find('.book-page-stack-bottom--left')
    const bottomRightStack = wrapper.find('.book-page-stack-bottom--right')

    expect(bottomLeftStack.exists()).toBe(true)
    expect(bottomRightStack.exists()).toBe(true)

    const leftHeight = parseFloat((bottomLeftStack.element as HTMLElement).style.height)
    const rightHeight = parseFloat((bottomRightStack.element as HTMLElement).style.height)

    expect(leftHeight).toBeGreaterThan(rightHeight)
  })

  it('permite clicar nas pilhas inferiores para avançar ou retroceder a leitura', async () => {
    const store = useReaderStore()
    store.setDocument({
      type: 'epub',
      metadata: { title: 'Livro de Teste' },
      totalPages: 100,
      isLoaded: true,
      load: vi.fn(),
      getPage: vi.fn(),
      renderTextLayer: vi.fn(),
      destroy: vi.fn(),
    } as any, 'livro.epub')

    store.isTwoPageMode = true
    store.currentPage = 50

    const wrapper = mount(PageCurlCanvas, { attachTo: document.body })
    const stage = wrapper.find('.page-curl-wrapper').element as HTMLElement
    Object.defineProperty(stage, 'clientWidth', { value: 1200, configurable: true })
    Object.defineProperty(stage, 'clientHeight', { value: 800, configurable: true })
    window.dispatchEvent(new Event('resize'))
    await wrapper.vm.$nextTick()

    const bottomLeftStack = wrapper.find('.book-page-stack-bottom--left')
    const bottomRightStack = wrapper.find('.book-page-stack-bottom--right')

    expect(bottomLeftStack.attributes('role')).toBe('button')
    expect(bottomRightStack.attributes('role')).toBe('button')
  })

  it('renderiza o SVG unificado da pilha inferior com transição elíptica contínua na lombada e sem divisão nos cantos', async () => {
    const store = useReaderStore()
    store.setDocument({
      type: 'epub',
      metadata: { title: 'Livro de Teste' },
      totalPages: 100,
      isLoaded: true,
      load: vi.fn(),
      getPage: vi.fn(),
      renderTextLayer: vi.fn(),
      destroy: vi.fn(),
    } as any, 'livro.epub')

    store.isTwoPageMode = true
    store.currentPage = 15 // hL = 2px, hR = 7px

    const wrapper = mount(PageCurlCanvas, { attachTo: document.body })
    const stage = wrapper.find('.page-curl-wrapper').element as HTMLElement
    Object.defineProperty(stage, 'clientWidth', { value: 1200, configurable: true })
    Object.defineProperty(stage, 'clientHeight', { value: 800, configurable: true })
    window.dispatchEvent(new Event('resize'))
    await wrapper.vm.$nextTick()

    const unifiedBottom = wrapper.find('.book-page-stack-bottom-unified')
    expect(unifiedBottom.exists()).toBe(true)

    const bottomSvg = wrapper.find('.book-bottom-svg')
    expect(bottomSvg.exists()).toBe(true)

    // O path da borda inferior deve conter o comando 'C ' (curva cúbica de Bézier elíptica de transição)
    const paths = bottomSvg.findAll('path')
    expect(paths.length).toBe(2)
    const strokePath = paths[1].attributes('d')
    expect(strokePath).toContain('C ')

    // As pilhas laterais devem ter a altura estendida para encontrar a base perfeitamente
    const rightLateralStack = wrapper.find('.book-page-stack--right')
    expect(rightLateralStack.exists()).toBe(true)
    const rightPageSheet = wrapper.find('.page-sheet--right')
    const pageHeight = parseFloat((rightPageSheet.element as HTMLElement).style.height)
    const lateralHeight = parseFloat((rightLateralStack.element as HTMLElement).style.height)
    expect(lateralHeight).toBeGreaterThan(pageHeight)
  })
})
