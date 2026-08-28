<template>
  <div
    ref="stageRef"
    class="page-curl-wrapper"
    :class="['theme-' + store.readerTheme, { 'page-curl-wrapper--dragging': isDragging }]"
    role="region"
    aria-label="Página do livro. Arraste as bordas para folhear ou selecione o texto com o mouse."
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
  >
    <div
      class="book-viewport-track"
      :style="{
        transform: `translate3d(${dragOffset}px, 0, 0)`,
        transition: isDragging ? 'none' : (isTransitioning ? `transform ${TURN_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)` : 'none'),
      }"
    >
      <!-- Spread Atual (Página Ativa) -->
      <div v-if="store.document" class="spread-container spread-container--current">
        <!-- Modo 2 Páginas: Página Esquerda -->
        <div
          v-if="pageLayout.isTwoPage && pageLayout.leftPage && pageLayout.leftPage.pageNumber > 0"
          class="page-sheet page-sheet--left"
          :style="{
            left: `${pageLayout.leftPage.left}px`,
            top: `${pageLayout.leftPage.top}px`,
            width: `${pageLayout.leftPage.width}px`,
            height: `${pageLayout.leftPage.height}px`,
          }"
        >
          <canvas
            v-if="store.document?.type === 'pdf'"
            ref="leftCanvasRef"
            class="page-pdf-canvas"
          />
          <div
            ref="leftTextLayerRef"
            class="page-text-layer page-text-layer--left"
          />
        </div>

        <!-- Modo 2 Páginas: Lombada Central -->
        <div
          v-if="pageLayout.isTwoPage && pageLayout.leftPage && pageLayout.rightPage && pageLayout.leftPage.pageNumber > 0 && pageLayout.rightPage.pageNumber > 0"
          class="book-spine-divider"
          :style="{
            left: `${pageLayout.leftPage.left + pageLayout.leftPage.width - 16}px`,
            top: `${pageLayout.leftPage.top}px`,
            width: '32px',
            height: `${pageLayout.leftPage.height}px`,
          }"
          aria-hidden="true"
        />

        <!-- Modo 2 Páginas: Página Direita -->
        <div
          v-if="pageLayout.isTwoPage && pageLayout.rightPage && pageLayout.rightPage.pageNumber > 0"
          class="page-sheet page-sheet--right"
          :style="{
            left: `${pageLayout.rightPage.left}px`,
            top: `${pageLayout.rightPage.top}px`,
            width: `${pageLayout.rightPage.width}px`,
            height: `${pageLayout.rightPage.height}px`,
          }"
        >
          <canvas
            v-if="store.document?.type === 'pdf'"
            ref="rightCanvasRef"
            class="page-pdf-canvas"
          />
          <div
            ref="rightTextLayerRef"
            class="page-text-layer page-text-layer--right"
          />
        </div>

        <!-- Modo 1 Página: Página Única Central -->
        <div
          v-if="!pageLayout.isTwoPage && pageLayout.singlePage && pageLayout.singlePage.pageNumber > 0"
          class="page-sheet page-sheet--single"
          :style="{
            left: `${pageLayout.singlePage.left}px`,
            top: `${pageLayout.singlePage.top}px`,
            width: `${pageLayout.singlePage.width}px`,
            height: `${pageLayout.singlePage.height}px`,
          }"
        >
          <canvas
            v-if="store.document?.type === 'pdf'"
            ref="singleCanvasRef"
            class="page-pdf-canvas"
          />
          <div
            ref="singleTextLayerRef"
            class="page-text-layer page-text-layer--single"
          />
        </div>
      </div>

      <!-- Spread Entrante (Durante Transição ou Arraste) -->
      <div
        v-if="store.document && incomingTargetPage > 0"
        class="spread-container spread-container--incoming"
        :style="{
          left: `${incomingSpreadOffsetX}px`,
        }"
      >
        <!-- Modo 2 Páginas Entrante: Página Esquerda -->
        <div
          v-if="pageLayout.isTwoPage && incomingLeftPageNumber > 0"
          class="page-sheet page-sheet--left"
          :style="{
            left: `${pageLayout.leftPage?.left || 0}px`,
            top: `${pageLayout.leftPage?.top || 0}px`,
            width: `${pageLayout.leftPage?.width || 0}px`,
            height: `${pageLayout.leftPage?.height || 0}px`,
          }"
        >
          <canvas
            v-if="store.document?.type === 'pdf'"
            ref="incomingLeftCanvasRef"
            class="page-pdf-canvas"
          />
          <div
            ref="incomingLeftTextLayerRef"
            class="page-text-layer page-text-layer--left"
          />
        </div>

        <!-- Modo 2 Páginas Entrante: Lombada Central -->
        <div
          v-if="pageLayout.isTwoPage && pageLayout.leftPage && incomingLeftPageNumber > 0 && incomingRightPageNumber > 0"
          class="book-spine-divider"
          :style="{
            left: `${pageLayout.leftPage.left + pageLayout.leftPage.width - 16}px`,
            top: `${pageLayout.leftPage.top}px`,
            width: '32px',
            height: `${pageLayout.leftPage.height}px`,
          }"
          aria-hidden="true"
        />

        <!-- Modo 2 Páginas Entrante: Página Direita -->
        <div
          v-if="pageLayout.isTwoPage && incomingRightPageNumber > 0"
          class="page-sheet page-sheet--right"
          :style="{
            left: `${pageLayout.rightPage?.left || 0}px`,
            top: `${pageLayout.rightPage?.top || 0}px`,
            width: `${pageLayout.rightPage?.width || 0}px`,
            height: `${pageLayout.rightPage?.height || 0}px`,
          }"
        >
          <canvas
            v-if="store.document?.type === 'pdf'"
            ref="incomingRightCanvasRef"
            class="page-pdf-canvas"
          />
          <div
            ref="incomingRightTextLayerRef"
            class="page-text-layer page-text-layer--right"
          />
        </div>

        <!-- Modo 1 Página Entrante: Página Única -->
        <div
          v-if="!pageLayout.isTwoPage && incomingSinglePageNumber > 0"
          class="page-sheet page-sheet--single"
          :style="{
            left: `${pageLayout.singlePage?.left || 0}px`,
            top: `${pageLayout.singlePage?.top || 0}px`,
            width: `${pageLayout.singlePage?.width || 0}px`,
            height: `${pageLayout.singlePage?.height || 0}px`,
          }"
        >
          <canvas
            v-if="store.document?.type === 'pdf'"
            ref="incomingSingleCanvasRef"
            class="page-pdf-canvas"
          />
          <div
            ref="incomingSingleTextLayerRef"
            class="page-text-layer page-text-layer--single"
          />
        </div>
      </div>
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
import { computed, nextTick, ref, watch } from 'vue'
import { useReaderStore } from '~/stores/readerStore'
import { TURN_DURATION_MS, useBookPageTurn, type PageTurnDirection } from '~/composables/reader/useBookPageTurn'

interface ReaderPointer {
  x: number
  y: number
  time: number
}

const store = useReaderStore()
const stageRef = ref<HTMLElement | null>(null)

// Refs de elementos do Spread Atual
const leftCanvasRef = ref<HTMLCanvasElement | null>(null)
const leftTextLayerRef = ref<HTMLElement | null>(null)
const rightCanvasRef = ref<HTMLCanvasElement | null>(null)
const rightTextLayerRef = ref<HTMLElement | null>(null)
const singleCanvasRef = ref<HTMLCanvasElement | null>(null)
const singleTextLayerRef = ref<HTMLElement | null>(null)

// Refs de elementos do Spread Entrante
const incomingLeftCanvasRef = ref<HTMLCanvasElement | null>(null)
const incomingLeftTextLayerRef = ref<HTMLElement | null>(null)
const incomingRightCanvasRef = ref<HTMLCanvasElement | null>(null)
const incomingRightTextLayerRef = ref<HTMLElement | null>(null)
const incomingSingleCanvasRef = ref<HTMLCanvasElement | null>(null)
const incomingSingleTextLayerRef = ref<HTMLElement | null>(null)

const {
  isTransitioning,
  isDragging,
  isPreparing,
  errorMessage,
  pageLayout,
  dragOffset,
  transitionDirection,
  incomingTargetPage,
  requestTurn,
  beginDrag,
  updateDrag,
  endDrag,
  cancelDrag,
} = useBookPageTurn(stageRef)

const emit = defineEmits<{
  'transition-state': [isTransitioning: boolean]
}>()

let activePointerId: number | null = null
let currentRenderVersion = 0

const incomingSpreadOffsetX = computed(() => {
  const hostWidth = stageRef.value?.clientWidth || 800
  return transitionDirection.value === 'next' ? hostWidth : -hostWidth
})

const incomingLeftPageNumber = computed(() => {
  if (incomingTargetPage.value <= 0) return 0
  return incomingTargetPage.value % 2 === 0
    ? Math.max(1, incomingTargetPage.value - 1)
    : incomingTargetPage.value
})

const incomingRightPageNumber = computed(() => {
  if (incomingTargetPage.value <= 0) return 0
  const left = incomingLeftPageNumber.value
  return left + 1 <= store.totalPages ? left + 1 : 0
})

const incomingSinglePageNumber = computed(() => {
  return incomingTargetPage.value > 0 ? incomingTargetPage.value : 0
})

function pointFrom(event: PointerEvent): ReaderPointer {
  const bounds = stageRef.value?.getBoundingClientRect()
  return {
    x: event.clientX - (bounds?.left ?? 0),
    y: event.clientY - (bounds?.top ?? 0),
    time: event.timeStamp,
  }
}

/**
 * Detecta se o pointerdown ocorreu na zona de foliação (bordas externas),
 * similar ao comportamento do Google Play Livros / Kindle.
 */
function getTurnZone(event: PointerEvent): PageTurnDirection | null {
  if (!stageRef.value) return null
  const bounds = stageRef.value.getBoundingClientRect()
  const x = event.clientX - bounds.left
  const layout = pageLayout.value

  const EDGE_MAX_PX = 56
  const EDGE_RATIO = 0.16

  if (layout.isTwoPage) {
    if (layout.leftPage) {
      const edgeWidth = Math.min(EDGE_MAX_PX, layout.leftPage.width * EDGE_RATIO)
      if (x <= layout.leftPage.left + edgeWidth) {
        return 'previous'
      }
    }
    if (layout.rightPage) {
      const edgeWidth = Math.min(EDGE_MAX_PX, layout.rightPage.width * EDGE_RATIO)
      if (x >= layout.rightPage.left + layout.rightPage.width - edgeWidth) {
        return 'next'
      }
    }
  } else if (layout.singlePage) {
    const edgeWidth = Math.min(EDGE_MAX_PX, layout.singlePage.width * EDGE_RATIO)
    if (x <= layout.singlePage.left + edgeWidth) {
      return 'previous'
    }
    if (x >= layout.singlePage.left + layout.singlePage.width - edgeWidth) {
      return 'next'
    }
  } else {
    const edgeWidth = Math.min(EDGE_MAX_PX, bounds.width * EDGE_RATIO)
    if (x <= edgeWidth) return 'previous'
    if (x >= bounds.width - edgeWidth) return 'next'
  }

  return null
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0 || !stageRef.value || isTransitioning.value) return

  const direction = getTurnZone(event)
  if (!direction) {
    // Clique/arrasto na área central de leitura -> permite seleção de texto livremente
    return
  }

  activePointerId = event.pointerId
  stageRef.value.setPointerCapture(event.pointerId)
  beginDrag(direction, pointFrom(event))
}

function onPointerMove(event: PointerEvent) {
  if (event.pointerId !== activePointerId) return
  event.preventDefault()
  updateDrag(pointFrom(event))
}

function onPointerUp(event: PointerEvent) {
  if (event.pointerId !== activePointerId) return
  stageRef.value?.releasePointerCapture(event.pointerId)
  activePointerId = null
  void endDrag(pointFrom(event))
}

function onPointerCancel(event: PointerEvent) {
  if (event.pointerId !== activePointerId) return
  activePointerId = null
  cancelDrag(pointFrom(event))
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
  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1

  if (doc.type === 'pdf') {
    if (canvasEl) {
      canvasEl.width = Math.round(width * dpr)
      canvasEl.height = Math.round(height * dpr)
      canvasEl.style.width = `${width}px`
      canvasEl.style.height = `${height}px`

      const ctx = canvasEl.getContext('2d', { alpha: false })
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale(dpr, dpr)
        const pageData = await doc.getPage(pageNumber, Math.round(width * dpr), Math.round(height * dpr))
        await pageData.render(ctx)
      }
    }
    if (textLayerEl && doc.renderTextLayer) {
      await doc.renderTextLayer(pageNumber, textLayerEl, width, height)
    }
  } else if (doc.type === 'epub') {
    if (textLayerEl && doc.renderTextLayer) {
      await doc.renderTextLayer(pageNumber, textLayerEl, width, height)
    }
  }
}

async function renderCurrentSpread() {
  const version = ++currentRenderVersion
  if (!store.document) return

  await nextTick()
  if (version !== currentRenderVersion) return

  const layout = pageLayout.value
  if (layout.isTwoPage) {
    if (layout.leftPage && layout.leftPage.pageNumber > 0) {
      void renderPageToElement(
        layout.leftPage.pageNumber,
        leftCanvasRef.value,
        leftTextLayerRef.value,
        layout.leftPage.width,
        layout.leftPage.height,
      )
    }
    if (layout.rightPage && layout.rightPage.pageNumber > 0) {
      void renderPageToElement(
        layout.rightPage.pageNumber,
        rightCanvasRef.value,
        rightTextLayerRef.value,
        layout.rightPage.width,
        layout.rightPage.height,
      )
    }
  } else if (layout.singlePage && layout.singlePage.pageNumber > 0) {
    void renderPageToElement(
      layout.singlePage.pageNumber,
      singleCanvasRef.value,
      singleTextLayerRef.value,
      layout.singlePage.width,
      layout.singlePage.height,
    )
  }
}

async function renderIncomingSpread() {
  if (!store.document || incomingTargetPage.value <= 0) return

  await nextTick()
  const layout = pageLayout.value

  if (layout.isTwoPage) {
    if (incomingLeftPageNumber.value > 0 && layout.leftPage) {
      void renderPageToElement(
        incomingLeftPageNumber.value,
        incomingLeftCanvasRef.value,
        incomingLeftTextLayerRef.value,
        layout.leftPage.width,
        layout.leftPage.height,
      )
    }
    if (incomingRightPageNumber.value > 0 && layout.rightPage) {
      void renderPageToElement(
        incomingRightPageNumber.value,
        incomingRightCanvasRef.value,
        incomingRightTextLayerRef.value,
        layout.rightPage.width,
        layout.rightPage.height,
      )
    }
  } else if (incomingSinglePageNumber.value > 0 && layout.singlePage) {
    void renderPageToElement(
      incomingSinglePageNumber.value,
      incomingSingleCanvasRef.value,
      incomingSingleTextLayerRef.value,
      layout.singlePage.width,
      layout.singlePage.height,
    )
  }
}

watch(isTransitioning, (value) => emit('transition-state', value), { immediate: true })

watch(
  [() => store.currentPage, () => store.document, () => pageLayout.value, () => store.fontSize, () => store.fontFamily],
  () => {
    void renderCurrentSpread()
  },
  { deep: true, flush: 'post' },
)

watch(
  incomingTargetPage,
  (val) => {
    if (val > 0) {
      void renderIncomingSpread()
    }
  },
  { flush: 'post' },
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

.book-viewport-track {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  will-change: transform;
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

.theme-sepia.page-curl-wrapper,
.theme-sepia .page-sheet {
  background-color: #f5eedc;
}
.theme-white.page-curl-wrapper,
.theme-white .page-sheet {
  background-color: #ffffff;
}
.theme-black.page-curl-wrapper,
.theme-black .page-sheet {
  background-color: #121214;
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

/* PDF.js Text Layer (Camada invisível sobre o Canvas PDF) */
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
  --min-font-size: 1;
  --text-scale-factor: calc(var(--total-scale-factor, var(--scale-factor, 1)) * var(--min-font-size));
  --min-font-size-inv: calc(1 / var(--min-font-size));
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
.page-text-layer :deep(::selection),
.page-text-layer ::selection,
.page-text-layer :deep(.textLayer ::selection) {
  background: rgba(229, 123, 85, 0.38) !important;
  color: transparent !important;
}

.page-text-layer :deep(.epub-text-layer-content *::selection) {
  background: rgba(229, 123, 85, 0.38) !important;
  color: inherit !important;
}

.page-text-layer :deep(br::selection) {
  background: transparent !important;
}

/* EPUB Native Typography Layer (Texto HTML 100% Vetorial e Nítido) */
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

/* Tipografia Estrutural de Livros (Títulos de Capítulos, Cabeçalhos e Parágrafos) */
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

.page-text-layer :deep(.epub-text-layer-content h3) {
  font-size: 1.25em !important;
  font-weight: 600 !important;
  line-height: 1.35 !important;
  margin-top: 0.7em !important;
  margin-bottom: 0.35em !important;
  display: block !important;
}

.page-text-layer :deep(.epub-text-layer-content h4) {
  font-size: 1.1em !important;
  font-weight: 600 !important;
  line-height: 1.4 !important;
  margin-top: 0.6em !important;
  margin-bottom: 0.3em !important;
  display: block !important;
}

.page-text-layer :deep(.epub-text-layer-content h5) {
  font-size: 1em !important;
  font-weight: 600 !important;
  margin-top: 0.55em !important;
  margin-bottom: 0.25em !important;
  display: block !important;
}

.page-text-layer :deep(.epub-text-layer-content h6) {
  font-size: 0.9em !important;
  font-weight: 600 !important;
  margin-top: 0.5em !important;
  margin-bottom: 0.2em !important;
  display: block !important;
}

.page-text-layer :deep(.epub-text-layer-content p) {
  margin-top: 0 !important;
  margin-bottom: 0.85em !important;
  line-height: 1.7 !important;
  text-align: justify !important;
  text-justify: inter-word !important;
}

.page-text-layer :deep(.epub-text-layer-content strong),
.page-text-layer :deep(.epub-text-layer-content b) {
  font-weight: 700 !important;
}

.page-text-layer :deep(.epub-text-layer-content em),
.page-text-layer :deep(.epub-text-layer-content i) {
  font-style: italic !important;
}

.page-text-layer :deep(.epub-text-layer-content blockquote) {
  margin: 1em 1.5em !important;
  padding-left: 1em !important;
  border-left: 2px solid rgba(0, 0, 0, 0.15) !important;
  font-style: italic !important;
}

.theme-black .page-text-layer :deep(.epub-text-layer-content blockquote) {
  border-left-color: rgba(255, 255, 255, 0.2) !important;
}

.page-text-layer :deep(.epub-text-layer-content hr) {
  margin: 1.5em auto !important;
  border: none !important;
  border-top: 1px solid rgba(0, 0, 0, 0.15) !important;
  width: 60% !important;
}

.theme-black .page-text-layer :deep(.epub-text-layer-content hr) {
  border-top-color: rgba(255, 255, 255, 0.15) !important;
}

.page-text-layer :deep(.epub-text-layer-content ul),
.page-text-layer :deep(.epub-text-layer-content ol) {
  margin: 0.75em 0 0.75em 1.5em !important;
  padding-left: 1em !important;
}

.page-text-layer :deep(.epub-text-layer-content li) {
  margin-bottom: 0.35em !important;
  line-height: 1.6 !important;
}

.page-text-layer :deep(.epub-text-layer-content sub) {
  font-size: 0.75em !important;
  vertical-align: sub !important;
}

.page-text-layer :deep(.epub-text-layer-content sup) {
  font-size: 0.75em !important;
  vertical-align: super !important;
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
