<template>
  <div
    class="canvas-node absolute cursor-move select-none group touch-none"
    :class="{ 'z-20': isSelected, 'z-10': !isSelected }"
    :style="{
      transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
      width: `${node.width}px`,
      height: `${node.height}px`,
    }"
    @pointerdown.stop="onPointerDown"
  >
    <!-- Node Content based on type -->
    <CanvasNodeText
      v-if="node.type === 'text' || node.type === 'loose_text'"
      :node="node"
      :is-selected="isSelected"
      @update:text="$emit('update-text', node.id, $event)"
    />

    <CanvasNodeShape
      v-else-if="node.type === 'shape'"
      :node="node"
      :is-selected="isSelected"
      @update:text="$emit('update-text', node.id, $event)"
    />

    <CanvasNodeBook
      v-else-if="node.type === 'book'"
      :node="node"
      :is-selected="isSelected"
    />

    <CanvasNodeNote
      v-else-if="node.type === 'note_embed'"
      :node="node"
      :is-selected="isSelected"
    />

    <!-- 4 Connection Anchors (Obsidian Style: Top, Right, Bottom, Left) -->
    <div
      v-for="side in anchorSides"
      :key="side"
      class="connection-anchor absolute z-30 transition-all"
      :class="[
        getAnchorPositionClass(side),
        isSelected || isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto'
      ]"
      @pointerdown.stop="onAnchorPointerDown(side, $event)"
    >
      <div
        class="w-4 h-4 rounded-full bg-primary border-2 border-white dark:border-zinc-900 shadow-md hover:scale-125 transition-transform flex items-center justify-center cursor-crosshair group/anchor"
        :title="`Conectar (${side})`"
      >
        <div class="w-1.5 h-1.5 rounded-full bg-white opacity-90"></div>
      </div>
    </div>

    <!-- Resize Handles (When Selected) -->
    <template v-if="isSelected">
      <!-- Bottom-Right Resize Handle -->
      <div
        class="resize-handle absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white dark:border-zinc-900 shadow cursor-nwse-resize z-30 hover:scale-125 transition-transform"
        @pointerdown.stop="onResizePointerDown('se', $event)"
      ></div>

      <!-- Bottom-Left Resize Handle -->
      <div
        class="resize-handle absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white dark:border-zinc-900 shadow cursor-nesw-resize z-30 hover:scale-125 transition-transform"
        @pointerdown.stop="onResizePointerDown('sw', $event)"
      ></div>

      <!-- Top-Right Resize Handle -->
      <div
        class="resize-handle absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white dark:border-zinc-900 shadow cursor-nesw-resize z-30 hover:scale-125 transition-transform"
        @pointerdown.stop="onResizePointerDown('ne', $event)"
      ></div>

      <!-- Top-Left Resize Handle -->
      <div
        class="resize-handle absolute -top-1.5 -left-1.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white dark:border-zinc-900 shadow cursor-nwse-resize z-30 hover:scale-125 transition-transform"
        @pointerdown.stop="onResizePointerDown('nw', $event)"
      ></div>

      <!-- Node Mini Floating Toolbar (Color & Delete) -->
      <div
        class="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bgPanel/95 border border-divider shadow-xl backdrop-blur-md z-40"
        @pointerdown.stop
      >
        <!-- Color Dots -->
        <button
          v-for="c in colorOptions"
          :key="c"
          class="w-4 h-4 rounded-full border border-white/20 transition-transform hover:scale-110"
          :style="{ backgroundColor: c }"
          @click.stop="$emit('update-color', node.id, c)"
        ></button>

        <div class="w-px h-3.5 bg-divider mx-0.5"></div>

        <!-- Delete Button -->
        <button
          class="p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors text-xs"
          title="Excluir nó (Del)"
          @click.stop="$emit('delete', node.id)"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { CanvasNode, CanvasSide } from '~/interfaces/canvas';
import CanvasNodeText from './CanvasNodeText.vue';
import CanvasNodeShape from './CanvasNodeShape.vue';
import CanvasNodeBook from './CanvasNodeBook.vue';
import CanvasNodeNote from './CanvasNodeNote.vue';

const props = defineProps<{
  node: CanvasNode;
  isSelected?: boolean;
  zoom: number;
}>();

const emit = defineEmits<{
  (e: 'select', id: string, isShift: boolean): void;
  (e: 'drag-start', id: string, event: PointerEvent): void;
  (e: 'resize-start', id: string, handle: string, event: PointerEvent): void;
  (e: 'start-connect', nodeId: string, side: CanvasSide, event: PointerEvent): void;
  (e: 'update-text', id: string, text: string): void;
  (e: 'update-color', id: string, color: string): void;
  (e: 'delete', id: string): void;
}>();

const isHovered = ref(false);
const anchorSides: CanvasSide[] = ['top', 'right', 'bottom', 'left'];

const colorOptions = [
  '#E57B55', // Primary Terracotta
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
];

const getAnchorPositionClass = (side: CanvasSide): string => {
  switch (side) {
    case 'top':
      return '-top-2 left-1/2 -translate-x-1/2';
    case 'right':
      return '-right-2 top-1/2 -translate-y-1/2';
    case 'bottom':
      return '-bottom-2 left-1/2 -translate-x-1/2';
    case 'left':
      return '-left-2 top-1/2 -translate-y-1/2';
  }
};

const onPointerDown = (e: PointerEvent) => {
  emit('select', props.node.id, e.shiftKey);
  emit('drag-start', props.node.id, e);
};

const onAnchorPointerDown = (side: CanvasSide, e: PointerEvent) => {
  emit('start-connect', props.node.id, side, e);
};

const onResizePointerDown = (handle: string, e: PointerEvent) => {
  emit('resize-start', props.node.id, handle, e);
};
</script>
