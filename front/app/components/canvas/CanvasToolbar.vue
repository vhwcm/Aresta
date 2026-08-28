<template>
  <div class="canvas-toolbar-container fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-40 select-none">
    <!-- Main Floating Tool Group -->
    <div class="flex items-center gap-1 p-1.5 rounded-2xl bg-bgPanel/95 border border-divider shadow-2xl backdrop-blur-xl">
      <!-- Select / Move Pointer -->
      <button
        class="flex items-center justify-center w-9 h-9 rounded-xl transition-all"
        :class="activeTool === 'select' ? 'bg-primary text-white shadow-md' : 'text-textSecondary hover:text-textPrimary hover:bg-bgElevated'"
        title="Selecionar / Mover (V)"
        @click="$emit('update:activeTool', 'select')"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m3 3 7 18 3-7 7-3L3 3z" />
        </svg>
      </button>

      <!-- Note Block (Rectangle Markdown Card) -->
      <button
        class="flex items-center justify-center w-9 h-9 rounded-xl transition-all"
        :class="activeTool === 'note' ? 'bg-primary text-white shadow-md' : 'text-textSecondary hover:text-textPrimary hover:bg-bgElevated'"
        title="Criar Bloco de Nota (N)"
        @click="$emit('update:activeTool', 'note')"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M7 7h10M7 12h10M7 17h6" />
        </svg>
      </button>

      <!-- Shapes Dropdown -->
      <div class="relative">
        <button
          class="flex items-center justify-center w-9 h-9 rounded-xl transition-all"
          :class="activeTool === 'shape' ? 'bg-primary text-white shadow-md' : 'text-textSecondary hover:text-textPrimary hover:bg-bgElevated'"
          title="Formas Geométricas (S)"
          @click="toggleShapesMenu"
        >
          <!-- Current Shape Icon -->
          <svg v-if="selectedShapeType === 'rectangle'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="18" height="18" x="3" y="3" rx="2" />
          </svg>
          <svg v-else-if="selectedShapeType === 'ellipse'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9" />
          </svg>
          <svg v-else-if="selectedShapeType === 'diamond'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2 22 12 12 22 2 12z" />
          </svg>
          <svg v-else-if="selectedShapeType === 'triangle'" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 3 2 21h20z" />
          </svg>
          <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="18" height="18" x="3" y="3" rx="6" />
          </svg>
        </button>

        <!-- Shapes Selection Popover -->
        <div
          v-if="showShapesMenu"
          class="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 rounded-xl bg-bgPanel border border-divider shadow-xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            v-for="s in shapesList"
            :key="s.type"
            class="p-2 rounded-lg hover:bg-bgElevated text-textSecondary hover:text-textPrimary transition-colors"
            :class="{ 'bg-primary/20 text-primary': selectedShapeType === s.type }"
            :title="s.label"
            @click="selectShape(s.type)"
          >
            <component :is="s.icon" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Free Text -->
      <button
        class="flex items-center justify-center w-9 h-9 rounded-xl transition-all"
        :class="activeTool === 'loose_text' ? 'bg-primary text-white shadow-md' : 'text-textSecondary hover:text-textPrimary hover:bg-bgElevated'"
        title="Texto Solto (T)"
        @click="$emit('update:activeTool', 'loose_text')"
      >
        <span class="font-serif font-bold text-sm">T</span>
      </button>

      <!-- Pen / IA Handwriting Inking Mode -->
      <button
        class="flex items-center justify-center w-9 h-9 rounded-xl transition-all"
        :class="activeTool === 'pen' ? 'bg-primary text-white shadow-md ring-2 ring-primary/30' : 'text-textSecondary hover:text-textPrimary hover:bg-bgElevated'"
        title="Caneta & Transcrição IA (P)"
        @click="$emit('update:activeTool', 'pen')"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m12 19 7-7 3 3-7 7-3-3z" />
          <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="m2 2 7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      </button>

      <!-- Insert Book / Highlight Drawer Trigger -->
      <button
        class="flex items-center justify-center w-9 h-9 rounded-xl text-textSecondary hover:text-textPrimary hover:bg-bgElevated transition-all"
        title="Inserir Livro ou Citação (B)"
        @click="$emit('open-insert-drawer')"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10M6 10h10" />
        </svg>
      </button>

      <div class="w-px h-5 bg-divider mx-1"></div>

      <!-- Undo -->
      <button
        class="flex items-center justify-center w-9 h-9 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none text-textSecondary hover:text-textPrimary hover:bg-bgElevated"
        :disabled="!canUndo"
        title="Desfazer (Ctrl+Z)"
        @click="$emit('undo')"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </svg>
      </button>

      <!-- Redo -->
      <button
        class="flex items-center justify-center w-9 h-9 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none text-textSecondary hover:text-textPrimary hover:bg-bgElevated"
        :disabled="!canRedo"
        title="Refazer (Ctrl+Shift+Z)"
        @click="$emit('redo')"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 7v6h-6" />
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
        </svg>
      </button>

      <div class="w-px h-5 bg-divider mx-1"></div>

      <!-- Zoom Controls -->
      <button
        class="flex items-center justify-center w-8 h-8 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-bgElevated text-xs font-semibold"
        title="Diminuir Zoom (-)"
        @click="$emit('zoom-out')"
      >
        -
      </button>

      <button
        class="px-2 py-1 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-bgElevated text-xs font-mono"
        title="Redefinir Zoom (100%)"
        @click="$emit('reset-zoom')"
      >
        {{ Math.round(zoom * 100) }}%
      </button>

      <button
        class="flex items-center justify-center w-8 h-8 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-bgElevated text-xs font-semibold"
        title="Aumentar Zoom (+)"
        @click="$emit('zoom-in')"
      >
        +
      </button>

      <div class="w-px h-5 bg-divider mx-1"></div>

      <!-- Export .canvas button -->
      <button
        class="flex items-center justify-center w-9 h-9 rounded-xl text-textSecondary hover:text-textPrimary hover:bg-bgElevated transition-all"
        title="Exportar JSON Canvas (.canvas)"
        @click="$emit('export')"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>
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
import { ref, h } from 'vue';
import type { CanvasShapeType } from '~/interfaces/canvas';

defineProps<{
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
  (e: 'undo'): void;
  (e: 'redo'): void;
  (e: 'zoom-in'): void;
  (e: 'zoom-out'): void;
  (e: 'reset-zoom'): void;
  (e: 'export'): void;
}>();

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

// Shape icon components
const RectIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }, [
  h('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' })
]);
const RoundedIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }, [
  h('rect', { width: '18', height: '18', x: '3', y: '3', rx: '6' })
]);
const CircleIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }, [
  h('circle', { cx: '12', cy: '12', r: '9' })
]);
const DiamondIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }, [
  h('path', { d: 'M12 2 22 12 12 22 2 12z' })
]);
const TriangleIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' }, [
  h('path', { d: 'M12 3 2 21h20z' })
]);

const shapesList: Array<{ type: CanvasShapeType; label: string; icon: any }> = [
  { type: 'rectangle', label: 'Retângulo', icon: RectIcon },
  { type: 'rounded', label: 'Arredondado', icon: RoundedIcon },
  { type: 'ellipse', label: 'Círculo / Elipse', icon: CircleIcon },
  { type: 'diamond', label: 'Losango', icon: DiamondIcon },
  { type: 'triangle', label: 'Triângulo', icon: TriangleIcon },
];
</script>
