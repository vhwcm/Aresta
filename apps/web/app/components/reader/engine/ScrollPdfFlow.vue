<template>
  <div class="scroll-pdf-flow">
    <div
      v-for="pageNum in totalPages"
      :key="'pdf-page-' + pageNum"
      :ref="(el) => setSlotRef(el as HTMLElement, pageNum)"
      class="scroll-page-slot shadow-md transition-shadow"
      :data-page-number="pageNum"
      :style="{
        minHeight: `${getPageHeight(pageNum)}px`,
        backgroundColor: '#ffffff',
      }"
    >
      <!-- Se a página estiver visível -->
      <template v-if="visiblePages[pageNum]">
        <canvas
          :ref="(el) => setCanvasRef(el as HTMLCanvasElement, pageNum)"
          class="scroll-page-canvas"
          aria-hidden="true"
        />
        <div
          :ref="(el) => setTextLayerRef(el as HTMLElement, pageNum)"
          class="scroll-page-text-layer"
          @click="$emit('highlight-click', $event)"
        />
        <slot name="focus-overlay" :page-num="pageNum" />
      </template>

      <!-- Placeholder suave enquanto fora da viewport -->
      <div
        v-else
        class="scroll-page-placeholder flex flex-col items-center justify-center select-none"
        :style="{ height: `${getPageHeight(pageNum)}px` }"
      >
        <span class="text-xs font-technical opacity-40">
          Página {{ pageNum }} de {{ totalPages }}
        </span>
      </div>

      <!-- Badge sutil de número da página -->
      <div class="scroll-page-slot__badge" aria-hidden="true">
        {{ pageNum }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import type { IBookDocument } from '~/interfaces/reader/IBookDocument'
import { PdfRenderWindow } from '~/utils/reader/pdf/pdfRenderWindow'

const props = defineProps<{
  document: IBookDocument | null
  totalPages: number
  visiblePages: Record<number, boolean>
  containerWidth: number
}>()

const emit = defineEmits<{
  (_e: 'slot-ref', _el: HTMLElement | null, _pageNum: number): void
  (_e: 'canvas-ref', _el: HTMLCanvasElement | null, _pageNum: number): void
  (_e: 'text-layer-ref', _el: HTMLElement | null, _pageNum: number): void
  (_e: 'highlight-click', _e2: MouseEvent): void
}>()

const renderWindow = new PdfRenderWindow(props.totalPages || 1, 6)

watch(
  () => props.totalPages,
  (total) => {
    renderWindow.setTotalPages(total || 1)
  }
)

function getPageHeight(pageNum: number): number {
  const containerW = props.containerWidth || 800
  const aspect = props.document?.getAspectRatio?.(pageNum) || 0.707
  return Math.round(containerW / Math.max(0.2, aspect))
}

function setSlotRef(el: HTMLElement | null, pageNum: number) {
  emit('slot-ref', el, pageNum)
}

function setCanvasRef(el: HTMLCanvasElement | null, pageNum: number) {
  emit('canvas-ref', el, pageNum)
}

function setTextLayerRef(el: HTMLElement | null, pageNum: number) {
  emit('text-layer-ref', el, pageNum)
}

onUnmounted(() => {
  renderWindow.clear()
})

defineExpose({
  renderWindow,
  getPageHeight,
})
</script>

<style scoped>
.scroll-pdf-flow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
}

.scroll-page-slot {
  position: relative;
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.scroll-page-canvas {
  display: block;
  width: 100%;
  height: auto;
}

.scroll-page-text-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.scroll-page-slot__badge {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 9999px;
  pointer-events: none;
  opacity: 0.6;
  background: rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(4px);
}
</style>
