<template>
  <div
    class="canvas-inking-overlay absolute inset-0 w-full h-full pointer-events-none z-30"
  >
    <!-- Drawing HTML5 Canvas Layer (Pointer Events active when in Pen Mode) -->
    <canvas
      ref="drawingCanvasRef"
      class="absolute inset-0 w-full h-full"
      :class="{ 'pointer-events-auto cursor-crosshair': activeTool === 'pen' }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
    ></canvas>

    <!-- Floating Action Pill for AI Handwriting Transcription -->
    <div
      v-if="hasStrokes && boundingBox && !isDrawing"
      class="absolute pointer-events-auto flex items-center gap-2 p-1.5 rounded-xl bg-bgPanel/95 border border-primary/40 shadow-2xl backdrop-blur-md z-40 transition-all animate-in fade-in zoom-in-95 duration-150"
      :style="{
        left: `${screenPillPosition.x}px`,
        top: `${screenPillPosition.y}px`,
      }"
    >
      <!-- Transcribe Button -->
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primaryHover text-white text-xs font-semibold shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
        :disabled="isTranscribing"
        @click.stop="handleTranscribe"
      >
        <svg
          v-if="isTranscribing"
          class="w-3.5 h-3.5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
        <span v-else class="text-sm">✨</span>
        <span>{{ isTranscribing ? 'Transcrevendo...' : 'Transcrever com IA' }}</span>
      </button>

      <!-- Clear Button -->
      <button
        class="p-1.5 rounded-lg bg-bgElevated hover:bg-bgSurface text-textSecondary hover:text-textPrimary transition-colors text-xs"
        title="Descartar desenho"
        :disabled="isTranscribing"
        @click.stop="clearStrokes"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useCanvasInking } from '~/composables/useCanvasInking';
import type { CanvasViewport } from '~/interfaces/canvas';

const props = defineProps<{
  activeTool: string;
  viewport: CanvasViewport;
}>();

const emit = defineEmits<{
  (e: 'transcribed', result: { text: string; x: number; y: number; width: number; height: number }): void;
}>();

const drawingCanvasRef = ref<HTMLCanvasElement | null>(null);

const {
  isDrawing,
  strokes,
  hasStrokes,
  boundingBox,
  isTranscribing,
  startStroke,
  addPoint,
  endStroke,
  clearStrokes,
  transcribeCurrentStrokes,
} = useCanvasInking();

// Screen coordinates for positioning the floating action pill
const screenPillPosition = computed(() => {
  if (!boundingBox.value) return { x: 0, y: 0 };
  const { maxX, maxY } = boundingBox.value;
  const screenX = maxX * props.viewport.zoom + props.viewport.x + 12;
  const screenY = maxY * props.viewport.zoom + props.viewport.y + 12;
  return {
    x: Math.max(16, Math.min(screenX, window.innerWidth - 220)),
    y: Math.max(16, Math.min(screenY, window.innerHeight - 80)),
  };
});

const getCanvasCoordinates = (e: PointerEvent): { x: number; y: number } => {
  if (!drawingCanvasRef.value) return { x: 0, y: 0 };
  const rect = drawingCanvasRef.value.getBoundingClientRect();
  const screenX = e.clientX - rect.left;
  const screenY = e.clientY - rect.top;
  return {
    x: (screenX - props.viewport.x) / props.viewport.zoom,
    y: (screenY - props.viewport.y) / props.viewport.zoom,
  };
};

const redraw = () => {
  const canvas = drawingCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  // Aplicar transformação do Viewport
  ctx.translate(props.viewport.x, props.viewport.y);
  ctx.scale(props.viewport.zoom, props.viewport.zoom);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const stroke of strokes.value) {
    if (stroke.points.length < 2) continue;
    ctx.strokeStyle = stroke.color || '#E57B55';
    ctx.lineWidth = stroke.width || 3;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  }

  ctx.restore();
};

const onPointerDown = (e: PointerEvent) => {
  if (props.activeTool !== 'pen') return;
  (e.target as HTMLElement).setPointerCapture(e.pointerId);
  const coords = getCanvasCoordinates(e);
  startStroke(coords);
  redraw();
};

const onPointerMove = (e: PointerEvent) => {
  if (!isDrawing.value || props.activeTool !== 'pen') return;
  const coords = getCanvasCoordinates(e);
  addPoint(coords);
  redraw();
};

const onPointerUp = (e: PointerEvent) => {
  if (!isDrawing.value) return;
  endStroke();
  redraw();
};

const handleTranscribe = async () => {
  const result = await transcribeCurrentStrokes();
  if (result) {
    emit('transcribed', {
      text: result.text,
      x: result.bbox.minX,
      y: result.bbox.minY,
      width: Math.max(result.bbox.width, 240),
      height: Math.max(result.bbox.height, 140),
    });
    redraw();
  }
};

// Resize listener
const resizeCanvas = () => {
  if (!drawingCanvasRef.value) return;
  drawingCanvasRef.value.width = drawingCanvasRef.value.offsetWidth;
  drawingCanvasRef.value.height = drawingCanvasRef.value.offsetHeight;
  redraw();
};

watch(
  () => [props.viewport.x, props.viewport.y, props.viewport.zoom, strokes.value],
  () => {
    redraw();
  },
  { deep: true }
);

onMounted(() => {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas);
});
</script>
