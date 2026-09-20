import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ReaderScrollEngine from '~/components/reader/engine/ReaderScrollEngine.vue'
import { useReaderStore } from '~/stores/readerStore'
import type { IBookDocument, PageData } from '~/interfaces/reader/IBookDocument'

function createMockPdfDocument(totalPages = 5): IBookDocument {
  return {
    type: 'pdf',
    metadata: { title: 'Mock PDF' },
    totalPages,
    isLoaded: true,
    getAspectRatio: vi.fn().mockReturnValue(0.707),
    load: vi.fn().mockResolvedValue(undefined),
    getPage: vi.fn().mockResolvedValue({
      width: 600,
      height: 800,
      aspectRatio: 0.75,
      render: vi.fn().mockResolvedValue(undefined),
    } as PageData),
    renderTextLayer: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
  }
}

function createMockEpubDocument(sectionsCount = 3): IBookDocument {
  return {
    type: 'epub',
    metadata: { title: 'Mock EPUB' },
    totalPages: 12,
    isLoaded: true,
    load: vi.fn().mockResolvedValue(undefined),
    getPage: vi.fn().mockResolvedValue({} as PageData),
    getSectionCount: vi.fn().mockReturnValue(sectionsCount),
    getPageForSection: vi.fn().mockImplementation((idx: number) => idx * 4 + 1),
    getSectionForPage: vi.fn().mockImplementation((pg: number) => Math.floor((pg - 1) / 4)),
    renderSectionContinuous: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
  }
}

describe('ReaderScrollEngine.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
  })

  it('monta corretamente sem erros com documento vazio', () => {
    const wrapper = mount(ReaderScrollEngine)
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.reader-scroll-engine').exists()).toBe(true)
  })

  it('renderiza os slots de página para documento PDF', () => {
    const store = useReaderStore()
    const doc = createMockPdfDocument(4)
    store.setDocument(doc, 'teste.pdf')

    const wrapper = mount(ReaderScrollEngine)
    const slots = wrapper.findAll('.scroll-page-slot')
    expect(slots.length).toBe(4)
    expect(slots[0]?.attributes('data-page-number')).toBe('1')
    expect(slots[3]?.attributes('data-page-number')).toBe('4')
  })

  it('renderiza os slots de seção para documento EPUB contínuo e aciona renderSectionContinuous', async () => {
    const store = useReaderStore()
    const doc = createMockEpubDocument(3)
    store.setDocument(doc, 'teste.epub')

    const wrapper = mount(ReaderScrollEngine)
    const sections = wrapper.findAll('.scroll-section-slot')
    expect(sections.length).toBe(3)
    expect(sections[0]?.attributes('data-section-index')).toBe('0')
    expect(sections[2]?.attributes('data-section-index')).toBe('2')
    expect(doc.renderSectionContinuous).toHaveBeenCalled()
  })

  it('expõe método scrollToPage', () => {
    const wrapper = mount(ReaderScrollEngine)
    expect(typeof wrapper.vm.scrollToPage).toBe('function')
  })
})
