<template>
  <svg
    class="canvas-stroke-layer absolute inset-0 w-full h-full pointer-events-none overflow-visible z-15 select-none"
    shape-rendering="geometricPrecision"
  >
    <!-- Traços Concluídos e Persistidos -->
    <g class="persisted-strokes">
      <path
        v-for="stroke in renderedStrokes"
        :key="stroke.id"
        :d="stroke.path"
        :fill="stroke.color"
        :opacity="stroke.opacity"
        :style="stroke.style"
        class="transition-opacity duration-150"
      />
    </g>

    <!-- Traço Ativo em Andamento (Tempo Real) -->
    <g v-if="activeStrokePath" class="active-stroke">
      <path
        :d="activeStrokePath"
        :fill="activeStroke?.color || '#E57B55'"
        :opacity="activeStroke?.opacity || 1"
        :style="activeStroke?.tool === 'highlighter' ? 'mix-blend-mode: multiply;' : ''"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { InkingStroke } from '~/interfaces/canvas';
import { computeVectorStrokePath } from '~/utils/vectorDrawing';

const props = withDefaults(
  defineProps<{
    strokes: InkingStroke[];
    activeStroke?: InkingStroke | null;
  }>(),
  {
    strokes: () => [],
    activeStroke: null,
  }
);

const renderedStrokes = computed(() => {
  return props.strokes.map((stroke, index) => {
    const path = stroke.path || computeVectorStrokePath(stroke.points, stroke.tool || 'pen', stroke.width || 3);
    return {
      id: stroke.id || `persisted-stroke-${index}`,
      path,
      color: stroke.color || '#E57B55',
      opacity: stroke.opacity ?? (stroke.tool === 'highlighter' ? 0.4 : 1),
      style: stroke.tool === 'highlighter' ? 'mix-blend-mode: multiply;' : '',
    };
  });
});

const activeStrokePath = computed(() => {
  if (!props.activeStroke || !props.activeStroke.points.length) return '';
  return computeVectorStrokePath(
    props.activeStroke.points,
    props.activeStroke.tool || 'pen',
    props.activeStroke.width || 3
  );
});
</script>
