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
        @connect-nodes="handleDirectConnect"
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

      <!-- 3. Modal de Detalhes da Anotação de Leitura -->
      <div
        v-if="isAnnotationModalOpen && selectedAnnotationNode"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        @click.self="isAnnotationModalOpen = false"
      >
        <div class="w-full max-w-lg rounded-2xl bg-bgPanel border border-divider shadow-2xl p-6 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-xs font-semibold">
                📝 Anotação de Leitura
              </span>
              <span v-if="selectedAnnotationNode.bookTitle" class="text-xs text-textSecondary truncate max-w-[200px]">
                {{ selectedAnnotationNode.bookTitle }}
              </span>
            </div>
            <button
              @click="isAnnotationModalOpen = false"
              class="p-1 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-white/5 transition-all"
            >
              ✕
            </button>
          </div>

          <div v-if="selectedAnnotationNode.chapterTitle" class="text-xs text-textSecondary font-mono">
            Capítulo: {{ selectedAnnotationNode.chapterTitle }}
          </div>

          <blockquote
            v-if="selectedAnnotationNode.selectedText"
            class="p-3.5 rounded-xl bg-bgRoot border-l-4 border-amber-500 text-xs text-textPrimary leading-relaxed italic"
          >
            "{{ selectedAnnotationNode.selectedText }}"
          </blockquote>

          <div v-if="selectedAnnotationNode.note" class="text-xs text-textPrimary/90 leading-relaxed font-light">
            <span class="font-semibold text-accent block mb-1">Nota pessoal:</span>
            {{ selectedAnnotationNode.note }}
          </div>

          <div class="flex items-center justify-end gap-3 mt-2 pt-3 border-t border-divider">
            <button
              @click="isAnnotationModalOpen = false"
              class="px-4 py-2 rounded-xl border border-divider text-xs text-textSecondary hover:text-textPrimary"
            >
              Fechar
            </button>
            <button
              v-if="selectedAnnotationNode.bookId"
              @click="goToAnnotationBook(selectedAnnotationNode)"
              class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-all flex items-center gap-1.5"
            >
              <BookOpenIcon class="w-3.5 h-3.5" />
              <span>Abrir no Livro</span>
            </button>
          </div>
        </div>
      </div>
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
import { NetworkIcon, RotateCwIcon, SparklesIcon, BookOpenIcon } from 'lucide-vue-next'
import type { GraphNode, BookItem } from '~/interfaces/graph'
import { useGraph } from '~/composables/useGraph'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'

import GraphCanvas from '~/components/GraphCanvas.vue'
import ThemeCanvasOverlay from '~/components/graph/ThemeCanvasOverlay.vue'
import BookAnnotationsDrawer from '~/components/graph/BookAnnotationsDrawer.vue'
import CreateNodeModal from '~/components/CreateNodeModal.vue'
import ConnectNodesModal from '~/components/ConnectNodesModal.vue'

const { graphData, loading, fetchGraph, createNode, createConnection, linkBookToNode } = useGraph()

const selectedNode = ref<GraphNode | null>(null)
const selectedThemeNode = ref<GraphNode | null>(null)
const selectedBookNode = ref<GraphNode | null>(null)
const selectedAnnotationNode = ref<GraphNode | null>(null)

const isThemeOverlayOpen = ref(false)
const isBookDrawerOpen = ref(false)
const isAnnotationModalOpen = ref(false)
const isCreateModalOpen = ref(false)
const isConnectModalOpen = ref(false)

const handleSelectNode = (node: GraphNode) => {
  selectedNode.value = node

  if (node.type === 'book') {
    selectedBookNode.value = node
    isBookDrawerOpen.value = true
    isThemeOverlayOpen.value = false
    isAnnotationModalOpen.value = false
  } else if (node.type === 'theme' && !node.isRoot) {
    selectedThemeNode.value = node
    isThemeOverlayOpen.value = true
    isBookDrawerOpen.value = false
    isAnnotationModalOpen.value = false
  } else if (node.type === 'annotation') {
    selectedAnnotationNode.value = node
    isAnnotationModalOpen.value = true
  } else if (node.type === 'note') {
    navigateTo(`/canvas?note=${node.rawId}`)
  } else if (node.type === 'canvas') {
    navigateTo(`/canvas/${node.rawId}`)
  }
}

const goToAnnotationBook = (node: GraphNode) => {
  isAnnotationModalOpen.value = false
  const bookId = node.bookId
  if (!bookId) return
  if (node.cfi) {
    navigateTo(`/reader?bookId=${bookId}&cfi=${encodeURIComponent(node.cfi)}`)
  } else {
    navigateTo(`/reader?bookId=${bookId}`)
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

const handleDirectConnect = async (payload: {
  sourceId: number | string
  targetId: number | string
  sourceRawId?: number | string
  targetRawId?: number | string
  sourceType?: string
  targetType?: string
}) => {
  try {
    const currentNodes = graphData.value?.nodes || []

    const findNode = (id: any, rawId?: any, type?: string) => {
      const strId = String(id)
      const stripped = strId.replace(/^(book-|theme-|note-|canvas-|annotation-)/, '')
      return currentNodes.find((n) => {
        if (String(n.id) === strId || String(n.id) === stripped) return true
        if (rawId !== undefined && rawId !== null && String(n.rawId) === String(rawId)) return true
        if (n.rawId !== undefined && (String(n.rawId) === strId || String(n.rawId) === stripped)) {
          if (!type || n.type === type) return true
        }
        if (type && n.type === type && (String(n.id).endsWith(stripped) || String(n.rawId) === stripped)) {
          return true
        }
        return false
      })
    }

    const sourceNode = findNode(payload.sourceId, payload.sourceRawId, payload.sourceType)
    const targetNode = findNode(payload.targetId, payload.targetRawId, payload.targetType)

    const isSourceBook = (sourceNode?.type === 'book') || payload.sourceType === 'book' || String(payload.sourceId).startsWith('book-')
    const isTargetBook = (targetNode?.type === 'book') || payload.targetType === 'book' || String(payload.targetId).startsWith('book-')
    const isSourceTheme = (sourceNode?.type === 'theme') || payload.sourceType === 'theme' || (!isSourceBook && !String(payload.sourceId).startsWith('note-') && !String(payload.sourceId).startsWith('canvas-'))
    const isTargetTheme = (targetNode?.type === 'theme') || payload.targetType === 'theme' || (!isTargetBook && !String(payload.targetId).startsWith('note-') && !String(payload.targetId).startsWith('canvas-'))

    // Formatar IDs no formato canônico do grafo
    const formattedSourceId = sourceNode ? sourceNode.id : (isSourceBook && !String(payload.sourceId).startsWith('book-') ? `book-${payload.sourceId}` : payload.sourceId)
    const formattedTargetId = targetNode ? targetNode.id : (isTargetBook && !String(payload.targetId).startsWith('book-') ? `book-${payload.targetId}` : payload.targetId)

    // 1. Atualização Otimista Imediata da Aresta no Grafo
    // Adiciona a aresta no mesmo milissegundo: a aresta aparece e o grafo se reorganiza aproximando os nós!
    const optimisticEdgeId = `edge-live-${formattedSourceId}-${formattedTargetId}`
    const existingEdges = graphData.value?.edges || []
    const alreadyConnected = existingEdges.some(
      (e) =>
        (String(e.source) === String(formattedSourceId) && String(e.target) === String(formattedTargetId)) ||
        (String(e.source) === String(formattedTargetId) && String(e.target) === String(formattedSourceId))
    )

    let edgeType = 'theme-hierarchy'
    if (isSourceBook || isTargetBook) edgeType = 'book-theme'

    if (!alreadyConnected) {
      graphData.value = {
        ...graphData.value,
        edges: [
          ...existingEdges,
          {
            id: optimisticEdgeId,
            source: formattedSourceId,
            target: formattedTargetId,
            type: edgeType,
          },
        ],
      }
    }

    // 2. Persistência de Livro com Tema (Local e Remota)
    if (isSourceBook && isTargetTheme) {
      const rawBookId = sourceNode?.rawId ?? payload.sourceRawId ?? Number(String(payload.sourceId).replace('book-', ''))
      const rawThemeId = targetNode?.rawId ?? payload.targetRawId ?? Number(String(payload.targetId).replace('theme-', ''))
      const numBookId = Number(rawBookId)
      const numThemeId = Number(rawThemeId)

      if (!isNaN(numBookId) && !isNaN(numThemeId)) {
        try {
          const localBook = await bookRepo.getById(numBookId)
          if (localBook) {
            const currentThemes = Array.isArray(localBook.themes) ? [...localBook.themes] : []
            if (!currentThemes.includes(numThemeId)) {
              currentThemes.push(numThemeId)
              await bookRepo.save({ ...localBook, themes: currentThemes })
            }
          }
        } catch (e) {
          console.warn('[Grafo] Falha ao salvar tema no bookRepo local:', e)
        }

        try {
          await linkBookToNode(numThemeId, numBookId)
        } catch (apiErr) {
          console.warn('[Grafo] Aviso ao vincular livro na API:', apiErr)
        }
      }
    } else if (isSourceTheme && isTargetBook) {
      const rawThemeId = sourceNode?.rawId ?? payload.sourceRawId ?? Number(String(payload.sourceId).replace('theme-', ''))
      const rawBookId = targetNode?.rawId ?? payload.targetRawId ?? Number(String(payload.targetId).replace('book-', ''))
      const numBookId = Number(rawBookId)
      const numThemeId = Number(rawThemeId)

      if (!isNaN(numBookId) && !isNaN(numThemeId)) {
        try {
          const localBook = await bookRepo.getById(numBookId)
          if (localBook) {
            const currentThemes = Array.isArray(localBook.themes) ? [...localBook.themes] : []
            if (!currentThemes.includes(numThemeId)) {
              currentThemes.push(numThemeId)
              await bookRepo.save({ ...localBook, themes: currentThemes })
            }
          }
        } catch (e) {
          console.warn('[Grafo] Falha ao salvar tema no bookRepo local:', e)
        }

        try {
          await linkBookToNode(numThemeId, numBookId)
        } catch (apiErr) {
          console.warn('[Grafo] Aviso ao vincular livro na API:', apiErr)
        }
      }
    } else {
      const sId = sourceNode?.rawId ?? payload.sourceRawId ?? Number(String(payload.sourceId).replace('theme-', ''))
      const tId = targetNode?.rawId ?? payload.targetRawId ?? Number(String(payload.targetId).replace('theme-', ''))
      const numSId = Number(sId)
      const numTId = Number(tId)
      if (!isNaN(numSId) && !isNaN(numTId)) {
        try {
          await createConnection(numSId, numTId)
        } catch (apiErr) {
          console.warn('[Grafo] Aviso ao criar conexão na API:', apiErr)
        }
      }
    }
  } catch (err) {
    console.error('Falha ao conectar nós diretamente no grafo:', err)
  }
}

onMounted(() => {
  fetchGraph()
})
</script>
