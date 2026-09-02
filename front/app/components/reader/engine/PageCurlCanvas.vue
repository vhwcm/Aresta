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
          <!-- Pilha de Páginas Lidas (Borda Esquerda) -->
          <div
            v-if="pageCreaseEnabled && pageAnimationEnabled && pageStackDepth.leftWidth > 0 && pageLayout.leftPage && pageLayout.leftPage.pageNumber > 0"
            class="book-page-stack book-page-stack--left"
            :style="{
              left: `${pageLayout.leftPage.left - pageStackDepth.leftWidth}px`,
              top: `${pageLayout.leftPage.top}px`,
              width: `${pageStackDepth.leftWidth}px`,
              height: `${pageLayout.leftPage.height}px`,
            }"
            @click.stop="requestTurn('previous')"
            :title="`Páginas lidas (${store.currentPage - 1} de ${store.totalPages} páginas - Voltar)`"
            role="button"
            tabindex="0"
            aria-label="Páginas já lidas. Clique para voltar página"
          />

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

          <!-- Lombada Central (Vinco) -->
          <div
            v-if="pageCreaseEnabled && pageAnimationEnabled && pageLayout.leftPage && pageLayout.rightPage && pageLayout.leftPage.pageNumber > 0 && pageLayout.rightPage.pageNumber > 0"
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

          <!-- Pilha de Páginas Restantes (Borda Direita) -->
          <div
            v-if="pageCreaseEnabled && pageAnimationEnabled && pageStackDepth.rightWidth > 0 && pageLayout.rightPage && pageLayout.rightPage.pageNumber > 0"
            class="book-page-stack book-page-stack--right"
            :style="{
              left: `${pageLayout.rightPage.left + pageLayout.rightPage.width}px`,
              top: `${pageLayout.rightPage.top}px`,
              width: `${pageStackDepth.rightWidth}px`,
              height: `${pageLayout.rightPage.height}px`,
            }"
            @click.stop="requestTurn('next')"
            :title="`Páginas restantes (${store.totalPages - store.currentPage} de ${store.totalPages} páginas - Avançar)`"
            role="button"
            tabindex="0"
            aria-label="Páginas restantes a ler. Clique para avançar página"
          />
        </template>

        <!-- MODO 1 PÁGINA (DESKTOP/TABLET / MOBILE) -->
        <template v-else-if="pageLayout.singlePage && pageLayout.singlePage.pageNumber > 0">
          <!-- Pilha de Páginas Lidas (Borda Esquerda no Modo 1 Página) -->
          <div
            v-if="pageCreaseEnabled && pageAnimationEnabled && pageStackDepth.leftWidth > 0"
            class="book-page-stack book-page-stack--left"
            :style="{
              left: `${pageLayout.singlePage.left - pageStackDepth.leftWidth}px`,
              top: `${pageLayout.singlePage.top}px`,
              width: `${pageStackDepth.leftWidth}px`,
              height: `${pageLayout.singlePage.height}px`,
            }"
            @click.stop="requestTurn('previous')"
            :title="`Páginas lidas (${store.currentPage - 1} de ${store.totalPages} páginas - Voltar)`"
            role="button"
            tabindex="0"
            aria-label="Páginas já lidas. Clique para voltar página"
          />

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

          <!-- Pilha de Páginas Restantes (Borda Direita no Modo 1 Página) -->
          <div
            v-if="pageCreaseEnabled && pageAnimationEnabled && pageStackDepth.rightWidth > 0"
            class="book-page-stack book-page-stack--right"
            :style="{
              left: `${pageLayout.singlePage.left + pageLayout.singlePage.width}px`,
              top: `${pageLayout.singlePage.top}px`,
              width: `${pageStackDepth.rightWidth}px`,
              height: `${pageLayout.singlePage.height}px`,
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

      <!-- Contêiner invisível offscreen para medição e rasterização do verso -->
      <div
        ref="offscreenMeasureRef"
        class="page-text-layer page-text-layer--offscreen"
        style="position: absolute; left: -9999px; top: -9999px; pointer-events: none; visibility: hidden; z-index: -100; overflow: hidden;"
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
import { useBookPageTurn } from '~/composables/reader/useBookPageTurn'
import { usePagePhysics } from '~/composables/reader/usePagePhysics'
import { usePageCurl3D } from '~/composables/reader/usePageCurl3D'
import { DRAG_ACTIVATION_THRESHOLD_PX } from '~/composables/reader/constants'
import { rasterizeElementToCanvas, drawPlainTextToCanvas, applyThemeToCanvas } from '~/utils/pageRasterizer'
import type { PageTurnDirection, DragPoint } from '~/interfaces/reader/types'

const emit = defineEmits<{
  (_e: 'transition-state', _isTransitioning: boolean): void
}>()

const store = useReaderStore()
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
const offscreenMeasureRef = ref<HTMLElement | null>(null)

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

// P1: Estado de arraste pendente — ativa virada 3D somente após limiar de deslocamento
interface PendingDrag {
  pointerId: number
  direction: PageTurnDirection
  startPoint: DragPoint
  relY: number
  pageWidth: number
  pageHeight: number
}
let pendingDrag: PendingDrag | null = null

// P3: Fila de virada pendente (máx. 1) para cliques rápidos em sequência
let pendingTurnDirection: PageTurnDirection | null = null

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
  onProgress: (progress, gripY, deltaY) => {
    if (!is3DActive.value) return
    pageCurl3D.updateUniforms({
      progress,
      direction: currentDirection.value,
      isTwoPage: pageLayout.value.isTwoPage,
      gripY,
      pointerDeltaY: deltaY,
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
    emit('transition-state', false)

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
    emit('transition-state', false)

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
  const layout = pageLayout.value
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
      position: 'absolute' as const,
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

  if (typeof (doc as any).getPage === 'function') {
    try {
      const pageData = await (doc as any).getPage(pageNumber, width, height)
      await pageData.render(ctx)
      if (doc.type === 'pdf') {
        applyThemeToCanvas(ctx, renderW, renderH, activeTheme.value as any)
      }
    } catch {
      // fallback gracioso se render falhar
    }
  }
}

async function renderPageToOffscreen(
  pageNumber: number,
  targetCanvas: HTMLCanvasElement,
  width: number,
  height: number,
): Promise<void> {
  if (pageNumber <= 0 || !store.document || width <= 0 || height <= 0) return
  const doc = store.document
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1

  const renderW = Math.round(width * dpr)
  const renderH = Math.round(height * dpr)
  targetCanvas.width = renderW
  targetCanvas.height = renderH
  targetCanvas.style.width = `${width}px`
  targetCanvas.style.height = `${height}px`

  // 1. PDF: Renderização nativa com aceleração de desenho do PDF.js
  if (doc.type === 'pdf' && typeof (doc as any).getPage === 'function') {
    try {
      const pageData = await (doc as any).getPage(pageNumber, width, height)
      const ctx = targetCanvas.getContext('2d', { alpha: false })
      if (ctx) {
        await pageData.render(ctx)
        if (activeTheme.value === 'sepia' || activeTheme.value === 'black') {
          applyThemeToCanvas(ctx, renderW, renderH, activeTheme.value as any)
        }
      }
      return
    } catch {
      // continua para fallback
    }
  }

  // 2. EPUB / Livreto Didático: Renderiza o HTML no contêiner offscreen e rasteriza para canvas
  if (offscreenMeasureRef.value && doc.renderTextLayer) {
    offscreenMeasureRef.value.style.width = `${width}px`
    offscreenMeasureRef.value.style.height = `${height}px`
    try {
      await doc.renderTextLayer(pageNumber, offscreenMeasureRef.value, width, height)
      rasterizeElementToCanvas(
        offscreenMeasureRef.value,
        targetCanvas,
        width,
        height,
        activeTheme.value as any,
      )
      return
    } catch {
      // continua para fallback
    }
  }

  // 3. Fallback garantido com texto puro extraído do documento
  if (typeof doc.getTextContent === 'function') {
    try {
      const text = await doc.getTextContent(pageNumber)
      drawPlainTextToCanvas(targetCanvas, text, width, height, activeTheme.value as any)
    } catch {
      // fallback silencioso
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
    const pageW = layout.rightPage?.width ?? layout.leftPage?.width ?? 400
    const pageH = layout.rightPage?.height ?? layout.leftPage?.height ?? 600

    if (direction === 'next') {
      const nextLeft = curLeft + 2 <= total ? curLeft + 2 : 0
      if (baseRightTextLayerRef.value) {
        rasterizeElementToCanvas(
          baseRightTextLayerRef.value,
          frontCanvas,
          pageW,
          pageH,
          activeTheme.value as any,
          baseRightCanvasRef.value,
        )
      }
      if (nextLeft > 0) {
        await renderPageToOffscreen(nextLeft, backCanvas, pageW, pageH)
      }
    } else {
      const prevRight = curLeft - 1 >= 1 ? curLeft - 1 : 0
      if (baseLeftTextLayerRef.value) {
        rasterizeElementToCanvas(
          baseLeftTextLayerRef.value,
          frontCanvas,
          pageW,
          pageH,
          activeTheme.value as any,
          baseLeftCanvasRef.value,
        )
      }
      if (prevRight > 0) {
        await renderPageToOffscreen(prevRight, backCanvas, pageW, pageH)
      }
    }
  } else if (layout.singlePage) {
    const pageW = layout.singlePage.width
    const pageH = layout.singlePage.height
    if (baseSingleTextLayerRef.value) {
      rasterizeElementToCanvas(
        baseSingleTextLayerRef.value,
        frontCanvas,
        pageW,
        pageH,
        activeTheme.value as any,
        baseSingleCanvasRef.value,
      )
    }
    const targetPage = direction === 'next'
      ? Math.min(total, curPage + 1)
      : Math.max(1, curPage - 1)
    if (targetPage > 0 && targetPage !== curPage) {
      await renderPageToOffscreen(targetPage, backCanvas, pageW, pageH)
    }
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
    void prewarm3DTextures('next')
  } else if (layout.singlePage && curPage > 0) {
    await renderPageToElement(
      curPage,
      baseSingleCanvasRef.value,
      baseSingleTextLayerRef.value,
      layout.singlePage.width,
      layout.singlePage.height,
    )
    void prewarm3DTextures('next')
  }
}

/**
 * Prepara as texturas e o setup Three.js de forma instantânea e robusta com texto garantido
 */
function prepare3DTextures(direction: PageTurnDirection, gripY = 0.5) {
  if (!store.document) return
  currentDirection.value = direction

  const layout = pageLayout.value
  const curPage = store.currentPage
  const total = store.totalPages

  const frontCanvas = getOrCreateOffscreenCanvas('front')
  const backCanvas = getOrCreateOffscreenCanvas('back')

  if (layout.isTwoPage) {
    const curLeft = curPage % 2 !== 0 ? curPage : Math.max(1, curPage - 1)

    const pageW = layout.rightPage?.width ?? layout.leftPage?.width ?? 400
    const pageH = layout.rightPage?.height ?? layout.leftPage?.height ?? 600

    if (direction === 'next') {
      const nextLeft = curLeft + 2 <= total ? curLeft + 2 : 0
      const nextRight = curLeft + 3 <= total ? curLeft + 3 : 0

      // 1. Frente da folha girando: Página Direita atual (curRight)
      // Rasteriza IMEDIATAMENTE de forma síncrona a partir do text layer / canvas já visíveis na tela
      if (baseRightTextLayerRef.value) {
        rasterizeElementToCanvas(
          baseRightTextLayerRef.value,
          frontCanvas,
          pageW,
          pageH,
          activeTheme.value as any,
          baseRightCanvasRef.value,
        )
      }

      // 2. Inicializa a cena 3D e texturas instantaneamente
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
        isTwoPage: true,
        gripY,
        pointerDeltaY: 0,
        theme: activeTheme.value as any,
      })
      pageCurl3D.render()

      // 3. Verso da folha girando: Próxima Página Esquerda (nextLeft)
      if (nextLeft > 0) {
        void renderPageToOffscreen(nextLeft, backCanvas, pageW, pageH).then(() => {
          pageCurl3D.setTextures(frontCanvas, backCanvas)
          pageCurl3D.render()
        })
      }

      // 4. Base Direita Revelada: Renderiza a próxima página direita por baixo em background
      if (nextRight > 0 && layout.rightPage) {
        void renderPageToElement(nextRight, baseRightCanvasRef.value, baseRightTextLayerRef.value, pageW, pageH)
      }
    } else {
      // PREVIOUS (Two-Page)
      const prevLeft = curLeft - 2 >= 1 ? curLeft - 2 : 0
      const prevRight = curLeft - 1 >= 1 ? curLeft - 1 : 0

      // 1. Frente da folha girando: Página Esquerda atual (curLeft)
      if (baseLeftTextLayerRef.value) {
        rasterizeElementToCanvas(
          baseLeftTextLayerRef.value,
          frontCanvas,
          pageW,
          pageH,
          activeTheme.value as any,
          baseLeftCanvasRef.value,
        )
      }

      // 2. Inicializa a cena 3D e texturas instantaneamente
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
        isTwoPage: true,
        gripY,
        pointerDeltaY: 0,
        theme: activeTheme.value as any,
      })
      pageCurl3D.render()

      // 3. Verso da folha girando: Página Direita Anterior (prevRight)
      if (prevRight > 0) {
        void renderPageToOffscreen(prevRight, backCanvas, pageW, pageH).then(() => {
          pageCurl3D.setTextures(frontCanvas, backCanvas)
          pageCurl3D.render()
        })
      }

      // 4. Base Esquerda Revelada: Renderiza a página esquerda anterior por baixo
      if (prevLeft > 0 && layout.leftPage) {
        void renderPageToElement(prevLeft, baseLeftCanvasRef.value, baseLeftTextLayerRef.value, pageW, pageH)
      }
    }
  } else if (layout.singlePage) {
    const pageW = layout.singlePage.width
    const pageH = layout.singlePage.height

    // 1. Frente da folha girando: Página única atual
    if (baseSingleTextLayerRef.value) {
      rasterizeElementToCanvas(
        baseSingleTextLayerRef.value,
        frontCanvas,
        pageW,
        pageH,
        activeTheme.value as any,
        baseSingleCanvasRef.value,
      )
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
      isTwoPage: false,
      gripY,
      pointerDeltaY: 0,
      theme: activeTheme.value as any,
    })
    pageCurl3D.render()

    if (direction === 'next') {
      const nextPage = Math.min(total, curPage + 1)
      if (nextPage > 0) {
        void renderPageToOffscreen(nextPage, backCanvas, pageW, pageH).then(() => {
          pageCurl3D.setTextures(frontCanvas, backCanvas)
          pageCurl3D.render()
        })
        void renderPageToElement(nextPage, baseSingleCanvasRef.value, baseSingleTextLayerRef.value, pageW, pageH)
      }
    } else {
      const prevPage = Math.max(1, curPage - 1)
      if (prevPage > 0) {
        void renderPageToOffscreen(prevPage, backCanvas, pageW, pageH).then(() => {
          pageCurl3D.setTextures(frontCanvas, backCanvas)
          pageCurl3D.render()
        })
        void renderPageToElement(prevPage, baseSingleCanvasRef.value, baseSingleTextLayerRef.value, pageW, pageH)
      }
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

function isTextElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false
  return Boolean(
    target.closest('.page-text-layer') ||
    target.closest('.textLayer') ||
    target.closest('.epub-text-layer-content') ||
    target.closest('.epub-text-layer-viewport')
  )
}

async function onPointerDown(event: PointerEvent) {
  if (!pageAnimationEnabled.value || event.button !== 0 || !stageRef.value || physics.isAnimating.value) return

  const direction = getTurnZone(event)
  if (!direction) return

  // P5/P6: Validação de limites usando getTargetPage para evitar viradas fantasma
  const targetPage = getTargetPage(direction)
  if (targetPage === store.currentPage) return

  const pt = pointFrom(event)
  const layout = pageLayout.value
  const targetPageRect = layout.isTwoPage
    ? (direction === 'next' ? layout.rightPage : layout.leftPage)
    : layout.singlePage

  const w = targetPageRect?.width || 400
  const h = targetPageRect?.height || 600
  const relY = targetPageRect ? (pt.y - targetPageRect.top) / h : 0.5

  // P1: Armazena arraste pendente — NÃO captura o pointer imediatamente.
  // Isso permite que o navegador processe seleção de texto nativa até que
  // o deslocamento mínimo (DRAG_ACTIVATION_THRESHOLD_PX) seja atingido.
  activePointerId = event.pointerId
  pendingDrag = {
    pointerId: event.pointerId,
    direction,
    startPoint: pt,
    relY,
    pageWidth: w,
    pageHeight: h,
  }
}

function onPointerMove(event: PointerEvent) {
  if (event.pointerId !== activePointerId) return

  // P1: Se há um arraste pendente, verifica se o limiar de deslocamento foi atingido
  if (pendingDrag) {
    const pt = pointFrom(event)
    const dx = pt.x - pendingDrag.startPoint.x
    const dy = pt.y - pendingDrag.startPoint.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < DRAG_ACTIVATION_THRESHOLD_PX) {
      // Ainda abaixo do limiar — não interfere na seleção de texto nativa
      return
    }

    // Se o usuário já selecionou texto na janela, cancela o arraste para priorizar o menu de contexto/anotação
    const selection = typeof window !== 'undefined' ? window.getSelection() : null
    if (selection && selection.toString().trim().length > 0) {
      pendingDrag = null
      return
    }

    // Limiar atingido: ativa virada 3D
    event.preventDefault()
    const { direction, startPoint, relY, pageWidth, pageHeight } = pendingDrag
    pendingDrag = null

    stageRef.value?.setPointerCapture(event.pointerId)

    // Ativação síncrona e instantânea do 3D
    activateDrag(direction, startPoint, relY, pageWidth, pageHeight, pt)
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
function activateDrag(
  direction: PageTurnDirection,
  startPoint: DragPoint,
  relY: number,
  pageWidth: number,
  pageHeight: number,
  currentPoint: DragPoint,
) {
  prepare3DTextures(direction, relY)
  is3DActive.value = true
  emit('transition-state', true)

  const travelWidth = pageLayout.value.isTwoPage ? pageWidth * 2 : pageWidth
  physics.startDrag(startPoint, direction, travelWidth, pageHeight, relY)
  physics.updateDrag(currentPoint)
}

function onPointerUp(event: PointerEvent) {
  if (event.pointerId !== activePointerId) return

  // P1: Se o arraste pendente nunca foi ativado (clique simples sem arrastar)
  if (pendingDrag) {
    const { direction, startPoint } = pendingDrag
    pendingDrag = null
    activePointerId = null

    const pt = pointFrom(event)
    const dx = Math.abs(pt.x - startPoint.x)
    const dy = Math.abs(pt.y - startPoint.y)
    const selection = typeof window !== 'undefined' ? window.getSelection() : null
    const hasSelection = selection && selection.toString().trim().length > 0

    // Se foi um clique direto nas bordas laterais externas sem seleção de texto, vira a página
    if (dx < 6 && dy < 6 && !hasSelection) {
      const bounds = stageRef.value?.getBoundingClientRect()
      if (bounds) {
        const isLeftMargin = pt.x < bounds.width * 0.22
        const isRightMargin = pt.x > bounds.width * 0.78
        if ((direction === 'previous' && isLeftMargin) || (direction === 'next' && isRightMargin)) {
          void requestTurn(direction)
        }
      }
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
  activePointerId = null
  physics.cancelDrag()
}

async function requestTurn(direction: PageTurnDirection) {
  if (!store.document) return

  // P5/P6: Validação de limites usando getTargetPage
  const targetPage = getTargetPage(direction)
  if (targetPage === store.currentPage) return

  // P3: Se uma animação está em andamento, enfileira a virada
  if (physics.isAnimating.value) {
    pendingTurnDirection = direction
    return
  }

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

  prepare3DTextures(direction, 0.5)
  is3DActive.value = true
  emit('transition-state', true)

  physics.triggerTurn(direction, travelWidth, h, 0.5)
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
