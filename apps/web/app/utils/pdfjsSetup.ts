import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

/**
 * Configura o worker e caminhos de assets locais do PDF.js sem nenhuma dependência de CDN externa.
 * Funciona 100% offline no navegador, PWA, Tauri Desktop e Tauri Android.
 */
export async function setupPdfJs(): Promise<typeof pdfjsLib> {
  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    try {
      // 1. Prioridade máxima: Asset empacotado localmente pelo Vite
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl || '/pdfjs/pdf.worker.min.mjs'
    } catch {
      // 2. Fallback estático: Servido a partir de public/pdfjs/
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs'
    }
  }

  return pdfjsLib
}

/**
 * Retorna os parâmetros padronizados para `pdfjsLib.getDocument()` com cmaps e standard_fonts locais.
 */
export function getPdfDocumentParams(data: Uint8Array, extraOptions: Record<string, any> = {}) {
  return {
    data,
    cMapUrl: '/pdfjs/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/pdfjs/standard_fonts/',
    enableXfa: false,
    ...extraOptions,
  }
}
