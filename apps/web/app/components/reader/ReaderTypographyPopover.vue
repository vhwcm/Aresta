<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity animate-fadeIn"
      @click.self="$emit('close')"
      role="dialog"
      aria-modal="true"
      aria-labelledby="typography-modal-title"
    >
      <div
        class="bg-bgPanel border border-divider rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-5 text-textPrimary animate-scaleIn max-h-[90vh] overflow-y-auto"
      >
        <!-- Cabeçalho -->
        <div class="flex items-center justify-between border-b border-divider pb-3">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-accent/10 text-accent">
              <TypeIcon class="w-5 h-5" />
            </div>
            <div>
              <h3 id="typography-modal-title" class="text-sm font-bold uppercase tracking-wider text-textPrimary">
                Tipografia do Livro
              </h3>
              <p class="text-[11px] text-textSecondary">
                Personalize a fonte e o tamanho do texto para leitura confortável
              </p>
            </div>
          </div>
          <button
            @click="$emit('close')"
            class="p-1.5 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-white/5 transition-all active:scale-95"
            aria-label="Fechar configurações de tipografia"
          >
            <XIcon class="w-4 h-4" />
          </button>
        </div>

        <!-- Seletor de Tema / Fundo da Leitura & App -->
        <div class="space-y-2">
          <label class="text-[11px] font-semibold text-textSecondary uppercase tracking-wider block">
            Fundo da Leitura & Tema
          </label>
          <div class="grid grid-cols-3 gap-2">
            <!-- Amarelado / Sépia (Estilo Livro) -->
            <button
              @click="handleThemeSelect('sepia')"
              class="flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center group relative"
              :class="store.readerTheme === 'sepia'
                ? 'bg-[#f5eedc]/15 border-amber-400/60 shadow-sm text-white'
                : 'bg-white/[0.03] border-divider hover:bg-white/[0.07] text-textSecondary hover:text-textPrimary'"
              title="Fundo amarelado suave estilo livro físico"
            >
              <div class="w-6 h-6 rounded-full border border-amber-600/30 bg-[#f5eedc] shadow-inner mb-1.5 flex items-center justify-center">
                <CheckIcon v-if="store.readerTheme === 'sepia'" class="w-3.5 h-3.5 text-amber-900 stroke-[3]" />
              </div>
              <span class="text-xs font-semibold">Amarelado</span>
              <span class="text-[10px] opacity-75">Estilo Livro</span>
            </button>

            <!-- Branco -->
            <button
              @click="handleThemeSelect('white')"
              class="flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center group relative"
              :class="store.readerTheme === 'white'
                ? 'bg-white/15 border-white/60 shadow-sm text-white'
                : 'bg-white/[0.03] border-divider hover:bg-white/[0.07] text-textSecondary hover:text-textPrimary'"
              title="Fundo branco claro"
            >
              <div class="w-6 h-6 rounded-full border border-slate-300 bg-[#ffffff] shadow-inner mb-1.5 flex items-center justify-center">
                <CheckIcon v-if="store.readerTheme === 'white'" class="w-3.5 h-3.5 text-slate-800 stroke-[3]" />
              </div>
              <span class="text-xs font-semibold">Branco</span>
              <span class="text-[10px] opacity-75">Clássico</span>
            </button>

            <!-- Preto -->
            <button
              @click="handleThemeSelect('black')"
              class="flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center group relative"
              :class="store.readerTheme === 'black'
                ? 'bg-white/10 border-accent/80 shadow-sm text-white'
                : 'bg-white/[0.03] border-divider hover:bg-white/[0.07] text-textSecondary hover:text-textPrimary'"
              title="Fundo preto para leitura noturna"
            >
              <div class="w-6 h-6 rounded-full border border-white/20 bg-[#121214] shadow-inner mb-1.5 flex items-center justify-center">
                <CheckIcon v-if="store.readerTheme === 'black'" class="w-3.5 h-3.5 text-white stroke-[3]" />
              </div>
              <span class="text-xs font-semibold">Preto</span>
              <span class="text-[10px] opacity-75">Noturno</span>
            </button>
          </div>
        </div>

        <!-- Seletor de Família de Fontes -->
        <div class="space-y-2 border-t border-divider pt-4">
          <label class="text-[11px] font-semibold text-textSecondary uppercase tracking-wider block">
            Família Tipográfica (EPUB)
          </label>
          <div class="grid grid-cols-1 gap-2">
            <button
              v-for="font in fonts"
              :key="font.id"
              @click="handleSelectFont(font)"
              class="flex items-center justify-between p-3 rounded-xl border transition-all text-left group"
              :class="activeFontId === font.id
                ? 'bg-accent/15 border-accent text-white shadow-sm'
                : 'bg-white/[0.03] border-divider hover:bg-white/[0.07] text-textSecondary hover:text-textPrimary'"
            >
              <div class="flex flex-col gap-0.5">
                <div class="flex items-center gap-2">
                  <span
                    class="text-base font-medium transition-colors"
                    :style="{ fontFamily: font.fontFamily }"
                    :class="activeFontId === font.id ? 'text-white' : 'text-textPrimary'"
                  >
                    {{ font.name }}
                  </span>
                  <span
                    class="text-[10px] px-1.5 py-0.5 rounded border border-divider text-textSecondary font-technical"
                  >
                    {{ font.category }}
                  </span>
                </div>
                <span class="text-[11px] text-textSecondary/80 line-clamp-1">
                  {{ font.description }}
                </span>
              </div>

              <div
                v-if="activeFontId === font.id"
                class="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center shrink-0 ml-2"
              >
                <CheckIcon class="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </button>
          </div>
        </div>

        <!-- Controle de Tamanho de Fonte (Apenas EPUB) -->
        <div class="space-y-2 border-t border-divider pt-4">
          <div class="flex items-center justify-between">
            <label class="text-[11px] font-semibold text-textSecondary uppercase tracking-wider">
              Tamanho do Texto
            </label>
            <span class="text-xs font-technical text-accent font-bold">
              {{ store.fontSize }}px
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="store.decreaseFontSize(2)"
              :disabled="store.fontSize <= 12"
              class="flex-1 py-2 px-3 rounded-xl bg-white/5 border border-divider hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-textPrimary flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <span class="text-sm font-serif">A-</span>
              <span>Menor</span>
            </button>

            <button
              @click="store.resetFontSize()"
              class="py-2 px-3 rounded-xl bg-white/5 border border-divider hover:bg-white/10 text-xs font-semibold text-textSecondary hover:text-textPrimary transition-all active:scale-95"
              title="Redefinir tamanho para 18px"
            >
              Padrão
            </button>

            <button
              @click="store.increaseFontSize(2)"
              :disabled="store.fontSize >= 36"
              class="flex-1 py-2 px-3 rounded-xl bg-white/5 border border-divider hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-textPrimary flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <span class="text-base font-serif font-bold">A+</span>
              <span>Maior</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { CheckIcon, TypeIcon, XIcon } from 'lucide-vue-next'
import { useReaderTypography, type TypographyFont } from '~/composables/useReaderTypography'
import { useSettings } from '~/composables/useSettings'
import { useReaderStore, type ReaderColorTheme } from '~/stores/readerStore'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useReaderStore()
const { setReaderTheme } = useSettings()
const { fonts, activeFontId, setFont } = useReaderTypography()

function handleThemeSelect(theme: ReaderColorTheme) {
  setReaderTheme(theme)
  store.setReaderTheme(theme)
}

function handleSelectFont(font: TypographyFont) {
  setFont(font.id)
  store.setFontFamily(font.fontFamily)
}
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.15s ease-out forwards;
}

.animate-scaleIn {
  animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
