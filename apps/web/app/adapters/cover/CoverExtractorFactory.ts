import type { ICoverExtractor } from './ICoverExtractor'
import { PdfCoverExtractor } from './PdfCoverExtractor'
import { EpubCoverExtractor } from './EpubCoverExtractor'
import type { SupportedFileType } from '~/interfaces/reader/IValidationResult'

export class CoverExtractorFactory {
  private static extractors: Map<string, ICoverExtractor> = new Map()

  static getExtractor(fileType: SupportedFileType | string): ICoverExtractor | null {
    const key = fileType.toLowerCase()

    if (this.extractors.has(key)) {
      return this.extractors.get(key)!
    }

    let instance: ICoverExtractor | null = null

    switch (key) {
      case 'pdf':
        instance = new PdfCoverExtractor()
        break
      case 'epub':
        instance = new EpubCoverExtractor()
        break
      default:
        return null
    }

    if (instance) {
      this.extractors.set(key, instance)
    }

    return instance
  }

  static registerExtractor(extractor: ICoverExtractor): void {
    this.extractors.set(extractor.supportedType.toLowerCase(), extractor)
  }

  static clearExtractors(): void {
    this.extractors.clear()
  }
}
