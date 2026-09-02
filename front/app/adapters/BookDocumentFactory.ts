import type { IBookDocument } from '~/interfaces/reader/IBookDocument'
import type { SupportedFileType } from '~/interfaces/reader/IValidationResult'
import { PdfDocumentAdapter } from '~/adapters/PdfDocumentAdapter'
import { EpubDocumentAdapter } from '~/adapters/EpubDocumentAdapter'
import { DidacticDocumentAdapter } from '~/adapters/DidacticDocumentAdapter'

const ADAPTER_FACTORY: Record<SupportedFileType, () => IBookDocument> = {
  pdf: () => new PdfDocumentAdapter(),
  epub: () => new EpubDocumentAdapter(),
  didactic: () => new DidacticDocumentAdapter(),
}

export function createBookDocument(fileType: SupportedFileType): IBookDocument {
  const factory = ADAPTER_FACTORY[fileType]
  if (!factory) {
    throw new Error(`Formato não suportado: ${fileType}`)
  }
  return factory()
}
