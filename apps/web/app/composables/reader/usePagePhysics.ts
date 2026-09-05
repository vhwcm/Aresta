import { ref, computed } from 'vue'
import type { PageTurnDirection, GripRegion, DragPoint } from '~/interfaces/reader/types'

export type { PageTurnDirection, GripRegion, DragPoint }

export interface PagePhysicsOptions {
  snapThreshold?: number
  flickVelocityThreshold?: number
  springStiffness?: number
  springDamping?: number
  onProgress?: (_progress: number, _gripY: number, _deltaY: number) => void
  onComplete?: (_direction: PageTurnDirection) => void
  onCancel?: () => void
}

import {
  SNAP_THRESHOLD as DEFAULT_SNAP_THRESHOLD,
  FLICK_VELOCITY_THRESHOLD as DEFAULT_FLICK_VELOCITY,
  SPRING_STIFFNESS as DEFAULT_SPRING_STIFFNESS,
  SPRING_DAMPING as DEFAULT_SPRING_DAMPING,
} from '~/composables/reader/constants'

export function usePagePhysics(options: PagePhysicsOptions = {}) {
  const snapThreshold = options.snapThreshold ?? DEFAULT_SNAP_THRESHOLD
  const flickVelocity = options.flickVelocityThreshold ?? DEFAULT_FLICK_VELOCITY
  const stiffness = options.springStiffness ?? DEFAULT_SPRING_STIFFNESS
  const damping = options.springDamping ?? DEFAULT_SPRING_DAMPING

  const isDragging = ref(false)
  const isAnimating = ref(false)
  const progress = ref(0)
  const gripY = ref(0.5) // 0.0 (top) to 1.0 (bottom)
  const pointerDeltaY = ref(0)
  const activeDirection = ref<PageTurnDirection>('next')
  const gripRegion = ref<GripRegion>('edge-center')

  let startPoint: DragPoint | null = null
  let lastPoint: DragPoint | null = null
  let velocityX = 0
  let velocityY = 0
  let pageWidth = 600
  let pageHeight = 800
  let springRafId: number | null = null
  let lastFrameTime = 0

  function determineGripRegion(y: number, height: number): GripRegion {
    const ratio = Math.max(0, Math.min(1, y / Math.max(1, height)))
    if (ratio < 0.28) return 'top-corner'
    if (ratio > 0.72) return 'bottom-corner'
    return 'edge-center'
  }

  function startDrag(
    point: DragPoint,
    direction: PageTurnDirection,
    width: number,
    height: number,
    relativeY: number,
  ) {
    if (springRafId !== null) {
      cancelAnimationFrame(springRafId)
      springRafId = null
    }

    pageWidth = Math.max(100, width)
    pageHeight = Math.max(100, height)
    activeDirection.value = direction
    startPoint = { ...point }
    lastPoint = { ...point }
    velocityX = 0
    velocityY = 0

    const clampedRelativeY = Math.max(0, Math.min(1, relativeY))
    gripY.value = clampedRelativeY
    gripRegion.value = determineGripRegion(point.y, pageHeight)
    pointerDeltaY.value = 0
    progress.value = 0
    isDragging.value = true
    isAnimating.value = true

    options.onProgress?.(progress.value, gripY.value, pointerDeltaY.value)
  }

  function updateDrag(point: DragPoint) {
    if (!isDragging.value || !startPoint || !lastPoint) return

    const dt = Math.max(1, point.time - lastPoint.time) / 1000
    const dx = point.x - lastPoint.x
    const dy = point.y - lastPoint.y

    // Filtro passa-baixa para velocidade
    velocityX = 0.7 * (dx / dt) + 0.3 * velocityX
    velocityY = 0.7 * (dy / dt) + 0.3 * velocityY
    lastPoint = { ...point }

    // Calcula progresso relativo
    let rawDeltaX = 0
    if (activeDirection.value === 'next') {
      rawDeltaX = startPoint.x - point.x
    } else {
      rawDeltaX = point.x - startPoint.x
    }

    const calculatedProgress = Math.max(0, Math.min(1, rawDeltaX / pageWidth))
    progress.value = calculatedProgress

    const deltaYNorm = (point.y - startPoint.y) / pageHeight
    pointerDeltaY.value = Math.max(-0.4, Math.min(0.4, deltaYNorm))

    options.onProgress?.(progress.value, gripY.value, pointerDeltaY.value)
  }

  function endDrag(point?: DragPoint) {
    if (!isDragging.value) return
    isDragging.value = false

    if (point && lastPoint && startPoint) {
      const dt = Math.max(1, point.time - lastPoint.time) / 1000
      if (dt < 0.1) {
        const dx = point.x - lastPoint.x
        velocityX = dx / dt
      }
      let rawDeltaX = 0
      if (activeDirection.value === 'next') {
        rawDeltaX = startPoint.x - point.x
      } else {
        rawDeltaX = point.x - startPoint.x
      }
      progress.value = Math.max(0, Math.min(1, rawDeltaX / pageWidth))
    }

    // Avalia se comete a virada ou cancela
    const currentProgress = progress.value
    let shouldCommit = currentProgress >= snapThreshold

    // Detecção de flick por velocidade (px/ms normalizado)
    const normalizedVelX = activeDirection.value === 'next' ? -velocityX : velocityX
    if (normalizedVelX > flickVelocity * 1000 && currentProgress > 0.04) {
      shouldCommit = true
    } else if (normalizedVelX < -flickVelocity * 1000 && currentProgress < 0.85) {
      shouldCommit = false
    }

    const targetProgress = shouldCommit ? 1.0 : 0.0
    animateSpring(targetProgress, shouldCommit)
  }

  function cancelDrag() {
    if (!isDragging.value && !isAnimating.value) return
    isDragging.value = false
    animateSpring(0.0, false)
  }

  /**
   * Simulação de mola física (Second-Order Spring Dynamics)
   */
  function animateSpring(target: number, isCompleting: boolean) {
    if (springRafId !== null) {
      cancelAnimationFrame(springRafId)
      springRafId = null
    }

    isAnimating.value = true
    lastFrameTime = performance.now()
    let currentPos = progress.value
    let currentVel = (target - currentPos) * 12 // impulso inicial

    function step(now: number) {
      const deltaSeconds = Math.min(0.04, Math.max(0.001, (now - lastFrameTime) / 1000))
      lastFrameTime = now

      // Equação da mola: F = -k*(x - target) - c*v
      const displacement = currentPos - target
      const springForce = -stiffness * displacement
      const dampingForce = -damping * currentVel
      const acceleration = springForce + dampingForce

      currentVel += acceleration * deltaSeconds
      currentPos += currentVel * deltaSeconds

      // Limites de parada
      const isSettled = Math.abs(currentPos - target) < 0.002 && Math.abs(currentVel) < 0.01

      if (isSettled || (target === 1.0 && currentPos >= 0.999) || (target === 0.0 && currentPos <= 0.001)) {
        progress.value = target
        isAnimating.value = false
        springRafId = null

        options.onProgress?.(target, gripY.value, pointerDeltaY.value)

        if (isCompleting) {
          options.onComplete?.(activeDirection.value)
        } else {
          options.onCancel?.()
        }
        return
      }

      progress.value = Math.max(0, Math.min(1, currentPos))
      options.onProgress?.(progress.value, gripY.value, pointerDeltaY.value)
      springRafId = requestAnimationFrame(step)
    }

    springRafId = requestAnimationFrame(step)
  }

  /**
   * Disparo programático de virada suave (ex: por clique em botão ou atalho de teclado)
   */
  function triggerTurn(
    direction: PageTurnDirection,
    width: number,
    height: number,
    fromGripY = 0.5,
  ) {
    pageWidth = Math.max(100, width)
    pageHeight = Math.max(100, height)
    activeDirection.value = direction
    gripY.value = fromGripY
    pointerDeltaY.value = 0
    progress.value = 0
    isDragging.value = false
    isAnimating.value = true

    animateSpring(1.0, true)
  }

  function destroy() {
    if (springRafId !== null) {
      cancelAnimationFrame(springRafId)
      springRafId = null
    }
    isDragging.value = false
    isAnimating.value = false
  }

  return {
    isDragging: computed(() => isDragging.value),
    isAnimating: computed(() => isAnimating.value),
    progress: computed(() => progress.value),
    gripY: computed(() => gripY.value),
    pointerDeltaY: computed(() => pointerDeltaY.value),
    activeDirection: computed(() => activeDirection.value),
    gripRegion: computed(() => gripRegion.value),
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    triggerTurn,
    destroy,
  }
}
