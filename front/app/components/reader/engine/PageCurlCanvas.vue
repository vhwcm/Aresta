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
      <!-- ================= SPREAD DE BASE (PÁGINAS SUBJACENTES FIXAS) ================= -->
      <div
        v-if="store.document"
        class="spread-container spread-container--base"
        :style="{ backgroundColor: themeBgColor }"
      >
        <!-- MODO 2 PÁGINAS: BASE -->
        <template v-if="pageLayout.isTwoPage">
          <!-- Página Esquerda Base (Subjacente / Revelada no Previous) -->
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
            <!-- Sombra de sobreposição quando a folha gira sobre a esquerda -->
            <div
              class="page-underlying-shadow page-underlying-shadow--left"
              :style="{ opacity: isTurningPrev ? castShadowOpacity : 0 }"
            />
          </div>

          <!-- Lombada Central Fixa -->
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

          <!-- Página Direita Base (Subjacente / Revelada no Next) -->
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
            <!-- Sombra de sobreposição quando a folha gira sobre a direita -->
            <div
              class="page-underlying-shadow page-underlying-shadow--right"
              :style="{ opacity: isTurningNext ? castShadowOpacity : 0 }"
            />
          </div>
        </template>

        <!-- MODO 1 PÁGINA: BASE -->
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
              :style="{ opacity: isAnimating3D ? castShadowOpacity : 0 }"
            />
          </div>
        </template>
      </div>

      <!-- ================= FOLHAS 3D EM MOVIMENTO (THE 3D CURVED PAPER MESH) ================= -->
      <!-- CASO 1: MODO 2 PÁGINAS -->
      <template v-if="store.document && pageLayout.isTwoPage">
        <!-- 1.1 Folha Curvada Direita (Avançar Página - NEXT) -->
        <div
          v-if="pageLayout.rightPage && pageLayout.rightPage.pageNumber > 0"
          class="curved-paper-stage"
          :class="{ 'curved-paper-stage--active': isTurningNext }"
          :style="{
            left: `${pageLayout.rightPage.left}px`,
            top: `${pageLayout.rightPage.top}px`,
            width: `${pageLayout.rightPage.width}px`,
            height: `${pageLayout.rightPage.height}px`,
            zIndex: isTurningNext ? 35 : (isTurningPrev ? 10 : 20),
            pointerEvents: isTurningNext ? 'none' : 'auto',
          }"
        >
          <!-- Segmento 0 (25% próximo à lombada) -->
          <div class="mesh-segment mesh-segment--0" :style="nextSeg0Style">
            <div class="mesh-segment__face mesh-segment__face--front">
              <div class="slice-inner" :style="{ transform: 'translateX(0%)', width: `${pageLayout.rightPage.width}px` }">
                <canvas v-if="store.document?.type === 'pdf'" ref="rightCanvasRef" class="page-pdf-canvas" />
                <div ref="rightTextLayerRef" class="page-text-layer page-text-layer--right" />
              </div>
              <div class="page-curl-shading" :style="{ opacity: isTurningNext ? curlShadowOpacity * 0.5 : 0 }" />
            </div>
            <div class="mesh-segment__face mesh-segment__face--back">
              <div class="slice-inner" :style="{ transform: 'translateX(-75%)', width: `${pageLayout.rightPage.width}px` }">
                <canvas v-if="store.document?.type === 'pdf'" ref="incomingLeftCanvasRef" class="page-pdf-canvas" />
                <div ref="incomingLeftTextLayerRef" class="page-text-layer page-text-layer--left" />
              </div>
              <div class="page-curl-shading" :style="{ opacity: isTurningNext ? curlShadowOpacity * 0.5 : 0 }" />
            </div>

            <!-- Segmento 1 (Filho do Seg 0) -->
            <div class="mesh-segment mesh-segment--child" :style="nextSeg1Style">
              <div class="mesh-segment__face mesh-segment__face--front">
                <div class="slice-inner" :style="{ transform: 'translateX(-25%)', width: `${pageLayout.rightPage.width}px` }">
                  <canvas v-if="store.document?.type === 'pdf'" ref="seg1FrontCanvasRef" class="page-pdf-canvas" />
                  <div ref="seg1FrontTextRef" class="page-text-layer page-text-layer--right" />
                </div>
                <div class="page-curl-shading" :style="{ opacity: isTurningNext ? curlShadowOpacity * 0.8 : 0 }" />
              </div>
              <div class="mesh-segment__face mesh-segment__face--back">
                <div class="slice-inner" :style="{ transform: 'translateX(-50%)', width: `${pageLayout.rightPage.width}px` }">
                  <canvas v-if="store.document?.type === 'pdf'" ref="seg1BackCanvasRef" class="page-pdf-canvas" />
                  <div ref="seg1BackTextRef" class="page-text-layer page-text-layer--left" />
                </div>
                <div class="page-curl-shading" :style="{ opacity: isTurningNext ? curlShadowOpacity * 0.8 : 0 }" />
              </div>

              <!-- Segmento 2 (Filho do Seg 1) -->
              <div class="mesh-segment mesh-segment--child" :style="nextSeg2Style">
                <div class="mesh-segment__face mesh-segment__face--front">
                  <div class="slice-inner" :style="{ transform: 'translateX(-50%)', width: `${pageLayout.rightPage.width}px` }">
                    <canvas v-if="store.document?.type === 'pdf'" ref="seg2FrontCanvasRef" class="page-pdf-canvas" />
                    <div ref="seg2FrontTextRef" class="page-text-layer page-text-layer--right" />
                  </div>
                  <div class="page-curl-shading" :style="{ opacity: isTurningNext ? curlShadowOpacity : 0 }" />
                </div>
                <div class="mesh-segment__face mesh-segment__face--back">
                  <div class="slice-inner" :style="{ transform: 'translateX(-25%)', width: `${pageLayout.rightPage.width}px` }">
                    <canvas v-if="store.document?.type === 'pdf'" ref="seg2BackCanvasRef" class="page-pdf-canvas" />
                    <div ref="seg2BackTextRef" class="page-text-layer page-text-layer--left" />
                  </div>
                  <div class="page-curl-shading" :style="{ opacity: isTurningNext ? curlShadowOpacity : 0 }" />
                </div>

                <!-- Segmento 3 (Filho do Seg 2 - Canto Externo onde o mouse puxa) -->
                <div class="mesh-segment mesh-segment--child" :style="nextSeg3Style">
                  <div class="mesh-segment__face mesh-segment__face--front">
                    <div class="slice-inner" :style="{ transform: 'translateX(-75%)', width: `${pageLayout.rightPage.width}px` }">
                      <canvas v-if="store.document?.type === 'pdf'" ref="seg3FrontCanvasRef" class="page-pdf-canvas" />
                      <div ref="seg3FrontTextRef" class="page-text-layer page-text-layer--right" />
                    </div>
                    <div class="page-curl-shading" :style="{ opacity: isTurningNext ? curlShadowOpacity * 0.6 : 0 }" />
                  </div>
                  <div class="mesh-segment__face mesh-segment__face--back">
                    <div class="slice-inner" :style="{ transform: 'translateX(0%)', width: `${pageLayout.rightPage.width}px` }">
                      <canvas v-if="store.document?.type === 'pdf'" ref="seg3BackCanvasRef" class="page-pdf-canvas" />
                      <div ref="seg3BackTextRef" class="page-text-layer page-text-layer--left" />
                    </div>
                    <div class="page-curl-shading" :style="{ opacity: isTurningNext ? curlShadowOpacity * 0.6 : 0 }" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 1.2 Folha Curvada Esquerda (Voltar Página - PREVIOUS) -->
        <div
          v-if="pageLayout.leftPage && pageLayout.leftPage.pageNumber > 0"
          class="curved-paper-stage curved-paper-stage--prev"
          :class="{ 'curved-paper-stage--active': isTurningPrev }"
          :style="{
            left: `${pageLayout.leftPage.left}px`,
            top: `${pageLayout.leftPage.top}px`,
            width: `${pageLayout.leftPage.width}px`,
            height: `${pageLayout.leftPage.height}px`,
            zIndex: isTurningPrev ? 35 : (isTurningNext ? 10 : 20),
            pointerEvents: isTurningPrev ? 'none' : 'auto',
          }"
        >
          <!-- Segmento 0 (25% próximo à lombada) -->
          <div class="mesh-segment mesh-segment--0 mesh-segment--prev-origin" :style="prevSeg0Style">
            <div class="mesh-segment__face mesh-segment__face--front">
              <div class="slice-inner" :style="{ transform: 'translateX(-75%)', width: `${pageLayout.leftPage.width}px` }">
                <canvas v-if="store.document?.type === 'pdf'" ref="leftCanvasRef" class="page-pdf-canvas" />
                <div ref="leftTextLayerRef" class="page-text-layer page-text-layer--left" />
              </div>
              <div class="page-curl-shading" :style="{ opacity: isTurningPrev ? curlShadowOpacity * 0.5 : 0 }" />
            </div>
            <div class="mesh-segment__face mesh-segment__face--back">
              <div class="slice-inner" :style="{ transform: 'translateX(0%)', width: `${pageLayout.leftPage.width}px` }">
                <canvas v-if="store.document?.type === 'pdf'" ref="incomingRightCanvasRef" class="page-pdf-canvas" />
                <div ref="incomingRightTextLayerRef" class="page-text-layer page-text-layer--right" />
              </div>
              <div class="page-curl-shading" :style="{ opacity: isTurningPrev ? curlShadowOpacity * 0.5 : 0 }" />
            </div>

            <!-- Segmento 1 Esquerda -->
            <div class="mesh-segment mesh-segment--child-prev" :style="prevSeg1Style">
              <div class="mesh-segment__face mesh-segment__face--front">
                <div class="slice-inner" :style="{ transform: 'translateX(-50%)', width: `${pageLayout.leftPage.width}px` }">
                  <canvas v-if="store.document?.type === 'pdf'" ref="prevSeg1FrontCanvasRef" class="page-pdf-canvas" />
                  <div ref="prevSeg1FrontTextRef" class="page-text-layer page-text-layer--left" />
                </div>
                <div class="page-curl-shading" :style="{ opacity: isTurningPrev ? curlShadowOpacity * 0.8 : 0 }" />
              </div>
              <div class="mesh-segment__face mesh-segment__face--back">
                <div class="slice-inner" :style="{ transform: 'translateX(-25%)', width: `${pageLayout.leftPage.width}px` }">
                  <canvas v-if="store.document?.type === 'pdf'" ref="prevSeg1BackCanvasRef" class="page-pdf-canvas" />
                  <div ref="prevSeg1BackTextRef" class="page-text-layer page-text-layer--right" />
                </div>
                <div class="page-curl-shading" :style="{ opacity: isTurningPrev ? curlShadowOpacity * 0.8 : 0 }" />
              </div>

              <!-- Segmento 2 Esquerda -->
              <div class="mesh-segment mesh-segment--child-prev" :style="prevSeg2Style">
                <div class="mesh-segment__face mesh-segment__face--front">
                  <div class="slice-inner" :style="{ transform: 'translateX(-25%)', width: `${pageLayout.leftPage.width}px` }">
                    <canvas v-if="store.document?.type === 'pdf'" ref="prevSeg2FrontCanvasRef" class="page-pdf-canvas" />
                    <div ref="prevSeg2FrontTextRef" class="page-text-layer page-text-layer--left" />
                  </div>
                  <div class="page-curl-shading" :style="{ opacity: isTurningPrev ? curlShadowOpacity : 0 }" />
                </div>
                <div class="mesh-segment__face mesh-segment__face--back">
                  <div class="slice-inner" :style="{ transform: 'translateX(-50%)', width: `${pageLayout.leftPage.width}px` }">
                    <canvas v-if="store.document?.type === 'pdf'" ref="prevSeg2BackCanvasRef" class="page-pdf-canvas" />
                    <div ref="prevSeg2BackTextRef" class="page-text-layer page-text-layer--right" />
                  </div>
                  <div class="page-curl-shading" :style="{ opacity: isTurningPrev ? curlShadowOpacity : 0 }" />
                </div>

                <!-- Segmento 3 Esquerda (Canto Externo onde o mouse puxa) -->
                <div class="mesh-segment mesh-segment--child-prev" :style="prevSeg3Style">
                  <div class="mesh-segment__face mesh-segment__face--front">
                    <div class="slice-inner" :style="{ transform: 'translateX(0%)', width: `${pageLayout.leftPage.width}px` }">
                      <canvas v-if="store.document?.type === 'pdf'" ref="prevSeg3FrontCanvasRef" class="page-pdf-canvas" />
                      <div ref="prevSeg3FrontTextRef" class="page-text-layer page-text-layer--left" />
                    </div>
                    <div class="page-curl-shading" :style="{ opacity: isTurningPrev ? curlShadowOpacity * 0.6 : 0 }" />
                  </div>
                  <div class="mesh-segment__face mesh-segment__face--back">
                    <div class="slice-inner" :style="{ transform: 'translateX(-75%)', width: `${pageLayout.leftPage.width}px` }">
                      <canvas v-if="store.document?.type === 'pdf'" ref="prevSeg3BackCanvasRef" class="page-pdf-canvas" />
                      <div ref="prevSeg3BackTextRef" class="page-text-layer page-text-layer--right" />
                    </div>
                    <div class="page-curl-shading" :style="{ opacity: isTurningPrev ? curlShadowOpacity * 0.6 : 0 }" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- CASO 2: MODO 1 PÁGINA (MOBILE / CENTRALIZADO) -->
      <template v-else-if="store.document && pageLayout.singlePage && pageLayout.singlePage.pageNumber > 0">
        <div
          class="curved-paper-stage"
          :class="{ 'curved-paper-stage--active': isAnimating3D }"
          :style="{
            left: `${pageLayout.singlePage.left}px`,
            top: `${pageLayout.singlePage.top}px`,
            width: `${pageLayout.singlePage.width}px`,
            height: `${pageLayout.singlePage.height}px`,
            zIndex: isAnimating3D ? 35 : 20,
            pointerEvents: isAnimating3D ? 'none' : 'auto',
          }"
        >
          <div class="mesh-segment mesh-segment--0" :style="nextSeg0Style">
            <div class="mesh-segment__face mesh-segment__face--front">
              <div class="slice-inner" :style="{ transform: 'translateX(0%)', width: `${pageLayout.singlePage.width}px` }">
                <canvas v-if="store.document?.type === 'pdf'" ref="singleCanvasRef" class="page-pdf-canvas" />
                <div ref="singleTextLayerRef" class="page-text-layer page-text-layer--single" />
              </div>
              <div class="page-curl-shading" :style="{ opacity: isAnimating3D ? curlShadowOpacity * 0.5 : 0 }" />
            </div>
            <div class="mesh-segment__face mesh-segment__face--back mesh-segment__face--blank">
              <div class="page-curl-shading" :style="{ opacity: isAnimating3D ? curlShadowOpacity * 0.5 : 0 }" />
            </div>

            <div class="mesh-segment mesh-segment--child" :style="nextSeg1Style">
              <div class="mesh-segment__face mesh-segment__face--front">
                <div class="slice-inner" :style="{ transform: 'translateX(-25%)', width: `${pageLayout.singlePage.width}px` }">
                  <canvas v-if="store.document?.type === 'pdf'" ref="seg1FrontCanvasRef" class="page-pdf-canvas" />
                  <div ref="seg1FrontTextRef" class="page-text-layer page-text-layer--single" />
                </div>
                <div class="page-curl-shading" :style="{ opacity: isAnimating3D ? curlShadowOpacity * 0.8 : 0 }" />
              </div>
              <div class="mesh-segment__face mesh-segment__face--back mesh-segment__face--blank">
                <div class="page-curl-shading" :style="{ opacity: isAnimating3D ? curlShadowOpacity * 0.8 : 0 }" />
              </div>

              <div class="mesh-segment mesh-segment--child" :style="nextSeg2Style">
                <div class="mesh-segment__face mesh-segment__face--front">
                  <div class="slice-inner" :style="{ transform: 'translateX(-50%)', width: `${pageLayout.singlePage.width}px` }">
                    <canvas v-if="store.document?.type === 'pdf'" ref="seg2FrontCanvasRef" class="page-pdf-canvas" />
                    <div ref="seg2FrontTextRef" class="page-text-layer page-text-layer--single" />
                  </div>
                  <div class="page-curl-shading" :style="{ opacity: isAnimating3D ? curlShadowOpacity : 0 }" />
                </div>
                <div class="mesh-segment__face mesh-segment__face--back mesh-segment__face--blank">
                  <div class="page-curl-shading" :style="{ opacity: isAnimating3D ? curlShadowOpacity : 0 }" />
                </div>

                <div class="mesh-segment mesh-segment--child" :style="nextSeg3Style">
                  <div class="mesh-segment__face mesh-segment__face--front">
                    <div class="slice-inner" :style="{ transform: 'translateX(-75%)', width: `${pageLayout.singlePage.width}px` }">
                      <canvas v-if="store.document?.type === 'pdf'" ref="seg3FrontCanvasRef" class="page-pdf-canvas" />
                      <div ref="seg3FrontTextRef" class="page-text-layer page-text-layer--single" />
                    </div>
                    <div class="page-curl-shading" :style="{ opacity: isAnimating3D ? curlShadowOpacity * 0.6 : 0 }" />
                  </div>
                  <div class="mesh-segment__face mesh-segment__face--back mesh-segment__face--blank">
                    <div class="page-curl-shading" :style="{ opacity: isAnimating3D ? curlShadowOpacity * 0.6 : 0 }" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
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

// Refs dos Canvases e TextLayers da Folha Principal (Spread Ativo)
const leftCanvasRef = ref<HTMLCanvasElement | null>(null)
const leftTextLayerRef = ref<HTMLElement | null>(null)
const rightCanvasRef = ref<HTMLCanvasElement | null>(null)
const rightTextLayerRef = ref<HTMLElement | null>(null)
const singleCanvasRef = ref<HTMLCanvasElement | null>(null)
const singleTextLayerRef = ref<HTMLElement | null>(null)

// Refs dos Canvases e TextLayers das Fatias da Malha 3D (Curvatura Física)
const seg1FrontCanvasRef = ref<HTMLCanvasElement | null>(null)
const seg1FrontTextRef = ref<HTMLElement | null>(null)
const seg1BackCanvasRef = ref<HTMLCanvasElement | null>(null)
const seg1BackTextRef = ref<HTMLElement | null>(null)

const seg2FrontCanvasRef = ref<HTMLCanvasElement | null>(null)
const seg2FrontTextRef = ref<HTMLElement | null>(null)
const seg2BackCanvasRef = ref<HTMLCanvasElement | null>(null)
const seg2BackTextRef = ref<HTMLElement | null>(null)

const seg3FrontCanvasRef = ref<HTMLCanvasElement | null>(null)
const seg3FrontTextRef = ref<HTMLElement | null>(null)
const seg3BackCanvasRef = ref<HTMLCanvasElement | null>(null)
const seg3BackTextRef = ref<HTMLElement | null>(null)

// Refs das Fatias do modo Previous
const prevSeg1FrontCanvasRef = ref<HTMLCanvasElement | null>(null)
const prevSeg1FrontTextRef = ref<HTMLElement | null>(null)
const prevSeg1BackCanvasRef = ref<HTMLCanvasElement | null>(null)
const prevSeg1BackTextRef = ref<HTMLElement | null>(null)

const prevSeg2FrontCanvasRef = ref<HTMLCanvasElement | null>(null)
const prevSeg2FrontTextRef = ref<HTMLElement | null>(null)
const prevSeg2BackCanvasRef = ref<HTMLCanvasElement | null>(null)
const prevSeg2BackTextRef = ref<HTMLElement | null>(null)

const prevSeg3FrontCanvasRef = ref<HTMLCanvasElement | null>(null)
const prevSeg3FrontTextRef = ref<HTMLElement | null>(null)
const prevSeg3BackCanvasRef = ref<HTMLCanvasElement | null>(null)
const prevSeg3BackTextRef = ref<HTMLElement | null>(null)

// Refs dos Canvases e TextLayers Subjacentes (Base / Página Revelada)
const baseLeftCanvasRef = ref<HTMLCanvasElement | null>(null)
const baseLeftTextLayerRef = ref<HTMLElement | null>(null)
const baseRightCanvasRef = ref<HTMLCanvasElement | null>(null)
const baseRightTextLayerRef = ref<HTMLElement | null>(null)
const baseSingleCanvasRef = ref<HTMLCanvasElement | null>(null)
const baseSingleTextLayerRef = ref<HTMLElement | null>(null)

// Refs dos Canvases e TextLayers do Verso da Folha 3D
const incomingLeftCanvasRef = ref<HTMLCanvasElement | null>(null)
const incomingLeftTextLayerRef = ref<HTMLElement | null>(null)
const incomingRightCanvasRef = ref<HTMLCanvasElement | null>(null)
const incomingRightTextLayerRef = ref<HTMLElement | null>(null)

const {
  isTransitioning,
  isDragging,
  isPreparing,
  errorMessage,
  pageLayout,
  dragOffset,
  pointerY,
  transitionDirection,
  incomingTargetPage,
  requestTurn,
  beginDrag,
  updateDrag,
  endDrag,
  cancelDrag,
} = useBookPageTurn(stageRef, {
  onBeforeTurn: async (targetPage) => {
    await prepare3DAnimationLayers(targetPage)
  },
  onAfterTurn: async (targetPage) => {
    await renderCurrentSpread(targetPage)
  },
})

const emit = defineEmits<{
  'transition-state': [isTransitioning: boolean]
}>()

const isAnimating3D = computed(() => isTransitioning.value || isDragging.value)
const isTurningNext = computed(() => isAnimating3D.value && transitionDirection.value === 'next')
const isTurningPrev = computed(() => isAnimating3D.value && transitionDirection.value === 'previous')

const hostWidth = computed(() => stageRef.value?.clientWidth || 800)

// Progresso normalizado de 0 a 1 da virada
const turnProgress = computed(() => {
  if (!isAnimating3D.value) return 0
  const w = hostWidth.value
  if (w <= 0) return 0
  return Math.min(1, Math.max(0, Math.abs(dragOffset.value) / w))
})

// Curvatura física por segmentos de malha encadeada (Mesh Curve)
const nextSegAngles = computed(() => {
  const p = turnProgress.value
  if (!isTurningNext.value || p <= 0) {
    return { a0: 0, a1: 0, a2: 0, a3: 0 }
  }

  // Wave de curvatura que começa no canto externo (onde o mouse puxa) e viaja até a lombada
  const p3 = Math.min(1, Math.max(0, p * 2.2))
  const p2 = Math.min(1, Math.max(0, (p - 0.08) * 1.9))
  const p1 = Math.min(1, Math.max(0, (p - 0.18) * 1.7))
  const p0 = Math.min(1, Math.max(0, (p - 0.28) * 1.5))

  const easeOut = (t: number) => 1 - Math.pow(1 - t, 2.2)

  const a3 = -45 * easeOut(p3)
  const a2 = -45 * easeOut(p2)
  const a1 = -45 * easeOut(p1)
  const a0 = -45 * easeOut(p0)

  return { a0, a1, a2, a3 }
})

const nextSeg0Style = computed(() => {
  const { a0 } = nextSegAngles.value
  const normY = pointerY.value ?? 0.5
  const arc = Math.sin(turnProgress.value * Math.PI)
  const tiltZ = (0.5 - normY) * 6 * arc
  return {
    transformOrigin: '0% 50%',
    transform: `perspective(2400px) rotateY(${a0}deg) rotateZ(${tiltZ}deg)`,
  }
})

const nextSeg1Style = computed(() => {
  const { a1 } = nextSegAngles.value
  const normY = pointerY.value ?? 0.5
  const arc = Math.sin(turnProgress.value * Math.PI)
  const tiltZ = (0.5 - normY) * 9 * arc
  return {
    transformOrigin: '0% 50%',
    transform: `rotateY(${a1}deg) rotateZ(${tiltZ}deg)`,
  }
})

const nextSeg2Style = computed(() => {
  const { a2 } = nextSegAngles.value
  const normY = pointerY.value ?? 0.5
  const arc = Math.sin(turnProgress.value * Math.PI)
  const tiltZ = (0.5 - normY) * 14 * arc
  return {
    transformOrigin: '0% 50%',
    transform: `rotateY(${a2}deg) rotateZ(${tiltZ}deg)`,
  }
})

const nextSeg3Style = computed(() => {
  const { a3 } = nextSegAngles.value
  const normY = pointerY.value ?? 0.5
  const arc = Math.sin(turnProgress.value * Math.PI)
  const tiltZ = (0.5 - normY) * 22 * arc
  const tiltX = (normY - 0.5) * 14 * arc
  return {
    transformOrigin: '0% 50%',
    transform: `rotateY(${a3}deg) rotateZ(${tiltZ}deg) rotateX(${tiltX}deg)`,
  }
})

const prevSegAngles = computed(() => {
  const p = turnProgress.value
  if (!isTurningPrev.value || p <= 0) {
    return { a0: 0, a1: 0, a2: 0, a3: 0 }
  }

  const p3 = Math.min(1, Math.max(0, p * 2.2))
  const p2 = Math.min(1, Math.max(0, (p - 0.08) * 1.9))
  const p1 = Math.min(1, Math.max(0, (p - 0.18) * 1.7))
  const p0 = Math.min(1, Math.max(0, (p - 0.28) * 1.5))

  const easeOut = (t: number) => 1 - Math.pow(1 - t, 2.2)

  const a3 = 45 * easeOut(p3)
  const a2 = 45 * easeOut(p2)
  const a1 = 45 * easeOut(p1)
  const a0 = 45 * easeOut(p0)

  return { a0, a1, a2, a3 }
})

const prevSeg0Style = computed(() => {
  const { a0 } = prevSegAngles.value
  const normY = pointerY.value ?? 0.5
  const arc = Math.sin(turnProgress.value * Math.PI)
  const tiltZ = (normY - 0.5) * 6 * arc
  return {
    transformOrigin: '100% 50%',
    transform: `perspective(2400px) rotateY(${a0}deg) rotateZ(${tiltZ}deg)`,
  }
})

const prevSeg1Style = computed(() => {
  const { a1 } = prevSegAngles.value
  const normY = pointerY.value ?? 0.5
  const arc = Math.sin(turnProgress.value * Math.PI)
  const tiltZ = (normY - 0.5) * 9 * arc
  return {
    transformOrigin: '100% 50%',
    transform: `rotateY(${a1}deg) rotateZ(${tiltZ}deg)`,
  }
})

const prevSeg2Style = computed(() => {
  const { a2 } = prevSegAngles.value
  const normY = pointerY.value ?? 0.5
  const arc = Math.sin(turnProgress.value * Math.PI)
  const tiltZ = (normY - 0.5) * 14 * arc
  return {
    transformOrigin: '100% 50%',
    transform: `rotateY(${a2}deg) rotateZ(${tiltZ}deg)`,
  }
})

const prevSeg3Style = computed(() => {
  const { a3 } = prevSegAngles.value
  const normY = pointerY.value ?? 0.5
  const arc = Math.sin(turnProgress.value * Math.PI)
  const tiltZ = (normY - 0.5) * 22 * arc
  const tiltX = (normY - 0.5) * 14 * arc
  return {
    transformOrigin: '100% 50%',
    transform: `rotateY(${a3}deg) rotateZ(${tiltZ}deg) rotateX(${tiltX}deg)`,
  }
})

// Opacidade das sombras dinâmicas de curvatura do papel 3D
const curlShadowOpacity = computed(() => {
  const p = turnProgress.value
  return Math.sin(p * Math.PI) * 0.5
})

const castShadowOpacity = computed(() => {
  const p = turnProgress.value
  return Math.sin(p * Math.PI) * 0.44
})

let activePointerId: number | null = null
let currentRenderVersion = 0

function pointFrom(event: PointerEvent): ReaderPointer {
  const bounds = stageRef.value?.getBoundingClientRect()
  return {
    x: event.clientX - (bounds?.left ?? 0),
    y: event.clientY - (bounds?.top ?? 0),
    time: event.timeStamp,
  }
}

/**
 * Detecta se o pointerdown ocorreu na zona de foliação (bordas externas e cantos),
 * permitindo pegar nas pontas do livro onde não tem texto, igual ao Kindle.
 */
function getTurnZone(event: PointerEvent): PageTurnDirection | null {
  if (!stageRef.value) return null
  const bounds = stageRef.value.getBoundingClientRect()
  const x = event.clientX - bounds.left
  const y = event.clientY - bounds.top
  const layout = pageLayout.value

  const EDGE_MAX_PX = 80
  const EDGE_RATIO = 0.22
  const CORNER_THRESHOLD_Y = 110

  if (layout.isTwoPage) {
    if (layout.leftPage) {
      const edgeWidth = Math.min(EDGE_MAX_PX, layout.leftPage.width * EDGE_RATIO)
      // Borda lateral esquerda
      if (x <= layout.leftPage.left + edgeWidth) {
        return 'previous'
      }
      // Cantos superior e inferior esquerdos
      const isLeftCornerY = y <= layout.leftPage.top + CORNER_THRESHOLD_Y || y >= layout.leftPage.top + layout.leftPage.height - CORNER_THRESHOLD_Y
      if (x <= layout.leftPage.left + layout.leftPage.width * 0.38 && isLeftCornerY) {
        return 'previous'
      }
    }
    if (layout.rightPage) {
      const edgeWidth = Math.min(EDGE_MAX_PX, layout.rightPage.width * EDGE_RATIO)
      // Borda lateral direita
      if (x >= layout.rightPage.left + layout.rightPage.width - edgeWidth) {
        return 'next'
      }
      // Cantos superior e inferior direitos
      const isRightCornerY = y <= layout.rightPage.top + CORNER_THRESHOLD_Y || y >= layout.rightPage.top + layout.rightPage.height - CORNER_THRESHOLD_Y
      if (x >= layout.rightPage.left + layout.rightPage.width * 0.62 && isRightCornerY) {
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
    // Cantos no modo 1 página
    const isCornerY = y <= layout.singlePage.top + CORNER_THRESHOLD_Y || y >= layout.singlePage.top + layout.singlePage.height - CORNER_THRESHOLD_Y
    if (x <= layout.singlePage.left + layout.singlePage.width * 0.35 && isCornerY) {
      return 'previous'
    }
    if (x >= layout.singlePage.left + layout.singlePage.width * 0.65 && isCornerY) {
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

function copyCanvasToSlices(
  sourceCanvas: HTMLCanvasElement | null,
  targetCanvases: (HTMLCanvasElement | null)[],
  sourceTextLayer?: HTMLElement | null,
  targetTextLayers?: (HTMLElement | null)[],
) {
  if (sourceCanvas && sourceCanvas.width > 0 && sourceCanvas.height > 0) {
    for (const target of targetCanvases) {
      if (!target) continue
      target.width = sourceCanvas.width
      target.height = sourceCanvas.height
      target.style.width = sourceCanvas.style.width
      target.style.height = sourceCanvas.style.height
      const ctx = target.getContext('2d', { alpha: false })
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.drawImage(sourceCanvas, 0, 0)
      }
    }
  }

  if (sourceTextLayer && targetTextLayers) {
    for (const targetText of targetTextLayers) {
      if (!targetText) continue
      targetText.innerHTML = sourceTextLayer.innerHTML
      targetText.className = sourceTextLayer.className
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
        leftCanvasRef.value,
        leftTextLayerRef.value,
        layout.leftPage.width,
        layout.leftPage.height,
      )
      copyCanvasToSlices(
        leftCanvasRef.value,
        [prevSeg1FrontCanvasRef.value, prevSeg2FrontCanvasRef.value, prevSeg3FrontCanvasRef.value],
        leftTextLayerRef.value,
        [prevSeg1FrontTextRef.value, prevSeg2FrontTextRef.value, prevSeg3FrontTextRef.value],
      )
    }
    if (rightNum > 0 && layout.rightPage) {
      await renderPageToElement(
        rightNum,
        rightCanvasRef.value,
        rightTextLayerRef.value,
        layout.rightPage.width,
        layout.rightPage.height,
      )
      copyCanvasToSlices(
        rightCanvasRef.value,
        [seg1FrontCanvasRef.value, seg2FrontCanvasRef.value, seg3FrontCanvasRef.value],
        rightTextLayerRef.value,
        [seg1FrontTextRef.value, seg2FrontTextRef.value, seg3FrontTextRef.value],
      )
    }
  } else if (layout.singlePage && curPage > 0) {
    await renderPageToElement(
      curPage,
      singleCanvasRef.value,
      singleTextLayerRef.value,
      layout.singlePage.width,
      layout.singlePage.height,
    )
    copyCanvasToSlices(
      singleCanvasRef.value,
      [seg1FrontCanvasRef.value, seg2FrontCanvasRef.value, seg3FrontCanvasRef.value],
      singleTextLayerRef.value,
      [seg1FrontTextRef.value, seg2FrontTextRef.value, seg3FrontTextRef.value],
    )
  }
}

async function prepare3DAnimationLayers(targetPage: number) {
  if (!store.document || targetPage <= 0) return

  await nextTick()
  const layout = pageLayout.value
  const direction = transitionDirection.value

  if (layout.isTwoPage) {
    const nextLeftNum = targetPage % 2 === 0 ? Math.max(1, targetPage - 1) : targetPage
    const nextRightNum = nextLeftNum + 1 <= store.totalPages ? nextLeftNum + 1 : 0

    if (direction === 'next') {
      // 1. Revelado sob a folha direita: Próxima Página Direita
      if (nextRightNum > 0 && layout.rightPage) {
        await renderPageToElement(
          nextRightNum,
          baseRightCanvasRef.value,
          baseRightTextLayerRef.value,
          layout.rightPage.width,
          layout.rightPage.height,
        )
      }
      // 2. Verso da folha direita que vira para a esquerda: Próxima Página Esquerda
      if (nextLeftNum > 0 && layout.leftPage) {
        await renderPageToElement(
          nextLeftNum,
          incomingLeftCanvasRef.value,
          incomingLeftTextLayerRef.value,
          layout.leftPage.width,
          layout.leftPage.height,
        )
        copyCanvasToSlices(
          incomingLeftCanvasRef.value,
          [seg1BackCanvasRef.value, seg2BackCanvasRef.value, seg3BackCanvasRef.value],
          incomingLeftTextLayerRef.value,
          [seg1BackTextRef.value, seg2BackTextRef.value, seg3BackTextRef.value],
        )
      }
      // 3. Sincroniza frentes da folha direita
      copyCanvasToSlices(
        rightCanvasRef.value,
        [seg1FrontCanvasRef.value, seg2FrontCanvasRef.value, seg3FrontCanvasRef.value],
        rightTextLayerRef.value,
        [seg1FrontTextRef.value, seg2FrontTextRef.value, seg3FrontTextRef.value],
      )
      // 4. Base esquerda mantém a página esquerda atual
      const curLeftNum = store.currentPage % 2 === 0 ? Math.max(1, store.currentPage - 1) : store.currentPage
      if (curLeftNum > 0 && layout.leftPage) {
        void renderPageToElement(
          curLeftNum,
          baseLeftCanvasRef.value,
          baseLeftTextLayerRef.value,
          layout.leftPage.width,
          layout.leftPage.height,
        )
      }
    } else {
      // PREVIOUS
      // 1. Revelado sob a folha esquerda: Próxima Página Esquerda (anterior)
      if (nextLeftNum > 0 && layout.leftPage) {
        await renderPageToElement(
          nextLeftNum,
          baseLeftCanvasRef.value,
          baseLeftTextLayerRef.value,
          layout.leftPage.width,
          layout.leftPage.height,
        )
      }
      // 2. Verso da folha esquerda que vira para a direita: Próxima Página Direita (anterior)
      if (nextRightNum > 0 && layout.rightPage) {
        await renderPageToElement(
          nextRightNum,
          incomingRightCanvasRef.value,
          incomingRightTextLayerRef.value,
          layout.rightPage.width,
          layout.rightPage.height,
        )
        copyCanvasToSlices(
          incomingRightCanvasRef.value,
          [prevSeg1BackCanvasRef.value, prevSeg2BackCanvasRef.value, prevSeg3BackCanvasRef.value],
          incomingRightTextLayerRef.value,
          [prevSeg1BackTextRef.value, prevSeg2BackTextRef.value, prevSeg3BackTextRef.value],
        )
      }
      // 3. Sincroniza frentes da folha esquerda
      copyCanvasToSlices(
        leftCanvasRef.value,
        [prevSeg1FrontCanvasRef.value, prevSeg2FrontCanvasRef.value, prevSeg3FrontCanvasRef.value],
        leftTextLayerRef.value,
        [prevSeg1FrontTextRef.value, prevSeg2FrontTextRef.value, prevSeg3FrontTextRef.value],
      )
      // 4. Base direita mantém a página direita atual
      const curLeftNum = store.currentPage % 2 === 0 ? Math.max(1, store.currentPage - 1) : store.currentPage
      const curRightNum = curLeftNum + 1 <= store.totalPages ? curLeftNum + 1 : 0
      if (curRightNum > 0 && layout.rightPage) {
        void renderPageToElement(
          curRightNum,
          baseRightCanvasRef.value,
          baseRightTextLayerRef.value,
          layout.rightPage.width,
          layout.rightPage.height,
        )
      }
    }
  } else if (layout.singlePage) {
    if (direction === 'next') {
      await renderPageToElement(
        targetPage,
        baseSingleCanvasRef.value,
        baseSingleTextLayerRef.value,
        layout.singlePage.width,
        layout.singlePage.height,
      )
      copyCanvasToSlices(
        singleCanvasRef.value,
        [seg1FrontCanvasRef.value, seg2FrontCanvasRef.value, seg3FrontCanvasRef.value],
        singleTextLayerRef.value,
        [seg1FrontTextRef.value, seg2FrontTextRef.value, seg3FrontTextRef.value],
      )
    } else {
      await renderPageToElement(
        targetPage,
        baseSingleCanvasRef.value,
        baseSingleTextLayerRef.value,
        layout.singlePage.width,
        layout.singlePage.height,
      )
      copyCanvasToSlices(
        singleCanvasRef.value,
        [seg1FrontCanvasRef.value, seg2FrontCanvasRef.value, seg3FrontCanvasRef.value],
        singleTextLayerRef.value,
        [seg1FrontTextRef.value, seg2FrontTextRef.value, seg3FrontTextRef.value],
      )
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
      void prepare3DAnimationLayers(val)
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

.page-sheet--base {
  z-index: 10;
}

.curved-paper-stage {
  position: absolute;
  transform-style: preserve-3d;
  perspective: 2600px;
  perspective-origin: 50% 50%;
  pointer-events: none;
}

.mesh-segment {
  position: absolute;
  top: 0;
  height: 100%;
  transform-style: preserve-3d;
  box-sizing: border-box;
}

.mesh-segment--0 {
  left: 0;
  width: 25%;
}

.mesh-segment--prev-origin {
  left: 75%;
  width: 25%;
}

.mesh-segment--child {
  left: 100%;
  width: 100%;
}

.mesh-segment--child-prev {
  right: 100%;
  width: 100%;
}

.mesh-segment__face {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
  transform-style: preserve-3d;
  box-sizing: border-box;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.mesh-segment__face--front {
  transform: rotateY(0deg) translateZ(1px);
}

.mesh-segment__face--back {
  transform: rotateY(180deg) translateZ(1px);
}

.mesh-segment__face--blank {
  background: inherit;
}

.slice-inner {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  pointer-events: none;
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

.theme-sepia .page-curl-wrapper,
.theme-sepia .book-3d-stage,
.theme-sepia .spread-container,
.theme-sepia .page-sheet,
.theme-sepia .turning-leaf,
.theme-sepia .turning-leaf__face {
  background-color: #f5eedc !important;
}
.theme-white .page-curl-wrapper,
.theme-white .book-3d-stage,
.theme-white .spread-container,
.theme-white .page-sheet,
.theme-white .turning-leaf,
.theme-white .turning-leaf__face {
  background-color: #ffffff !important;
}
.theme-black .page-curl-wrapper,
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
