import type { ReadingPosition } from './readingPosition'
import { parsePosition } from './readingPosition'
import type { LocationIndex } from './locationIndex'

export interface LegacyResolveInput {
  cfi?: string | null
  chapterTitle?: string | null
  progress?: number | null
  selectedText?: string | null
}

export interface LegacyResolveResult {
  position: ReadingPosition
  unit: number
  isApproximate: boolean
}

export interface SectionTextProvider {
  getSectionCount(): number
  getSectionText?(sectionIndex: number): Promise<string> | string
}

/**
 * Resolve posições legadas de anotações (page:N, CFI antigo, progresso %)
 * para a nova posição canônica ReadingPosition e unidade de navegação.
 */
export async function resolveLegacyPosition(
  input: LegacyResolveInput,
  options: {
    docType: 'epub' | 'pdf' | 'didactic'
    locationIndex?: LocationIndex | null
    totalPages?: number
    sectionProvider?: SectionTextProvider | null
  }
): Promise<LegacyResolveResult> {
  const { docType, locationIndex, totalPages = 1, sectionProvider } = options

  // 1. Já é posição canônica serializada (ex: epub:2:150 ou page:10)
  if (input.cfi) {
    const trimmed = input.cfi.trim()
    if (trimmed.startsWith('epub:')) {
      const pos = parsePosition(trimmed)
      if (pos && pos.kind === 'epub') {
        const unit = locationIndex ? locationIndex.toLocation(pos) : pos.sectionIndex + 1
        return { position: pos, unit, isApproximate: false }
      }
    }

    if (trimmed.startsWith('page:')) {
      const pageNum = parseInt(trimmed.replace('page:', ''), 10)
      if (!isNaN(pageNum) && pageNum >= 1) {
        if (docType === 'pdf') {
          return {
            position: { kind: 'pdf', page: pageNum },
            unit: pageNum,
            isApproximate: false
          }
        }

        // Para EPUB: "page:N" era a página sintética antiga!
        // Tentamos busca textual pelo selectedText na seção estimada
        if (input.selectedText && input.selectedText.trim().length > 3 && sectionProvider && typeof sectionProvider.getSectionText === 'function') {
          const totalSections = Math.max(1, sectionProvider.getSectionCount())
          // Seção estimada proporcionalmente
          const estimatedSection = Math.max(0, Math.min(totalSections - 1, Math.floor(((pageNum - 1) / Math.max(1, totalPages)) * totalSections)))

          // Busca primeiro na seção estimada, depois nas vizinhas, depois nas demais
          const searchOrder = [estimatedSection]
          for (let s = 0; s < totalSections; s++) {
            if (s !== estimatedSection) searchOrder.push(s)
          }

          const targetSnippet = input.selectedText.trim().slice(0, 80)
          for (const sIdx of searchOrder) {
            try {
              const text = await sectionProvider.getSectionText(sIdx)
              const matchIdx = text ? text.indexOf(targetSnippet) : -1
              if (matchIdx !== -1) {
                const pos: ReadingPosition = {
                  kind: 'epub',
                  sectionIndex: sIdx,
                  charOffset: matchIdx
                }
                const unit = locationIndex ? locationIndex.toLocation(pos) : sIdx + 1
                return { position: pos, unit, isApproximate: false }
              }
            } catch {
              /* continuar busca */
            }
          }
        }

        // Fallback proporcional se busca de texto falhar
        const totalSections = sectionProvider ? Math.max(1, sectionProvider.getSectionCount()) : 1
        const propSection = Math.max(0, Math.min(totalSections - 1, Math.floor(((pageNum - 1) / Math.max(1, totalPages)) * totalSections)))
        const pos: ReadingPosition = {
          kind: 'epub',
          sectionIndex: propSection,
          charOffset: 0
        }
        const unit = locationIndex ? locationIndex.toLocation(pos) : propSection + 1
        return { position: pos, unit, isApproximate: true }
      }
    }
  }

  // 2. Extrai de chapterTitle (ex: "Página 12")
  if (input.chapterTitle) {
    const match = input.chapterTitle.match(/P[áa]gina\s+(\d+)/i)
    if (match && match[1]) {
      const p = parseInt(match[1], 10)
      if (!isNaN(p)) {
        return resolveLegacyPosition(
          { ...input, cfi: `page:${p}`, chapterTitle: undefined },
          options
        )
      }
    }
  }

  // 3. Fallback de porcentagem (progress)
  if (typeof input.progress === 'number' && input.progress >= 0) {
    if (docType === 'pdf') {
      const page = Math.max(1, Math.min(totalPages, Math.round((input.progress / 100) * totalPages)))
      return {
        position: { kind: 'pdf', page },
        unit: page,
        isApproximate: true
      }
    }

    if (locationIndex && locationIndex.totalLocations > 0) {
      const loc = Math.max(1, Math.min(locationIndex.totalLocations, Math.round((input.progress / 100) * locationIndex.totalLocations)))
      const pos = locationIndex.fromLocation(loc)
      return {
        position: pos,
        unit: loc,
        isApproximate: true
      }
    }
  }

  // Default absoluto
  if (docType === 'pdf') {
    return {
      position: { kind: 'pdf', page: 1 },
      unit: 1,
      isApproximate: true
    }
  }

  return {
    position: { kind: 'epub', sectionIndex: 0, charOffset: 0 },
    unit: 1,
    isApproximate: true
  }
}
