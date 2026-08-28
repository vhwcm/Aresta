<template>
  <div
    class="w-full h-full relative flex items-center justify-center select-none"
    @dblclick.stop="startEditing"
  >
    <!-- SVG Vector Shape Background -->
    <svg
      class="absolute inset-0 w-full h-full pointer-events-none drop-shadow-md"
      :viewBox="`0 0 ${node.width} ${node.height}`"
    >
      <!-- Rectangle -->
      <rect
        v-if="shapeType === 'rectangle'"
        x="2"
        y="2"
        :width="node.width - 4"
        :height="node.height - 4"
        rx="6"
        :fill="fillColor"
        :stroke="strokeColor"
        stroke-width="2"
      />

      <!-- Rounded Rectangle / Pill -->
      <rect
        v-else-if="shapeType === 'rounded'"
        x="2"
        y="2"
        :width="node.width - 4"
        :height="node.height - 4"
        :rx="Math.min(node.width, node.height) / 3"
        :fill="fillColor"
        :stroke="strokeColor"
        stroke-width="2"
      />

      <!-- Ellipse / Circle -->
      <ellipse
        v-else-if="shapeType === 'ellipse'"
        :cx="node.width / 2"
        :cy="node.height / 2"
        :rx="node.width / 2 - 3"
        :ry="node.height / 2 - 3"
        :fill="fillColor"
        :stroke="strokeColor"
        stroke-width="2"
      />

      <!-- Diamond / Losango -->
      <polygon
        v-else-if="shapeType === 'diamond'"
        :points="`${node.width / 2},3 ${node.width - 3},${node.height / 2} ${node.width / 2},${node.height - 3} 3,${node.height / 2}`"
        :fill="fillColor"
        :stroke="strokeColor"
        stroke-width="2"
      />

      <!-- Triangle -->
      <polygon
        v-else-if="shapeType === 'triangle'"
        :points="`${node.width / 2},4 ${node.width - 4},${node.height - 4} 4,${node.height - 4}`"
        :fill="fillColor"
        :stroke="strokeColor"
        stroke-width="2"
      />
    </svg>

    <!-- Shape Content / Text Center -->
    <div
      class="relative z-10 p-4 w-full h-full flex items-center justify-center text-center overflow-hidden"
      :class="{ 'pt-8': shapeType === 'triangle' }"
    >
      <div v-if="isEditing" class="w-full max-h-full flex flex-col items-center">
        <textarea
          ref="textareaRef"
          v-model="localText"
          class="w-full bg-transparent text-textPrimary text-sm text-center resize-none focus:outline-none font-interface"
          placeholder="Texto da forma..."
          @blur="finishEditing"
          @keydown.esc="finishEditing"
          @keydown.enter.exact.prevent="finishEditing"
        ></textarea>
      </div>

      <div
        v-else
        class="text-textPrimary text-sm font-medium leading-snug break-words max-h-full overflow-hidden"
      >
        <span v-if="node.text">{{ node.text }}</span>
        <span v-else class="text-textSecondary/40 italic text-xs">Forma vazia</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import type { CanvasNode, CanvasShapeType } from '~/interfaces/canvas';

const props = defineProps<{
  node: CanvasNode;
  isSelected?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:text', text: string): void;
}>();

const isEditing = ref(false);
const localText = ref(props.node.text || '');
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const shapeType = computed<CanvasShapeType>(() => props.node.shape || 'rectangle');

const strokeColor = computed(() => {
  if (props.isSelected) return '#E57B55';
  return props.node.color || '#3F3F46';
});

const fillColor = computed(() => {
  if (props.node.color) {
    return `${props.node.color}22`; // 13% opacity
  }
  return '#18181BEE';
});

const startEditing = () => {
  localText.value = props.node.text || '';
  isEditing.value = true;
  nextTick(() => {
    textareaRef.value?.focus();
    textareaRef.value?.select();
  });
};

const finishEditing = () => {
  if (!isEditing.value) return;
  isEditing.value = false;
  emit('update:text', localText.value);
};
</script>
