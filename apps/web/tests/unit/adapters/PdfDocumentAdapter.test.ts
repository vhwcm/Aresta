import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createBookDocument } from '../../../app/adapters/BookDocumentFactory'
import { PdfDocumentAdapter } from '../../../app/adapters/PdfDocumentAdapter'

vi.mock('pdfjs-dist', () => ({
  TextLayer: class MockTextLayer {
    render() {
      return Promise.resolve()
    }
  },
  GlobalWorkerOptions: { workerSrc: '' },
  version: '6.1.200',
}))

describe('PdfDocumentAdapter', () => {
  let adapter: PdfDocumentAdapter

  beforeEach(() => {
    adapter = new PdfDocumentAdapter()
  })

  it('1. Deve ser instanciado via BookDocumentFactory com tipo pdf', () => {
    const doc = createBookDocument('pdf')
    expect(doc).toBeInstanceOf(PdfDocumentAdapter)
    expect(doc.type).toBe('pdf')
    expect(doc.isLoaded).toBe(false)
  })

  it('2. getAspectRatio deve retornar 0.707 por padrão antes do carregamento', () => {
    expect(adapter.getAspectRatio()).toBeCloseTo(0.707, 2)
  })

  it('3. Deve lançar erro se getPage for chamado sem carregar o documento', async () => {
    await expect(adapter.getPage(1)).rejects.toThrow('PDF não carregado')
  })

  it('4. Deve lançar erro se renderTextLayer for chamado sem carregar o documento', async () => {
    const container = document.createElement('div')
    await expect(adapter.renderTextLayer(1, container)).rejects.toThrow('PDF não carregado')
  })

  it('5. renderTextLayer deve criar sub-div com classe .textLayer e aplicar escala proporcional', async () => {
    // Mock interno de _pdfDocument
    const mockPage = {
      getViewport: vi.fn(({ scale, offsetX, offsetY }) => ({
        width: 600 * scale,
        height: 800 * scale,
        scale,
        offsetX: offsetX || 0,
        offsetY: offsetY || 0,
        rotation: 0,
        rawDims: { pageWidth: 600, pageHeight: 800, pageX: 0, pageY: 0 },
      })),
      getTextContent: vi.fn(async () => ({
        items: [{ str: 'POLÍCIA FEDERAL' }, { str: 'EDITAL N 9' }],
      })),
    }

    ;(adapter as any)._pdfDocument = {
      numPages: 10,
      getPage: vi.fn(async () => mockPage),
      destroy: vi.fn(),
    }
    ;(adapter as any)._totalPages = 10
    ;(adapter as any)._isLoaded = true
    ;(adapter as any)._defaultAspectRatio = 600 / 800

    const container = document.createElement('div')
    container.className = 'page-text-layer'

    await adapter.renderTextLayer(1, container, 300, 400)

    // O container deve conter a sub-div .textLayer
    const textLayerDiv = container.querySelector('.textLayer') as HTMLElement
    expect(textLayerDiv).not.toBeNull()
    expect(textLayerDiv.style.width).toBe('300px')
    expect(textLayerDiv.style.height).toBe('400px')
    expect(textLayerDiv.style.getPropertyValue('--scale-factor')).toBe('0.5')
  })

  it('6. renderTextLayer e getPage devem calcular offset de centralização quando houver sobra de espaço', async () => {
    const mockPage = {
      getViewport: vi.fn(({ scale, offsetX, offsetY }) => ({
        width: 600 * scale,
        height: 800 * scale,
        scale,
        offsetX: offsetX || 0,
        offsetY: offsetY || 0,
        rotation: 0,
        rawDims: { pageWidth: 600, pageHeight: 800, pageX: 0, pageY: 0 },
      })),
      getTextContent: vi.fn(async () => ({
        items: [{ str: 'Teste Centralização' }],
      })),
      render: vi.fn(() => ({
        promise: Promise.resolve(),
      })),
    }

    ;(adapter as any)._pdfDocument = {
      numPages: 5,
      getPage: vi.fn(async () => mockPage),
      destroy: vi.fn(),
    }
    ;(adapter as any)._totalPages = 5
    ;(adapter as any)._isLoaded = true

    // Largura alvo maior que a proporção 600x800 -> 500x400 (onde 400h limita a 300w, sobrando 200px na largura)
    const container = document.createElement('div')
    await adapter.renderTextLayer(1, container, 500, 400)

    const textLayerDiv = container.querySelector('.textLayer') as HTMLElement
    expect(textLayerDiv).not.toBeNull()
    // 500 - 300 = 200px de sobra -> 100px para cada lado
    expect(textLayerDiv.style.left).toBe('100px')
  })

  it('7. getPage deve suportar DPR alto (até 4) permitindo zoom nítido no navegador', async () => {
    const originalDpr = window.devicePixelRatio
    try {
      Object.defineProperty(window, 'devicePixelRatio', { value: 3.5, configurable: true })
      const mockPage = {
        getViewport: vi.fn(({ scale }) => ({
          width: 600 * scale,
          height: 800 * scale,
          scale,
        })),
        render: vi.fn(() => ({ promise: Promise.resolve() })),
      }
      ;(adapter as any)._pdfDocument = {
        getPage: vi.fn(async () => mockPage),
      }
      ;(adapter as any)._isLoaded = true

      const pageData = await adapter.getPage(1, 600)
      // Com baseWidth = 600, targetWidth = 600 e dpr = 3.5: scale deve ser (600 * 3.5) / 600 = 3.5
      expect(mockPage.getViewport).toHaveBeenCalledWith(expect.objectContaining({ scale: 3.5 }))
      expect(pageData.width).toBe(600 * 3.5)
    } finally {
      Object.defineProperty(window, 'devicePixelRatio', { value: originalDpr, configurable: true })
    }
  })
})
