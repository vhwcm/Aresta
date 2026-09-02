export type SupportedMimeType = 'application/pdf' | 'application/epub+zip' | 'application/json'
export type SupportedFileType = 'pdf' | 'epub' | 'didactic'

export interface ValidationSuccess {
  valid: true
  fileType: SupportedFileType
  mimeType: SupportedMimeType
  fileName: string
  fileSizeBytes: number
}

export interface ValidationFailure {
  valid: false
  reason: 'unsupported_mime' | 'invalid_signature' | 'file_too_large' | 'empty_file'
  message: string
  fileName: string
}

export type IValidationResult = ValidationSuccess | ValidationFailure
