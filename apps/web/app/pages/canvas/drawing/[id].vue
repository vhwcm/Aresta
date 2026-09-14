<template>
  <div class="fixed inset-0 h-screen w-screen flex flex-col bg-bgPanel text-textPrimary select-none overflow-hidden font-interface">
    <!-- Top Header -->
    <header class="h-14 shrink-0 px-3 sm:px-6 border-b border-divider bg-bgPanel/90 backdrop-blur-md flex items-center justify-between z-30">
      <div class="flex items-center gap-2 sm:gap-3 min-w-0">
        <!-- Back Link -->
        <NuxtLink
          to="/canvas?tab=drawings"
          class="p-2 rounded-xl bg-bgElevated hover:bg-bgSurface text-textSecondary hover:text-textPrimary border border-divider transition-all shrink-0"
          title="Voltar aos Desenhos"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </NuxtLink>

        <!-- Editable Title -->
        <div class="flex items-center gap-2 min-w-0">
          <input
            v-if="isEditingTitle"
            ref="titleInputRef"
            v-model="editedTitle"
            type="text"
            class="px-2 py-1 rounded-lg bg-bgElevated border border-primary text-xs sm:text-sm font-semibold text-textPrimary focus:outline-none max-w-[150px] sm:max-w-[280px]"
            @blur="handleSaveTitle"
            @keydown.enter="handleSaveTitle"
            @keydown.esc="isEditingTitle = false"
          />
          <h1
            v-else
            class="text-xs sm:text-base font-bold text-textPrimary hover:text-primary cursor-pointer transition-colors px-1 py-0.5 rounded truncate max-w-[150px] sm:max-w-[300px]"
            title="Clique para renomear"
            @click="startEditingTitle"
          >
            {{ currentDrawing?.title || 'Desenho sem título' }}
          </h1>
          <span class="text-[10px] text-textSecondary/50 font-mono hidden sm:inline">(.drawing)</span>
        </div>

        <!-- Status de Autosave -->
        <div class="hidden md:flex items-center gap-1.5 text-[11px] text-textSecondary px-2 py-0.5 rounded-full bg-bgElevated/50">
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="isSaving ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'"
          />
          <span>{{ isSaving ? 'Salvando...' : 'Salvo' }}</span>
        </div>
      </div>

      <!-- Right Header Actions -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Botão Transformar com IA -->
        <button
          @click="handleTriggerAiSynthesis"
          :disabled="isSynthesizing || isGeneratingModal"
          class="px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-primary to-amber-600 hover:opacity-95 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Transformar anotações e desenhos em documento HTML estruturado"
        >
          <SparklesIcon class="w-4 h-4 animate-spin-slow" />
          <span class="hidden sm:inline">Transformar com IA</span>
          <span class="sm:hidden">IA</span>
        </button>

        <!-- Alternar Tema -->
        <button
          @click="toggleThemeMode"
          class="p-2 rounded-xl bg-bgElevated hover:bg-bgSurface text-textSecondary hover:text-textPrimary border border-divider transition-colors flex items-center justify-center cursor-pointer shrink-0"
          title="Alternar tema"
        >
          <SunIcon v-if="themeMode === 'light'" class="w-4 h-4 text-amber-500" />
          <MoonIcon v-else class="w-4 h-4 text-accent" />
        </button>
      </div>
    </header>

    <!-- Main Viewport: Vertical Continuous Pages -->
    <main
      ref="viewportRef"
      class="flex-1 relative w-full h-full overflow-y-auto overflow-x-hidden p-4 sm:p-8 flex flex-col items-center gap-8 bg-bgRoot/60"
    >
      <!-- Loading State -->
      <div v-if="isLoading" class="flex-1 flex flex-col items-center justify-center text-textSecondary gap-3">
        <div class="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p class="text-xs">Carregando páginas de desenho...</p>
      </div>

      <!-- Pages Container -->
      <template v-else-if="currentDrawing">
        <div
          v-for="(page, idx) in currentDrawing.pages"
          :key="page.id"
          class="relative flex flex-col items-center group"
        >
          <!-- Controles de Página Flutuantes na lateral -->
          <div class="absolute -top-3 sm:-top-4 right-0 flex items-center gap-1 z-20">
            <span class="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-bgPanel border border-divider text-textSecondary shadow-xs">
              Página {{ idx + 1 }} de {{ currentDrawing.pages.length }}
            </span>
            <button
              v-if="currentDrawing.pages.length > 1"
              @click="handleRemovePage(idx)"
              class="p-1 rounded bg-bgPanel hover:bg-red-500/10 text-textSecondary hover:text-red-500 border border-divider transition-all shadow-xs cursor-pointer"
              title="Excluir esta página"
            >
              <TrashIcon class="w-3 h-3" />
            </button>
          </div>

          <!-- Componente Canvas da Página -->
          <DrawingPageCanvas
            :ref="(el) => setPageCanvasRef(idx, el)"
            :page="page"
            :scale="pageScale"
            :tool="activeTool"
            :color="strokeColor"
            :size="strokeSize"
            :palm-rejection="true"
            :is-active="activePageIndex === idx"
            :is-dark-mode="themeMode === 'dark'"
            @select-page="activePageIndex = idx"
            @stroke-added="(stroke) => handleStrokeAdded(idx, stroke)"
            @erase="(pt, radius) => handleErase(idx, pt, radius)"
          />
        </div>

        <!-- Botão Adicionar Página no Final -->
        <div class="pb-24 pt-2 flex flex-col items-center gap-2">
          <button
            @click="handleAddPage"
            class="px-5 py-2.5 rounded-2xl bg-bgPanel hover:bg-bgElevated text-textPrimary border border-divider shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer"
          >
            <PlusIcon class="w-4 h-4 text-primary" />
            <span>Adicionar Página</span>
          </button>
        </div>
      </template>
    </main>

    <!-- Floating Docked Toolbar -->
    <div class="fixed bottom-4 inset-x-0 flex justify-center pointer-events-none z-30 px-3">
      <div class="pointer-events-auto">
        <DrawingToolbar
          v-model:tool="activeTool"
          v-model:color="strokeColor"
          v-model:size="strokeSize"
          :zoom="pageScale"
          :can-undo="canUndo"
          :can-redo="canRedo"
          @zoom-in="handleZoomIn"
          @zoom-out="handleZoomOut"
          @zoom-fit="handleZoomFit"
          @undo="undo"
          @redo="redo"
        />
      </div>
    </div>

    <!-- Modal de Síntese de IA (Split View) -->
    <DrawingAiSynthesisModal
      v-model="showSynthesisModal"
      :images="synthesisImages"
      :synthesis-result="synthesisResult"
      :is-generating="isGeneratingModal"
      :drawing-title="currentDrawing?.title || 'Desenho'"
      @save-as-note="handleSaveAsNote"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Sparkles as SparklesIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  Plus as PlusIcon,
  Trash as TrashIcon,
} from 'lucide-vue-next';
import { useDrawing } from '~/composables/useDrawing';
import { useSettings } from '~/composables/useSettings';
import type { DrawingStroke, DrawingPoint, DrawingSynthesisResult } from '~/interfaces/drawing';
import DrawingPageCanvas from '~/components/canvas/drawing/DrawingPageCanvas.vue';
import DrawingToolbar from '~/components/canvas/drawing/DrawingToolbar.vue';
import DrawingAiSynthesisModal from '~/components/canvas/drawing/DrawingAiSynthesisModal.vue';

definePageMeta({
  layout: false,
});

const route = useRoute();
const router = useRouter();
const drawingId = computed(() => route.params.id as string);

const { themeMode, toggleThemeMode } = useSettings();

const {
  currentDrawing,
  activePageIndex,
  activeTool,
  strokeColor,
  strokeSize,
  isSaving,
  isSynthesizing,
  isLoading,
  canUndo,
  canRedo,
  loadDrawing,
  addPage,
  removePage,
  addStrokeToActivePage,
  eraseStrokesAtPoint,
  undo,
  redo,
  saveDrawingNow,
  synthesizeDrawing,
  convertToNote,
} = useDrawing();

const isEditingTitle = ref(false);
const editedTitle = ref('');
const titleInputRef = ref<HTMLInputElement | null>(null);

const showSynthesisModal = ref(false);
const isGeneratingModal = ref(false);
const synthesisImages = ref<string[]>([]);
const synthesisResult = ref<DrawingSynthesisResult | null>(null);

const viewportRef = ref<HTMLElement | null>(null);
const pageCanvasRefs = ref<Record<number, any>>({});

function setPageCanvasRef(idx: number, el: any) {
  if (el) {
    pageCanvasRefs.value[idx] = el;
  }
}

// Escala adaptativa de página: na inicialização a folha cabe 100% na tela do notebook
const pageScale = ref(0.7);

function calculateFitScale(): number {
  if (typeof window === 'undefined') return 1;
  const availableWidth = window.innerWidth - 64;
  const availableHeight = window.innerHeight - 150; // cabeçalho + padding + toolbar inferior
  const scaleW = availableWidth / 794;
  const scaleH = availableHeight / 1123;
  const fit = Math.min(scaleW, scaleH);
  return Math.max(0.25, Math.min(Number(fit.toFixed(2)), 1.2));
}

function handleZoomFit() {
  pageScale.value = calculateFitScale();
}

function handleZoomIn() {
  pageScale.value = Math.min(2.5, Number((pageScale.value + 0.1).toFixed(2)));
}

function handleZoomOut() {
  pageScale.value = Math.max(0.25, Number((pageScale.value - 0.1).toFixed(2)));
}

function handleWheel(e: WheelEvent) {
  // Zoom suave com mouse wheel (Ctrl + Wheel ou trackpad pinch)
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    pageScale.value = Math.max(0.25, Math.min(2.5, Number((pageScale.value * zoomFactor).toFixed(2))));
  }
}

function startEditingTitle() {
  editedTitle.value = currentDrawing.value?.title || '';
  isEditingTitle.value = true;
  nextTick(() => {
    titleInputRef.value?.focus();
    titleInputRef.value?.select();
  });
}

function handleSaveTitle() {
  if (!currentDrawing.value) return;
  const trimmed = editedTitle.value.trim();
  if (trimmed && trimmed !== currentDrawing.value.title) {
    currentDrawing.value.title = trimmed;
    saveDrawingNow();
  }
  isEditingTitle.value = false;
}

function handleStrokeAdded(pageIndex: number, stroke: DrawingStroke) {
  activePageIndex.value = pageIndex;
  addStrokeToActivePage(stroke);
}

function handleErase(pageIndex: number, pt: DrawingPoint, radius: number) {
  eraseStrokesAtPoint(pageIndex, pt, radius);
}

function handleAddPage() {
  addPage('blank');
}

function handleRemovePage(idx: number) {
  if (confirm(`Deseja excluir a Página ${idx + 1}?`)) {
    removePage(idx);
  }
}

// Fluxo de Síntese com IA (Gemini Vision)
async function handleTriggerAiSynthesis() {
  if (!currentDrawing.value) return;

  // 1. Exporta todas as páginas para imagens de alta resolução
  const images: string[] = [];
  const pagesCount = currentDrawing.value.pages.length;

  for (let i = 0; i < pagesCount; i++) {
    const comp = pageCanvasRefs.value[i];
    if (comp?.exportToDataUrl) {
      const dataUrl = comp.exportToDataUrl();
      if (dataUrl) images.push(dataUrl);
    }
  }

  if (images.length === 0) {
    alert('Nenhuma página disponível para síntese.');
    return;
  }

  synthesisImages.value = images;
  synthesisResult.value = null;
  showSynthesisModal.value = true;
  isGeneratingModal.value = true;

  try {
    const result = await synthesizeDrawing(images);
    synthesisResult.value = result;
  } catch (err: any) {
    console.error('Erro na síntese com IA:', err);
    alert(err.message || 'Falha na síntese com IA. Verifique sua conexão e tente novamente.');
  } finally {
    isGeneratingModal.value = false;
  }
}

// Salva o HTML gerado como Nota tradicional e opcionalmente exclui o desenho
async function handleSaveAsNote(payload: { title: string; html: string; deleteOriginal: boolean }) {
  try {
    await convertToNote({
      htmlContent: payload.html,
      title: payload.title,
      deleteOriginal: payload.deleteOriginal,
      folder: currentDrawing.value?.folder || undefined,
    });

    showSynthesisModal.value = false;
    alert('Nota criada com sucesso a partir do desenho!');
    router.push('/canvas?tab=notes');
  } catch (err: any) {
    alert(err.message || 'Erro ao salvar como nota.');
  }
}

onMounted(async () => {
  handleZoomFit();
  window.addEventListener('resize', handleZoomFit);
  if (viewportRef.value) {
    viewportRef.value.addEventListener('wheel', handleWheel, { passive: false });
  }
  if (drawingId.value) {
    await loadDrawing(drawingId.value);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleZoomFit);
  if (viewportRef.value) {
    viewportRef.value.removeEventListener('wheel', handleWheel);
  }
});
</script>

<style scoped>
@keyframes spinSlow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.animate-spin-slow {
  animation: spinSlow 8s linear infinite;
}
</style>
