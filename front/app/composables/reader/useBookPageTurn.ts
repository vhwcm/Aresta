import { computed, onMounted, onUnmounted, readonly, ref, watch, type Ref } from 'vue'
import { useReaderStore } from '~/stores/readerStore'
import { useSettings } from '~/composables/useSettings'

import type { PageTurnDirection } from '~/interfaces/reader/types'
export type { PageTurnDirection }

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

import { TURN_DURATION_MS, SNAP_THRESHOLD as TURN_THRESHOLD } from '~/composables/reader/constants'
export { TURN_DURATION_MS, TURN_THRESHOLD }

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
  onBeforeTurn?: (_targetPage: number) => Promise<void>
  onAfterTurn?: (_targetPage: number) => Promise<void>
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
  const pointerY = ref(0.5)
  const pointerDeltaY = ref(0)
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
    const isTwoPage = store.isTwoPageMode && hostWidth >= 768

    const currentPage = store.currentPage
    const isEpub = store.document?.type === 'epub'
    const defaultAspectRatio = isEpub ? 0.72 : 0.72
    const aspectRatio = defaultAspectRatio
    const isWide = store.readerWidthMode === 'wide'

    if (isTwoPage) {
      let targetWidth: number
      let targetHeight: number

      if (isWide) {
        // Modo Expandido: Ocupa 100% da área útil disponível
        const availableWidth = Math.max(300, hostWidth - 32)
        targetWidth = Math.floor(availableWidth / 2)
        if (isEpub) {
          targetHeight = Math.max(300, hostHeight - 24)
        } else {
          targetHeight = Math.min(hostHeight - 24, Math.round(targetWidth / aspectRatio))
        }
      } else {
        // Modo Centralizado: Proporção clássica de livro físico com margens elegantes
        const availableHeight = Math.round(hostHeight * 0.94)
        targetHeight = availableHeight
        targetWidth = Math.round(targetHeight * aspectRatio)

        const maxHalfWidth = Math.floor((hostWidth - 48) / 2)
        if (targetWidth > maxHalfWidth) {
          targetWidth = maxHalfWidth
          targetHeight = Math.round(targetWidth / aspectRatio)
        }
      }

      const leftNum = currentPage % 2 !== 0 ? currentPage : currentPage - 1
      const rightNum = leftNum + 1 <= store.totalPages ? leftNum + 1 : 0

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
      let targetWidth: number
      let targetHeight: number
      let startX = 0
      let startY = 0

      const isMobile = hostWidth < 768

      if (isMobile) {
        // No mobile: sem bordas ou margens externas, 100% de largura e altura uniforme com o fundo
        targetWidth = hostWidth
        targetHeight = hostHeight
        startX = 0
        startY = 0
      } else if (isWide) {
        // Modo Expandido no Desktop/Tablet: 1 folha ocupando quase 100% da largura útil
        targetWidth = Math.max(300, Math.round(hostWidth - 32))
        if (isEpub) {
          targetHeight = Math.max(300, hostHeight - 24)
        } else {
          targetHeight = Math.min(hostHeight - 24, Math.round(targetWidth / aspectRatio))
        }
        startX = Math.max(0, (hostWidth - targetWidth) / 2)
        startY = Math.max(0, (hostHeight - targetHeight) / 2)
      } else {
        // Modo Centralizado no Desktop/Tablet: 1 folha centralizada com proporção clássica
        const availableHeight = Math.round(hostHeight * 0.94)
        targetHeight = availableHeight
        targetWidth = Math.round(targetHeight * aspectRatio)

        const maxWidth = Math.round(Math.min(hostWidth - 32, hostWidth * 0.85))
        if (targetWidth > maxWidth) {
          targetWidth = maxWidth
          targetHeight = Math.round(targetWidth / aspectRatio)
        }
        startX = Math.max(0, (hostWidth - targetWidth) / 2)
        startY = Math.max(0, (hostHeight - targetHeight) / 2)
      }

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
    if (!layout.isTwoPage) {
      if (direction === 'next') {
        return Math.min(store.currentPage + 1, store.totalPages)
      } else {
        return Math.max(1, store.currentPage - 1)
      }
    }

    const curLeft = store.currentPage % 2 !== 0 ? store.currentPage : store.currentPage - 1
    if (direction === 'next') {
      return Math.min(curLeft + 2, store.totalPages)
    } else {
      return Math.max(1, curLeft - 2)
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
    // Em cliques automáticos, simula puxada suave do canto inferior direito / canto do livro
    pointerY.value = direction === 'next' ? 0.75 : 0.25
    pointerDeltaY.value = 0

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
    pointerY.value = 0.5
    pointerDeltaY.value = 0
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

    const hostHeight = hostRef.value?.clientHeight || 600
    pointerY.value = clamp(point.y / hostHeight, 0, 1)
    pointerDeltaY.value = 0
  }

  function updateDrag(point: Point) {
    if (!isDragging.value || !dragStart || !hostRef.value) return

    const deltaX = point.x - dragStart.x
    dragLast = point

    const hostHeight = hostRef.value.clientHeight || 600
    pointerY.value = clamp(point.y / hostHeight, 0, 1)
    pointerDeltaY.value = point.y - dragStart.y

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
    [() => store.currentPage, () => store.document, () => store.isTwoPageMode, () => store.readerWidthMode, () => store.isGraphOpen],
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
    pointerY: readonly(pointerY),
    pointerDeltaY: readonly(pointerDeltaY),
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

