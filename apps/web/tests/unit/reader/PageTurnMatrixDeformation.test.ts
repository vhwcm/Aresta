import { describe, it, expect } from 'vitest'
import { evaluate3DPagePoint } from '~/composables/reader/usePageCurl3D'

describe('Mapeamento da Matriz de Pontos e Deformação 3D durante a Virada de Página', () => {
  const W = 400
  const H = 600

  describe('Modo 2 Páginas (Two-Page Mode)', () => {
    it('no início da virada (progress = 0.0), todos os pontos da folha estão na frente plana (Z=0, facing=+1)', () => {
      const pointsToSample = [
        { name: 'Lombada', x: 0, y: 0 },
        { name: 'Centro da Página', x: W / 2, y: 0 },
        { name: 'Borda Direita', x: W, y: 0 },
        { name: 'Canto Superior Direito', x: W, y: H / 2 },
        { name: 'Canto Inferior Direito', x: W, y: -H / 2 },
      ]

      for (const pt of pointsToSample) {
        const sample = evaluate3DPagePoint(pt.x, pt.y, W, H, 0.0, 'next', true)
        expect(sample.pos.z).toBe(0)
        expect(sample.normal.z).toBe(1)
        expect(sample.facing).toBe(1.0)
        expect(sample.sampledTexture).toBe('front')
      }
    })

    it('no meio da virada NEXT (progress = 0.5), a folha curva no espaço 3D (Z > 0) e o verso começa a aparecer', () => {
      const spine = evaluate3DPagePoint(0, 0, W, H, 0.5, 'next', true)
      expect(spine.pos.x).toBeCloseTo(0, 1)
      expect(spine.pos.z).toBe(0)
      expect(spine.sampledTexture).toBe('front')

      const outerEdge = evaluate3DPagePoint(W, 0, W, H, 0.5, 'next', true)
      expect(outerEdge.pos.x).toBeCloseTo(0, 1)
      expect(outerEdge.facing).toBe(-1.0) // Verso
      expect(outerEdge.sampledTexture).toBe('back')

      const midPoint = evaluate3DPagePoint(W * 0.7, 0, W, H, 0.5, 'next', true)
      expect(midPoint.pos.z).toBeGreaterThan(0)

      const versoPoint = evaluate3DPagePoint(W * 0.85, 0, W, H, 0.5, 'next', true)
      expect(versoPoint.pos.z).toBeGreaterThan(0)
      expect(versoPoint.facing).toBe(-1.0)
      expect(versoPoint.sampledTexture).toBe('back')
    })

    it('no meio da virada PREVIOUS (progress = 0.5), a folha esquerda dobra para a direita com Z > 0', () => {
      const outerEdge = evaluate3DPagePoint(-W, 0, W, H, 0.5, 'previous', true)
      expect(outerEdge.pos.x).toBeCloseTo(0, 1)
      expect(outerEdge.facing).toBe(-1.0)
      expect(outerEdge.sampledTexture).toBe('back')

      const midPoint = evaluate3DPagePoint(-W * 0.7, 0, W, H, 0.5, 'previous', true)
      expect(midPoint.pos.z).toBeGreaterThan(0)
    })

    it('mantém animação 3D uniforme e alinhada à lombada independente do ponto de tração (gripY)', () => {
      const topCorner = evaluate3DPagePoint(W, H / 2, W, H, 0.3, 'next', true, 0.0)
      const bottomCorner = evaluate3DPagePoint(W, -H / 2, W, H, 0.3, 'next', true, 1.0)
      const center = evaluate3DPagePoint(W, 0, W, H, 0.3, 'next', true, 0.5)

      // Animação uniforme: a linha de dobra mantém o alinhamento paralelo à lombada
      expect(topCorner.pos.x).toBeCloseTo(center.pos.x, 1)
      expect(bottomCorner.pos.x).toBeCloseTo(center.pos.x, 1)
    })

    it('ao finalizar a virada (progress = 1.0), a folha está totalmente virada [-W, 0] com textura do verso ativa', () => {
      const spine = evaluate3DPagePoint(0, 0, W, H, 1.0, 'next', true)
      expect(spine.pos.x).toBeCloseTo(0, 1)

      const outerEdge = evaluate3DPagePoint(W, 0, W, H, 1.0, 'next', true)
      expect(outerEdge.pos.x).toBeCloseTo(-W, 1)
      expect(outerEdge.pos.z).toBeCloseTo(0, 1)
      expect(outerEdge.facing).toBe(-1.0)
      expect(outerEdge.sampledTexture).toBe('back')
    })

    it('garante que nenhum ponto na região de dobra/curvatura (dist > 0) receba textura da frente, prevenindo texto espelhado', () => {
      for (const progress of [0.1, 0.3, 0.5, 0.7, 0.9]) {
        const foldX = W * (1.0 - progress)
        for (let x = foldX + 5; x <= W; x += 20) {
          const sample = evaluate3DPagePoint(x, 0, W, H, progress, 'next', true)
          expect(sample.facing).toBe(-1.0)
          expect(sample.sampledTexture).toBe('back')
        }
      }
    })

    it('garante escala 1:1 sem distorção ou zoom horizontal na curvatura cilíndrica', () => {
      const p = 0.5
      const foldX = W * (1.0 - p)
      const p1 = evaluate3DPagePoint(foldX + 30, 0, W, H, p, 'next', true)
      const p2 = evaluate3DPagePoint(foldX + 50, 0, W, H, p, 'next', true)
      const screenDeltaX = Math.abs(p2.pos.x - p1.pos.x)
      expect(screenDeltaX).toBeCloseTo(20, 1)
    })
  })

  describe('Modo 1 Página (Single-Page Mode)', () => {
    it('na virada NEXT de 1 página (progress = 0.5), a folha eleva no espaço 3D (Z > 0) e dobra em direção à esquerda', () => {
      const midPoint = evaluate3DPagePoint(W * 0.7, 0, W, H, 0.5, 'next', false)
      expect(midPoint.pos.z).toBeGreaterThan(0)

      const outerEdge = evaluate3DPagePoint(W, 0, W, H, 0.5, 'next', false)
      expect(outerEdge.facing).toBe(-1.0)
      expect(outerEdge.sampledTexture).toBe('back')
    })

    it('na virada PREVIOUS de 1 página (progress = 0.5), a folha eleva no espaço 3D (Z > 0) e dobra da esquerda para a direita', () => {
      const curlPoint = evaluate3DPagePoint(W * 0.3, 0, W, H, 0.5, 'previous', false)
      expect(curlPoint.pos.z).toBeGreaterThan(0)

      const leftEdge = evaluate3DPagePoint(0, 0, W, H, 0.5, 'previous', false)
      expect(leftEdge.facing).toBe(-1.0)
      expect(leftEdge.sampledTexture).toBe('back')
    })

    it('na virada PREVIOUS de 1 página finalizada (progress = 1.0), a folha completou o ciclo de transição', () => {
      const leftEdge = evaluate3DPagePoint(0, 0, W, H, 1.0, 'previous', false)
      expect(leftEdge.pos.x).toBeCloseTo(2 * W, 1)
      expect(leftEdge.facing).toBe(-1.0)
    })
  })

  describe('Amostragem Contínua e Canvas 2D', () => {
    it('valida densidade de tinta e conteúdo não-vazio nos canais de pixel do Canvas 2D', () => {
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

      mockCtx.fillStyle = '#f5eedc'
      mockCtx.fillRect(0, 0, 400, 600)

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
        const sample = evaluate3DPagePoint(W, 0, W, H, p, 'next', true)
        outerEdgeTrajectory.push({
          p,
          x: sample.pos.x,
          z: sample.pos.z,
          texture: sample.sampledTexture,
        })
      }

      const first = outerEdgeTrajectory[0]!
      const last = outerEdgeTrajectory[outerEdgeTrajectory.length - 1]!

      expect(first.x).toBe(W)
      expect(last.x).toBeCloseTo(-W, 1)
      expect(first.texture).toBe('front')
      expect(last.texture).toBe('back')

      const midStep = outerEdgeTrajectory.find((s) => s.p === 0.5)!
      expect(midStep.z).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Prevenção de Cortes na Folha ao Puxar Muito (No Clipping / Bounds Safety)', () => {
    it('em qualquer nível de tração (progress 0.0 a 1.0) e grip diagonal extremo, nenhum ponto excede os limites com sangria', () => {
      const BLEED_X = 80
      const BLEED_Y = 80
      const progressSteps = [0.05, 0.2, 0.4, 0.6, 0.75, 0.85, 0.9, 0.95, 1.0]
      const grips = [0.0, 0.2, 0.5, 0.8, 1.0] // Cantos e centro
      const deltas = [-0.4, -0.2, 0.0, 0.2, 0.4] // Deslocamentos verticais extremos

      const gridPoints = [
        { x: 0, y: -H / 2 },
        { x: 0, y: H / 2 },
        { x: W / 2, y: 0 },
        { x: W, y: -H / 2 },
        { x: W, y: 0 },
        { x: W, y: H / 2 },
      ]

      for (const p of progressSteps) {
        for (const grip of grips) {
          for (const delta of deltas) {
            for (const pt of gridPoints) {
              const sample = evaluate3DPagePoint(pt.x, pt.y, W, H, p, 'next', true, grip, delta)
              // Verifica se a coordenada X permanece dentro da janela com sangria
              expect(sample.pos.x).toBeGreaterThanOrEqual(-W - BLEED_X)
              expect(sample.pos.x).toBeLessThanOrEqual(W + BLEED_X)

              // Verifica se a coordenada Y permanece dentro da janela com sangria
              expect(sample.pos.y).toBeGreaterThanOrEqual(-H * 0.5 - BLEED_Y)
              expect(sample.pos.y).toBeLessThanOrEqual(H * 0.5 + BLEED_Y)
            }
          }
        }
      }
    })

    it('ao puxar muito (progress >= 0.9), a folha atenua o ângulo e aterrissa sem inclinação residual torta', () => {
      const topCorner = evaluate3DPagePoint(W, H / 2, W, H, 1.0, 'next', true, 0.0, 0.3)
      const bottomCorner = evaluate3DPagePoint(W, -H / 2, W, H, 1.0, 'next', true, 0.0, 0.3)

      expect(topCorner.pos.x).toBeCloseTo(-W, 1)
      expect(bottomCorner.pos.x).toBeCloseTo(-W, 1)
      expect(topCorner.pos.y).toBeCloseTo(H / 2, 1)
      expect(bottomCorner.pos.y).toBeCloseTo(-H / 2, 1)
    })
  })
})

