<template>
  <!-- 1. NOTA / CARD (type === 'text') - Bloco retangular estilo card Markdown -->
  <div
    v-if="!isLooseText"
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
      class="flex-1 p-3.5 overflow-auto text-textPrimary text-sm custom-scrollbar"
      :class="isEditing ? 'select-text' : 'select-none'"
      @dblclick.stop="startEditing"
    >
      <div v-if="isEditing" class="h-full flex flex-col">
        <textarea
          ref="textareaRef"
          v-model="localText"
          class="w-full flex-1 bg-transparent text-textPrimary text-sm resize-none focus:outline-none font-interface placeholder:text-textSecondary/50 select-text cursor-text"
          placeholder="Escreva em Markdown..."
          @pointerdown.stop
          @mousedown.stop
          @blur="finishEditing"
          @keydown="onCardKeydown"
        ></textarea>
        <div class="flex items-center justify-between pt-2 border-t border-divider text-xs text-textSecondary">
          <div class="flex items-center gap-1.5">
            <span>Markdown suportado</span>
            <div class="flex items-center gap-0.5 ml-1 border-l border-divider/60 pl-1.5">
              <button
                type="button"
                class="w-5 h-5 flex items-center justify-center rounded font-bold text-[11px] text-textPrimary/80 hover:text-textPrimary hover:bg-white/10 transition-colors"
                title="Negrito (Ctrl+B)"
                @mousedown.prevent="formatBold"
              >
                B
              </button>
              <button
                type="button"
                class="w-5 h-5 flex items-center justify-center rounded italic text-[11px] text-textPrimary/80 hover:text-textPrimary hover:bg-white/10 transition-colors"
                title="Itálico (Ctrl+I)"
                @mousedown.prevent="formatItalic"
              >
                I
              </button>
            </div>
          </div>
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
        class="h-full prose dark:prose-invert prose-sm max-w-none text-textPrimary leading-relaxed break-words canvas-markdown-content"
        v-html="renderedMarkdown"
      ></div>
    </div>
  </div>

  <!-- 2. TEXTO LIVRE (type === 'loose_text') - Escrita livre sem quadrado, sem borda e sem fundo -->
  <div
    v-else
    class="w-full h-full flex flex-col bg-transparent transition-all relative group cursor-text"
    :class="[
      isSelected
        ? 'ring-1 ring-primary/50 border border-dashed border-primary/50 rounded-lg'
        : 'border border-transparent'
    ]"
    @dblclick.stop="startEditing"
    @click="onLooseClick"
  >
    <!-- Modo de Edição Livre: textarea transparente sem poluição visual -->
    <div v-if="isEditing" class="w-full h-full flex flex-col p-1.5" @pointerdown.stop @mousedown.stop>
      <textarea
        ref="textareaRef"
        v-model="localText"
        class="w-full h-full bg-transparent resize-none focus:outline-none font-interface text-base leading-relaxed placeholder:text-textSecondary/40 placeholder:italic select-text cursor-text custom-scrollbar"
        :style="{ color: node.color || 'inherit' }"
        placeholder="Comece a escrever livremente..."
        @pointerdown.stop
        @mousedown.stop
        @click.stop
        @blur="finishEditing"
        @keydown="onLooseKeydown"
      ></textarea>
    </div>

    <!-- Modo de Leitura Livre: renderização direta e limpa no canvas -->
    <div
      v-else
      class="w-full h-full p-1.5 overflow-visible select-text leading-relaxed break-words font-interface cursor-text"
      :style="{ color: node.color || 'inherit' }"
      @click.stop="startEditing"
    >
      <div
        v-if="localText.trim()"
        class="prose dark:prose-invert prose-base max-w-none font-interface leading-relaxed canvas-markdown-content"
        :style="{ color: node.color || 'inherit' }"
        v-html="renderedMarkdown"
      ></div>
      <div
        v-else
        class="text-textSecondary/40 italic text-sm select-none py-1"
      >
        Clique para escrever...
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import { marked } from 'marked';
import type { CanvasNode } from '~/interfaces/canvas';
import { applyMarkdownFormat } from '~/utils/markdownFormat';

const props = defineProps<{
  node: CanvasNode;
  isSelected?: boolean;
}>();

const emit = defineEmits<{
  (_e: 'update:text', _text: string): void;
  (_e: 'delete'): void;
}>();

const isLooseText = computed(() => props.node.type === 'loose_text');

const isEditing = ref(false);
const localText = ref(props.node.text || '');
const textareaRef = ref<HTMLTextAreaElement | null>(null);

marked.setOptions({
  gfm: true,
  breaks: true,
});

const renderedMarkdown = computed(() => {
  if (!props.node.text || props.node.text.trim() === '') {
    return isLooseText.value
      ? '<span class="text-textSecondary/40 italic text-sm">Clique para escrever...</span>'
      : '<span class="text-textSecondary/40 italic">Clique duas vezes para editar...</span>';
  }
  return marked.parse(props.node.text);
});

const formatText = (format: 'bold' | 'italic') => {
  if (!textareaRef.value) return;
  const textarea = textareaRef.value;
  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  const result = applyMarkdownFormat(localText.value, start, end, format);
  localText.value = result.newText;
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.focus();
      textareaRef.value.setSelectionRange(result.selectionStart, result.selectionEnd);
    }
  });
};

const formatBold = () => formatText('bold');
const formatItalic = () => formatText('italic');

const handleCommonShortcuts = (e: KeyboardEvent): boolean => {
  if (e.key === 'Escape') {
    finishEditing();
    return true;
  }
  // Ctrl+B ou Cmd+B para Negrito
  if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
    e.preventDefault();
    e.stopPropagation();
    formatBold();
    return true;
  }
  // Ctrl+I ou Cmd+I para Itálico
  if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I')) {
    e.preventDefault();
    e.stopPropagation();
    formatItalic();
    return true;
  }
  return false;
};

const onCardKeydown = (e: KeyboardEvent) => {
  handleCommonShortcuts(e);
};

const onLooseKeydown = (e: KeyboardEvent) => {
  if (e.ctrlKey && e.key === 'Enter') {
    finishEditing();
    return;
  }
  handleCommonShortcuts(e);
};

const startEditing = () => {
  localText.value = props.node.text || '';
  isEditing.value = true;
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.focus();
      const len = textareaRef.value.value.length;
      textareaRef.value.setSelectionRange(len, len);
    }
  });
};

const finishEditing = () => {
  if (!isEditing.value) return;
  isEditing.value = false;
  const trimmed = localText.value.trim();
  // Se for texto solto recém-criado e o usuário não digitou nada, limpa o nó vazio
  if (isLooseText.value && trimmed === '' && !props.node.text) {
    emit('delete');
    return;
  }
  emit('update:text', localText.value);
};

const onLooseClick = (e: MouseEvent) => {
  e.stopPropagation();
  startEditing();
};

// Iniciar edição automaticamente quando um nó de texto livre for criado vazio
onMounted(() => {
  if (isLooseText.value && (!props.node.text || props.node.text === '')) {
    startEditing();
  }
});
</script>

<style scoped>
.canvas-markdown-content :deep(h1) {
  font-size: 1.65rem;
  font-weight: 700;
  line-height: 1.25;
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--divider, rgba(255, 255, 255, 0.08));
  padding-bottom: 0.25rem;
}

.canvas-markdown-content :deep(h2) {
  font-size: 1.35rem;
  font-weight: 600;
  line-height: 1.3;
  margin-top: 0.6rem;
  margin-bottom: 0.4rem;
  border-bottom: 1px solid var(--divider, rgba(255, 255, 255, 0.05));
  padding-bottom: 0.2rem;
}

.canvas-markdown-content :deep(h3) {
  font-size: 1.15rem;
  font-weight: 600;
  line-height: 1.35;
  margin-top: 0.5rem;
  margin-bottom: 0.35rem;
}

.canvas-markdown-content :deep(h4) {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
  margin-top: 0.4rem;
  margin-bottom: 0.25rem;
}

.canvas-markdown-content :deep(h5) {
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.4;
  margin-top: 0.35rem;
  margin-bottom: 0.2rem;
}

.canvas-markdown-content :deep(h6) {
  font-size: 0.825rem;
  font-weight: 600;
  line-height: 1.4;
  margin-top: 0.3rem;
  margin-bottom: 0.2rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.8;
}

.canvas-markdown-content :deep(h1:first-child),
.canvas-markdown-content :deep(h2:first-child),
.canvas-markdown-content :deep(h3:first-child),
.canvas-markdown-content :deep(h4:first-child),
.canvas-markdown-content :deep(h5:first-child),
.canvas-markdown-content :deep(h6:first-child) {
  margin-top: 0;
}

.canvas-markdown-content :deep(strong),
.canvas-markdown-content :deep(b) {
  font-weight: 700;
}

.canvas-markdown-content :deep(em),
.canvas-markdown-content :deep(i) {
  font-style: italic;
}

.canvas-markdown-content :deep(ul) {
  list-style-type: disc;
  padding-left: 1.25rem;
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
}

.canvas-markdown-content :deep(ol) {
  list-style-type: decimal;
  padding-left: 1.25rem;
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
}

.canvas-markdown-content :deep(blockquote) {
  border-left: 3px solid var(--accent, #E57B55);
  padding-left: 0.75rem;
  margin: 0.5rem 0;
  font-style: italic;
  opacity: 0.85;
}

.canvas-markdown-content :deep(code) {
  font-family: monospace;
  font-size: 0.85em;
  background-color: rgba(255, 255, 255, 0.08);
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
}
</style>
