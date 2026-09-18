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
  'application/x-pdf': 'pdf',
  'application/acrobat': 'pdf',
  'applications/vnd.pdf': 'pdf',
  'text/pdf': 'pdf',
  'application/epub+zip': 'epub',
  'application/zip': 'epub',
  'application/x-zip-compressed': 'epub',
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
  if (!header || header.length < 4) return null

  // 1. Verificação rápida no offset 0 (caminho feliz direto)
  for (const [fileType, signatures] of Object.entries(BYTE_SIGNATURES) as [SupportedFileType, Uint8Array[]][]) {
    for (const sig of signatures) {
      if (matchesSignature(header, sig)) return fileType
    }
  }

  // 2. Detecção de PDF conforme ISO 32000-1 (Section 7.5.2)
  // A especificação PDF exige que leitores aceitem %PDF em qualquer ponto dos primeiros 1024 bytes
  // Suporta BOM UTF-8 (EF BB BF), UTF-16, quebras de linha (\r\n), comandos PJL (@PJL) e wrappers
  const pdfLimit = Math.min(header.length - 4, 1024)
  for (let i = 0; i <= pdfLimit; i++) {
    if (
      header[i] === 0x25 && // %
      header[i + 1] === 0x50 && // P
      header[i + 2] === 0x44 && // D
      header[i + 3] === 0x46 // F
    ) {
      return 'pdf'
    }
  }

  // 3. Detecção de EPUB / ZIP com deslocamento ou BOM
  const epubLimit = Math.min(header.length - 4, 1024)
  for (let i = 0; i <= epubLimit; i++) {
    if (
      header[i] === 0x50 && // P
      header[i + 1] === 0x4b && // K
      (
        (header[i + 2] === 0x03 && header[i + 3] === 0x04) ||
        (header[i + 2] === 0x05 && header[i + 3] === 0x06) ||
        (header[i + 2] === 0x07 && header[i + 3] === 0x08)
      )
    ) {
      return 'epub'
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

  const header = await readFileHeader(file, 2048)
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

  if (
    mimeFromBrowser &&
    mimeFromBrowser !== 'application/octet-stream' &&
    mimeFromBrowser !== 'binary/octet-stream' &&
    !Object.keys(MIME_TYPE_MAP).includes(mimeFromBrowser)
  ) {
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
  const header = new Uint8Array(buffer.slice(0, Math.min(buffer.byteLength, 2048)))
  const detected = detectFileTypeFromBytes(header)
  if (detected) return detected

  // Detectar livreto didático / JSON (ou ardoc)
  try {
    const textSample = new TextDecoder('utf-8').decode(buffer.slice(0, 1024)).trimStart()
    if (textSample.startsWith('{') || textSample.startsWith('[')) {
      if (
        textSample.includes('"chapters"') ||
        textSample.includes('"booklet"') ||
        textSample.includes('"didactic"') ||
        textSample.includes('"topic"') ||
        textSample.includes('"title"') ||
        textSample.includes('"raw_markdown"')
      ) {
        return 'didactic'
      }
      try {
        JSON.parse(textSample.slice(0, textSample.lastIndexOf('}') + 1) || textSample)
        return 'didactic'
      } catch {
        return 'didactic'
      }
    }
  } catch {
    // Falha na decodificação de texto
  }

  return fallback
}

export { readFileHeader, matchesSignature, detectFileTypeFromBytes, MAX_FILE_SIZE_BYTES }

