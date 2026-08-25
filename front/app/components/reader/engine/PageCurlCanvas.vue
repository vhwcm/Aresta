<template>
  <div
    ref="stageRef"
    class="page-curl-wrapper"
    :class="{ 'page-curl-wrapper--dragging': isTransitioning }"
    role="region"
    aria-label="Página do livro. Arraste as bordas para folhear ou selecione o texto com o mouse."
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
  >
    <!-- Camada de Texto Invisível (TextLayer Overlay) -->
    <div
      v-if="!isTransitioning && store.document"
      class="page-text-overlay-container"
      aria-hidden="false"
    >
      <!-- Modo 2 Páginas: Página Esquerda -->
      <div
        v-if="pageLayout.isTwoPage && pageLayout.leftPage && pageLayout.leftPage.pageNumber > 0"
        ref="leftTextLayerRef"
        class="page-text-layer page-text-layer--left"
        :style="{
          left: `${pageLayout.leftPage.left}px`,
          top: `${pageLayout.leftPage.top}px`,
          width: `${pageLayout.leftPage.width}px`,
          height: `${pageLayout.leftPage.height}px`,
        }"
      />

      <!-- Modo 2 Páginas: Página Direita -->
      <div
        v-if="pageLayout.isTwoPage && pageLayout.rightPage && pageLayout.rightPage.pageNumber > 0"
        ref="rightTextLayerRef"
        class="page-text-layer page-text-layer--right"
        :style="{
          left: `${pageLayout.rightPage.left}px`,
          top: `${pageLayout.rightPage.top}px`,
          width: `${pageLayout.rightPage.width}px`,
          height: `${pageLayout.rightPage.height}px`,
        }"
      />

      <!-- Modo 2 Páginas: Divisor Vertical de Lombada / Vinco Central -->
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

      <!-- Modo 1 Página: Página Única Central -->
      <div
        v-if="!pageLayout.isTwoPage && pageLayout.singlePage && pageLayout.singlePage.pageNumber > 0"
        ref="singleTextLayerRef"
        class="page-text-layer page-text-layer--single"
        :style="{
          left: `${pageLayout.singlePage.left}px`,
          top: `${pageLayout.singlePage.top}px`,
          width: `${pageLayout.singlePage.width}px`,
          height: `${pageLayout.singlePage.height}px`,
        }"
      />
    </div>

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
import { ref, watch, nextTick } from 'vue'
import { useReaderStore } from '~/stores/readerStore'
import { useBookPageTurn, type PageTurnDirection } from '~/composables/reader/useBookPageTurn'

interface ReaderPointer {
  x: number
  y: number
  time: number
}

const store = useReaderStore()
const stageRef = ref<HTMLElement | null>(null)
const leftTextLayerRef = ref<HTMLElement | null>(null)
const rightTextLayerRef = ref<HTMLElement | null>(null)
const singleTextLayerRef = ref<HTMLElement | null>(null)

const {
  isTransitioning,
  isPreparing,
  errorMessage,
  pageLayout,
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
let renderVersion = 0

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
  void beginDrag(direction, pointFrom(event))
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
  void cancelDrag(pointFrom(event))
}

async function renderTextLayers() {
  const currentRenderVersion = ++renderVersion
  if (isTransitioning.value || !store.document) return

  await nextTick()
  if (currentRenderVersion !== renderVersion) return

  const doc = store.document
  if (!doc.renderTextLayer) return

  const layout = pageLayout.value

  if (layout.isTwoPage) {
    if (leftTextLayerRef.value && layout.leftPage && layout.leftPage.pageNumber > 0) {
      void doc.renderTextLayer(
        layout.leftPage.pageNumber,
        leftTextLayerRef.value,
        layout.leftPage.width,
        layout.leftPage.height,
      )
    }
    if (rightTextLayerRef.value && layout.rightPage && layout.rightPage.pageNumber > 0) {
      void doc.renderTextLayer(
        layout.rightPage.pageNumber,
        rightTextLayerRef.value,
        layout.rightPage.width,
        layout.rightPage.height,
      )
    }
  } else {
    if (singleTextLayerRef.value && layout.singlePage && layout.singlePage.pageNumber > 0) {
      void doc.renderTextLayer(
        layout.singlePage.pageNumber,
        singleTextLayerRef.value,
        layout.singlePage.width,
        layout.singlePage.height,
      )
    }
  }
}

watch(isTransitioning, (value) => emit('transition-state', value), { immediate: true })

watch(
  [() => store.currentPage, () => store.document, () => pageLayout.value, isTransitioning],
  () => {
    void renderTextLayers()
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
}

.page-curl-wrapper--dragging {
  cursor: grabbing !important;
  user-select: none !important;
  -webkit-user-select: none !important;
}

.page-curl-wrapper :deep(.page-2d-canvas),
.page-curl-wrapper :deep(.page-curl-canvas) {
  display: block;
  width: 100%;
  height: 100%;
  outline: none;
}

.page-text-overlay-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}

.page-text-layer {
  position: absolute;
  overflow: hidden;
  pointer-events: auto;
  user-select: text;
  -webkit-user-select: text;
}

.page-text-layer--left {
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.45);
  border-left: 1px solid rgba(255, 255, 255, 0.04);
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.page-text-layer--right {
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.45);
  border-left: 1px solid rgba(0, 0, 0, 0.12);
  border-right: 1px solid rgba(255, 255, 255, 0.04);
}

.page-text-layer--single {
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.5);
  border-left: 1px solid rgba(255, 255, 255, 0.04);
  border-right: 1px solid rgba(255, 255, 255, 0.04);
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
  color: #1a1a1a !important;
}

.page-text-layer :deep(br::selection) {
  background: transparent !important;
}

/* EPUB Native Typography Layer (Texto HTML 100% Vetorial e Nítido) */
.page-text-layer :deep(.epub-text-layer-viewport) {
  background: #faf9f7;
  border-radius: 1px;
}

.page-text-layer :deep(.epub-text-layer-content) {
  color: #1a1a1a !important;
  user-select: text !important;
  -webkit-user-select: text !important;
  line-height: 1.75 !important;
  font-family: 'Newsreader', Georgia, 'Times New Roman', serif !important;
  -webkit-font-smoothing: antialiased !important;
  -moz-osx-font-smoothing: grayscale !important;
  text-rendering: optimizeLegibility !important;
}

.page-text-layer :deep(.epub-text-layer-content *) {
  color: #1a1a1a !important;
  line-height: 1.75 !important;
}

.page-text-layer :deep(.epub-text-layer-content h1),
.page-text-layer :deep(.epub-text-layer-content h2),
.page-text-layer :deep(.epub-text-layer-content h3),
.page-text-layer :deep(.epub-text-layer-content h4) {
  font-weight: 700 !important;
  margin-top: 0.2em !important;
  margin-bottom: 0.6em !important;
  line-height: 1.25 !important;
  color: #111111 !important;
}

.page-text-layer :deep(.epub-text-layer-content h1) {
  font-size: 2.2rem !important;
}

.page-text-layer :deep(.epub-text-layer-content h2) {
  font-size: 1.6rem !important;
}

.page-text-layer :deep(.epub-text-layer-content p) {
  margin-bottom: 1em !important;
  text-align: justify;
  text-justify: inter-word;
  hyphens: auto;
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
