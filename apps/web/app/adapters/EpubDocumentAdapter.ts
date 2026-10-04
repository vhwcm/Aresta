import type { IBookDocument, BookMetadata, PageData, INavigableDocument, TocEntry } from '~/interfaces/reader/IBookDocument'
import { logWarn } from '~/utils/logger'
import { readerProfiler } from '~/utils/readerProfiler'
import { createExactIndex, createEstimatedIndex, type LocationIndex } from '~/utils/reader/position/locationIndex'
import type { ReadingPosition } from '~/utils/reader/position/readingPosition'
import { countSectionText } from '~/utils/reader/epub/sectionTextCounter'
import { computeBookHash, getCachedLocations, setCachedLocations } from '~/utils/reader/epub/locationIndexCache'
import { ChunkScheduler } from '~/utils/reader/scheduling/chunkScheduler'
import { normalizeEpubToc } from '~/utils/reader/toc/tocNormalizer'

interface FoliateSection {
  id: string
  load: () => Promise<unknown>
  unload: () => void
  createDocument: () => Promise<Document>
  linear?: boolean
  properties?: string[]
}

interface FoliateEpub {
  metadata: Record<string, unknown>
  sections: (FoliateSection | null)[]
  toc?: unknown[]
  init(): Promise<void>
  getCover(): Promise<Blob | null>
}

interface PageMapping {
  globalPage: number
  sectionIndex: number
  pageIndexInSection: number
  totalPagesInSection: number
}

interface EpubLoaderResult {
  loader: {
    loadText: (uri: string) => string | null
    loadBlob: (uri: string) => Blob | null
    getSize: (uri: string) => number
    sha1: undefined
  }
  unzipped: Record<string, Uint8Array>
}

async function buildEpubLoader(arrayBuffer: ArrayBuffer): Promise<EpubLoaderResult> {
  const { unzipSync } = await readerProfiler.measureAsync('4.1. Importação Dinâmica fflate', async () => {
    return await import('fflate')
  }, 'parse')

  const zipData = new Uint8Array(arrayBuffer)
  const unzipped = await readerProfiler.measureAsync('4.2. Descompactação EPUB (fflate.unzipSync)', async () => {
    return unzipSync(zipData)
  }, 'parse', { entriesCount: Object.keys(zipData).length })

  const decoder = new TextDecoder()

  function loadText(uri: string): string | null {
    const normalized = uri.startsWith('/') ? uri.slice(1) : uri
    const data = unzipped[normalized]
    if (!data) return null
    return decoder.decode(data)
  }

  function loadBlob(uri: string): Blob | null {
    const normalized = uri.startsWith('/') ? uri.slice(1) : uri
    const data = unzipped[normalized]
    if (!data) return null
    return new Blob([data])
  }

  function getSize(uri: string): number {
    const normalized = uri.startsWith('/') ? uri.slice(1) : uri
    return unzipped[normalized]?.byteLength ?? 0
  }

  return {
    loader: { loadText, loadBlob, getSize, sha1: undefined },
    unzipped,
  }
}

/**
 * Resolve caminhos relativos de recursos (imagens, estilos) dentro do zip do EPUB.
 */
function resolvePath(href: string, basePath: string): string {
  const part1 = href.split('#')[0] ?? ''
  const part2 = part1.split('?')[0] ?? ''
  const cleanHref = part2.trim()
  if (!cleanHref || cleanHref.startsWith('data:') || cleanHref.startsWith('http:') || cleanHref.startsWith('https:')) {
    return cleanHref
  }

  let decodedHref = cleanHref
  try {
    decodedHref = decodeURIComponent(cleanHref)
  } catch {
    // fallback se decode falhar
  }

  const baseDir = basePath.includes('/') ? basePath.slice(0, basePath.lastIndexOf('/') + 1) : ''
  const fullPath = decodedHref.startsWith('/') ? decodedHref.slice(1) : baseDir + decodedHref

  const parts = fullPath.split('/')
  const stack: string[] = []
  for (const part of parts) {
    if (part === '.' || part === '') continue
    if (part === '..') {
      if (stack.length > 0) stack.pop()
    } else {
      stack.push(part)
    }
  }
  return stack.join('/')
}

/**
 * Busca arquivo dentro do objeto unzipped do EPUB com tolerância a formatações de barra, maiúsculas/minúsculas,
 * correspondência por sufixo de pasta e correspondência de nome de arquivo (basename).
 */
function getZipFile(unzipped: Record<string, Uint8Array>, path: string): Uint8Array | null {
  if (!unzipped) return null

  // 1. Caminho exato
  if (unzipped[path]) return unzipped[path]

  // 2. Normalização de barras e remoção de barra inicial
  const cleanPath = path.replace(/\\/g, '/').replace(/^\//, '')
  if (unzipped[cleanPath]) return unzipped[cleanPath]

  // 3. Decodificação de URI (ex: %20 -> espaço)
  try {
    const decoded = decodeURIComponent(cleanPath)
    if (unzipped[decoded]) return unzipped[decoded]
  } catch {
    // Ignora erro se não for uma URI válida codificada
  }

  // 4. Busca por sufixo (ex: "Images/cover.jpg" combina com "OEBPS/Images/cover.jpg" ou "OPS/Images/cover.jpg")
  const cleanLower = cleanPath.toLowerCase()
  for (const [key, val] of Object.entries(unzipped)) {
    const keyClean = key.replace(/\\/g, '/').replace(/^\//, '').toLowerCase()
    if (keyClean === cleanLower) return val
    if (keyClean.endsWith('/' + cleanLower) || keyClean.endsWith(cleanLower)) {
      return val
    }
  }

  // 5. Busca por nome do arquivo (basename)
  const basename = cleanPath.split('/').pop()?.toLowerCase()
  if (basename) {
    for (const [key, val] of Object.entries(unzipped)) {
      const keyBasename = key.replace(/\\/g, '/').split('/').pop()?.toLowerCase()
      if (keyBasename === basename) {
        return val
      }
    }
  }

  return null
}

/**
 * Retorna o MIME type apropriado baseado na extensão do arquivo.
 */
function getMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'svg':
    case 'svgz':
      return 'image/svg+xml'
    case 'css':
      return 'text/css'
    case 'woff':
      return 'font/woff'
    case 'woff2':
      return 'font/woff2'
    case 'ttf':
      return 'font/ttf'
    case 'otf':
      return 'font/otf'
    default:
      return 'application/octet-stream'
  }
}

/**
 * Converte Uint8Array para Base64 com suporte a chunks.
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  const len = bytes.byteLength
  const chunkSize = 8192
  for (let i = 0; i < len; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, len)) as unknown as number[])
  }
  return btoa(binary)
}

/**
 * Obtém o Data URI correspondente a um recurso interno do EPUB.
 */
function getAssetDataUri(unzipped: Record<string, Uint8Array>, assetPath: string, basePath: string): string | null {
  const resolved = resolvePath(assetPath, basePath)
  const fileBytes = getZipFile(unzipped, resolved) || getZipFile(unzipped, assetPath)
  if (!fileBytes) return null
  const mime = getMimeType(resolved) || getMimeType(assetPath)
  if (mime === 'image/svg+xml') {
    const text = new TextDecoder().decode(fileBytes)
    return `data:image/svg+xml;utf8,${encodeURIComponent(text)}`
  }
  const base64 = uint8ArrayToBase64(fileBytes)
  return `data:${mime};base64,${base64}`
}

/**
 * Reescreve seletores CSS como 'body' e 'html' para apontarem para o container '.epub-text-layer-content'.
 */
function rewriteCssBodySelectors(css: string): string {
  if (!css) return ''
  return css
    .replace(/(^|[\s,;{}])body([\s,.:#{[>~+]|$)/gi, '$1.epub-text-layer-content$2')
    .replace(/(^|[\s,;{}])html([\s,.:#{[>~+]|$)/gi, '$1.epub-text-layer-viewport$2')
}

/**
 * Processa regras CSS, convertendo referências url(...) relativas em Data URIs e adaptando seletores body.
 */
function processCss(cssText: string, cssPath: string, unzipped: Record<string, Uint8Array>): string {
  if (!cssText) return ''
  let processed = cssText.replace(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi, (match, url) => {
    const cleanUrl = url.trim()
    if (!cleanUrl || cleanUrl.startsWith('data:') || cleanUrl.startsWith('http:') || cleanUrl.startsWith('https:')) {
      return match
    }
    const dataUri = getAssetDataUri(unzipped, cleanUrl, cssPath)
    if (dataUri) {
      return `url("${dataUri}")`
    }
    return match
  })
  return rewriteCssBodySelectors(processed)
}

/**
 * Prepara o Document da seção do EPUB:
 * 1. Converte links de CSS externo (<link rel="stylesheet">) em tags <style> com conteúdo embutido.
 * 2. Resolve todas as imagens (<img src>, <image xlink:href>, <image href>) para Data URIs Base64.
 * 3. Resolve mídias (<source>, <video>, <audio>, <object>, <embed>) para Data URIs.
 * 4. Processa URLs em estilos inline e tags de estilo.
 */
function prepareSectionDocument(doc: Document | null, sectionPath: string, unzipped: Record<string, Uint8Array>): void {
  if (!doc) return

  // 1. Inlining de CSS externo (<link rel="stylesheet">)
  const linkElements = Array.from(
    typeof doc.querySelectorAll === 'function'
      ? doc.querySelectorAll('link[rel="stylesheet"], link[type="text/css"], link[href$=".css"]')
      : []
  )
  for (const link of linkElements) {
    const href = link.getAttribute('href')
    if (href) {
      const resolvedPath = resolvePath(href, sectionPath)
      const cssBytes = getZipFile(unzipped, resolvedPath) || getZipFile(unzipped, href)
      if (cssBytes) {
        const rawCss = new TextDecoder().decode(cssBytes)
        const processedCss = processCss(rawCss, resolvedPath, unzipped)
        const styleEl = document.createElement('style')
        styleEl.setAttribute('data-origin-href', href)
        styleEl.innerHTML = processedCss
        link.parentNode?.replaceChild(styleEl, link)
      }
    }
  }

  // 2. Processa tags <style> existentes
  const styleElements = Array.from(
    typeof doc.querySelectorAll === 'function' ? doc.querySelectorAll('style') : []
  )
  for (const style of styleElements) {
    if (style.innerHTML) {
      style.innerHTML = processCss(style.innerHTML, sectionPath, unzipped)
    }
  }

  // 3. Imagens <img> (src e srcset)
  const imgElements = Array.from(
    typeof doc.querySelectorAll === 'function' ? doc.querySelectorAll('img') : []
  )
  for (const img of imgElements) {
    const src = img.getAttribute('src')
    if (src && !src.startsWith('data:') && !src.startsWith('http:') && !src.startsWith('https:')) {
      const dataUri = getAssetDataUri(unzipped, src, sectionPath)
      if (dataUri) {
        img.setAttribute('src', dataUri)
      }
    }
    const srcset = img.getAttribute('srcset')
    if (srcset) {
      const newSrcset = srcset.split(',').map((part) => {
        const [url, ...rest] = part.trim().split(/\s+/)
        if (url && !url.startsWith('data:') && !url.startsWith('http:') && !url.startsWith('https:')) {
          const dataUri = getAssetDataUri(unzipped, url, sectionPath)
          return dataUri ? [dataUri, ...rest].join(' ') : part
        }
        return part
      }).join(', ')
      img.setAttribute('srcset', newSrcset)
    }
  }

  // 4. SVG <image> (xlink:href e href)
  const svgImages = Array.from(
    typeof doc.querySelectorAll === 'function' ? doc.querySelectorAll('image') : []
  )
  for (const svgImg of svgImages) {
    const xlinkHref = svgImg.getAttribute('xlink:href') || (typeof svgImg.getAttributeNS === 'function' ? svgImg.getAttributeNS('http://www.w3.org/1999/xlink', 'href') : null)
    if (xlinkHref && !xlinkHref.startsWith('data:') && !xlinkHref.startsWith('http:') && !xlinkHref.startsWith('https:')) {
      const dataUri = getAssetDataUri(unzipped, xlinkHref, sectionPath)
      if (dataUri) {
        svgImg.setAttribute('xlink:href', dataUri)
        svgImg.setAttribute('href', dataUri)
        if (typeof svgImg.setAttributeNS === 'function') {
          svgImg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUri)
        }
      }
    }
    const href = svgImg.getAttribute('href')
    if (href && !href.startsWith('data:') && !href.startsWith('http:') && !href.startsWith('https:')) {
      const dataUri = getAssetDataUri(unzipped, href, sectionPath)
      if (dataUri) {
        svgImg.setAttribute('href', dataUri)
        svgImg.setAttribute('xlink:href', dataUri)
        if (typeof svgImg.setAttributeNS === 'function') {
          svgImg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUri)
        }
      }
    }
  }

  // 5. Mídias e objetos (<source>, <video>, <audio>, <object>, <embed>)
  const mediaElements = Array.from(
    typeof doc.querySelectorAll === 'function'
      ? doc.querySelectorAll('source[src], object[data], embed[src], video[poster]')
      : []
  )
  for (const el of mediaElements) {
    const src = el.getAttribute('src') || el.getAttribute('data') || el.getAttribute('poster')
    const attr = el.hasAttribute('src') ? 'src' : (el.hasAttribute('data') ? 'data' : 'poster')
    if (src && !src.startsWith('data:') && !src.startsWith('http:') && !src.startsWith('https:')) {
      const dataUri = getAssetDataUri(unzipped, src, sectionPath)
      if (dataUri) {
        el.setAttribute(attr, dataUri)
      }
    }
  }

  // 6. Atributos de estilo inline com url(...)
  const elementsWithStyle = Array.from(
    typeof doc.querySelectorAll === 'function' ? doc.querySelectorAll('[style]') : []
  )
  for (const el of elementsWithStyle) {
    const styleAttr = el.getAttribute('style')
    if (styleAttr && /url\(/i.test(styleAttr)) {
      el.setAttribute('style', processCss(styleAttr, sectionPath, unzipped))
    }
  }
}

const EPUB_TYPOGRAPHY_STYLES = `
  .epub-text-layer-content {
    display: block !important;
    position: relative !important;
    box-sizing: border-box !important;
    column-fill: auto !important;
    max-width: none !important;
    min-width: 0 !important;
    overflow: visible !important;
    font-family: 'Newsreader', Georgia, serif;
    font-size: 18px;
    line-height: 1.6;
    color: inherit;
  }
  .epub-text-layer-viewport {
    display: block !important;
    position: absolute !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }
  .epub-text-layer-content h1, .epub-text-layer-content .chapter-title, .epub-text-layer-content .book-title, .epub-text-layer-content .title {
    font-size: 2em;
    font-weight: 700;
    line-height: 1.25;
    margin-top: 0.8em;
    margin-bottom: 0.5em;
    display: block;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    break-before: auto !important;
    page-break-before: auto !important;
  }
  .epub-text-layer-content h2, .epub-text-layer-content .chapter-subtitle, .epub-text-layer-content .book-subtitle, .epub-text-layer-content .subtitle {
    font-size: 1.5em;
    font-weight: 700;
    line-height: 1.3;
    margin-top: 0.75em;
    margin-bottom: 0.4em;
    display: block;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .epub-text-layer-content h3 {
    font-size: 1.25em;
    font-weight: 600;
    line-height: 1.35;
    margin-top: 0.7em;
    margin-bottom: 0.35em;
    display: block;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .epub-text-layer-content h4 {
    font-size: 1.1em;
    font-weight: 600;
    line-height: 1.4;
    margin-top: 0.6em;
    margin-bottom: 0.3em;
    display: block;
  }
  .epub-text-layer-content h5 {
    font-size: 1em;
    font-weight: 600;
    margin-top: 0.55em;
    margin-bottom: 0.25em;
    display: block;
  }
  .epub-text-layer-content h6 {
    font-size: 0.9em;
    font-weight: 600;
    margin-top: 0.5em;
    margin-bottom: 0.2em;
    display: block;
  }
  .epub-text-layer-content p {
    margin-top: 0;
    margin-bottom: 0.85em;
    line-height: 1.6;
    text-align: justify;
    text-justify: inter-word;
  }
  .epub-text-layer-content strong, .epub-text-layer-content b { font-weight: 700; }
  .epub-text-layer-content em, .epub-text-layer-content i { font-style: italic; }
  .epub-text-layer-content blockquote {
    margin: 1em 1.5em;
    padding-left: 1em;
    border-left: 2px solid rgba(0, 0, 0, 0.15);
    font-style: italic;
  }
  .epub-text-layer-content hr {
    margin: 1.5em auto;
    border: none;
    border-top: 1px solid rgba(0, 0, 0, 0.15);
    width: 60%;
  }
  .epub-text-layer-content ul, .epub-text-layer-content ol {
    margin: 0.75em 0 0.75em 1.5em;
    padding-left: 1em;
  }
  .epub-text-layer-content li { margin-bottom: 0.35em; line-height: 1.6; }
  .epub-text-layer-content sub { font-size: 0.75em; vertical-align: sub; }
  .epub-text-layer-content sup { font-size: 0.75em; vertical-align: super; }
  .epub-text-layer-content figure {
    margin: 0.6em auto;
    text-align: center;
    max-width: 100%;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .epub-text-layer-content img {
    max-width: 100%;
    max-height: 85vh;
    height: auto;
    object-fit: contain;
    display: inline-block;
    margin: 0.4em auto;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .epub-text-layer-content svg {
    max-width: 100%;
    max-height: 100%;
    height: auto;
    display: block;
    margin: 0.4em auto;
  }
  .epub-text-layer-content svg image {
    max-width: 100%;
    max-height: 100%;
  }
  .epub-text-layer-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .epub-cover-page {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    padding: 12px !important;
    box-sizing: border-box !important;
  }
  .epub-cover-page img, .epub-cover-wrapper img, .cover-container img {
    max-width: 100% !important;
    max-height: 100% !important;
    width: auto !important;
    height: auto !important;
    object-fit: contain !important;
    margin: auto !important;
    display: block !important;
    border-radius: 4px !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
  }
`

/**
 * Verifica se uma seção do EPUB representa uma página de capa.
 */
function isCoverSection(section: FoliateSection | null, doc: Document | null): boolean {
  if (section) {
    const idLower = (section.id || '').toLowerCase()
    if (idLower.includes('cover') || idLower.includes('capa')) {
      return true
    }
  }
  if (!doc) return false
  const bodyEl = doc.body || (typeof doc.querySelector === 'function' ? doc.querySelector('body') : null) || (doc as any)
  if (!bodyEl) return false
  if (typeof bodyEl.querySelectorAll === 'function') {
    const images = Array.from(bodyEl.querySelectorAll('img, image, svg'))
    const textContent = (bodyEl.textContent || '').trim()
    if (images.length === 1 && textContent.length < 100) {
      return true
    }
    const wrapper = bodyEl.querySelector('.epub-cover-wrapper, .cover-container, .cover')
    if (wrapper) return true
  }
  return false
}

/**
 * Cria uma seção sintética de capa a partir de um Data URI ou URL de imagem.
 */
function createSyntheticCoverSection(coverSrc: string, title?: string): FoliateSection {
  return {
    id: 'synthetic-cover-page.xhtml',
    linear: true,
    load: async () => {},
    unload: () => {},
    createDocument: async () => {
      const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null
      const html = `<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${title || 'Capa'}</title><style>html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background-color:#faf9f7;}.epub-cover-wrapper{width:100%;height:100%;display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:12px;margin:0;}.epub-cover-wrapper img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block;margin:auto;box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:4px;}</style></head><body><div class="epub-cover-wrapper"><img src="${coverSrc}" alt="Capa" /></div></body></html>`
      if (parser) {
        return parser.parseFromString(html, 'application/xhtml+xml')
      }
      return {
        body: {
          innerHTML: `<div class="epub-cover-wrapper"><img src="${coverSrc}" alt="Capa" /></div>`,
          textContent: '',
        },
      } as any
    },
  }
}

/**
 * Tenta localizar a imagem da capa do EPUB (via getCover(), manifest, zip ou URL fallback).
 */
async function findEpubCoverDataUri(
  epub: FoliateEpub,
  unzipped: Record<string, Uint8Array> | null,
  fallbackCoverUrl?: string,
): Promise<string | null> {
  // 1. Tenta epub.getCover()
  try {
    if (typeof epub.getCover === 'function') {
      const coverBlob = await epub.getCover()
      if (coverBlob && coverBlob.size > 0) {
        const arrayBuf = await coverBlob.arrayBuffer()
        const bytes = new Uint8Array(arrayBuf)
        const mime = coverBlob.type || 'image/jpeg'
        return `data:${mime};base64,${uint8ArrayToBase64(bytes)}`
      }
    }
  } catch (err) {
    logWarn('[EpubAdapter] Erro ao obter cover via epub.getCover():', err)
  }

  // 2. Tenta resources.cover
  try {
    const resCover = (epub as any).resources?.cover
    if (resCover?.href && unzipped) {
      const dataUri = getAssetDataUri(unzipped, resCover.href, '')
      if (dataUri) return dataUri
    }
  } catch (err) {
    logWarn('[EpubAdapter] Erro ao obter cover via resources.cover:', err)
  }

  // 3. Procura no unzipped por arquivos de imagem com 'cover' ou 'capa' no nome
  if (unzipped) {
    for (const [key, bytes] of Object.entries(unzipped)) {
      const keyLower = key.toLowerCase()
      if (
        (keyLower.includes('cover') || keyLower.includes('capa')) &&
        (keyLower.endsWith('.jpg') || keyLower.endsWith('.jpeg') || keyLower.endsWith('.png') || keyLower.endsWith('.webp'))
      ) {
        const mime = getMimeType(key)
        return `data:${mime};base64,${uint8ArrayToBase64(bytes)}`
      }
    }
  }

  // 4. Fallback para URL externa de capa passada como parâmetro
  if (fallbackCoverUrl) {
    return fallbackCoverUrl
  }

  return null
}

function getEpubPagePadding(width: number, height: number): { paddingX: number; paddingY: number; paddingBottom: number } {
  // Bordas e margens otimizadas no modo página para o texto preencher a folha com elegância:
  const paddingX = width > 700 ? 24 : (width > 500 ? 20 : (width > 360 ? 16 : 12))
  const paddingY = height > 700 ? 22 : (height > 500 ? 18 : 14)
  const paddingBottom = paddingY + 16 // Espaço protegido no rodapé para o número da página não cortar a última linha
  return { paddingX, paddingY, paddingBottom }
}

function calculateSectionPages(
  doc: Document | null,
  fontSize: number = 15,
  fontFamily: string = "'Newsreader', Georgia, 'Times New Roman', serif",
  pageWidth: number = 700,
  pageHeight: number = 900,
): number {
  if (!doc) return 1
  if (isCoverSection(null, doc)) return 1

  const bodyEl = doc.body || (typeof doc.querySelector === 'function' ? doc.querySelector('body') : null) || (typeof doc.getElementsByTagName === 'function' ? doc.getElementsByTagName('body')[0] : null) || (doc as any)
  const textLen = (bodyEl?.textContent || '').trim().length
  if (typeof document === 'undefined' || !document.createElement) {
    const baseCharsPerPage = Math.max(300, Math.round(1500 * (15 / Math.max(12, fontSize))))
    return Math.max(1, Math.ceil(textLen / baseCharsPerPage))
  }

  try {
    const safeW = Math.max(320, pageWidth)
    const safeH = Math.max(400, pageHeight)
    const { paddingX, paddingY, paddingBottom } = getEpubPagePadding(safeW, safeH)
    const colWidth = safeW - (2 * paddingX)
    const colGap = paddingX * 2

    const container = document.createElement('div')
    container.className = 'epub-text-layer-content'
    container.style.position = 'fixed'
    container.style.visibility = 'hidden'
    container.style.left = '-99999px'
    container.style.top = '-99999px'
    container.style.width = `${safeW}px`
    container.style.height = `${safeH}px`
    container.style.padding = `${paddingY}px ${paddingX}px ${paddingBottom}px ${paddingX}px`
    container.style.boxSizing = 'border-box'
    container.style.columnWidth = `${colWidth}px`
    container.style.columnGap = `${colGap}px`
    container.style.columnFill = 'auto'
    container.style.overflow = 'hidden'
    container.style.fontFamily = fontFamily
    container.style.fontSize = `${fontSize}px`
    container.style.wordWrap = 'break-word'

    const docStyles = doc && typeof doc.querySelectorAll === 'function'
      ? Array.from(doc.querySelectorAll('style')).map((s) => s.innerHTML).join('\n')
      : ''

    const styleTag = document.createElement('style')
    styleTag.innerHTML = `${EPUB_TYPOGRAPHY_STYLES}\n${docStyles}`
    container.appendChild(styleTag)

    const rawContent = bodyEl ? (bodyEl.innerHTML || bodyEl.textContent || '') : (doc.documentElement ? doc.documentElement.innerHTML : '')
    container.insertAdjacentHTML('beforeend', rawContent)

    document.body.appendChild(container)
    const scrollW = container.scrollWidth
    document.body.removeChild(container)

    if (scrollW > safeW) {
      return Math.max(1, Math.ceil(scrollW / safeW))
    }
    if (scrollW > 0 && scrollW <= safeW) {
      return 1
    }
    // Fallback apenas para ambientes headless sem motor de layout (scrollW === 0)
    const baseCharsPerPage = Math.max(300, Math.round(1500 * (15 / Math.max(12, fontSize))))
    return Math.max(1, Math.ceil(textLen / baseCharsPerPage))
  } catch {
    const baseCharsPerPage = Math.max(300, Math.round(1500 * (15 / Math.max(12, fontSize))))
    return Math.max(1, Math.ceil(textLen / baseCharsPerPage))
  }
}

class SectionDocLru {
  private cache = new Map<number, Document>()
  private capacity = 6

  get(sectionIndex: number): Document | undefined {
    const doc = this.cache.get(sectionIndex)
    if (doc) {
      this.cache.delete(sectionIndex)
      this.cache.set(sectionIndex, doc)
    }
    return doc
  }

  set(sectionIndex: number, doc: Document): void {
    if (this.cache.has(sectionIndex)) {
      this.cache.delete(sectionIndex)
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey)
      }
    }
    this.cache.set(sectionIndex, doc)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }
}

export class EpubDocumentAdapter implements IBookDocument, INavigableDocument {
  readonly type = 'epub' as const
  private _epub: FoliateEpub | null = null
  private _metadata: BookMetadata = { title: '' }
  private _totalPages = 0
  private _isLoaded = false
  private _fontSize = 15
  private _fontFamily = "'Newsreader', Georgia, 'Times New Roman', serif"
  private _pageWidth = 700
  private _pageHeight = 900
  private _pageCanvases: Map<number, HTMLCanvasElement> = new Map()
  private _sections: FoliateSection[] = []
  private _sectionDocsLru = new SectionDocLru()
  private _pagesPerSection: number[] = []
  private _prefixPages: number[] = [0]
  private _unzipped: Record<string, Uint8Array> | null = null
  private _locationIndex: LocationIndex = createExactIndex([])
  private _scheduler = new ChunkScheduler<{ index: number }>()
  private _indexRefinedCallbacks = new Set<() => void>()
  private _refineThrottleTimer: ReturnType<typeof setTimeout> | null = null

  get metadata(): BookMetadata {
    return this._metadata
  }

  get totalPages(): number {
    return Math.max(1, this._totalPages || 1)
  }

  get isLoaded(): boolean {
    return this._isLoaded
  }

  get fontSize(): number {
    return this._fontSize
  }

  get fontFamily(): string {
    return this._fontFamily
  }

  private _updatePagination(): void {
    const n = this._sections.length
    if (n === 0) {
      this._pagesPerSection = []
      this._prefixPages = [0]
      this._totalPages = 0
      return
    }

    this._pagesPerSection = new Array(n)
    this._prefixPages = new Array(n + 1)
    this._prefixPages[0] = 0

    const charsPerSec = this._locationIndex.getCharsPerSection()
    const baseCharsPerPage = Math.max(300, Math.round(1500 * (15 / Math.max(12, this._fontSize))))

    for (let i = 0; i < n; i++) {
      const doc = this._sectionDocsLru.get(i)
      let pages: number
      if (doc) {
        pages = calculateSectionPages(doc, this._fontSize, this._fontFamily, this._pageWidth, this._pageHeight)
      } else {
        const chars = charsPerSec[i] || 0
        pages = chars > 0 ? Math.max(1, Math.ceil(chars / baseCharsPerPage)) : 1
      }
      this._pagesPerSection[i] = Math.max(1, pages)
      this._prefixPages[i + 1] = this._prefixPages[i] + this._pagesPerSection[i]
    }

    this._totalPages = Math.max(1, this._prefixPages[n] ?? 1)
  }

  setPageDimensions(width: number, height: number, currentPage = 1): number {
    const validW = Math.max(300, Math.round(width))
    const validH = Math.max(400, Math.round(height))
    if (!this._isLoaded) {
      this._pageWidth = validW
      this._pageHeight = validH
      return currentPage
    }
    if (this._pageWidth === validW && this._pageHeight === validH) {
      return currentPage
    }

    // Se a alteração for mínima (< 8px), apenas atualiza os valores sem churn
    if (Math.abs(this._pageWidth - validW) < 8 && Math.abs(this._pageHeight - validH) < 8) {
      this._pageWidth = validW
      this._pageHeight = validH
      return currentPage
    }

    this._pageWidth = validW
    this._pageHeight = validH
    this._pageCanvases.clear()
    this._updatePagination()
    return Math.max(1, Math.min(currentPage, this.totalPages))
  }

  setFontFamily(newFontFamily: string, currentPage = 1): number {
    if (!newFontFamily || (this._fontFamily === newFontFamily && this._isLoaded)) {
      return currentPage
    }

    this._fontFamily = newFontFamily
    this._pageCanvases.clear()
    this._updatePagination()
    return Math.max(1, Math.min(currentPage, this.totalPages))
  }

  setFontSize(newFontSize: number, currentPage = 1): number {
    const clampedSize = Math.max(12, Math.min(36, Math.round(newFontSize)))
    if (this._fontSize === clampedSize && this._isLoaded) {
      return currentPage
    }

    this._fontSize = clampedSize
    this._pageCanvases.clear()
    this._updatePagination()
    return Math.max(1, Math.min(currentPage, this.totalPages))
  }

  private async _getSectionDoc(sectionIndex: number): Promise<Document | null> {
    const cached = this._sectionDocsLru.get(sectionIndex)
    if (cached) return cached

    const section = this._sections[sectionIndex]
    if (!section) return null

    try {
      const doc = await section.createDocument()
      if (doc && this._unzipped) {
        prepareSectionDocument(doc, section.id || '', this._unzipped)
      }
      if (doc) {
        this._sectionDocsLru.set(sectionIndex, doc)
        if (this._pagesPerSection[sectionIndex] !== undefined) {
          const actualPages = calculateSectionPages(doc, this._fontSize, this._fontFamily, this._pageWidth, this._pageHeight)
          if (actualPages !== this._pagesPerSection[sectionIndex]) {
            this._updatePagination()
          }
        }
      }
      return doc
    } catch (err) {
      logWarn(`[EpubAdapter] Erro ao carregar documento da seção ${sectionIndex}:`, err)
      return null
    }
  }

  private async _resolvePageMapping(pageNumber: number): Promise<PageMapping | null> {
    const n = this._sections.length
    if (n === 0) return null

    const clampedPage = Math.min(this.totalPages, Math.max(1, Math.floor(pageNumber)))
    const targetIdx = clampedPage - 1

    let low = 0
    let high = n - 1
    let chosenSection = 0

    while (low <= high) {
      const mid = (low + high) >> 1
      if ((this._prefixPages[mid] ?? 0) <= targetIdx) {
        chosenSection = mid
        low = mid + 1
      } else {
        high = mid - 1
      }
    }

    const startPage = this._prefixPages[chosenSection] ?? 0
    const pageIndexInSection = targetIdx - startPage
    const doc = await this._getSectionDoc(chosenSection)
    const exactPages = doc
      ? calculateSectionPages(doc, this._fontSize, this._fontFamily, this._pageWidth, this._pageHeight)
      : (this._pagesPerSection[chosenSection] || 1)

    return {
      globalPage: pageNumber,
      sectionIndex: chosenSection,
      pageIndexInSection: Math.min(exactPages - 1, Math.max(0, pageIndexInSection)),
      totalPagesInSection: exactPages,
    }
  }

  getSectionIndexFromHref(href: string): number {
    if (!href) return 0
    const cleanHref = href.split('#')[0]!.split('?')[0]!.trim().toLowerCase()
    const index = this._sections.findIndex((s) => {
      if (!s) return false
      const sId = (s.id || '').toLowerCase()
      return sId === cleanHref || sId.endsWith('/' + cleanHref) || cleanHref.endsWith('/' + sId)
    })
    return index >= 0 ? index : 0
  }

  getPageForSection(sectionIndex: number): number {
    return (this._prefixPages[sectionIndex] ?? 0) + 1
  }

  getSectionForPage(pageNumber: number): number {
    const n = this._sections.length
    if (n === 0) return 0
    const targetIdx = Math.max(0, pageNumber - 1)
    let low = 0
    let high = n - 1
    let chosen = 0
    while (low <= high) {
      const mid = (low + high) >> 1
      if ((this._prefixPages[mid] ?? 0) <= targetIdx) {
        chosen = mid
        low = mid + 1
      } else {
        high = mid - 1
      }
    }
    return chosen
  }

  async getToc(): Promise<TocEntry[]> {
    const rawToc = ((this._epub as any)?.toc as any[]) || []
    const resolveHref = (href: string) => {
      const sectionIndex = this.getSectionIndexFromHref(href)
      return { sectionIndex, charOffset: 0 }
    }
    return normalizeEpubToc(rawToc, resolveHref, this._locationIndex)
  }

  getTotalUnits(): number {
    return this._locationIndex.totalLocations
  }

  positionToUnit(p: ReadingPosition): number {
    if (p.kind === 'epub') {
      return this._locationIndex.toLocation(p)
    }
    return 1
  }

  unitToPosition(unit: number): ReadingPosition {
    return this._locationIndex.fromLocation(unit)
  }

  onIndexRefined(cb: () => void): () => void {
    this._indexRefinedCallbacks.add(cb)
    return () => {
      this._indexRefinedCallbacks.delete(cb)
    }
  }

  getLocationIndex(): LocationIndex {
    return this._locationIndex
  }

  private _notifyIndexRefinedThrottled(): void {
    if (this._refineThrottleTimer) return
    this._refineThrottleTimer = setTimeout(() => {
      this._refineThrottleTimer = null
      for (const cb of this._indexRefinedCallbacks) {
        try { cb() } catch { /* ignorar */ }
      }
    }, 250)
  }

  async load(
    source: File | ArrayBuffer,
    fileName?: string,
    initialFontSize?: number,
    initialFontFamily?: string,
    coverUrl?: string,
  ): Promise<void> {
    if (typeof initialFontSize === 'number' && !isNaN(initialFontSize)) {
      this._fontSize = Math.max(12, Math.min(36, Math.round(initialFontSize)))
    }
    if (initialFontFamily) {
      this._fontFamily = initialFontFamily
    }
    const foliateModule: any = await readerProfiler.measureAsync('4.3. Importação foliate-js/epub.js', async () => {
      return await import('foliate-js/epub.js')
    }, 'parse')
    const EPUB = foliateModule.EPUB || foliateModule.default || foliateModule.Book

    let arrayBuffer: ArrayBuffer
    let defaultTitle = fileName || 'document.epub'

    if (source instanceof File) {
      arrayBuffer = await source.arrayBuffer()
      defaultTitle = source.name
    } else {
      arrayBuffer = source
    }

    defaultTitle = defaultTitle.replace(/\.epub$/i, '')

    const bookHash = await readerProfiler.measureAsync('4.1. Hash EPUB e Cache de Localizações', async () => {
      return await computeBookHash(arrayBuffer)
    }, 'parse')
    const cachedLocations = await getCachedLocations(bookHash)

    const { loader, unzipped } = await buildEpubLoader(arrayBuffer)
    this._unzipped = unzipped

    const epub = new EPUB(loader) as FoliateEpub
    await readerProfiler.measureAsync('4.4. foliate-js epub.init()', async () => {
      await epub.init()
    }, 'parse')
    this._epub = epub

    const meta = epub.metadata ?? {}
    this._metadata = {
      title: String(meta['title'] ?? defaultTitle),
      author: meta['creator'] ? String(meta['creator']) : undefined,
      language: meta['language'] ? String(meta['language']) : undefined,
      description: meta['description'] ? String(meta['description']) : undefined,
    }

    // Inclui todas as seções válidas da spine
    this._sections = (epub.sections ?? []).filter(
      (s): s is FoliateSection => s !== null,
    )

    this._sectionDocsLru.clear()

    // Inspeciona seção 0 para capa
    let firstDoc: Document | null = null
    const firstSection = this._sections[0]
    if (firstSection) {
      try {
        firstDoc = await firstSection.createDocument()
        if (firstDoc && this._unzipped) {
          prepareSectionDocument(firstDoc, firstSection.id || '', this._unzipped)
        }
      } catch (err) {
        logWarn('[EpubAdapter] Erro ao inspecionar seção 0 para capa:', err)
      }
    }

    const firstIsCover = isCoverSection(this._sections[0] || null, firstDoc)

    let coverDataUri = await findEpubCoverDataUri(epub, this._unzipped, coverUrl)
    if (!coverDataUri && firstDoc) {
      try {
        const docEl = (typeof (firstDoc as any).querySelector === 'function' ? firstDoc : (firstDoc as any).body) as any
        const img = docEl && typeof docEl.querySelector === 'function' ? docEl.querySelector('img, image') : null
        const src = img?.getAttribute('src') || img?.getAttribute('xlink:href') || img?.getAttribute('href')
        if (src && this._unzipped) {
          coverDataUri = getAssetDataUri(this._unzipped, src, '')
        }
      } catch (err) {
        logWarn('[EpubAdapter] Erro ao extrair img de capa da seção 0:', err)
      }
    }

    if (coverDataUri) {
      this._metadata.coverUrl = coverDataUri
    }

    if (!firstIsCover && coverDataUri) {
      const syntheticCover = createSyntheticCoverSection(coverDataUri, this._metadata.title)
      this._sections.unshift(syntheticCover)
      firstDoc = await syntheticCover.createDocument()
    }

    if (firstDoc && this._sections.length > 0) {
      this._sectionDocsLru.set(0, firstDoc)
    }

    // Inicialização do LocationIndex (Cache Hit imediato vs Estimado)
    if (cachedLocations && cachedLocations.length === this._sections.length) {
      this._locationIndex = createExactIndex(cachedLocations)
    } else {
      const sizes = this._sections.map((s) => {
        const id = s.id || ''
        const zipFile = this._unzipped ? getZipFile(this._unzipped, id) : null
        return zipFile?.byteLength || loader.getSize(id) || 4000
      })
      this._locationIndex = createEstimatedIndex(sizes)
    }

    this._totalPages = Math.max(1, this._locationIndex.totalLocations)

    // Carga crítica: Alvo (0) e vizinha (1) com refino imediato do LocationIndex
    if (firstDoc && this._sections.length > 0) {
      const chars0 = countSectionText(firstDoc)
      this._locationIndex = this._locationIndex.withExactSection(0, chars0)
    }

    if (this._sections.length > 1) {
      const secondDoc = await this._getSectionDoc(1)
      if (secondDoc) {
        const chars1 = countSectionText(secondDoc)
        this._locationIndex = this._locationIndex.withExactSection(1, chars1)
      }
    }

    this._updatePagination()

    // Agendamento background via ChunkScheduler
    if (!this._locationIndex.isExact && this._sections.length > 0) {
      const items = this._sections.map((_, i) => ({ index: i }))
      this._scheduler.start(items, 0, async (item) => {
        const sIdx = item.index
        const doc = await this._getSectionDoc(sIdx)
        const chars = doc ? countSectionText(doc) : 0
        this._locationIndex = this._locationIndex.withExactSection(sIdx, chars)
        this._updatePagination()
        this._notifyIndexRefinedThrottled()
        if (this._locationIndex.isExact) {
          void setCachedLocations(bookHash, [...this._locationIndex.getCharsPerSection()])
        }
      })
    }

    this._isLoaded = true
  }

  async getPage(pageNumber: number, targetWidth?: number, targetHeight?: number): Promise<PageData> {
    if (!this._epub) throw new Error('EPUB não carregado')

    const cached = this._pageCanvases.get(pageNumber)
    if (cached) return this._canvasToPageData(cached)

    const canvas = await this._renderPageToCanvas(pageNumber, targetWidth, targetHeight)
    this._pageCanvases.set(pageNumber, canvas)
    return this._canvasToPageData(canvas)
  }

  async getTextContent(pageNumber: number): Promise<string> {
    if (!this._epub) throw new Error('EPUB não carregado')
    const mapping = await this._resolvePageMapping(pageNumber)
    if (!mapping) return ''

    const section = this._sections[mapping.sectionIndex]
    if (!section) return ''

    try {
      const doc = await this._getSectionDoc(mapping.sectionIndex)
      if (!doc) return ''
      const bodyEl = doc.body || (typeof doc.querySelector === 'function' ? doc.querySelector('body') : null) || (typeof doc.getElementsByTagName === 'function' ? doc.getElementsByTagName('body')[0] : null) || (doc as any)
      const fullText = (bodyEl?.innerText || bodyEl?.textContent || '').replace(/\s+/g, ' ').trim()
      if (mapping.totalPagesInSection <= 1) {
        return fullText
      }
      const charsPerPage = Math.ceil(fullText.length / mapping.totalPagesInSection)
      const start = mapping.pageIndexInSection * charsPerPage
      const end = Math.min(fullText.length, start + charsPerPage)
      return fullText.slice(start, end).trim()
    } catch {
      return ''
    }
  }

  async renderTextLayer(pageNumber: number, container: HTMLElement, targetWidth?: number, targetHeight?: number): Promise<void> {
    if (!this._epub) throw new Error('EPUB não carregado')
    const mapping = await this._resolvePageMapping(pageNumber)
    if (!mapping) return

    const section = this._sections[mapping.sectionIndex]
    if (!section) return

    try {
      const doc = await this._getSectionDoc(mapping.sectionIndex)
      if (!doc) return

      const isCover = isCoverSection(section, doc)
      const docStyles = doc && typeof doc.querySelectorAll === 'function' ? Array.from(doc.querySelectorAll('style')).map((s) => s.innerHTML).join('\n') : ''

      const bodyEl = doc.body || (typeof doc.querySelector === 'function' ? doc.querySelector('body') : null) || (typeof doc.getElementsByTagName === 'function' ? doc.getElementsByTagName('body')[0] : null) || (doc as any)
      const bodyContent = bodyEl ? (bodyEl.innerHTML || bodyEl.textContent || '') : (doc.documentElement ? doc.documentElement.innerHTML : '')
      const bodyClasses = bodyEl && typeof bodyEl.getAttribute === 'function' ? (bodyEl.getAttribute('class') || '') : ''

      const width = targetWidth && targetWidth > 0 ? targetWidth : this._pageWidth
      const height = targetHeight && targetHeight > 0 ? targetHeight : this._pageHeight
      this._pageWidth = width
      this._pageHeight = height

      const { paddingX, paddingY, paddingBottom } = getEpubPagePadding(width, height)
      const colWidth = width - (2 * paddingX)
      const colGap = paddingX * 2
      const colOffset = mapping.pageIndexInSection * width

      container.innerHTML = ''
      const viewportWrapper = document.createElement('div')
      viewportWrapper.className = 'epub-text-layer-viewport'
      viewportWrapper.style.position = 'absolute'
      viewportWrapper.style.top = '0'
      viewportWrapper.style.left = '0'
      viewportWrapper.style.width = `${width}px`
      viewportWrapper.style.height = `${height}px`
      viewportWrapper.style.overflow = 'hidden'
      viewportWrapper.style.pointerEvents = 'auto'

      const styleTag = document.createElement('style')
      styleTag.innerHTML = `${EPUB_TYPOGRAPHY_STYLES}\n${docStyles}`
      viewportWrapper.appendChild(styleTag)

      const contentWrapper = document.createElement('div')
      contentWrapper.className = `epub-text-layer-content ${isCover ? 'epub-cover-page' : ''} ${bodyClasses}`.trim()
      contentWrapper.style.width = `${width}px`
      contentWrapper.style.height = `${height}px`
      if (isCover) {
        contentWrapper.style.padding = '12px'
        contentWrapper.style.display = 'flex'
        contentWrapper.style.alignItems = 'center'
        contentWrapper.style.justifyContent = 'center'
        contentWrapper.style.marginLeft = '0'
      } else {
        contentWrapper.style.padding = `${paddingY}px ${paddingX}px ${paddingBottom}px ${paddingX}px`
        contentWrapper.style.columnWidth = `${colWidth}px`
        contentWrapper.style.columnGap = `${colGap}px`
        contentWrapper.style.columnFill = 'auto'
        contentWrapper.style.marginLeft = `-${colOffset}px`
      }
      contentWrapper.style.boxSizing = 'border-box'
      contentWrapper.style.fontFamily = this._fontFamily
      contentWrapper.style.fontSize = `${this._fontSize}px`
      contentWrapper.style.wordWrap = 'break-word'
      contentWrapper.style.userSelect = 'text'
      contentWrapper.style.webkitUserSelect = 'text'

      contentWrapper.innerHTML = bodyContent

      viewportWrapper.appendChild(contentWrapper)
      container.appendChild(viewportWrapper)

      // Blindagem defensiva contra páginas pretas: se colOffset ultrapassar a largura total de colunas,
      // reposiciona para a última coluna com conteúdo
      const actualScrollW = contentWrapper.scrollWidth
      if (actualScrollW > 0 && colOffset >= actualScrollW && mapping.pageIndexInSection > 0) {
        const lastValidColIndex = Math.max(0, Math.ceil(actualScrollW / width) - 1)
        const adjustedOffset = lastValidColIndex * width
        contentWrapper.style.marginLeft = `-${adjustedOffset}px`
      }
    } catch (err) {
      logWarn('[EpubAdapter] textLayer render error:', err)
    }
  }

  getSectionCount(): number {
    return this._sections.length
  }

  async renderSectionContinuous(sectionIndex: number, container: HTMLElement): Promise<void> {
    if (!this._epub) throw new Error('EPUB não carregado')
    const section = this._sections[sectionIndex]
    if (!section) return

    try {
      const doc = await this._getSectionDoc(sectionIndex)
      if (!doc) return

      const isCover = isCoverSection(section, doc)
      const docStyles = doc && typeof doc.querySelectorAll === 'function'
        ? Array.from(doc.querySelectorAll('style')).map((s) => s.innerHTML).join('\n')
        : ''

      const bodyEl = doc.body || (typeof doc.querySelector === 'function' ? doc.querySelector('body') : null) || (typeof doc.getElementsByTagName === 'function' ? doc.getElementsByTagName('body')[0] : null) || (doc as any)
      const bodyContent = bodyEl ? (bodyEl.innerHTML || bodyEl.textContent || '') : (doc.documentElement ? doc.documentElement.innerHTML : '')
      const bodyClasses = bodyEl && typeof bodyEl.getAttribute === 'function' ? (bodyEl.getAttribute('class') || '') : ''

      container.innerHTML = ''
      const sectionWrapper = document.createElement('div')
      sectionWrapper.className = `epub-continuous-section ${isCover ? 'epub-cover-section' : ''} ${bodyClasses}`.trim()
      sectionWrapper.style.fontFamily = this._fontFamily
      sectionWrapper.style.fontSize = `${this._fontSize}px`
      sectionWrapper.style.lineHeight = '1.75'
      sectionWrapper.style.wordWrap = 'break-word'
      sectionWrapper.style.userSelect = 'text'
      sectionWrapper.style.webkitUserSelect = 'text'
      sectionWrapper.style.boxSizing = 'border-box'
      sectionWrapper.style.width = '100%'

      const styleTag = document.createElement('style')
      styleTag.innerHTML = `${EPUB_TYPOGRAPHY_STYLES}\n${docStyles}`
      sectionWrapper.appendChild(styleTag)

      const contentDiv = document.createElement('div')
      contentDiv.className = 'epub-continuous-content epub-text-layer-content'
      contentDiv.innerHTML = bodyContent
      sectionWrapper.appendChild(contentDiv)

      container.appendChild(sectionWrapper)
    } catch (err) {
      logWarn('[EpubAdapter] renderSectionContinuous error:', err)
    }
  }

  private async _renderPageToCanvas(pageNumber: number, targetWidth?: number, targetHeight?: number): Promise<HTMLCanvasElement> {
    const width = targetWidth && targetWidth > 0 ? targetWidth : this._pageWidth
    const height = targetHeight && targetHeight > 0 ? targetHeight : this._pageHeight
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1

    const renderW = Math.round(width * dpr)
    const renderH = Math.round(height * dpr)
    const canvas = document.createElement('canvas')
    canvas.width = renderW
    canvas.height = renderH
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return canvas

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.fillStyle = '#f5eedc'
    ctx.fillRect(0, 0, renderW, renderH)

    const mapping = await this._resolvePageMapping(pageNumber)
    if (!mapping) return canvas

    const section = this._sections[mapping.sectionIndex]
    if (!section) return canvas

    try {
      const doc = await this._getSectionDoc(mapping.sectionIndex)
      if (!doc) return canvas

      const isCover = isCoverSection(section, doc)
      const docStyles = doc && typeof doc.querySelectorAll === 'function'
        ? Array.from(doc.querySelectorAll('style')).map((s) => s.innerHTML).join('\n')
        : ''

      const bodyEl = doc.body
        || (typeof doc.querySelector === 'function' ? doc.querySelector('body') : null)
        || (typeof doc.getElementsByTagName === 'function' ? doc.getElementsByTagName('body')[0] : null)
        || (doc as any)

      let bodyHtml = ''
      if (typeof XMLSerializer !== 'undefined' && bodyEl) {
        try {
          const serializer = new XMLSerializer()
          bodyHtml = serializer.serializeToString(bodyEl)
          // Remove a tag body externa para reutilizar com a div de conteúdo
          bodyHtml = bodyHtml.replace(/^<body[^>]*>/i, '').replace(/<\/body>$/i, '')
        } catch {
          bodyHtml = bodyEl.innerHTML || bodyEl.textContent || ''
        }
      } else {
        bodyHtml = bodyEl ? (bodyEl.innerHTML || bodyEl.textContent || '') : ''
      }

      const bodyClasses = bodyEl && typeof bodyEl.getAttribute === 'function'
        ? (bodyEl.getAttribute('class') || '')
        : ''

      const { paddingX, paddingY } = getEpubPagePadding(width, height)
      const colWidth = width - (2 * paddingX)
      const colGap = paddingX * 2
      const colOffset = mapping.pageIndexInSection * width

      const contentStyle = isCover
        ? 'width: 100%; height: 100%; padding: 12px; display: flex; align-items: center; justify-content: center; box-sizing: border-box;'
        : `width: ${width}px; height: ${height}px; padding: ${paddingY}px ${paddingX}px; column-width: ${colWidth}px; column-gap: ${colGap}px; column-fill: auto; margin-left: -${colOffset}px; box-sizing: border-box; word-wrap: break-word;`

      // Garante que entidades HTML sejam válidas para XML/SVG
      const safeBodyHtml = bodyHtml.replace(/&nbsp;/g, '&#160;')

      const svgXml = `<svg xmlns="http://www.w3.org/2000/svg" width="${renderW}" height="${renderH}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;overflow:hidden;transform:scale(${dpr});transform-origin:0 0;background-color:#f5eedc;">
      <style>
        ${EPUB_TYPOGRAPHY_STYLES}
        ${docStyles}
      </style>
      <div class="epub-text-layer-content ${isCover ? 'epub-cover-page' : ''} ${bodyClasses}" style="${contentStyle}">
        ${safeBodyHtml}
      </div>
    </div>
  </foreignObject>
</svg>`

      const img = new Image()
      const blob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)

      await new Promise<void>((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, renderW, renderH)
          URL.revokeObjectURL(url)
          resolve()
        }
        img.onerror = () => {
          URL.revokeObjectURL(url)
          resolve()
        }
        img.src = url
      })
    } catch (err) {
      logWarn('[EpubAdapter] canvas SVG render error:', err)
    }

    return canvas
  }

  private _canvasToPageData(canvas: HTMLCanvasElement): PageData {
    return {
      width: canvas.width,
      height: canvas.height,
      aspectRatio: canvas.height > 0 ? canvas.width / canvas.height : 1,
      render: async (ctx: CanvasRenderingContext2D): Promise<void> => {
        if (!ctx) return
        const targetW = ctx.canvas?.width ?? canvas.width
        const targetH = ctx.canvas?.height ?? canvas.height
        if (typeof ctx.drawImage === 'function') {
          ctx.drawImage(canvas, 0, 0, targetW, targetH)
        }
      },
    }
  }

  destroy(): void {
    this._scheduler.cancel()
    if (this._refineThrottleTimer) {
      clearTimeout(this._refineThrottleTimer)
      this._refineThrottleTimer = null
    }
    this._indexRefinedCallbacks.clear()
    this._sections.forEach((s) => {
      try { s.unload?.() } catch { /* ignorar erros ao descarregar */ }
    })
    this._pageCanvases.forEach((canvas) => {
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
    })
    this._pageCanvases.clear()
    this._sectionDocsLru.clear()
    this._epub = null
    this._sections = []
    this._totalPages = 0
    this._isLoaded = false
    this._unzipped = null
  }
}
