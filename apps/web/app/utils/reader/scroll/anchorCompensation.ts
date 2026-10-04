export interface ItemHeightChange {
  index: number
  oldHeight: number
  newHeight: number
}

/**
 * Calcula o ajuste de scrollTop para manter estável o elemento âncora visível
 * quando itens posicionados acima dele (index < anchorIndex) sofrem alteração de altura.
 *
 * Retorna o delta que deve ser adicionado ao scrollTop.
 */
export function computeAnchorScrollDelta(
  anchorIndex: number,
  changes: readonly ItemHeightChange[]
): number {
  let delta = 0
  for (const change of changes) {
    if (change.index < anchorIndex) {
      delta += (change.newHeight - change.oldHeight)
    }
  }
  return delta
}

/**
 * Retorna o novo valor ajustado de scrollTop, garantindo que não seja negativo.
 */
export function applyScrollDelta(
  currentScrollTop: number,
  delta: number
): number {
  return Math.max(0, currentScrollTop + delta)
}
