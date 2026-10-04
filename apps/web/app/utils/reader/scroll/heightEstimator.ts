export const DEFAULT_PX_PER_CHAR = 0.35
export const MIN_BLOCK_HEIGHT_PX = 40

/**
 * Estima a altura em pixels de um bloco de conteúdo baseado na quantidade de caracteres.
 */
export function estimateBlockHeight(
  charCount: number,
  pxPerChar: number = DEFAULT_PX_PER_CHAR
): number {
  if (charCount <= 0) return MIN_BLOCK_HEIGHT_PX
  return Math.max(MIN_BLOCK_HEIGHT_PX, Math.round(charCount * pxPerChar))
}

/**
 * Calibra a razão px-por-caractere a partir de uma medição real do DOM.
 */
export function calibratePxPerChar(
  measuredHeightPx: number,
  charCount: number
): number {
  if (charCount <= 0 || measuredHeightPx <= 0) {
    return DEFAULT_PX_PER_CHAR
  }
  return measuredHeightPx / charCount
}
