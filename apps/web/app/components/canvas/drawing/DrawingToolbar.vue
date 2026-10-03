<template>
  <div
    class="w-full h-11 shrink-0 px-3 sm:px-6 border-b border-divider bg-bgPanel flex items-center justify-center gap-1.5 sm:gap-2.5 text-textPrimary select-none z-20 overflow-x-auto"
  >
    <!-- 1. Selecionar / Mover (Mouse) -->
    <button
      type="button"
      @click="$emit('update:tool', 'select')"
      class="p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer shrink-0"
      :class="tool === 'select' ? 'bg-primary text-white shadow-xs' : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurface'"
      title="Selecionar / Mover (V)"
      aria-label="Selecionar ou Mover"
    >
      <MousePointerIcon class="w-4 h-4" />
    </button>

    <!-- 2. Caneta -->
    <button
      type="button"
      @click="$emit('update:tool', 'pen')"
      class="p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer shrink-0"
      :class="tool === 'pen' ? 'bg-primary text-white shadow-xs' : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurface'"
      title="Caneta (P)"
      aria-label="Caneta"
    >
      <PenToolIcon class="w-4 h-4" />
    </button>

    <!-- 3. Marcador -->
    <button
      type="button"
      @click="$emit('update:tool', 'highlighter')"
      class="p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer shrink-0"
      :class="tool === 'highlighter' ? 'bg-primary text-white shadow-xs' : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurface'"
      title="Marcador"
      aria-label="Marcador"
    >
      <HighlighterIcon class="w-4 h-4" />
    </button>

    <!-- 4. Borracha -->
    <button
      type="button"
      @click="$emit('update:tool', 'eraser')"
      class="p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer shrink-0"
      :class="tool === 'eraser' ? 'bg-primary text-white shadow-xs' : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurface'"
      title="Borracha (E)"
      aria-label="Borracha"
    >
      <EraserIcon class="w-4 h-4" />
    </button>

    <!-- 5. Modo Caneta (Apenas caneta desenha, 1 dedo navega) -->
    <button
      type="button"
      @click="$emit('update:penMode', !penMode)"
      class="relative p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer shrink-0"
      :class="penMode ? 'bg-primary text-white shadow-xs' : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurface'"
      :title="penMode ? 'Modo Caneta Ativado (Apenas caneta escreve, 1 dedo navega)' : 'Modo Caneta Desativado (Dedo escreve, 2 dedos navegam)'"
      aria-label="Modo Caneta"
    >
      <PenLineIcon class="w-4 h-4" />
      <span
        v-if="penMode"
        class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-bgPanel"
      />
    </button>

    <!-- Divisor Sutil -->
    <div class="h-4 w-px bg-divider shrink-0"></div>

    <!-- 6. Formas Geométricas Dropdown -->
    <div class="relative shrink-0" ref="shapesMenuRef">
      <button
        type="button"
        @click="toggleShapesMenu"
        class="p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer"
        :class="tool === 'shape' ? 'bg-primary text-white shadow-xs' : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurface'"
        title="Formas Geométricas (S)"
        aria-label="Formas Geométricas"
      >
        <component :is="getShapeIcon(selectedShapeType)" class="w-4 h-4" />
      </button>

      <!-- Popover de Formas Geométricas (Abre para baixo da barra) -->
      <div
        v-if="showShapesMenu"
        class="absolute top-full mt-2 left-0 flex flex-row flex-wrap gap-1 p-1.5 rounded-xl bg-bgPanel border border-divider shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 min-w-max"
      >
        <button
          v-for="s in shapesList"
          :key="s.type"
          type="button"
          class="p-1.5 rounded-lg hover:bg-bgElevated text-textSecondary hover:text-textPrimary transition-colors cursor-pointer"
          :class="{ 'bg-primary/20 text-primary': selectedShapeType === s.type }"
          :title="s.label"
          @click="selectShape(s.type)"
        >
          <component :is="s.icon" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- 7. Texto Livre -->
    <button
      type="button"
      @click="$emit('update:tool', 'text')"
      class="p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer shrink-0"
      :class="tool === 'text' ? 'bg-primary text-white shadow-xs' : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurface'"
      title="Inserir Texto (T)"
      aria-label="Inserir Texto"
    >
      <span class="font-serif font-bold text-sm leading-none">T</span>
    </button>

    <!-- Divisor Sutil -->
    <div class="h-4 w-px bg-divider shrink-0"></div>

    <!-- 8. Seletor de Cores Dinâmico: 2 Slots Rápidos e Paleta Completa em Blocos -->
    <div class="relative flex items-center gap-1.5 shrink-0" ref="colorPickerRef">
      <!-- Slot 1 -->
      <button
        type="button"
        data-testid="color-slot-1"
        @click="handleSlotClick(1)"
        class="w-5 h-5 rounded-full border border-black/15 dark:border-white/15 transition-transform cursor-pointer relative"
        :class="[
          activeSlot === 1
            ? 'scale-115 ring-2 ring-primary ring-offset-2 ring-offset-bgPanel z-10'
            : 'hover:scale-110 opacity-70 hover:opacity-100'
        ]"
        :style="{ backgroundColor: slot1Color }"
        :title="`Cor 1: ${slot1Color} (${activeSlot === 1 ? 'Clique para abrir paleta completa' : 'Clique para selecionar'})`"
        aria-label="Cor 1"
      />

      <!-- Slot 2 -->
      <button
        type="button"
        data-testid="color-slot-2"
        @click="handleSlotClick(2)"
        class="w-5 h-5 rounded-full border border-black/15 dark:border-white/15 transition-transform cursor-pointer relative"
        :class="[
          activeSlot === 2
            ? 'scale-115 ring-2 ring-primary ring-offset-2 ring-offset-bgPanel z-10'
            : 'hover:scale-110 opacity-70 hover:opacity-100'
        ]"
        :style="{ backgroundColor: slot2Color }"
        :title="`Cor 2: ${slot2Color} (${activeSlot === 2 ? 'Clique para abrir paleta completa' : 'Clique para selecionar'})`"
        aria-label="Cor 2"
      />

      <!-- Popover de Cores Dividido em Blocos -->
      <div
        v-if="showColorPicker"
        data-testid="color-palette-popover"
        class="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-bgPanel border border-divider rounded-2xl shadow-2xl p-3 z-50 flex flex-col gap-2.5 w-64 animate-in fade-in zoom-in-95 duration-100"
      >
        <div v-for="block in colorBlocks" :key="block.name" class="flex flex-col gap-1">
          <span class="text-[10px] uppercase font-semibold text-textSecondary tracking-wider">{{ block.name }}</span>
          <div class="grid grid-cols-6 gap-1.5">
            <button
              v-for="c in block.colors"
              :key="c"
              type="button"
              @click="selectColorFromPalette(c)"
              class="w-6 h-6 rounded-lg border border-black/10 dark:border-white/10 transition-transform hover:scale-115 cursor-pointer flex items-center justify-center"
              :class="color.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-primary ring-offset-1 ring-offset-bgPanel' : ''"
              :style="{ backgroundColor: c }"
              :title="`Selecionar cor ${c}`"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Divisor Sutil -->
    <div class="h-4 w-px bg-divider shrink-0"></div>

    <!-- 9. Slider de Espessura -->
    <div class="flex items-center gap-1.5 px-1 shrink-0">
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
        class="w-14 sm:w-16 h-1 accent-primary cursor-pointer"
        title="Espessura do traço"
        aria-label="Espessura do traço"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import {
  MousePointer as MousePointerIcon,
  PenTool as PenToolIcon,
  Highlighter as HighlighterIcon,
  Eraser as EraserIcon,
  PenLine as PenLineIcon,
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
    penMode?: boolean;
  }>(),
  {
    selectedShapeType: 'rectangle',
    penMode: false,
  }
);

const emit = defineEmits<{
  (_e: 'update:tool', _tool: PenToolType): void;
  (_e: 'update:selectedShapeType', _shape: CanvasShapeType): void;
  (_e: 'update:color', _color: string): void;
  (_e: 'update:size', _size: number): void;
  (_e: 'update:penMode', _penMode: boolean): void;
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

// Gerenciamento dos 2 Slots de Cor
const slot1Color = ref(props.color && props.color !== '#E57B55' ? props.color : '#18181B');
const slot2Color = ref(props.color === '#E57B55' ? '#18181B' : '#E57B55');
const activeSlot = ref<1 | 2>(props.color.toLowerCase() === slot2Color.value.toLowerCase() ? 2 : 1);
const showColorPicker = ref(false);
const colorPickerRef = ref<HTMLElement | null>(null);

// Paleta Completa Dividida em Blocos Temáticos
const colorBlocks = [
  {
    name: 'Neutros & Grafites',
    colors: ['#09090B', '#18181B', '#3F3F46', '#71717A', '#A1A1AA', '#FFFFFF'],
  },
  {
    name: 'Aresta & Quentes',
    colors: ['#E57B55', '#EA580C', '#DC2626', '#F87171', '#D97706', '#FBBF24'],
  },
  {
    name: 'Frios & Azuis',
    colors: ['#1D4ED8', '#2563EB', '#0284C7', '#06B6D4', '#6366F1', '#8B5CF6'],
  },
  {
    name: 'Naturais & Verdes',
    colors: ['#047857', '#10B981', '#059669', '#16A34A', '#84CC16', '#14B8A6'],
  },
];

const handleSlotClick = (slot: 1 | 2) => {
  if (activeSlot.value !== slot) {
    activeSlot.value = slot;
    const newColor = slot === 1 ? slot1Color.value : slot2Color.value;
    emit('update:color', newColor);
    showColorPicker.value = false;
  } else {
    // Já está selecionado: abre/fecha seletor de cores em blocos
    showColorPicker.value = !showColorPicker.value;
  }
};

const selectColorFromPalette = (c: string) => {
  if (activeSlot.value === 1) {
    slot1Color.value = c;
  } else {
    slot2Color.value = c;
  }
  emit('update:color', c);
  showColorPicker.value = false;
};

// Sincronizar cor externa caso mude de fora
watch(
  () => props.color,
  (newColor) => {
    if (!newColor) return;
    if (newColor.toLowerCase() === slot1Color.value.toLowerCase()) {
      activeSlot.value = 1;
    } else if (newColor.toLowerCase() === slot2Color.value.toLowerCase()) {
      activeSlot.value = 2;
    } else {
      if (activeSlot.value === 1) {
        slot1Color.value = newColor;
      } else {
        slot2Color.value = newColor;
      }
    }
  }
);

const handleClickOutside = (e: MouseEvent) => {
  if (shapesMenuRef.value && !shapesMenuRef.value.contains(e.target as Node)) {
    showShapesMenu.value = false;
  }
  if (colorPickerRef.value && !colorPickerRef.value.contains(e.target as Node)) {
    showColorPicker.value = false;
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
</script>
