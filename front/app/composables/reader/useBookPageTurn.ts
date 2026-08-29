import { computed, onMounted, onUnmounted, readonly, ref, watch, type Ref } from 'vue'
import { useReaderStore } from '~/stores/readerStore'
import { useSettings } from '~/composables/useSettings'

export type PageTurnDirection = 'next' | 'previous'

export interface PageRect {
  left: number
  top: number
  width: number
  height: number
  pageNumber: number
}

export interface PageLayoutInfo {
  isTwoPage: boolean
  leftPage: PageRect | null
  rightPage: PageRect | null
  singlePage: PageRect | null
}

interface Point {
  x: number
  y: number
  time: number
}

export const TURN_DURATION_MS = 280
export const TURN_THRESHOLD = 0.22

export function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value))
}

export function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - clamp(value), 3)
}

export function shouldCommitPageTurn(progress: number, velocity: number): boolean {
  return clamp(progress) >= TURN_THRESHOLD || velocity > 0.002
}

export interface UseBookPageTurnOptions {
  onBeforeTurn?: (targetPage: number) => Promise<void>
  onAfterTurn?: (targetPage: number) => Promise<void>
}

export function useBookPageTurn(
  hostRef: Ref<HTMLElement | null>,
  options: UseBookPageTurnOptions = {},
) {
  const store = useReaderStore()
  const { pageAnimationEnabled } = useSettings()

  const isTransitioning = ref(false)
  const isDragging = ref(false)
  const isPreparing = ref(false)
  const errorMessage = ref<string | null>(null)
  const reducedMotion = ref(false)
  const isAnimationDisabled = computed(() => !pageAnimationEnabled.value || reducedMotion.value)

  const dragOffset = ref(0)
  const transitionDirection = ref<PageTurnDirection>('next')
  const incomingTargetPage = ref(0)

  const pageLayout = ref<PageLayoutInfo>({
    isTwoPage: false,
    leftPage: null,
    rightPage: null,
    singlePage: null,
  })

  let resizeObserver: ResizeObserver | null = null
  let motionQuery: MediaQueryList | null = null

  let dragStart: Point | null = null
  let dragLast: Point | null = null

  function updateMotionPreference() {
    reducedMotion.value = motionQuery?.matches ?? false
  }

  function computeLayout(): PageLayoutInfo {
    const host = hostRef.value
    if (!host) {
      return { isTwoPage: false, leftPage: null, rightPage: null, singlePage: null }
    }

    const hostWidth = host.clientWidth || 800
    const hostHeight = host.clientHeight || 600
    const isTwoPage = store.isTwoPageMode && hostWidth >= 1024 && !store.isGraphOpen

    const currentPage = store.currentPage
    const defaultAspectRatio = store.document?.type === 'epub' ? 800 / 1200 : 0.72
    const aspectRatio = defaultAspectRatio

    if (isTwoPage) {
      const leftNum = currentPage % 2 === 0 ? Math.max(1, currentPage - 1) : currentPage
      const rightNum = leftNum + 1 <= store.totalPages ? leftNum + 1 : 0

      const availableHeight = hostHeight
      let targetHeight = availableHeight
      let targetWidth = targetHeight * aspectRatio

      const maxHalfWidth = hostWidth / 2
      if (targetWidth > maxHalfWidth) {
        targetWidth = maxHalfWidth
        targetHeight = targetWidth / aspectRatio
      }

      const totalBookWidth = targetWidth * 2
      const startX = Math.max(0, (hostWidth - totalBookWidth) / 2)
      const startY = Math.max(0, (hostHeight - targetHeight) / 2)

      const leftPage: PageRect = {
        left: Math.round(startX),
        top: Math.round(startY),
        width: Math.round(targetWidth),
        height: Math.round(targetHeight),
        pageNumber: leftNum,
      }

      const rightPage: PageRect | null = rightNum > 0 ? {
        left: Math.round(startX + targetWidth),
        top: Math.round(startY),
        width: Math.round(targetWidth),
        height: Math.round(targetHeight),
        pageNumber: rightNum,
      } : null

      return {
        isTwoPage: true,
        leftPage,
        rightPage,
        singlePage: null,
      }
    } else {
      const availableHeight = hostHeight
      let targetHeight = availableHeight
      let targetWidth = targetHeight * aspectRatio

      if (targetWidth > hostWidth) {
        targetWidth = hostWidth
        targetHeight = targetWidth / aspectRatio
      }

      const startX = Math.max(0, (hostWidth - targetWidth) / 2)
      const startY = Math.max(0, (hostHeight - targetHeight) / 2)

      const singlePage: PageRect = {
        left: Math.round(startX),
        top: Math.round(startY),
        width: Math.round(targetWidth),
        height: Math.round(targetHeight),
        pageNumber: currentPage,
      }

      return {
        isTwoPage: false,
        leftPage: null,
        rightPage: null,
        singlePage,
      }
    }
  }

  function getTargetPage(direction: PageTurnDirection): number {
    const layout = pageLayout.value
    const step = layout.isTwoPage ? 2 : 1
    if (direction === 'next') {
      return Math.min(store.currentPage + step, store.totalPages)
    } else {
      return Math.max(1, store.currentPage - step)
    }
  }

  async function requestTurn(direction: PageTurnDirection) {
    if (isTransitioning.value || !store.document) return

    const targetPage = getTargetPage(direction)
    if (targetPage === store.currentPage) return

    if (isAnimationDisabled.value || !hostRef.value) {
      store.goToPage(targetPage)
      pageLayout.value = computeLayout()
      return
    }

    transitionDirection.value = direction
    incomingTargetPage.value = targetPage
    isTransitioning.value = true

    if (options.onBeforeTurn) {
      await options.onBeforeTurn(targetPage)
    }

    const hostWidth = hostRef.value.clientWidth || 800
    const targetOffset = direction === 'next' ? -hostWidth : hostWidth

    await new Promise<void>((resolve) => {
      const startTime = performance.now()
      const animate = (time: number) => {
        const elapsed = time - startTime
        const progress = clamp(elapsed / TURN_DURATION_MS, 0, 1)
        const eased = easeOutCubic(progress)
        dragOffset.value = eased * targetOffset

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          resolve()
        }
      }
      requestAnimationFrame(animate)
    })

    if (options.onAfterTurn) {
      await options.onAfterTurn(targetPage)
    }

    store.goToPage(targetPage)
    pageLayout.value = computeLayout()
    dragOffset.value = 0
    incomingTargetPage.value = 0
    isTransitioning.value = false
  }

  function beginDrag(direction: PageTurnDirection, point: Point) {
    if (isTransitioning.value || !store.document) return

    const targetPage = getTargetPage(direction)
    if (targetPage === store.currentPage) return

    isDragging.value = true
    dragStart = point
    dragLast = point
    transitionDirection.value = direction
    incomingTargetPage.value = targetPage
    dragOffset.value = 0
  }

  function updateDrag(point: Point) {
    if (!isDragging.value || !dragStart || !hostRef.value) return

    const deltaX = point.x - dragStart.x
    dragLast = point

    // Restringe o arraste à direção esperada
    if (transitionDirection.value === 'next') {
      dragOffset.value = Math.min(0, deltaX)
    } else {
      dragOffset.value = Math.max(0, deltaX)
    }
  }

  async function endDrag(point: Point) {
    if (!isDragging.value || !dragStart || !hostRef.value) return
    isDragging.value = false

    const width = hostRef.value.clientWidth || 800
    const deltaX = point.x - dragStart.x
    const timeDelta = Math.max(1, point.time - (dragLast?.time ?? dragStart.time))
    const velocity = Math.abs(deltaX) / timeDelta
    const progress = Math.abs(deltaX) / width

    const isCorrectDirection = (transitionDirection.value === 'next' && deltaX < 0)
      || (transitionDirection.value === 'previous' && deltaX > 0)
    const shouldCommit = isCorrectDirection
      && incomingTargetPage.value !== store.currentPage
      && shouldCommitPageTurn(progress, velocity)

    if (shouldCommit) {
      isTransitioning.value = true
      const startOffset = dragOffset.value
      const targetOffset = transitionDirection.value === 'next' ? -width : width
      const remainingDistance = targetOffset - startOffset
      const snapDuration = Math.max(100, Math.min(TURN_DURATION_MS, Math.abs(remainingDistance) / 2))

      await new Promise<void>((resolve) => {
        const startTime = performance.now()
        const snapAnim = (now: number) => {
          const elapsed = now - startTime
          const p = clamp(elapsed / snapDuration, 0, 1)
          dragOffset.value = startOffset + (targetOffset - startOffset) * easeOutCubic(p)
          if (p < 1) {
            requestAnimationFrame(snapAnim)
          } else {
            resolve()
          }
        }
        requestAnimationFrame(snapAnim)
      })

      if (options.onAfterTurn) {
        await options.onAfterTurn(incomingTargetPage.value)
      }

      store.goToPage(incomingTargetPage.value)
      pageLayout.value = computeLayout()
      dragOffset.value = 0
      incomingTargetPage.value = 0
      isTransitioning.value = false
    } else {
      isTransitioning.value = true
      const startOffset = dragOffset.value
      const snapDuration = 140

      await new Promise<void>((resolve) => {
        const startTime = performance.now()
        const snapAnim = (now: number) => {
          const elapsed = now - startTime
          const p = clamp(elapsed / snapDuration, 0, 1)
          dragOffset.value = startOffset * (1 - easeOutCubic(p))
          if (p < 1) {
            requestAnimationFrame(snapAnim)
          } else {
            resolve()
          }
        }
        requestAnimationFrame(snapAnim)
      })

      dragOffset.value = 0
      incomingTargetPage.value = 0
      isTransitioning.value = false
    }

    dragStart = null
    dragLast = null
  }

  function cancelDrag(_point?: Point) {
    if (!isDragging.value) return
    isDragging.value = false
    dragStart = null
    dragLast = null
    dragOffset.value = 0
    incomingTargetPage.value = 0
  }

  function invalidateCacheAndRerender() {
    pageLayout.value = computeLayout()
  }

  function updateLayout() {
    pageLayout.value = computeLayout()
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      motionQuery.addEventListener('change', updateMotionPreference)
      updateMotionPreference()
    }

    const host = hostRef.value
    if (host) {
      resizeObserver = new ResizeObserver(() => {
        updateLayout()
      })
      resizeObserver.observe(host)
      updateLayout()
    }
  })

  onUnmounted(() => {
    if (resizeObserver) resizeObserver.disconnect()
    if (motionQuery) motionQuery.removeEventListener('change', updateMotionPreference)
  })

  watch(
    [() => store.currentPage, () => store.document, () => store.isTwoPageMode, () => store.isGraphOpen],
    () => {
      updateLayout()
    },
    { flush: 'post' },
  )

  return {
    isTransitioning: readonly(isTransitioning),
    isDragging: readonly(isDragging),
    isPreparing: readonly(isPreparing),
    errorMessage: readonly(errorMessage),
    pageLayout: readonly(pageLayout),
    dragOffset: readonly(dragOffset),
    transitionDirection: readonly(transitionDirection),
    incomingTargetPage: readonly(incomingTargetPage),
    requestTurn,
    beginDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    invalidateCacheAndRerender,
    updateLayout,
  }
}

