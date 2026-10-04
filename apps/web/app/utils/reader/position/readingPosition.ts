export type ReadingPosition =
  | { kind: 'epub'; sectionIndex: number; charOffset: number }
  | { kind: 'pdf'; page: number }

export interface LegacyEpubPage {
  kind: 'legacy-page'
  page: number
}

export const LOCATION_SIZE = 1024 as const

/**
 * Serializa uma posição de leitura canônica em string ('epub:s:o' ou 'page:N').
 */
export function serializePosition(p: ReadingPosition): string {
  if (p.kind === 'epub') {
    const s = Math.max(0, Math.floor(p.sectionIndex))
    const o = Math.max(0, Math.floor(p.charOffset))
    return `epub:${s}:${o}`
  }
  const page = Math.max(1, Math.floor(p.page))
  return `page:${page}`
}

/**
 * Converte string canônica ou legada para ReadingPosition ou LegacyEpubPage.
 * Retorna null se a string for inválida.
 */
export function parsePosition(
  raw: string | null | undefined,
  context?: 'epub' | 'pdf'
): ReadingPosition | LegacyEpubPage | null {
  if (raw == null || typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  // 1. Canônico EPUB: epub:<sectionIndex>:<charOffset>
  const epubMatch = /^epub:(\d+):(\d+)$/.exec(trimmed)
  if (epubMatch && epubMatch[1] && epubMatch[2]) {
    const sectionIndex = parseInt(epubMatch[1], 10)
    const charOffset = parseInt(epubMatch[2], 10)
    if (!Number.isNaN(sectionIndex) && !Number.isNaN(charOffset)) {
      return { kind: 'epub', sectionIndex, charOffset }
    }
  }

  // 2. Legado explícito: legacy-page:<N>
  const legacyMatch = /^legacy-page:(\d+)$/.exec(trimmed)
  if (legacyMatch && legacyMatch[1]) {
    const page = parseInt(legacyMatch[1], 10)
    if (!Number.isNaN(page) && page >= 1) {
      return { kind: 'legacy-page', page }
    }
  }

  // 3. Padrão page:<N>
  const pageMatch = /^page:(\d+)$/.exec(trimmed)
  if (pageMatch && pageMatch[1]) {
    const page = parseInt(pageMatch[1], 10)
    if (!Number.isNaN(page) && page >= 1) {
      if (context === 'epub') {
        return { kind: 'legacy-page', page }
      }
      return { kind: 'pdf', page }
    }
    return null
  }

  // 4. Número inteiro puro (fallback para chamadores sem prefixo)
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10)
    if (!Number.isNaN(num) && num >= 1) {
      if (context === 'epub') {
        return { kind: 'legacy-page', page: num }
      }
      if (context === 'pdf') {
        return { kind: 'pdf', page: num }
      }
    }
  }

  return null
}
