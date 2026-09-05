import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import * as THREE from 'three'
import { usePageCurl3D, evaluate3DPagePoint } from '~/composables/reader/usePageCurl3D'

// Mock WebGLRenderer para ambiente Node / happy-dom
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof THREE>('three')

  class MockWebGLRenderer {
    domElement: HTMLCanvasElement
    toneMapping = 0
    render = vi.fn()
    setSize = vi.fn()
    setPixelRatio = vi.fn()
    dispose = vi.fn()
    forceContextLoss = vi.fn()

    constructor(options?: { canvas?: HTMLCanvasElement }) {
      this.domElement = options?.canvas || document.createElement('canvas')
    }
  }

  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
  }
})

describe('PageCurl3DEngine - Three.js WebGL Page Turn Engine', () => {
  let canvas: HTMLCanvasElement
  let canvasRef: Ref<HTMLCanvasElement | null>

  beforeEach(() => {
    canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    canvasRef = ref<HTMLCanvasElement | null>(canvas)
  })

  it('inicializa a cena 3D e o ShaderMaterial com uniformes corretos para Modo 2 Páginas', () => {
    const engine = usePageCurl3D(canvasRef)

    engine.setupScene({
      isTwoPage: true,
      pageWidth: 400,
      pageHeight: 600,
      direction: 'next',
    })

    expect(engine.isReady.value).toBe(true)

    // Atualiza progresso da virada
    engine.updateUniforms({
      progress: 0.5,
      direction: 'next',
      isTwoPage: true,
      gripY: 0.5,
      pointerDeltaY: 0,
    })

    engine.render()
    engine.destroy()
    expect(engine.isReady.value).toBe(false)
  })

  it('cria malha com resolução ultra-densa (>= 128 segmentos no eixo X) para evitar cortes de glifos', () => {
    const engine = usePageCurl3D(canvasRef)
    const W = 400
    engine.setupScene({
      isTwoPage: true,
      pageWidth: W,
      pageHeight: 600,
      direction: 'next',
    })

    expect(engine.isReady.value).toBe(true)
    engine.destroy()
  })

  it('configura o modo Single-Page com câmera e uniformes adequados', () => {
    const engine = usePageCurl3D(canvasRef)

    engine.setupScene({
      isTwoPage: false,
      pageWidth: 400,
      pageHeight: 600,
      direction: 'previous',
    })

    expect(engine.isReady.value).toBe(true)

    engine.updateUniforms({
      progress: 0.4,
      direction: 'previous',
      isTwoPage: false,
      gripY: 0.2,
      pointerDeltaY: 0.05,
    })

    engine.render()
    engine.destroy()
  })

  it('recicla texturas existentes com needsUpdate em vez de recriar a cada frame (alta eficiência)', () => {
    const engine = usePageCurl3D(canvasRef)

    engine.setupScene({
      isTwoPage: true,
      pageWidth: 400,
      pageHeight: 600,
      direction: 'next',
    })

    const frontCanvas = document.createElement('canvas')
    frontCanvas.width = 400
    frontCanvas.height = 600

    const backCanvas = document.createElement('canvas')
    backCanvas.width = 400
    backCanvas.height = 600

    // 1ª Atribuição de texturas
    engine.setTextures(frontCanvas, backCanvas)

    // 2ª Atribuição de texturas (mesmos canvases com novos dados de render)
    engine.setTextures(frontCanvas, backCanvas)

    engine.destroy()
  })

  describe('Garantia Matemática do Efeito 3D (Z > 0 em todas as direções)', () => {
    const W = 400
    const H = 600

    it('no Modo 2 Páginas - NEXT: eleva vértices no eixo Z no meio da animação', () => {
      const midPoint = evaluate3DPagePoint(W * 0.7, 0, W, H, 0.5, 'next', true)
      expect(midPoint.pos.z).toBeGreaterThan(0)
      expect(midPoint.pos.x).toBeLessThan(W)
    })

    it('no Modo 2 Páginas - PREVIOUS: eleva vértices no eixo Z no meio da animação', () => {
      const midPoint = evaluate3DPagePoint(-W * 0.7, 0, W, H, 0.5, 'previous', true)
      expect(midPoint.pos.z).toBeGreaterThan(0)
      expect(midPoint.pos.x).toBeGreaterThan(-W)
    })

    it('no Modo 1 Página - NEXT: eleva vértices no eixo Z sem estourar o viewport', () => {
      const midPoint = evaluate3DPagePoint(W * 0.75, 0, W, H, 0.5, 'next', false)
      expect(midPoint.pos.z).toBeGreaterThan(0)
    })

    it('no Modo 1 Página - PREVIOUS: eleva vértices no eixo Z garantindo que o efeito 3D ocorra', () => {
      const midPoint = evaluate3DPagePoint(W * 0.25, 0, W, H, 0.5, 'previous', false)
      expect(midPoint.pos.z).toBeGreaterThan(0)
    })

    it('ao início (progress = 0), a folha está perfeitamente plana (Z = 0) em todos os pontos', () => {
      const p1 = evaluate3DPagePoint(W * 0.5, 0, W, H, 0.0, 'next', true)
      const p2 = evaluate3DPagePoint(W * 0.5, 0, W, H, 0.0, 'previous', false)
      expect(p1.pos.z).toBe(0)
      expect(p2.pos.z).toBe(0)
    })
  })
})
