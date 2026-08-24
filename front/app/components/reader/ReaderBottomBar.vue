<template>
  <footer class="reader-bottom-bar bg-bgPanel/95 backdrop-blur-md border-t border-divider px-3 py-2 sm:px-6 sm:py-3 flex items-center justify-between z-20 shrink-0 text-textPrimary">
    <!-- Lado Esquerdo: Marcação de Página & Páginas Salvas -->
    <div class="flex items-center gap-1.5 sm:gap-2">
      <!-- Botão Marcar Página -->
      <button
        @click="store.toggleBookmark()"
        class="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border transition-all text-xs font-semibold"
        :class="store.isCurrentPageBookmarked
          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
          : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary hover:bg-white/10'"
        :title="store.isCurrentPageBookmarked ? 'Página marcada (clique para desmarcar)' : 'Marcar esta página'"
        aria-label="Marcar ou desmarcar página atual"
      >
        <BookmarkIcon
          class="w-4 h-4 transition-transform active:scale-125"
          :class="{ 'fill-current text-amber-300': store.isCurrentPageBookmarked }"
        />
        <span class="hidden sm:inline">
          {{ store.isCurrentPageBookmarked ? 'Marcada' : 'Marcar Página' }}
        </span>
      </button>

      <!-- Botão Ver Páginas Salvas -->
      <button
        @click="$emit('openSavedPages')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-white/5 border border-divider text-xs font-semibold text-textSecondary hover:text-textPrimary hover:bg-white/10 transition-all relative"
        title="Ver páginas salvas"
        aria-label="Abrir lista de páginas salvas"
      >
        <BookmarkCheckIcon class="w-4 h-4 text-accent" />
        <span class="hidden md:inline">Páginas Salvas</span>
        <span
          v-if="store.savedPages.length > 0"
          class="px-1.5 py-0.2 text-[10px] rounded-full bg-accent text-white font-bold font-technical"
        >
          {{ store.savedPages.length }}
        </span>
      </button>
    </div>

    <!-- Centro: Ação de Anotação & Seleção -->
    <div class="flex items-center gap-2">
      <button
        @click="$emit('openAnnotation')"
        class="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-all shadow-md active:scale-95"
        title="Criar anotação nesta página"
        aria-label="Criar anotação"
      >
        <HighlighterIcon class="w-4 h-4" />
        <span class="text-xs">Anotar</span>
      </button>
    </div>

    <!-- Lado Direito: Alternância do Grafo & Navegação -->
    <div class="flex items-center gap-1.5 sm:gap-2">
      <!-- Botão Grafo de Conhecimento -->
      <button
        @click="$emit('toggleGraph')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border transition-all text-xs font-semibold"
        :class="isGraphActive
          ? 'bg-accent/20 border-accent text-white shadow-sm'
          : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary hover:bg-white/10'"
        :title="isGraphActive ? 'Recolher Grafo de Conhecimento' : 'Abrir Grafo de Conhecimento'"
        aria-label="Abrir ou fechar Grafo de Conhecimento"
      >
        <NetworkIcon class="w-4 h-4 text-accent" />
        <span class="hidden sm:inline">Grafo</span>
      </button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import {
  BookmarkIcon,
  BookmarkCheckIcon,
  HighlighterIcon,
  NetworkIcon,
} from 'lucide-vue-next'
import { useReaderStore } from '~/stores/readerStore'

defineProps<{
  isGraphActive?: boolean
}>()

defineEmits<{
  (e: 'openSavedPages'): void
  (e: 'openAnnotation'): void
  (e: 'toggleGraph'): void
}>()

const store = useReaderStore()
</script>

<style scoped>
.reader-bottom-bar {
  min-height: 52px;
}
</style>
