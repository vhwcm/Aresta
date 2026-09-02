<template>
  <div
    class="w-full h-full flex flex-col rounded-xl overflow-hidden bg-bgPanel/95 border backdrop-blur-md transition-all shadow-md"
    :class="[
      isSelected ? 'border-primary shadow-primary/20 ring-2 ring-primary/40' : 'border-divider hover:border-dividerHover'
    ]"
    :style="{ borderColor: node.color ? node.color : undefined }"
  >
    <!-- Header do Card da Nota -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-divider/60 bg-bgElevated/50 select-none">
      <div class="flex items-center gap-1.5 min-w-0">
        <span class="text-xs">📝</span>
        <h4 class="text-xs font-semibold text-textPrimary truncate" :title="displayTitle">
          {{ displayTitle }}
        </h4>
      </div>

      <NuxtLink
        v-if="node.noteId"
        :to="`/notes?id=${node.noteId}`"
        class="text-[10px] text-primary hover:underline flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-primary/10 transition-colors"
        @click.stop
      >
        <span>Abrir</span>
        <span>↗</span>
      </NuxtLink>
    </div>

    <!-- Conteúdo / Verificação de Ciclo -->
    <div class="flex-1 p-3 overflow-y-auto text-xs text-textSecondary select-text">
      <!-- Se houver ciclo detectado -->
      <CycleWarningPlaceholder
        v-if="cycleResult.hasCycle || cycleResult.maxDepthReached"
        :max-depth-reached="cycleResult.maxDepthReached"
        :cycle-chain="cycleResult.cycleChain"
        :target-url="node.noteId ? `/notes?id=${node.noteId}` : undefined"
      />

      <!-- Conteúdo Normal da Nota -->
      <div v-else-if="displayContent" class="prose prose-invert prose-xs max-w-none">
        <AiMarkdown :content="displayContent" />
      </div>

      <!-- Placeholder Vazio -->
      <div v-else class="h-full flex items-center justify-center text-textSecondary/40 italic text-center p-2">
        Nota vazia ou sem conteúdo.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import type { CanvasNode } from '~/interfaces/canvas';
import { useCycleDetector, type RenderContextItem } from '~/composables/useCycleDetector';
import CycleWarningPlaceholder from '~/components/canvas/CycleWarningPlaceholder.vue';
import AiMarkdown from '~/components/AiMarkdown.vue';

const props = defineProps<{
  node: CanvasNode;
  isSelected?: boolean;
}>();

// Injetar ancestorStack se fornecido pelo contexto pai
const parentStack = inject<RenderContextItem[]>('ancestorStack', []);
const { checkCycle } = useCycleDetector(parentStack);

const cycleResult = computed(() => {
  if (!props.node.noteId) {
    return { hasCycle: false, maxDepthReached: false, cycleChain: [] };
  }
  return checkCycle('note', props.node.noteId);
});

const displayTitle = computed(() => {
  return props.node.noteTitle || props.node.text || 'Nota Vinculada';
});

const displayContent = computed(() => {
  return props.node.noteContent || props.node.text || '';
});
</script>
