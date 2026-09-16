<template>
  <div class="canvas-toolbar-container fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-40 select-none max-w-[calc(100vw-1rem)]" @pointerdown.stop>
    <!-- Main Floating Tool Group -->
    <div class="flex items-center gap-0.5 sm:gap-1 p-1 sm:p-1.5 rounded-2xl bg-bgPanel/95 border border-divider shadow-2xl backdrop-blur-xl">
      <!-- 1. Select / Move Pointer -->
      <button
        class="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all cursor-pointer flex-shrink-0"
        :class="activeTool === 'select' ? 'bg-primary text-white shadow-md' : 'text-textSecondary hover:text-textPrimary hover:bg-bgElevated'"
        title="Selecionar / Mover (V)"
        @click="$emit('update:activeTool', 'select')"
      >
        <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m3 3 7 18 3-7 7-3L3 3z" />
        </svg>
      </button>

      <!-- 2. Note Block (Rectangle Markdown Card) -->
      <button
        class="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all cursor-pointer flex-shrink-0"
        :class="activeTool === 'note' ? 'bg-primary text-white shadow-md' : 'text-textSecondary hover:text-textPrimary hover:bg-bgElevated'"
        title="Criar Bloco de Nota (N)"
        @click="$emit('update:activeTool', 'note')"
      >
        <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M7 7h10M7 12h10M7 17h6" />
        </svg>
      </button>

      <!-- 3. Shapes Dropdown -->
      <div class="relative flex-shrink-0" ref="shapesMenuRef">
        <button
          class="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all cursor-pointer"
          :class="activeTool === 'shape' ? 'bg-primary text-white shadow-md' : 'text-textSecondary hover:text-textPrimary hover:bg-bgElevated'"
          title="Formas Geométricas (S)"
          @click="toggleShapesMenu"
        >
          <!-- Current Shape Icon -->
          <component :is="getShapeIcon(selectedShapeType)" class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <!-- Shapes Selection Popover -->
        <div
          v-if="showShapesMenu"
          class="absolute bottom-11 sm:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 sm:p-1.5 rounded-xl bg-bgPanel/95 border border-divider shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            v-for="s in shapesList"
            :key="s.type"
            class="p-1.5 sm:p-2 rounded-lg hover:bg-bgElevated text-textSecondary hover:text-textPrimary transition-colors cursor-pointer"
            :class="{ 'bg-primary/20 text-primary': selectedShapeType === s.type }"
            :title="s.label"
            @click="selectShape(s.type)"
          >
            <component :is="s.icon" class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      <!-- 4. Free Text -->
      <button
        class="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all cursor-pointer flex-shrink-0"
        :class="activeTool === 'loose_text' ? 'bg-primary text-white shadow-md' : 'text-textSecondary hover:text-textPrimary hover:bg-bgElevated'"
        title="Texto Livre (T) — Clique no canvas para escrever"
        @click="onTextClick"
      >
        <span class="font-serif font-bold text-xs sm:text-sm">T</span>
      </button>

      <!-- 5. Pen / IA Handwriting Inking Mode -->
      <button
        class="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all cursor-pointer flex-shrink-0"
        :class="activeTool === 'pen' ? 'bg-primary text-white shadow-md ring-2 ring-primary/30' : 'text-textSecondary hover:text-textPrimary hover:bg-bgElevated'"
        title="Caneta & Transcrição IA (P)"
        @click="$emit('update:activeTool', 'pen')"
      >
        <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m12 19 7-7 3 3-7 7-3-3z" />
          <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="m2 2 7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      </button>

      <div class="w-px h-4 sm:h-5 bg-divider mx-0.5 flex-shrink-0"></div>

      <!-- ÍCONE DA NAVBAR (Aresta Logo) - Posição de Meio nos Itens do Canvas -->
      <button
        class="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all focus:outline-none focus:ring-2 focus:ring-accent/40 group cursor-pointer flex-shrink-0"
        title="Menu Principal Aresta (Expandir Barra de Navegação)"
        aria-label="Menu Principal Aresta"
        @click="toggleNavbar"
      >
        <ArestaLogoGraph :size="20" class="sm:hidden" :to="null" use-image />
        <ArestaLogoGraph :size="26" class="hidden sm:inline-flex" :to="null" use-image />
      </button>

      <div class="w-px h-4 sm:h-5 bg-divider mx-0.5 flex-shrink-0"></div>

      <!-- 6. Insert Book / Highlight Drawer Trigger -->
      <button
        class="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-textSecondary hover:text-textPrimary hover:bg-bgElevated transition-all cursor-pointer flex-shrink-0"
        title="Inserir Livro ou Citação (B)"
        @click="$emit('open-insert-drawer')"
      >
        <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10M6 10h10" />
        </svg>
      </button>

      <!-- 7. Undo -->
      <button
        class="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none text-textSecondary hover:text-textPrimary hover:bg-bgElevated cursor-pointer flex-shrink-0"
        :disabled="!canUndo"
        title="Desfazer (Ctrl+Z)"
        @click="$emit('undo')"
      >
        <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </svg>
      </button>

      <!-- 8. Redo -->
      <button
        class="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none text-textSecondary hover:text-textPrimary hover:bg-bgElevated cursor-pointer flex-shrink-0"
        :disabled="!canRedo"
        title="Refazer (Ctrl+Shift+Z)"
        @click="$emit('redo')"
      >
        <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 7v6h-6" />
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
        </svg>
      </button>

      <!-- 9. Três Pontinhos (Mais Opções: Zoom & Exportar) -->
      <div class="relative flex-shrink-0" ref="moreMenuRef">
        <button
          class="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all cursor-pointer"
          :class="showMoreMenu ? 'bg-bgElevated text-textPrimary shadow-sm' : 'text-textSecondary hover:text-textPrimary hover:bg-bgElevated'"
          title="Mais opções (Zoom & Exportar)"
          aria-label="Mais opções"
          @click.stop="showMoreMenu = !showMoreMenu"
        >
          <MoreHorizontalIcon class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <!-- Popover com Zoom e Exportar -->
        <div
          v-if="showMoreMenu"
          class="absolute bottom-11 sm:bottom-12 right-0 p-2 sm:p-2.5 rounded-2xl bg-bgPanel/95 border border-divider shadow-2xl backdrop-blur-xl z-50 flex flex-col gap-2 min-w-[180px] sm:min-w-[200px] animate-in fade-in zoom-in-95 duration-150"
          @click.stop
        >
          <!-- Controles de Zoom -->
          <div class="space-y-1.5">
            <span class="text-[11px] font-semibold text-textSecondary px-1 uppercase tracking-wider font-interface">
              Zoom
            </span>
            <div class="flex items-center justify-between p-1 rounded-xl bg-bgElevated/80 border border-divider">
              <button
                class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bgSurface text-textPrimary text-sm font-semibold transition-colors cursor-pointer"
                title="Diminuir Zoom (-)"
                @click="$emit('zoom-out')"
              >
                -
              </button>
              <button
                class="px-2 py-1 rounded-md text-xs font-mono text-textPrimary hover:bg-bgSurface transition-colors cursor-pointer font-semibold"
                title="Redefinir Zoom (100%)"
                @click="$emit('reset-zoom')"
              >
                {{ Math.round(zoom * 100) }}%
              </button>
              <button
                class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bgSurface text-textPrimary text-sm font-semibold transition-colors cursor-pointer"
                title="Aumentar Zoom (+)"
                @click="$emit('zoom-in')"
              >
                +
              </button>
            </div>
          </div>

          <div class="h-px bg-divider w-full"></div>

          <!-- Botão Exportar .canvas -->
          <button
            class="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-textPrimary hover:bg-bgElevated transition-colors cursor-pointer w-full text-left"
            title="Exportar JSON Canvas (.canvas)"
            @click="$emit('export'); showMoreMenu = false"
          >
            <svg class="w-4 h-4 text-textSecondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Exportar (.canvas)</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Autosave Badge -->
    <div class="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bgPanel/95 border border-divider shadow-xl text-xs text-textSecondary backdrop-blur-xl">
      <span
        class="w-2 h-2 rounded-full"
        :class="isSaving ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'"
      ></span>
      <span>{{ isSaving ? 'Salvando...' : 'Salvo' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { MoreHorizontalIcon } from 'lucide-vue-next';
import ArestaLogoGraph from '~/components/ArestaLogoGraph.vue';
import { useBottomNavbar } from '~/composables/useBottomNavbar';
import type { CanvasShapeType } from '~/interfaces/canvas';
import { CANVAS_SHAPES, getShapeIcon } from '~/utils/canvasShapes';

const props = defineProps<{
  activeTool: string;
  selectedShapeType: CanvasShapeType;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  isSaving: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:activeTool', tool: 'select' | 'note' | 'shape' | 'loose_text' | 'pen'): void;
  (e: 'update:selectedShapeType', shape: CanvasShapeType): void;
  (e: 'open-insert-drawer'): void;
  (e: 'create-text-at-center'): void;
  (e: 'undo'): void;
  (e: 'redo'): void;
  (e: 'zoom-in'): void;
  (e: 'zoom-out'): void;
  (e: 'reset-zoom'): void;
  (e: 'export'): void;
}>();

const { toggleCollapse: toggleNavbar } = useBottomNavbar();

const showMoreMenu = ref(false);
const moreMenuRef = ref<HTMLElement | null>(null);
const shapesMenuRef = ref<HTMLElement | null>(null);

const onTextClick = () => {
  if (props.activeTool === 'loose_text') {
    emit('create-text-at-center');
  } else {
    emit('update:activeTool', 'loose_text');
  }
};

const showShapesMenu = ref(false);

const toggleShapesMenu = () => {
  showShapesMenu.value = !showShapesMenu.value;
  emit('update:activeTool', 'shape');
};

const selectShape = (shape: CanvasShapeType) => {
  emit('update:selectedShapeType', shape);
  emit('update:activeTool', 'shape');
  showShapesMenu.value = false;
};

const handleClickOutside = (e: MouseEvent) => {
  if (moreMenuRef.value && !moreMenuRef.value.contains(e.target as Node)) {
    showMoreMenu.value = false;
  }
  if (shapesMenuRef.value && !shapesMenuRef.value.contains(e.target as Node)) {
    showShapesMenu.value = false;
  }
};

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('click', handleClickOutside);
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', handleClickOutside);
  }
});

const shapesList = CANVAS_SHAPES;
</script>
