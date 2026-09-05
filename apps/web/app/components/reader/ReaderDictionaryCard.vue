<template>
  <Transition name="dictionary-fade">
    <div
      v-if="visible"
      ref="cardRef"
      class="reader-dictionary-card"
      :class="isAbove ? 'reader-dictionary-card--above' : 'reader-dictionary-card--below'"
      :style="{ left: `${Math.round(x)}px`, top: `${Math.round(y)}px` }"
      @mousedown.stop
      @touchstart.stop
      role="dialog"
      aria-label="Definição do Dicionário Offline"
    >
      <div class="reader-dictionary-card__container">
        <!-- Cabeçalho Editorial -->
        <header class="reader-dictionary-card__header">
          <div class="flex items-center gap-2 min-w-0">
            <div class="p-1.5 rounded-lg bg-accent/15 text-accent shrink-0">
              <BookOpenIcon class="w-4 h-4" />
            </div>
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="font-editorial text-lg font-medium text-textPrimary truncate">
                  {{ displayWord }}
                </h3>
                <span v-if="entry?.phonetic" class="font-technical text-xs text-textSecondary shrink-0">
                  {{ entry.phonetic }}
                </span>
              </div>
              <span v-if="entry?.matchedLemma" class="font-interface text-[11px] text-accent">
                Forma canônica: {{ entry.matchedLemma }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <!-- Seletor Rápido de Par de Idiomas -->
            <div class="relative">
              <button
                type="button"
                @click="isPairSelectorOpen = !isPairSelectorOpen"
                class="reader-dictionary-card__lang-btn"
                title="Trocar idioma do dicionário"
                aria-label="Trocar idioma"
              >
                <span class="font-technical text-[11px] font-semibold uppercase">{{ currentSourceLang }} → {{ currentTargetLang }}</span>
                <ChevronDownIcon class="w-3 h-3 text-textSecondary" />
              </button>

              <!-- Dropdown de Pares de Idiomas -->
              <div
                v-if="isPairSelectorOpen"
                class="reader-dictionary-card__lang-menu animate-in fade-in zoom-in-95 duration-150"
              >
                <button
                  v-for="pair in availablePairs"
                  :key="`${pair.source}-${pair.target}`"
                  type="button"
                  @click="selectPair(pair.source, pair.target)"
                  class="reader-dictionary-card__lang-option"
                  :class="{ 'reader-dictionary-card__lang-option--active': currentSourceLang === pair.source && currentTargetLang === pair.target }"
                >
                  <span>{{ pair.label }}</span>
                  <CheckIcon v-if="currentSourceLang === pair.source && currentTargetLang === pair.target" class="w-3.5 h-3.5 text-accent" />
                </button>
              </div>
            </div>

            <!-- Botão Fechar -->
            <button
              type="button"
              @click="$emit('close')"
              class="p-1 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Fechar dicionário"
              aria-label="Fechar"
            >
              <XIcon class="w-4 h-4" />
            </button>
          </div>
        </header>

        <!-- Corpo do Dicionário -->
        <main class="reader-dictionary-card__body custom-scrollbar">
          <!-- Carregando / Buscando -->
          <div v-if="isLoading" class="flex flex-col items-center justify-center py-8 gap-2.5 text-textSecondary">
            <span class="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></span>
            <span class="font-interface text-xs">Consultando dicionário offline...</span>
          </div>

          <!-- Resultado Encontrado -->
          <div v-else-if="entry" class="flex flex-col gap-3.5">
            <!-- Classes Gramaticais (Tags) -->
            <div v-if="entry.pos && entry.pos.length > 0" class="flex flex-wrap items-center gap-1.5">
              <span
                v-for="pos in entry.pos"
                :key="pos"
                class="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 font-technical text-[10px] text-accent uppercase font-semibold tracking-wider"
              >
                {{ pos }}
              </span>
            </div>

            <!-- Destaque de Tradução (quando houver) -->
            <div
              v-if="entry.translations && entry.translations.length > 0"
              class="p-3 rounded-xl bg-accent/10 border border-accent/20 flex flex-col gap-1"
            >
              <span class="font-technical text-[10px] uppercase font-semibold tracking-wider text-accent">
                Tradução para {{ languageLabel(currentTargetLang) }}
              </span>
              <p class="font-interface text-sm font-medium text-textPrimary leading-snug">
                {{ entry.translations.join(', ') }}
              </p>
            </div>

            <!-- Lista de Definições e Significados -->
            <div class="flex flex-col gap-3">
              <div
                v-for="(def, idx) in entry.definitions"
                :key="idx"
                class="flex items-start gap-2.5 text-xs text-textPrimary leading-relaxed"
              >
                <span class="font-technical text-[11px] font-bold text-accent shrink-0 pt-0.5">
                  {{ idx + 1 }}.
                </span>
                <div class="flex flex-col gap-1">
                  <p class="font-interface text-xs text-textPrimary">
                    {{ def.meaning }}
                  </p>
                  <p v-if="def.example" class="font-editorial italic text-textSecondary text-[11px]">
                    "{{ def.example }}"
                  </p>
                  <div v-if="def.synonyms && def.synonyms.length > 0" class="flex items-center gap-1 text-[10px] text-textSecondary pt-0.5">
                    <span class="font-semibold">Sinônimos:</span>
                    <span>{{ def.synonyms.join(', ') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Verbete não encontrado -->
          <div v-else class="flex flex-col items-center justify-center py-6 gap-2 text-center">
            <p class="font-interface text-xs text-textSecondary">
              Nenhuma definição offline encontrada para <strong class="text-textPrimary">"{{ displayWord }}"</strong> no par {{ currentSourceLang.toUpperCase() }} → {{ currentTargetLang.toUpperCase() }}.
            </p>
            <p class="font-interface text-[11px] text-textSecondary/70">
              Tente alternar o idioma de consulta no seletor acima.
            </p>
          </div>
        </main>

        <!-- Rodapé com Ações -->
        <footer class="reader-dictionary-card__footer">
          <button
            v-if="entry"
            type="button"
            @click="handleCopyDefinition"
            class="reader-dictionary-card__action-btn"
            :title="copied ? 'Copiado!' : 'Copiar texto da definição'"
          >
            <CheckIcon v-if="copied" class="w-3.5 h-3.5 text-emerald-400" />
            <CopyIcon v-else class="w-3.5 h-3.5 text-textSecondary" />
            <span :class="{ 'text-emerald-400': copied }">
              {{ copied ? 'Copiado!' : 'Copiar Definição' }}
            </span>
          </button>
          <div v-else></div>

          <button
            type="button"
            @click="$emit('close')"
            class="px-3 py-1.5 rounded-lg text-xs text-textSecondary hover:text-textPrimary transition-colors"
          >
            Fechar
          </button>
        </footer>
      </div>

      <!-- Seta indicadora (Arrow) -->
      <div
        class="reader-dictionary-card__arrow"
        :class="isAbove ? 'reader-dictionary-card__arrow--bottom' : 'reader-dictionary-card__arrow--top'"
      />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  BookOpenIcon,
  XIcon,
  CopyIcon,
  CheckIcon,
  ChevronDownIcon
} from 'lucide-vue-next'
import { useSettings } from '~/composables/useSettings'
import { useOfflineDictionary, type DictionaryEntry } from '~/composables/reader/useOfflineDictionary'

const props = withDefaults(
  defineProps<{
    visible: boolean
    x: number
    y: number
    word: string
    bookLanguage?: string
    pageNumber?: number
    isAbove?: boolean
  }>(),
  {
    visible: false,
    x: 0,
    y: 0,
    word: '',
    bookLanguage: 'en',
    pageNumber: 1,
    isAbove: true,
  },
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

const settings = useSettings()
const dictionary = useOfflineDictionary()
const { availablePairs } = dictionary

const cardRef = ref<HTMLElement | null>(null)
const isLoading = ref(false)
const entry = ref<DictionaryEntry | null>(null)
const isPairSelectorOpen = ref(false)
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

// Idiomas ativos para a consulta
const currentSourceLang = ref('en')
const currentTargetLang = ref('pt')

const displayWord = computed(() => props.word.trim())

function normalizeLang(langCode?: string): string {
  if (!langCode) return 'pt'
  const clean = (langCode.split('-')[0] ?? '').toLowerCase()
  if (clean === 'pt' || clean === 'en' || clean === 'es') return clean
  return 'pt'
}

function languageLabel(code: string): string {
  switch (code) {
    case 'pt':
      return 'Português'
    case 'en':
      return 'Inglês'
    case 'es':
      return 'Espanhol'
    default:
      return code.toUpperCase()
  }
}

function initLanguages() {
  const native = normalizeLang(settings.nativeLanguage.value)
  const targetTrans = normalizeLang(settings.targetTranslationLanguage.value)
  const bookLang = normalizeLang(props.bookLanguage)

  // Se o livro possui idioma detectado, usa o idioma do livro como fonte
  currentSourceLang.value = bookLang || targetTrans || 'en'
  // A língua de destino padrão é a língua nativa do usuário
  currentTargetLang.value = native || 'pt'
}

async function performLookup() {
  if (!props.word || !props.visible) return

  isLoading.value = true
  entry.value = null

  try {
    const result = await dictionary.lookup(
      props.word,
      currentSourceLang.value,
      currentTargetLang.value,
    )
    entry.value = result
  } catch (err) {
    console.error('[Dictionary] Erro na consulta:', err)
    entry.value = null
  } finally {
    isLoading.value = false
  }
}

function selectPair(source: string, target: string) {
  currentSourceLang.value = source
  currentTargetLang.value = target
  isPairSelectorOpen.value = false
  void performLookup()
}

async function handleCopyDefinition() {
  if (!entry.value) return
  const meaningList = entry.value.definitions.map((d, i) => `${i + 1}. ${d.meaning}`).join('\n')
  const trans = entry.value.translations?.length ? `Tradução: ${entry.value.translations.join(', ')}\n` : ''
  const fullText = `${entry.value.word} (${entry.value.pos.join(', ')})\n${trans}${meaningList}`

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(fullText)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = fullText
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Falha ao copiar:', err)
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      initLanguages()
      void performLookup()
    } else {
      isPairSelectorOpen.value = false
    }
  },
)

watch(
  () => props.word,
  () => {
    if (props.visible) {
      void performLookup()
    }
  },
)

onUnmounted(() => {
  if (copyTimer) clearTimeout(copyTimer)
})
</script>

<style scoped>
.reader-dictionary-card {
  position: fixed;
  z-index: 70;
  pointer-events: auto;
  user-select: text;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  backface-visibility: hidden;
  transform: translate3d(-50%, 0, 0);
  width: 90vw;
  max-width: 380px;
}

.reader-dictionary-card--above {
  transform: translate3d(-50%, -100%, 0);
}

.reader-dictionary-card--below {
  transform: translate3d(-50%, 0, 0);
}

.reader-dictionary-card__container {
  display: flex;
  flex-direction: column;
  background: rgba(22, 23, 26, 0.97);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 1.25rem;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(229, 123, 85, 0.2);
  overflow: hidden;
}

.reader-dictionary-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.reader-dictionary-card__lang-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-text-primary, #f2f2f2);
  cursor: pointer;
  transition: all 0.15s ease;
}

.reader-dictionary-card__lang-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.reader-dictionary-card__lang-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 20;
  width: 180px;
  padding: 4px;
  background: rgba(26, 27, 30, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reader-dictionary-card__lang-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-family: inherit;
  color: var(--color-text-secondary, #a1a1aa);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.reader-dictionary-card__lang-option:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.reader-dictionary-card__lang-option--active {
  background: rgba(229, 123, 85, 0.15);
  color: #ffffff;
  font-weight: 600;
}

.reader-dictionary-card__body {
  max-height: 260px;
  overflow-y: auto;
  padding: 14px;
}

.reader-dictionary-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.15);
}

.reader-dictionary-card__action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.75rem;
  color: var(--color-text-secondary, #a1a1aa);
  cursor: pointer;
  transition: all 0.15s ease;
}

.reader-dictionary-card__action-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
}

.reader-dictionary-card__arrow {
  position: absolute;
  left: 50%;
  width: 12px;
  height: 12px;
  background: rgba(22, 23, 26, 0.97);
  border-left: 1px solid rgba(255, 255, 255, 0.16);
  border-top: 1px solid rgba(255, 255, 255, 0.16);
  transform: translate3d(-50%, 0, 0) rotate(45deg);
  pointer-events: none;
}

.reader-dictionary-card__arrow--bottom {
  bottom: -6px;
  border-left: none;
  border-top: none;
  border-right: 1px solid rgba(255, 255, 255, 0.16);
  border-bottom: 1px solid rgba(255, 255, 255, 0.16);
}

.reader-dictionary-card__arrow--top {
  top: -6px;
}

/* Transições */
.dictionary-fade-enter-active,
.dictionary-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dictionary-fade-enter-from.reader-dictionary-card--above,
.dictionary-fade-leave-to.reader-dictionary-card--above {
  opacity: 0;
  transform: translate3d(-50%, calc(-100% + 8px), 0) scale(0.95);
}

.dictionary-fade-enter-from.reader-dictionary-card--below,
.dictionary-fade-leave-to.reader-dictionary-card--below {
  opacity: 0;
  transform: translate3d(-50%, -8px, 0) scale(0.95);
}
</style>

