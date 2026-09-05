import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePagePhysics } from '~/composables/reader/usePagePhysics'

describe('usePagePhysics', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('inicializa com estado padrão', () => {
    const physics = usePagePhysics()
    expect(physics.isDragging.value).toBe(false)
    expect(physics.isAnimating.value).toBe(false)
    expect(physics.progress.value).toBe(0)
    expect(physics.gripY.value).toBe(0.5)
  })

  it('inicia o arrasto corretamente e detecta regiões de grip', () => {
    const onProgress = vi.fn()
    const physics = usePagePhysics({ onProgress })

    // Grip no topo (< 0.28)
    physics.startDrag({ x: 500, y: 100, time: 1000 }, 'next', 500, 700, 0.14)
    expect(physics.isDragging.value).toBe(true)
    expect(physics.isAnimating.value).toBe(true)
    expect(physics.activeDirection.value).toBe('next')
    expect(physics.gripRegion.value).toBe('top-corner')
    expect(onProgress).toHaveBeenCalled()

    // Grip na base (> 0.72)
    physics.startDrag({ x: 500, y: 650, time: 1000 }, 'next', 500, 700, 0.9)
    expect(physics.gripRegion.value).toBe('bottom-corner')

    // Grip no centro
    physics.startDrag({ x: 500, y: 350, time: 1000 }, 'next', 500, 700, 0.5)
    expect(physics.gripRegion.value).toBe('edge-center')
  })

  it('calcula o progresso de arrasto linear em tempo real', () => {
    const physics = usePagePhysics()
    physics.startDrag({ x: 500, y: 350, time: 1000 }, 'next', 500, 700, 0.5)

    // Move 250px para a esquerda (50% de 500px)
    physics.updateDrag({ x: 250, y: 350, time: 1050 })
    expect(physics.progress.value).toBeCloseTo(0.5, 2)

    // Move 500px para a esquerda (100% de 500px)
    physics.updateDrag({ x: 0, y: 350, time: 1100 })
    expect(physics.progress.value).toBe(1.0)
  })

  it('aciona virada programática por triggerTurn', () => {
    const onComplete = vi.fn()
    const physics = usePagePhysics({ onComplete })

    physics.triggerTurn('next', 500, 700)
    expect(physics.isAnimating.value).toBe(true)
    expect(physics.activeDirection.value).toBe('next')
  })

  it('confirma a virada ao soltar a folha além do limiar responsivo (progress >= 0.18)', () => {
    const onComplete = vi.fn()
    const physics = usePagePhysics({ onComplete })

    physics.startDrag({ x: 500, y: 350, time: 1000 }, 'next', 500, 700, 0.5)
    // Puxa 100px (20% de 500px, ultrapassando SNAP_THRESHOLD = 0.18)
    physics.updateDrag({ x: 400, y: 350, time: 1050 })
    expect(physics.progress.value).toBeCloseTo(0.20, 2)

    physics.endDrag({ x: 400, y: 350, time: 1050 })
    // Avança o timer de animação da mola
    vi.advanceTimersByTime(500)
    expect(onComplete).toHaveBeenCalledWith('next')
  })

  it('confirma a virada com flick suave em velocidade moderada (> 0.25 px/ms)', () => {
    const onComplete = vi.fn()
    const physics = usePagePhysics({ onComplete })

    physics.startDrag({ x: 500, y: 350, time: 1000 }, 'next', 500, 700, 0.5)
    physics.updateDrag({ x: 460, y: 350, time: 1030 })

    // Move 20px em 20ms = 1px/ms no instante final da soltura (flick veloz)
    physics.endDrag({ x: 440, y: 350, time: 1050 })
    vi.advanceTimersByTime(500)
    expect(onComplete).toHaveBeenCalledWith('next')
  })
})

