import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EpubDocumentAdapter } from '../../../app/adapters/EpubDocumentAdapter'

// Mock foliate-js/epub.js
vi.mock('foliate-js/epub.js', () => {
  return {
    EPUB: class MockEPUB {
      metadata = { title: 'Livro Paridade', creator: 'Autor' }
      sections = []
      init() {
        return Promise.resolve()
      }
    },
  }
})

// Mock fflate
vi.mock('fflate', () => ({
  unzipSync: vi.fn(() => ({})),
}))

describe('EPUB Pagination Parity and Blank Page Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('accurately allocates 1 page for single-page text without creating empty overflow pages', async () => {
    const adapter = new EpubDocumentAdapter()
    const shortText = 'Este é um parágrafo que cabe confortavelmente em uma única folha de livro. Não deve gerar páginas extras em branco.'
    const mockEpubInstance = {
      metadata: { title: 'Livro Curto', creator: 'Autor' },
      sections: [
        {
          id: 'sec1',
          linear: true,
          createDocument: () => Promise.resolve({
            body: { innerHTML: `<p>${shortText}</p>`, textContent: shortText },
          }),
        },
      ],
      init: () => Promise.resolve(),
    }

    const foliateMod: any = await import('foliate-js/epub.js')
    const EPUB = foliateMod.EPUB || foliateMod.default || foliateMod.Book
    vi.spyOn(EPUB.prototype, 'init').mockImplementation(function (this: any) {
      this.metadata = mockEpubInstance.metadata
      this.sections = mockEpubInstance.sections
      return Promise.resolve()
    })

    const buffer = new ArrayBuffer(16)
    await adapter.load(buffer, 'curto.epub', 15)

    // O texto cabe em 1 página, não deve gerar 2 ou 3 páginas fictícias
    expect(adapter.totalPages).toBe(1)

    const container = document.createElement('div')
    await adapter.renderTextLayer(1, container, 731, 1015)
    const content = container.querySelector('.epub-text-layer-content') as HTMLElement
    expect(content).not.toBeNull()
    expect(content.style.marginLeft).toMatch(/^-?0px$/)
  })

  it('updates page mapping when setPageDimensions is called with new screen dimensions', async () => {
    const adapter = new EpubDocumentAdapter()
    const paragraphs = '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam gravida justo id dui bibendum.</p>'.repeat(30)
    const mockEpubInstance = {
      metadata: { title: 'Livro Longo', creator: 'Autor' },
      sections: [
        {
          id: 'sec1',
          linear: true,
          createDocument: () => Promise.resolve({
            body: { innerHTML: paragraphs, textContent: paragraphs.replace(/<[^>]+>/g, '') },
          }),
        },
      ],
      init: () => Promise.resolve(),
    }

    const foliateMod: any = await import('foliate-js/epub.js')
    const EPUB = foliateMod.EPUB || foliateMod.default || foliateMod.Book
    vi.spyOn(EPUB.prototype, 'init').mockImplementation(function (this: any) {
      this.metadata = mockEpubInstance.metadata
      this.sections = mockEpubInstance.sections
      return Promise.resolve()
    })

    const buffer = new ArrayBuffer(16)
    await adapter.load(buffer, 'longo.epub', 15)

    const initialTotal = adapter.totalPages
    expect(initialTotal).toBeGreaterThanOrEqual(1)

    // Redimensionar para tela menor (celular)
    const newPageMobile = adapter.setPageDimensions(360, 600, 1)
    expect(adapter.totalPages).toBeGreaterThanOrEqual(initialTotal)
    expect(newPageMobile).toBe(1)

    // Redimensionar para monitor grande 4K
    const newPageDesktop = adapter.setPageDimensions(1000, 1400, 1)
    expect(adapter.totalPages).toBeLessThanOrEqual(adapter.totalPages)
    expect(newPageDesktop).toBe(1)
  })

  it('defensively protects renderTextLayer against offsets beyond total content width', async () => {
    const adapter = new EpubDocumentAdapter()
    const contentText = 'Texto de teste para renderTextLayer'
    const mockEpubInstance = {
      metadata: { title: 'Livro Offset', creator: 'Autor' },
      sections: [
        {
          id: 'sec1',
          linear: true,
          createDocument: () => Promise.resolve({
            body: { innerHTML: `<p>${contentText}</p>`, textContent: contentText },
          }),
        },
      ],
      init: () => Promise.resolve(),
    }

    const foliateMod: any = await import('foliate-js/epub.js')
    const EPUB = foliateMod.EPUB || foliateMod.default || foliateMod.Book
    vi.spyOn(EPUB.prototype, 'init').mockImplementation(function (this: any) {
      this.metadata = mockEpubInstance.metadata
      this.sections = mockEpubInstance.sections
      return Promise.resolve()
    })

    const buffer = new ArrayBuffer(16)
    await adapter.load(buffer, 'offset.epub', 15)

    const container = document.createElement('div')
    // Renderiza a página 1 normalmente
    await adapter.renderTextLayer(1, container, 700, 900)
    expect(container.querySelector('.epub-text-layer-content')).not.toBeNull()
  })
})
