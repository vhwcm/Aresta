<template>
  <div
    ref="stageRef"
    class="page-curl-wrapper"
    :class="['theme-' + activeTheme, { 'page-curl-wrapper--dragging': isDragging }]"
    :style="{ backgroundColor: themeBgColor }"
    role="region"
    aria-label="Página do livro. Arraste as bordas para folhear ou selecione o texto com o mouse."
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
  >
    <div
      class="book-3d-stage"
      :style="{ backgroundColor: themeBgColor }"
    >
      <!-- ================= SPREAD DE BASE (PÁGINAS NATIVAS EM REPOUSO) ================= -->
      <div
        v-if="store.document"
        class="spread-container spread-container--base"
        :style="{ backgroundColor: themeBgColor }"
      >
        <!-- MODO 2 PÁGINAS -->
        <template v-if="pageLayout.isTwoPage">
          <!-- Página Esquerda Base -->
          <div
            v-if="pageLayout.leftPage && pageLayout.leftPage.pageNumber > 0"
            class="page-sheet page-sheet--left page-sheet--base"
            :style="{
              left: `${pageLayout.leftPage.left}px`,
              top: `${pageLayout.leftPage.top}px`,
              width: `${pageLayout.leftPage.width}px`,
              height: `${pageLayout.leftPage.height}px`,
            }"
          >
            <canvas
              v-if="store.document?.type === 'pdf'"
              ref="baseLeftCanvasRef"
              class="page-pdf-canvas"
            />
            <div
              ref="baseLeftTextLayerRef"
              class="page-text-layer page-text-layer--left"
            />
            <!-- Sombra suave projetada quando a folha gira sobre a esquerda -->
            <div
              class="page-underlying-shadow page-underlying-shadow--left"
              :style="{ opacity: isTurningPrev && is3DActive ? castShadowOpacity : 0 }"
            />
          </div>

          <!-- Lombada Central -->
          <div
            v-if="pageLayout.leftPage && pageLayout.rightPage && pageLayout.leftPage.pageNumber > 0 && pageLayout.rightPage.pageNumber > 0"
            class="book-spine-divider"
            :style="{
              left: `${pageLayout.leftPage.left + pageLayout.leftPage.width - 16}px`,
              top: `${pageLayout.leftPage.top}px`,
              width: '32px',
              height: `${pageLayout.leftPage.height}px`,
            }"
            aria-hidden="true"
          />

          <!-- Página Direita Base -->
          <div
            v-if="pageLayout.rightPage && pageLayout.rightPage.pageNumber > 0"
            class="page-sheet page-sheet--right page-sheet--base"
            :style="{
              left: `${pageLayout.rightPage.left}px`,
              top: `${pageLayout.rightPage.top}px`,
              width: `${pageLayout.rightPage.width}px`,
              height: `${pageLayout.rightPage.height}px`,
            }"
          >
            <canvas
              v-if="store.document?.type === 'pdf'"
              ref="baseRightCanvasRef"
              class="page-pdf-canvas"
            />
            <div
              ref="baseRightTextLayerRef"
              class="page-text-layer page-text-layer--right"
            />
            <!-- Sombra suave projetada quando a folha gira sobre a direita -->
            <div
              class="page-underlying-shadow page-underlying-shadow--right"
              :style="{ opacity: isTurningNext && is3DActive ? castShadowOpacity : 0 }"
            />
          </div>
        </template>

        <!-- MODO 1 PÁGINA (MOBILE) -->
        <template v-else-if="pageLayout.singlePage && pageLayout.singlePage.pageNumber > 0">
          <div
            class="page-sheet page-sheet--single page-sheet--base"
            :style="{
              left: `${pageLayout.singlePage.left}px`,
              top: `${pageLayout.singlePage.top}px`,
              width: `${pageLayout.singlePage.width}px`,
              height: `${pageLayout.singlePage.height}px`,
            }"
          >
            <canvas
              v-if="store.document?.type === 'pdf'"
              ref="baseSingleCanvasRef"
              class="page-pdf-canvas"
            />
            <div
              ref="baseSingleTextLayerRef"
              class="page-text-layer page-text-layer--single"
            />
            <div
              class="page-underlying-shadow"
              :style="{ opacity: is3DActive ? castShadowOpacity : 0 }"
            />
          </div>
        </template>
      </div>

      <!-- ================= WEBGL 3D REAL ENGINE CANVAS (MALHA CONTÍNUA KINDLE GRADE) ================= -->
      <canvas
        ref="webglCanvasRef"
        class="book-3d-webgl-canvas"
        :class="{ 'book-3d-webgl-canvas--active': is3DActive }"
        :style="webglCanvasStyle"
        aria-hidden="true"
      />
    </div>

    <!-- Indicador de Carregamento -->
    <div
      v-if="isPreparing"
      class="page-curl-loading"
      role="status"
      aria-label="Carregando página"
    >
      <div class="page-curl-loading__spinner" />
    </div>

    <p v-if="errorMessage" class="page-curl-error" role="alert">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useReaderStore } from '~/stores/readerStore'
import { useBookPageTurn, type PageTurnDirection, type PageLayoutInfo } from '~/composables/reader/useBookPageTurn'
import { usePagePhysics, type DragPoint } from '~/composables/reader/usePagePhysics'
import { usePageCurl3D } from '~/composables/reader/usePageCurl3D'

const emit = defineEmits<{
  (e: 'transition-state', isTransitioning: boolean): void
}>()

const store = useReaderStore()
const stageRef = ref<HTMLElement | null>(null)
const webglCanvasRef = ref<HTMLCanvasElement | null>(null)

const activeTheme = computed(() => store.readerTheme || 'sepia')
const themeBgColor = computed(() => {
  if (activeTheme.value === 'white') return '#ffffff'
  if (activeTheme.value === 'black') return '#121214'
  return '#f5eedc'
})

// Canvases e TextLayers da Camada Nativa Base (Estacionária)
const baseLeftCanvasRef = ref<HTMLCanvasElement | null>(null)
const baseLeftTextLayerRef = ref<HTMLElement | null>(null)
const baseRightCanvasRef = ref<HTMLCanvasElement | null>(null)
const baseRightTextLayerRef = ref<HTMLElement | null>(null)
const baseSingleCanvasRef = ref<HTMLCanvasElement | null>(null)
const baseSingleTextLayerRef = ref<HTMLElement | null>(null)

// Canvases Offscreen para Texturização WebGL
let frontOffscreenCanvas: HTMLCanvasElement | null = null
let backOffscreenCanvas: HTMLCanvasElement | null = null

// Engine Three.js 3D
const pageCurl3D = usePageCurl3D(webglCanvasRef)

const isPreparing = ref(false)
const errorMessage = ref<string | null>(null)
const is3DActive = ref(false)
const currentDirection = ref<PageTurnDirection>('next')

let activePointerId: number | null = null
let currentRenderVersion = 0

// Layout de Páginas
const {
  pageLayout,
  isTwoPageMode,
  updateLayout,
} = useBookPageTurn(stageRef)

// Física de Gestos
const physics = usePagePhysics({
  onProgress: (progress, gripY, deltaY) => {
    if (!is3DActive.value) return
    pageCurl3D.updateUniforms({
      progress,
      direction: currentDirection.value,
      gripY,
      pointerDeltaY: deltaY,
      theme: activeTheme.value as any,
    })
    pageCurl3D.render()
  },
  onComplete: async (direction) => {
    is3DActive.value = false
    emit('transition-state', false)

    if (direction === 'next') {
      const step = pageLayout.value.isTwoPage ? 2 : 1
      const target = Math.min(store.totalPages, store.currentPage + step)
      store.setCurrentPage(target)
    } else {
      const step = pageLayout.value.isTwoPage ? 2 : 1
      const target = Math.max(1, store.currentPage - step)
      store.setCurrentPage(target)
    }

    await renderCurrentSpread()
  },
  onCancel: async () => {
    is3DActive.value = false
    emit('transition-state', false)
    await renderCurrentSpread()
  },
})

const isDragging = computed(() => physics.isDragging.value)
const isTurningNext = computed(() => currentDirection.value === 'next')
const isTurningPrev = computed(() => currentDirection.value === 'previous')

const castShadowOpacity = computed(() => {
  const p = physics.progress.value
  return Math.sin(p * Math.PI) * 0.45
})

// Posicionamento do Canvas WebGL 3D sobreposto
const webglCanvasStyle = computed(() => {
  const layout = pageLayout.value
  const visible = is3DActive.value

  if (layout.isTwoPage) {
    const leftEdge = layout.leftPage?.left ?? 0
    const topEdge = layout.leftPage?.top ?? 0
    const totalW = (layout.leftPage?.width ?? 400) + (layout.rightPage?.width ?? 400)
    const totalH = layout.leftPage?.height ?? 600

    return {
      display: 'block',
      position: 'absolute',
      left: `${leftEdge}px`,
      top: `${topEdge}px`,
      width: `${totalW}px`,
      height: `${totalH}px`,
      zIndex: 40,
      opacity: visible ? 1 : 0,
      visibility: (visible ? 'visible' : 'hidden') as any,
      pointerEvents: 'none' as const,
    }
  }

  if (layout.singlePage) {
    return {
      display: 'block',
      position: 'absolute',
      left: `${layout.singlePage.left}px`,
      top: `${layout.singlePage.top}px`,
      width: `${layout.singlePage.width}px`,
      height: `${layout.singlePage.height}px`,
      zIndex: 40,
      opacity: visible ? 1 : 0,
      visibility: (visible ? 'visible' : 'hidden') as any,
      pointerEvents: 'none' as const,
    }
  }

  return {
    display: 'none',
  }
})

function getOrCreateOffscreenCanvas(name: 'front' | 'back'): HTMLCanvasElement {
  if (name === 'front') {
    if (!frontOffscreenCanvas) {
      frontOffscreenCanvas = document.createElement('canvas')
    }
    return frontOffscreenCanvas
  } else {
    if (!backOffscreenCanvas) {
      backOffscreenCanvas = document.createElement('canvas')
    }
    return backOffscreenCanvas
  }
}

async function renderPageToCanvas(pageNumber: number, targetCanvas: HTMLCanvasElement, width: number, height: number) {
  if (pageNumber <= 0 || !store.document || width <= 0 || height <= 0) return
  const doc = store.document
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1

  const renderW = Math.round(width * dpr)
  const renderH = Math.round(height * dpr)
  targetCanvas.width = renderW
  targetCanvas.height = renderH
  targetCanvas.style.width = `${width}px`
  targetCanvas.style.height = `${height}px`

  const ctx = targetCanvas.getContext('2d', { alpha: false })
  if (!ctx) return

  ctx.fillStyle = themeBgColor.value
  ctx.fillRect(0, 0, renderW, renderH)

  if (doc.type === 'pdf') {
    const pageData = await doc.getPage(pageNumber, renderW, renderH)
    await pageData.render(ctx)
  } else if (doc.type === 'epub') {
    const pageData = await doc.getPage(pageNumber, renderW, renderH)
    await pageData.render(ctx)
  }
}

async function renderPageToElement(
  pageNumber: number,
  canvasEl: HTMLCanvasElement | null,
  textLayerEl: HTMLElement | null,
  width: number,
  height: number,
) {
  if (pageNumber <= 0 || !store.document || width <= 0 || height <= 0) return
  const doc = store.document

  if (canvasEl) {
    await renderPageToCanvas(pageNumber, canvasEl, width, height)
  }

  if (textLayerEl && doc.renderTextLayer) {
    await doc.renderTextLayer(pageNumber, textLayerEl, width, height)
  }
}

async function renderCurrentSpread(pageOverride?: number) {
  const version = ++currentRenderVersion
  if (!store.document) return

  await nextTick()
  if (version !== currentRenderVersion) return

  const layout = pageLayout.value
  const curPage = pageOverride ?? store.currentPage

  if (layout.isTwoPage) {
    const leftNum = curPage % 2 === 0 ? Math.max(1, curPage - 1) : curPage
    const rightNum = leftNum + 1 <= store.totalPages ? leftNum + 1 : 0

    if (leftNum > 0 && layout.leftPage) {
      await renderPageToElement(
        leftNum,
        baseLeftCanvasRef.value,
        baseLeftTextLayerRef.value,
        layout.leftPage.width,
        layout.leftPage.height,
      )
    }
    if (rightNum > 0 && layout.rightPage) {
      await renderPageToElement(
        rightNum,
        baseRightCanvasRef.value,
        baseRightTextLayerRef.value,
        layout.rightPage.width,
        layout.rightPage.height,
      )
    }
  } else if (layout.singlePage && curPage > 0) {
    await renderPageToElement(
      curPage,
      baseSingleCanvasRef.value,
      baseSingleTextLayerRef.value,
      layout.singlePage.width,
      layout.singlePage.height,
    )
  }
}

/**
 * Prepara as texturas e o setup Three.js de forma instantânea
 */
async function prepare3DTextures(direction: PageTurnDirection, gripY = 0.5) {
  if (!store.document) return
  currentDirection.value = direction

  const layout = pageLayout.value
  const curPage = store.currentPage
  const total = store.totalPages

  const frontCanvas = getOrCreateOffscreenCanvas('front')
  const backCanvas = getOrCreateOffscreenCanvas('back')

  if (layout.isTwoPage) {
    const curLeft = curPage % 2 === 0 ? Math.max(1, curPage - 1) : curPage
    const curRight = curLeft + 1 <= total ? curLeft + 1 : 0

    const pageW = layout.rightPage?.width ?? 400
    const pageH = layout.rightPage?.height ?? 600

    if (direction === 'next') {
      const nextLeft = curRight + 1 <= total ? curRight + 1 : 0
      const nextRight = nextLeft + 1 <= total ? nextLeft + 1 : 0

      // Copia instantânea da frente a partir do canvas ativo para zero lag
      if (baseRightCanvasRef.value && baseRightCanvasRef.value.width > 0) {
        frontCanvas.width = baseRightCanvasRef.value.width
        frontCanvas.height = baseRightCanvasRef.value.height
        const fCtx = frontCanvas.getContext('2d')
        fCtx?.drawImage(baseRightCanvasRef.value, 0, 0)
      } else if (curRight > 0) {
        await renderPageToCanvas(curRight, frontCanvas, pageW, pageH)
      }

      // Verso: Próxima Página Esquerda
      if (nextLeft > 0) {
        await renderPageToCanvas(nextLeft, backCanvas, pageW, pageH)
      }

      // Inicializa a cena 3D e texturas
      pageCurl3D.setupScene({
        isTwoPage: true,
        pageWidth: pageW,
        pageHeight: pageH,
        direction: 'next',
      })
      pageCurl3D.setTextures(frontCanvas, backCanvas)
      pageCurl3D.updateUniforms({
        progress: 0.001,
        direction: 'next',
        gripY,
        pointerDeltaY: 0,
        theme: activeTheme.value as any,
      })
      pageCurl3D.render()

      // Base Direita Revelada: Renderiza em segundo plano a próxima página direita
      if (nextRight > 0 && layout.rightPage) {
        void renderPageToElement(nextRight, baseRightCanvasRef.value, baseRightTextLayerRef.value, pageW, pageH)
      }
    } else {
      // PREVIOUS
      const prevLeft = Math.max(1, curLeft - 2)
      const prevRight = prevLeft + 1 <= total ? prevLeft + 1 : 0

      // Copia instantânea da frente a partir da folha esquerda atual
      if (baseLeftCanvasRef.value && baseLeftCanvasRef.value.width > 0) {
        frontCanvas.width = baseLeftCanvasRef.value.width
        frontCanvas.height = baseLeftCanvasRef.value.height
        const fCtx = frontCanvas.getContext('2d')
        fCtx?.drawImage(baseLeftCanvasRef.value, 0, 0)
      } else if (curLeft > 0) {
        await renderPageToCanvas(curLeft, frontCanvas, pageW, pageH)
      }

      // Verso: Página Direita Anterior
      if (prevRight > 0) {
        await renderPageToCanvas(prevRight, backCanvas, pageW, pageH)
      }

      // Inicializa a cena 3D e texturas
      pageCurl3D.setupScene({
        isTwoPage: true,
        pageWidth: pageW,
        pageHeight: pageH,
        direction: 'previous',
      })
      pageCurl3D.setTextures(frontCanvas, backCanvas)
      pageCurl3D.updateUniforms({
        progress: 0.001,
        direction: 'previous',
        gripY,
        pointerDeltaY: 0,
        theme: activeTheme.value as any,
      })
      pageCurl3D.render()

      // Base Esquerda Revelada: Renderiza a página esquerda anterior
      if (prevLeft > 0 && layout.leftPage) {
        void renderPageToElement(prevLeft, baseLeftCanvasRef.value, baseLeftTextLayerRef.value, pageW, pageH)
      }
    }
  } else if (layout.singlePage) {
    const pageW = layout.singlePage.width
    const pageH = layout.singlePage.height

    if (baseSingleCanvasRef.value && baseSingleCanvasRef.value.width > 0) {
      frontCanvas.width = baseSingleCanvasRef.value.width
      frontCanvas.height = baseSingleCanvasRef.value.height
      const fCtx = frontCanvas.getContext('2d')
      fCtx?.drawImage(baseSingleCanvasRef.value, 0, 0)
    } else {
      await renderPageToCanvas(curPage, frontCanvas, pageW, pageH)
    }

    if (direction === 'next') {
      const nextPage = Math.min(total, curPage + 1)
      if (nextPage > 0) {
        await renderPageToCanvas(nextPage, backCanvas, pageW, pageH)
        void renderPageToElement(nextPage, baseSingleCanvasRef.value, baseSingleTextLayerRef.value, pageW, pageH)
      }
    } else {
      const prevPage = Math.max(1, curPage - 1)
      if (prevPage > 0) {
        await renderPageToCanvas(prevPage, backCanvas, pageW, pageH)
        void renderPageToElement(prevPage, baseSingleCanvasRef.value, baseSingleTextLayerRef.value, pageW, pageH)
      }
    }

    pageCurl3D.setupScene({
      isTwoPage: false,
      pageWidth: pageW,
      pageHeight: pageH,
      direction,
    })
    pageCurl3D.setTextures(frontCanvas, backCanvas)
    pageCurl3D.updateUniforms({
      progress: 0.001,
      direction,
      gripY,
      pointerDeltaY: 0,
      theme: activeTheme.value as any,
    })
    pageCurl3D.render()
  }
}

function pointFrom(event: PointerEvent): DragPoint {
  const bounds = stageRef.value?.getBoundingClientRect()
  return {
    x: event.clientX - (bounds?.left ?? 0),
    y: event.clientY - (bounds?.top ?? 0),
    time: event.timeStamp || performance.now(),
  }
}

function getTurnZone(event: PointerEvent): PageTurnDirection | null {
  if (!stageRef.value) return null
  const bounds = stageRef.value.getBoundingClientRect()
  const x = event.clientX - bounds.left
  const y = event.clientY - bounds.top
  const layout = pageLayout.value

  if (layout.isTwoPage) {
    if (layout.leftPage && layout.rightPage) {
      const spineX = layout.leftPage.left + layout.leftPage.width
      // Clique ou arraste à esquerda da lombada = previous
      if (x < spineX) return 'previous'
      // Clique ou arraste à direita da lombada = next
      if (x >= spineX) return 'next'
    }
  } else if (layout.singlePage) {
    const midX = layout.singlePage.left + layout.singlePage.width * 0.5
    if (x < midX) return 'previous'
    if (x >= midX) return 'next'
  } else {
    if (x < bounds.width * 0.5) return 'previous'
    if (x >= bounds.width * 0.5) return 'next'
  }

  return null
}

async function onPointerDown(event: PointerEvent) {
  if (event.button !== 0 || !stageRef.value || physics.isAnimating.value) return

  const direction = getTurnZone(event)
  if (!direction) return

  // Validação de limites
  if (direction === 'next' && store.currentPage >= store.totalPages) return
  if (direction === 'previous' && store.currentPage <= 1) return

  activePointerId = event.pointerId
  stageRef.value.setPointerCapture(event.pointerId)

  const pt = pointFrom(event)
  const layout = pageLayout.value
  const targetPageRect = layout.isTwoPage
    ? (direction === 'next' ? layout.rightPage : layout.leftPage)
    : layout.singlePage

  const w = targetPageRect?.width || 400
  const h = targetPageRect?.height || 600
  const relY = targetPageRect ? (pt.y - targetPageRect.top) / h : 0.5

  await prepare3DTextures(direction, relY)
  is3DActive.value = true
  emit('transition-state', true)

  physics.startDrag(pt, direction, w, h, relY)
}

function onPointerMove(event: PointerEvent) {
  if (event.pointerId !== activePointerId) return
  event.preventDefault()
  physics.updateDrag(pointFrom(event))
}

function onPointerUp(event: PointerEvent) {
  if (event.pointerId !== activePointerId) return
  stageRef.value?.releasePointerCapture(event.pointerId)
  activePointerId = null
  physics.endDrag(pointFrom(event))
}

function onPointerCancel(event: PointerEvent) {
  if (event.pointerId !== activePointerId) return
  activePointerId = null
  physics.cancelDrag()
}

async function requestTurn(direction: PageTurnDirection) {
  if (physics.isAnimating.value || !store.document) return
  if (direction === 'next' && store.currentPage >= store.totalPages) return
  if (direction === 'previous' && store.currentPage <= 1) return

  const layout = pageLayout.value
  const targetPageRect = layout.isTwoPage
    ? (direction === 'next' ? layout.rightPage : layout.leftPage)
    : layout.singlePage

  const w = targetPageRect?.width || 400
  const h = targetPageRect?.height || 600

  await prepare3DTextures(direction, 0.5)
  is3DActive.value = true
  emit('transition-state', true)

  physics.triggerTurn(direction, w, h, 0.5)
}

onMounted(() => {
  const layout = pageLayout.value
  const w = layout.rightPage?.width || layout.singlePage?.width || 400
  const h = layout.rightPage?.height || layout.singlePage?.height || 600
  pageCurl3D.setupScene({
    isTwoPage: layout.isTwoPage,
    pageWidth: w,
    pageHeight: h,
    direction: 'next',
  })
})

onUnmounted(() => {
  physics.destroy()
  pageCurl3D.destroy()
})

watch(
  [() => store.currentPage, () => store.document, () => pageLayout.value, () => store.fontSize, () => store.fontFamily, () => store.readerTheme],
  () => {
    void renderCurrentSpread()
  },
  { deep: true, flush: 'post' },
)

defineExpose({
  next: () => requestTurn('next'),
  previous: () => requestTurn('previous'),
})
</script>

<style scoped>
.page-curl-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: pan-y;
  user-select: text;
  -webkit-user-select: text;
  overflow: hidden;
}

.page-curl-wrapper--dragging {
  cursor: grabbing !important;
  user-select: none !important;
  -webkit-user-select: none !important;
}

.book-3d-stage {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.spread-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.page-sheet {
  position: absolute;
  pointer-events: auto;
  overflow: hidden;
  user-select: text;
  -webkit-user-select: text;
  box-sizing: border-box;
}

.page-sheet--base {
  z-index: 10;
}

.book-3d-webgl-canvas {
  position: absolute;
  pointer-events: none;
  z-index: 40;
  transition: opacity 0.05s ease-out;
}

.book-3d-webgl-canvas--active {
  opacity: 1 !important;
  visibility: visible !important;
}

.page-underlying-shadow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  transition: opacity 0.15s ease-out;
  z-index: 20;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.12) 35%, transparent 100%);
  mix-blend-mode: multiply;
}

.page-underlying-shadow--left {
  background: linear-gradient(to left, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.12) 35%, transparent 100%);
}

.theme-black .page-underlying-shadow {
  background: linear-gradient(to right, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.3) 35%, transparent 100%);
}

.theme-black .page-underlying-shadow--left {
  background: linear-gradient(to left, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.3) 35%, transparent 100%);
}

.theme-sepia .page-curl-wrapper,
.theme-sepia .book-3d-stage,
.theme-sepia .spread-container,
.theme-sepia .page-sheet {
  background-color: #f5eedc !important;
}

.theme-white .page-curl-wrapper,
.theme-white .book-3d-stage,
.theme-white .spread-container,
.theme-white .page-sheet {
  background-color: #ffffff !important;
}

.theme-black .page-curl-wrapper,
.theme-black .book-3d-stage,
.theme-black .spread-container,
.theme-black .page-sheet {
  background-color: #121214 !important;
}

.page-sheet--left {
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.45);
  border-left: 1px solid rgba(255, 255, 255, 0.04);
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.page-sheet--right {
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.45);
  border-left: 1px solid rgba(0, 0, 0, 0.12);
  border-right: 1px solid rgba(255, 255, 255, 0.04);
}

.page-sheet--single {
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.5);
  border-left: 1px solid rgba(255, 255, 255, 0.04);
  border-right: 1px solid rgba(255, 255, 255, 0.04);
}

.theme-sepia .page-sheet--left,
.theme-sepia .page-sheet--right,
.theme-sepia .page-sheet--single {
  box-shadow: 0 4px 20px rgba(60, 45, 20, 0.16);
  border-left-color: rgba(140, 110, 70, 0.2);
  border-right-color: rgba(140, 110, 70, 0.2);
}

.theme-white .page-sheet--left,
.theme-white .page-sheet--right,
.theme-white .page-sheet--single {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-left-color: rgba(0, 0, 0, 0.08);
  border-right-color: rgba(0, 0, 0, 0.08);
}

.page-pdf-canvas {
  position: absolute;
  inset: 0;
  display: block;
  pointer-events: none;
  width: 100%;
  height: 100%;
}

.theme-sepia .page-pdf-canvas {
  mix-blend-mode: multiply;
  filter: sepia(0.18) brightness(0.98);
}

.theme-black .page-pdf-canvas {
  filter: invert(0.92) hue-rotate(180deg) brightness(0.95) contrast(1.05);
}

.page-text-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: auto;
  user-select: text;
  -webkit-user-select: text;
}

.book-spine-divider {
  position: absolute;
  pointer-events: none;
  z-index: 15;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.06) 35%,
    rgba(0, 0, 0, 0.22) 50%,
    rgba(0, 0, 0, 0.06) 65%,
    rgba(0, 0, 0, 0) 100%
  );
}

/* PDF.js Text Layer */
.page-text-layer.textLayer,
.page-text-layer :deep(.textLayer) {
  position: absolute;
  overflow: hidden;
  line-height: 1;
  text-size-adjust: none;
  -webkit-text-size-adjust: none;
  forced-color-adjust: none;
  transform-origin: 0 0;
  user-select: text;
  -webkit-user-select: text;
  cursor: text;
  mix-blend-mode: multiply;
  --min-font-size: 1;
  --text-scale-factor: calc(var(--total-scale-factor, var(--scale-factor, 1)) * var(--min-font-size));
  --min-font-size-inv: calc(1 / var(--min-font-size));
}

.theme-black .page-text-layer.textLayer,
.theme-black .page-text-layer :deep(.textLayer) {
  mix-blend-mode: screen;
}

.page-text-layer :deep(.textLayer span),
.page-text-layer :deep(.textLayer span[role="presentation"]),
.page-text-layer :deep(.textLayer br) {
  color: transparent !important;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
}

.page-text-layer :deep(.textLayer > :not(.markedContent)),
.page-text-layer :deep(.textLayer .markedContent span:not(.markedContent)) {
  --font-height: 0;
  font-size: calc(var(--text-scale-factor) * var(--font-height));
  --scale-x: 1;
  --rotate: 0deg;
  transform: rotate(var(--rotate)) scaleX(var(--scale-x)) scale(var(--min-font-size-inv));
}

.page-text-layer :deep(.textLayer .markedContent) {
  display: contents;
}

/* Seleção de Texto nos Documentos */
.page-text-layer.textLayer ::selection,
.page-text-layer.textLayer *::selection,
.page-text-layer :deep(.textLayer span::selection),
.page-text-layer :deep(.textLayer ::selection),
.page-text-layer :deep(.textLayer *::selection) {
  background: rgba(229, 123, 85, 0.35) !important;
  color: transparent !important;
}

/* EPUB Native Typography Layer */
.page-text-layer :deep(.epub-text-layer-content),
.page-text-layer :deep(.epub-text-layer-content *),
.page-text-layer :deep(.epub-text-layer-viewport),
.page-text-layer :deep(.epub-text-layer-viewport *) {
  user-select: text !important;
  -webkit-user-select: text !important;
  pointer-events: auto !important;
  cursor: text !important;
}

.page-text-layer :deep(.epub-text-layer-viewport ::selection),
.page-text-layer :deep(.epub-text-layer-viewport *::selection),
.page-text-layer :deep(.epub-text-layer-content ::selection),
.page-text-layer :deep(.epub-text-layer-content *::selection),
.page-text-layer :deep(.epub-text-layer-content::selection) {
  background: rgba(229, 123, 85, 0.3) !important;
  color: #1a1a1a !important;
}

.theme-sepia .page-text-layer :deep(.epub-text-layer-viewport ::selection),
.theme-sepia .page-text-layer :deep(.epub-text-layer-viewport *::selection),
.theme-sepia .page-text-layer :deep(.epub-text-layer-content ::selection),
.theme-sepia .page-text-layer :deep(.epub-text-layer-content *::selection),
.theme-sepia .page-text-layer :deep(.epub-text-layer-content::selection) {
  background: rgba(229, 123, 85, 0.3) !important;
  color: #2a2521 !important;
}

.theme-white .page-text-layer :deep(.epub-text-layer-viewport ::selection),
.theme-white .page-text-layer :deep(.epub-text-layer-viewport *::selection),
.theme-white .page-text-layer :deep(.epub-text-layer-content ::selection),
.theme-white .page-text-layer :deep(.epub-text-layer-content *::selection),
.theme-white .page-text-layer :deep(.epub-text-layer-content::selection) {
  background: rgba(229, 123, 85, 0.3) !important;
  color: #1a1a1a !important;
}

.theme-black .page-text-layer :deep(.epub-text-layer-viewport ::selection),
.theme-black .page-text-layer :deep(.epub-text-layer-viewport *::selection),
.theme-black .page-text-layer :deep(.epub-text-layer-content ::selection),
.theme-black .page-text-layer :deep(.epub-text-layer-content *::selection),
.theme-black .page-text-layer :deep(.epub-text-layer-content::selection) {
  background: rgba(229, 123, 85, 0.45) !important;
  color: #ffffff !important;
}

.page-text-layer :deep(br::selection) {
  background: transparent !important;
}

.page-text-layer :deep(.epub-text-layer-viewport) {
  background: transparent;
  border-radius: 1px;
}

.theme-sepia .page-text-layer :deep(.epub-text-layer-viewport) {
  background: #f5eedc;
}

.theme-white .page-text-layer :deep(.epub-text-layer-viewport) {
  background: #ffffff;
}

.theme-black .page-text-layer :deep(.epub-text-layer-viewport) {
  background: #121214;
}

.page-text-layer :deep(.epub-text-layer-content) {
  color: #1a1a1a !important;
  user-select: text !important;
  -webkit-user-select: text !important;
  line-height: 1.7 !important;
  -webkit-font-smoothing: antialiased !important;
  -moz-osx-font-smoothing: grayscale !important;
  text-rendering: optimizeLegibility !important;
}

.theme-sepia .page-text-layer :deep(.epub-text-layer-content),
.theme-sepia .page-text-layer :deep(.epub-text-layer-content *) {
  color: #2a2521 !important;
}

.theme-white .page-text-layer :deep(.epub-text-layer-content),
.theme-white .page-text-layer :deep(.epub-text-layer-content *) {
  color: #1a1a1a !important;
}

.theme-black .page-text-layer :deep(.epub-text-layer-content),
.theme-black .page-text-layer :deep(.epub-text-layer-content *) {
  color: #e4e4e7 !important;
}

.page-text-layer :deep(.epub-text-layer-content h1),
.page-text-layer :deep(.epub-text-layer-content .chapter-title),
.page-text-layer :deep(.epub-text-layer-content .title),
.page-text-layer :deep(.epub-text-layer-content [class*="title"]) {
  font-size: 2em !important;
  font-weight: 700 !important;
  line-height: 1.25 !important;
  margin-top: 0.8em !important;
  margin-bottom: 0.5em !important;
  display: block !important;
}

.page-text-layer :deep(.epub-text-layer-content h2),
.page-text-layer :deep(.epub-text-layer-content .chapter-subtitle),
.page-text-layer :deep(.epub-text-layer-content .subtitle),
.page-text-layer :deep(.epub-text-layer-content [class*="subtitle"]) {
  font-size: 1.5em !important;
  font-weight: 700 !important;
  line-height: 1.3 !important;
  margin-top: 0.75em !important;
  margin-bottom: 0.4em !important;
  display: block !important;
}

.page-text-layer :deep(.epub-text-layer-content p) {
  margin-top: 0 !important;
  margin-bottom: 0.85em !important;
  line-height: 1.7 !important;
  text-align: justify !important;
  text-justify: inter-word !important;
}

.page-curl-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.page-curl-loading__spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(229, 123, 85, 0.2);
  border-top-color: var(--color-accent, #E57B55);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.page-curl-error {
  position: absolute;
  bottom: 1rem;
  max-width: min(90%, 560px);
  margin: 0;
  padding: 0.65rem 0.85rem;
  border: 1px solid rgba(247, 106, 106, 0.4);
  background: rgba(35, 14, 18, 0.92);
  color: #fecaca;
  font-size: 0.8rem;
  text-align: center;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
