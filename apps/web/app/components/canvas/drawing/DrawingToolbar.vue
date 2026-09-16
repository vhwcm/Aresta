<template>
  <div
    class="flex flex-row md:flex-col items-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-2 md:py-3 rounded-2xl bg-bgPanel/95 backdrop-blur-md border border-divider shadow-xl text-textPrimary select-none z-30 shrink-0"
  >
    <!-- Grupo 1: Seleção e Desenho Livre -->
    <div class="flex flex-row md:flex-col items-center gap-1 p-1 bg-bgElevated/80 rounded-xl border border-divider/40">
      <!-- 1. Selecionar / Mover (Mouse) -->
      <button
        @click="$emit('update:tool', 'select')"
        class="p-1.5 md:p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer"
        :class="tool === 'select' ? 'bg-primary text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurface'"
        title="Selecionar / Mover (V)"
      >
        <MousePointerIcon class="w-4 h-4" />
      </button>

      <!-- 2. Caneta -->
      <button
        @click="$emit('update:tool', 'pen')"
        class="p-1.5 md:p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer"
        :class="tool === 'pen' ? 'bg-primary text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurface'"
        title="Caneta (P)"
      >
        <PenToolIcon class="w-4 h-4" />
      </button>

      <!-- 3. Marcador -->
      <button
        @click="$emit('update:tool', 'highlighter')"
        class="p-1.5 md:p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer"
        :class="tool === 'highlighter' ? 'bg-primary text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurface'"
        title="Marcador"
      >
        <HighlighterIcon class="w-4 h-4" />
      </button>

      <!-- 4. Borracha -->
      <button
        @click="$emit('update:tool', 'eraser')"
        class="p-1.5 md:p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer"
        :class="tool === 'eraser' ? 'bg-primary text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurface'"
        title="Borracha (E)"
      >
        <EraserIcon class="w-4 h-4" />
      </button>
    </div>

    <!-- Divisor -->
    <div class="h-5 w-px md:w-6 md:h-px bg-divider/60"></div>

    <!-- Grupo 2: Formas Geométricas & Texto -->
    <div class="flex flex-row md:flex-col items-center gap-1 p-1 bg-bgElevated/80 rounded-xl border border-divider/40">
      <!-- 5. Formas Geométricas Dropdown -->
      <div class="relative" ref="shapesMenuRef">
        <button
          @click="toggleShapesMenu"
          class="p-1.5 md:p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer"
          :class="tool === 'shape' ? 'bg-primary text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurface'"
          title="Formas Geométricas (S)"
        >
          <component :is="getShapeIcon(selectedShapeType)" class="w-4 h-4" />
        </button>

        <!-- Popover de Formas Geométricas -->
        <div
          v-if="showShapesMenu"
          class="absolute bottom-12 md:bottom-auto md:left-14 md:top-0 flex flex-row md:grid md:grid-cols-2 gap-1 p-1.5 rounded-xl bg-bgPanel/95 border border-divider shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-100 min-w-max"
        >
          <button
            v-for="s in shapesList"
            :key="s.type"
            class="p-1.5 rounded-lg hover:bg-bgElevated text-textSecondary hover:text-textPrimary transition-colors cursor-pointer"
            :class="{ 'bg-primary/20 text-primary': selectedShapeType === s.type }"
            :title="s.label"
            @click="selectShape(s.type)"
          >
            <component :is="s.icon" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- 6. Texto Livre -->
      <button
        @click="$emit('update:tool', 'text')"
        class="p-1.5 md:p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer"
        :class="tool === 'text' ? 'bg-primary text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurface'"
        title="Inserir Texto (T)"
      >
        <span class="font-serif font-bold text-sm leading-none">T</span>
      </button>
    </div>

    <!-- Divisor -->
    <div class="h-5 w-px md:w-6 md:h-px bg-divider/60"></div>

    <!-- Paleta de Cores Rápida -->
    <div class="flex flex-row md:grid md:grid-cols-2 items-center gap-1.5 p-1">
      <button
        v-for="c in paletteColors"
        :key="c"
        @click="$emit('update:color', c)"
        class="w-4 h-4 md:w-5 md:h-5 rounded-full border border-black/10 dark:border-white/10 transition-transform cursor-pointer"
        :class="color === c ? 'scale-125 ring-2 ring-primary ring-offset-2 ring-offset-bgPanel' : 'hover:scale-110'"
        :style="{ backgroundColor: c }"
        :title="`Cor: ${c}`"
      />
    </div>

    <!-- Divisor -->
    <div class="h-5 w-px md:w-6 md:h-px bg-divider/60"></div>

    <!-- Slider de Espessura -->
    <div class="flex flex-row md:flex-col items-center gap-1.5 px-1">
      <div
        class="rounded-full bg-current transition-all shrink-0"
        :style="{
          width: `${Math.max(size, 3)}px`,
          height: `${Math.max(size, 3)}px`,
          color: color,
        }"
      />
      <input
        type="range"
        min="1"
        max="16"
        step="1"
        :value="size"
        @input="$emit('update:size', Number(($event.target as HTMLInputElement).value))"
        class="w-14 md:w-14 accent-primary cursor-pointer"
        title="Espessura do traço"
      />
    </div>

    <!-- Divisor -->
    <div class="h-5 w-px md:w-6 md:h-px bg-divider/60"></div>

    <!-- Controles de Zoom -->
    <div class="flex flex-row md:flex-col items-center gap-0.5 bg-bgElevated/80 border border-divider/60 rounded-xl p-1 text-xs">
      <button
        @click="$emit('zoom-in')"
        class="p-1 rounded-lg hover:bg-bgSurface text-textSecondary hover:text-textPrimary transition-all cursor-pointer"
        title="Aumentar Zoom"
      >
        <ZoomInIcon class="w-3.5 h-3.5" />
      </button>
      <button
        @click="$emit('zoom-fit')"
        class="px-1 py-0.5 text-[10px] font-mono font-semibold text-textSecondary hover:text-primary transition-colors cursor-pointer"
        title="Ajustar à tela do notebook"
      >
        {{ Math.round(zoom * 100) }}%
      </button>
      <button
        @click="$emit('zoom-out')"
        class="p-1 rounded-lg hover:bg-bgSurface text-textSecondary hover:text-textPrimary transition-all cursor-pointer"
        title="Diminuir Zoom"
      >
        <ZoomOutIcon class="w-3.5 h-3.5" />
      </button>
      <button
        @click="$emit('zoom-fit')"
        class="p-1 rounded-lg hover:bg-bgSurface text-textSecondary hover:text-textPrimary transition-all cursor-pointer hidden md:flex items-center justify-center"
        title="Ajustar página inteira na tela"
      >
        <Maximize2Icon class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Divisor -->
    <div class="h-5 w-px md:w-6 md:h-px bg-divider/60"></div>

    <!-- Ações: Desfazer / Refazer -->
    <div class="flex flex-row md:flex-col items-center gap-1">
      <button
        :disabled="!canUndo"
        @click="$emit('undo')"
        class="p-1.5 md:p-2 rounded-xl bg-bgElevated text-textSecondary hover:text-textPrimary border border-divider transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        title="Desfazer (Ctrl+Z)"
      >
        <UndoIcon class="w-3.5 h-3.5 md:w-4 md:h-4" />
      </button>
      <button
        :disabled="!canRedo"
        @click="$emit('redo')"
        class="p-1.5 md:p-2 rounded-xl bg-bgElevated text-textSecondary hover:text-textPrimary border border-divider transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        title="Refazer (Ctrl+Y)"
      >
        <RedoIcon class="w-3.5 h-3.5 md:w-4 md:h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
  MousePointer as MousePointerIcon,
  PenTool as PenToolIcon,
  Highlighter as HighlighterIcon,
  Eraser as EraserIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Maximize2 as Maximize2Icon,
  Undo2 as UndoIcon,
  Redo2 as RedoIcon,
} from 'lucide-vue-next';
import type { PenToolType } from '~/interfaces/drawing';
import type { CanvasShapeType } from '~/interfaces/canvas';
import { CANVAS_SHAPES, getShapeIcon } from '~/utils/canvasShapes';

const props = withDefaults(
  defineProps<{
    tool: PenToolType;
    selectedShapeType?: CanvasShapeType;
    color: string;
    size: number;
    canUndo: boolean;
    canRedo: boolean;
    zoom?: number;
  }>(),
  {
    selectedShapeType: 'rectangle',
    zoom: 1,
  }
);

const emit = defineEmits<{
  (e: 'update:tool', tool: PenToolType): void;
  (e: 'update:selectedShapeType', shape: CanvasShapeType): void;
  (e: 'update:color', color: string): void;
  (e: 'update:size', size: number): void;
  (e: 'zoom-in'): void;
  (e: 'zoom-out'): void;
  (e: 'zoom-fit'): void;
  (e: 'undo'): void;
  (e: 'redo'): void;
}>();

const showShapesMenu = ref(false);
const shapesMenuRef = ref<HTMLElement | null>(null);
const shapesList = CANVAS_SHAPES;

const toggleShapesMenu = () => {
  showShapesMenu.value = !showShapesMenu.value;
  emit('update:tool', 'shape');
};

const selectShape = (shape: CanvasShapeType) => {
  emit('update:selectedShapeType', shape);
  emit('update:tool', 'shape');
  showShapesMenu.value = false;
};

const handleClickOutside = (e: MouseEvent) => {
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

const paletteColors = [
  '#18181B', // Preto / Grafite
  '#E57B55', // Laranja Aresta
  '#3B82F6', // Azul Royal
  '#10B981', // Verde Esmeralda
  '#EF4444', // Vermelho Coral
  '#F59E0B', // Âmbar
];
</script>
