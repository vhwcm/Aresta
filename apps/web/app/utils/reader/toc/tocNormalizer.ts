import type { ReadingPosition } from '../position/readingPosition'
import type { LocationIndex } from '../position/locationIndex'

export interface TocEntry {
  label: string
  position: ReadingPosition
  unit: number
  depth: number
  children: TocEntry[]
}

export interface RawEpubTocItem {
  label?: string
  title?: string
  href?: string
  subitems?: RawEpubTocItem[]
  children?: RawEpubTocItem[]
}

export interface RawPdfOutlineItem {
  title?: string
  dest?: any
  items?: RawPdfOutlineItem[]
}

/**
 * Normaliza o TOC do Foliate (EPUB) para a árvore de TocEntry canônica.
 */
export function normalizeEpubToc(
  items: RawEpubTocItem[],
  resolveHref: (href: string) => { sectionIndex: number; charOffset?: number } | null,
  locationIndex?: LocationIndex,
  currentDepth: number = 0
): TocEntry[] {
  if (!Array.isArray(items)) return []

  const result: TocEntry[] = []

  for (const item of items) {
    const rawLabel = item.label || item.title || 'Sem título'
    const href = item.href || ''
    const resolved = href ? resolveHref(href) : null

    const sectionIndex = resolved ? Math.max(0, resolved.sectionIndex) : 0
    const charOffset = resolved?.charOffset ? Math.max(0, resolved.charOffset) : 0

    const position: ReadingPosition = {
      kind: 'epub',
      sectionIndex,
      charOffset
    }

    const unit = locationIndex
      ? locationIndex.toLocation(position)
      : sectionIndex + 1

    const rawChildren = item.subitems || item.children || []
    const children = normalizeEpubToc(
      rawChildren,
      resolveHref,
      locationIndex,
      currentDepth + 1
    )

    result.push({
      label: rawLabel.trim() || 'Sem título',
      position,
      unit,
      depth: currentDepth,
      children
    })
  }

  return result
}

/**
 * Normaliza o Outline do PDF.js para a árvore de TocEntry canônica.
 */
export async function normalizePdfToc(
  items: RawPdfOutlineItem[],
  resolvePageNumber: (dest: any) => Promise<number | null> | number | null,
  currentDepth: number = 0
): Promise<TocEntry[]> {
  if (!Array.isArray(items)) return []

  const result: TocEntry[] = []

  for (const item of items) {
    const rawLabel = item.title || 'Sem título'
    const resolvedPage = item.dest != null ? await resolvePageNumber(item.dest) : 1
    const page = resolvedPage && resolvedPage >= 1 ? Math.floor(resolvedPage) : 1

    const position: ReadingPosition = {
      kind: 'pdf',
      page
    }

    const rawChildren = item.items || []
    const children = await normalizePdfToc(
      rawChildren,
      resolvePageNumber,
      currentDepth + 1
    )

    result.push({
      label: rawLabel.trim() || 'Sem título',
      position,
      unit: page,
      depth: currentDepth,
      children
    })
  }

  return result
}
