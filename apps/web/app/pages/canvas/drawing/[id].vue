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

    <!-- Main Viewport: Horizontal Pages (Colado no topo e centralizado horizontalmente) -->
    <main
      ref="viewportRef"
      class="flex-1 relative w-full h-full overflow-x-auto overflow-y-auto pt-0 pb-4 bg-bgRoot/60"
    >
      <!-- Loading State -->
      <div v-if="isLoading" class="h-full flex flex-col items-center justify-center text-textSecondary gap-3">
        <div class="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p class="text-xs">Carregando páginas de desenho...</p>
      </div>

      <!-- Centering Track -->
      <div
        v-else-if="currentDrawing"
        class="min-w-full w-max mx-auto px-6 md:pl-24 md:pr-16 flex flex-row items-start justify-center gap-8"
      >
        <!-- Pages Container (Horizontal lado a lado) -->
        <div
          v-for="(page, idx) in currentDrawing.pages"
          :key="page.id"
          class="relative flex flex-col items-center group shrink-0"
        >
          <!-- Controles de Página Flutuantes no topo da folha -->
          <div class="absolute top-2 right-2 flex items-center gap-1.5 z-20">
            <span class="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-bgPanel/85 backdrop-blur-sm border border-divider/60 text-textSecondary shadow-xs">
              {{ idx + 1 }} / {{ currentDrawing.pages.length }}
            </span>
            <button
              v-if="currentDrawing.pages.length > 1"
              @click.stop="handleRemovePage(idx)"
              class="p-1 rounded-md bg-bgPanel/85 hover:bg-red-500/15 text-textSecondary hover:text-red-500 border border-divider/60 transition-all shadow-xs cursor-pointer opacity-40 hover:opacity-100"
              title="Excluir esta página"
            >
              <TrashIcon class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Componente Canvas da Página -->
          <DrawingPageCanvas
            :ref="(el) => setPageCanvasRef(idx, el)"
            :page="page"
            :scale="pageScale"
            :tool="activeTool"
            :selected-shape-type="selectedShapeType"
            :color="strokeColor"
            :size="strokeSize"
            :selected-node-ids="selectedNodeIds"
            :selected-edge-id="selectedEdgeId"
            :palm-rejection="true"
            :is-active="activePageIndex === idx"
            :is-dark-mode="themeMode === 'dark'"
            @select-page="activePageIndex = idx"
            @stroke-added="(stroke) => handleStrokeAdded(idx, stroke)"
            @erase="(pt, radius) => handleErase(idx, pt, radius)"
            @add-node="(node) => addNodeToPage(idx, node)"
            @update-node="(nodeId, updates, saveHistory) => updateNodeInPage(idx, nodeId, updates, saveHistory)"
            @delete-node="(nodeId) => removeNodeFromPage(idx, nodeId)"
            @add-edge="(edge) => addEdgeToPage(idx, edge)"
            @select-node="(nodeId, isShift) => handleSelectNode(nodeId, isShift)"
            @select-edge="(edgeId) => selectedEdgeId = edgeId"
            @update:tool="(t) => activeTool = t"
          />
        </div>

        <!-- Botão Adicionar Página ao Lado: Seta com + -->
        <div class="self-center flex flex-col items-center justify-center px-4 shrink-0">
          <button
            @click="handleAddPage"
            class="w-14 h-14 rounded-full bg-bgPanel hover:bg-primary text-textSecondary hover:text-white border-2 border-divider hover:border-primary shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 group"
            title="Adicionar página ao lado"
          >
            <div class="flex items-center gap-0.5">
              <PlusIcon class="w-5 h-5 transition-transform group-hover:rotate-90 duration-200" />
              <ArrowRightIcon class="w-4 h-4 transition-transform group-hover:translate-x-0.5 duration-200" />
            </div>
          </button>
          <span class="text-[11px] font-semibold text-textSecondary mt-2 tracking-wide group-hover:text-primary transition-colors">
            Nova página
          </span>
        </div>
      </div>
    </main>

    <!-- Floating Docked Toolbar: Top on mobile, Left on desktop -->
    <div
      class="fixed z-30 pointer-events-none transition-all duration-200
             top-14 inset-x-0 flex justify-center px-2 py-1.5
             md:top-1/2 md:-translate-y-1/2 md:left-4 md:right-auto md:bottom-auto md:inset-x-auto md:p-0 md:flex md:flex-col"
    >
      <div class="pointer-events-auto max-w-[96vw] overflow-x-auto md:overflow-visible">
        <DrawingToolbar
          v-model:tool="activeTool"
          v-model:selected-shape-type="selectedShapeType"
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
  ArrowRight as ArrowRightIcon,
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
  middleware: ['auth'],
});

const route = useRoute();
const router = useRouter();
const drawingId = computed(() => route.params.id as string);

const { themeMode, toggleThemeMode } = useSettings();

const {
  currentDrawing,
  activePageIndex,
  activeTool,
  selectedShapeType,
  selectedNodeIds,
  selectedEdgeId,
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
  addNodeToPage,
  updateNodeInPage,
  removeNodeFromPage,
  addEdgeToPage,
  removeEdgeFromPage,
  undo,
  redo,
  saveDrawingNow,
  synthesizeDrawing,
  convertToNote,
} = useDrawing();

function handleSelectNode(nodeId: string, isShift: boolean) {
  if (!nodeId) {
    selectedNodeIds.value = [];
    return;
  }
  if (isShift) {
    if (selectedNodeIds.value.includes(nodeId)) {
      selectedNodeIds.value = selectedNodeIds.value.filter((id) => id !== nodeId);
    } else {
      selectedNodeIds.value.push(nodeId);
    }
  } else {
    selectedNodeIds.value = [nodeId];
  }
  selectedEdgeId.value = null;
}

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
  const isDesktop = window.innerWidth >= 768;
  // No desktop desconta barra lateral esquerda (~80px) + botão de adicionar página à direita (~120px)
  const availableWidth = isDesktop ? window.innerWidth - 200 : window.innerWidth - 32;
  // Colado no topo: altura total menos o header (56px) e respiro inferior suave (24px)
  const availableHeight = isDesktop ? window.innerHeight - 80 : window.innerHeight - 150;
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
    return;
  }

  // Navegação horizontal suave entre páginas ao rolar a roda do mouse normalmente
  if (viewportRef.value && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    const canScrollH = viewportRef.value.scrollWidth > viewportRef.value.clientWidth;
    const canScrollV = viewportRef.value.scrollHeight > viewportRef.value.clientHeight;
    if (canScrollH && !canScrollV) {
      e.preventDefault();
      viewportRef.value.scrollLeft += e.deltaY;
    }
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
  nextTick(() => {
    activePageIndex.value = (currentDrawing.value?.pages.length || 1) - 1;
    if (viewportRef.value) {
      viewportRef.value.scrollTo({
        left: viewportRef.value.scrollWidth,
        behavior: 'smooth',
      });
    }
  });
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

function handleKeyDown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null;
  if (
    target &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      target.closest('.ProseMirror'))
  ) {
    return;
  }

  const key = e.key.toLowerCase();
  if (key === 'v') {
    activeTool.value = 'select';
  } else if (key === 'p') {
    activeTool.value = 'pen';
  } else if (key === 'e') {
    activeTool.value = 'eraser';
  } else if (key === 's') {
    activeTool.value = 'shape';
  } else if (key === 't') {
    activeTool.value = 'text';
  } else if (key === 'delete' || key === 'backspace') {
    if (selectedNodeIds.value.length > 0) {
      e.preventDefault();
      for (const id of [...selectedNodeIds.value]) {
        removeNodeFromPage(activePageIndex.value, id);
      }
      selectedNodeIds.value = [];
    } else if (selectedEdgeId.value) {
      e.preventDefault();
      removeEdgeFromPage(activePageIndex.value, selectedEdgeId.value);
      selectedEdgeId.value = null;
    }
  }
}

onMounted(async () => {
  handleZoomFit();
  window.addEventListener('resize', handleZoomFit);
  window.addEventListener('keydown', handleKeyDown);
  if (viewportRef.value) {
    viewportRef.value.addEventListener('wheel', handleWheel, { passive: false });
  }
  if (drawingId.value) {
    await loadDrawing(drawingId.value);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleZoomFit);
  window.removeEventListener('keydown', handleKeyDown);
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
