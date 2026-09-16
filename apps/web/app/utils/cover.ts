export interface DidacticCoverParams {
  title: string
  topic?: string
  themeName?: string
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case '\'':
        return '&apos;'
      case '"':
        return '&quot;'
      default:
        return c
    }
  })
}

function wrapText(text: string, maxCharsPerLine = 22): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim()
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines.slice(0, 4)
}

export function generateDidacticCoverSvg(params: DidacticCoverParams): string {
  const { title, topic, themeName } = params
  const lines = wrapText(title || 'Livreto Didático', 20)

  let fontSize = 38
  let lineHeight = 48
  if (lines.length === 2) {
    fontSize = 34
    lineHeight = 44
  } else if (lines.length === 3) {
    fontSize = 28
    lineHeight = 38
  } else if (lines.length >= 4) {
    fontSize = 24
    lineHeight = 32
  }

  const startY = 430 - ((lines.length - 1) * lineHeight) / 2
  const dividerY = startY + (lines.length - 1) * lineHeight + 40
  const topicY = dividerY + 34

  const titleSpans = lines
    .map((line, i) => `<tspan x="300" y="${startY + i * lineHeight}">${escapeXml(line)}</tspan>`)
    .join('')

  const categoryText = escapeXml((themeName || topic || 'SÍNTESE & APRENDIZADO ATIVO').toUpperCase())
  const subtitleText = escapeXml(topic && topic !== title ? topic : 'Livreto Didático com IA')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="100%" height="100%">
  <defs>
    <linearGradient id="coverBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1c1917" />
      <stop offset="50%" stop-color="#141211" />
      <stop offset="100%" stop-color="#0c0b0a" />
    </linearGradient>
    <radialGradient id="coverGlow" cx="50%" cy="25%" r="60%">
      <stop offset="0%" stop-color="#f97316" stop-opacity="0.22" />
      <stop offset="70%" stop-color="#f97316" stop-opacity="0.03" />
      <stop offset="100%" stop-color="#141211" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="spineHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08" />
      <stop offset="60%" stop-color="#000000" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="accentGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f97316" stop-opacity="0" />
      <stop offset="50%" stop-color="#f97316" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#f97316" stop-opacity="0" />
    </linearGradient>
  </defs>

  <!-- Fundo Principal -->
  <rect width="600" height="900" fill="url(#coverBg)" />
  <rect width="600" height="900" fill="url(#coverGlow)" />

  <!-- Molduras Clássicas de Encadernação -->
  <rect x="28" y="28" width="544" height="844" fill="none" stroke="#2e2a27" stroke-width="1.5" rx="4" />
  <rect x="36" y="36" width="528" height="828" fill="none" stroke="#f97316" stroke-opacity="0.3" stroke-width="1" rx="2" />

  <!-- Detalhe da Lombada (Efeito Livro Físico) -->
  <line x1="48" y1="28" x2="48" y2="872" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1" />
  <rect x="0" y="0" width="32" height="900" fill="url(#spineHighlight)" />

  <!-- Cabeçalho / Emblema Aresta -->
  <g transform="translate(300, 115)">
    <polygon points="0,-16 16,0 0,16 -16,0" fill="none" stroke="#f97316" stroke-width="1.5" />
    <polygon points="0,-8 8,0 0,8 -8,0" fill="#f97316" fill-opacity="0.5" />
    <circle cx="0" cy="0" r="2.5" fill="#fafaf9" />
  </g>
  <text x="300" y="152" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="4" fill="#a8a29e">ARESTA DIDACTIC</text>

  <!-- Tag / Pílula da Categoria ou Tema -->
  <g transform="translate(300, 195)">
    <rect x="-120" y="-13" width="240" height="26" rx="13" fill="#f97316" fill-opacity="0.12" stroke="#f97316" stroke-opacity="0.35" stroke-width="1" />
    <text x="0" y="4" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" letter-spacing="2" fill="#ea580c">${categoryText}</text>
  </g>

  <!-- Título do Livreto -->
  <text text-anchor="middle" font-family="'Newsreader', 'Playfair Display', Georgia, serif" font-size="${fontSize}" font-weight="600" fill="#fafaf9" letter-spacing="0.5">
    ${titleSpans}
  </text>

  <!-- Linha Divisória de Ouro / Laranja -->
  <line x1="210" y1="${dividerY}" x2="390" y2="${dividerY}" stroke="url(#accentGlow)" stroke-width="1.5" />
  <circle cx="300" cy="${dividerY}" r="3" fill="#f97316" />

  <!-- Subtítulo / Tópico -->
  <text x="300" y="${topicY}" text-anchor="middle" font-family="'Newsreader', Georgia, serif" font-size="14" fill="#a8a29e" font-style="italic">
    ${subtitleText}
  </text>

  <!-- Rodapé / Identidade Visual Aresta -->
  <g transform="translate(300, 775)">
    <circle cx="-16" cy="0" r="2.5" fill="#f97316" fill-opacity="0.5" />
    <line x1="-13" y1="0" x2="13" y2="0" stroke="#f97316" stroke-opacity="0.35" stroke-width="1" />
    <circle cx="16" cy="0" r="2.5" fill="#f97316" fill-opacity="0.5" />
  </g>
  <text x="300" y="808" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" letter-spacing="3" fill="#78716c">INTELIGÊNCIA ARTIFICIAL</text>
</svg>`
}

export function generateDidacticCoverDataUri(params: DidacticCoverParams): string {
  const svg = generateDidacticCoverSvg(params)
  let base64 = ''
  if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(svg, 'utf-8').toString('base64')
  } else if (typeof btoa === 'function') {
    base64 = btoa(unescape(encodeURIComponent(svg)))
  }
  return `data:image/svg+xml;base64,${base64}`
}

import { getResolvedApiBase } from './apiBase'

export const getCoverUrl = (coverPath?: string, bookId?: number) => {
  if (coverPath && (coverPath.startsWith('data:') || coverPath.startsWith('blob:') || coverPath.startsWith('http://') || coverPath.startsWith('https://'))) {
    return coverPath
  }
  const baseUrl = getResolvedApiBase()
  if (bookId) {
    return `${baseUrl}/api/books/${bookId}/cover`
  }
  if (!coverPath) return ''
  const fileName = coverPath.replace(/^storage\/covers\//, '').replace(/^storage\//, '')
  return `${baseUrl}/storage/covers/${fileName}`
}

export type BookFormat = 'EPUB' | 'PDF' | 'DIDACTIC'

export const getBookFormat = (filePath?: string | null): BookFormat => {
  if (!filePath) return 'EPUB'
  const lower = filePath.toLowerCase()
  if (lower.includes('didactic') || lower.startsWith('virtual://didactic')) {
    return 'DIDACTIC'
  }
  if (lower.endsWith('.pdf') || lower.includes('/pdfs/') || lower.includes('.pdf?')) {
    return 'PDF'
  }
  return 'EPUB'
}

export const resolveBookCover = (item: {
  coverPath?: string | null
  bookId?: number
  filePath?: string | null
  title?: string
  themes?: Array<{ name?: string }>
}): string => {
  if (item.coverPath) {
    return getCoverUrl(item.coverPath, item.bookId)
  }
  if (getBookFormat(item.filePath) === 'DIDACTIC') {
    return generateDidacticCoverDataUri({
      title: item.title || 'Livreto Didático',
      themeName: item.themes?.[0]?.name,
    })
  }
  return ''
}
