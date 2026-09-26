import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
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

describe('Zen Mode & Dark Theme Layout & Contrast', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('preserves centered book margins and renders content in two-page Zen mode with black theme', async () => {
    const store = useReaderStore()
    const mockDoc = {
      type: 'epub',
      metadata: { title: 'Livro Zen Teste' },
      totalPages: 10,
      isLoaded: true,
      load: vi.fn(),
      getPage: vi.fn(),
      renderTextLayer: vi.fn(async (pageNumber: number, container: HTMLElement, width: number, height: number) => {
        container.innerHTML = `<div class="epub-text-layer-viewport" style="width:${width}px;height:${height}px"><div class="epub-text-layer-content"><p>Capítulo 1: O Início</p></div></div>`
      }),
      destroy: vi.fn(),
    }
    store.setDocument(mockDoc as any, 'livro.epub')
    store.setReaderTheme('black')
    store.isTwoPageMode = true
    store.currentPage = 1

    const wrapper = mount(PageCurlCanvas, { attachTo: document.body })
    const stage = wrapper.find('.page-curl-wrapper').element as HTMLElement
    Object.defineProperty(stage, 'clientWidth', { value: 1920, configurable: true })
    Object.defineProperty(stage, 'clientHeight', { value: 1080, configurable: true })

    window.dispatchEvent(new Event('resize'))
    await wrapper.vm.$nextTick()

    // Toggle Zen Mode
    store.setZenMode(true)
    await wrapper.vm.$nextTick()
    window.dispatchEvent(new Event('resize'))
    await wrapper.vm.$nextTick()

    // Container theme check
    expect(wrapper.classes()).toContain('theme-black')

    // Left and right page sheets exist
    const leftPage = wrapper.find('.page-sheet--left')
    const rightPage = wrapper.find('.page-sheet--right')
    expect(leftPage.exists()).toBe(true)
    expect(rightPage.exists()).toBe(true)

    // Left page has margins (not pushed to left: 0px / top: 0px full bleed)
    const leftStyle = leftPage.attributes('style') || ''
    expect(leftStyle).not.toContain('left: 0px')
    expect(leftStyle).not.toContain('top: 0px')

    // Text layers are rendered and contain text
    const leftTextLayer = wrapper.find('.page-text-layer--left')
    expect(leftTextLayer.exists()).toBe(true)
    expect(leftTextLayer.text()).toContain('Capítulo 1: O Início')
  })

  it('preserves centered book margins in single-page Zen mode with black theme', async () => {
    const store = useReaderStore()
    const mockDoc = {
      type: 'epub',
      metadata: { title: 'Livro Zen Teste' },
      totalPages: 10,
      isLoaded: true,
      load: vi.fn(),
      getPage: vi.fn(),
      renderTextLayer: vi.fn(async (pageNumber: number, container: HTMLElement, width: number, height: number) => {
        container.innerHTML = `<div class="epub-text-layer-viewport" style="width:${width}px;height:${height}px"><div class="epub-text-layer-content"><p>Página Única</p></div></div>`
      }),
      destroy: vi.fn(),
    }
    store.setDocument(mockDoc as any, 'livro.epub')
    store.setReaderTheme('black')
    store.isTwoPageMode = false
    store.currentPage = 1

    const wrapper = mount(PageCurlCanvas, { attachTo: document.body })
    const stage = wrapper.find('.page-curl-wrapper').element as HTMLElement
    Object.defineProperty(stage, 'clientWidth', { value: 1920, configurable: true })
    Object.defineProperty(stage, 'clientHeight', { value: 1080, configurable: true })

    store.setZenMode(true)
    await wrapper.vm.$nextTick()
    window.dispatchEvent(new Event('resize'))
    await wrapper.vm.$nextTick()

    const singlePage = wrapper.find('.page-sheet--single')
    expect(singlePage.exists()).toBe(true)

    const singleStyle = singlePage.attributes('style') || ''
    expect(singleStyle).not.toContain('left: 0px')
    expect(singleStyle).not.toContain('top: 0px')

    const textLayer = wrapper.find('.page-text-layer--single')
    expect(textLayer.exists()).toBe(true)
    expect(textLayer.text()).toContain('Página Única')
  })
})
