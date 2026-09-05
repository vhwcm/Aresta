import { describe, it, expect } from 'vitest'
import {
  computeCurlGeometry,
  interpolateCurlState,
  DEFAULT_CONFIG,
  easeInOutCubic,
  lerp,
  clamp,
  distance,
} from '~/utils/pageCurlMath'
import type { IPageCurlState } from '~/interfaces/reader/IPageCurlState'

describe('clamp', () => {
  it('retorna o valor quando está dentro dos limites', () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5)
  })

  it('limita ao mínimo quando abaixo', () => {
    expect(clamp(-1, 0, 1)).toBe(0)
  })

  it('limita ao máximo quando acima', () => {
    expect(clamp(2, 0, 1)).toBe(1)
  })

  it('retorna o mínimo quando valor é exatamente o mínimo', () => {
    expect(clamp(0, 0, 1)).toBe(0)
  })

  it('retorna o máximo quando valor é exatamente o máximo', () => {
    expect(clamp(1, 0, 1)).toBe(1)
  })

  it('funciona com limites não-unitários', () => {
    expect(clamp(50, 10, 100)).toBe(50)
    expect(clamp(5, 10, 100)).toBe(10)
    expect(clamp(200, 10, 100)).toBe(100)
  })
})

describe('lerp', () => {
  it('retorna o valor inicial em t=0', () => {
    expect(lerp(0, 10, 0)).toBe(0)
  })

  it('retorna o valor final em t=1', () => {
    expect(lerp(0, 10, 1)).toBe(10)
  })

  it('interpola corretamente no meio (t=0.5)', () => {
    expect(lerp(0, 10, 0.5)).toBe(5)
  })

  it('funciona com valores negativos', () => {
    expect(lerp(-10, 10, 0.5)).toBe(0)
  })

  it('funciona com a→b na ordem inversa', () => {
    expect(lerp(10, 0, 0.5)).toBe(5)
  })
})

describe('distance', () => {
  it('calcula distância horizontal', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(3)
  })

  it('calcula distância vertical', () => {
    expect(distance({ x: 0, y: 0 }, { x: 0, y: 4 })).toBe(4)
  })

  it('calcula distância diagonal (triângulo 3-4-5)', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })

  it('retorna zero para o mesmo ponto', () => {
    expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0)
  })

  it('é simétrica (d(a,b) === d(b,a))', () => {
    const a = { x: 1, y: 2 }
    const b = { x: 4, y: 6 }
    expect(distance(a, b)).toBe(distance(b, a))
  })
})

describe('easeInOutCubic', () => {
  it('retorna 0 em t=0', () => {
    expect(easeInOutCubic(0)).toBe(0)
  })

  it('retorna 1 em t=1', () => {
    expect(easeInOutCubic(1)).toBe(1)
  })

  it('retorna exatamente 0.5 em t=0.5 (ponto de simetria)', () => {
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 10)
  })

  it('é monótona crescente', () => {
    expect(easeInOutCubic(0.25)).toBeLessThan(easeInOutCubic(0.5))
    expect(easeInOutCubic(0.5)).toBeLessThan(easeInOutCubic(0.75))
  })

  it('tem aceleração suave (saída menor que linear no início)', () => {
    expect(easeInOutCubic(0.1)).toBeLessThan(0.1)
  })

  it('tem desaceleração suave (saída maior que linear no fim)', () => {
    expect(easeInOutCubic(0.9)).toBeGreaterThan(0.9)
  })
})

describe('computeCurlGeometry', () => {
  const origin = { x: 400, y: 300 }
  const pageWidth = 400
  const pageHeight = 600

  it('posiciona o foldPoint na borda direita para direção right', () => {
    const current = { x: 350, y: 300 }
    const result = computeCurlGeometry(origin, current, pageWidth, pageHeight, 'right')
    expect(result.foldPoint.x).toBe(pageWidth)
  })

  it('posiciona o foldPoint na borda esquerda para direção left', () => {
    const current = { x: 450, y: 300 }
    const result = computeCurlGeometry(origin, current, pageWidth, pageHeight, 'left')
    expect(result.foldPoint.x).toBe(0)
  })

  it('retorna raio máximo quando não há drag (drag zero)', () => {
    const result = computeCurlGeometry(origin, origin, pageWidth, pageHeight, 'right')
    expect(result.radius).toBe(DEFAULT_CONFIG.maxRadius)
  })

  it('raio diminui com drag maior (dentro do range proporcional)', () => {
    const smallDrag = computeCurlGeometry(origin, { x: 395, y: 300 }, pageWidth, pageHeight, 'right')
    const bigDrag = computeCurlGeometry(origin, { x: 340, y: 300 }, pageWidth, pageHeight, 'right')
    expect(bigDrag.radius).toBeLessThan(smallDrag.radius)
  })

  it('raio nunca vai abaixo do mínimo configurado', () => {
    const extremeDrag = computeCurlGeometry(origin, { x: -5000, y: 300 }, pageWidth, pageHeight, 'right')
    expect(extremeDrag.radius).toBeGreaterThanOrEqual(DEFAULT_CONFIG.minRadius)
  })

  it('raio nunca ultrapassa o máximo configurado', () => {
    const tinydrag = computeCurlGeometry(origin, { x: 399, y: 300 }, pageWidth, pageHeight, 'right')
    expect(tinydrag.radius).toBeLessThanOrEqual(DEFAULT_CONFIG.maxRadius)
  })

  it('retorna todos os campos obrigatórios da geometria', () => {
    const result = computeCurlGeometry(origin, { x: 300, y: 300 }, pageWidth, pageHeight, 'right')
    expect(result).toHaveProperty('foldPoint')
    expect(result).toHaveProperty('controlPoint1')
    expect(result).toHaveProperty('controlPoint2')
    expect(result).toHaveProperty('radius')
    expect(result).toHaveProperty('angle')
    expect(result).toHaveProperty('shadowGradientStart')
    expect(result).toHaveProperty('shadowGradientEnd')
  })

  it('foldPoint.y fica dentro dos limites da página', () => {
    const current = { x: 350, y: -100 }
    const result = computeCurlGeometry(origin, current, pageWidth, pageHeight, 'right')
    expect(result.foldPoint.y).toBeGreaterThanOrEqual(0)
    expect(result.foldPoint.y).toBeLessThanOrEqual(pageHeight)
  })

  it('config customizado é respeitado (minRadius)', () => {
    const config = { ...DEFAULT_CONFIG, minRadius: 50 }
    const extremeDrag = computeCurlGeometry(origin, { x: -5000, y: 300 }, pageWidth, pageHeight, 'right', config)
    expect(extremeDrag.radius).toBeGreaterThanOrEqual(50)
  })
})

describe('interpolateCurlState', () => {
  const baseState: IPageCurlState = {
    isAnimating: true,
    isDragging: false,
    curlDirection: 'right',
    dragOrigin: null,
    dragCurrent: null,
    progress: 0,
    geometry: null,
    targetPage: 2,
    currentPage: 1,
  }

  it('não move o progresso em t=0', () => {
    const result = interpolateCurlState(baseState, 1, 0)
    expect(result.progress).toBeCloseTo(0)
  })

  it('atinge o alvo em t=1', () => {
    const result = interpolateCurlState(baseState, 1, 1)
    expect(result.progress).toBeCloseTo(1)
  })

  it('interpola parcialmente em t=0.5', () => {
    const result = interpolateCurlState(baseState, 1, 0.5)
    expect(result.progress).toBeGreaterThan(0)
    expect(result.progress).toBeLessThan(1)
  })

  it('mantém isAnimating true quando progresso não convergiu', () => {
    const result = interpolateCurlState(baseState, 1, 0.5)
    expect(result.isAnimating).toBe(true)
  })

  it('define isAnimating false quando convergiu ao alvo', () => {
    const nearlyDone = { ...baseState, progress: 0.9999 }
    const result = interpolateCurlState(nearlyDone, 1, 1)
    expect(result.isAnimating).toBe(false)
  })

  it('funciona na direção reversa (target < progress)', () => {
    const halfway = { ...baseState, progress: 0.6 }
    const result = interpolateCurlState(halfway, 0, 1)
    expect(result.progress).toBeCloseTo(0)
  })

  it('preserva campos imutáveis do estado', () => {
    const result = interpolateCurlState(baseState, 1, 0.5)
    expect(result.currentPage).toBe(baseState.currentPage)
    expect(result.targetPage).toBe(baseState.targetPage)
    expect(result.curlDirection).toBe(baseState.curlDirection)
  })

  it('t é clampado entre 0 e 1', () => {
    const resultNeg = interpolateCurlState(baseState, 1, -0.5)
    const resultOver = interpolateCurlState(baseState, 1, 1.5)
    expect(resultNeg.progress).toBeCloseTo(0)
    expect(resultOver.progress).toBeCloseTo(1)
  })
})
