<template>
  <div
    class="flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-2xl bg-bgPanel/95 backdrop-blur-md border border-divider shadow-xl text-textPrimary select-none z-30 flex-wrap sm:flex-nowrap justify-center"
  >
    <!-- Grupo de Ferramentas de Escrita -->
    <div class="flex items-center gap-1 p-1 bg-bgElevated/80 rounded-xl border border-divider/40">
      <!-- Caneta Fineliner -->
      <button
        @click="$emit('update:tool', 'pen')"
        class="p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer"
        :class="tool === 'pen' ? 'bg-primary text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurface'"
        title="Caneta Esferográfica"
      >
        <PenToolIcon class="w-4 h-4" />
      </button>

      <!-- Caneta Tinteiro / Caligrafia -->
      <button
        @click="$emit('update:tool', 'fountain')"
        class="p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer"
        :class="tool === 'fountain' ? 'bg-primary text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurface'"
        title="Caneta Tinteiro"
      >
        <FeatherIcon class="w-4 h-4" />
      </button>

      <!-- Lápis -->
      <button
        @click="$emit('update:tool', 'pencil')"
        class="p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer"
        :class="tool === 'pencil' ? 'bg-primary text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurface'"
        title="Lápis"
      >
        <PencilIcon class="w-4 h-4" />
      </button>

      <!-- Marca-texto -->
      <button
        @click="$emit('update:tool', 'highlighter')"
        class="p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer"
        :class="tool === 'highlighter' ? 'bg-primary text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurface'"
        title="Marca-texto"
      >
        <HighlighterIcon class="w-4 h-4" />
      </button>

      <!-- Borracha -->
      <button
        @click="$emit('update:tool', 'eraser')"
        class="p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer"
        :class="tool === 'eraser' ? 'bg-primary text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary hover:bg-bgSurface'"
        title="Borracha (ou segure o botão da S-Pen)"
      >
        <EraserIcon class="w-4 h-4" />
      </button>
    </div>

    <!-- Divisor -->
    <div class="h-6 w-px bg-divider/60 hidden sm:block"></div>

    <!-- Paleta de Cores Rápida -->
    <div class="flex items-center gap-1.5 px-1 py-1">
      <button
        v-for="c in paletteColors"
        :key="c"
        @click="$emit('update:color', c)"
        class="w-5 h-5 rounded-full border border-black/10 dark:border-white/10 transition-transform cursor-pointer"
        :class="color === c ? 'scale-125 ring-2 ring-primary ring-offset-2 ring-offset-bgPanel' : 'hover:scale-110'"
        :style="{ backgroundColor: c }"
        :title="`Cor: ${c}`"
      />
    </div>

    <!-- Divisor -->
    <div class="h-6 w-px bg-divider/60 hidden sm:block"></div>

    <!-- Slider de Espessura -->
    <div class="flex items-center gap-2 px-1">
      <div
        class="rounded-full bg-current transition-all"
        :style="{
          width: `${Math.max(size, 2)}px`,
          height: `${Math.max(size, 2)}px`,
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
        class="w-16 sm:w-20 accent-primary cursor-pointer"
        title="Espessura do traço"
      />
    </div>

    <!-- Divisor -->
    <div class="h-6 w-px bg-divider/60 hidden sm:block"></div>

    <!-- Rejeição de Palma & Modos -->
    <button
      @click="$emit('update:palmRejection', !palmRejection)"
      class="px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer"
      :class="
        palmRejection
          ? 'bg-primary/15 border-primary text-primary'
          : 'bg-bgElevated border-divider text-textSecondary hover:text-textPrimary'
      "
      :title="palmRejection ? 'Rejeição de Palma: Ativa (Toques acidentais bloqueados)' : 'Rejeição de Palma: Desativada'"
    >
      <HandIcon class="w-3.5 h-3.5" />
      <span class="hidden md:inline">Palma: {{ palmRejection ? 'ON' : 'OFF' }}</span>
    </button>

    <!-- Fundo da Folha -->
    <div class="relative">
      <button
        @click="showBgMenu = !showBgMenu"
        class="p-2 rounded-xl bg-bgElevated hover:bg-bgSurface text-textSecondary hover:text-textPrimary border border-divider transition-all flex items-center justify-center cursor-pointer"
        title="Estilo da Folha (Pautada, Grid, Lisa)"
      >
        <FileTextIcon class="w-4 h-4" />
      </button>

      <!-- Dropdown de Fundos -->
      <div
        v-if="showBgMenu"
        class="absolute bottom-full mb-2 right-0 sm:left-0 bg-bgPanel border border-divider rounded-xl shadow-xl p-1.5 min-w-[140px] flex flex-col gap-1 z-40"
      >
        <button
          @click="$emit('change-background', 'ruled'); showBgMenu = false"
          class="px-3 py-1.5 text-xs text-left rounded-lg hover:bg-bgElevated flex items-center gap-2 text-textPrimary"
        >
          <span>📄</span>
          <span>Pautada</span>
        </button>
        <button
          @click="$emit('change-background', 'grid'); showBgMenu = false"
          class="px-3 py-1.5 text-xs text-left rounded-lg hover:bg-bgElevated flex items-center gap-2 text-textPrimary"
        >
          <span>📐</span>
          <span>Quadriculada</span>
        </button>
        <button
          @click="$emit('change-background', 'dots'); showBgMenu = false"
          class="px-3 py-1.5 text-xs text-left rounded-lg hover:bg-bgElevated flex items-center gap-2 text-textPrimary"
        >
          <span>⠤</span>
          <span>Pontilhada</span>
        </button>
        <button
          @click="$emit('change-background', 'blank'); showBgMenu = false"
          class="px-3 py-1.5 text-xs text-left rounded-lg hover:bg-bgElevated flex items-center gap-2 text-textPrimary"
        >
          <span>⬜</span>
          <span>Em Branco</span>
        </button>
      </div>
    </div>

    <!-- Ações: Desfazer / Refazer -->
    <div class="flex items-center gap-1">
      <button
        :disabled="!canUndo"
        @click="$emit('undo')"
        class="p-2 rounded-xl bg-bgElevated text-textSecondary hover:text-textPrimary border border-divider transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        title="Desfazer (Ctrl+Z)"
      >
        <UndoIcon class="w-4 h-4" />
      </button>
      <button
        :disabled="!canRedo"
        @click="$emit('redo')"
        class="p-2 rounded-xl bg-bgElevated text-textSecondary hover:text-textPrimary border border-divider transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        title="Refazer (Ctrl+Y)"
      >
        <RedoIcon class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  PenTool as PenToolIcon,
  Feather as FeatherIcon,
  Pencil as PencilIcon,
  Highlighter as HighlighterIcon,
  Eraser as EraserIcon,
  Hand as HandIcon,
  FileText as FileTextIcon,
  Undo2 as UndoIcon,
  Redo2 as RedoIcon,
} from 'lucide-vue-next';
import type { PenToolType, PageBackgroundType } from '~/interfaces/drawing';

defineProps<{
  tool: PenToolType;
  color: string;
  size: number;
  palmRejection: boolean;
  canUndo: boolean;
  canRedo: boolean;
}>();

defineEmits<{
  (e: 'update:tool', tool: PenToolType): void;
  (e: 'update:color', color: string): void;
  (e: 'update:size', size: number): void;
  (e: 'update:palmRejection', enabled: boolean): void;
  (e: 'change-background', bg: PageBackgroundType): void;
  (e: 'undo'): void;
  (e: 'redo'): void;
}>();

const showBgMenu = ref(false);

const paletteColors = [
  '#18181B', // Preto / Grafite
  '#E57B55', // Laranja Aresta
  '#3B82F6', // Azul Royal
  '#10B981', // Verde Esmeralda
  '#EF4444', // Vermelho Coral
  '#F59E0B', // Âmbar
  '#FACC15', // Amarelo Marca-texto
];
</script>
