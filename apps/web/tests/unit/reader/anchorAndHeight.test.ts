import { describe, it, expect } from 'vitest'
import {
  computeAnchorScrollDelta,
  applyScrollDelta
} from '~/utils/reader/scroll/anchorCompensation'
import {
  estimateBlockHeight,
  calibratePxPerChar,
  DEFAULT_PX_PER_CHAR,
  MIN_BLOCK_HEIGHT_PX
} from '~/utils/reader/scroll/heightEstimator'

describe('anchorCompensation', () => {
  it('soma apenas deltas de blocos anteriores ao anchorIndex', () => {
    const changes = [
      { index: 0, oldHeight: 200, newHeight: 250 }, // +50
      { index: 1, oldHeight: 300, newHeight: 280 }, // -20
      { index: 2, oldHeight: 400, newHeight: 600 }, // anchor! Ignorado
      { index: 3, oldHeight: 100, newHeight: 500 }  // posterior! Ignorado
    ]

    const delta = computeAnchorScrollDelta(2, changes)
    expect(delta).toBe(30) // +50 - 20
  })

  it('retorna 0 se todas as mudanças forem no anchor ou abaixo dele', () => {
    const changes = [
      { index: 5, oldHeight: 100, newHeight: 300 },
      { index: 6, oldHeight: 200, newHeight: 400 }
    ]

    const delta = computeAnchorScrollDelta(5, changes)
    expect(delta).toBe(0)
  })

  it('ajusta scrollTop evitando valores negativos', () => {
    expect(applyScrollDelta(100, 50)).toBe(150)
    expect(applyScrollDelta(100, -80)).toBe(20)
    expect(applyScrollDelta(50, -100)).toBe(0)
  })
})

describe('heightEstimator', () => {
  it('retorna MIN_BLOCK_HEIGHT_PX para blocos vazios ou negativos', () => {
    expect(estimateBlockHeight(0)).toBe(MIN_BLOCK_HEIGHT_PX)
    expect(estimateBlockHeight(-10)).toBe(MIN_BLOCK_HEIGHT_PX)
  })

  it('calcula altura proporcional aos caracteres', () => {
    // 1000 chars * 0.35 = 350px
    expect(estimateBlockHeight(1000, 0.35)).toBe(350)
  })

  it('calibra razão px/char com base em medições reais', () => {
    const pxPerChar = calibratePxPerChar(500, 1000)
    expect(pxPerChar).toBe(0.5)

    // Fallback para entradas inválidas
    expect(calibratePxPerChar(0, 1000)).toBe(DEFAULT_PX_PER_CHAR)
    expect(calibratePxPerChar(500, 0)).toBe(DEFAULT_PX_PER_CHAR)
  })
})
