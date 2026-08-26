<template>
  <div class="h-full w-full flex flex-col relative overflow-hidden bg-bgApp text-textPrimary">
    <!-- Cabeçalho do Módulo de Grafo -->
    <header class="shrink-0 px-8 py-4 border-b border-divider/60 bg-bgPanel/40 backdrop-blur-sm flex items-center justify-between z-10">
      <div>
        <div class="flex items-center gap-2">
          <NetworkIcon class="w-5 h-5 text-accent" />
          <h1 class="text-xl font-bold font-interface tracking-tight">Mapa Mental & Grafo de Leitura</h1>
        </div>
        <p class="text-xs text-textSecondary font-light mt-0.5">
          Conexões semânticas criadas automaticamente a partir dos livros que você lê e edições manuais.
        </p>
      </div>

      <div class="flex items-center gap-3">
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

      <!-- Drawer de Detalhes do Nó -->
      <NodeDrawer
        :node="selectedNode"
        :all-user-books="userBooks"
        @close="selectedNode = null"
        @update-node="handleUpdateNode"
        @delete-node="handleDeleteNode"
        @link-book="handleLinkBook"
        @unlink-book="handleUnlinkBook"
      />
    </main>

    <!-- Modais -->
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
import { NetworkIcon, RotateCwIcon } from 'lucide-vue-next'
import type { GraphNode } from '~/interfaces/graph'
import { useGraph } from '~/composables/useGraph'
import { useUserBooks } from '~/composables/useUserBooks'

import GraphCanvas from '~/components/GraphCanvas.vue'
import NodeDrawer from '~/components/NodeDrawer.vue'
import CreateNodeModal from '~/components/CreateNodeModal.vue'
import ConnectNodesModal from '~/components/ConnectNodesModal.vue'

const { graphData, loading, fetchGraph, createNode, updateNode, deleteNode, createConnection, linkBookToNode, unlinkBookFromNode } = useGraph()
const { userBooks, fetchUserBooks } = useUserBooks()

const selectedNode = ref<GraphNode | null>(null)
const isCreateModalOpen = ref(false)
const isConnectModalOpen = ref(false)

const handleSelectNode = (node: GraphNode) => {
  selectedNode.value = node
}

const handleCreateNode = async (payload: { name: string, color: string, description: string }) => {
  await createNode(payload.name, payload.color, payload.description)
}

const handleUpdateNode = async (payload: { id: number, name: string, color: string, description: string }) => {
  await updateNode(payload.id, payload.name, payload.color, payload.description)
  if (selectedNode.value && selectedNode.value.id === payload.id) {
    selectedNode.value = { ...selectedNode.value, ...payload }
  }
}

const handleDeleteNode = async (id: number) => {
  await deleteNode(id)
  selectedNode.value = null
}

const handleConnectNodes = async (payload: { sourceId: number, targetId: number }) => {
  await createConnection(payload.sourceId, payload.targetId)
}

const handleLinkBook = async (payload: { nodeId: number, userBookId: number }) => {
  await linkBookToNode(payload.nodeId, payload.userBookId)
  // Atualizar selectedNode
  if (selectedNode.value) {
    const updatedNode = graphData.value.nodes.find(n => n.id === payload.nodeId)
    if (updatedNode) selectedNode.value = updatedNode
  }
}

const handleUnlinkBook = async (payload: { nodeId: number, userBookId: number }) => {
  await unlinkBookFromNode(payload.nodeId, payload.userBookId)
  if (selectedNode.value) {
    const updatedNode = graphData.value.nodes.find(n => n.id === payload.nodeId)
    if (updatedNode) selectedNode.value = updatedNode
  }
}

onMounted(() => {
  fetchGraph()
  fetchUserBooks()
})
</script>
