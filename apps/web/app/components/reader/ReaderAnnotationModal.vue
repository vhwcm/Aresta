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
          <div
            class="p-2 rounded-xl transition-colors border"
            :style="{
              backgroundColor: `${selectedColor}20`,
              borderColor: `${selectedColor}40`,
              color: selectedColor
            }"
          >
            <HighlighterIcon class="w-5 h-5" />
          </div>
          <div>
            <h3 id="annotation-modal-title" class="font-bold text-base">Nova Anotação</h3>
            <p class="text-xs text-textSecondary">Página {{ currentPage }}</p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="p-2 text-textSecondary hover:text-textPrimary hover:bg-white/5 rounded-xl transition-colors"
          aria-label="Fechar"
        >
          <XIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Form Body -->
      <div class="flex-1 overflow-y-auto py-4 space-y-4">
        <!-- Escolha de Cor do Destaque / Anotação -->
        <div>
          <label class="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
            Cor da Anotação
          </label>
          <div class="flex items-center gap-3 flex-wrap" role="radiogroup" aria-label="Escolha da cor">
            <button
              v-for="color in ANNOTATION_COLORS"
              :key="color.id"
              type="button"
              role="radio"
              :aria-checked="selectedColor === color.hex"
              @click="selectedColor = color.hex"
              class="group relative flex items-center justify-center w-8 h-8 rounded-full transition-all cursor-pointer focus:outline-none"
              :class="selectedColor === color.hex
                ? 'scale-110 shadow-lg ring-2 ring-white ring-offset-2 ring-offset-bgPanel'
                : 'opacity-70 hover:opacity-100 hover:scale-105'"
              :style="{ backgroundColor: color.hex }"
              :title="color.label"
              :aria-label="`Cor ${color.label}`"
            >
              <CheckIcon
                v-if="selectedColor === color.hex"
                class="w-4 h-4 text-white drop-shadow stroke-[3]"
              />
            </button>
          </div>
        </div>

        <!-- Opção: Desejo fazer uma anotação escrita -->
        <div
          class="flex items-center justify-between p-3.5 rounded-xl bg-bgApp/60 border border-divider hover:border-accent/40 transition-all cursor-pointer select-none"
          @click="wantNote = !wantNote"
          role="button"
          tabindex="0"
          data-testid="toggle-want-note"
          @keydown.space.prevent="wantNote = !wantNote"
          @keydown.enter.prevent="wantNote = !wantNote"
        >
          <div class="flex items-center gap-3">
            <div
              class="p-2 rounded-lg transition-colors"
              :class="wantNote ? 'bg-accent/15 text-accent' : 'bg-white/5 text-textSecondary'"
            >
              <MessageSquareIcon class="w-4 h-4" />
            </div>
            <div>
              <span class="text-xs font-semibold text-textPrimary">Fazer uma anotação</span>
              <p class="text-[11px] text-textSecondary">
                {{ wantNote ? 'Escreva suas reflexões ou notas pessoais abaixo' : 'Salvar apenas o trecho destacado com a cor escolhida' }}
              </p>
            </div>
          </div>

          <!-- Toggle Switch -->
          <div
            class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out"
            :class="wantNote ? 'bg-accent' : 'bg-white/10'"
          >
            <span
              class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out"
              :class="wantNote ? 'translate-x-4' : 'translate-x-0'"
            />
          </div>
        </div>

        <!-- Seção Condicional: Só exibida se o usuário optar por fazer anotação -->
        <div v-if="wantNote" class="space-y-4 pt-1 animate-fadeIn">
          <!-- Textarea de Anotação / Reflexão -->
          <div>
            <label class="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
              Sua Anotação / Reflexão
            </label>
            <textarea
              v-model="note"
              rows="4"
              placeholder="Escreva suas ideias, reflexões ou resumo sobre este trecho..."
              class="w-full bg-bgApp/70 border border-divider rounded-xl p-3 text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent resize-none transition-colors"
              data-testid="annotation-note-textarea"
            ></textarea>
          </div>

          <!-- Seleção de Temas do Grafo (Recolhível) -->
          <div class="border border-divider rounded-xl bg-bgApp/40 overflow-hidden">
            <button
              type="button"
              @click="showThemesSection = !showThemesSection"
              class="w-full flex items-center justify-between p-3 text-xs text-textSecondary hover:text-textPrimary transition-colors"
            >
              <div class="flex items-center gap-2 font-medium">
                <span>Temas no Grafo de Conhecimento</span>
                <span
                  v-if="selectedThemeIds.length > 0"
                  class="px-1.5 py-0.5 rounded-md bg-accent/20 text-accent font-semibold text-[10px]"
                >
                  {{ selectedThemeIds.length }}
                </span>
              </div>
              <ChevronDownIcon v-if="!showThemesSection" class="w-4 h-4" />
              <ChevronUpIcon v-else class="w-4 h-4" />
            </button>

            <div v-if="showThemesSection" class="p-3 border-t border-divider space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="text-[11px] text-textSecondary">Categorize para visualizar conexões</span>
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

              <!-- Input para criar novo tema rapidamente -->
              <div v-if="showNewThemeInput" class="flex items-center gap-2 bg-bgApp p-2 rounded-xl border border-divider">
                <input
                  v-model="newThemeName"
                  type="text"
                  placeholder="Nome do novo tema..."
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
                Nenhum tema criado ainda.
              </p>
            </div>
          </div>
        </div>

        <p v-if="errorMessage" class="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
          {{ errorMessage }}
        </p>
      </div>

      <!-- Footer Actions -->
      <div class="pt-4 border-t border-divider flex items-center justify-end gap-2.5">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 rounded-xl bg-white/5 border border-divider text-xs font-semibold text-textPrimary hover:bg-white/10 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="handleSubmit"
          :disabled="isSubmitting || (!selectedText.trim() && (!wantNote || !note.trim()))"
          class="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 disabled:opacity-50 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <CheckIcon class="w-3.5 h-3.5" />
          <span>{{ isSubmitting ? 'Salvando...' : (wantNote ? 'Salvar Anotação' : 'Salvar Destaque') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  HighlighterIcon,
  XIcon,
  PlusIcon,
  CheckIcon,
  MessageSquareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from 'lucide-vue-next'
import { useGraph } from '~/composables/useGraph'
import { useAnnotations, type AnnotationItem } from '~/composables/useAnnotations'

export interface AnnotationColorOption {
  id: string
  label: string
  hex: string
}

const ANNOTATION_COLORS: AnnotationColorOption[] = [
  { id: 'yellow', label: 'Amarelo Ouro', hex: '#F59E0B' },
  { id: 'coral', label: 'Coral Aresta', hex: '#E57B55' },
  { id: 'green', label: 'Verde Menta', hex: '#10B981' },
  { id: 'blue', label: 'Azul Celeste', hex: '#3B82F6' },
  { id: 'purple', label: 'Roxo Lavanda', hex: '#8B5CF6' },
  { id: 'rose', label: 'Rosa Carmim', hex: '#EC4899' },
]

const props = defineProps<{
  isOpen: boolean
  initialText?: string
  currentPage: number
  bookId?: number | null
  bookTitle?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', annotation: AnnotationItem): void
}>()

const { graphData, fetchGraph, createNode } = useGraph()
const { createAnnotation } = useAnnotations()

const selectedText = ref('')
const selectedColor = ref('#E57B55')
const wantNote = ref(false)
const note = ref('')
const selectedThemeIds = ref<number[]>([])
const showThemesSection = ref(false)
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
      selectedColor.value = '#E57B55'
      // Se não há texto inicial (ex: clicou em "+ Anotar"), assume que quer escrever anotação
      wantNote.value = !props.initialText || props.initialText.trim().length === 0
      note.value = ''
      selectedThemeIds.value = []
      showThemesSection.value = false
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
    const finalNote = wantNote.value ? note.value.trim() : null
    const created = await createAnnotation({
      bookId,
      bookTitle: props.bookTitle,
      cfi: `page:${props.currentPage}`,
      selectedText: selectedText.value.trim() || null,
      note: finalNote || null,
      color: selectedColor.value,
      themeIds: wantNote.value ? selectedThemeIds.value : [],
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
