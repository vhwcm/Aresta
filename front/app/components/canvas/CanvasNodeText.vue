<template>
  <div
    class="w-full h-full flex flex-col rounded-xl overflow-hidden bg-bgPanel/95 border backdrop-blur-md transition-all shadow-md"
    :class="[
      isSelected ? 'border-primary shadow-primary/20 ring-2 ring-primary/40' : 'border-divider hover:border-dividerHover'
    ]"
    :style="{ borderColor: node.color ? node.color : undefined }"
  >
    <!-- Header/Color Bar -->
    <div
      v-if="node.color"
      class="h-1.5 w-full flex-shrink-0"
      :style="{ backgroundColor: node.color }"
    ></div>

    <!-- Body -->
    <div
      class="flex-1 p-3.5 overflow-auto text-textPrimary text-sm select-text custom-scrollbar"
      @dblclick.stop="startEditing"
    >
      <div v-if="isEditing" class="h-full flex flex-col">
        <textarea
          ref="textareaRef"
          v-model="localText"
          class="w-full flex-1 bg-transparent text-textPrimary text-sm resize-none focus:outline-none font-interface placeholder:text-textSecondary/50"
          placeholder="Escreva em Markdown..."
          @blur="finishEditing"
          @keydown.esc="finishEditing"
        ></textarea>
        <div class="flex items-center justify-between pt-2 border-t border-divider text-xs text-textSecondary">
          <span>Markdown suportado</span>
          <button
            class="px-2 py-0.5 rounded bg-primary text-white hover:bg-primaryHover text-xs font-medium"
            @click.stop="finishEditing"
          >
            Pronto
          </button>
        </div>
      </div>

      <div
        v-else
        class="h-full prose prose-invert prose-sm max-w-none text-textPrimary leading-relaxed break-words"
        v-html="renderedMarkdown"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { marked } from 'marked';
import type { CanvasNode } from '~/interfaces/canvas';

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

marked.setOptions({
  gfm: true,
  breaks: true,
});

const renderedMarkdown = computed(() => {
  if (!props.node.text || props.node.text.trim() === '') {
    return '<span class="text-textSecondary/40 italic">Clique duas vezes para editar...</span>';
  }
  return marked.parse(props.node.text);
});

const startEditing = () => {
  localText.value = props.node.text || '';
  isEditing.value = true;
  nextTick(() => {
    textareaRef.value?.focus();
  });
};

const finishEditing = () => {
  if (!isEditing.value) return;
  isEditing.value = false;
  emit('update:text', localText.value);
};
</script>
