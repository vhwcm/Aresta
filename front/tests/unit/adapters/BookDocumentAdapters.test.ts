import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createBookDocument } from '../../../app/adapters/BookDocumentFactory'
import { PdfDocumentAdapter } from '../../../app/adapters/PdfDocumentAdapter'
import { EpubDocumentAdapter } from '../../../app/adapters/EpubDocumentAdapter'

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
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
        getViewport: () => ({ width: 600, height: 800 }),
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
      expect(pageData.width).toBe(600)
      expect(pageData.height).toBe(800)
      expect(pageData.aspectRatio).toBe(600 / 800)

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
      expect(adapter.totalPages).toBe(1)
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
  })
})
