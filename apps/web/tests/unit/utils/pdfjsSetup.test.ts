import { describe, it, expect, vi } from 'vitest'
import { setupPdfJs, getPdfDocumentParams } from '../../../app/utils/pdfjsSetup'

describe('pdfjsSetup', () => {
  it('1. setupPdfJs deve inicializar e retornar a instância do pdfjsLib', async () => {
    const lib = await setupPdfJs()
    expect(lib).toBeDefined()
    expect(lib.GlobalWorkerOptions).toBeDefined()
    expect(lib.GlobalWorkerOptions.workerSrc).toBeTruthy()
    // Deve apontar para asset local (Vite URL ou /pdfjs/) e nunca para CDN externa
    expect(lib.GlobalWorkerOptions.workerSrc).not.toContain('cdn.jsdelivr.net')
    expect(lib.GlobalWorkerOptions.workerSrc).not.toContain('unpkg.com')
  })

  it('2. getPdfDocumentParams deve configurar caminhos locais de cMapUrl e standardFontDataUrl', () => {
    const fakeData = new Uint8Array([1, 2, 3])
    const params = getPdfDocumentParams(fakeData, { password: 'secret' })

    expect(params.data).toBe(fakeData)
    expect(params.cMapUrl).toBe('/pdfjs/cmaps/')
    expect(params.cMapPacked).toBe(true)
    expect(params.standardFontDataUrl).toBe('/pdfjs/standard_fonts/')
    expect(params.enableXfa).toBe(false)
    expect((params as any).password).toBe('secret')
  })
})
