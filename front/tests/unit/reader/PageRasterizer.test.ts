import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  applyThemeToCanvas,
  drawPlainTextToCanvas,
  rasterizeElementToCanvas,
} from '~/utils/pageRasterizer'

describe('pageRasterizer - Rasterização de Texturas 3D', () => {
  let mockCtx: any

  beforeEach(() => {
    mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      drawImage: vi.fn(),
      measureText: vi.fn((text: string) => ({ width: text.length * 8 })),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray([255, 255, 255, 255]),
        width: 1,
        height: 1,
      })),
      putImageData: vi.fn(),
      fillStyle: '',
      font: '',
      globalCompositeOperation: 'source-over',
    }

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (contextId: string) {
      if (contextId === '2d') return mockCtx
      return null
    } as any)
  })

  it('aplica tema sepia com globalCompositeOperation multiply', () => {
    const canvas = document.createElement('canvas')
    applyThemeToCanvas(mockCtx, 400, 600, 'sepia')

    expect(mockCtx.save).toHaveBeenCalled()
    expect(mockCtx.restore).toHaveBeenCalled()
    expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 400, 600)
    expect(mockCtx.fillStyle).toBe('#f5eedc')
    expect(mockCtx.globalCompositeOperation).toBe('multiply')
  })

  it('aplica tema black invertendo os pixels do canvas', () => {
    const fakeImageData = {
      data: new Uint8ClampedArray([255, 255, 255, 255]),
      width: 1,
      height: 1,
    } as ImageData

    mockCtx.getImageData.mockReturnValue(fakeImageData)

    applyThemeToCanvas(mockCtx, 10, 10, 'black')

    expect(mockCtx.putImageData).toHaveBeenCalled()
    // 255 invertido vira 0 -> transformado para cor de fundo escuro (~18)
    expect(fakeImageData.data[0]).toBe(18)
    expect(fakeImageData.data[1]).toBe(18)
    expect(fakeImageData.data[2]).toBe(20)
  })

  it('drawPlainTextToCanvas desenha texto com quebra de linhas e preenche fundo', () => {
    const targetCanvas = document.createElement('canvas')

    const sampleText = 'Capítulo Primeiro\nEra uma vez um leitor imersivo que folheava páginas tridimensionais com máxima fidelidade e desempenho.'
    drawPlainTextToCanvas(targetCanvas, sampleText, 400, 600, 'sepia')

    expect(mockCtx.fillRect).toHaveBeenCalled()
    expect(mockCtx.fillText).toHaveBeenCalled()
    // Deve ter chamado fillText pelo menos 2 vezes (título + parágrafo)
    expect(mockCtx.fillText.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('rasterizeElementToCanvas desenha canvas PDF diretamente quando fornecido', () => {
    const targetCanvas = document.createElement('canvas')

    const pdfCanvas = document.createElement('canvas')
    pdfCanvas.width = 800
    pdfCanvas.height = 1200

    const containerEl = document.createElement('div')

    rasterizeElementToCanvas(containerEl, targetCanvas, 400, 600, 'sepia', pdfCanvas)

    expect(mockCtx.drawImage).toHaveBeenCalledWith(pdfCanvas, 0, 0, targetCanvas.width, targetCanvas.height)
  })

  it('rasterizeElementToCanvas extrai e desenha texto de elementos DOM', () => {
    const targetCanvas = document.createElement('canvas')

    const containerEl = document.createElement('div')
    const h1 = document.createElement('h1')
    h1.textContent = 'Memórias Póstumas'
    const p = document.createElement('p')
    p.textContent = 'Ao verme que primeiro roeu as frias carnes do meu cadáver dedico como saudosa lembrança.'

    containerEl.appendChild(h1)
    containerEl.appendChild(p)

    rasterizeElementToCanvas(containerEl, targetCanvas, 400, 600, 'white')

    expect(mockCtx.fillText).toHaveBeenCalled()
    const allDrawnText = mockCtx.fillText.mock.calls.map((c: any[]) => c[0]).join(' ')
    expect(allDrawnText).toContain('Memórias Póstumas')
  })
})
