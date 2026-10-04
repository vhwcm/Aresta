import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PdfPageGeometry } from '../../../app/utils/reader/pdf/pdfPageGeometry'
import { PdfRenderWindow, type RenderTaskLike } from '../../../app/utils/reader/pdf/pdfRenderWindow'

describe('PdfPageGeometry', () => {
  let mockDoc: any

  beforeEach(() => {
    mockDoc = {
      numPages: 25,
      getPage: vi.fn(async (pageNumber: number) => ({
        getViewport: ({ scale }: { scale: number }) => ({
          width: 600 * scale,
          height: 800 * scale
        })
      }))
    }
  })

  it('1. Deve calcular e armazenar em cache a geometria da página', async () => {
    const geometry = new PdfPageGeometry(mockDoc)
    expect(geometry.totalPages).toBe(25)
    expect(geometry.getAspectRatio(1)).toBe(0.75) // default antes de carregar

    const geom = await geometry.loadPageGeometry(1)
    expect(geom.width).toBe(600)
    expect(geom.height).toBe(800)
    expect(geom.aspectRatio).toBe(0.75)
    expect(geometry.getAspectRatio(1)).toBe(0.75)
    expect(mockDoc.getPage).toHaveBeenCalledTimes(1)

    // Segunda chamada deve vir do cache
    const cached = await geometry.loadPageGeometry(1)
    expect(cached).toBe(geom)
    expect(mockDoc.getPage).toHaveBeenCalledTimes(1)
  })

  it('2. Deve carregar lote de páginas sem duplicar requisições', async () => {
    const geometry = new PdfPageGeometry(mockDoc)
    const batch = await geometry.loadBatch(1, 10)
    expect(batch).toHaveLength(10)
    expect(mockDoc.getPage).toHaveBeenCalledTimes(10)

    // Carregar lote sobreposto
    const batch2 = await geometry.loadBatch(5, 10)
    expect(batch2).toHaveLength(10)
    // Apenas páginas 11 a 14 foram requisitadas adicionalmente
    expect(mockDoc.getPage).toHaveBeenCalledTimes(14)
  })

  it('3. Deve usar fallback gracioso se getPage falhar', async () => {
    mockDoc.getPage = vi.fn().mockRejectedValue(new Error('Falha no PDF'))
    const geometry = new PdfPageGeometry(mockDoc)
    const geom = await geometry.loadPageGeometry(1)
    expect(geom.width).toBe(600)
    expect(geom.height).toBe(800)
    expect(geom.aspectRatio).toBe(0.75)
  })
})

describe('PdfRenderWindow', () => {
  let window: PdfRenderWindow

  beforeEach(() => {
    window = new PdfRenderWindow(20, 6)
  })

  it('1. Deve calcular janelas highRes (±1) e idle (±2) respeitando limites', () => {
    window.setCurrentPage(1)
    expect(window.highResRange).toEqual([1, 2])
    expect(window.idleRange).toEqual([1, 3])

    window.setCurrentPage(10)
    expect(window.highResRange).toEqual([9, 11])
    expect(window.idleRange).toEqual([8, 12])

    window.setCurrentPage(20)
    expect(window.highResRange).toEqual([19, 20])
    expect(window.idleRange).toEqual([18, 20])
  })

  it('2. Deve gerenciar LRU de no máximo 6 canvases descartando os mais antigos', () => {
    const createMockCanvas = () => {
      const canvas = {
        width: 100,
        height: 100,
        getContext: vi.fn(() => ({
          clearRect: vi.fn()
        }))
      } as unknown as HTMLCanvasElement
      return canvas
    }

    for (let p = 1; p <= 6; p++) {
      window.storeCanvas(p, createMockCanvas(), 1.0)
    }
    expect(window.size).toBe(6)
    expect(window.getCanvas(1)).not.toBeNull()

    // Acessar página 2 move para mais recente
    window.getCanvas(2)

    // Adiciona 7ª página: deve expulsar a página 3 (pois 2 foi acessada recentemente e 1 foi acessada antes)
    window.storeCanvas(7, createMockCanvas(), 1.0)
    expect(window.size).toBe(6)
    // O mais antigo era o 3 (ordem de acesso: 1, 4, 5, 6, 2, 7)
    expect(window.getCanvas(3)).toBeNull()
    expect(window.getCanvas(7)).not.toBeNull()
  })

  it('3. Deve cancelar tarefas de renderização fora da janela idle ao mudar de página', () => {
    window.setCurrentPage(5)
    // Janela idle: 3 a 7

    const cancelP1 = vi.fn()
    const taskP1: RenderTaskLike = { cancel: cancelP1, promise: Promise.resolve() }

    const cancelP5 = vi.fn()
    const taskP5: RenderTaskLike = { cancel: cancelP5, promise: Promise.resolve() }

    const cancelP12 = vi.fn()
    const taskP12: RenderTaskLike = { cancel: cancelP12, promise: Promise.resolve() }

    window.registerInFlightRender(1, taskP1)
    window.registerInFlightRender(5, taskP5)
    window.registerInFlightRender(12, taskP12)

    window.cancelOutOfWindowRenders()

    expect(cancelP1).toHaveBeenCalledTimes(1)
    expect(cancelP12).toHaveBeenCalledTimes(1)
    expect(cancelP5).not.toHaveBeenCalled()
  })

  it('4. clear deve cancelar todas as tarefas e limpar canvases', () => {
    const cancelTask = vi.fn()
    window.registerInFlightRender(5, { cancel: cancelTask, promise: Promise.resolve() })

    const mockCanvas = {
      width: 100,
      height: 100,
      getContext: vi.fn(() => ({ clearRect: vi.fn() }))
    } as unknown as HTMLCanvasElement
    window.storeCanvas(5, mockCanvas, 1.0)

    window.clear()
    expect(cancelTask).toHaveBeenCalledTimes(1)
    expect(window.size).toBe(0)
    expect(mockCanvas.width).toBe(0)
  })
})
