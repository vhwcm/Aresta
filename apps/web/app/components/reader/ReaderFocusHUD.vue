<template>
  <transition name="fade">
    <aside
      v-if="store.isFocusMode"
      class="reader-focus-hud fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-xl border select-none transition-all duration-200"
      :class="{
        'bg-[#f5eedc]/95 border-[#dfd5c0] text-[#2a2521] shadow-amber-950/10': store.readerTheme === 'sepia',
        'bg-white/95 border-gray-200 text-gray-900 shadow-gray-950/10': store.readerTheme === 'white',
        'bg-[#18181b]/95 border-white/10 text-white shadow-black/50': store.readerTheme === 'black' || !store.readerTheme,
      }"
      role="toolbar"
      aria-label="Controles do Modo de Foco"
    >
      <!-- Indicador do Modo com Ícone -->
      <div class="flex items-center gap-1.5 pr-2 border-r" :class="borderColorClass">
        <FocusIcon class="w-4 h-4 text-accent animate-pulse" />
        <span class="text-xs font-semibold font-technical tracking-wide hidden xs:inline">Foco</span>
      </div>

      <!-- Ajuste da Quantidade de Linhas (X Linhas) -->
      <div class="flex items-center gap-1">
        <button
          @click="decrementLines"
          :disabled="store.focusLineCount <= 1"
          class="flex items-center justify-center w-7 h-7 rounded-lg border transition-all text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/10 active:scale-95"
          :class="buttonBorderClass"
          title="Diminuir quantidade de linhas"
          aria-label="Diminuir linhas no bloco"
        >
          <MinusIcon class="w-3 h-3" />
        </button>

        <span
          class="text-xs font-technical font-bold px-1.5 py-0.5 rounded-md min-w-[56px] text-center"
          :class="badgeBgClass"
          :title="`${store.focusLineCount} ${store.focusLineCount === 1 ? 'linha' : 'linhas'} por vez`"
        >
          {{ store.focusLineCount }} {{ store.focusLineCount === 1 ? 'lin' : 'lins' }}
        </span>

        <button
          @click="incrementLines"
          :disabled="store.focusLineCount >= 10"
          class="flex items-center justify-center w-7 h-7 rounded-lg border transition-all text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/10 active:scale-95"
          :class="buttonBorderClass"
          title="Aumentar quantidade de linhas"
          aria-label="Aumentar linhas no bloco"
        >
          <PlusIcon class="w-3 h-3" />
        </button>
      </div>

      <!-- Indicador de Linha Atual / Total -->
      <div
        v-if="progressLabel"
        class="hidden sm:flex items-center text-[11px] font-technical px-2 py-0.5 rounded-full border opacity-80"
        :class="buttonBorderClass"
      >
        {{ progressLabel }}
      </div>

      <!-- Botões de Navegação Bloco Anterior / Próximo -->
      <div class="flex items-center gap-1 pl-1 border-l" :class="borderColorClass">
        <button
          @click="$emit('prev')"
          class="flex items-center justify-center w-7 h-7 rounded-lg border transition-all hover:bg-black/5 dark:hover:bg-white/10 active:scale-95"
          :class="buttonBorderClass"
          title="Bloco anterior (Seta para cima ou K)"
          aria-label="Bloco anterior"
        >
          <ChevronUpIcon class="w-3.5 h-3.5" />
        </button>

        <button
          @click="$emit('next')"
          class="flex items-center justify-center w-7 h-7 rounded-lg bg-accent text-white transition-all hover:bg-accent/90 shadow-sm active:scale-95"
          title="Próximo bloco (Clique no livro, Espaço ou Seta para baixo)"
          aria-label="Próximo bloco"
        >
          <ChevronDownIcon class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Botão Sair do Modo de Foco -->
      <div class="pl-1 border-l" :class="borderColorClass">
        <button
          @click="store.setFocusMode(false)"
          class="flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 active:scale-95"
          :class="buttonBorderClass"
          title="Sair do Modo de Foco (Esc)"
          aria-label="Sair do Modo de Foco"
        >
          <XIcon class="w-3.5 h-3.5" />
          <span class="hidden xs:inline">Sair</span>
        </button>
      </div>
    </aside>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FocusIcon,
  MinusIcon,
  PlusIcon,
  XIcon,
} from 'lucide-vue-next'
import { useReaderStore } from '~/stores/readerStore'

const props = defineProps<{
  progressLabel?: string
}>()

defineEmits<{
  (_e: 'next'): void
  (_e: 'prev'): void
}>()

const store = useReaderStore()

function incrementLines() {
  store.setFocusLineCount(store.focusLineCount + 1)
}

function decrementLines() {
  store.setFocusLineCount(store.focusLineCount - 1)
}

const borderColorClass = computed(() => {
  if (store.readerTheme === 'sepia') return 'border-[#dfd5c0]'
  if (store.readerTheme === 'white') return 'border-gray-200'
  return 'border-white/10'
})

const buttonBorderClass = computed(() => {
  if (store.readerTheme === 'sepia') return 'border-[#dfd5c0] text-[#5c4d3c]'
  if (store.readerTheme === 'white') return 'border-gray-200 text-gray-700'
  return 'border-white/10 text-white/80'
})

const badgeBgClass = computed(() => {
  if (store.readerTheme === 'sepia') return 'bg-amber-500/15 text-amber-950 border border-amber-500/30'
  if (store.readerTheme === 'white') return 'bg-accent/15 text-accent border border-accent/30'
  return 'bg-white/10 text-accent border border-white/10'
})
</script>

<style scoped>
.reader-focus-hud {
  animation: hudSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes hudSlideUp {
  from {
    opacity: 0;
    transform: translate(-50%, 12px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
</style>
