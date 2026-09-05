import type { IValidationResult, SupportedFileType } from '~/interfaces/reader/IValidationResult'

const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024

const BYTE_SIGNATURES: Record<SupportedFileType, Uint8Array[]> = {
  pdf: [
    new Uint8Array([0x25, 0x50, 0x44, 0x46]),
  ],
  epub: [
    new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
    new Uint8Array([0x50, 0x4b, 0x05, 0x06]),
    new Uint8Array([0x50, 0x4b, 0x07, 0x08]),
  ],
  didactic: [],
}

const MIME_TYPE_MAP: Record<string, SupportedFileType> = {
  'application/pdf': 'pdf',
  'application/epub+zip': 'epub',
  'application/zip': 'epub',
}

async function readFileHeader(file: File, bytes: number): Promise<Uint8Array> {
  const slice = file.slice(0, bytes)
  const buffer = await slice.arrayBuffer()
  return new Uint8Array(buffer)
}

function matchesSignature(header: Uint8Array, signature: Uint8Array): boolean {
  if (header.length < signature.length) return false
  for (let i = 0; i < signature.length; i++) {
    if (header[i] !== signature[i]) return false
  }
  return true
}

function detectFileTypeFromBytes(header: Uint8Array): SupportedFileType | null {
  for (const [fileType, signatures] of Object.entries(BYTE_SIGNATURES) as [SupportedFileType, Uint8Array[]][]) {
    for (const sig of signatures) {
      if (matchesSignature(header, sig)) return fileType
    }
  }
  return null
}

export async function validateBookFile(file: File): Promise<IValidationResult> {
  if (file.size === 0) {
    return {
      valid: false,
      reason: 'empty_file',
      message: 'O arquivo está vazio.',
      fileName: file.name,
    }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      reason: 'file_too_large',
      message: `Tamanho máximo permitido: ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.`,
      fileName: file.name,
    }
  }

  const header = await readFileHeader(file, 8)
  const detectedType = detectFileTypeFromBytes(header)

  if (detectedType === null) {
    return {
      valid: false,
      reason: 'invalid_signature',
      message: 'O arquivo não é um PDF ou EPUB válido (assinatura de bytes inválida).',
      fileName: file.name,
    }
  }

  const mimeFromBrowser = file.type
  const mimeType = detectedType === 'pdf' ? 'application/pdf' : 'application/epub+zip'

  if (mimeFromBrowser && !Object.keys(MIME_TYPE_MAP).includes(mimeFromBrowser)) {
    return {
      valid: false,
      reason: 'unsupported_mime',
      message: `Tipo MIME não suportado: ${mimeFromBrowser}. Apenas PDF e EPUB são aceitos.`,
      fileName: file.name,
    }
  }

  return {
    valid: true,
    fileType: detectedType,
    mimeType,
    fileName: file.name,
    fileSizeBytes: file.size,
  }
}

export function detectFileTypeFromArrayBuffer(
  buffer: ArrayBuffer,
  fallback: SupportedFileType = 'epub',
): SupportedFileType {
  if (!buffer || buffer.byteLength < 4) return fallback
  const header = new Uint8Array(buffer.slice(0, 8))
  return detectFileTypeFromBytes(header) || fallback
}

export { readFileHeader, matchesSignature, detectFileTypeFromBytes, MAX_FILE_SIZE_BYTES }

