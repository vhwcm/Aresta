import { ref, readonly, onUnmounted } from 'vue'
import type { IPageCurlState, PageCurlConfig, CurlDirection, Point2D } from '~/interfaces/reader/IPageCurlState'
import {
  computeCurlGeometry,
  renderPageCurl,
  interpolateCurlState,
  DEFAULT_CONFIG,
  clamp,
} from '~/utils/pageCurlMath'

const SNAP_THRESHOLD = 0.35

function createInitialState(): IPageCurlState {
  return {
    isAnimating: false,
    isDragging: false,
    curlDirection: 'right',
    dragOrigin: null,
    dragCurrent: null,
    progress: 0,
    geometry: null,
    targetPage: 0,
    currentPage: 0,
  }
}

export function usePageCurlEngine(config: Partial<PageCurlConfig> = {}) {
  const mergedConfig: PageCurlConfig = { ...DEFAULT_CONFIG, ...config }
  const state = ref<IPageCurlState>(createInitialState())
  let rafId: number | null = null
  let animationStartTime: number | null = null
  let animationStartProgress = 0
  let animationTargetProgress = 0
  let resolveAnimation: (() => void) | null = null

  let canvasRef: HTMLCanvasElement | null = null
  let renderCurrentFn: ((ctx: CanvasRenderingContext2D) => Promise<void>) | null = null
  let renderNextFn: ((ctx: CanvasRenderingContext2D) => Promise<void>) | null = null

  function bindCanvas(
    canvas: HTMLCanvasElement,
    renderCurrent: (ctx: CanvasRenderingContext2D) => Promise<void>,
    renderNext: (ctx: CanvasRenderingContext2D) => Promise<void>,
  ) {
    canvasRef = canvas
    renderCurrentFn = renderCurrent
    renderNextFn = renderNext
  }

  function startDrag(origin: Point2D, direction: CurlDirection, targetPage: number) {
    cancelAnimation()
    state.value = {
      ...createInitialState(),
      isDragging: true,
      curlDirection: direction,
      dragOrigin: origin,
      dragCurrent: origin,
      currentPage: state.value.currentPage,
      targetPage,
    }
  }

  function updateDrag(current: Point2D) {
    if (!state.value.isDragging || !state.value.dragOrigin) return

    const { dragOrigin, curlDirection } = state.value
    const canvas = canvasRef
    if (!canvas) return

    const width = canvas.width
    const height = canvas.height

    const dragDelta = Math.abs(current.x - dragOrigin.x)
    const progress = clamp(dragDelta / (width * 0.5), 0, 1)

    const geometry = computeCurlGeometry(
      dragOrigin,
      current,
      width,
      height,
      curlDirection,
      mergedConfig,
    )

    state.value = {
      ...state.value,
      dragCurrent: current,
      progress,
      geometry,
    }

    scheduleDraw()
  }

  function endDrag(): Promise<void> {
    if (!state.value.isDragging) return Promise.resolve()

    state.value = { ...state.value, isDragging: false }

    const shouldComplete = state.value.progress >= SNAP_THRESHOLD
    const targetProgress = shouldComplete ? 1 : 0

    return animateTo(targetProgress).then(() => {
      if (shouldComplete) {
        state.value = {
          ...state.value,
          currentPage: state.value.targetPage,
          progress: 0,
          geometry: null,
        }
      } else {
        state.value = createInitialState()
      }
    })
  }

  function animateTo(target: number): Promise<void> {
    return new Promise((resolve) => {
      resolveAnimation = resolve
      animationStartProgress = state.value.progress
      animationTargetProgress = target
      animationStartTime = null
      state.value = { ...state.value, isAnimating: true }
      rafId = requestAnimationFrame(animationLoop)
    })
  }

  function animationLoop(timestamp: number) {
    if (animationStartTime === null) animationStartTime = timestamp

    const elapsed = timestamp - animationStartTime
    const t = Math.min(elapsed / mergedConfig.animationDurationMs, 1)

    const newState = interpolateCurlState(
      state.value,
      animationTargetProgress,
      t,
      mergedConfig,
    )
    state.value = newState

    scheduleDraw()

    if (t < 1) {
      rafId = requestAnimationFrame(animationLoop)
    } else {
      state.value = { ...state.value, isAnimating: false, progress: animationTargetProgress }
      resolveAnimation?.()
      resolveAnimation = null
    }
  }

  function scheduleDraw() {
    const canvas = canvasRef
    if (!canvas || !renderCurrentFn || !renderNextFn) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { geometry, curlDirection, progress } = state.value
    if (!geometry) {
      renderCurrentFn(ctx)
      return
    }

    renderPageCurl(
      ctx,
      canvas.width,
      canvas.height,
      geometry,
      progress,
      curlDirection,
      renderCurrentFn,
      renderNextFn,
      mergedConfig,
    )
  }

  function cancelAnimation() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    resolveAnimation?.()
    resolveAnimation = null
  }

  function reset() {
    cancelAnimation()
    state.value = createInitialState()
  }

  onUnmounted(() => {
    cancelAnimation()
  })

  return {
    state: readonly(state),
    bindCanvas,
    startDrag,
    updateDrag,
    endDrag,
    reset,
  }
}
