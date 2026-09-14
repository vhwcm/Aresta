<template>
  <div
    class="flex flex-row md:flex-col items-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-2 md:py-3 rounded-2xl bg-bgPanel/95 backdrop-blur-md border border-divider shadow-xl text-textPrimary select-none z-30 shrink-0"
  >
    <!-- Grupo de Ferramentas de Escrita: Caneta, Marcador, Borracha -->
    <div class="flex flex-row md:flex-col items-center gap-1 p-1 bg-bgElevated/80 rounded-xl border border-divider/40">
      <!-- Caneta -->
      <button
        @click="$emit('update:tool', 'pen')"
        class="p-1.5 md:p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer"
        :class="tool === 'pen' ? 'bg-primary text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurface'"
        title="Caneta"
      >
        <PenToolIcon class="w-4 h-4" />
      </button>

      <!-- Marcador -->
      <button
        @click="$emit('update:tool', 'highlighter')"
        class="p-1.5 md:p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer"
        :class="tool === 'highlighter' ? 'bg-primary text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurface'"
        title="Marcador"
      >
        <HighlighterIcon class="w-4 h-4" />
      </button>

      <!-- Borracha -->
      <button
        @click="$emit('update:tool', 'eraser')"
        class="p-1.5 md:p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer"
        :class="tool === 'eraser' ? 'bg-primary text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurface'"
        title="Borracha (ou segure o botão da caneta Stylus/S-Pen)"
      >
        <EraserIcon class="w-4 h-4" />
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
import {
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

withDefaults(
  defineProps<{
    tool: PenToolType;
    color: string;
    size: number;
    canUndo: boolean;
    canRedo: boolean;
    zoom?: number;
  }>(),
  {
    zoom: 1,
  }
);

defineEmits<{
  (e: 'update:tool', tool: PenToolType): void;
  (e: 'update:color', color: string): void;
  (e: 'update:size', size: number): void;
  (e: 'zoom-in'): void;
  (e: 'zoom-out'): void;
  (e: 'zoom-fit'): void;
  (e: 'undo'): void;
  (e: 'redo'): void;
}>();

const paletteColors = [
  '#18181B', // Preto / Grafite
  '#E57B55', // Laranja Aresta
  '#3B82F6', // Azul Royal
  '#10B981', // Verde Esmeralda
  '#EF4444', // Vermelho Coral
  '#F59E0B', // Âmbar
];
</script>
