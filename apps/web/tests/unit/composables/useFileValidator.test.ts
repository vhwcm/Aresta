import { describe, it, expect, vi } from 'vitest'
import {
  validateBookFile,
  readFileHeader,
  matchesSignature,
  detectFileTypeFromBytes,
  detectFileTypeFromArrayBuffer,
  MAX_FILE_SIZE_BYTES,
} from '~/utils/fileValidator'

function createFakeFile(
  content: Uint8Array,
  name: string,
  type: string,
): File {
  const blob = new Blob([content as BlobPart], { type })
  return new File([blob], name, { type })
}

const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34])
const EPUB_MAGIC = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x08])
const RANDOM_BYTES = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x00, 0x01, 0x02, 0x03])

describe('matchesSignature', () => {
  it('retorna true quando o header começa com a assinatura exata', () => {
    const header = PDF_MAGIC
    const sig = new Uint8Array([0x25, 0x50, 0x44, 0x46])
    expect(matchesSignature(header, sig)).toBe(true)
  })

  it('retorna false quando o header não começa com a assinatura', () => {
    const header = RANDOM_BYTES
    const sig = new Uint8Array([0x25, 0x50, 0x44, 0x46])
    expect(matchesSignature(header, sig)).toBe(false)
  })

  it('retorna false quando o header é menor que a assinatura', () => {
    const header = new Uint8Array([0x25, 0x50])
    const sig = new Uint8Array([0x25, 0x50, 0x44, 0x46])
    expect(matchesSignature(header, sig)).toBe(false)
  })

  it('retorna true para assinatura de 1 byte que bate', () => {
    const header = new Uint8Array([0x25, 0x00, 0x00, 0x00])
    const sig = new Uint8Array([0x25])
    expect(matchesSignature(header, sig)).toBe(true)
  })
})

describe('detectFileTypeFromBytes', () => {
  it('detecta PDF pelo magic bytes %PDF', () => {
    expect(detectFileTypeFromBytes(PDF_MAGIC)).toBe('pdf')
  })

  it('detecta EPUB pelo magic bytes PK\\x03\\x04', () => {
    expect(detectFileTypeFromBytes(EPUB_MAGIC)).toBe('epub')
  })

  it('detecta EPUB pelo magic bytes PK\\x05\\x06', () => {
    const emptyZip = new Uint8Array([0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00])
    expect(detectFileTypeFromBytes(emptyZip)).toBe('epub')
  })

  it('retorna null para bytes desconhecidos', () => {
    expect(detectFileTypeFromBytes(RANDOM_BYTES)).toBeNull()
  })

  it('retorna null para header vazio', () => {
    expect(detectFileTypeFromBytes(new Uint8Array([]))).toBeNull()
  })

  it('detecta PDF com BOM UTF-8 (EF BB BF) no início', () => {
    const bomPdf = new Uint8Array([0xef, 0xbb, 0xbf, 0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37])
    expect(detectFileTypeFromBytes(bomPdf)).toBe('pdf')
  })

  it('detecta PDF com quebras de linha ou espaços antes de %PDF', () => {
    const spacesPdf = new Uint8Array([0x0d, 0x0a, 0x20, 0x20, 0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35])
    expect(detectFileTypeFromBytes(spacesPdf)).toBe('pdf')
  })

  it('detecta PDF com comando de impressão @PJL antes do header', () => {
    const pjlHeader = Array.from('@PJL ENTER LANGUAGE = PDF\r\n%PDF-1.4').map((c) => c.charCodeAt(0))
    expect(detectFileTypeFromBytes(new Uint8Array(pjlHeader))).toBe('pdf')
  })

  it('detecta EPUB com offset inicial', () => {
    const offsetEpub = new Uint8Array([0x00, 0x00, 0x50, 0x4b, 0x03, 0x04, 0x14, 0x00])
    expect(detectFileTypeFromBytes(offsetEpub)).toBe('epub')
  })
})

describe('validateBookFile', () => {
  it('valida PDF real pelos bytes', async () => {
    const file = createFakeFile(PDF_MAGIC, 'livro.pdf', 'application/pdf')
    const result = await validateBookFile(file)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.fileType).toBe('pdf')
      expect(result.mimeType).toBe('application/pdf')
    }
  })

  it('valida PDF com BOM UTF-8', async () => {
    const bomPdf = new Uint8Array([0xef, 0xbb, 0xbf, 0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37])
    const file = createFakeFile(bomPdf, 'livro-bom.pdf', 'application/pdf')
    const result = await validateBookFile(file)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.fileType).toBe('pdf')
    }
  })

  it('valida PDF com MIME application/x-pdf', async () => {
    const file = createFakeFile(PDF_MAGIC, 'livro.pdf', 'application/x-pdf')
    const result = await validateBookFile(file)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.fileType).toBe('pdf')
    }
  })

  it('valida PDF com MIME application/octet-stream do navegador', async () => {
    const file = createFakeFile(PDF_MAGIC, 'livro.pdf', 'application/octet-stream')
    const result = await validateBookFile(file)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.fileType).toBe('pdf')
    }
  })

  it('valida EPUB real pelos bytes', async () => {
    const file = createFakeFile(EPUB_MAGIC, 'livro.epub', 'application/epub+zip')
    const result = await validateBookFile(file)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.fileType).toBe('epub')
    }
  })

  it('rejeita arquivo vazio', async () => {
    const file = createFakeFile(new Uint8Array([]), 'vazio.pdf', 'application/pdf')
    const result = await validateBookFile(file)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toBe('empty_file')
    }
  })

  it('rejeita arquivo maior que o limite', async () => {
    const file = {
      name: 'grande.pdf',
      size: MAX_FILE_SIZE_BYTES + 1,
      type: 'application/pdf',
      slice: () => new Blob([])
    } as unknown as File
    const result = await validateBookFile(file)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toBe('file_too_large')
    }
  })

  it('rejeita arquivo .pdf com conteúdo de texto (assinatura inválida)', async () => {
    const txtContent = new Uint8Array(
      Array.from('This is a plain text file disguised as PDF').map((c) => c.charCodeAt(0)),
    )
    const file = createFakeFile(txtContent, 'fake.pdf', 'application/pdf')
    const result = await validateBookFile(file)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toBe('invalid_signature')
    }
  })

  it('rejeita arquivo de imagem JPEG renomeado para .epub', async () => {
    const jpegMagic = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46])
    const file = createFakeFile(jpegMagic, 'imagem.epub', 'application/epub+zip')
    const result = await validateBookFile(file)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toBe('invalid_signature')
    }
  })

  it('rejeita MIME type não suportado mesmo com bytes corretos', async () => {
    const file = createFakeFile(PDF_MAGIC, 'arquivo.pdf', 'text/plain')
    const result = await validateBookFile(file)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.reason).toBe('unsupported_mime')
    }
  })

  it('preserva o nome do arquivo no resultado de sucesso', async () => {
    const file = createFakeFile(PDF_MAGIC, 'meu-livro.pdf', 'application/pdf')
    const result = await validateBookFile(file)
    expect(result.fileName).toBe('meu-livro.pdf')
  })

  it('preserva o nome do arquivo no resultado de falha', async () => {
    const file = createFakeFile(RANDOM_BYTES, 'suspeito.pdf', 'application/pdf')
    const result = await validateBookFile(file)
    expect(result.fileName).toBe('suspeito.pdf')
  })

  it('reporta o tamanho correto do arquivo no sucesso', async () => {
    const file = createFakeFile(PDF_MAGIC, 'livro.pdf', 'application/pdf')
    const result = await validateBookFile(file)
    if (result.valid) {
      expect(result.fileSizeBytes).toBe(PDF_MAGIC.byteLength)
    }
  })
})

describe('readFileHeader', () => {
  it('lê exatamente N bytes do início do arquivo', async () => {
    const content = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08])
    const file = createFakeFile(content, 'test.bin', 'application/octet-stream')
    const header = await readFileHeader(file, 4)
    expect(header).toEqual(new Uint8Array([0x01, 0x02, 0x03, 0x04]))
  })
})


describe('detectFileTypeFromArrayBuffer', () => {
  it('detecta PDF através do ArrayBuffer', () => {
    const buffer = PDF_MAGIC.buffer
    expect(detectFileTypeFromArrayBuffer(buffer)).toBe('pdf')
  })

  it('detecta EPUB através do ArrayBuffer', () => {
    const buffer = EPUB_MAGIC.buffer
    expect(detectFileTypeFromArrayBuffer(buffer)).toBe('epub')
  })

  it('retorna fallback quando os bytes não correspondem a PDF ou EPUB', () => {
    const buffer = RANDOM_BYTES.buffer
    expect(detectFileTypeFromArrayBuffer(buffer, 'pdf')).toBe('pdf')
    expect(detectFileTypeFromArrayBuffer(buffer, 'epub')).toBe('epub')
  })

  it('detecta livreto didático através do ArrayBuffer em formato JSON', () => {
    const jsonStr = JSON.stringify({
      title: 'Livreto de Algoritmos',
      chapters: [{ order_index: 1, title: 'Capítulo 1', raw_markdown: '# Intro' }],
    })
    const buffer = new TextEncoder().encode(jsonStr).buffer
    expect(detectFileTypeFromArrayBuffer(buffer)).toBe('didactic')
  })

  it('retorna fallback para buffers menores que 4 bytes', () => {
    const smallBuffer = new Uint8Array([0x25, 0x50]).buffer
    expect(detectFileTypeFromArrayBuffer(smallBuffer, 'epub')).toBe('epub')
  })
})

