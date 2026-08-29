<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
    @click.self="$emit('close')"
    role="dialog"
    aria-modal="true"
    aria-labelledby="annotation-modal-title"
  >
    <div class="bg-bgPanel border border-divider rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[90vh] text-textPrimary">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-divider">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent">
            <HighlighterIcon class="w-5 h-5" />
          </div>
          <div>
            <h3 id="annotation-modal-title" class="font-bold text-base">Nova Anotação</h3>
            <p class="text-xs text-textSecondary">Página {{ currentPage }}</p>
          </div>
        </div>
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            @click="$emit('expand')"
            class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent/10 border border-accent/30 rounded-xl transition-all shadow-sm"
            title="Expandir tela / Modo Caneta (OCR)"
          >
            <SparklesIcon class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Modo Caneta (OCR)</span>
            <Maximize2Icon class="w-3.5 h-3.5" />
          </button>
          <button
            @click="$emit('close')"
            class="p-2 text-textSecondary hover:text-textPrimary hover:bg-white/5 rounded-xl transition-colors"
            aria-label="Fechar"
          >
            <XIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Form Body -->
      <div class="flex-1 overflow-y-auto py-4 space-y-4">
        <!-- Texto Selecionado / Citação -->
        <div>
          <label class="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
            Texto Selecionado (Citação)
          </label>
          <textarea
            v-model="selectedText"
            rows="3"
            placeholder="Cole ou digite o trecho do livro..."
            class="w-full bg-bgApp/70 border border-divider rounded-xl p-3 text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent resize-none transition-colors"
          ></textarea>
        </div>

        <!-- Seleção de Temas do Grafo -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-xs font-semibold text-textSecondary uppercase tracking-wider">
              Temas no Grafo de Conhecimento
            </label>
            <button
              v-if="!showNewThemeInput"
              @click="showNewThemeInput = true"
              class="text-[11px] text-accent hover:underline flex items-center gap-1 font-medium"
            >
              <PlusIcon class="w-3 h-3" />
              <span>Novo tema</span>
            </button>
          </div>

          <!-- Input para criar novo tema rapidamente -->
          <div v-if="showNewThemeInput" class="flex items-center gap-2 mb-3 bg-bgApp p-2 rounded-xl border border-divider">
            <input
              v-model="newThemeName"
              type="text"
              placeholder="Nome do novo tema..."
              class="bg-transparent text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none flex-1 px-2"
              @keydown.enter.prevent="handleCreateQuickTheme"
            />
            <button
              @click="handleCreateQuickTheme"
              :disabled="!newThemeName.trim() || isCreatingTheme"
              class="px-2.5 py-1 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-accent/90 disabled:opacity-50 transition-all"
            >
              {{ isCreatingTheme ? '...' : 'Adicionar' }}
            </button>
            <button
              @click="showNewThemeInput = false; newThemeName = ''"
              class="p-1 text-textSecondary hover:text-textPrimary"
            >
              <XIcon class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Tags de temas existentes -->
          <div v-if="availableThemes.length > 0" class="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
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
            Nenhum tema criado ainda. Clique em "Novo tema" para categorizar no Grafo.
          </p>
        </div>

        <!-- Anotação / Nota Pessoal -->
        <div>
          <label class="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
            Sua Anotação / Reflexão
          </label>
          <textarea
            v-model="note"
            rows="4"
            placeholder="Escreva suas ideias, reflexões ou resumo sobre este trecho..."
            class="w-full bg-bgApp/70 border border-divider rounded-xl p-3 text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent resize-none transition-colors"
          ></textarea>
        </div>

        <p v-if="errorMessage" class="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
          {{ errorMessage }}
        </p>
      </div>

      <!-- Footer Actions -->
      <div class="pt-4 border-t border-divider flex items-center justify-end gap-2.5">
        <button
          @click="$emit('close')"
          class="px-4 py-2 rounded-xl bg-white/5 border border-divider text-xs font-semibold text-textPrimary hover:bg-white/10 transition-colors"
        >
          Cancelar
        </button>
        <button
          @click="handleSubmit"
          :disabled="isSubmitting || (!selectedText.trim() && !note.trim())"
          class="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 disabled:opacity-50 transition-all shadow-md active:scale-95"
        >
          <CheckIcon class="w-3.5 h-3.5" />
          <span>{{ isSubmitting ? 'Salvando...' : 'Salvar Anotação' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { HighlighterIcon, XIcon, PlusIcon, CheckIcon, SparklesIcon, Maximize2Icon } from 'lucide-vue-next'
import { useGraph } from '~/composables/useGraph'
import { useAnnotations, type AnnotationItem } from '~/composables/useAnnotations'

const props = defineProps<{
  isOpen: boolean
  initialText?: string
  currentPage: number
  bookId?: number | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'expand'): void
  (e: 'created', annotation: AnnotationItem): void
}>()

const { graphData, fetchGraph, createNode } = useGraph()
const { createAnnotation } = useAnnotations()

const selectedText = ref('')
const note = ref('')
const selectedThemeIds = ref<number[]>([])
const showNewThemeInput = ref(false)
const newThemeName = ref('')
const isCreatingTheme = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

const availableThemes = computed(() => {
  return (graphData.value?.nodes || []).filter((n) => !n.isRoot && n.id !== -999)
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

const handleSubmit = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  errorMessage.value = null

  try {
    const bookId = props.bookId || 1 // Fallback para 1 se bookId não estiver setado
    const created = await createAnnotation({
      bookId,
      cfi: `page:${props.currentPage}`,
      selectedText: selectedText.value.trim() || null,
      note: note.value.trim() || null,
      themeIds: selectedThemeIds.value,
      chapterTitle: `Página ${props.currentPage}`,
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
