<template>
  <div class="h-full w-full flex flex-col overflow-hidden min-w-0 bg-bgPanel text-textPrimary select-none">
    <!-- Top Nav / Canvas Header -->
    <header class="h-14 shrink-0 px-2.5 sm:px-4 border-b border-divider bg-bgPanel/90 backdrop-blur-md flex items-center justify-between z-30">
      <div class="flex items-center gap-1.5 sm:gap-3 min-w-0">
        <!-- Back Link -->
        <NuxtLink
          to="/"
          class="p-1.5 sm:p-2 rounded-xl bg-bgElevated hover:bg-bgSurface text-textSecondary hover:text-textPrimary border border-divider transition-all flex-shrink-0"
          title="Voltar ao Início"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </NuxtLink>

        <!-- Editable Canvas Title -->
        <div class="flex items-center gap-1.5 min-w-0">
          <input
            v-if="isEditingTitle"
            ref="titleInputRef"
            v-model="editedTitle"
            type="text"
            class="px-2 py-1 rounded-lg bg-bgElevated border border-primary text-xs sm:text-sm font-semibold text-textPrimary focus:outline-none font-interface max-w-[130px] sm:max-w-[240px]"
            @blur="saveTitle"
            @keydown.enter="saveTitle"
            @keydown.esc="isEditingTitle = false"
          />
          <h1
            v-else
            class="text-xs sm:text-base font-bold font-interface text-textPrimary hover:text-primary cursor-pointer transition-colors px-1 py-0.5 rounded truncate max-w-[130px] sm:max-w-[260px]"
            title="Clique para renomear"
            @click="startEditingTitle"
          >
            {{ currentCanvas?.title || 'Quadro' }}
          </h1>
          <span class="text-[10px] sm:text-xs text-textSecondary/50 font-mono flex-shrink-0">(.canvas)</span>
        </div>
      </div>

      <!-- Right Header Actions -->
      <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <!-- Alternar Tema (Escuro / Claro / Sepia) -->
        <button
          @click="toggleThemeMode"
          class="p-1.5 sm:p-2 rounded-xl bg-bgElevated hover:bg-bgSurface text-textSecondary hover:text-textPrimary border border-divider transition-colors flex items-center justify-center cursor-pointer flex-shrink-0"
          :title="themeMode === 'dark' ? 'Tema: Escuro (clique para Claro)' : (themeMode === 'light' ? 'Tema: Claro (clique para Livro)' : 'Tema: Livro (clique para Escuro)')"
          aria-label="Alternar tema da interface"
        >
          <SunIcon v-if="themeMode === 'light'" class="w-4 h-4 text-amber-500 hover:rotate-45 transition-transform" />
          <PaletteIcon v-else-if="themeMode === 'sepia'" class="w-4 h-4 text-amber-600 dark:text-amber-300 hover:scale-110 transition-transform" />
          <MoonIcon v-else class="w-4 h-4 text-accent hover:-rotate-12 transition-transform" />
        </button>

        <NuxtLink
          to="/?tab=notes"
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
import { useRoute, useRouter } from 'vue-router';
import { SunIcon, MoonIcon, PaletteIcon } from 'lucide-vue-next';
import { useCanvas } from '~/composables/useCanvas';
import { useSettings } from '~/composables/useSettings';
import CanvasBoard from '~/components/canvas/CanvasBoard.vue';

definePageMeta({
  middleware: ['auth'],
});

const route = useRoute();
const router = useRouter();
const canvasId = computed(() => route.params.id as string);

const { themeMode, toggleThemeMode } = useSettings();

const {
  currentCanvas,
  loadCanvas,
  saveCanvasNow,
} = useCanvas();

const isEditingTitle = ref(false);
const editedTitle = ref('');
const titleInputRef = ref<HTMLInputElement | null>(null);

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

