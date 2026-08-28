<template>
  <div class="h-full w-full flex flex-col relative overflow-hidden bg-bgRoot text-textPrimary select-none">
    <!-- Top Nav / Canvas Header -->
    <header class="shrink-0 px-4 py-3 border-b border-divider bg-bgPanel/90 backdrop-blur-md flex items-center justify-between z-30">
      <div class="flex items-center gap-3">
        <!-- Back Link -->
        <NuxtLink
          to="/canvas"
          class="p-2 rounded-xl bg-bgElevated hover:bg-bgSurface text-textSecondary hover:text-textPrimary border border-divider transition-all"
          title="Voltar aos Quadros"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </NuxtLink>

        <!-- Editable Canvas Title -->
        <div class="flex items-center gap-2">
          <input
            v-if="isEditingTitle"
            ref="titleInputRef"
            v-model="editedTitle"
            type="text"
            class="px-2 py-1 rounded-lg bg-bgElevated border border-primary text-sm font-semibold text-textPrimary focus:outline-none font-interface"
            @blur="saveTitle"
            @keydown.enter="saveTitle"
            @keydown.esc="isEditingTitle = false"
          />
          <h1
            v-else
            class="text-sm md:text-base font-bold font-interface text-textPrimary hover:text-primary cursor-pointer transition-colors px-1 py-0.5 rounded"
            title="Clique para renomear"
            @click="startEditingTitle"
          >
            {{ currentCanvas?.title || 'Quadro' }}
          </h1>
          <span class="text-xs text-textSecondary/50 font-mono">(.canvas)</span>
        </div>
      </div>

      <!-- Right Header Actions -->
      <div class="flex items-center gap-2">
        <NuxtLink
          to="/grafo"
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bgElevated hover:bg-bgSurface text-xs text-textSecondary hover:text-textPrimary border border-divider transition-colors"
        >
          <span>🌌</span>
          <span>Grafo de Livros</span>
        </NuxtLink>
      </div>
    </header>

    <!-- Canvas Interactive Viewport Area -->
    <main class="flex-1 relative w-full h-full overflow-hidden">
      <CanvasBoard :canvas-id="canvasId" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useCanvas } from '~/composables/useCanvas';
import CanvasBoard from '~/components/canvas/CanvasBoard.vue';

const route = useRoute();
const canvasId = computed(() => route.params.id as string);

const isEditingTitle = ref(false);
const editedTitle = ref('');
const titleInputRef = ref<HTMLInputElement | null>(null);

const { currentCanvas, loadCanvas, updateNode, saveCanvasNow } = useCanvas();

onMounted(async () => {
  if (canvasId.value) {
    await loadCanvas(canvasId.value);
  }
});

const startEditingTitle = () => {
  editedTitle.value = currentCanvas.value?.title || 'Quadro';
  isEditingTitle.value = true;
  nextTick(() => {
    titleInputRef.value?.focus();
    titleInputRef.value?.select();
  });
};

const saveTitle = async () => {
  if (!isEditingTitle.value) return;
  isEditingTitle.value = false;
  if (currentCanvas.value && editedTitle.value.trim()) {
    currentCanvas.value.title = editedTitle.value.trim();
    await saveCanvasNow();
  }
};
</script>
