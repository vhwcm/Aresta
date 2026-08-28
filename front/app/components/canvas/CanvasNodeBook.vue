<template>
  <div
    class="w-full h-full flex flex-col rounded-xl overflow-hidden bg-bgPanel/95 border backdrop-blur-md transition-all shadow-md"
    :class="[
      isSelected ? 'border-primary shadow-primary/20 ring-2 ring-primary/40' : 'border-divider hover:border-dividerHover'
    ]"
    :style="{ borderColor: node.color ? node.color : undefined }"
  >
    <div class="flex items-center gap-3 p-3 h-full">
      <!-- Cover -->
      <div class="w-16 h-24 flex-shrink-0 rounded-md overflow-hidden bg-bgElevated border border-divider flex items-center justify-center shadow">
        <img
          v-if="node.bookCover"
          :src="coverUrl"
          :alt="node.bookTitle || 'Capa do Livro'"
          class="w-full h-full object-cover"
        />
        <div v-else class="text-textSecondary/40 text-xs text-center p-1 font-mono">
          Sem capa
        </div>
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
        <div>
          <span class="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 mb-1">
            📚 Livro
          </span>
          <h4 class="text-sm font-semibold text-textPrimary leading-tight line-clamp-2" :title="node.bookTitle">
            {{ node.bookTitle || 'Livro' }}
          </h4>
          <p v-if="node.bookAuthor" class="text-xs text-textSecondary line-clamp-1 mt-0.5">
            {{ node.bookAuthor }}
          </p>
        </div>

        <NuxtLink
          v-if="node.bookId"
          :to="`/reader?bookId=${node.bookId}`"
          class="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded bg-bgElevated hover:bg-bgSurface text-xs text-textPrimary font-medium border border-divider transition-colors mt-2"
          @click.stop
        >
          <span>Abrir Leitor</span>
          <span class="text-xs">→</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CanvasNode } from '~/interfaces/canvas';

const props = defineProps<{
  node: CanvasNode;
  isSelected?: boolean;
}>();

const coverUrl = computed(() => {
  if (!props.node.bookCover) return '';
  if (props.node.bookCover.startsWith('http') || props.node.bookCover.startsWith('/')) {
    return props.node.bookCover;
  }
  return `http://localhost:7070/${props.node.bookCover}`;
});
</script>
