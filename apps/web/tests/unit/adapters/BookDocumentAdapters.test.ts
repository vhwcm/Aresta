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

      const pageData = await adapter.getPage(1, 600, 900)
      expect(pageData.width).toBeGreaterThan(0)
      expect(pageData.height).toBeGreaterThan(0)
      const canvas = document.createElement('canvas')
      canvas.width = 600
      canvas.height = 900
      const mockCtx = {
        canvas,
        drawImage: vi.fn(),
        fillStyle: '',
        fillRect: vi.fn(),
      } as any
      await expect(pageData.render(mockCtx)).resolves.not.toThrow()
      expect(mockCtx.drawImage).toHaveBeenCalled()

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

    it('dynamically adjusts font size, repaginates and preserves position', async () => {
      const adapter = new EpubDocumentAdapter()
      const longText = 'Texto longo para validação de mudança dinâmica de fonte. '.repeat(80)
      const mockEpubInstance = {
        metadata: { title: 'Livro Fonte', creator: 'Autor' },
        sections: [
          {
            id: 'sec1',
            linear: true,
            createDocument: () => Promise.resolve({
              body: { innerHTML: `<p>${longText}</p>`, textContent: longText }
            })
          },
          {
            id: 'sec2',
            linear: true,
            createDocument: () => Promise.resolve({
              body: { innerHTML: `<p>${longText}</p>`, textContent: longText }
            })
          }
        ],
        init: () => Promise.resolve()
      }

      const foliateMod: any = await import('foliate-js/epub.js')
      const EPUB = foliateMod.EPUB || foliateMod.default || foliateMod.Book
      const origEPUB = (EPUB as any)
      vi.spyOn(origEPUB.prototype, 'init').mockImplementation(function (this: any) {
        this.metadata = mockEpubInstance.metadata
        this.sections = mockEpubInstance.sections
        return Promise.resolve()
      })

      const buffer = new ArrayBuffer(16)
      await adapter.load(buffer, 'fonte.epub')

      expect(adapter.fontSize).toBe(18)
      const initialPages = adapter.totalPages
      expect(initialPages).toBeGreaterThanOrEqual(2)

      // Aumentar tamanho da fonte para 28px
      const newPage = adapter.setFontSize(28, 2)
      expect(adapter.fontSize).toBe(28)
      // Maior fonte resulta em igual ou mais páginas
      expect(adapter.totalPages).toBeGreaterThanOrEqual(initialPages)
      expect(newPage).toBeGreaterThanOrEqual(1)

      // Diminuir tamanho da fonte para 14px
      const smallFontPage = adapter.setFontSize(14, newPage)
      expect(adapter.fontSize).toBe(14)
      expect(smallFontPage).toBeGreaterThanOrEqual(1)

      // Testar troca dinâmica de família de fontes
      expect(adapter.fontFamily).toContain('Newsreader')
      const fontPage = adapter.setFontFamily("'Literata', Georgia, serif", smallFontPage)
      expect(adapter.fontFamily).toBe("'Literata', Georgia, serif")
      expect(fontPage).toBeGreaterThanOrEqual(1)
      expect(adapter.totalPages).toBeGreaterThanOrEqual(1)

      const container = document.createElement('div')
      await adapter.renderTextLayer(1, container, 800, 1200)
      const content = container.querySelector('.epub-text-layer-content') as HTMLElement
      expect(content.style.fontFamily).toContain('Literata')

      adapter.destroy()
    })

    it('preserves chapter headings and embedded styles in renderTextLayer', async () => {
      const adapter = new EpubDocumentAdapter()
      const chapterHtml = '<h1 class="chapter-title">Capítulo I: O Começo</h1><p>Era uma vez...</p>'
      const mockEpubInstance = {
        metadata: { title: 'Livro Capítulos', creator: 'Autor' },
        sections: [
          {
            id: 'sec1',
            linear: true,
            createDocument: () => Promise.resolve({
              head: {
                querySelectorAll: () => [{ innerHTML: '.chapter-title { color: #333; }' }]
              },
              body: { innerHTML: chapterHtml, textContent: 'Capítulo I: O Começo Era uma vez...' },
              querySelectorAll: (selector: string) => selector === 'style' ? [{ innerHTML: '.chapter-title { color: #333; }' }] : []
            })
          }
        ],
        init: () => Promise.resolve()
      }

      const foliateMod: any = await import('foliate-js/epub.js')
      const EPUB = foliateMod.EPUB || foliateMod.default || foliateMod.Book
      const origEPUB = (EPUB as any)
      vi.spyOn(origEPUB.prototype, 'init').mockImplementation(function (this: any) {
        this.metadata = mockEpubInstance.metadata
        this.sections = mockEpubInstance.sections
        return Promise.resolve()
      })

      const buffer = new ArrayBuffer(16)
      await adapter.load(buffer, 'capitulos.epub')

      const container = document.createElement('div')
      await adapter.renderTextLayer(1, container, 800, 1200)

      const heading = container.querySelector('h1.chapter-title')
      expect(heading).not.toBeNull()
      expect(heading?.textContent).toBe('Capítulo I: O Começo')

      const styleTag = container.querySelector('style')
      expect(styleTag).not.toBeNull()
      expect(styleTag?.innerHTML).toContain('.chapter-title')

      adapter.destroy()
    })

    it('inlines external CSS stylesheets and resolves image URLs to Base64 Data URIs', async () => {
      const adapter = new EpubDocumentAdapter()
      const mockCssText = '.colored-heading { color: #2980b9; font-weight: bold; } .tag { color: #e74c3c; background: #fff3cd; }'
      const mockCssBytes = new TextEncoder().encode(mockCssText)
      const mockPngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01])

      const { unzipSync } = await import('fflate')
      vi.mocked(unzipSync).mockReturnValueOnce({
        'OEBPS/Styles/style.css': mockCssBytes,
        'OEBPS/Images/diagram.png': mockPngBytes,
      } as any)

      // Cria um Document DOM real para a seção
      const sectionDoc = document.implementation.createHTMLDocument('Capítulo com Imagens e Cores')
      sectionDoc.head.innerHTML = '<link rel="stylesheet" href="../Styles/style.css" />'
      sectionDoc.body.innerHTML = `
        <h1 class="colored-heading">Seção Ilustrada</h1>
        <p>Texto com <span class="tag">destaque colorido</span>.</p>
        <img src="../Images/diagram.png" alt="Diagrama" />
      `

      const mockEpubInstance = {
        metadata: { title: 'Livro Cores e Imagens', creator: 'Autor' },
        sections: [
          {
            id: 'OEBPS/Text/chapter1.xhtml',
            linear: true,
            createDocument: () => Promise.resolve(sectionDoc)
          }
        ],
        init: () => Promise.resolve()
      }

      const foliateMod: any = await import('foliate-js/epub.js')
      const EPUB = foliateMod.EPUB || foliateMod.default || foliateMod.Book
      const origEPUB = (EPUB as any)
      vi.spyOn(origEPUB.prototype, 'init').mockImplementation(function (this: any) {
        this.metadata = mockEpubInstance.metadata
        this.sections = mockEpubInstance.sections
        return Promise.resolve()
      })

      const buffer = new ArrayBuffer(16)
      await adapter.load(buffer, 'ilustrado.epub')

      const container = document.createElement('div')
      await adapter.renderTextLayer(1, container, 800, 1200)

      // Verifica se o CSS externo foi inlinado e as cores preservadas
      const styleTag = container.querySelector('style')
      expect(styleTag).not.toBeNull()
      expect(styleTag?.innerHTML).toContain('.colored-heading')
      expect(styleTag?.innerHTML).toContain('#2980b9')
      expect(styleTag?.innerHTML).toContain('.tag')
      expect(styleTag?.innerHTML).toContain('#e74c3c')

      // Verifica se a imagem relativa foi resolvida para Data URI base64
      const img = container.querySelector('img')
      expect(img).not.toBeNull()
      expect(img?.getAttribute('src')).toMatch(/^data:image\/png;base64,/)

      adapter.destroy()
    })

    it('identifies existing cover section and keeps it as page 1', async () => {
      const adapter = new EpubDocumentAdapter()
      const coverDoc = document.implementation.createHTMLDocument('Capa')
      coverDoc.body.innerHTML = '<div class="cover"><img src="cover.jpg" alt="Cover" /></div>'
      const chapDoc = document.implementation.createHTMLDocument('Capítulo 1')
      chapDoc.body.innerHTML = '<h1>Capítulo 1</h1><p>Início da história.</p>'

      const mockEpubInstance = {
        metadata: { title: 'Livro Com Capa Nativa', creator: 'Autor' },
        sections: [
          {
            id: 'cover.xhtml',
            linear: 'no',
            createDocument: () => Promise.resolve(coverDoc),
          },
          {
            id: 'chapter1.xhtml',
            linear: true,
            createDocument: () => Promise.resolve(chapDoc),
          },
        ],
        init: () => Promise.resolve(),
      }

      const foliateMod: any = await import('foliate-js/epub.js')
      const EPUB = foliateMod.EPUB || foliateMod.default || foliateMod.Book
      const origEPUB = (EPUB as any)
      vi.spyOn(origEPUB.prototype, 'init').mockImplementation(function (this: any) {
        this.metadata = mockEpubInstance.metadata
        this.sections = mockEpubInstance.sections
        return Promise.resolve()
      })

      const buffer = new ArrayBuffer(16)
      await adapter.load(buffer, 'com-capa.epub')

      expect(adapter.totalPages).toBeGreaterThanOrEqual(2)

      const container = document.createElement('div')
      await adapter.renderTextLayer(1, container, 800, 1200)

      const content = container.querySelector('.epub-text-layer-content') as HTMLElement
      expect(content).not.toBeNull()
      expect(content.classList.contains('epub-cover-page')).toBe(true)

      adapter.destroy()
    })

    it('injects synthetic cover page as page 1 when cover image is available', async () => {
      const adapter = new EpubDocumentAdapter()
      const chapDoc = document.implementation.createHTMLDocument('Capítulo 1')
      chapDoc.body.innerHTML = '<h1>Capítulo 1</h1><p>Era uma vez.</p>'

      const fakeCoverBlob = new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/jpeg' })

      const mockEpubInstance = {
        metadata: { title: 'Livro Sem Secao Capa', creator: 'Autor' },
        sections: [
          {
            id: 'chap1.xhtml',
            linear: true,
            createDocument: () => Promise.resolve(chapDoc),
          },
        ],
        getCover: () => Promise.resolve(fakeCoverBlob),
        init: () => Promise.resolve(),
      }

      const foliateMod: any = await import('foliate-js/epub.js')
      const EPUB = foliateMod.EPUB || foliateMod.default || foliateMod.Book
      const origEPUB = (EPUB as any)
      vi.spyOn(origEPUB.prototype, 'init').mockImplementation(function (this: any) {
        this.metadata = mockEpubInstance.metadata
        this.sections = mockEpubInstance.sections
        this.getCover = mockEpubInstance.getCover
        return Promise.resolve()
      })

      const buffer = new ArrayBuffer(16)
      await adapter.load(buffer, 'sem-secao-capa.epub')

      expect(adapter.metadata.coverUrl).toBeTruthy()
      expect(adapter.totalPages).toBeGreaterThanOrEqual(2)

      const container = document.createElement('div')
      await adapter.renderTextLayer(1, container, 800, 1200)

      const coverImg = container.querySelector('img')
      expect(coverImg).not.toBeNull()
      expect(coverImg?.getAttribute('src')).toMatch(/^data:image\/jpeg;base64,/)

      adapter.destroy()
    })

    it('injects synthetic cover page from passed fallback coverUrl parameter', async () => {
      const adapter = new EpubDocumentAdapter()
      const chapDoc = document.implementation.createHTMLDocument('Capítulo 1')
      chapDoc.body.innerHTML = '<h1>Capítulo 1</h1><p>Sem capa interna.</p>'

      const mockEpubInstance = {
        metadata: { title: 'Livro URL Capa', creator: 'Autor' },
        sections: [
          {
            id: 'chap1.xhtml',
            linear: true,
            createDocument: () => Promise.resolve(chapDoc),
          },
        ],
        getCover: () => Promise.resolve(null),
        init: () => Promise.resolve(),
      }

      const foliateMod: any = await import('foliate-js/epub.js')
      const EPUB = foliateMod.EPUB || foliateMod.default || foliateMod.Book
      const origEPUB = (EPUB as any)
      vi.spyOn(origEPUB.prototype, 'init').mockImplementation(function (this: any) {
        this.metadata = mockEpubInstance.metadata
        this.sections = mockEpubInstance.sections
        this.getCover = mockEpubInstance.getCover
        return Promise.resolve()
      })

      const buffer = new ArrayBuffer(16)
      await adapter.load(buffer, 'url-capa.epub', 18, undefined, 'http://localhost:7070/api/books/42/cover')

      expect(adapter.metadata.coverUrl).toBe('http://localhost:7070/api/books/42/cover')
      expect(adapter.totalPages).toBeGreaterThanOrEqual(2)

      const container = document.createElement('div')
      await adapter.renderTextLayer(1, container, 800, 1200)

      const coverImg = container.querySelector('img')
      expect(coverImg).not.toBeNull()
      expect(coverImg?.getAttribute('src')).toBe('http://localhost:7070/api/books/42/cover')

      adapter.destroy()
    })
  })
})
