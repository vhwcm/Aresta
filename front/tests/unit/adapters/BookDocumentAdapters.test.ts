import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createBookDocument } from '../../../app/adapters/BookDocumentFactory'
import { PdfDocumentAdapter } from '../../../app/adapters/PdfDocumentAdapter'
import { EpubDocumentAdapter } from '../../../app/adapters/EpubDocumentAdapter'

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  version: '6.1.200',
  GlobalWorkerOptions: { workerSrc: '' },
  TextLayer: class MockTextLayer {
    options: any
    constructor(options: any) {
      this.options = options
    }
    render() {
      if (this.options?.container) {
        const span = document.createElement('span')
        span.textContent = 'Texto do PDF renderizado no TextLayer'
        this.options.container.appendChild(span)
      }
      return Promise.resolve()
    }
  },
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 10,
      getMetadata: () => Promise.resolve({ info: { Title: 'PDF de Teste', Author: 'Autor Teste' } }),
      getPage: (pageNo: number) => Promise.resolve({
        getViewport: ({ scale = 1 }: { scale?: number } = {}) => ({ width: 600 * scale, height: 800 * scale }),
        render: () => ({ promise: Promise.resolve() }),
        getTextContent: () => Promise.resolve({ items: [{ str: 'Texto do PDF de teste' }] })
      }),
      destroy: vi.fn()
    })
  }))
}))

// Mock fflate
vi.mock('fflate', () => ({
  unzipSync: vi.fn(() => ({}))
}))

// Mock foliate-js/epub.js
vi.mock('foliate-js/epub.js', () => {
  return {
    EPUB: class MockEPUB {
      metadata = { title: 'EPUB de Teste', creator: 'Autor EPUB' }
      sections = [{ id: 'sec1', linear: true, createDocument: () => Promise.resolve({ body: '<div>Test</div>' }) }]
      init() {
        return Promise.resolve()
      }
    }
  }
})

describe('Book Document Adapters and Factory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('BookDocumentFactory', () => {
    it('creates PdfDocumentAdapter for pdf type', () => {
      const adapter = createBookDocument('pdf')
      expect(adapter).toBeInstanceOf(PdfDocumentAdapter)
      expect(adapter.type).toBe('pdf')
    })

    it('creates EpubDocumentAdapter for epub type', () => {
      const adapter = createBookDocument('epub')
      expect(adapter).toBeInstanceOf(EpubDocumentAdapter)
      expect(adapter.type).toBe('epub')
    })

    it('throws error for unsupported type', () => {
      expect(() => createBookDocument('invalid' as any)).toThrow(/Formato não suportado/)
    })
  })

  describe('PdfDocumentAdapter', () => {
    it('loads document from ArrayBuffer correctly', async () => {
      const adapter = new PdfDocumentAdapter()
      expect(adapter.isLoaded).toBe(false)

      const buffer = new ArrayBuffer(8)
      await adapter.load(buffer, 'meu_livro.pdf')

      expect(adapter.isLoaded).toBe(true)
      expect(adapter.totalPages).toBe(10)
      expect(adapter.metadata.title).toBe('PDF de Teste')
      expect(adapter.metadata.author).toBe('Autor Teste')

      const pageData = await adapter.getPage(1)
      expect(pageData.width).toBeGreaterThan(0)
      expect(pageData.height).toBeGreaterThan(0)
      expect(pageData.aspectRatio).toBeCloseTo(600 / 800)

      const text = await adapter.getTextContent(1)
      expect(text).toBe('Texto do PDF de teste')

      adapter.destroy()
      expect(adapter.isLoaded).toBe(false)
    })

    it('renders text layer to a DOM container', async () => {
      const adapter = new PdfDocumentAdapter()
      const buffer = new ArrayBuffer(8)
      await adapter.load(buffer, 'meu_livro.pdf')

      const container = document.createElement('div')
      await adapter.renderTextLayer(1, container, 600, 800)

      expect(container.children.length).toBeGreaterThan(0)
      expect(container.textContent).toContain('Texto do PDF')
    })

    it('loads document from File correctly', async () => {
      const adapter = new PdfDocumentAdapter()
      const file = new File(['fake content'], 'exemplo.pdf', { type: 'application/pdf' })

      await adapter.load(file)
      expect(adapter.isLoaded).toBe(true)
      expect(adapter.metadata.title).toBe('PDF de Teste')
    })
  })

  describe('EpubDocumentAdapter', () => {
    it('loads epub document from ArrayBuffer correctly', async () => {
      const adapter = new EpubDocumentAdapter()
      expect(adapter.isLoaded).toBe(false)

      const buffer = new ArrayBuffer(8)
      await adapter.load(buffer, 'meu_livro.epub')

      expect(adapter.isLoaded).toBe(true)
      expect(adapter.totalPages).toBeGreaterThanOrEqual(1)
      expect(adapter.metadata.title).toBe('EPUB de Teste')
      expect(adapter.metadata.author).toBe('Autor EPUB')

      const text = await adapter.getTextContent(1)
      expect(typeof text).toBe('string')

      const container = document.createElement('div')
      await adapter.renderTextLayer(1, container, 600, 900)
      expect(container.children.length).toBeGreaterThan(0)

      adapter.destroy()
      expect(adapter.isLoaded).toBe(false)
    })

    it('handles multi-page sections with column pagination', async () => {
      const adapter = new EpubDocumentAdapter()
      const longText = 'Parágrafo de teste com muito conteúdo. '.repeat(100)
      const mockEpubInstance = {
        metadata: { title: 'Livro Longo', creator: 'Autor' },
        sections: [
          {
            id: 'chap1',
            linear: true,
            createDocument: () => Promise.resolve({
              body: { innerHTML: `<p>${longText}</p>`, textContent: longText }
            })
          }
        ],
        init: () => Promise.resolve()
      }

      // Mock temporário para esta seção longa
      const foliateMod: any = await import('foliate-js/epub.js')
      const EPUB = foliateMod.EPUB || foliateMod.default || foliateMod.Book
      const origEPUB = (EPUB as any)
      vi.spyOn(origEPUB.prototype, 'init').mockImplementation(function (this: any) {
        this.metadata = mockEpubInstance.metadata
        this.sections = mockEpubInstance.sections
        return Promise.resolve()
      })

      const buffer = new ArrayBuffer(16)
      await adapter.load(buffer, 'longo.epub')

      expect(adapter.totalPages).toBeGreaterThan(1)
      const page1Text = await adapter.getTextContent(1)
      const page2Text = await adapter.getTextContent(2)
      expect(page1Text).toBeTruthy()
      expect(page2Text).toBeTruthy()

      const container = document.createElement('div')
      await adapter.renderTextLayer(2, container, 800, 1200)
      expect(container.children.length).toBeGreaterThan(0)
      const content = container.querySelector('.epub-text-layer-content') as HTMLElement
      expect(content).not.toBeNull()
      expect(content.style.marginLeft).toBe('-800px')

      adapter.destroy()
      expect(adapter.isLoaded).toBe(false)
    })
  })
})
