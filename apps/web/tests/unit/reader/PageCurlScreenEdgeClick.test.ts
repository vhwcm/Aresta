import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import * as THREE from 'three'
import PageCurlCanvas from '../../../app/components/reader/engine/PageCurlCanvas.vue'
import { useReaderStore } from '../../../app/stores/readerStore'

vi.mock('three', async () => {
  const actual = await vi.importActual<typeof THREE>('three')

  class MockWebGLRenderer {
    domElement: HTMLCanvasElement
    toneMapping = 0
    render = vi.fn()
    setSize = vi.fn()
    setPixelRatio = vi.fn()
    dispose = vi.fn()
    forceContextLoss = vi.fn()

    constructor(options?: { canvas?: HTMLCanvasElement }) {
      this.domElement = options?.canvas || document.createElement('canvas')
    }
  }

  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
  }
})

vi.mock('~/composables/useAnnotations', () => ({
  useAnnotations: () => ({
    annotations: { value: [] },
  }),
}))

vi.mock('~/composables/useSettings', () => ({
  useSettings: () => ({
    pageCreaseEnabled: { value: true },
    pageAnimationEnabled: { value: false }, // instant turning for fast unit testing
  }),
}))

describe('PageCurlCanvas - Navegação por clique nas pontas da tela', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('vira para a próxima página ao clicar na ponta direita da tela', async () => {
    const store = useReaderStore()
    store.setDocument({
      type: 'pdf',
      metadata: { title: 'Livro de Teste' },
      totalPages: 10,
      isLoaded: true,
      load: vi.fn(),
      getPage: vi.fn(),
      destroy: vi.fn(),
    } as any, 'livro.pdf')
    store.currentPage = 1

    const wrapper = mount(PageCurlCanvas)
    const stage = wrapper.find('.page-curl-wrapper')
    expect(stage.exists()).toBe(true)

    // Simula dimensões do palco (bounds de 1000px de largura)
    vi.spyOn(stage.element, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 1000,
      height: 800,
      right: 1000,
      bottom: 800,
      x: 0,
      y: 0,
      toJSON: () => {},
    })

    // Clique na ponta direita (x = 950px, que é > 820px e últimos 18%)
    await stage.trigger('pointerdown', { clientX: 950, clientY: 400, button: 0, pointerId: 1 })
    await stage.trigger('pointerup', { clientX: 950, clientY: 400, pointerId: 1 })

    // Com 2 páginas ou 1 página, avança a página
    expect(store.currentPage).toBeGreaterThan(1)
  })

  it('vira para a página anterior ao clicar na ponta esquerda da tela', async () => {
    const store = useReaderStore()
    store.setDocument({
      type: 'pdf',
      metadata: { title: 'Livro de Teste' },
      totalPages: 10,
      isLoaded: true,
      load: vi.fn(),
      getPage: vi.fn(),
      destroy: vi.fn(),
    } as any, 'livro.pdf')
    store.currentPage = 5

    const wrapper = mount(PageCurlCanvas)
    const stage = wrapper.find('.page-curl-wrapper')

    vi.spyOn(stage.element, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 1000,
      height: 800,
      right: 1000,
      bottom: 800,
      x: 0,
      y: 0,
      toJSON: () => {},
    })

    // Clique na ponta esquerda (x = 50px, que é < 180px e primeiros 18%)
    await stage.trigger('pointerdown', { clientX: 50, clientY: 400, button: 0, pointerId: 1 })
    await stage.trigger('pointerup', { clientX: 50, clientY: 400, pointerId: 1 })

    // Volta a página
    expect(store.currentPage).toBeLessThan(5)
  })

  it('ativa classe de hover ao passar o mouse nas pontas da tela no desktop', async () => {
    const store = useReaderStore()
    store.setDocument({
      type: 'pdf',
      metadata: { title: 'Livro de Teste' },
      totalPages: 10,
      isLoaded: true,
      load: vi.fn(),
      getPage: vi.fn(),
      destroy: vi.fn(),
    } as any, 'livro.pdf')
    store.currentPage = 5

    const wrapper = mount(PageCurlCanvas)
    const stage = wrapper.find('.page-curl-wrapper')

    vi.spyOn(stage.element, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 1000,
      height: 800,
      right: 1000,
      bottom: 800,
      x: 0,
      y: 0,
      toJSON: () => {},
    })

    // Hover na ponta direita
    await stage.trigger('pointermove', { clientX: 950, clientY: 400, pointerType: 'mouse' })
    expect(stage.classes()).toContain('page-curl-wrapper--hover-next')

    // Hover na ponta esquerda
    await stage.trigger('pointermove', { clientX: 50, clientY: 400, pointerType: 'mouse' })
    expect(stage.classes()).toContain('page-curl-wrapper--hover-prev')

    // Pointer leave remove classes de hover
    await stage.trigger('pointerleave')
    expect(stage.classes()).not.toContain('page-curl-wrapper--hover-prev')
    expect(stage.classes()).not.toContain('page-curl-wrapper--hover-next')
  })
})
