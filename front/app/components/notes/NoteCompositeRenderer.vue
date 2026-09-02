<template>
  <div class="note-composite-renderer space-y-4">
    <template v-for="(chunk, idx) in parsedChunks" :key="idx">
      <!-- Markdown Text Chunk -->
      <AiMarkdown v-if="chunk.type === 'markdown'" :content="chunk.content" />

      <!-- Canvas Interactive Embed Chunk -->
      <CanvasEmbedPreview
        v-else-if="chunk.type === 'canvas' && chunk.id"
        :canvas-id="chunk.id"
      />

      <!-- Book Embed Chunk -->
      <div
        v-else-if="chunk.type === 'book'"
        class="my-4 p-4 rounded-xl border border-divider bg-bgPanel/90 backdrop-blur-md flex items-center justify-between gap-4 max-w-lg shadow-md hover:border-primary/50 transition-colors"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-12 h-16 rounded-md bg-bgElevated border border-divider flex items-center justify-center text-xl flex-shrink-0">
            📖
          </div>
          <div class="min-w-0">
            <span class="inline-flex text-[10px] uppercase font-semibold text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 mb-1">
              Livro Anexado
            </span>
            <h4 class="text-sm font-semibold text-textPrimary truncate">
              Livro #{{ chunk.id }}
            </h4>
            <p class="text-xs text-textSecondary">Disponível no leitor de livros</p>
          </div>
        </div>

        <NuxtLink
          :to="`/reader?bookId=${chunk.id}`"
          class="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary hover:bg-primaryHover text-white text-xs font-medium transition-colors flex-shrink-0"
        >
          <span>Ler</span>
          <span>→</span>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, provide } from 'vue';
import AiMarkdown from '~/components/AiMarkdown.vue';
import CanvasEmbedPreview from '~/components/canvas/CanvasEmbedPreview.vue';
import { useCycleDetector, type RenderContextItem } from '~/composables/useCycleDetector';

const props = defineProps<{
  content: string;
  noteId?: string;
  noteTitle?: string;
}>();

// Gestão de ancestrais para prevenção de ciclo
const parentStack = inject<RenderContextItem[]>('ancestorStack', []);
const { createNextStack } = useCycleDetector(parentStack);

const currentStack = computed(() => {
  if (!props.noteId) return parentStack;
  return createNextStack({ type: 'note', id: props.noteId, title: props.noteTitle });
});

provide('ancestorStack', currentStack.value);

interface Chunk {
  type: 'markdown' | 'canvas' | 'book';
  content: string;
  id?: string;
}

const parsedChunks = computed<Chunk[]>(() => {
  if (!props.content) return [];

  const chunks: Chunk[] = [];
  const regex = /!\[\[(canvas|book):([a-zA-Z0-9_-]+)\]\]/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(props.content)) !== null) {
    const textBefore = props.content.slice(lastIndex, match.index);
    if (textBefore.trim()) {
      chunks.push({ type: 'markdown', content: textBefore });
    }

    const embedType = match[1]?.toLowerCase() as 'canvas' | 'book';
    const embedId = match[2] || '';

    chunks.push({
      type: embedType,
      content: match[0],
      id: embedId,
    });

    lastIndex = match.index + match[0].length;
  }

  const remainingText = props.content.slice(lastIndex);
  if (remainingText.trim() || chunks.length === 0) {
    chunks.push({ type: 'markdown', content: remainingText });
  }

  return chunks;
});
</script>
