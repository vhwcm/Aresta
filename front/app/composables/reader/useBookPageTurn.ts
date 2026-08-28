import { computed, onMounted, onUnmounted, readonly, ref, watch, type Ref } from 'vue'
import { useReaderStore } from '~/stores/readerStore'
import { useSettings } from '~/composables/useSettings'
import type { IBookDocument, PageData } from '~/interfaces/reader/IBookDocument'
import { logWarn } from '~/utils/logger'

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

interface PageRaster {
  pageNumber: number
  canvas: HTMLCanvasElement
  aspectRatio: number
}

interface Point {
  x: number
  y: number
  time: number
}

const MAX_CACHED_PAGES = 8
const TURN_DURATION_MS = 200
const TURN_THRESHOLD = 0.32

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value))
}

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - clamp(value), 3)
}

export function shouldCommitPageTurn(progress: number, velocity: number): boolean {
  return clamp(progress) >= TURN_THRESHOLD || velocity > 0.002
}

export function useBookPageTurn(hostRef: Ref<HTMLElement | null>) {
  const store = useReaderStore()
  const { pageAnimationEnabled } = useSettings()

  const isTransitioning = ref(false)
  const isPreparing = ref(false)
  const errorMessage = ref<string | null>(null)
  const reducedMotion = ref(false)
  const isAnimationDisabled = computed(() => !pageAnimationEnabled.value || reducedMotion.value)

  const pageLayout = ref<PageLayoutInfo>({
    isTwoPage: false,
    leftPage: null,
    rightPage: null,
    singlePage: null,
  })

  const rasterCache = new Map<number, PageRaster>()
  const pendingRasters = new Map<number, Promise<PageRaster>>()
  let blankRaster: PageRaster | null = null

  let stageCanvas: HTMLCanvasElement | null = null
  let stageCtx: CanvasRenderingContext2D | null = null
  let resizeObserver: ResizeObserver | null = null
  let motionQuery: MediaQueryList | null = null

  let animationFrame: number | null = null
  let isDragging = false
  let dragStart: Point | null = null
  let dragLast: Point | null = null
  let currentDragOffsetX = 0
  let dragDirection: PageTurnDirection = 'next'
  let dragTargetPage = 0

  function updateMotionPreference() {
    reducedMotion.value = motionQuery?.matches ?? false
  }

  function getThemeColors() {
    const theme = store.readerTheme || 'sepia'
    if (theme === 'sepia') {
      return {
        bg: '#f5eedc',
        shadow: 'rgba(60, 45, 20, 0.18)',
        spineGradient: 'rgba(60, 45, 20, 0.16)',
        spineCrease: 'rgba(60, 45, 20, 0.14)',
      }
    } else if (theme === 'black') {
      return {
        bg: '#121214',
        shadow: 'rgba(0, 0, 0, 0.6)',
        spineGradient: 'rgba(0, 0, 0, 0.4)',
        spineCrease: 'rgba(255, 255, 255, 0.08)',
      }
    } else {
      return {
        bg: '#ffffff',
        shadow: 'rgba(0, 0, 0, 0.18)',
        spineGradient: 'rgba(0, 0, 0, 0.14)',
        spineCrease: 'rgba(0, 0, 0, 0.12)',
      }
    }
  }

  function getBlankRaster(aspectRatio = 0.72): PageRaster {
    if (blankRaster && Math.abs(blankRaster.aspectRatio - aspectRatio) < 0.01) {
      return blankRaster
    }
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = Math.max(1, Math.round(1200 / Math.max(0.1, aspectRatio)))
    const context = canvas.getContext('2d')
    if (context) {
      const colors = getThemeColors()
      context.fillStyle = colors.bg
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
    blankRaster = {
      pageNumber: 0,
      canvas,
      aspectRatio,
    }
    return blankRaster
  }

  function getTargetPixelSize(): { width: number; height: number } {
    const host = hostRef.value
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
    const hostWidth = host?.clientWidth || 800
    const hostHeight = host?.clientHeight || 600
    const isTwoPage = store.isTwoPageMode && hostWidth >= 1024 && !store.isGraphOpen

    const pageCssWidth = isTwoPage ? hostWidth / 2 : hostWidth
    const pageCssHeight = hostHeight

    return {
      width: Math.round(Math.max(300, pageCssWidth) * dpr),
      height: Math.round(Math.max(400, pageCssHeight) * dpr),
    }
  }

  async function createRasterForPage(pageNumber: number, doc: IBookDocument): Promise<PageRaster> {
    if (pageNumber <= 0 || pageNumber > store.totalPages) {
      return getBlankRaster()
    }

    try {
      const targetSize = getTargetPixelSize()
      const pageData: PageData = await doc.getPage(pageNumber, targetSize.width, targetSize.height)
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(pageData.width)
      canvas.height = Math.ceil(pageData.height)

      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) throw new Error('Não foi possível obter contexto 2D para rasterizar página.')

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      await pageData.render(ctx)

      if (store.readerTheme === 'sepia') {
        ctx.save()
        ctx.globalCompositeOperation = 'multiply'
        ctx.fillStyle = '#f5eedc'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.restore()
      }

      const raster: PageRaster = {
        pageNumber,
        canvas,
        aspectRatio: pageData.aspectRatio || (pageData.width / Math.max(1, pageData.height)),
      }

      rasterCache.set(pageNumber, raster)
      trimRasterCache(pageNumber)
      return raster
    } catch (err) {
      logWarn(`[useBookPageTurn] Falha ao renderizar página ${pageNumber}:`, err)
      return getBlankRaster()
    }
  }

  function getPageRaster(pageNumber: number): Promise<PageRaster> {
    if (pageNumber <= 0 || pageNumber > store.totalPages) {
      return Promise.resolve(getBlankRaster())
    }

    const cached = rasterCache.get(pageNumber)
    if (cached) return Promise.resolve(cached)

    const pending = pendingRasters.get(pageNumber)
    if (pending) return pending

    if (!store.document) {
      return Promise.resolve(getBlankRaster())
    }

    const promise = createRasterForPage(pageNumber, store.document).finally(() => {
      pendingRasters.delete(pageNumber)
    })

    pendingRasters.set(pageNumber, promise)
    return promise
  }

  function trimRasterCache(current: number) {
    if (rasterCache.size <= MAX_CACHED_PAGES) return

    for (const [pageNum] of rasterCache.entries()) {
      if (Math.abs(pageNum - current) > 4) {
        rasterCache.delete(pageNum)
      }
    }
  }

  function prefetchSurroundingPages(currentPage: number) {
    if (typeof window === 'undefined') return
    const schedule = (window.requestIdleCallback as unknown as ((_cb: () => void) => number)) || ((_cb: () => void) => setTimeout(_cb, 100))

    schedule(() => {
      const candidates = [
        currentPage + 1,
        currentPage + 2,
        currentPage - 1,
        currentPage - 2,
      ]

      for (const page of candidates) {
        if (page >= 1 && page <= store.totalPages && !rasterCache.has(page) && !pendingRasters.has(page)) {
          void getPageRaster(page)
        }
      }
    })
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
    const currentRaster = rasterCache.get(currentPage)
    const defaultAspectRatio = store.document?.type === 'epub' ? 800 / 1200 : 0.72
    const aspectRatio = currentRaster?.aspectRatio || defaultAspectRatio

    if (isTwoPage) {
      const leftNum = currentPage % 2 === 0 ? Math.max(1, currentPage - 1) : currentPage
      const rightNum = leftNum + 1 <= store.totalPages ? leftNum + 1 : 0

      // Maximizar para preencher do topo à barra inferior
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

  let lastResizeWidth = 0
  let lastResizeHeight = 0

  function resizeCanvasToHost() {
    const host = hostRef.value
    if (!host || !stageCanvas || !stageCtx) return

    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
    const width = host.clientWidth
    const height = host.clientHeight

    if (width === 0 || height === 0) return

    const widthChanged = lastResizeWidth > 0 && Math.abs(lastResizeWidth - width) > 40
    const heightChanged = lastResizeHeight > 0 && Math.abs(lastResizeHeight - height) > 40
    lastResizeWidth = width
    lastResizeHeight = height

    stageCanvas.width = Math.round(width * dpr)
    stageCanvas.height = Math.round(height * dpr)
    stageCanvas.style.width = `${width}px`
    stageCanvas.style.height = `${height}px`

    stageCtx.setTransform(1, 0, 0, 1, 0, 0)
    stageCtx.scale(dpr, dpr)
    stageCtx.imageSmoothingEnabled = true
    stageCtx.imageSmoothingQuality = 'high'

    pageLayout.value = computeLayout()
    drawScene(0)

    if (widthChanged || heightChanged) {
      rasterCache.clear()
      void renderCurrentView()
    }
  }

  function drawPageShadow(ctx: CanvasRenderingContext2D, rect: PageRect, isLeftSpread = false, isRightSpread = false) {
    const colors = getThemeColors()
    ctx.save()
    ctx.shadowColor = colors.shadow
    ctx.shadowBlur = 20
    ctx.shadowOffsetX = isLeftSpread ? -6 : (isRightSpread ? 6 : 0)
    ctx.shadowOffsetY = 0
    ctx.fillStyle = colors.bg
    ctx.fillRect(rect.left, rect.top, rect.width, rect.height)
    ctx.restore()
  }

  function drawPageRaster(ctx: CanvasRenderingContext2D, raster: PageRaster | null, rect: PageRect, offsetX = 0, isLeftSpread = false, isRightSpread = false) {
    const targetRect: PageRect = {
      ...rect,
      left: rect.left + offsetX,
    }

    drawPageShadow(ctx, targetRect, isLeftSpread, isRightSpread)
    const colors = getThemeColors()

    if (raster && raster.canvas) {
      ctx.save()
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      if (store.readerTheme === 'black') {
        ctx.filter = 'invert(0.92) hue-rotate(180deg) contrast(0.95)'
      }

      ctx.drawImage(
        raster.canvas,
        0, 0, raster.canvas.width, raster.canvas.height,
        targetRect.left, targetRect.top, targetRect.width, targetRect.height,
      )
      ctx.restore()
    } else {
      ctx.fillStyle = colors.bg
      ctx.fillRect(targetRect.left, targetRect.top, targetRect.width, targetRect.height)
    }
  }

  function drawBookSpineShadow(ctx: CanvasRenderingContext2D, leftPage: PageRect, rightPage: PageRect, offsetX = 0) {
    const centerX = leftPage.left + leftPage.width + offsetX
    const top = leftPage.top
    const height = leftPage.height
    const spineWidth = 28
    const colors = getThemeColors()

    ctx.save()
    const gradLeft = ctx.createLinearGradient(centerX - spineWidth, top, centerX, top)
    gradLeft.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradLeft.addColorStop(1, colors.spineGradient)
    ctx.fillStyle = gradLeft
    ctx.fillRect(centerX - spineWidth, top, spineWidth, height)

    const gradRight = ctx.createLinearGradient(centerX, top, centerX + spineWidth, top)
    gradRight.addColorStop(0, colors.spineGradient)
    gradRight.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = gradRight
    ctx.fillRect(centerX, top, spineWidth, height)

    // Linha de vinco central
    ctx.strokeStyle = colors.spineCrease
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(centerX, top)
    ctx.lineTo(centerX, top + height)
    ctx.stroke()
    ctx.restore()
  }

  function drawScene(offsetX = 0, incomingRasters?: { left?: PageRaster | null; right?: PageRaster | null; single?: PageRaster | null }) {
    if (!stageCtx || !hostRef.value) return

    const width = hostRef.value.clientWidth
    const height = hostRef.value.clientHeight
    const layout = pageLayout.value

    stageCtx.imageSmoothingEnabled = true
    stageCtx.imageSmoothingQuality = 'high'
    stageCtx.clearRect(0, 0, width, height)

    if (layout.isTwoPage && layout.leftPage) {
      const leftRaster = rasterCache.get(layout.leftPage.pageNumber) || null
      const rightRaster = layout.rightPage ? (rasterCache.get(layout.rightPage.pageNumber) || null) : null

      drawPageRaster(stageCtx, leftRaster, layout.leftPage, offsetX, true, false)
      if (layout.rightPage) {
        drawPageRaster(stageCtx, rightRaster, layout.rightPage, offsetX, false, true)
        drawBookSpineShadow(stageCtx, layout.leftPage, layout.rightPage, offsetX)
      }

      if (incomingRasters && offsetX !== 0) {
        const incomingOffset = offsetX > 0 ? offsetX - width : offsetX + width
        if (incomingRasters.left && layout.leftPage) {
          drawPageRaster(stageCtx, incomingRasters.left, layout.leftPage, incomingOffset, true, false)
        }
        if (incomingRasters.right && layout.rightPage) {
          drawPageRaster(stageCtx, incomingRasters.right, layout.rightPage, incomingOffset, false, true)
          drawBookSpineShadow(stageCtx, layout.leftPage, layout.rightPage, incomingOffset)
        }
      }
    } else if (layout.singlePage) {
      const singleRaster = rasterCache.get(layout.singlePage.pageNumber) || null
      drawPageRaster(stageCtx, singleRaster, layout.singlePage, offsetX, false, false)

      if (incomingRasters && incomingRasters.single && offsetX !== 0) {
        const incomingOffset = offsetX > 0 ? offsetX - width : offsetX + width
        drawPageRaster(stageCtx, incomingRasters.single, layout.singlePage, incomingOffset, false, false)
      }
    }
  }

  async function renderCurrentView() {
    if (!store.document) return

    isPreparing.value = true
    errorMessage.value = null

    try {
      pageLayout.value = computeLayout()

      if (pageLayout.value.isTwoPage) {
        const promises: Promise<PageRaster>[] = []
        if (pageLayout.value.leftPage) promises.push(getPageRaster(pageLayout.value.leftPage.pageNumber))
        if (pageLayout.value.rightPage) promises.push(getPageRaster(pageLayout.value.rightPage.pageNumber))
        await Promise.all(promises)
      } else if (pageLayout.value.singlePage) {
        await getPageRaster(pageLayout.value.singlePage.pageNumber)
      }

      pageLayout.value = computeLayout()
      drawScene(0)
      prefetchSurroundingPages(store.currentPage)
    } catch (err) {
      errorMessage.value = `Erro ao renderizar leitor: ${String(err)}`
    } finally {
      isPreparing.value = false
    }
  }

  async function requestTurn(direction: PageTurnDirection) {
    if (isTransitioning.value || !store.document) return

    const layout = pageLayout.value
    const step = layout.isTwoPage ? 2 : 1
    const targetPage = direction === 'next'
      ? Math.min(store.currentPage + step, store.totalPages)
      : Math.max(1, store.currentPage - step)

    if (targetPage === store.currentPage) return

    if (isAnimationDisabled.value || !hostRef.value) {
      store.goToPage(targetPage)
      return
    }

    isTransitioning.value = true

    try {
      let incomingRasters: { left?: PageRaster | null; right?: PageRaster | null; single?: PageRaster | null } = {}

      if (layout.isTwoPage) {
        const incomingLeftNum = targetPage % 2 === 0 ? Math.max(1, targetPage - 1) : targetPage
        const incomingRightNum = incomingLeftNum + 1 <= store.totalPages ? incomingLeftNum + 1 : 0

        const [leftR, rightR] = await Promise.all([
          getPageRaster(incomingLeftNum),
          incomingRightNum > 0 ? getPageRaster(incomingRightNum) : Promise.resolve(null),
        ])
        incomingRasters = { left: leftR, right: rightR }
      } else {
        const singleR = await getPageRaster(targetPage)
        incomingRasters = { single: singleR }
      }

      const hostWidth = hostRef.value?.clientWidth || 800
      const startTime = performance.now()

      await new Promise<void>((resolve) => {
        const animate = (time: number) => {
          const elapsed = time - startTime
          const progress = clamp(elapsed / TURN_DURATION_MS, 0, 1)
          const eased = easeOutCubic(progress)
          const currentOffset = direction === 'next' ? -eased * hostWidth : eased * hostWidth

          drawScene(currentOffset, incomingRasters)

          if (progress < 1) {
            animationFrame = requestAnimationFrame(animate)
          } else {
            resolve()
          }
        }
        animationFrame = requestAnimationFrame(animate)
      })

      store.goToPage(targetPage)
      pageLayout.value = computeLayout()
      drawScene(0)
    } finally {
      isTransitioning.value = false
      if (animationFrame) cancelAnimationFrame(animationFrame)
      drawScene(0)
    }
  }

  async function beginDrag(direction: PageTurnDirection, point: Point) {
    if (isTransitioning.value || !store.document) return

    isDragging = true
    dragStart = point
    dragLast = point
    dragDirection = direction
    currentDragOffsetX = 0

    const layout = pageLayout.value
    const step = layout.isTwoPage ? 2 : 1
    dragTargetPage = direction === 'next'
      ? Math.min(store.currentPage + step, store.totalPages)
      : Math.max(1, store.currentPage - step)

    if (dragTargetPage !== store.currentPage) {
      if (layout.isTwoPage) {
        const incomingLeftNum = dragTargetPage % 2 === 0 ? Math.max(1, dragTargetPage - 1) : dragTargetPage
        const incomingRightNum = incomingLeftNum + 1 <= store.totalPages ? incomingLeftNum + 1 : 0
        void getPageRaster(incomingLeftNum)
        if (incomingRightNum > 0) void getPageRaster(incomingRightNum)
      } else {
        void getPageRaster(dragTargetPage)
      }
    }
  }

  function updateDrag(point: Point) {
    if (!isDragging || !dragStart || !hostRef.value) return

    const deltaX = point.x - dragStart.x
    dragLast = point
    currentDragOffsetX = deltaX

    const layout = pageLayout.value
    let incomingRasters: { left?: PageRaster | null; right?: PageRaster | null; single?: PageRaster | null } = {}

    if (layout.isTwoPage) {
      const incomingLeftNum = dragTargetPage % 2 === 0 ? Math.max(1, dragTargetPage - 1) : dragTargetPage
      const incomingRightNum = incomingLeftNum + 1 <= store.totalPages ? incomingLeftNum + 1 : 0
      incomingRasters = {
        left: rasterCache.get(incomingLeftNum) || null,
        right: incomingRightNum > 0 ? (rasterCache.get(incomingRightNum) || null) : null,
      }
    } else {
      incomingRasters = {
        single: rasterCache.get(dragTargetPage) || null,
      }
    }

    drawScene(currentDragOffsetX, incomingRasters)
  }

  async function endDrag(point: Point) {
    if (!isDragging || !dragStart || !hostRef.value) return
    isDragging = false

    const width = hostRef.value.clientWidth || 800
    const deltaX = point.x - dragStart.x
    const timeDelta = Math.max(1, point.time - (dragLast?.time ?? dragStart.time))
    const velocity = Math.abs(deltaX) / timeDelta
    const progress = Math.abs(deltaX) / width

    const isCorrectDirection = (dragDirection === 'next' && deltaX < 0) || (dragDirection === 'previous' && deltaX > 0)
    const shouldCommit = isCorrectDirection && dragTargetPage !== store.currentPage && shouldCommitPageTurn(progress, velocity)

    if (shouldCommit) {
      await requestTurn(dragDirection)
    } else {
      const startOffset = currentDragOffsetX
      const startTime = performance.now()
      const snapDuration = 120

      await new Promise<void>((resolve) => {
        const snapAnim = (now: number) => {
          const elapsed = now - startTime
          const p = clamp(elapsed / snapDuration, 0, 1)
          const cur = startOffset * (1 - easeOutCubic(p))
          drawScene(cur)
          if (p < 1) {
            animationFrame = requestAnimationFrame(snapAnim)
          } else {
            resolve()
          }
        }
        animationFrame = requestAnimationFrame(snapAnim)
      })

      drawScene(0)
    }

    dragStart = null
    dragLast = null
    currentDragOffsetX = 0
  }

  function cancelDrag(_point?: Point) {
    if (!isDragging) return
    isDragging = false
    dragStart = null
    dragLast = null
    currentDragOffsetX = 0
    drawScene(0)
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      motionQuery.addEventListener('change', updateMotionPreference)
      updateMotionPreference()
    }

    const host = hostRef.value
    if (host) {
      stageCanvas = document.createElement('canvas')
      stageCanvas.className = 'page-2d-canvas'
      stageCanvas.style.display = 'block'
      stageCanvas.style.width = '100%'
      stageCanvas.style.height = '100%'
      stageCanvas.style.userSelect = 'none'

      stageCtx = stageCanvas.getContext('2d', { alpha: false })
      host.insertBefore(stageCanvas, host.firstChild)

      resizeObserver = new ResizeObserver(() => {
        resizeCanvasToHost()
      })
      resizeObserver.observe(host)

      resizeCanvasToHost()
      void renderCurrentView()
    }
  })

  onUnmounted(() => {
    if (animationFrame) cancelAnimationFrame(animationFrame)
    if (resizeObserver) resizeObserver.disconnect()
    if (motionQuery) motionQuery.removeEventListener('change', updateMotionPreference)

    if (stageCanvas && stageCanvas.parentNode) {
      stageCanvas.parentNode.removeChild(stageCanvas)
    }
    rasterCache.clear()
    pendingRasters.clear()
  })

  watch(
    [() => store.currentPage, () => store.document, () => store.isTwoPageMode, () => store.isGraphOpen],
    () => {
      void renderCurrentView()
    },
    { flush: 'post' },
  )

  function invalidateCacheAndRerender() {
    rasterCache.clear()
    pendingRasters.clear()
    void renderCurrentView()
  }

  watch(
    [() => store.fontSize, () => store.fontFamily, () => store.readerTheme],
    () => {
      blankRaster = null
      rasterCache.clear()
      pendingRasters.clear()
      void renderCurrentView()
    },
    { flush: 'post' },
  )

  return {
    isTransitioning: readonly(isTransitioning),
    isPreparing: readonly(isPreparing),
    errorMessage: readonly(errorMessage),
    pageLayout: readonly(pageLayout),
    requestTurn,
    beginDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    invalidateCacheAndRerender,
  }
}
