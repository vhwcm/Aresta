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
        <template v-if="renderedLayout.isTwoPage">
          <!-- Pilha de Páginas Lidas (Borda Esquerda) -->
          <div
            v-if="pageCreaseEnabled && pageAnimationEnabled && pageStackDepth.leftWidth > 0 && renderedLayout.leftPage && renderedLayout.leftPage.pageNumber > 0"
            class="book-page-stack book-page-stack--left"
            :style="{
              left: `${renderedLayout.leftPage.left - pageStackDepth.leftWidth}px`,
              top: `${renderedLayout.leftPage.top}px`,
              width: `${pageStackDepth.leftWidth}px`,
              height: `${renderedLayout.leftPage.height}px`,
            }"
            @click.stop="requestTurn('previous')"
            :title="`Páginas lidas (${store.currentPage - 1} de ${store.totalPages} páginas - Voltar)`"
            role="button"
            tabindex="0"
            aria-label="Páginas já lidas. Clique para voltar página"
          />

          <!-- Página Esquerda Base -->
          <div
            v-if="renderedLayout.leftPage && renderedLayout.leftPage.pageNumber > 0"
            :class="[
              'page-sheet',
              'page-sheet--left',
              'page-sheet--base',
              { 'page-sheet--pdf': store.document?.type === 'pdf' },
            ]"
            :style="{
              left: `${renderedLayout.leftPage.left}px`,
              top: `${renderedLayout.leftPage.top}px`,
              width: `${renderedLayout.leftPage.width}px`,
              height: `${renderedLayout.leftPage.height}px`,
              backgroundColor: store.document?.type === 'pdf' ? '#ffffff' : undefined,
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
              @click="handleHighlightClick"
            />
            <!-- Máscara de Modo de Foco na Folha Esquerda -->
            <ReaderFocusOverlay
              v-if="store.isFocusMode && focusPageSide === 'left'"
              :top="focusBoundsLeft.top"
              :height="focusBoundsLeft.height"
              :bottom="focusBoundsLeft.bottom"
              @advance="handleFocusAdvance"
            />
            <ReaderFocusOverlay
              v-else-if="store.isFocusMode && focusPageSide === 'right'"
              :top="0"
              :height="0"
              :bottom="0"
              @advance="handleFocusAdvance"
            />
            <!-- Sombra suave projetada quando a folha gira sobre a esquerda -->
            <div
              class="page-underlying-shadow page-underlying-shadow--left"
              :style="{ opacity: isTurningPrev && is3DActive ? castShadowOpacity : 0 }"
            />
          </div>

          <!-- Página Direita Base -->
          <div
            v-if="renderedLayout.rightPage && renderedLayout.rightPage.pageNumber > 0"
            :class="[
              'page-sheet',
              'page-sheet--right',
              'page-sheet--base',
              { 'page-sheet--pdf': store.document?.type === 'pdf' },
            ]"
            :style="{
              left: `${renderedLayout.rightPage.left}px`,
              top: `${renderedLayout.rightPage.top}px`,
              width: `${renderedLayout.rightPage.width}px`,
              height: `${renderedLayout.rightPage.height}px`,
              backgroundColor: store.document?.type === 'pdf' ? '#ffffff' : undefined,
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
              @click="handleHighlightClick"
            />
            <!-- Máscara de Modo de Foco na Folha Direita -->
            <ReaderFocusOverlay
              v-if="store.isFocusMode && focusPageSide === 'right'"
              :top="focusBoundsRight.top"
              :height="focusBoundsRight.height"
              :bottom="focusBoundsRight.bottom"
              @advance="handleFocusAdvance"
            />
            <ReaderFocusOverlay
              v-else-if="store.isFocusMode && focusPageSide === 'left'"
              :top="0"
              :height="0"
              :bottom="0"
              @advance="handleFocusAdvance"
            />
            <!-- Sombra suave projetada quando a folha gira sobre a direita -->
            <div
              class="page-underlying-shadow page-underlying-shadow--right"
              :style="{ opacity: isTurningNext && is3DActive ? castShadowOpacity : 0 }"
            />
          </div>

          <!-- Pilha de Páginas Restantes (Borda Direita) -->
          <div
            v-if="pageCreaseEnabled && pageAnimationEnabled && pageStackDepth.rightWidth > 0 && renderedLayout.rightPage && renderedLayout.rightPage.pageNumber > 0"
            class="book-page-stack book-page-stack--right"
            :style="{
              left: `${renderedLayout.rightPage.left + renderedLayout.rightPage.width}px`,
              top: `${renderedLayout.rightPage.top}px`,
              width: `${pageStackDepth.rightWidth}px`,
              height: `${renderedLayout.rightPage.height}px`,
            }"
            @click.stop="requestTurn('next')"
            :title="`Páginas restantes (${store.totalPages - store.currentPage} de ${store.totalPages} páginas - Avançar)`"
            role="button"
            tabindex="0"
            aria-label="Páginas restantes a ler. Clique para avançar página"
          />
        </template>

        <!-- MODO 1 PÁGINA (DESKTOP/TABLET / MOBILE) -->
        <template v-else-if="renderedLayout.singlePage && renderedLayout.singlePage.pageNumber > 0">
          <!-- Pilha de Páginas Lidas (Borda Esquerda no Modo 1 Página) -->
          <div
            v-if="pageCreaseEnabled && pageAnimationEnabled && pageStackDepth.leftWidth > 0"
            class="book-page-stack book-page-stack--left"
            :style="{
              left: `${renderedLayout.singlePage.left - pageStackDepth.leftWidth}px`,
              top: `${renderedLayout.singlePage.top}px`,
              width: `${pageStackDepth.leftWidth}px`,
              height: `${renderedLayout.singlePage.height}px`,
            }"
            @click.stop="requestTurn('previous')"
            :title="`Páginas lidas (${store.currentPage - 1} de ${store.totalPages} páginas - Voltar)`"
            role="button"
            tabindex="0"
            aria-label="Páginas já lidas. Clique para voltar página"
          />

          <div
            :class="[
              'page-sheet',
              'page-sheet--single',
              'page-sheet--base',
              { 'page-sheet--pdf': store.document?.type === 'pdf' },
            ]"
            :style="{
              left: `${renderedLayout.singlePage.left}px`,
              top: `${renderedLayout.singlePage.top}px`,
              width: `${renderedLayout.singlePage.width}px`,
              height: `${renderedLayout.singlePage.height}px`,
              backgroundColor: store.document?.type === 'pdf' ? '#ffffff' : undefined,
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
              @click="handleHighlightClick"
            />
            <!-- Máscara de Modo de Foco na Folha Única -->
            <ReaderFocusOverlay
              v-if="store.isFocusMode"
              :top="focusBoundsSingle.top"
              :height="focusBoundsSingle.height"
              :bottom="focusBoundsSingle.bottom"
              @advance="handleFocusAdvance"
            />
            <div
              class="page-underlying-shadow"
              :style="{ opacity: is3DActive ? castShadowOpacity : 0 }"
            />
          </div>

          <!-- Pilha de Páginas Restantes (Borda Direita no Modo 1 Página) -->
          <div
            v-if="pageCreaseEnabled && pageAnimationEnabled && pageStackDepth.rightWidth > 0"
            class="book-page-stack book-page-stack--right"
            :style="{
              left: `${renderedLayout.singlePage.left + renderedLayout.singlePage.width}px`,
              top: `${renderedLayout.singlePage.top}px`,
              width: `${pageStackDepth.rightWidth}px`,
              height: `${renderedLayout.singlePage.height}px`,
            }"
            @click.stop="requestTurn('next')"
            :title="`Páginas restantes (${store.totalPages - store.currentPage} de ${store.totalPages} páginas - Avançar)`"
            role="button"
            tabindex="0"
            aria-label="Páginas restantes a ler. Clique para avançar página"
          />
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

      <!-- Contêiner offscreen com layout ativo para medição e rasterização fiel do verso -->
      <div
        ref="offscreenPageRef"
        class="page-text-layer page-text-layer--offscreen"
        style="position: fixed; left: 0; top: 0; opacity: 0.001; pointer-events: none; z-index: -9999; overflow: hidden;"
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
import { useSettings } from '~/composables/useSettings'
import { useBookPageTurn, type PageLayoutInfo } from '~/composables/reader/useBookPageTurn'
import { usePagePhysics } from '~/composables/reader/usePagePhysics'
import { usePageCurl3D, BLEED_X, BLEED_Y } from '~/composables/reader/usePageCurl3D'
import { DRAG_ACTIVATION_THRESHOLD_PX } from '~/composables/reader/constants'
import { rasterizeElementToCanvas, drawPlainTextToCanvas, applyThemeToCanvas } from '~/utils/pageRasterizer'
import type { PageTurnDirection, DragPoint } from '~/interfaces/reader/types'
import { useAnnotations } from '~/composables/useAnnotations'
import { applyPageHighlights } from '~/utils/readerHighlight'
import { useReaderFocus } from '~/composables/reader/useReaderFocus'
import ReaderFocusOverlay from '~/components/reader/ReaderFocusOverlay.vue'

const emit = defineEmits<{
  (_e: 'transition-state', _isTransitioning: boolean): void
  (_e: 'select-annotation', _annotationId: number): void
}>()

const store = useReaderStore()
const { annotations } = useAnnotations()
const { pageCreaseEnabled, pageAnimationEnabled } = useSettings()
const stageRef = ref<HTMLElement | null>(null)
const webglCanvasRef = ref<HTMLCanvasElement | null>(null)

const MAX_STACK_PX = 14

const pageStackDepth = computed(() => {
  if (
    !store.document ||
    store.totalPages <= 1 ||
    !pageCreaseEnabled.value ||
    !pageAnimationEnabled.value
  ) {
    return { leftWidth: 0, rightWidth: 0, leftLines: 0, rightLines: 0 }
  }

  const total = store.totalPages
  const current = store.currentPage

  // Fator de escala suave para documentos com poucas páginas
  const maxAllowed = Math.min(MAX_STACK_PX, Math.max(4, Math.round((total / 25) * MAX_STACK_PX)))

  const progress = Math.max(0, Math.min(1, (current - 1) / Math.max(1, total - 1)))
  const remaining = 1 - progress

  const leftWidth = Math.round(progress * maxAllowed)
  const rightWidth = Math.round(remaining * maxAllowed)

  const leftLines = Math.min(6, Math.round(progress * 6))
  const rightLines = Math.min(6, Math.round(remaining * 6))

  return { leftWidth, rightWidth, leftLines, rightLines }
})

const activeTheme = computed(() => store.readerTheme || 'sepia')
const themeBgColor = computed(() => {
  if (activeTheme.value === 'white') return '#f8f9fa'
  if (activeTheme.value === 'black') return '#0c0c0e'
  return '#f5eedc'
})

// Canvases e TextLayers da Camada Nativa Base (Estacionária)
const baseLeftCanvasRef = ref<HTMLCanvasElement | null>(null)
const baseLeftTextLayerRef = ref<HTMLElement | null>(null)
const baseRightCanvasRef = ref<HTMLCanvasElement | null>(null)
const baseRightTextLayerRef = ref<HTMLElement | null>(null)
const baseSingleCanvasRef = ref<HTMLCanvasElement | null>(null)
const baseSingleTextLayerRef = ref<HTMLElement | null>(null)
const offscreenPageRef = ref<HTMLElement | null>(null)

// ================= MODO DE FOCO (LEITURA POR LINHAS) =================
const focusPageSide = ref<'left' | 'right'>('left')

const focusSingle = useReaderFocus({
  containerRef: baseSingleTextLayerRef,
  onNextPage: () => requestTurn('next'),
  onPrevPage: () => requestTurn('previous'),
})

const focusLeft = useReaderFocus({
  containerRef: baseLeftTextLayerRef,
  onNextPage: () => {
    focusPageSide.value = 'right'
    store.setFocusBlockIndex(0)
    focusRight.refreshLines(baseRightTextLayerRef.value)
  },
  onPrevPage: () => requestTurn('previous'),
})

const focusRight = useReaderFocus({
  containerRef: baseRightTextLayerRef,
  onNextPage: () => {
    focusPageSide.value = 'left'
    store.setFocusBlockIndex(0)
    void requestTurn('next')
  },
  onPrevPage: () => {
    focusPageSide.value = 'left'
    const leftLineCount = focusLeft.lines.value.length
    store.setFocusBlockIndex(Math.max(0, leftLineCount - store.focusLineCount))
  },
})

const focusBoundsSingle = computed(() => focusSingle.focusBounds.value)
const focusBoundsLeft = computed(() => focusLeft.focusBounds.value)
const focusBoundsRight = computed(() => focusRight.focusBounds.value)

function refreshFocusLines() {
  if (pageLayout.value.isTwoPage) {
    if (baseLeftTextLayerRef.value) focusLeft.refreshLines(baseLeftTextLayerRef.value)
    if (baseRightTextLayerRef.value) focusRight.refreshLines(baseRightTextLayerRef.value)
  } else {
    if (baseSingleTextLayerRef.value) focusSingle.refreshLines(baseSingleTextLayerRef.value)
  }
}

function handleFocusAdvance() {
  void focusNext()
}

async function focusNext(): Promise<{ transitionedPage: boolean }> {
  if (pageLayout.value.isTwoPage) {
    if (focusPageSide.value === 'left') {
      return await focusLeft.nextBlock()
    } else {
      return await focusRight.nextBlock()
    }
  } else {
    return await focusSingle.nextBlock()
  }
}

async function focusPrev(): Promise<{ transitionedPage: boolean }> {
  if (pageLayout.value.isTwoPage) {
    if (focusPageSide.value === 'right') {
      return await focusRight.prevBlock()
    } else {
      return await focusLeft.prevBlock()
    }
  } else {
    return await focusSingle.prevBlock()
  }
}

const focusProgressLabel = computed(() => {
  if (pageLayout.value.isTwoPage) {
    return focusPageSide.value === 'left'
      ? `Esq: ${focusLeft.progressLabel.value}`
      : `Dir: ${focusRight.progressLabel.value}`
  }
  return focusSingle.progressLabel.value
})

// Canvases Offscreen para Texturização WebGL
let frontOffscreenCanvas: HTMLCanvasElement | null = null
let backOffscreenCanvas: HTMLCanvasElement | null = null
let offscreenRenderQueue: Promise<void> = Promise.resolve()
let dragActivationToken = 0
let texturePreparationVersion = 0

// Engine Three.js 3D
const pageCurl3D = usePageCurl3D(webglCanvasRef)

const isPreparing = ref(false)
const errorMessage = ref<string | null>(null)
const is3DActive = ref(false)
const currentDirection = ref<PageTurnDirection>('next')
const animationLayout = ref<PageLayoutInfo | null>(null)
const renderedLayout = computed(() => (
  is3DActive.value && animationLayout.value ? animationLayout.value : pageLayout.value
))

function snapshotLayout(layout: PageLayoutInfo): PageLayoutInfo {
  return {
    isTwoPage: layout.isTwoPage,
    leftPage: layout.leftPage ? { ...layout.leftPage } : null,
    rightPage: layout.rightPage ? { ...layout.rightPage } : null,
    singlePage: layout.singlePage ? { ...layout.singlePage } : null,
  }
}

let activePointerId: number | null = null
let currentRenderVersion = 0

// P1: Estado de arraste pendente — ativa virada 3D somente após limiar de deslocamento
interface PendingDrag {
  pointerId: number
  direction: PageTurnDirection
  startPoint: DragPoint
  relY: number
  pageWidth: number
  pageHeight: number
  isTextTarget?: boolean
  isPageStackTarget?: boolean
}
let pendingDrag: PendingDrag | null = null

// P3: Fila de virada pendente (máx. 1) para cliques rápidos em sequência
let pendingTurnDirection: PageTurnDirection | null = null
let lastTurnTriggerTime = 0

// Layout de Páginas
const { pageLayout } = useBookPageTurn(stageRef)

// P5: Calcula a página de destino real considerando modo 1 ou 2 páginas
function getTargetPage(direction: PageTurnDirection): number {
  const layout = pageLayout.value
  if (!layout.isTwoPage) {
    return direction === 'next'
      ? Math.min(store.currentPage + 1, store.totalPages)
      : Math.max(1, store.currentPage - 1)
  }
  const curLeft = store.currentPage % 2 !== 0 ? store.currentPage : store.currentPage - 1
  return direction === 'next'
    ? Math.min(curLeft + 2, store.totalPages)
    : Math.max(1, curLeft - 2)
}

// Física de Gestos
const physics = usePagePhysics({
  onProgress: (progress) => {
    if (!is3DActive.value) return
    pageCurl3D.updateUniforms({
      progress,
      direction: currentDirection.value,
      isTwoPage: pageLayout.value.isTwoPage,
      gripY: 0.5,
      pointerDeltaY: 0,
      theme: activeTheme.value as any,
    })
    pageCurl3D.render()
  },
  onComplete: async (direction) => {
    const targetPage = getTargetPage(direction)
    if (targetPage !== store.currentPage) {
      store.goToPage(targetPage)
    }

    // 1. Renderiza a página 2D definitiva por baixo PRIMEIRO
    await renderCurrentSpread()
    await nextTick()

    // 2. Só agora oculta a folha 3D, garantindo continuidade perfeita sem flash de cor
    is3DActive.value = false
    animationLayout.value = null
    emit('transition-state', false)
    lastTurnTriggerTime = performance.now()

    // P3: Processa virada pendente da fila (cliques rápidos em sequência)
    if (pendingTurnDirection !== null) {
      const queued = pendingTurnDirection
      pendingTurnDirection = null
      void requestTurn(queued)
    }
  },
  onCancel: async () => {
    await renderCurrentSpread()
    await nextTick()
    is3DActive.value = false
    animationLayout.value = null
    emit('transition-state', false)
    lastTurnTriggerTime = performance.now()

    // P3: Processa virada pendente da fila mesmo após cancelamento
    if (pendingTurnDirection !== null) {
      const queued = pendingTurnDirection
      pendingTurnDirection = null
      void requestTurn(queued)
    }
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
  const layout = is3DActive.value && animationLayout.value
    ? animationLayout.value
    : pageLayout.value
  const visible = is3DActive.value

  if (layout.isTwoPage) {
    const pageW = layout.rightPage?.width ?? layout.leftPage?.width ?? 400
    const pageH = layout.rightPage?.height ?? layout.leftPage?.height ?? 600
    const leftEdge = layout.leftPage?.left ?? ((layout.rightPage?.left ?? 0) - pageW)
    const topEdge = layout.leftPage?.top ?? layout.rightPage?.top ?? 0
    const totalW = pageW * 2
    const totalH = pageH

    return {
      display: 'block',
      position: 'absolute' as const,
      left: `${leftEdge - BLEED_X}px`,
      top: `${topEdge - BLEED_Y}px`,
      width: `${totalW + BLEED_X * 2}px`,
      height: `${totalH + BLEED_Y * 2}px`,
      zIndex: 40,
      opacity: visible ? 1 : 0,
      visibility: (visible ? 'visible' : 'hidden') as any,
      pointerEvents: 'none' as const,
    }
  }

  if (layout.singlePage) {
    const pageW = layout.singlePage.width
    const pageH = layout.singlePage.height
    const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 767 : false
    const borderRadius = isMobile ? 0 : 6

    return {
      display: 'block',
      position: 'absolute' as const,
      left: `${layout.singlePage.left - pageW - BLEED_X}px`,
      top: `${layout.singlePage.top - BLEED_Y}px`,
      width: `${pageW * 2 + BLEED_X * 2}px`,
      height: `${pageH + BLEED_Y * 2}px`,
      zIndex: 40,
      opacity: visible ? 1 : 0,
      visibility: (visible ? 'visible' : 'hidden') as any,
      pointerEvents: 'none' as const,
      clipPath: `inset(${BLEED_Y}px ${BLEED_X}px ${BLEED_Y}px ${pageW + BLEED_X}px round ${borderRadius}px)`,
      WebkitClipPath: `inset(${BLEED_Y}px ${BLEED_X}px ${BLEED_Y}px ${pageW + BLEED_X}px round ${borderRadius}px)`,
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
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 4) : 1

  const renderW = Math.round(width * dpr)
  const renderH = Math.round(height * dpr)
  targetCanvas.width = renderW
  targetCanvas.height = renderH
  targetCanvas.style.width = `${width}px`
  targetCanvas.style.height = `${height}px`

  const ctx = targetCanvas.getContext('2d', { alpha: false })
  if (!ctx) return

  // Para PDF, o fundo da folha e o conteúdo são estritamente naturais (#ffffff), sem sofrer alteração de cor pelo tema
  const isPdf = doc.type === 'pdf'
  ctx.fillStyle = isPdf ? '#ffffff' : themeBgColor.value
  ctx.fillRect(0, 0, renderW, renderH)

  if (typeof (doc as any).getPage === 'function') {
    try {
      const pageData = await (doc as any).getPage(pageNumber, width, height)
      await pageData.render(ctx)
    } catch {
      // fallback gracioso se render falhar
    }
  }
}

async function renderPageToCanvasTexture(
  pageNumber: number,
  targetCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  visibleSourceEl?: HTMLElement | null,
  pdfCanvas?: HTMLCanvasElement | null,
): Promise<void> {
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 4) : 1
  const renderW = Math.round(width * dpr)
  const renderH = Math.round(height * dpr)

  targetCanvas.width = renderW
  targetCanvas.height = renderH
  targetCanvas.style.width = `${width}px`
  targetCanvas.style.height = `${height}px`

  const ctx = targetCanvas.getContext('2d')
  if (!ctx) return

  const doc = store.document
  const isPdf = doc?.type === 'pdf'
  const theme = activeTheme.value as any

  // Texturas de PDF sempre utilizam fundo limpo branco sem tonalização
  ctx.fillStyle = isPdf ? '#ffffff' : themeBgColor.value
  ctx.fillRect(0, 0, renderW, renderH)

  if (pageNumber <= 0 || !doc || width <= 0 || height <= 0) {
    return
  }

  // 1. PDF: Canvas nativo GPU ou renderização vetorial do PDF.js (sem alteração de tema)
  if (doc.type === 'pdf') {
    if (pdfCanvas && pdfCanvas.width > 0 && pdfCanvas.height > 0) {
      try {
        ctx.drawImage(pdfCanvas, 0, 0, renderW, renderH)
        return
      } catch {
        // continua para renderização vetorial do PDF
      }
    }

    if (typeof (doc as any).getPage === 'function') {
      try {
        const pageData = await (doc as any).getPage(pageNumber, width, height)
        await pageData.render(ctx)
        return
      } catch {
        // continua para fallback de texto se getPage falhar
      }
    }
  }

  // 2. Se houver elemento visível no DOM com filhos (frente da página já visível na tela)
  if (visibleSourceEl && visibleSourceEl.children.length > 0) {
    const drawn = rasterizeElementToCanvas(
      visibleSourceEl,
      targetCanvas,
      width,
      height,
      theme,
      pdfCanvas,
    )
    if (drawn) return
  }

  // 3. Renderização offscreen fiel do verso ou página não visível via doc.renderTextLayer
  if ((doc.type === 'epub' || doc.type === 'didactic') && typeof doc.renderTextLayer === 'function') {
    if (offscreenPageRef.value) {
      const previousRender = offscreenRenderQueue
      let releaseRender!: () => void
      offscreenRenderQueue = new Promise<void>((resolve) => {
        releaseRender = resolve
      })
      await previousRender
      try {
        offscreenPageRef.value.style.width = `${width}px`
        offscreenPageRef.value.style.height = `${height}px`
        await doc.renderTextLayer(pageNumber, offscreenPageRef.value, width, height)
        const drawn = rasterizeElementToCanvas(
          offscreenPageRef.value,
          targetCanvas,
          width,
          height,
          theme,
        )
        offscreenPageRef.value.innerHTML = ''
        if (drawn) return
      } catch {
        // continua para fallback se renderTextLayer falhar
      } finally {
        releaseRender()
      }
    }
  }

  // 4. Fallback com texto puro extraído do documento para a página específica
  if (typeof doc.getTextContent === 'function') {
    try {
      const pageText = await doc.getTextContent(pageNumber)
      if (pageText && pageText.trim()) {
        drawPlainTextToCanvas(
          targetCanvas,
          pageText,
          width,
          height,
          theme,
          { fontSize: store.fontSize, fontFamily: store.fontFamily },
        )
        return
      }
    } catch {
      // fallback silencioso se getTextContent falhar
    }
  }
}

async function prewarm3DTextures(direction: PageTurnDirection = 'next'): Promise<void> {
  if (!store.document) return
  const layout = pageLayout.value
  const curPage = store.currentPage
  const total = store.totalPages
  const frontCanvas = getOrCreateOffscreenCanvas('front')
  const backCanvas = getOrCreateOffscreenCanvas('back')

  if (layout.isTwoPage) {
    const curLeft = curPage % 2 !== 0 ? curPage : Math.max(1, curPage - 1)
    const curRight = curLeft + 1 <= total ? curLeft + 1 : 0
    const pageW = layout.rightPage?.width ?? layout.leftPage?.width ?? 400
    const pageH = layout.rightPage?.height ?? layout.leftPage?.height ?? 600

    if (direction === 'next') {
      const frontPageNum = curRight > 0 ? curRight : curLeft
      const backPageNum = curLeft + 2 <= total ? curLeft + 2 : 0

      await Promise.all([
        renderPageToCanvasTexture(frontPageNum, frontCanvas, pageW, pageH, baseRightTextLayerRef.value, baseRightCanvasRef.value),
        renderPageToCanvasTexture(backPageNum, backCanvas, pageW, pageH),
      ])
    } else {
      const frontPageNum = curLeft
      const backPageNum = curLeft - 1 >= 1 ? curLeft - 1 : 0

      await Promise.all([
        renderPageToCanvasTexture(frontPageNum, frontCanvas, pageW, pageH, baseLeftTextLayerRef.value, baseLeftCanvasRef.value),
        renderPageToCanvasTexture(backPageNum, backCanvas, pageW, pageH),
      ])
    }

    pageCurl3D.setTextures(frontCanvas, backCanvas)
  } else if (layout.singlePage) {
    const pageW = layout.singlePage.width
    const pageH = layout.singlePage.height

    if (direction === 'next') {
      const frontPageNum = curPage
      const backPageNum = curPage + 1 <= total ? curPage + 1 : 0

      await Promise.all([
        renderPageToCanvasTexture(frontPageNum, frontCanvas, pageW, pageH, baseSingleTextLayerRef.value, baseSingleCanvasRef.value),
        renderPageToCanvasTexture(backPageNum, backCanvas, pageW, pageH),
      ])
    } else {
      const frontPageNum = curPage
      const backPageNum = curPage - 1 >= 1 ? curPage - 1 : 0

      await Promise.all([
        renderPageToCanvasTexture(frontPageNum, frontCanvas, pageW, pageH, baseSingleTextLayerRef.value, baseSingleCanvasRef.value),
        renderPageToCanvasTexture(backPageNum, backCanvas, pageW, pageH),
      ])
    }

    pageCurl3D.setTextures(frontCanvas, backCanvas)
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

  if (canvasEl && doc.type === 'pdf') {
    await renderPageToCanvas(pageNumber, canvasEl, width, height)
  }

  if (textLayerEl && doc.renderTextLayer) {
    await doc.renderTextLayer(pageNumber, textLayerEl, width, height)
    applyPageHighlights(textLayerEl, pageNumber, annotations.value, store.bookId)
  }
}

function refreshCurrentHighlights() {
  if (!store.document) return
  const layout = pageLayout.value
  const curPage = store.currentPage
  const bId = store.bookId

  if (layout.isTwoPage) {
    const leftNum = curPage % 2 !== 0 ? curPage : curPage - 1
    const rightNum = leftNum + 1 <= store.totalPages ? leftNum + 1 : 0
    if (baseLeftTextLayerRef.value && leftNum > 0) {
      applyPageHighlights(baseLeftTextLayerRef.value, leftNum, annotations.value, bId)
    }
    if (baseRightTextLayerRef.value && rightNum > 0) {
      applyPageHighlights(baseRightTextLayerRef.value, rightNum, annotations.value, bId)
    }
  } else if (baseSingleTextLayerRef.value && curPage > 0) {
    applyPageHighlights(baseSingleTextLayerRef.value, curPage, annotations.value, bId)
  }
}

function handleHighlightClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  const mark = target?.closest('mark.reader-highlight')
  if (mark) {
    const annId = mark.getAttribute('data-annotation-id')
    if (annId) {
      emit('select-annotation', Number(annId))
    }
  }
}

async function renderCurrentSpread(pageOverride?: number): Promise<void> {
  const version = ++currentRenderVersion
  if (!store.document) return

  await nextTick()
  if (version !== currentRenderVersion) return

  const layout = pageLayout.value
  const curPage = pageOverride ?? store.currentPage

  if (layout.isTwoPage) {
    const leftNum = curPage % 2 !== 0 ? curPage : curPage - 1
    const rightNum = leftNum + 1 <= store.totalPages ? leftNum + 1 : 0

    const renders: Promise<void>[] = []
    if (leftNum > 0 && layout.leftPage) {
      renders.push(
        renderPageToElement(
          leftNum,
          baseLeftCanvasRef.value,
          baseLeftTextLayerRef.value,
          layout.leftPage.width,
          layout.leftPage.height,
        ),
      )
    }
    if (rightNum > 0 && layout.rightPage) {
      renders.push(
        renderPageToElement(
          rightNum,
          baseRightCanvasRef.value,
          baseRightTextLayerRef.value,
          layout.rightPage.width,
          layout.rightPage.height,
        ),
      )
    }
    await Promise.all(renders)
  } else if (layout.singlePage && curPage > 0) {
    await renderPageToElement(
      curPage,
      baseSingleCanvasRef.value,
      baseSingleTextLayerRef.value,
      layout.singlePage.width,
      layout.singlePage.height,
    )
  }

  refreshFocusLines()
  void prewarm3DTextures('next')
}

/**
 * Prepara as texturas e o setup Three.js de forma instantânea e robusta com texto garantido
 */
async function prepare3DTextures(direction: PageTurnDirection, gripY = 0.5): Promise<void> {
  if (!store.document) return
  const preparationVersion = ++texturePreparationVersion
  currentDirection.value = direction

  const layout = pageLayout.value
  const total = store.totalPages
  const current = store.currentPage
  const isTwoPage = layout.isTwoPage
  const pageW = isTwoPage
    ? (layout.rightPage?.width ?? layout.leftPage?.width ?? 400)
    : (layout.singlePage?.width ?? 400)
  const pageH = isTwoPage
    ? (layout.rightPage?.height ?? layout.leftPage?.height ?? 600)
    : (layout.singlePage?.height ?? 600)
  const frontCanvas = getOrCreateOffscreenCanvas('front')
  const backCanvas = getOrCreateOffscreenCanvas('back')

  const left = current % 2 !== 0 ? current : Math.max(1, current - 1)
  const frontPage = isTwoPage
    ? (direction === 'next' ? Math.min(left + 1, total) : left)
    : current
  const backPage = isTwoPage
    ? (direction === 'next' ? left + 2 : left - 1)
    : (direction === 'next' ? current + 1 : current - 1)
  const boundedBackPage = backPage >= 1 && backPage <= total ? backPage : 0
  const sourceText = isTwoPage
    ? (direction === 'next' ? baseRightTextLayerRef.value : baseLeftTextLayerRef.value)
    : baseSingleTextLayerRef.value
  const sourceCanvas = isTwoPage
    ? (direction === 'next' ? baseRightCanvasRef.value : baseLeftCanvasRef.value)
    : baseSingleCanvasRef.value

  // Entrega as duas faces ao WebGL como um par. Antes, cada face era atualizada
  // de forma independente e alguns frames combinavam páginas de viradas distintas.
  await Promise.all([
    renderPageToCanvasTexture(frontPage, frontCanvas, pageW, pageH, sourceText, sourceCanvas),
    renderPageToCanvasTexture(boundedBackPage, backCanvas, pageW, pageH),
  ])
  if (preparationVersion !== texturePreparationVersion || !store.document) return

  pageCurl3D.setupScene({
    isTwoPage,
    pageWidth: pageW,
    pageHeight: pageH,
    direction,
    bleedX: BLEED_X,
    bleedY: BLEED_Y,
  })
  pageCurl3D.setTextures(frontCanvas, backCanvas)
  pageCurl3D.updateUniforms({
    progress: 0,
    direction,
    isTwoPage,
    gripY,
    pointerDeltaY: 0,
    theme: activeTheme.value as any,
  })
  pageCurl3D.render()

  // Ativa a camada 3D opaca em progress = 0 PRIMEIRO, cobrindo a página visível
  // com a textura idêntica antes que o DOM subjacente seja modificado.
  is3DActive.value = true
  emit('transition-state', true)
  await nextTick()

  // Atualiza a página base subjacente por baixo da folha 3D já visível para que, ao descolar da mesa,
  // a folha revele a página seguinte/anterior correta sem duplicidade ou faixas de corte
  if (isTwoPage) {
    if (direction === 'next') {
      const incomingRight = left + 3 <= total ? left + 3 : 0
      if (incomingRight > 0 && layout.rightPage) {
        void renderPageToElement(
          incomingRight,
          baseRightCanvasRef.value,
          baseRightTextLayerRef.value,
          layout.rightPage.width,
          layout.rightPage.height,
        )
      }
    } else {
      const incomingLeft = left - 2 >= 1 ? left - 2 : 0
      if (incomingLeft > 0 && layout.leftPage) {
        void renderPageToElement(
          incomingLeft,
          baseLeftCanvasRef.value,
          baseLeftTextLayerRef.value,
          layout.leftPage.width,
          layout.leftPage.height,
        )
      }
    }
  } else if (layout.singlePage) {
    const incomingSingle = direction === 'next' ? current + 1 : current - 1
    if (incomingSingle >= 1 && incomingSingle <= total) {
      void renderPageToElement(
        incomingSingle,
        baseSingleCanvasRef.value,
        baseSingleTextLayerRef.value,
        layout.singlePage.width,
        layout.singlePage.height,
      )
    }
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
  const layout = pageLayout.value

  if (isMobileViewport()) {
    return x < bounds.width * 0.5 ? 'previous' : 'next'
  }

  if (layout.isTwoPage) {
    if (layout.leftPage && layout.rightPage) {
      const spineX = layout.leftPage.left + layout.leftPage.width
      if (x < spineX) return 'previous'
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

function hasTextAtCaret(clientX?: number, clientY?: number): boolean {
  if (typeof document === 'undefined' || clientX === undefined || clientY === undefined || clientX <= 0 || clientY <= 0) {
    return false
  }
  if (!document.caretRangeFromPoint) return false

  try {
    const range = document.caretRangeFromPoint(clientX, clientY)
    if (!range || !range.startContainer) return false

    const containerEl = range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer.parentElement
      : range.startContainer as HTMLElement

    if (!containerEl || !containerEl.closest('.page-text-layer, .textLayer, .epub-text-layer-viewport')) {
      return false
    }

    const rangeText = range.startContainer.textContent?.trim()
    return Boolean(rangeText && rangeText.length > 0)
  } catch {
    return false
  }
}

/**
 * Detecta se o elemento ou posição do ponteiro intercepta conteúdo textual interativo
 * (spans do PDF, nós de texto do EPUB, parágrafos, etc.).
 * Evita que o gesto de folheamento intercepte seleção de texto ou duplo clique em palavras no canto da folha.
 */
function isInteractiveTextTarget(target: EventTarget | null, clientX?: number, clientY?: number): boolean {
  if (!target) return false
  const el = target instanceof HTMLElement ? target : (target as any).parentElement as HTMLElement | null
  if (!el || el.closest('.book-page-stack')) return false

  // 1. Elementos textuais explícitos (PDF textLayer spans, marcações de anotação, tags do EPUB)
  if (el.closest('.textLayer, .textLayer span, .reader-highlight, .text-highlight')) return true
  if (
    el.closest(
      '.epub-text-layer-content, .epub-text-layer-content *, .epub-text-layer-viewport, .epub-text-layer-viewport *',
    )
  ) {
    return true
  }

  // 2. Elemento com conteúdo de texto direto dentro de qualquer camada de texto da página
  const textLayer = el.closest('.page-text-layer, .scroll-page-text-layer, .scroll-section-content, .scroll-section-slot')
  if (textLayer) {
    return true
  }

  // 3. Verificação por caret Range na coordenada exata
  return hasTextAtCaret(clientX, clientY)
}

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  const stage = stageRef.value
  const stageW = stage?.clientWidth || window.innerWidth
  return stageW < 768 || window.innerWidth < 768
}

async function onPointerDown(event: PointerEvent) {
  if (store.isFocusMode || !pageAnimationEnabled.value || event.button !== 0 || !stageRef.value || physics.isAnimating.value) return

  const direction = getTurnZone(event)
  if (!direction) return

  const pt = pointFrom(event)
  const isTextTarget = isInteractiveTextTarget(event.target, event.clientX, event.clientY)
  const isPageStackTarget = Boolean((event.target as HTMLElement | null)?.closest('.book-page-stack'))

  const layout = pageLayout.value
  const targetPageRect = layout.isTwoPage
    ? (direction === 'next' ? layout.rightPage : layout.leftPage)
    : layout.singlePage

  const w = targetPageRect?.width || 400
  const h = targetPageRect?.height || 600
  const relY = 0.5

  // P1: Armazena arraste pendente — NÃO captura o pointer imediatamente.
  // Isso permite que o navegador processe seleção de texto nativa até que
  // o deslocamento mínimo seja atingido sem conflito.
  activePointerId = event.pointerId
  pendingDrag = {
    pointerId: event.pointerId,
    direction,
    startPoint: pt,
    relY,
    pageWidth: w,
    pageHeight: h,
    isTextTarget,
    isPageStackTarget,
  }
}

function onPointerMove(event: PointerEvent) {
  if (event.pointerId !== activePointerId) return

  // P1: Se há um arraste pendente, verifica se o limiar de deslocamento foi atingido
  if (pendingDrag) {
    const pt = pointFrom(event)
    const dx = pt.x - pendingDrag.startPoint.x
    const dy = pt.y - pendingDrag.startPoint.y
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Se o usuário tem uma seleção ativa no documento (mesmo em progresso), cancela o arraste para priorizar o texto/anotação
    const selection = typeof window !== 'undefined' ? window.getSelection() : null
    const hasSelection = Boolean(
      selection && (!selection.isCollapsed || (selection.toString() && selection.toString().trim().length > 0)),
    )

    if (hasSelection) {
      pendingDrag = null
      return
    }

    const isMobile = isMobileViewport() || event.pointerType === 'touch'

    // Se o arraste começou em cima de texto real no desktop/tablet grande com mouse, prioriza a seleção nativa
    if (pendingDrag.isTextTarget && !isMobile) {
      return
    }

    // Direção da virada baseada no sentido físico do arraste horizontal:
    // Puxar para a esquerda (dx < 0): avançar para a próxima página ('next')
    // Puxar para a direita (dx > 0): voltar para a página anterior ('previous')
    const isNextSwipe = dx < -DRAG_ACTIVATION_THRESHOLD_PX && absDx > absDy * 0.7
    const isPrevSwipe = dx > DRAG_ACTIVATION_THRESHOLD_PX && absDx > absDy * 0.7

    if (!isNextSwipe && !isPrevSwipe && !(pendingDrag.isPageStackTarget && dist >= 8)) {
      return
    }

    const direction: PageTurnDirection = isNextSwipe ? 'next' : (isPrevSwipe ? 'previous' : pendingDrag.direction)

    // Se a virada atingiria além dos limites de página (ex: voltar na pág 1 ou avançar na última)
    if (getTargetPage(direction) === store.currentPage) {
      return
    }

    // Limiar atingido: ativa virada 3D
    event.preventDefault()
    const { startPoint, relY, pageWidth, pageHeight } = pendingDrag
    pendingDrag = null

    stageRef.value?.setPointerCapture(event.pointerId)

    // A preparação assíncrona só ativa a física quando o par de texturas está pronto.
    const activationToken = ++dragActivationToken
    void activateDrag(direction, startPoint, relY, pageWidth, pageHeight, pt, activationToken)
    return
  }

  // Arraste já ativo — atualiza a física normalmente
  if (physics.isDragging.value) {
    event.preventDefault()
    physics.updateDrag(pointFrom(event))
  }
}

/**
 * P1/P4: Ativa o arraste 3D após o limiar de deslocamento ser atingido.
 * Prepara as texturas e inicia a física de arraste instantaneamente.
 */
async function activateDrag(
  direction: PageTurnDirection,
  startPoint: DragPoint,
  relY: number,
  pageWidth: number,
  pageHeight: number,
  currentPoint: DragPoint,
  activationToken: number,
) {
  animationLayout.value = snapshotLayout(pageLayout.value)
  await prepare3DTextures(direction, relY)
  if (activationToken !== dragActivationToken) {
    animationLayout.value = null
    return
  }

  // Se o usuário já soltou o ponteiro durante a preparação da textura (arraste/flick rápido)
  if (activePointerId === null) {
    animationLayout.value = null
    void requestTurn(direction)
    return
  }

  is3DActive.value = true
  emit('transition-state', true)

  const travelWidth = pageLayout.value.isTwoPage ? pageWidth * 2 : pageWidth
  physics.startDrag(startPoint, direction, travelWidth, pageHeight, relY)
  physics.updateDrag(currentPoint)
}

function isPageMarginClick(
  pt: DragPoint,
  direction: PageTurnDirection,
  bounds: DOMRect,
  layout: PageLayoutInfo,
): boolean {
  if (layout.isTwoPage) {
    if (direction === 'previous' && layout.leftPage) {
      return pt.x < (layout.leftPage.left + 36)
    }
    if (direction === 'next' && layout.rightPage) {
      const rightPageEdge = layout.rightPage.left + layout.rightPage.width
      return pt.x > (rightPageEdge - 36)
    }
    return false
  }

  if (layout.singlePage) {
    if (direction === 'previous') {
      return pt.x < (layout.singlePage.left + 36)
    }
    const singlePageEdge = layout.singlePage.left + layout.singlePage.width
    return pt.x > (singlePageEdge - 36)
  }

  const isLeftMargin = pt.x < bounds.width * 0.12
  const isRightMargin = pt.x > bounds.width * 0.88
  return (direction === 'previous' && isLeftMargin) || (direction === 'next' && isRightMargin)
}

function onPointerUp(event: PointerEvent) {
  if (event.pointerId !== activePointerId) return

  // P1: Se o arraste pendente nunca foi ativado (clique simples / tap sem arrastar)
  if (pendingDrag) {
    const { direction, startPoint, isTextTarget, isPageStackTarget } = pendingDrag
    pendingDrag = null
    dragActivationToken++
    activePointerId = null

    const pt = pointFrom(event)
    const dx = Math.abs(pt.x - startPoint.x)
    const dy = Math.abs(pt.y - startPoint.y)
    const selection = typeof window !== 'undefined' ? window.getSelection() : null
    const hasSelection = Boolean(
      selection && (!selection.isCollapsed || (selection.toString() && selection.toString().trim().length > 0)),
    )

    // Se o clique foi sobre marcação de destaque existente ou gerou seleção, NUNCA vira a página
    const isHighlightClick = Boolean((event.target as HTMLElement | null)?.closest('.reader-highlight'))
    if (hasSelection || isHighlightClick) {
      return
    }

    // Se foi clique direto na pilha de páginas lateral, vira a página
    if (isPageStackTarget && dx < 8 && dy < 8) {
      void requestTurn(direction)
      return
    }

    const isMobile = isMobileViewport() || event.pointerType === 'touch'

    // Clique simples (tap) sem arrasto (dx < 14 && dy < 14)
    if (dx < 14 && dy < 14) {
      const bounds = stageRef.value?.getBoundingClientRect()
      const clickDirection = getTurnZone(event) || direction

      if (isMobile) {
        // No mobile: toque na metade direita avança página, na metade esquerda volta página
        if (clickDirection) {
          void requestTurn(clickDirection)
        }
      } else {
        // No desktop: se foi sobre texto interativo, não vira para permitir seleção/cursor
        if (isTextTarget) {
          return
        }
        // No desktop fora do texto, vira se clicou nas margens laterais
        if (bounds && isPageMarginClick(pt, clickDirection, bounds, pageLayout.value)) {
          void requestTurn(clickDirection)
        }
      }
      return
    }
    return
  }

  stageRef.value?.releasePointerCapture(event.pointerId)
  activePointerId = null
  physics.endDrag(pointFrom(event))
}

function onPointerCancel(event: PointerEvent) {
  if (event.pointerId !== activePointerId) return
  pendingDrag = null
  dragActivationToken++
  activePointerId = null
  physics.cancelDrag()
}

async function requestTurn(direction: PageTurnDirection) {
  if (!store.document) return

  const now = performance.now()

  // P3: Se uma animação está em andamento:
  if (physics.isAnimating.value) {
    // Rejeita qualquer clique duplicado sintético emitido pelo navegador logo após o pointerup (< 350ms)
    if (now - lastTurnTriggerTime < 350) {
      return
    }
    pendingTurnDirection = direction
    return
  }

  // Previne disparo duplo acidental por múltiplos eventos associados ao mesmo clique (< 250ms)
  if (now - lastTurnTriggerTime < 250) {
    return
  }
  lastTurnTriggerTime = now

  // P5/P6: Validação de limites usando getTargetPage
  const targetPage = getTargetPage(direction)
  if (targetPage === store.currentPage) return

  // Navegação instantânea quando a viragem 3D estiver desativada
  if (!pageAnimationEnabled.value) {
    store.goToPage(targetPage)
    return
  }

  const layout = pageLayout.value
  const targetPageRect = layout.isTwoPage
    ? (direction === 'next' ? layout.rightPage : layout.leftPage)
    : layout.singlePage

  const w = targetPageRect?.width || 400
  const h = targetPageRect?.height || 600
  const travelWidth = layout.isTwoPage ? w * 2 : w

  animationLayout.value = snapshotLayout(pageLayout.value)
  await prepare3DTextures(direction, 0.5)
  is3DActive.value = true
  emit('transition-state', true)

  physics.triggerTurn(direction, travelWidth, h, 0.5)
}

let dprMediaQuery: MediaQueryList | null = null

function handleDprChange() {
  void renderCurrentSpread()
  if (typeof window !== 'undefined' && window.matchMedia) {
    dprMediaQuery?.removeEventListener('change', handleDprChange)
    dprMediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    dprMediaQuery.addEventListener('change', handleDprChange)
  }
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

  if (typeof window !== 'undefined' && window.matchMedia) {
    dprMediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    dprMediaQuery.addEventListener('change', handleDprChange)
  }
})

onUnmounted(() => {
  dprMediaQuery?.removeEventListener('change', handleDprChange)
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

watch(
  () => annotations.value,
  () => {
    refreshCurrentHighlights()
  },
  { deep: true },
)

watch(
  [() => store.isFocusMode, () => store.focusLineCount],
  ([isFocus]) => {
    if (isFocus) {
      focusPageSide.value = 'left'
      refreshFocusLines()
    }
  },
)

defineExpose({
  next: () => requestTurn('next'),
  previous: () => requestTurn('previous'),
  focusNext,
  focusPrev,
  focusProgressLabel,
  renderCurrentSpread,
  refreshHighlights: refreshCurrentHighlights,
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
  touch-action: none;
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
.theme-black .spread-container {
  background-color: #0c0c0e !important;
}

.theme-black .page-sheet {
  background-color: #19181d !important;
}

.page-sheet.page-sheet--pdf,
.theme-sepia .page-sheet.page-sheet--pdf,
.theme-white .page-sheet.page-sheet--pdf,
.theme-black .page-sheet.page-sheet--pdf {
  background-color: #ffffff !important;
}

.theme-black .page-sheet--left {
  box-shadow: inset -14px 0 20px -8px rgba(0, 0, 0, 0.8), -6px 8px 24px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-right: 2px solid rgba(0, 0, 0, 0.7);
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
}

.theme-black .page-sheet--right {
  box-shadow: inset 14px 0 20px -8px rgba(0, 0, 0, 0.8), 6px 8px 24px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 2px solid rgba(0, 0, 0, 0.7);
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
}

.theme-black .page-sheet--single {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
}

.page-sheet--left {
  box-shadow: inset -7px 0 12px -8px rgba(0, 0, 0, 0.5), -4px 0 20px rgba(0, 0, 0, 0.45);
  border-left: 1px solid rgba(255, 255, 255, 0.04);
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
}

.page-sheet--right {
  box-shadow: inset 7px 0 12px -8px rgba(0, 0, 0, 0.5), 4px 0 20px rgba(0, 0, 0, 0.45);
  border-left: 1px solid rgba(0, 0, 0, 0.12);
  border-right: 1px solid rgba(255, 255, 255, 0.04);
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
}

.page-sheet--single {
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 6px;
}

.theme-sepia .page-sheet--left,
.theme-sepia .page-sheet--single {
  box-shadow: inset -7px 0 12px -8px rgba(80, 60, 30, 0.35), 0 4px 20px rgba(60, 45, 20, 0.16);
  border-left-color: rgba(140, 110, 70, 0.2);
  border-right-color: rgba(140, 110, 70, 0.2);
}

.theme-sepia .page-sheet--right {
  box-shadow: inset 7px 0 12px -8px rgba(80, 60, 30, 0.35), 0 4px 20px rgba(60, 45, 20, 0.16);
  border-left-color: rgba(140, 110, 70, 0.2);
  border-right-color: rgba(140, 110, 70, 0.2);
}

.theme-white .page-sheet--left,
.theme-white .page-sheet--single {
  box-shadow: inset -7px 0 12px -8px rgba(0, 0, 0, 0.18), 0 4px 20px rgba(0, 0, 0, 0.08);
  border-left-color: rgba(0, 0, 0, 0.08);
  border-right-color: rgba(0, 0, 0, 0.08);
}

.theme-white .page-sheet--right {
  box-shadow: inset 7px 0 12px -8px rgba(0, 0, 0, 0.18), 0 4px 20px rgba(0, 0, 0, 0.08);
  border-left-color: rgba(0, 0, 0, 0.08);
  border-right-color: rgba(0, 0, 0, 0.08);
}

@media (max-width: 767px) {
  .page-sheet--single,
  .theme-sepia .page-sheet--single,
  .theme-white .page-sheet--single,
  .theme-black .page-sheet--single {
    box-shadow: none !important;
    border: none !important;
    border-left: none !important;
    border-right: none !important;
    border-radius: 0 !important;
  }
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
  touch-action: none !important;
  -webkit-touch-callout: default !important;
}

/* ================= PILHAS LATERAIS DE PÁGINAS (PAGE STACK EDGES) ================= */
.book-page-stack {
  position: absolute;
  pointer-events: auto;
  cursor: pointer;
  z-index: 10;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
  overflow: hidden;
  user-select: none;
  box-sizing: border-box;
}

.book-page-stack--left {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}

.book-page-stack--right {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}

/* Tema Sépia */
.theme-sepia .book-page-stack {
  background-color: #ede2cd;
  background-image: repeating-linear-gradient(
    to right,
    rgba(140, 105, 65, 0.3) 0px,
    rgba(140, 105, 65, 0.3) 1px,
    rgba(237, 226, 205, 0.95) 1px,
    rgba(237, 226, 205, 0.95) 2.5px
  );
}

.theme-sepia .book-page-stack--left {
  box-shadow: inset 2px 0 3px rgba(0, 0, 0, 0.15), -2px 0 6px rgba(60, 45, 20, 0.2);
  border-left: 1px solid rgba(140, 110, 70, 0.4);
}

.theme-sepia .book-page-stack--right {
  box-shadow: inset -2px 0 3px rgba(0, 0, 0, 0.15), 2px 0 6px rgba(60, 45, 20, 0.2);
  border-right: 1px solid rgba(140, 110, 70, 0.4);
}

/* Tema Branco */
.theme-white .book-page-stack {
  background-color: #f3f3f3;
  background-image: repeating-linear-gradient(
    to right,
    rgba(0, 0, 0, 0.18) 0px,
    rgba(0, 0, 0, 0.18) 1px,
    rgba(243, 243, 243, 0.95) 1px,
    rgba(243, 243, 243, 0.95) 2.5px
  );
}

.theme-white .book-page-stack--left {
  box-shadow: inset 2px 0 3px rgba(0, 0, 0, 0.1), -2px 0 6px rgba(0, 0, 0, 0.1);
  border-left: 1px solid rgba(0, 0, 0, 0.15);
}

.theme-white .book-page-stack--right {
  box-shadow: inset -2px 0 3px rgba(0, 0, 0, 0.1), 2px 0 6px rgba(0, 0, 0, 0.1);
  border-right: 1px solid rgba(0, 0, 0, 0.15);
}

/* Tema Preto */
.theme-black .book-page-stack {
  background-color: #1e1e22;
  background-image: repeating-linear-gradient(
    to right,
    rgba(255, 255, 255, 0.1) 0px,
    rgba(255, 255, 255, 0.1) 1px,
    rgba(30, 30, 34, 0.95) 1px,
    rgba(30, 30, 34, 0.95) 2.5px
  );
}

.theme-black .book-page-stack--left {
  box-shadow: inset 2px 0 4px rgba(0, 0, 0, 0.8), -3px 0 8px rgba(0, 0, 0, 0.6);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
}

.theme-black .book-page-stack--right {
  box-shadow: inset -2px 0 4px rgba(0, 0, 0, 0.8), 3px 0 8px rgba(0, 0, 0, 0.6);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

@media (max-width: 767px) {
  .book-page-stack {
    display: none !important;
  }
}

/* PDF.js Text Layer — Seleção e Destaques Nítidos com Alto Contraste */
.page-text-layer :deep(.textLayer ::selection),
.page-text-layer :deep(.textLayer *::selection),
.page-sheet--pdf :deep(.textLayer ::selection),
.page-sheet--pdf :deep(.textLayer *::selection) {
  background: rgba(229, 123, 85, 0.6) !important;
}

.page-text-layer :deep(.textLayer ::-moz-selection),
.page-text-layer :deep(.textLayer *::-moz-selection),
.page-sheet--pdf :deep(.textLayer ::-moz-selection),
.page-sheet--pdf :deep(.textLayer *::-moz-selection) {
  background: rgba(229, 123, 85, 0.6) !important;
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
  touch-action: none !important;
  -webkit-touch-callout: default !important;
}

.page-text-layer :deep(.epub-text-layer-viewport ::selection),
.page-text-layer :deep(.epub-text-layer-viewport *::selection),
.page-text-layer :deep(.epub-text-layer-content ::selection),
.page-text-layer :deep(.epub-text-layer-content *::selection),
.page-text-layer :deep(.epub-text-layer-content::selection) {
  background: rgba(229, 123, 85, 0.45) !important;
  color: #1a1a1a !important;
}

.theme-sepia .page-text-layer :deep(.epub-text-layer-viewport ::selection),
.theme-sepia .page-text-layer :deep(.epub-text-layer-viewport *::selection),
.theme-sepia .page-text-layer :deep(.epub-text-layer-content ::selection),
.theme-sepia .page-text-layer :deep(.epub-text-layer-content *::selection),
.theme-sepia .page-text-layer :deep(.epub-text-layer-content::selection) {
  background: rgba(229, 123, 85, 0.45) !important;
  color: #2a2521 !important;
}

.theme-white .page-text-layer :deep(.epub-text-layer-viewport ::selection),
.theme-white .page-text-layer :deep(.epub-text-layer-viewport *::selection),
.theme-white .page-text-layer :deep(.epub-text-layer-content ::selection),
.theme-white .page-text-layer :deep(.epub-text-layer-content *::selection),
.theme-white .page-text-layer :deep(.epub-text-layer-content::selection) {
  background: rgba(229, 123, 85, 0.45) !important;
  color: #1a1a1a !important;
}

.theme-black .page-text-layer :deep(.epub-text-layer-viewport ::selection),
.theme-black .page-text-layer :deep(.epub-text-layer-viewport *::selection),
.theme-black .page-text-layer :deep(.epub-text-layer-content ::selection),
.theme-black .page-text-layer :deep(.epub-text-layer-content *::selection),
.theme-black .page-text-layer :deep(.epub-text-layer-content::selection) {
  background: rgba(229, 123, 85, 0.55) !important;
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
  color: #1a1a1a;
  user-select: text !important;
  -webkit-user-select: text !important;
  line-height: 1.7 !important;
  -webkit-font-smoothing: antialiased !important;
  -moz-osx-font-smoothing: grayscale !important;
  text-rendering: optimizeLegibility !important;
}

.theme-sepia .page-text-layer :deep(.epub-text-layer-content),
.theme-sepia .page-text-layer :deep(.epub-text-layer-content *),
.theme-sepia .page-text-layer :deep(.epub-text-layer-content p),
.theme-sepia .page-text-layer :deep(.epub-text-layer-content span),
.theme-sepia .page-text-layer :deep(.epub-text-layer-content div) {
  color: #2a2521;
}

.theme-white .page-text-layer :deep(.epub-text-layer-content),
.theme-white .page-text-layer :deep(.epub-text-layer-content *),
.theme-white .page-text-layer :deep(.epub-text-layer-content p),
.theme-white .page-text-layer :deep(.epub-text-layer-content span),
.theme-white .page-text-layer :deep(.epub-text-layer-content div) {
  color: #1a1a1a;
}

.theme-black .page-text-layer :deep(.epub-text-layer-content),
.theme-black .page-text-layer :deep(.epub-text-layer-content *),
.theme-black .page-text-layer :deep(.epub-text-layer-content p),
.theme-black .page-text-layer :deep(.epub-text-layer-content span),
.theme-black .page-text-layer :deep(.epub-text-layer-content div) {
  color: #e4e4e7;
}

.page-text-layer :deep(.epub-text-layer-content h1),
.page-text-layer :deep(.epub-text-layer-content .chapter-title),
.page-text-layer :deep(.epub-text-layer-content .book-title),
.page-text-layer :deep(.epub-text-layer-content .title) {
  font-size: 2em !important;
  font-weight: 700 !important;
  line-height: 1.25 !important;
  margin-top: 0.8em !important;
  margin-bottom: 0.5em !important;
  display: block !important;
}

.page-text-layer :deep(.epub-text-layer-content h2),
.page-text-layer :deep(.epub-text-layer-content .chapter-subtitle),
.page-text-layer :deep(.epub-text-layer-content .book-subtitle),
.page-text-layer :deep(.epub-text-layer-content .subtitle) {
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

:deep(.reader-highlight) {
  display: inline;
  border-radius: 3px;
  padding: 0.08em 0.18em;
  margin: 0 -0.05em;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  transition: background-color 0.15s ease, filter 0.15s ease;
  cursor: pointer;
  position: relative;
  z-index: 2;
  pointer-events: auto;
}

:deep(.page-sheet--pdf .reader-highlight),
:deep(.textLayer .reader-highlight) {
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  mix-blend-mode: multiply !important;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.04);
}

:deep(.reader-highlight:hover) {
  filter: brightness(0.92);
}

:deep(.theme-black .reader-highlight:hover) {
  filter: brightness(1.2);
}
</style>
