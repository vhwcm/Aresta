<template>
  <!-- 1. NOTA / CARD (type === 'text') - Bloco retangular estilo card Markdown com Live Preview -->
    <div
      v-if="!isLooseText"
      class="w-full h-full flex flex-col rounded-xl overflow-hidden bg-bgPanel/95 border backdrop-blur-md transition-all shadow-md cursor-move"
      :class="[
        isSelected ? 'border-primary shadow-primary/20 ring-2 ring-primary/40' : 'border-divider hover:border-dividerHover'
      ]"
      :style="{ borderColor: node.color ? node.color : undefined }"
    >
      <!-- Header/Color Bar -->
      <div
        v-if="node.color"
        class="h-1.5 w-full flex-shrink-0 cursor-move"
        :style="{ backgroundColor: node.color }"
      ></div>

      <!-- Body com Milkdown Live Preview -->
      <div class="flex-1 p-2 overflow-auto text-textPrimary text-sm custom-scrollbar cursor-text">
        <MilkdownEditor
          v-model="localText"
          placeholder="Escreva em Markdown..."
          :autofocus="autofocus"
          @update:model-value="onTextChange"
          @blur="onBlur"
        />
      </div>
    </div>

  <!-- 2. TEXTO LIVRE (type === 'loose_text') - Escrita livre sem quadrado, sem borda e sem fundo com Live Preview -->
  <div
    v-else
    class="w-full h-full flex flex-col bg-transparent transition-all relative group cursor-move"
    :class="[
      isSelected
        ? 'ring-1 ring-primary/50 border border-dashed border-primary/50 rounded-lg'
        : 'border border-transparent'
    ]"
    :style="{ color: node.color || 'inherit' }"
  >
    <div class="w-full h-full p-1 overflow-visible">
      <MilkdownEditor
        v-model="localText"
        placeholder="Comece a escrever livremente..."
        :autofocus="autofocus"
        @update:model-value="onTextChange"
        @blur="onBlur"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { CanvasNode } from '~/interfaces/canvas';
import MilkdownEditor from '~/components/MilkdownEditor.vue';

const props = defineProps<{
  node: CanvasNode;
  isSelected?: boolean;
  autofocus?: boolean;
}>();

const emit = defineEmits<{
  (_e: 'update:text', _text: string): void;
  (_e: 'delete'): void;
}>();

const isLooseText = computed(() => props.node.type === 'loose_text');
const localText = ref(props.node.text || '');

watch(
  () => props.node.text,
  (newText) => {
    if (newText !== localText.value) {
      localText.value = newText || '';
    }
  }
);

const onTextChange = (text: string) => {
  localText.value = text;
  emit('update:text', text);
};

const onBlur = () => {
  const trimmed = localText.value.trim();
  if (isLooseText.value && trimmed === '' && !props.node.text) {
    emit('delete');
  } else {
    emit('update:text', localText.value);
  }
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--divider, rgba(255, 255, 255, 0.1));
  border-radius: 4px;
}
</style>
