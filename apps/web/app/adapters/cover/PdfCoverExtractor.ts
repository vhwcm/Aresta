import type { ICoverExtractor, ExtractedCoverResult } from './ICoverExtractor'
import { setupPdfJs, getPdfDocumentParams } from '~/utils/pdfjsSetup'

export class PdfCoverExtractor implements ICoverExtractor {
  readonly supportedType = 'pdf' as const

  async extractCover(
    source: File | Blob | ArrayBuffer,
    _fileName?: string
  ): Promise<ExtractedCoverResult | null> {
    try {
      const pdfjsLib = await setupPdfJs()

      let arrayBuffer: ArrayBuffer
      if (source instanceof Blob) {
        arrayBuffer = await source.arrayBuffer()
      } else {
        arrayBuffer = source
      }

      const typedArray = new Uint8Array(arrayBuffer)
      const loadingTask = pdfjsLib.getDocument(getPdfDocumentParams(typedArray))

      const pdfDoc = await loadingTask.promise
      if (pdfDoc.numPages < 1) return null

      // Sempre extrai a primeira página como capa
      const page1 = await pdfDoc.getPage(1)
      const baseViewport = page1.getViewport({ scale: 1.0 })

      // Almeja largura padrão de capa de 600px para nitidez máxima sem peso excessivo
      const targetWidth = 600
      const scale = targetWidth / Math.max(1, baseViewport.width)
      const viewport = page1.getViewport({ scale })

      if (typeof document === 'undefined') {
        // Ambiente sem DOM (ex: Node/SSR/Unit tests)
        return null
      }

      const canvas = document.createElement('canvas')
      canvas.width = Math.round(viewport.width)
      canvas.height = Math.round(viewport.height)

      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      await (page1.render as any)({
        canvasContext: ctx,
        canvas,
        viewport,
        intent: 'display',
      }).promise

      const mimeType = 'image/webp'
      let blob: Blob | null = null

      if (typeof canvas.toBlob === 'function') {
        blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), mimeType, 0.88)
        })
      }

      const dataUrl = canvas.toDataURL(mimeType, 0.88)

      if (!blob) {
        // Fallback construindo blob a partir do dataUrl
        const byteString = atob(dataUrl.split(',')[1] || '')
        const ab = new ArrayBuffer(byteString.length)
        const ia = new Uint8Array(ab)
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i)
        }
        blob = new Blob([ab], { type: mimeType })
      }

      return {
        blob,
        dataUrl,
        mimeType,
        width: canvas.width,
        height: canvas.height,
        source: 'first-page',
      }
    } catch (err) {
      console.warn('[PdfCoverExtractor] Falha ao extrair capa do PDF:', err)
      return null
    }
  }
}
