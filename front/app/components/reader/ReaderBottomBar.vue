<template>
  <footer
    class="reader-bottom-bar bg-bgPanel/95 backdrop-blur-md border-t md:border-t-0 md:border-r border-divider px-3 py-2 sm:px-4 sm:py-2.5 md:px-2 md:py-3.5 flex flex-row md:flex-col items-center justify-between z-20 shrink-0 text-textPrimary gap-2 md:gap-3 order-last md:order-first w-full md:w-16 md:h-full select-none"
    role="toolbar"
    aria-label="Barra de ferramentas do leitor"
  >
    <!-- Grupo 1: Sair da Leitura & Progresso (Mobile: Esquerda | Tablet/Desktop: Topo) -->
    <div class="flex flex-row md:flex-col items-center gap-1.5 sm:gap-2 md:gap-2.5 shrink-0 md:w-full">
      <!-- Botão Sair -->
      <button
        @click="$emit('close')"
        class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 md:w-11 md:h-11 md:p-0 rounded-xl bg-white/5 border border-divider text-xs font-semibold text-textSecondary hover:text-textPrimary hover:bg-white/10 transition-all active:scale-95 group"
        aria-label="Sair da leitura"
        id="btn-close-book"
        title="Sair da leitura"
      >
        <ArrowLeftIcon class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span class="hidden xs:inline md:hidden">Sair</span>
      </button>

      <!-- Indicador de Progresso e Página -->
      <div
        class="flex flex-row md:flex-col items-center justify-center gap-1.5 md:gap-0.5 px-2.5 py-1.5 sm:px-3 sm:py-2 md:w-11 md:py-2 md:px-0.5 rounded-xl bg-white/5 border border-divider text-xs font-semibold text-textSecondary text-center"
        :title="`Progresso da leitura: ${store.progressPercentage}% (${pageDisplay})`"
        aria-label="Progresso da leitura"
      >
        <span class="text-accent font-bold font-technical text-xs md:text-[11px] leading-tight">
          {{ store.progressPercentage }}%
        </span>
        <span class="text-textSecondary/60 hidden sm:inline md:inline text-[11px] md:text-[9px] font-technical leading-tight">
          <span class="md:hidden">({{ pageDisplay }})</span>
          <span class="hidden md:inline font-mono">{{ pageDisplayShort }}</span>
        </span>
      </div>
    </div>

    <!-- Divisor sutil em telas tablet/desktop -->
    <div class="hidden md:block w-7 h-px bg-divider/60 shrink-0"></div>

    <!-- Grupo 2: Ação de Anotação, Tamanho de Fonte & Modo 1/2 Páginas (Mobile: Centro | Tablet/Desktop: Centro) -->
    <div class="flex flex-row md:flex-col items-center gap-1.5 sm:gap-2 md:gap-2.5">
      <!-- Botão Anotar -->
      <button
        @click="$emit('openAnnotation')"
        class="flex flex-row md:flex-col items-center justify-center gap-1.5 md:gap-0.5 px-3 py-1.5 sm:px-4 sm:py-2 md:w-11 md:h-11 md:p-0 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-all shadow-md active:scale-95 group"
        title="Criar anotação nesta página"
        aria-label="Criar anotação"
      >
        <HighlighterIcon class="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span class="text-xs md:hidden">Anotar</span>
      </button>

      <!-- Botão Aparência / Tema de Leitura & Tipografia (PDF e EPUB) -->
      <div class="relative" ref="appearanceWrapperRef">
        <button
          @click="isAppearancePopoverOpen = !isAppearancePopoverOpen"
          class="flex flex-row md:flex-col items-center justify-center gap-1.5 md:gap-0.5 px-2.5 py-1.5 sm:px-3 sm:py-2 md:w-11 md:h-11 md:p-0 rounded-xl border transition-all text-xs font-semibold active:scale-95 group relative"
          :class="isAppearancePopoverOpen
            ? 'bg-accent/20 border-accent text-accent shadow-sm'
            : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary hover:bg-white/10'"
          title="Aparência de leitura (Cor de fundo, tema e tipografia)"
          aria-label="Aparência de leitura"
          id="btn-appearance-toggle"
        >
          <!-- Ícone com indicador de cor do tema -->
          <div class="relative">
            <PaletteIcon class="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span
              class="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black/40 shadow-xs"
              :class="{
                'bg-[#f5eedc]': store.readerTheme === 'sepia',
                'bg-[#ffffff]': store.readerTheme === 'white',
                'bg-[#121214]': store.readerTheme === 'black'
              }"
            />
          </div>
          <span class="text-xs md:text-[9px] font-technical font-medium leading-tight">
            {{ store.readerTheme === 'sepia' ? 'Livro' : (store.readerTheme === 'white' ? 'Branco' : 'Preto') }}
          </span>
        </button>

        <!-- Popover Flutuante de Aparência & Fundo de Leitura (Mobile: Abre para cima | Tablet/Desktop: Abre para a direita) -->
        <div
          v-if="isAppearancePopoverOpen"
          class="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-full md:ml-3 md:translate-x-0 bg-bgPanel/95 backdrop-blur-xl border border-divider rounded-2xl p-4 shadow-2xl z-50 flex flex-col gap-3.5 min-w-[240px] sm:min-w-[280px] animate-fadeIn text-textPrimary"
          role="dialog"
          aria-label="Controle de aparência e fundo de leitura"
        >
          <!-- Seção de Fundo / Tema de Leitura -->
          <div class="flex flex-col gap-2">
            <span class="text-[11px] font-technical uppercase tracking-wider text-textSecondary font-semibold">
              Fundo da Leitura
            </span>
            <div class="grid grid-cols-3 gap-1.5">
              <!-- Amarelado (Livro) -->
              <button
                @click="store.setReaderTheme('sepia')"
                class="flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center group"
                :class="store.readerTheme === 'sepia'
                  ? 'bg-amber-400/15 border-amber-500/80 text-textPrimary shadow-sm'
                  : 'bg-white/5 border-divider hover:bg-white/10 text-textSecondary hover:text-textPrimary'"
                title="Fundo amarelado suave estilo livro físico"
              >
                <div class="w-5 h-5 rounded-full border border-amber-600/30 bg-[#f5eedc] shadow-inner mb-1 flex items-center justify-center">
                  <CheckIcon v-if="store.readerTheme === 'sepia'" class="w-3 h-3 text-amber-950 stroke-[3]" />
                </div>
                <span class="text-[11px] font-semibold">Amarelado</span>
                <span class="text-[9px] opacity-70">Livro</span>
              </button>

              <!-- Branco -->
              <button
                @click="store.setReaderTheme('white')"
                class="flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center group"
                :class="store.readerTheme === 'white'
                  ? 'bg-white/20 border-white/80 text-textPrimary shadow-sm'
                  : 'bg-white/5 border-divider hover:bg-white/10 text-textSecondary hover:text-textPrimary'"
                title="Fundo branco claro"
              >
                <div class="w-5 h-5 rounded-full border border-slate-300 bg-[#ffffff] shadow-inner mb-1 flex items-center justify-center">
                  <CheckIcon v-if="store.readerTheme === 'white'" class="w-3 h-3 text-slate-800 stroke-[3]" />
                </div>
                <span class="text-[11px] font-semibold">Branco</span>
                <span class="text-[9px] opacity-70">Clássico</span>
              </button>

              <!-- Preto -->
              <button
                @click="store.setReaderTheme('black')"
                class="flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center group"
                :class="store.readerTheme === 'black'
                  ? 'bg-white/15 border-accent/80 text-textPrimary shadow-sm'
                  : 'bg-white/5 border-divider hover:bg-white/10 text-textSecondary hover:text-textPrimary'"
                title="Fundo preto noturno"
              >
                <div class="w-5 h-5 rounded-full border border-white/30 bg-[#121214] shadow-inner mb-1 flex items-center justify-center">
                  <CheckIcon v-if="store.readerTheme === 'black'" class="w-3 h-3 text-white stroke-[3]" />
                </div>
                <span class="text-[11px] font-semibold">Preto</span>
                <span class="text-[9px] opacity-70">Noturno</span>
              </button>
            </div>
          </div>

          <!-- Seção de Tamanho de Texto e Fonte (Apenas EPUB) -->
          <div v-if="store.documentType === 'epub'" class="flex flex-col gap-2 pt-2 border-t border-divider">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-technical uppercase tracking-wider text-textSecondary font-semibold">
                Tamanho da Fonte
              </span>
              <button
                @click="store.resetFontSize()"
                class="text-[10px] text-accent hover:underline font-technical"
                title="Redefinir para 18px"
              >
                Padrão
              </button>
            </div>

            <!-- Controles A- e A+ -->
            <div class="flex items-center justify-between gap-2 bg-white/5 rounded-xl p-1.5 border border-divider">
              <button
                @click="store.decreaseFontSize(2)"
                :disabled="store.fontSize <= 12"
                class="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent text-sm font-semibold transition-all active:scale-95 text-textPrimary"
                title="Diminuir tamanho da fonte"
                aria-label="Diminuir tamanho da fonte"
              >
                A-
              </button>
              <span class="font-technical font-bold text-sm text-textPrimary px-2">
                {{ store.fontSize }} px
              </span>
              <button
                @click="store.increaseFontSize(2)"
                :disabled="store.fontSize >= 36"
                class="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent text-base font-semibold transition-all active:scale-95 text-textPrimary"
                title="Aumentar tamanho da fonte"
                aria-label="Aumentar tamanho da fonte"
              >
                A+
              </button>
            </div>

            <!-- Botão Mais Tipografia -->
            <button
              @click="$emit('openTypography'); isAppearancePopoverOpen = false"
              class="w-full py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-divider text-xs text-textSecondary hover:text-textPrimary flex items-center justify-center gap-1.5 transition-all mt-1"
            >
              <TypeIcon class="w-3.5 h-3.5 text-accent" />
              <span>Mais Fontes & Tipografia</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Botão Alternar 1 Página / 2 Páginas (Desktop/Tablet quando Grafo Fechado) -->
      <button
        v-if="!isGraphActive && store.totalPages > 1"
        @click="store.setTwoPageMode(!store.isTwoPageMode)"
        class="hidden md:flex items-center justify-center md:w-11 md:h-11 rounded-xl bg-white/5 border border-divider text-xs font-semibold text-textSecondary hover:text-textPrimary hover:bg-white/10 transition-all active:scale-95"
        :title="store.isTwoPageMode ? 'Alternar para 1 página' : 'Alternar para 2 páginas lado a lado'"
        aria-label="Alternar modo de páginas"
      >
        <BookOpenIcon v-if="store.isTwoPageMode" class="w-4 h-4 text-accent" />
        <FileTextIcon v-else class="w-4 h-4 text-textSecondary" />
      </button>
    </div>

    <!-- Divisor sutil em telas tablet/desktop -->
    <div class="hidden md:block w-7 h-px bg-divider/60 shrink-0"></div>

    <!-- Grupo 3: Marcação de Página, Páginas Salvas, Grafo & Zen (Mobile: Direita | Tablet/Desktop: Base) -->
    <div class="flex flex-row md:flex-col items-center gap-1.5 sm:gap-2 md:gap-2.5 shrink-0">
      <!-- Botão Marcar Página -->
      <button
        @click="store.toggleBookmark()"
        class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 md:w-11 md:h-11 md:p-0 rounded-xl border transition-all text-xs font-semibold active:scale-95"
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
        <span class="hidden md:hidden">
          {{ store.isCurrentPageBookmarked ? 'Marcada' : 'Marcar' }}
        </span>
      </button>

      <!-- Botão Ver Páginas Salvas -->
      <button
        @click="$emit('openSavedPages')"
        class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 md:w-11 md:h-11 md:p-0 rounded-xl bg-white/5 border border-divider text-xs font-semibold text-textSecondary hover:text-textPrimary hover:bg-white/10 transition-all relative active:scale-95"
        title="Ver páginas salvas"
        aria-label="Abrir lista de páginas salvas"
      >
        <BookmarkCheckIcon class="w-4 h-4 text-accent" />
        <span class="hidden lg:hidden">Salvas</span>
        <span
          v-if="store.savedPages.length > 0"
          class="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[16px] text-center text-[9px] rounded-full bg-accent text-white font-bold font-technical shadow-sm"
        >
          {{ store.savedPages.length }}
        </span>
      </button>

      <!-- Botão Grafo de Conhecimento -->
      <button
        @click="$emit('toggleGraph')"
        class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 md:w-11 md:h-11 md:p-0 rounded-xl border transition-all text-xs font-semibold active:scale-95"
        :class="isGraphActive
          ? 'bg-accent/20 border-accent text-white shadow-sm'
          : 'bg-white/5 border-divider text-textSecondary hover:text-textPrimary hover:bg-white/10'"
        :title="isGraphActive ? 'Recolher Grafo de Conhecimento' : 'Abrir Grafo de Conhecimento'"
        aria-label="Abrir ou fechar Grafo de Conhecimento"
      >
        <NetworkIcon class="w-4 h-4 text-accent" />
        <span class="hidden sm:inline md:hidden">Grafo</span>
      </button>

      <!-- Botão Modo Zen (Foco) -->
      <button
        @click="store.toggleZenMode()"
        class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 md:w-11 md:h-11 md:p-0 rounded-xl bg-white/5 border border-divider text-xs font-semibold text-textSecondary hover:text-textPrimary hover:bg-white/10 transition-all active:scale-95 group"
        title="Entrar no Modo Zen / Foco (Pressione Esc, Z ou Voltar para sair)"
        aria-label="Entrar no Modo Zen"
        id="btn-zen-mode"
      >
        <Maximize2Icon class="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
        <span class="hidden sm:inline md:hidden">Zen</span>
      </button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import {
  ArrowLeftIcon,
  BookmarkIcon,
  BookmarkCheckIcon,
  BookOpenIcon,
  CheckIcon,
  FileTextIcon,
  HighlighterIcon,
  Maximize2Icon,
  NetworkIcon,
  PaletteIcon,
  TypeIcon,
} from 'lucide-vue-next'
import { useReaderStore } from '~/stores/readerStore'

defineProps<{
  isGraphActive?: boolean
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'openSavedPages'): void
  (e: 'openAnnotation'): void
  (e: 'toggleGraph'): void
  (e: 'openTypography'): void
}>()

const store = useReaderStore()
const isAppearancePopoverOpen = ref(false)
const appearanceWrapperRef = ref<HTMLElement | null>(null)

const pageDisplay = computed(() => {
  if (store.isTwoPageMode && store.totalPages > 1) {
    const second = Math.min(store.currentPage + 1, store.totalPages)
    return `${store.currentPage}-${second}/${store.totalPages}`
  }
  return `${store.currentPage}/${store.totalPages}`
})

const pageDisplayShort = computed(() => {
  if (store.isTwoPageMode && store.totalPages > 1) {
    const second = Math.min(store.currentPage + 1, store.totalPages)
    return `${store.currentPage}-${second}`
  }
  return `${store.currentPage}/${store.totalPages}`
})

function handleClickOutside(event: MouseEvent) {
  if (
    isAppearancePopoverOpen.value &&
    appearanceWrapperRef.value &&
    !appearanceWrapperRef.value.contains(event.target as Node)
  ) {
    isAppearancePopoverOpen.value = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isAppearancePopoverOpen.value) {
    isAppearancePopoverOpen.value = false
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    document.addEventListener('click', handleClickOutside)
    window.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    document.removeEventListener('click', handleClickOutside)
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<style scoped>
.reader-bottom-bar {
  min-height: 52px;
}

@media (min-width: 768px) {
  .reader-bottom-bar {
    min-height: 100%;
  }
}
</style>
