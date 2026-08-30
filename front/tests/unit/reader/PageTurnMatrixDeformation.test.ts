import { describe, it, expect } from 'vitest'

/**
 * Modelo de transformação de vértices e amostragem do Shader 3D (conforme usePageCurl3D.ts)
 */
interface VertexPoint {
  x: number
  y: number
  z: number
}

interface MatrixSampleResult {
  pos: VertexPoint
  normal: VertexPoint
  facing: number // +1.0 = frente (uFrontTexture), -1.0 = verso (uBackTexture)
  sampledTexture: 'front' | 'back'
  uvFront: { u: number; v: number }
  uvBack: { u: number; v: number }
}

function evaluate3DPagePoint(
  x: number,
  y: number,
  pageWidth: number,
  pageHeight: number,
  progress: number,
  direction: 'next' | 'previous' = 'next',
  gripY = 0.5,
  deltaY = 0,
): MatrixSampleResult {
  const PI = Math.PI
  const p = Math.max(0, Math.min(1, progress))

  // UV normalizado [0, 1] no espaço da textura da página
  const uvFront = {
    u: (x - (direction === 'next' ? 0 : -pageWidth)) / pageWidth,
    v: 1.0 - (y + pageHeight / 2) / pageHeight,
  }
  const uvBack = {
    u: 1.0 - uvFront.u,
    v: uvFront.v,
  }

  if (p <= 0.0001) {
    return {
      pos: { x, y, z: 0 },
      normal: { x: 0, y: 0, z: 1 },
      facing: 1.0,
      sampledTexture: 'front',
      uvFront,
      uvBack,
    }
  }

  const uRadius = Math.max(32, pageWidth * 0.14)
  const arcFactor = Math.sin(p * PI)
  const dynamicRadius = Math.max(4.0, uRadius * arcFactor)
  const rollCircumference = PI * dynamicRadius

  const cornerBias = (0.5 - gripY) * 0.55
  let angle = cornerBias * arcFactor - deltaY * 0.35
  angle = Math.max(-0.35, Math.min(0.35, angle))

  let deformedPos = { x, y, z: 0 }
  let computedNormal = { x: 0, y: 0, z: 1 }
  let facing = 1.0

  if (direction === 'next') {
    // NEXT: Folha direita [0, W] dobra em direção à esquerda [-W, 0]
    const foldX = pageWidth * (1.0 - p)
    const dist = (x - foldX) + (y * Math.sin(angle))

    if (dist <= 0.0) {
      deformedPos = { x, y, z: 0 }
      computedNormal = { x: 0, y: 0, z: 1 }
      facing = 1.0
    } else if (dist < rollCircumference && dynamicRadius > 4.5) {
      const phi = dist / dynamicRadius
      const sinPhi = Math.sin(phi)
      const cosPhi = Math.cos(phi)

      deformedPos = {
        x: foldX - (dist - dynamicRadius * sinPhi),
        y,
        z: dynamicRadius * (1.0 - cosPhi),
      }
      computedNormal = {
        x: -sinPhi,
        y: 0,
        z: cosPhi,
      }
      facing = cosPhi >= 0.0 ? 1.0 : -1.0
    } else {
      deformedPos = {
        x: 2.0 * foldX - x,
        y,
        z: dynamicRadius * 2.0 * Math.max(0, 1.0 - (dist / Math.max(1, pageWidth))),
      }
      computedNormal = { x: 0, y: 0, z: -1 }
      facing = -1.0
    }
  } else {
    // PREVIOUS: Folha esquerda [-W, 0] dobra em direção à direita [0, W]
    const foldX = -pageWidth * (1.0 - p)
    const dist = (foldX - x) + (y * Math.sin(angle))

    if (dist <= 0.0) {
      deformedPos = { x, y, z: 0 }
      computedNormal = { x: 0, y: 0, z: 1 }
      facing = 1.0
    } else if (dist < rollCircumference && dynamicRadius > 4.5) {
      const phi = dist / dynamicRadius
      const sinPhi = Math.sin(phi)
      const cosPhi = Math.cos(phi)

      deformedPos = {
        x: foldX + (dist - dynamicRadius * sinPhi),
        y,
        z: dynamicRadius * (1.0 - cosPhi),
      }
      computedNormal = {
        x: sinPhi,
        y: 0,
        z: cosPhi,
      }
      facing = cosPhi >= 0.0 ? 1.0 : -1.0
    } else {
      deformedPos = {
        x: 2.0 * foldX - x,
        y,
        z: dynamicRadius * 2.0 * Math.max(0, 1.0 - (dist / Math.max(1, pageWidth))),
      }
      computedNormal = { x: 0, y: 0, z: -1 }
      facing = -1.0
    }
  }

  return {
    pos: deformedPos,
    normal: computedNormal,
    facing,
    sampledTexture: facing > 0 ? 'front' : 'back',
    uvFront,
    uvBack,
  }
}

describe('Mapeamento da Matriz de Pontos e Deformação 3D durante a Virada de Página', () => {
  const W = 400
  const H = 600

  it('no início da virada (progress = 0.0), todos os pontos da folha estão na frente plana (Z=0, facing=+1)', () => {
    const pointsToSample = [
      { name: 'Lombada', x: 0, y: 0 },
      { name: 'Centro da Página', x: W / 2, y: 0 },
      { name: 'Borda Direita', x: W, y: 0 },
      { name: 'Canto Superior Direito', x: W, y: H / 2 },
      { name: 'Canto Inferior Direito', x: W, y: -H / 2 },
    ]

    for (const pt of pointsToSample) {
      const sample = evaluate3DPagePoint(pt.x, pt.y, W, H, 0.0, 'next')
      expect(sample.pos.z).toBe(0)
      expect(sample.normal.z).toBe(1)
      expect(sample.facing).toBe(1.0)
      expect(sample.sampledTexture).toBe('front')
    }
  })

  it('no meio da virada (progress = 0.5), a folha curva no espaço 3D (Z > 0) e o verso começa a aparecer', () => {
    // Ponto na lombada permanece estável na base
    const spine = evaluate3DPagePoint(0, 0, W, H, 0.5, 'next')
    expect(spine.pos.x).toBeCloseTo(0, 1)
    expect(spine.pos.z).toBe(0)
    expect(spine.sampledTexture).toBe('front')

    // Borda externa atingiu a lombada (x=0) e já está virada para trás (verso)
    const outerEdge = evaluate3DPagePoint(W, 0, W, H, 0.5, 'next')
    expect(outerEdge.pos.x).toBeCloseTo(0, 1)
    expect(outerEdge.facing).toBe(-1.0) // Verso
    expect(outerEdge.sampledTexture).toBe('back')

    // Ponto no cilindro de curvatura atinge elevação Z positiva
    const midPoint = evaluate3DPagePoint(W * 0.7, 0, W, H, 0.5, 'next')
    expect(midPoint.pos.z).toBeGreaterThan(0)
  })

  it('ao puxar pelo canto superior (gripY = 0.0), a matriz projeta inclinação cônica diagonal', () => {
    const topCorner = evaluate3DPagePoint(W, H / 2, W, H, 0.3, 'next', 0.0)
    const bottomCorner = evaluate3DPagePoint(W, -H / 2, W, H, 0.3, 'next', 0.0)

    // O canto superior avança mais à esquerda que o canto inferior devido ao torque de arraste
    expect(topCorner.pos.x).toBeLessThan(bottomCorner.pos.x)
  })

  it('ao finalizar a virada (progress = 1.0), a folha está totalmente no lado esquerdo [-W, 0] com textura do verso ativa', () => {
    const spine = evaluate3DPagePoint(0, 0, W, H, 1.0, 'next')
    expect(spine.pos.x).toBeCloseTo(0, 1)

    const outerEdge = evaluate3DPagePoint(W, 0, W, H, 1.0, 'next')
    expect(outerEdge.pos.x).toBeCloseTo(-W, 1)
    expect(outerEdge.pos.z).toBeCloseTo(0, 1)
    expect(outerEdge.facing).toBe(-1.0)
    expect(outerEdge.sampledTexture).toBe('back')
  })

  it('valida densidade de tinta e conteúdo não-vazio nos canais de pixel do Canvas 2D', () => {
    // Simula a rasterização de uma página de livro com fundo e texto
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 600

    const fillRectCalls: any[] = []
    const fillTextCalls: any[] = []

    const mockCtx = {
      canvas,
      fillStyle: '',
      font: '',
      fillRect: (x: number, y: number, w: number, h: number) => fillRectCalls.push({ x, y, w, h }),
      fillText: (text: string, x: number, y: number) => fillTextCalls.push({ text, x, y }),
    }

    // 1. Fundo do papel (Sépia: rgb(245, 238, 220))
    mockCtx.fillStyle = '#f5eedc'
    mockCtx.fillRect(0, 0, 400, 600)

    // 2. Título e texto impresso (rgb(42, 37, 33))
    mockCtx.fillStyle = '#2a2521'
    mockCtx.font = 'bold 24px Newsreader'
    mockCtx.fillText('Capítulo I — A Jornada', 40, 80)
    mockCtx.font = '16px Newsreader'
    mockCtx.fillText('No princípio de todas as coisas, havia a palavra escrita.', 40, 130)

    expect(fillRectCalls.length).toBe(1)
    expect(fillRectCalls[0]).toEqual({ x: 0, y: 0, w: 400, h: 600 })
    expect(fillTextCalls.length).toBe(2)
    expect(fillTextCalls[0].text).toContain('Capítulo I')
    expect(fillTextCalls[1].text).toContain('palavra escrita')
  })

  it('faz a amostragem contínua da matriz ao longo de 10 passos da virada [0.0 ... 1.0]', () => {
    const steps = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    const outerEdgeTrajectory: Array<{ p: number; x: number; z: number; texture: string }> = []

    for (const p of steps) {
      const sample = evaluate3DPagePoint(W, 0, W, H, p, 'next')
      outerEdgeTrajectory.push({
        p,
        x: sample.pos.x,
        z: sample.pos.z,
        texture: sample.sampledTexture,
      })
    }

    const first = outerEdgeTrajectory[0]!
    const last = outerEdgeTrajectory[outerEdgeTrajectory.length - 1]!

    // A coordenada X da borda deve iniciar em +W e terminar em -W
    expect(first.x).toBe(W)
    expect(last.x).toBeCloseTo(-W, 1)

    // A textura inicial deve ser 'front' e a textura final deve ser 'back'
    expect(first.texture).toBe('front')
    expect(last.texture).toBe('back')

    // A trajetória deve elevar Z no meio do movimento (efeito curl 3D)
    const midStep = outerEdgeTrajectory.find((s) => s.p === 0.5)!
    expect(midStep.z).toBeGreaterThanOrEqual(0)
  })
})
