<template>
  <div class="w-full h-full flex flex-col relative overflow-hidden bg-bgApp text-textPrimary border-l border-divider">
    <!-- VISUALIZAÇÃO 1: GRAFO INTERATIVO -->
    <div v-if="!selectedTheme" class="w-full h-full flex flex-col relative">
      <!-- Header do Painel do Grafo -->
      <div class="p-3.5 border-b border-divider flex items-center justify-between bg-bgPanel/80 backdrop-blur-md z-10">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent">
            <NetworkIcon class="w-4 h-4" />
          </div>
          <div>
            <h3 class="font-bold text-xs">Grafo de Conhecimento</h3>
            <p class="text-[10px] text-textSecondary">Selecione um tema para ver anotações</p>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <button
            @click="$emit('close')"
            class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-textSecondary hover:text-textPrimary transition-all"
            title="Recolher Grafo para focar na leitura"
          >
            <ChevronRightIcon v-if="!isMobile" class="w-4 h-4" />
            <XIcon v-else class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- State de Carregamento -->
      <div v-if="graphLoading && (!graphData.nodes || graphData.nodes.length === 0)" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-bgApp/90">
        <div class="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mb-3"></div>
        <p class="text-[10px] font-technical text-textSecondary uppercase tracking-widest">Carregando Temas...</p>
      </div>

      <!-- Canvas D3 no modo compacto -->
      <div class="flex-1 w-full h-full relative">
        <GraphCanvas
          :nodes="graphData.nodes || []"
          :edges="graphData.edges || []"
          :is-compact="true"
          @select-node="handleSelectNode"
          @open-create-node="isCreateModalOpen = true"
          @open-connect-modal="isConnectModalOpen = true"
        />
      </div>
    </div>

    <!-- VISUALIZAÇÃO 2: LISTA DE ANOTAÇÕES DO TEMA SELECIONADO -->
    <div v-else class="w-full h-full flex flex-col bg-bgPanel/95 backdrop-blur-xl z-20 relative animate-fadeIn">
      <!-- Cabeçalho do Tema com Botão Voltar -->
      <div class="p-4 border-b border-divider flex flex-col gap-3 bg-bgApp/40">
        <div class="flex items-center justify-between">
          <button
            @click="goBackToGraph"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 transition-colors w-fit group cursor-pointer"
          >
            <ArrowLeftIcon class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Voltar ao Grafo</span>
          </button>

          <button
            @click="$emit('close')"
            class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-textSecondary hover:text-textPrimary transition-all"
            title="Fechar painel"
          >
            <XIcon class="w-4 h-4" />
          </button>
        </div>

        <div class="flex items-center gap-2.5">
          <div
            class="w-3.5 h-3.5 rounded-full shadow-md shrink-0"
            :style="{ backgroundColor: selectedTheme.color || '#E57B55' }"
          ></div>
          <div>
            <h2 class="text-sm font-bold text-textPrimary leading-tight truncate">
              {{ selectedTheme.name }}
            </h2>
            <p class="text-[10px] text-textSecondary font-technical mt-0.5">
              {{ themeAnnotations.length }} {{ themeAnnotations.length === 1 ? 'anotação vinculada' : 'anotações vinculadas' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Lista de Anotações do Tema -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3.5">
        <div v-if="annotationsLoading" class="flex flex-col items-center justify-center py-12">
          <div class="w-7 h-7 rounded-full border-2 border-accent border-t-transparent animate-spin mb-2"></div>
          <p class="text-xs text-textSecondary font-technical">Carregando anotações...</p>
        </div>

        <div v-else-if="themeAnnotations.length > 0" class="space-y-3">
          <div
            v-for="item in themeAnnotations"
            :key="item.id"
            class="bg-bgApp/80 border border-divider/70 hover:border-accent/40 rounded-xl p-3.5 transition-all space-y-2.5 group"
          >
            <!-- Citação / Texto Selecionado Original (Imutável) -->
            <div v-if="item.selectedText" class="p-2.5 rounded-lg bg-black/20 border-l-2 border-accent/60 text-xs text-textSecondary italic">
              "{{ item.selectedText }}"
            </div>

            <!-- Modo de Edição da Nota -->
            <div v-if="editingAnnotationId === item.id" class="space-y-2">
              <label class="block text-[10px] font-semibold text-accent uppercase tracking-wider">
                Editar sua Anotação:
              </label>
              <textarea
                v-model="editNoteText"
                rows="3"
                class="w-full bg-bgApp border border-accent/60 rounded-xl p-2.5 text-xs text-textPrimary focus:outline-none resize-none"
                placeholder="Escreva sua reflexão..."
              ></textarea>
              <div class="flex items-center justify-end gap-2">
                <button
                  @click="cancelEdit"
                  class="px-2.5 py-1 text-xs text-textSecondary hover:text-textPrimary bg-white/5 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  @click="handleSaveNote(item.id)"
                  :disabled="isSavingNote"
                  class="px-3 py-1 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 flex items-center gap-1"
                >
                  <CheckIcon class="w-3 h-3" />
                  <span>{{ isSavingNote ? 'Salvando...' : 'Salvar Nota' }}</span>
                </button>
              </div>
            </div>

            <!-- Modo de Visualização da Nota -->
            <div
              v-else
              @click="startEdit(item)"
              class="cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors"
              title="Clique para alterar esta anotação"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] font-technical uppercase font-bold text-textSecondary">Sua Nota:</span>
                <span class="text-[10px] text-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-medium">
                  <Edit3Icon class="w-3 h-3" />
                  <span>Editar</span>
                </span>
              </div>
              <p class="text-xs text-textPrimary whitespace-pre-wrap leading-relaxed">
                {{ item.note || 'Sem comentário escrito. Clique para adicionar.' }}
              </p>
            </div>

            <!-- Rodapé da Anotação (Data / Página / Ação) -->
            <div class="flex items-center justify-between pt-2 border-t border-divider/40 text-[10px] text-textSecondary font-technical">
              <span>{{ formatDate(item.createdAt) }}</span>
              <button
                v-if="getPageFromCfi(item.cfi)"
                @click="jumpToAnnotationPage(item.cfi)"
                class="text-accent hover:underline flex items-center gap-1"
                title="Ir para a página desta anotação"
              >
                <span>Pág. {{ getPageFromCfi(item.cfi) }}</span>
                <ArrowRightIcon class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <!-- Vazio -->
        <div v-else class="flex flex-col items-center justify-center py-12 text-center text-textSecondary space-y-2">
          <BookOpenIcon class="w-8 h-8 opacity-30 mx-auto" />
          <p class="text-xs font-semibold text-textPrimary">Nenhuma anotação vinculada</p>
          <p class="text-[11px]">Selecione um trecho do livro e associe a este tema para salvar anotações.</p>
        </div>
      </div>

      <!-- Rodapé -->
      <div class="p-3 border-t border-divider bg-bgApp/60 flex items-center justify-between">
        <button
          @click="goBackToGraph"
          class="px-3 py-1.5 text-xs text-textSecondary hover:text-textPrimary bg-white/5 rounded-xl transition-colors flex items-center gap-1.5"
        >
          <ArrowLeftIcon class="w-3.5 h-3.5" />
          <span>Voltar ao Grafo</span>
        </button>
        <button
          @click="$emit('openAnnotationModal')"
          class="px-3 py-1.5 text-xs font-semibold bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors flex items-center gap-1.5"
        >
          <PlusIcon class="w-3.5 h-3.5" />
          <span>Nova Anotação</span>
        </button>
      </div>
    </div>

    <!-- Modais para Criar e Conectar Nós no Grafo -->
    <CreateNodeModal
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @create="handleCreateNode"
    />

    <ConnectNodesModal
      :is-open="isConnectModalOpen"
      :nodes="graphData.nodes || []"
      @close="isConnectModalOpen = false"
      @connect="handleConnectNodes"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import {
  NetworkIcon,
  ChevronRightIcon,
  XIcon,
  ArrowLeftIcon,
  Edit3Icon,
  CheckIcon,
  ArrowRightIcon,
  BookOpenIcon,
  PlusIcon,
} from 'lucide-vue-next'
import type { GraphNode } from '~/interfaces/graph'
import { useGraph } from '~/composables/useGraph'
import { useAnnotations, type AnnotationItem } from '~/composables/useAnnotations'
import { useReaderStore } from '~/stores/readerStore'

import GraphCanvas from '~/components/GraphCanvas.vue'
import CreateNodeModal from '~/components/CreateNodeModal.vue'
import ConnectNodesModal from '~/components/ConnectNodesModal.vue'

defineProps<{
  isMobile?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'openAnnotationModal'): void
}>()

const store = useReaderStore()
const { graphData, loading: graphLoading, fetchGraph, createNode, createConnection } = useGraph()
const { annotations: themeAnnotations, loading: annotationsLoading, fetchAnnotations, updateAnnotationNote } = useAnnotations()

const selectedTheme = ref<GraphNode | null>(null)
const isCreateModalOpen = ref(false)
const isConnectModalOpen = ref(false)

const editingAnnotationId = ref<number | null>(null)
const editNoteText = ref('')
const isSavingNote = ref(false)

const handleSelectNode = async (node: GraphNode) => {
  selectedTheme.value = node
  editingAnnotationId.value = null
  if (node.id && node.id !== -999) {
    await fetchAnnotations({ themeId: node.id })
  } else {
    await fetchAnnotations(store.bookId ? { bookId: store.bookId } : undefined)
  }
}

const goBackToGraph = () => {
  selectedTheme.value = null
  editingAnnotationId.value = null
}

const startEdit = (item: AnnotationItem) => {
  editingAnnotationId.value = item.id
  editNoteText.value = item.note || ''
}

const cancelEdit = () => {
  editingAnnotationId.value = null
  editNoteText.value = ''
}

const handleSaveNote = async (annotationId: number) => {
  if (isSavingNote.value) return
  isSavingNote.value = true
  try {
    await updateAnnotationNote(annotationId, editNoteText.value.trim())
    editingAnnotationId.value = null
  } catch (err: any) {
    console.error('Erro ao salvar nota:', err)
  } finally {
    isSavingNote.value = false
  }
}

const handleCreateNode = async (payload: { name: string; color: string; description: string }) => {
  await createNode(payload.name, payload.color, payload.description)
  isCreateModalOpen.value = false
}

const handleConnectNodes = async (payload: { sourceId: number; targetId: number }) => {
  await createConnection(payload.sourceId, payload.targetId)
  isConnectModalOpen.value = false
}

const getPageFromCfi = (cfi?: string): number | null => {
  if (!cfi) return null
  const match = cfi.match(/page:(\d+)/)
  return match && match[1] ? parseInt(match[1], 10) : null
}

const jumpToAnnotationPage = (cfi?: string) => {
  const page = getPageFromCfi(cfi)
  if (page) {
    store.goToPage(page)
  }
}

const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

onMounted(() => {
  fetchGraph()
})

defineExpose({
  refresh: () => {
    fetchGraph()
    if (selectedTheme.value && selectedTheme.value.id !== -999) {
      fetchAnnotations({ themeId: selectedTheme.value.id })
    }
  },
})
</script>
