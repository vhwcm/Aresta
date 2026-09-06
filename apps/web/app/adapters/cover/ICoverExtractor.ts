export interface ExtractedCoverResult {
  blob: Blob
  dataUrl: string
  mimeType: string
  width?: number
  height?: number
  source: 'definition' | 'first-page' | 'first-image'
}

export interface ICoverExtractor {
  readonly supportedType: 'pdf' | 'epub'
  extractCover(
    source: File | Blob | ArrayBuffer,
    fileName?: string
  ): Promise<ExtractedCoverResult | null>
}
