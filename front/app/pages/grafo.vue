<template>
  <div class="h-full w-full flex flex-col relative overflow-hidden bg-bgApp text-textPrimary">
    <!-- Cabeçalho do Módulo de Grafo -->
    <header class="shrink-0 px-8 py-4 border-b border-divider/60 bg-bgPanel/40 backdrop-blur-sm flex items-center justify-between z-10">
      <div>
        <div class="flex items-center gap-2">
          <NetworkIcon class="w-5 h-5 text-accent" />
          <h1 class="text-xl font-bold font-interface tracking-tight">Mapa Mental & Grafo de Conhecimento</h1>
        </div>
        <p class="text-xs text-textSecondary font-light mt-0.5">
          Conexões semânticas entre temas, subtemas e livros geradas dinamicamente com IA.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Link para Upload Admin -->
        <NuxtLink
          to="/admin/upload"
          class="px-4 py-2 rounded-xl bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-all text-xs font-technical flex items-center gap-2"
          title="Upload de Livros & Enriquecimento por IA"
        >
          <SparklesIcon class="w-3.5 h-3.5" />
          <span>Upload & IA (Admin)</span>
        </NuxtLink>

        <button
          @click="fetchGraph"
          class="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-divider text-textSecondary hover:text-textPrimary transition-all"
          title="Recarregar Grafo"
        >
          <RotateCwIcon class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </header>

    <!-- Área Principal do Canvas -->
    <main class="flex-1 relative w-full h-full overflow-hidden">
      <!-- Loading State -->
      <div v-if="loading && (!graphData.nodes || graphData.nodes.length === 0)" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-bgApp/90">
        <div class="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin mb-4"></div>
        <p class="text-xs font-technical text-textSecondary uppercase tracking-widest">Carregando Conexões...</p>
      </div>

      <!-- Canvas D3 Interativo -->
      <GraphCanvas
        :nodes="graphData.nodes || []"
        :edges="graphData.edges || []"
        :selected-node-id="selectedNode?.id"
        @select-node="handleSelectNode"
        @open-create-node="isCreateModalOpen = true"
        @open-connect-modal="isConnectModalOpen = true"
      />

      <!-- 1. Canvas Overlay Deslizante do Tema (Carrossel Horizontal de Livros + Feed de Anotações) -->
      <ThemeCanvasOverlay
        :is-open="isThemeOverlayOpen"
        :theme="selectedThemeNode"
        @close="isThemeOverlayOpen = false"
        @select-book="handleBookSelectedFromTheme"
      />

      <!-- 2. Drawer Lateral de Anotações do Livro (Feed de Anotações + Criação de Anotações Soltas) -->
      <BookAnnotationsDrawer
        :is-open="isBookDrawerOpen"
        :book="selectedBookNode"
        @close="isBookDrawerOpen = false"
      />
    </main>

    <!-- Modais Auxiliares -->
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
import { ref, onMounted } from 'vue'
import { NetworkIcon, RotateCwIcon, SparklesIcon } from 'lucide-vue-next'
import type { GraphNode, BookItem } from '~/interfaces/graph'
import { useGraph } from '~/composables/useGraph'

import GraphCanvas from '~/components/GraphCanvas.vue'
import ThemeCanvasOverlay from '~/components/graph/ThemeCanvasOverlay.vue'
import BookAnnotationsDrawer from '~/components/graph/BookAnnotationsDrawer.vue'
import CreateNodeModal from '~/components/CreateNodeModal.vue'
import ConnectNodesModal from '~/components/ConnectNodesModal.vue'

const { graphData, loading, fetchGraph, createNode, createConnection } = useGraph()

const selectedNode = ref<GraphNode | null>(null)
const selectedThemeNode = ref<GraphNode | null>(null)
const selectedBookNode = ref<GraphNode | null>(null)

const isThemeOverlayOpen = ref(false)
const isBookDrawerOpen = ref(false)
const isCreateModalOpen = ref(false)
const isConnectModalOpen = ref(false)

const handleSelectNode = (node: GraphNode) => {
  selectedNode.value = node

  if (node.type === 'book') {
    selectedBookNode.value = node
    isBookDrawerOpen.value = true
    isThemeOverlayOpen.value = false
  } else if (node.type === 'theme' && !node.isRoot) {
    selectedThemeNode.value = node
    isThemeOverlayOpen.value = true
    isBookDrawerOpen.value = false
  }
}

const handleBookSelectedFromTheme = (book: BookItem) => {
  isThemeOverlayOpen.value = false
  selectedBookNode.value = {
    id: `book-${book.id}`,
    rawId: book.id,
    type: 'book',
    name: book.title,
    fullTitle: book.title,
    author: book.author,
    summary: book.summary,
    coverPath: book.coverPath,
    filePath: book.filePath,
  }
  isBookDrawerOpen.value = true
}

const handleCreateNode = async (payload: { name: string; color: string; description: string }) => {
  await createNode(payload.name, payload.color, payload.description)
}

const handleConnectNodes = async (payload: { sourceId: number; targetId: number }) => {
  await createConnection(payload.sourceId, payload.targetId)
}

onMounted(() => {
  fetchGraph()
})
</script>
