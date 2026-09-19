import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const webRoot = path.resolve(__dirname, '..')
const sourcePdfjsDir = path.resolve(webRoot, 'node_modules/pdfjs-dist')
const targetPdfjsDir = path.resolve(webRoot, 'public/pdfjs')

if (!fs.existsSync(sourcePdfjsDir)) {
  console.error('[copy-pdfjs-assets] node_modules/pdfjs-dist não encontrado.')
  process.exit(1)
}

fs.mkdirSync(targetPdfjsDir, { recursive: true })

// 1. Copiar pdf.worker.min.mjs
const workerSrc = path.resolve(sourcePdfjsDir, 'build/pdf.worker.min.mjs')
const workerDest = path.resolve(targetPdfjsDir, 'pdf.worker.min.mjs')
if (fs.existsSync(workerSrc)) {
  fs.copyFileSync(workerSrc, workerDest)
  console.log('[copy-pdfjs-assets] Copiado: pdf.worker.min.mjs')
}

// 2. Copiar cmaps
const cmapsSrc = path.resolve(sourcePdfjsDir, 'cmaps')
const cmapsDest = path.resolve(targetPdfjsDir, 'cmaps')
if (fs.existsSync(cmapsSrc)) {
  fs.cpSync(cmapsSrc, cmapsDest, { recursive: true })
  console.log('[copy-pdfjs-assets] Copiado: diretório cmaps')
}

// 3. Copiar standard_fonts
const fontsSrc = path.resolve(sourcePdfjsDir, 'standard_fonts')
const fontsDest = path.resolve(targetPdfjsDir, 'standard_fonts')
if (fs.existsSync(fontsSrc)) {
  fs.cpSync(fontsSrc, fontsDest, { recursive: true })
  console.log('[copy-pdfjs-assets] Copiado: diretório standard_fonts')
}

console.log('[copy-pdfjs-assets] Todos os assets do PDF.js foram copiados para public/pdfjs/ com sucesso!')
