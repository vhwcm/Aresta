<template>
  <div class="w-full h-full flex flex-col relative overflow-hidden bg-transparent text-textPrimary">

    <!-- VISUALIZAÇÃO 1: GRAFO INTERATIVO -->
    <div v-if="!selectedNode" class="w-full h-full flex flex-col relative">
      <!-- State de Carregamento -->
      <div v-if="loading && (!graphData.nodes || graphData.nodes.length === 0)" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-bgApp/90">
        <div class="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin mb-3"></div>
        <p class="text-[10px] font-technical text-textSecondary uppercase tracking-widest">Carregando Conexões...</p>
      </div>

      <!-- Canvas D3 no modo compacto -->
      <GraphCanvas
        :nodes="graphData.nodes || []"
        :edges="graphData.edges || []"
        :is-compact="true"
        @select-node="handleSelectNode"
        @open-create-node="isCreateModalOpen = true"
        @open-connect-modal="isConnectModalOpen = true"
      />
    </div>

    <!-- VISUALIZAÇÃO 2: LISTA DE LIVROS DO MAPA MENTAL CLICADO -->
    <div v-else class="w-full h-full flex flex-col bg-bgPanel/95 backdrop-blur-xl z-20 relative animate-fadeIn">

      <!-- Cabeçalho com Seta de Voltar para o Grafo -->
      <div class="p-5 border-b border-divider flex flex-col gap-4 bg-bgApp/40">
        <button
          @click="goBackToGraph"
          class="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-accent hover:text-accent/80 transition-colors w-fit group cursor-pointer"
          title="Voltar para o Grafo"
        >
          <ArrowLeftIcon class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Voltar para o Grafo</span>
        </button>

        <div class="flex items-center gap-3">
          <div
            class="w-4 h-4 rounded-full shadow-md shrink-0"
            :style="{ backgroundColor: selectedNode.color || '#E57B55' }"
          ></div>
          <div>
            <h2 class="text-base sm:text-lg font-bold font-interface text-textPrimary leading-tight truncate max-w-[280px]">
              {{ selectedNode.name }}
            </h2>
            <p class="text-xs text-textSecondary font-technical mt-0.5">
              {{ displayedBooks.length }} {{ displayedBooks.length === 1 ? 'livro conectado' : 'livros conectados' }}
            </p>
          </div>
        </div>

        <p v-if="selectedNode.description" class="text-xs sm:text-sm text-textSecondary font-light leading-relaxed line-clamp-2">
          {{ selectedNode.description }}
        </p>
      </div>

      <!-- Corpo da Lista de Livros -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        <div v-if="displayedBooks.length > 0" class="space-y-2.5">
          <div
            v-for="book in displayedBooks"
            :key="book.userBookId"
            class="flex items-center justify-between bg-bgApp/80 border border-divider/70 hover:border-accent/40 p-3.5 rounded-2xl transition-all group"
          >
            <div class="flex items-center gap-3.5 min-w-0 flex-1">
              <!-- Capa do Livro -->
              <div class="w-11 h-16 rounded-lg bg-white/5 border border-divider shrink-0 overflow-hidden flex items-center justify-center shadow-md">
                <img
                  v-if="book.coverPath"
                  :src="getCoverUrl(book.coverPath, book.bookId)"
                  :alt="book.title"
                  class="w-full h-full object-cover"
                />
                <BookIcon v-else class="w-5 h-5 text-textSecondary" />
              </div>

              <!-- Detalhes do Livro -->
              <div class="min-w-0 flex-1">
                <h4 class="text-xs sm:text-sm font-semibold text-textPrimary truncate group-hover:text-accent transition-colors">
                  {{ book.title }}
                </h4>

                <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span
                    class="text-[10px] sm:text-xs font-technical uppercase font-bold px-2 py-0.5 rounded-md"
                    :class="getStatusBadgeClass(book.status)"
                  >
                    {{ getStatusLabel(book.status) }}
                  </span>
                  <span v-if="book.status === 'LENDO' && book.currentPage" class="text-xs text-textSecondary font-technical">
                    Pág. {{ book.currentPage }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Botão de Leitura / Ação -->
            <NuxtLink
              :to="`/reader?bookId=${book.bookId}`"
              class="p-2.5 rounded-xl bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-white transition-all shrink-0 ml-2"
              title="Ler este livro"
            >
              <BookOpenIcon class="w-4 h-4" />
            </NuxtLink>
          </div>
        </div>

        <!-- Estado Vazio -->
        <div v-else class="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-divider rounded-2xl text-center space-y-3">
          <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
            <BookOpenIcon class="w-6 h-6 text-textSecondary opacity-50" />
          </div>
          <div>
            <p class="text-sm font-semibold text-textPrimary">Nenhum livro neste tema</p>
            <p class="text-xs text-textSecondary mt-1">Este mapa mental ainda não possui livros vinculados.</p>
          </div>
          <NuxtLink
            to="/grafo"
            class="text-xs sm:text-sm text-accent font-semibold hover:underline inline-flex items-center gap-1"
          >
            <span>Gerenciar Conexões em Mapa Mental</span>
            <ExternalLinkIcon class="w-3.5 h-3.5" />
          </NuxtLink>
        </div>
      </div>

      <!-- Rodapé com Ação de Voltar -->
      <div class="p-4 border-t border-divider bg-bgApp/60 shrink-0">
        <button
          @click="goBackToGraph"
          class="w-full bg-white/5 border border-divider text-textPrimary hover:bg-white/10 font-semibold py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <ArrowLeftIcon class="w-4 h-4" />
          <span>Voltar para o Grafo</span>
        </button>
      </div>
    </div>

    <!-- Modais para Criação e Conexão de Nós diretamente no sidebar -->
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
import { ref, computed, onMounted } from 'vue'
import { ArrowLeftIcon, BookIcon, BookOpenIcon, ExternalLinkIcon } from 'lucide-vue-next'
import type { GraphNode, UserBookItem } from '~/interfaces/graph'
import { useGraph } from '~/composables/useGraph'
import { useUserBooks } from '~/composables/useUserBooks'
import { getCoverUrl } from '~/utils/cover'

import GraphCanvas from '~/components/GraphCanvas.vue'
import CreateNodeModal from '~/components/CreateNodeModal.vue'
import ConnectNodesModal from '~/components/ConnectNodesModal.vue'

const { graphData, loading, fetchGraph, createNode, createConnection } = useGraph()
const { userBooks, fetchUserBooks } = useUserBooks()

const selectedNode = ref<GraphNode | null>(null)
const isCreateModalOpen = ref(false)
const isConnectModalOpen = ref(false)

const handleSelectNode = (node: GraphNode) => {
  selectedNode.value = node
}

const goBackToGraph = () => {
  selectedNode.value = null
}

const displayedBooks = computed<UserBookItem[]>(() => {
  if (!selectedNode.value) return []
  // Se for o Nó Central (Meu Conhecimento)
  if (selectedNode.value.isRoot || selectedNode.value.id === -999) {
    return userBooks.value
  }
  // Caso contrário, livros vinculados a este tema específico
  return (selectedNode.value.books || []) as any
})

const handleCreateNode = async (payload: { name: string, color: string, description: string }) => {
  await createNode(payload.name, payload.color, payload.description)
  isCreateModalOpen.value = false
}

const handleConnectNodes = async (payload: { sourceId: number, targetId: number }) => {
  await createConnection(payload.sourceId, payload.targetId)
  isConnectModalOpen.value = false
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'LENDO': return 'Lendo'
    case 'LIDO': return 'Lido'
    case 'QUERO_LER': return 'Quero Ler'
    case 'ABANDONADO': return 'Abandonado'
    default: return status
  }
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'LENDO': return 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    case 'LIDO': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
    case 'QUERO_LER': return 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
    default: return 'bg-white/10 text-textSecondary'
  }
}

onMounted(() => {
  fetchGraph()
  fetchUserBooks()
})
</script>
