import {
  ref,
  shallowRef,
  onMounted,
  onUnmounted,
  watch,
  readonly,
  type Ref,
} from 'vue'
import { useReaderStore } from '~/stores/readerStore'
import { usePageCurlEngine } from '~/composables/reader/usePageCurlEngine'
import { SNAP_THRESHOLD } from '~/composables/reader/constants'
import type { IBookDocument, PageData } from '~/interfaces/reader/IBookDocument'
import type { Point2D, CurlDirection } from '~/interfaces/reader/IPageCurlState'

export function useReaderCanvas(canvasRef: Ref<HTMLCanvasElement | null>) {
  const store = useReaderStore()
  const engine = usePageCurlEngine()

  const currentPageData = shallowRef<PageData | null>(null)
  const nextPageData = shallowRef<PageData | null>(null)
  const isRendering = ref(false)

  async function loadPage(pageNumber: number, doc: IBookDocument): Promise<PageData | null> {
    try {
      return await doc.getPage(pageNumber)
    } catch (error) {
      store.setError(`Erro ao carregar página ${pageNumber}: ${String(error)}`)
      return null
    }
  }

  async function renderCurrentToCtx(ctx: CanvasRenderingContext2D): Promise<void> {
    const page = currentPageData.value
    if (!page) return
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    await page.render(ctx)
  }

  async function renderNextToCtx(ctx: CanvasRenderingContext2D): Promise<void> {
    const page = nextPageData.value
    if (!page) {
      ctx.fillStyle = '#1a1a24'
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      return
    }
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    await page.render(ctx)
  }

  async function syncPages(doc: IBookDocument, currentPage: number) {
    isRendering.value = true
    const [current, next] = await Promise.all([
      loadPage(currentPage, doc),
      store.canGoNext ? loadPage(currentPage + 1, doc) : Promise.resolve(null),
    ])
    currentPageData.value = current
    nextPageData.value = next

    const canvas = canvasRef.value
    if (canvas && current) {
      canvas.width = current.width
      canvas.height = current.height
      const ctx = canvas.getContext('2d')
      if (ctx) await renderCurrentToCtx(ctx)
    }
    isRendering.value = false
  }

  watch(
    () => store.currentPage,
    async (newPage) => {
      if (store.document && canvasRef.value) {
        await syncPages(store.document, newPage)
        engine.bindCanvas(canvasRef.value, renderCurrentToCtx, renderNextToCtx)
      }
    },
  )

  watch(
    () => store.document,
    async (doc) => {
      if (doc) await syncPages(doc, store.currentPage)
    },
  )

  function getPointerPoint(event: MouseEvent | TouchEvent): Point2D {
    const canvas = canvasRef.value
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const touch = 'touches' in event ? event.touches[0] : null
    const clientX = touch ? touch.clientX : ('clientX' in event ? event.clientX : 0)
    const clientY = touch ? touch.clientY : ('clientY' in event ? event.clientY : 0)
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  function getCurlDirection(point: Point2D, canvas: HTMLCanvasElement): CurlDirection {
    return point.x > canvas.width / 2 ? 'right' : 'left'
  }

  function onPointerDown(event: MouseEvent | TouchEvent) {
    if (!canvasRef.value || !store.document) return
    const point = getPointerPoint(event)
    const direction = getCurlDirection(point, canvasRef.value)
    const targetPage = direction === 'right'
      ? store.currentPage + 1
      : store.currentPage - 1

    if (targetPage < 1 || targetPage > store.totalPages) return

    engine.startDrag(point, direction, targetPage)
    engine.bindCanvas(canvasRef.value, renderCurrentToCtx, renderNextToCtx)
  }

  function onPointerMove(event: MouseEvent | TouchEvent) {
    if (!engine.state.value.isDragging) return
    event.preventDefault()
    const point = getPointerPoint(event)
    engine.updateDrag(point)
  }

  async function onPointerUp() {
    if (!engine.state.value.isDragging) return
    const direction = engine.state.value.curlDirection
    const shouldFlip = engine.state.value.progress >= SNAP_THRESHOLD

    await engine.endDrag()

    if (shouldFlip) {
      if (direction === 'right') {
        store.nextPage()
      } else {
        store.prevPage()
      }
    }
  }

  onMounted(() => {
    const canvas = canvasRef.value
    if (!canvas) return

    canvas.addEventListener('mousedown', onPointerDown)
    canvas.addEventListener('touchstart', onPointerDown, { passive: false })
    window.addEventListener('mousemove', onPointerMove)
    window.addEventListener('touchmove', onPointerMove, { passive: false })
    window.addEventListener('mouseup', onPointerUp)
    window.addEventListener('touchend', onPointerUp)
  })

  onUnmounted(() => {
    const canvas = canvasRef.value
    if (canvas) {
      canvas.removeEventListener('mousedown', onPointerDown)
      canvas.removeEventListener('touchstart', onPointerDown)
    }
    window.removeEventListener('mousemove', onPointerMove)
    window.removeEventListener('touchmove', onPointerMove)
    window.removeEventListener('mouseup', onPointerUp)
    window.removeEventListener('touchend', onPointerUp)
  })

  return {
    isRendering: readonly(isRendering),
    curlState: engine.state,
    syncPages,
  }
}
