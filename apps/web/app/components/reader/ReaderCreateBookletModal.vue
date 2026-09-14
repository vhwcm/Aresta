<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    @click.self="handleClose"
    role="dialog"
    aria-modal="true"
    aria-labelledby="booklet-modal-title"
  >
    <div
      class="bg-bgPanel border border-divider rounded-2xl md:rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl flex flex-col gap-5 text-textPrimary max-h-[90vh] overflow-y-auto"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-divider pb-4">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
            <SparklesIcon class="w-5 h-5" />
          </div>
          <div>
            <h3 id="booklet-modal-title" class="text-lg font-editorial text-textPrimary">
              Criar Livreto Didático com IA
            </h3>
            <p v-if="parentBookTitle" class="text-[11px] text-textSecondary truncate max-w-xs">
              Contexto: {{ parentBookTitle }}
            </p>
          </div>
        </div>
        <button
          type="button"
          @click="handleClose"
          class="p-1.5 text-textSecondary hover:text-textPrimary hover:bg-white/5 rounded-xl transition-colors"
          aria-label="Fechar"
        >
          <XIcon class="w-5 h-5" />
        </button>
      </div>


      <!-- Fields -->
      <div class="flex flex-col gap-4">
        <!-- Tópico / Pergunta Central -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-technical text-textSecondary uppercase tracking-wider">
            Tópico / Trecho Selecionado (*):
          </label>
          <textarea
            v-model="topic"
            rows="3"
            placeholder="Ex: Como funciona este conceito e quais suas aplicações práticas?"
            class="w-full bg-bgApp/70 border border-divider rounded-xl p-3.5 text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-purple-400 resize-none transition-colors"
          ></textarea>
        </div>

        <!-- Título do Livreto (Opcional) -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-technical text-textSecondary uppercase tracking-wider">
            Título do Livreto (Opcional):
          </label>
          <input
            v-model="title"
            type="text"
            placeholder="Ex: Caderno de Fundamentos & Aplicações"
            class="w-full bg-bgApp/70 border border-divider rounded-xl px-3.5 py-2.5 text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-purple-400 transition-colors"
          />
        </div>

        <!-- Vincular Tema -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-technical text-textSecondary uppercase tracking-wider">
            Vincular Tema:
          </label>
          <select
            v-model="selectedThemeId"
            class="bg-bgApp/70 border border-divider rounded-xl p-2.5 text-xs text-textPrimary focus:outline-none focus:border-purple-400 transition-colors"
          >
            <option :value="null">Sem Tema Específico</option>
            <option v-for="node in availableThemes" :key="node.id" :value="Number(node.id)">
              {{ node.name }}
            </option>
          </select>
        </div>

        <!-- Alerta de Erro -->
        <div
          v-if="errorMessage"
          class="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-interface text-red-400 flex items-start gap-2.5 animate-fadeIn"
        >
          <AlertCircleIcon class="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div class="flex-1 leading-relaxed">
            {{ errorMessage }}
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="flex items-center justify-end gap-3 pt-3 border-t border-divider">
        <button
          type="button"
          @click="handleClose"
          :disabled="isGenerating"
          class="px-5 py-2.5 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary hover:bg-white/5 transition-all disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="handleCreate"
          :disabled="!topic.trim() || isGenerating"
          class="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 active:scale-95 cursor-pointer"
        >
          <SparklesIcon v-if="!isGenerating" class="w-4 h-4" />
          <span v-else class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <span>{{ isGenerating ? 'Gerando Livreto...' : 'Criar e Abrir no Leitor' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { SparklesIcon, XIcon, AlertCircleIcon } from 'lucide-vue-next'
import { useDidacticBooklet } from '~/composables/useDidacticBooklet'
import { useGraph } from '~/composables/useGraph'

const props = defineProps<{
  isOpen: boolean
  initialTopic?: string
  parentBookId?: number | string | null
  parentBookTitle?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', book: any): void
}>()

let router: any = null
try {
  router = useRouter()
} catch {}
const didactic = useDidacticBooklet()
const { graphData, fetchGraph } = useGraph()

const topic = ref('')
const title = ref('')
const selectedThemeId = ref<number | null>(null)
const errorMessage = ref<string | null>(null)

const isGenerating = computed(() => didactic.isGenerating.value)

const availableThemes = computed(() => {
  return (graphData.value?.nodes || []).filter((n: any) => {
    if (n.isRoot || n.id === -999) return false
    if (n.type && n.type !== 'theme') return false
    if (typeof n.id === 'string' && (n.id.startsWith('book-') || n.id.startsWith('note-') || n.id.startsWith('canvas-'))) {
      return false
    }
    return true
  })
})

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      topic.value = props.initialTopic || ''
      title.value = ''
      selectedThemeId.value = null
      errorMessage.value = null
      fetchGraph()
    }
  },
  { immediate: true },
)

function handleClose() {
  if (isGenerating.value) return
  emit('close')
}

async function handleCreate() {
  if (!topic.value.trim() || isGenerating.value) return
  errorMessage.value = null

  try {
    const parentId = props.parentBookId ? Number(props.parentBookId) : undefined
    const result = await didactic.createBooklet({
      title: title.value.trim() || undefined,
      topic: topic.value.trim(),
      theme_id: selectedThemeId.value || undefined,
      parent_book_id: !isNaN(parentId as number) ? parentId : undefined,
    })

    const newBookId = result?.book?.id || result?.booklet?.book_id
    emit('created', result?.book || result?.booklet)
    emit('close')

    if (newBookId) {
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = `/reader?bookId=${newBookId}`
      } else if (router?.push) {
        await router.push(`/reader?bookId=${newBookId}`)
      }
    }
  } catch (err: any) {
    console.error('Erro ao criar livreto didático:', err)
    errorMessage.value =
      err.message ||
      'Não foi possível gerar o livreto com IA no momento. Por favor, tente novamente em instantes.'
  }
}

onMounted(() => {
  if (props.isOpen) {
    fetchGraph()
  }
})
</script>
