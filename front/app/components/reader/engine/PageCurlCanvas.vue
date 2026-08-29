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
      :style="{
        backgroundColor: themeBgColor,
      }"
    >
      <!-- ================= MODO ESTÁTICO (LEITURA NORMAL) ================= -->
      <div
        v-if="store.document && !isAnimating3D"
        class="spread-container spread-container--static"
        :style="{ backgroundColor: themeBgColor }"
      >
        <!-- 2 Páginas: Página Esquerda -->
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

        <!-- 2 Páginas: Lombada Central -->
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

        <!-- 2 Páginas: Página Direita -->
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

        <!-- 1 Página: Central -->
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

      <!-- ================= MODO 3D ATIVO (DURANTE A VIRADA DE PÁGINA) ================= -->
      <div
        v-else-if="store.document && isAnimating3D"
        class="spread-container spread-container--3d"
        :style="{ backgroundColor: themeBgColor }"
      >
        <!-- CASO 1: MODO 2 PÁGINAS -->
        <template v-if="pageLayout.isTwoPage">
          <!-- 1.1 Base Sob a Folha (Páginas Estáticas que ficam visíveis ou se revelam) -->
          <!-- Página Esquerda Base -->
          <div
            v-if="pageLayout.leftPage"
            class="page-sheet page-sheet--left page-sheet--underlying"
            :style="{
              left: `${pageLayout.leftPage.left}px`,
              top: `${pageLayout.leftPage.top}px`,
              width: `${pageLayout.leftPage.width}px`,
              height: `${pageLayout.leftPage.height}px`,
            }"
          >
            <!-- Quando vai para 'next', o lado esquerdo é o left original. Quando vai para 'prev', o lado esquerdo revela o incomingLeft! -->
            <canvas
              v-if="store.document?.type === 'pdf'"
              ref="underlyingLeftCanvasRef"
              class="page-pdf-canvas"
            />
            <div
              ref="underlyingLeftTextLayerRef"
              class="page-text-layer page-text-layer--left"
            />
            <!-- Sombra projetada se a folha estiver vindo da esquerda -->
            <div
              v-if="transitionDirection === 'previous'"
              class="page-underlying-shadow page-underlying-shadow--left"
              :style="{ opacity: castShadowOpacity }"
            />
          </div>

          <!-- Lombada Central -->
          <div
            v-if="pageLayout.leftPage && pageLayout.rightPage"
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
            v-if="pageLayout.rightPage"
            class="page-sheet page-sheet--right page-sheet--underlying"
            :style="{
              left: `${pageLayout.rightPage.left}px`,
              top: `${pageLayout.rightPage.top}px`,
              width: `${pageLayout.rightPage.width}px`,
              height: `${pageLayout.rightPage.height}px`,
            }"
          >
            <!-- Quando vai para 'next', o lado direito revela o incomingRight! Quando vai para 'prev', o lado direito é o right original. -->
            <canvas
              v-if="store.document?.type === 'pdf'"
              ref="underlyingRightCanvasRef"
              class="page-pdf-canvas"
            />
            <div
              ref="underlyingRightTextLayerRef"
              class="page-text-layer page-text-layer--right"
            />
            <!-- Sombra projetada da folha caindo sobre a página direita -->
            <div
              v-if="transitionDirection === 'next'"
              class="page-underlying-shadow page-underlying-shadow--right"
              :style="{ opacity: castShadowOpacity }"
            />
          </div>

          <!-- 1.2 Folha 3D em Movimento (The Turning Leaf) -->
          <!-- Se for NEXT: Folha parte da direita e gira para a esquerda em torno da lombada -->
          <div
            v-if="transitionDirection === 'next' && pageLayout.rightPage"
            class="turning-leaf turning-leaf--next"
            :style="{
              left: `${pageLayout.rightPage.left}px`,
              top: `${pageLayout.rightPage.top}px`,
              width: `${pageLayout.rightPage.width}px`,
              height: `${pageLayout.rightPage.height}px`,
              transformOrigin: '0% 50%',
              transform: `perspective(2400px) rotateY(${nextLeafRotation}deg)`,
            }"
          >
            <!-- Frente da Folha (Página Direita Atual) -->
            <div class="turning-leaf__face turning-leaf__face--front">
              <canvas
                v-if="store.document?.type === 'pdf'"
                ref="leafFrontCanvasRef"
                class="page-pdf-canvas"
              />
              <div
                ref="leafFrontTextLayerRef"
                class="page-text-layer page-text-layer--right"
              />
              <div class="page-curl-shading" :style="{ opacity: curlShadowOpacity }" />
            </div>

            <!-- Verso da Folha (Página Esquerda Entrante) -->
            <div class="turning-leaf__face turning-leaf__face--back">
              <canvas
                v-if="store.document?.type === 'pdf'"
                ref="leafBackCanvasRef"
                class="page-pdf-canvas"
              />
              <div
                ref="leafBackTextLayerRef"
                class="page-text-layer page-text-layer--left"
              />
              <div class="page-curl-shading" :style="{ opacity: curlShadowOpacity }" />
            </div>
          </div>

          <!-- Se for PREVIOUS: Folha parte da esquerda e gira para a direita em torno da lombada -->
          <div
            v-else-if="transitionDirection === 'previous' && pageLayout.leftPage"
            class="turning-leaf turning-leaf--prev"
            :style="{
              left: `${pageLayout.leftPage.left}px`,
              top: `${pageLayout.leftPage.top}px`,
              width: `${pageLayout.leftPage.width}px`,
              height: `${pageLayout.leftPage.height}px`,
              transformOrigin: '100% 50%',
              transform: `perspective(2400px) rotateY(${prevLeafRotation}deg)`,
            }"
          >
            <!-- Frente da Folha (Página Direita Entrante) -->
            <div class="turning-leaf__face turning-leaf__face--front">
              <canvas
                v-if="store.document?.type === 'pdf'"
                ref="leafFrontCanvasRef"
                class="page-pdf-canvas"
              />
              <div
                ref="leafFrontTextLayerRef"
                class="page-text-layer page-text-layer--right"
              />
              <div class="page-curl-shading" :style="{ opacity: curlShadowOpacity }" />
            </div>

            <!-- Verso da Folha (Página Esquerda Atual) -->
            <div class="turning-leaf__face turning-leaf__face--back">
              <canvas
                v-if="store.document?.type === 'pdf'"
                ref="leafBackCanvasRef"
                class="page-pdf-canvas"
              />
              <div
                ref="leafBackTextLayerRef"
                class="page-text-layer page-text-layer--left"
              />
              <div class="page-curl-shading" :style="{ opacity: curlShadowOpacity }" />
            </div>
          </div>
        </template>

        <!-- CASO 2: MODO 1 PÁGINA (MOBILE / TELA COMPACTA) -->
        <template v-else-if="pageLayout.singlePage">
          <!-- 2.1 Página Base Sob a Folha -->
          <div
            class="page-sheet page-sheet--single page-sheet--underlying"
            :style="{
              left: `${pageLayout.singlePage.left}px`,
              top: `${pageLayout.singlePage.top}px`,
              width: `${pageLayout.singlePage.width}px`,
              height: `${pageLayout.singlePage.height}px`,
            }"
          >
            <canvas
              v-if="store.document?.type === 'pdf'"
              ref="underlyingSingleCanvasRef"
              class="page-pdf-canvas"
            />
            <div
              ref="underlyingSingleTextLayerRef"
              class="page-text-layer page-text-layer--single"
            />
            <div class="page-underlying-shadow" :style="{ opacity: castShadowOpacity }" />
          </div>

          <!-- 2.2 Folha 3D em Movimento (Single Page Flip) -->
          <!-- Se for NEXT: A página atual vira em 3D para a esquerda -->
          <div
            v-if="transitionDirection === 'next'"
            class="turning-leaf turning-leaf--single"
            :style="{
              left: `${pageLayout.singlePage.left}px`,
              top: `${pageLayout.singlePage.top}px`,
              width: `${pageLayout.singlePage.width}px`,
              height: `${pageLayout.singlePage.height}px`,
              transformOrigin: '0% 50%',
              transform: `perspective(2000px) rotateY(${nextLeafRotation}deg)`,
            }"
          >
            <div class="turning-leaf__face turning-leaf__face--front">
              <canvas
                v-if="store.document?.type === 'pdf'"
                ref="leafFrontCanvasRef"
                class="page-pdf-canvas"
              />
              <div
                ref="leafFrontTextLayerRef"
                class="page-text-layer page-text-layer--single"
              />
              <div class="page-curl-shading" :style="{ opacity: curlShadowOpacity }" />
            </div>
            <div class="turning-leaf__face turning-leaf__face--back turning-leaf__face--blank">
              <div class="page-curl-shading" :style="{ opacity: curlShadowOpacity }" />
            </div>
          </div>

          <!-- Se for PREVIOUS: A página anterior entra virando em 3D da esquerda -->
          <div
            v-else-if="transitionDirection === 'previous'"
            class="turning-leaf turning-leaf--single"
            :style="{
              left: `${pageLayout.singlePage.left}px`,
              top: `${pageLayout.singlePage.top}px`,
              width: `${pageLayout.singlePage.width}px`,
              height: `${pageLayout.singlePage.height}px`,
              transformOrigin: '0% 50%',
              transform: `perspective(2000px) rotateY(${-180 * (1 - turnProgress)}deg)`,
            }"
          >
            <div class="turning-leaf__face turning-leaf__face--front">
              <canvas
                v-if="store.document?.type === 'pdf'"
                ref="leafFrontCanvasRef"
                class="page-pdf-canvas"
              />
              <div
                ref="leafFrontTextLayerRef"
                class="page-text-layer page-text-layer--single"
              />
              <div class="page-curl-shading" :style="{ opacity: curlShadowOpacity }" />
            </div>
            <div class="turning-leaf__face turning-leaf__face--back turning-leaf__face--blank">
              <div class="page-curl-shading" :style="{ opacity: curlShadowOpacity }" />
            </div>
          </div>
        </template>
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

const activeTheme = computed(() => store.readerTheme || 'sepia')
const themeBgColor = computed(() => {
  if (activeTheme.value === 'white') return '#ffffff'
  if (activeTheme.value === 'black') return '#121214'
  return '#f5eedc'
})

// Refs de elementos do Spread Estático (Leitura Normal)
const leftCanvasRef = ref<HTMLCanvasElement | null>(null)
const leftTextLayerRef = ref<HTMLElement | null>(null)
const rightCanvasRef = ref<HTMLCanvasElement | null>(null)
const rightTextLayerRef = ref<HTMLElement | null>(null)
const singleCanvasRef = ref<HTMLCanvasElement | null>(null)
const singleTextLayerRef = ref<HTMLElement | null>(null)

// Refs de elementos durante Transição 3D (Underlying Base & Turning Leaf)
const underlyingLeftCanvasRef = ref<HTMLCanvasElement | null>(null)
const underlyingLeftTextLayerRef = ref<HTMLElement | null>(null)
const underlyingRightCanvasRef = ref<HTMLCanvasElement | null>(null)
const underlyingRightTextLayerRef = ref<HTMLElement | null>(null)
const underlyingSingleCanvasRef = ref<HTMLCanvasElement | null>(null)
const underlyingSingleTextLayerRef = ref<HTMLElement | null>(null)
const leafFrontCanvasRef = ref<HTMLCanvasElement | null>(null)
const leafFrontTextLayerRef = ref<HTMLElement | null>(null)
const leafBackCanvasRef = ref<HTMLCanvasElement | null>(null)
const leafBackTextLayerRef = ref<HTMLElement | null>(null)

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
} = useBookPageTurn(stageRef, {
  onBeforeTurn: async () => {
    await prepareAndRender3DSpread()
  },
  onAfterTurn: async () => {
    await renderCurrentSpread()
  },
})

const emit = defineEmits<{
  'transition-state': [isTransitioning: boolean]
}>()

const isAnimating3D = computed(() => isTransitioning.value || isDragging.value)

const hostWidth = computed(() => stageRef.value?.clientWidth || 800)

// Progresso normalizado de 0 a 1 da virada
const turnProgress = computed(() => {
  if (!isAnimating3D.value) return 0
  const w = hostWidth.value
  if (w <= 0) return 0
  return Math.min(1, Math.max(0, Math.abs(dragOffset.value) / w))
})

// Rotação 3D da folha em virada para a frente ('next'): 0deg até -180deg
const nextLeafRotation = computed(() => {
  const p = turnProgress.value
  return -180 * p
})

// Rotação 3D da folha em virada para trás ('previous'): 180deg até 0deg
const prevLeafRotation = computed(() => {
  const p = turnProgress.value
  return 180 * (1 - p)
})

// Opacidade das sombras dinâmicas de curvatura do papel 3D
const curlShadowOpacity = computed(() => {
  const p = turnProgress.value
  return Math.sin(p * Math.PI) * 0.42
})

const castShadowOpacity = computed(() => {
  const p = turnProgress.value
  return Math.sin(p * Math.PI) * 0.38
})

let activePointerId: number | null = null
let currentRenderVersion = 0

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

  const target = event.target as HTMLElement | null
  const isInsideText = !!target?.closest('.page-text-layer')

  const direction = getTurnZone(event)
  if (!direction || isInsideText) {
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
      const renderW = Math.round(width * dpr)
      const renderH = Math.round(height * dpr)
      canvasEl.width = renderW
      canvasEl.height = renderH
      canvasEl.style.width = `${width}px`
      canvasEl.style.height = `${height}px`

      const ctx = canvasEl.getContext('2d', { alpha: false })
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        const pageData = await doc.getPage(pageNumber, renderW, renderH)
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

async function prepareAndRender3DSpread() {
  if (!store.document || incomingTargetPage.value <= 0) return

  await nextTick()
  const layout = pageLayout.value
  const direction = transitionDirection.value

  if (layout.isTwoPage) {
    if (direction === 'next') {
      if (layout.leftPage && layout.leftPage.pageNumber > 0) {
        void renderPageToElement(
          layout.leftPage.pageNumber,
          underlyingLeftCanvasRef.value,
          underlyingLeftTextLayerRef.value,
          layout.leftPage.width,
          layout.leftPage.height,
        )
      }
      if (incomingRightPageNumber.value > 0 && layout.rightPage) {
        void renderPageToElement(
          incomingRightPageNumber.value,
          underlyingRightCanvasRef.value,
          underlyingRightTextLayerRef.value,
          layout.rightPage.width,
          layout.rightPage.height,
        )
      }
      if (layout.rightPage && layout.rightPage.pageNumber > 0) {
        void renderPageToElement(
          layout.rightPage.pageNumber,
          leafFrontCanvasRef.value,
          leafFrontTextLayerRef.value,
          layout.rightPage.width,
          layout.rightPage.height,
        )
      }
      if (incomingLeftPageNumber.value > 0 && layout.leftPage) {
        void renderPageToElement(
          incomingLeftPageNumber.value,
          leafBackCanvasRef.value,
          leafBackTextLayerRef.value,
          layout.leftPage.width,
          layout.leftPage.height,
        )
      }
    } else {
      if (incomingLeftPageNumber.value > 0 && layout.leftPage) {
        void renderPageToElement(
          incomingLeftPageNumber.value,
          underlyingLeftCanvasRef.value,
          underlyingLeftTextLayerRef.value,
          layout.leftPage.width,
          layout.leftPage.height,
        )
      }
      if (layout.rightPage && layout.rightPage.pageNumber > 0) {
        void renderPageToElement(
          layout.rightPage.pageNumber,
          underlyingRightCanvasRef.value,
          underlyingRightTextLayerRef.value,
          layout.rightPage.width,
          layout.rightPage.height,
        )
      }
      if (incomingRightPageNumber.value > 0 && layout.rightPage) {
        void renderPageToElement(
          incomingRightPageNumber.value,
          leafFrontCanvasRef.value,
          leafFrontTextLayerRef.value,
          layout.rightPage.width,
          layout.rightPage.height,
        )
      }
      if (layout.leftPage && layout.leftPage.pageNumber > 0) {
        void renderPageToElement(
          layout.leftPage.pageNumber,
          leafBackCanvasRef.value,
          leafBackTextLayerRef.value,
          layout.leftPage.width,
          layout.leftPage.height,
        )
      }
    }
  } else if (layout.singlePage) {
    if (direction === 'next') {
      if (incomingSinglePageNumber.value > 0) {
        void renderPageToElement(
          incomingSinglePageNumber.value,
          underlyingSingleCanvasRef.value,
          underlyingSingleTextLayerRef.value,
          layout.singlePage.width,
          layout.singlePage.height,
        )
      }
      if (layout.singlePage.pageNumber > 0) {
        void renderPageToElement(
          layout.singlePage.pageNumber,
          leafFrontCanvasRef.value,
          leafFrontTextLayerRef.value,
          layout.singlePage.width,
          layout.singlePage.height,
        )
      }
    } else {
      if (layout.singlePage.pageNumber > 0) {
        void renderPageToElement(
          layout.singlePage.pageNumber,
          underlyingSingleCanvasRef.value,
          underlyingSingleTextLayerRef.value,
          layout.singlePage.width,
          layout.singlePage.height,
        )
      }
      if (incomingSinglePageNumber.value > 0) {
        void renderPageToElement(
          incomingSinglePageNumber.value,
          leafFrontCanvasRef.value,
          leafFrontTextLayerRef.value,
          layout.singlePage.width,
          layout.singlePage.height,
        )
      }
    }
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
      void prepareAndRender3DSpread()
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

.book-3d-stage {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  perspective: 2600px;
  perspective-origin: 50% 50%;
  transform-style: preserve-3d;
  pointer-events: none;
}

.spread-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  transform-style: preserve-3d;
}

.page-sheet {
  position: absolute;
  pointer-events: auto;
  overflow: hidden;
  user-select: text;
  -webkit-user-select: text;
  box-sizing: border-box;
}

.turning-leaf {
  position: absolute;
  transform-style: preserve-3d;
  will-change: transform;
  z-index: 30;
  pointer-events: none;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35);
}

.turning-leaf__face {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
  transform-style: preserve-3d;
  box-sizing: border-box;
}

.turning-leaf__face--front {
  transform: rotateY(0deg) translateZ(1px);
}

.turning-leaf__face--back {
  transform: rotateY(180deg) translateZ(1px);
}

.turning-leaf__face--blank {
  background: inherit;
}

.page-curl-shading {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 25;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.35) 0%,
    rgba(255, 255, 255, 0.12) 20%,
    rgba(0, 0, 0, 0.05) 50%,
    rgba(0, 0, 0, 0.25) 100%
  );
  mix-blend-mode: multiply;
  transition: opacity 0.05s ease-out;
}

.theme-black .page-curl-shading {
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(0, 0, 0, 0.35) 40%,
    rgba(255, 255, 255, 0.08) 100%
  );
  mix-blend-mode: screen;
}

.page-underlying-shadow {
  position: absolute;
  inset: 0;
  pointer-events: none;
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

.theme-sepia.page-curl-wrapper,
.theme-sepia .book-3d-stage,
.theme-sepia .spread-container,
.theme-sepia .page-sheet,
.theme-sepia .turning-leaf,
.theme-sepia .turning-leaf__face {
  background-color: #f5eedc !important;
}
.theme-white.page-curl-wrapper,
.theme-white .book-3d-stage,
.theme-white .spread-container,
.theme-white .page-sheet,
.theme-white .turning-leaf,
.theme-white .turning-leaf__face {
  background-color: #ffffff !important;
}
.theme-black.page-curl-wrapper,
.theme-black .book-3d-stage,
.theme-black .spread-container,
.theme-black .page-sheet,
.theme-black .turning-leaf,
.theme-black .turning-leaf__face {
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

/* PDF.js Text Layer (Camada invisível sobre o Canvas PDF) */
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
/* PDF.js Text Layer (transparente para exibir o canvas sob a seleção) */
.page-text-layer.textLayer ::selection,
.page-text-layer.textLayer *::selection,
.page-text-layer :deep(.textLayer span::selection),
.page-text-layer :deep(.textLayer ::selection),
.page-text-layer :deep(.textLayer *::selection) {
  background: rgba(229, 123, 85, 0.35) !important;
  color: transparent !important;
}

/* EPUB Native Typography Layer (seleção nítida com texto visível e legível) */
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
