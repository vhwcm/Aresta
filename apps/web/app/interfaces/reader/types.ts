/**
 * Tipos compartilhados do motor de leitura.
 * Centraliza definições usadas por useBookPageTurn, usePagePhysics e PageCurlCanvas.
 */
export type PageTurnDirection = 'next' | 'previous'

export type GripRegion = 'top-corner' | 'edge-center' | 'bottom-corner'

export interface DragPoint {
  x: number
  y: number
  time: number
}
