<template>
  <div
    v-if="selectedCount > 1"
    class="canvas-selection-toolbar absolute z-30 flex items-center gap-1 px-2 py-1.5 rounded-xl bg-bgPanel/95 border border-divider shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
    :style="toolbarStyle"
    @pointerdown.stop
  >
    <!-- Color circles -->
    <button
      v-for="color in colors"
      :key="color"
      class="w-4 h-4 rounded-full border-2 border-white/50 hover:scale-125 transition-transform cursor-pointer flex-shrink-0 hover:border-white/80"
      :style="{ backgroundColor: color }"
      :title="`Colorir seleção com ${color}`"
      @click="$emit('color-selected', color)"
    />

    <div class="w-px h-4 bg-divider mx-0.5" />

    <!-- Delete button -->
    <button
      class="flex items-center justify-center w-6 h-6 rounded-lg hover:bg-red-500/15 text-textSecondary hover:text-red-500 transition-colors cursor-pointer flex-shrink-0"
      title="Deletar selecionados"
      @click="$emit('delete-selected')"
    >
      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CanvasNode, CanvasViewport } from '~/interfaces/canvas';

const props = defineProps<{
  selectedNodes: CanvasNode[];
  selectedCount: number;
  viewport: CanvasViewport;
}>();

defineEmits<{
  (e: 'color-selected', color: string): void;
  (e: 'delete-selected'): void;
}>();

const colors = ['#E57B55', '#10B981', '#3B82F6', '#8B5CF6'];

const toolbarStyle = computed(() => {
  if (props.selectedNodes.length === 0) return { display: 'none' };

  // Calculate bounding box of selected nodes in canvas coords
  let minX = Infinity, minY = Infinity, maxX = -Infinity;
  for (const node of props.selectedNodes) {
    if (node.x < minX) minX = node.x;
    if (node.y < minY) minY = node.y;
    if (node.x + node.width > maxX) maxX = node.x + node.width;
  }

  // Convert canvas coords to screen coords
  const centerX = ((minX + maxX) / 2) * props.viewport.zoom + props.viewport.x;
  const topY = minY * props.viewport.zoom + props.viewport.y;

  return {
    left: `${centerX}px`,
    top: `${topY - 44}px`,
    transform: 'translateX(-50%)',
  };
});
</script>
