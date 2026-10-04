import { LOCATION_SIZE, type ReadingPosition } from './readingPosition'

export type EpubReadingPosition = Extract<ReadingPosition, { kind: 'epub' }>

export interface LocationIndex {
  readonly isExact: boolean
  readonly totalLocations: number
  toLocation(pos: EpubReadingPosition): number // 1-based
  fromLocation(location: number): EpubReadingPosition
  sectionStartLocation(sectionIndex: number): number
  withExactSection(sectionIndex: number, chars: number): LocationIndex // imutável
  getCharsPerSection(): readonly number[]
}

class LocationIndexImpl implements LocationIndex {
  readonly isExact: boolean
  readonly totalLocations: number
  private readonly chars: number[]
  private readonly prefixSums: number[]
  private readonly exactSections: Set<number>

  constructor(
    charsPerSection: number[],
    isExact: boolean,
    exactSections?: Set<number>
  ) {
    this.chars = charsPerSection.map(c => Math.max(0, Math.round(c)))
    this.isExact = isExact
    this.exactSections = exactSections ? new Set(exactSections) : (isExact ? new Set(this.chars.map((_, i) => i)) : new Set())

    const n = this.chars.length
    this.prefixSums = new Array(n + 1)
    this.prefixSums[0] = 0
    for (let i = 0; i < n; i++) {
      this.prefixSums[i + 1] = (this.prefixSums[i] ?? 0) + (this.chars[i] ?? 0)
    }

    const totalChars = n > 0 ? (this.prefixSums[n] ?? 0) : 0
    this.totalLocations = totalChars > 0 ? Math.max(1, Math.ceil(totalChars / LOCATION_SIZE)) : 1
  }

  getCharsPerSection(): readonly number[] {
    return this.chars
  }

  toLocation(pos: EpubReadingPosition): number {
    const n = this.chars.length
    if (n === 0) return 1

    const sectionIndex = Math.min(n - 1, Math.max(0, Math.floor(pos.sectionIndex)))
    const sectionStartChar = this.prefixSums[sectionIndex] ?? 0
    const sectionLength = this.chars[sectionIndex] ?? 0
    const charOffset = Math.min(sectionLength, Math.max(0, Math.floor(pos.charOffset)))

    const globalChar = sectionStartChar + charOffset
    const location = Math.floor(globalChar / LOCATION_SIZE) + 1
    return Math.min(this.totalLocations, Math.max(1, location))
  }

  fromLocation(location: number): EpubReadingPosition {
    const n = this.chars.length
    if (n === 0) {
      return { kind: 'epub', sectionIndex: 0, charOffset: 0 }
    }

    const clampedLoc = Math.min(this.totalLocations, Math.max(1, Math.floor(location)))
    const targetGlobalChar = (clampedLoc - 1) * LOCATION_SIZE

    // Busca binária para encontrar a seção que contém targetGlobalChar
    let low = 0
    let high = n - 1
    let chosenSection = 0

    while (low <= high) {
      const mid = (low + high) >> 1
      if ((this.prefixSums[mid] ?? 0) <= targetGlobalChar) {
        chosenSection = mid
        low = mid + 1
      } else {
        high = mid - 1
      }
    }

    // Se a seção for vazia e estiver no final do livro ou houver seção posterior com conteúdo
    const sectionStartChar = this.prefixSums[chosenSection] ?? 0
    const sectionChars = this.chars[chosenSection] ?? 0
    const charOffset = Math.min(sectionChars, Math.max(0, targetGlobalChar - sectionStartChar))

    return {
      kind: 'epub',
      sectionIndex: chosenSection,
      charOffset
    }
  }

  sectionStartLocation(sectionIndex: number): number {
    return this.toLocation({
      kind: 'epub',
      sectionIndex,
      charOffset: 0
    })
  }

  withExactSection(sectionIndex: number, chars: number): LocationIndex {
    const n = this.chars.length
    if (sectionIndex < 0 || sectionIndex >= n) {
      return this
    }

    const newChars = [...this.chars]
    newChars[sectionIndex] = Math.max(0, Math.round(chars))

    const newExact = new Set(this.exactSections)
    newExact.add(sectionIndex)

    const allExact = newExact.size >= n
    return new LocationIndexImpl(newChars, allExact, newExact)
  }
}

export function createEstimatedIndex(
  uncompressedBytesPerSection: number[],
  charsPerByte: number = 0.45
): LocationIndex {
  const charsPerSection = uncompressedBytesPerSection.map(bytes =>
    Math.max(0, Math.round(bytes * charsPerByte))
  )
  return new LocationIndexImpl(charsPerSection, false)
}

export function createExactIndex(charsPerSection: number[]): LocationIndex {
  return new LocationIndexImpl(charsPerSection, true)
}
