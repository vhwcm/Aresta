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
    <div class="flex-1 p-3 overflow-y-auto text-xs text-textSecondary relative">
      <!-- Se houver ciclo detectado -->
      <CycleWarningPlaceholder
        v-if="cycleResult.hasCycle || cycleResult.maxDepthReached"
        :max-depth-reached="cycleResult.maxDepthReached"
        :cycle-chain="cycleResult.cycleChain"
        :target-url="node.noteId ? `/notes?id=${node.noteId}` : undefined"
      />

      <!-- Conteúdo Normal da Nota com suporte a seleção de trecho -->
      <div
        v-else-if="displayContent"
        class="prose dark:prose-invert prose-xs max-w-none select-text cursor-text"
        @mouseup="handleTextSelection"
        @keyup="handleTextSelection"
      >
        <AiMarkdown :content="displayContent" />

        <!-- Barra flutuante de criação de anotação e flashcard a partir do trecho -->
        <Transition name="fade">
          <div
            v-if="selectedSnippet"
            class="sticky bottom-2 ml-auto flex items-center gap-1.5 p-1 rounded-xl bg-bgPanel/95 border border-divider shadow-xl backdrop-blur-md transition-all animate-in fade-in z-20"
          >
            <button
              type="button"
              class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-textPrimary font-technical text-[10px] font-semibold transition-all cursor-pointer"
              @mousedown.prevent.stop="openModalForAnnotation"
              title="Criar anotação ou reflexão a partir do trecho selecionado"
            >
              <MessageSquareIcon class="w-3 h-3 text-accent" />
              <span>Anotar</span>
            </button>
            <button
              type="button"
              class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent text-white font-technical text-[10px] font-semibold hover:bg-accent/90 transition-all cursor-pointer shadow-xs"
              @mousedown.prevent.stop="openModalForFlashcard"
              title="Criar Flashcard a partir do trecho selecionado"
            >
              <SparklesIcon class="w-3 h-3" />
              <span>Flashcard</span>
            </button>
          </div>
        </Transition>
      </div>

      <!-- Placeholder Vazio -->
      <div v-else class="h-full flex items-center justify-center text-textSecondary/40 italic text-center p-2 select-none">
        Nota vazia ou sem conteúdo.
      </div>
    </div>

    <!-- Modal de Anotação com suporte a Flashcard para o Trecho da Nota -->
    <ReaderAnnotationModal
      :is-open="isAnnotationModalOpen"
      :initial-text="currentSelectedSnippet"
      :current-page="1"
      :book-id="1"
      :book-title="displayTitle"
      :chapter-title="`Nota: ${displayTitle}`"
      :cfi="`note:${node.noteId || node.id}`"
      :note-id="String(node.noteId || node.id)"
      :initial-want-note="modalInitialWantNote"
      :initial-want-flashcard="modalInitialWantFlashcard"
      @close="isAnnotationModalOpen = false"
      @created="handleSnippetAnnotated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { SparklesIcon, MessageSquareIcon } from 'lucide-vue-next';
import type { CanvasNode } from '~/interfaces/canvas';
import { useCycleDetector, type RenderContextItem } from '~/composables/useCycleDetector';
import CycleWarningPlaceholder from '~/components/canvas/CycleWarningPlaceholder.vue';
import AiMarkdown from '~/components/AiMarkdown.vue';
import ReaderAnnotationModal from '~/components/reader/ReaderAnnotationModal.vue';

const props = defineProps<{
  node: CanvasNode;
  isSelected?: boolean;
}>();

const parentStack = inject<RenderContextItem[]>('ancestorStack', []);
const { checkCycle } = useCycleDetector(parentStack);

const selectedSnippet = ref('');
const currentSelectedSnippet = ref('');
const isAnnotationModalOpen = ref(false);
const modalInitialWantNote = ref(false);
const modalInitialWantFlashcard = ref(false);

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

function handleTextSelection() {
  if (typeof window === 'undefined') return;
  const selection = window.getSelection();
  const text = selection?.toString().trim();
  if (text && text.length > 2) {
    selectedSnippet.value = text;
  } else {
    selectedSnippet.value = '';
  }
}

function openModalForAnnotation() {
  if (!selectedSnippet.value) return;
  currentSelectedSnippet.value = selectedSnippet.value;
  modalInitialWantNote.value = true;
  modalInitialWantFlashcard.value = false;
  isAnnotationModalOpen.value = true;
  selectedSnippet.value = '';
}

function openModalForFlashcard() {
  if (!selectedSnippet.value) return;
  currentSelectedSnippet.value = selectedSnippet.value;
  modalInitialWantNote.value = false;
  modalInitialWantFlashcard.value = true;
  isAnnotationModalOpen.value = true;
  selectedSnippet.value = '';
}

function openModalForSnippet() {
  openModalForFlashcard();
}

function handleSnippetAnnotated() {
  isAnnotationModalOpen.value = false;
  selectedSnippet.value = '';
}
</script>
