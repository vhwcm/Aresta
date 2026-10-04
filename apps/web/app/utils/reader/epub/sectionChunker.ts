import { countSectionText } from './sectionTextCounter'

export interface SectionChunk {
  chunkIndex: number
  startCharOffset: number
  endCharOffset: number
  charCount: number
  nodes: Node[]
}

export const DEFAULT_CHUNK_SIZE = 10 * 1024 // 10.240 caracteres (~10 localizações)

/**
 * Divide os elementos de 1º nível de um documento de seção em blocos de ~10 localizações.
 * Respeita a fronteira entre elementos de bloco de 1º nível (nunca corta tags no meio).
 * Elementos individuais maiores que targetChunkSize tornam-se blocos próprios.
 */
export function chunkSectionDocument(
  docOrElement: Document | Element,
  targetChunkSize: number = DEFAULT_CHUNK_SIZE
): SectionChunk[] {
  if (!docOrElement) return []

  const container: Element | null =
    'body' in docOrElement && (docOrElement as Document).body
      ? (docOrElement as Document).body
      : (docOrElement as Element)

  if (!container || !container.childNodes || container.childNodes.length === 0) {
    return []
  }

  const chunks: SectionChunk[] = []
  let currentNodes: Node[] = []
  let currentChunkChars = 0
  let currentChunkStart = 0
  let globalOffset = 0

  const childNodes = Array.from(container.childNodes)

  for (const child of childNodes) {
    const chars = countSectionText(child)

    // Se temos nós acumulados e este elemento sozinho é grande OU vai estourar o limite: fecha o chunk anterior
    if (currentNodes.length > 0 && (chars >= targetChunkSize || currentChunkChars + chars >= targetChunkSize)) {
      chunks.push({
        chunkIndex: chunks.length,
        startCharOffset: currentChunkStart,
        endCharOffset: globalOffset,
        charCount: currentChunkChars,
        nodes: currentNodes
      })
      currentNodes = []
      currentChunkStart = globalOffset
      currentChunkChars = 0
    }

    currentNodes.push(child)
    currentChunkChars += chars
    globalOffset += chars

    // Se este elemento sozinho é maior que o limite, fecha como bloco próprio imediatamente
    if (chars >= targetChunkSize) {
      chunks.push({
        chunkIndex: chunks.length,
        startCharOffset: currentChunkStart,
        endCharOffset: globalOffset,
        charCount: currentChunkChars,
        nodes: currentNodes
      })
      currentNodes = []
      currentChunkStart = globalOffset
      currentChunkChars = 0
    }
  }

  // Restante
  if (currentNodes.length > 0) {
    chunks.push({
      chunkIndex: chunks.length,
      startCharOffset: currentChunkStart,
      endCharOffset: globalOffset,
      charCount: currentChunkChars,
      nodes: currentNodes
    })
  }

  if (chunks.length === 0) {
    chunks.push({
      chunkIndex: 0,
      startCharOffset: 0,
      endCharOffset: 0,
      charCount: 0,
      nodes: []
    })
  }

  return chunks
}

/**
 * Localiza o chunk correspondente a um determinado charOffset.
 */
export function findChunkForOffset(chunks: SectionChunk[], charOffset: number): SectionChunk | null {
  if (!chunks || chunks.length === 0) return null
  for (const chunk of chunks) {
    if (charOffset >= chunk.startCharOffset && charOffset < chunk.endCharOffset) {
      return chunk
    }
  }
  return chunks[chunks.length - 1] || null
}
