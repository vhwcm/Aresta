<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden flex justify-end">
    <!-- Backdrop suave -->
    <div
      class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fadeIn"
      @click="handleClose"
      aria-hidden="true"
    ></div>

    <!-- Drawer Lateral (50% Desktop/Tablet, 100% Mobile) -->
    <aside
      class="relative w-full md:w-1/2 lg:w-1/2 h-full bg-bgPanel border-l border-divider shadow-2xl flex flex-col z-10 text-textPrimary animate-slideLeft transition-all overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-annotation-title"
    >
      <!-- Header do Drawer -->
      <div class="flex items-center justify-between p-4 sm:p-5 border-b border-divider bg-bgApp/40">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-accent/15 border border-accent/25 text-accent shadow-sm">
            <Edit3Icon class="w-5 h-5" />
          </div>
          <div>
            <h2 id="drawer-annotation-title" class="font-bold text-base sm:text-lg">
              Painel de Escrita & Anotação
            </h2>
            <p class="text-xs text-textSecondary flex items-center gap-1.5 mt-0.5">
              <span>{{ chapterTitle || `Página ${currentPage}` }}</span>
              <span class="inline-block w-1 h-1 rounded-full bg-textSecondary/50"></span>
              <span class="text-accent font-medium">{{ inputMode === 'handwriting' ? 'Modo Desenho (OCR)' : 'Modo Digitação' }}</span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="handleClose"
            class="p-2 text-textSecondary hover:text-textPrimary hover:bg-white/5 rounded-xl transition-colors"
            aria-label="Fechar painel"
          >
            <XIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Seletor de Modo: Digitação vs Escrita Manual -->
      <div class="px-4 sm:px-6 pt-4 pb-2">
        <div class="grid grid-cols-2 gap-1 p-1 bg-bgApp rounded-xl border border-divider">
          <button
            type="button"
            @click="inputMode = 'type'"
            :class="inputMode === 'type' ? 'bg-bgPanel text-textPrimary shadow-sm font-semibold' : 'text-textSecondary hover:text-textPrimary'"
            class="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs transition-all"
          >
            <KeyboardIcon class="w-4 h-4" />
            <span>Digitação</span>
          </button>
          <button
            type="button"
            @click="inputMode = 'handwriting'"
            :class="inputMode === 'handwriting' ? 'bg-accent text-white shadow-sm font-semibold' : 'text-textSecondary hover:text-textPrimary'"
            class="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs transition-all"
          >
            <SparklesIcon class="w-4 h-4" />
            <span>Desenho / Caneta (OCR)</span>
          </button>
        </div>
      </div>

      <!-- Conteúdo do Formulário -->
      <div class="flex-1 overflow-y-auto px-4 sm:px-6 py-3 space-y-4 flex flex-col">
        <!-- Texto Selecionado / Citação -->
        <div>
          <label class="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
            Citação do Livro
          </label>
          <textarea
            v-model="selectedText"
            rows="2"
            placeholder="Trecho destacado ou selecione no livro..."
            class="w-full bg-bgApp/70 border border-divider rounded-xl p-3 text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent resize-none transition-colors"
          ></textarea>
        </div>

        <!-- Temas do Grafo -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-xs font-semibold text-textSecondary uppercase tracking-wider">
              Temas no Grafo de Conhecimento
            </label>
            <button
              v-if="!showNewThemeInput"
              type="button"
              @click="showNewThemeInput = true"
              class="text-[11px] text-accent hover:underline flex items-center gap-1 font-medium"
            >
              <PlusIcon class="w-3 h-3" />
              <span>Novo tema</span>
            </button>
          </div>

          <!-- Input para criar tema rápido -->
          <div v-if="showNewThemeInput" class="flex items-center gap-2 mb-3 bg-bgApp p-2 rounded-xl border border-divider">
            <input
              v-model="newThemeName"
              type="text"
              placeholder="Nome do tema..."
              class="bg-transparent text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none flex-1 px-2"
              @keydown.enter.prevent="handleCreateQuickTheme"
            />
            <button
              type="button"
              @click="handleCreateQuickTheme"
              :disabled="!newThemeName.trim() || isCreatingTheme"
              class="px-2.5 py-1 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-accent/90 disabled:opacity-50 transition-all"
            >
              {{ isCreatingTheme ? '...' : 'Adicionar' }}
            </button>
            <button
              type="button"
              @click="showNewThemeInput = false; newThemeName = ''"
              class="p-1 text-textSecondary hover:text-textPrimary"
            >
              <XIcon class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Tags de temas -->
          <div v-if="availableThemes.length > 0" class="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1">
            <button
              v-for="theme in availableThemes"
              :key="theme.id"
              type="button"
              @click="toggleThemeSelection(theme.id)"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer"
              :class="selectedThemeIds.includes(Number(theme.id))
                ? 'bg-accent/20 border-accent text-white shadow-sm'
                : 'bg-white/5 border-divider text-textSecondary hover:border-textSecondary/40 hover:text-textPrimary'"
            >
              <span
                class="w-2 h-2 rounded-full"
                :style="{ backgroundColor: theme.color || '#E57B55' }"
              ></span>
              <span>{{ theme.name }}</span>
              <CheckIcon v-if="selectedThemeIds.includes(Number(theme.id))" class="w-3 h-3 text-accent ml-0.5" />
            </button>
          </div>
          <p v-else class="text-xs text-textSecondary italic">
            Nenhum tema criado ainda. Clique em "Novo tema" para vincular ao Grafo.
          </p>
        </div>

        <!-- Área de Escrita: Alterna entre Digitação e Canvas -->
        <div class="flex-1 flex flex-col min-h-[280px]">
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-xs font-semibold text-textSecondary uppercase tracking-wider">
              {{ inputMode === 'handwriting' ? 'Área de Desenho Manual' : 'Sua Reflexão / Nota' }}
            </label>
            <span v-if="inputMode === 'handwriting'" class="text-[11px] text-textSecondary/70 flex items-center gap-1">
              <SparklesIcon class="w-3 h-3 text-accent" />
              OCR Gemini ativo
            </span>
          </div>

          <!-- Modo Digitação -->
          <div v-if="inputMode === 'type'" class="flex-1 flex flex-col">
            <textarea
              v-model="note"
              rows="8"
              placeholder="Digite suas ideias, reflexões e anotações sobre a leitura..."
              class="w-full flex-1 bg-bgApp/70 border border-divider rounded-xl p-3.5 text-xs sm:text-sm text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent resize-none transition-colors"
            ></textarea>
          </div>

          <!-- Modo Desenho Manual (Canvas) -->
          <div v-else class="flex-1 flex flex-col min-h-[300px]">
            <HandwritingCanvas ref="canvasComponentRef" />
          </div>
        </div>

        <!-- Mensagem de Erro (preserva dados em caso de falha de OCR) -->
        <div
          v-if="errorMessage"
          class="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs animate-shake"
        >
          <AlertCircleIcon class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="font-semibold">Erro ao processar anotação</p>
            <p class="mt-0.5 opacity-90">{{ errorMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Footer de Ações -->
      <div class="p-4 sm:p-5 border-t border-divider bg-bgApp/40 flex items-center justify-between gap-3">
        <button
          type="button"
          @click="handleClose"
          :disabled="isSubmitting"
          class="px-4 py-2.5 rounded-xl bg-white/5 border border-divider text-xs font-semibold text-textPrimary hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          @click="handleSubmit"
          :disabled="isSubmitting"
          class="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 disabled:opacity-50 transition-all shadow-lg active:scale-95 cursor-pointer"
        >
          <Loader2Icon v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <CheckIcon v-else class="w-4 h-4" />
          <span>{{ submitButtonLabel }}</span>
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  Edit3Icon,
  XIcon,
  KeyboardIcon,
  SparklesIcon,
  PlusIcon,
  CheckIcon,
  AlertCircleIcon,
  Loader2Icon,
} from 'lucide-vue-next'
import { useGraph } from '~/composables/useGraph'
import { useAnnotations, type AnnotationItem } from '~/composables/useAnnotations'
import HandwritingCanvas from './HandwritingCanvas.vue'

const props = defineProps<{
  isOpen: boolean
  initialText?: string
  currentPage: number
  bookId?: number | null
  chapterTitle?: string | null
  initialMode?: 'type' | 'handwriting'
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', annotation: AnnotationItem): void
}>()

const { graphData, fetchGraph, createNode } = useGraph()
const { createAnnotation, createAnnotationWithOcr } = useAnnotations()

const inputMode = ref<'type' | 'handwriting'>('handwriting')
const selectedText = ref('')
const note = ref('')
const selectedThemeIds = ref<number[]>([])
const showNewThemeInput = ref(false)
const newThemeName = ref('')
const isCreatingTheme = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const canvasComponentRef = ref<InstanceType<typeof HandwritingCanvas> | null>(null)

const availableThemes = computed(() => {
  return (graphData.value?.nodes || []).filter((n) => !n.isRoot && n.id !== -999)
})

const submitButtonLabel = computed(() => {
  if (isSubmitting.value) {
    return inputMode.value === 'handwriting' ? 'Transcrevendo com OCR...' : 'Salvando...'
  }
  return inputMode.value === 'handwriting' ? 'Salvar Anotação (com OCR)' : 'Salvar Anotação'
})

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      selectedText.value = props.initialText || ''
      note.value = ''
      selectedThemeIds.value = []
      showNewThemeInput.value = false
      newThemeName.value = ''
      errorMessage.value = null
      inputMode.value = props.initialMode || 'handwriting'
      void fetchGraph()
    }
  },
  { immediate: true },
)

const toggleThemeSelection = (themeId: number | string) => {
  const numId = Number(themeId)
  if (isNaN(numId)) return
  if (selectedThemeIds.value.includes(numId)) {
    selectedThemeIds.value = selectedThemeIds.value.filter((id) => id !== numId)
  } else {
    selectedThemeIds.value = [...selectedThemeIds.value, numId]
  }
}

const handleCreateQuickTheme = async () => {
  if (!newThemeName.value.trim() || isCreatingTheme.value) return
  isCreatingTheme.value = true
  try {
    const node = await createNode(newThemeName.value.trim())
    if (node && node.id) {
      const numId = Number(node.id)
      if (!isNaN(numId)) {
        selectedThemeIds.value.push(numId)
      }
    }
    newThemeName.value = ''
    showNewThemeInput.value = false
  } catch (err: any) {
    console.error('Erro ao criar tema:', err)
  } finally {
    isCreatingTheme.value = false
  }
}

const handleClose = () => {
  if (isSubmitting.value) return
  emit('close')
}

const handleSubmit = async () => {
  if (isSubmitting.value) return
  errorMessage.value = null

  const bookId = props.bookId || 1
  const cfi = `page:${props.currentPage}`
  const chapter = props.chapterTitle || `Página ${props.currentPage}`

  // 1. Fluxo de Desenho Manual com OCR
  if (inputMode.value === 'handwriting') {
    if (!canvasComponentRef.value) {
      errorMessage.value = 'Componente de desenho não inicializado.'
      return
    }

    const { base64, isEmpty } = canvasComponentRef.value.exportForOcr()
    if (isEmpty || !base64) {
      errorMessage.value = 'Por favor, desenhe ou escreva algo no canvas antes de salvar.'
      return
    }

    isSubmitting.value = true
    try {
      const created = await createAnnotationWithOcr({
        bookId,
        cfi,
        selectedText: selectedText.value.trim() || null,
        chapterTitle: chapter,
        themeIds: selectedThemeIds.value,
        imageBase64: base64,
        mimeType: 'image/png',
      })

      emit('created', created)
      emit('close')
    } catch (err: any) {
      errorMessage.value = err.message || 'Falha ao processar OCR ou salvar a anotação.'
    } finally {
      isSubmitting.value = false
    }
    return
  }

  // 2. Fluxo de Digitação Tradicional
  if (!selectedText.value.trim() && !note.value.trim()) {
    errorMessage.value = 'Por favor, preencha o trecho ou a sua anotação.'
    return
  }

  isSubmitting.value = true
  try {
    const created = await createAnnotation({
      bookId,
      cfi,
      selectedText: selectedText.value.trim() || null,
      note: note.value.trim() || null,
      themeIds: selectedThemeIds.value,
      chapterTitle: chapter,
    })

    emit('created', created)
    emit('close')
  } catch (err: any) {
    errorMessage.value = err.message || 'Não foi possível salvar a anotação.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  if (props.isOpen) {
    fetchGraph()
  }
})
</script>

<style scoped>
@keyframes slideLeft {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.animate-slideLeft {
  animation: slideLeft 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}

.animate-shake {
  animation: shake 0.3s ease-in-out;
}
</style>
