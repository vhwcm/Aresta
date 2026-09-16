<template>
  <div
    data-testid="home-knowledge-graph-demo"
    class="w-full rounded-3xl bg-bgPanel border border-divider shadow-xl p-4 sm:p-7 flex flex-col gap-5 relative overflow-hidden backdrop-blur-xl group hover:border-accent/40 transition-all duration-500"
  >
    <!-- Topo da Seção de Demonstração -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-divider/60">
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-accent animate-pulse"></div>
          <span class="font-technical text-xs uppercase tracking-widest text-accent font-semibold">
            Demonstração Interativa
          </span>
        </div>
        <h3 class="font-editorial text-2xl sm:text-3xl font-light text-textPrimary">
          Grafo de Conhecimento Conectado
        </h3>
        <p class="font-interface text-xs sm:text-sm text-textSecondary max-w-xl">
          Arraste os nós, aplique zoom e clique em qualquer tema para ver como o Aresta mapeia relações entre livros, autores e teses conceituais.
        </p>
      </div>

      <!-- Filtros Rápidos de Categoria -->
      <div class="flex items-center gap-1.5 flex-wrap sm:self-center">
        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="activeCategory = cat.id"
          :data-testid="`filter-cat-${cat.id}`"
          class="px-3 py-1.5 rounded-xl font-technical text-xs transition-all cursor-pointer border"
          :class="activeCategory === cat.id ? 'bg-accent text-white border-accent shadow-sm' : 'bg-black/5 dark:bg-white/5 border-divider text-textSecondary hover:text-textPrimary hover:bg-black/10 dark:hover:bg-white/10'"
        >
          {{ cat.label }}
        </button>
      </div>
    </div>

    <!-- Container do Grafo Interativo Real (GraphCanvas) + Painel Lateral de Detalhes -->
    <div class="relative w-full h-[450px] sm:h-[540px] rounded-2xl overflow-hidden bg-black/[0.02] dark:bg-black/40 border border-divider flex flex-col md:flex-row">
      <!-- Canvas D3 Real do Aresta -->
      <div class="relative flex-1 h-full select-none overflow-hidden" ref="graphContainerRef">
        <GraphCanvas
          :nodes="visibleNodes"
          :edges="visibleEdges"
          :selectedNodeId="selectedNode?.id"
          :isCompact="false"
          :showControls="true"
          :showSearch="true"
          @selectNode="handleSelectNode"
          @openCreateNode="showAuthModal = true"
          @openConnectModal="showAuthModal = true"
          @connectNodes="handleConnectNodes"
        />

        <!-- Dica de Interação Flutuante no Topo Esquerdo -->
        <div class="absolute bottom-4 right-4 pointer-events-none z-10 bg-bgPanel/90 backdrop-blur-md border border-divider px-3 py-1.5 rounded-xl font-technical text-[10px] text-textSecondary flex items-center gap-1.5 shadow-sm">
          <SparklesIcon class="w-3 h-3 text-accent" />
          <span>Física D3 em tempo real · Arraste e conecte os nós</span>
        </div>
      </div>

      <!-- Painel Lateral de Inspeção do Nó Selecionado -->
      <div
        v-if="selectedNode"
        data-testid="selected-node-panel"
        class="w-full md:w-80 border-t md:border-t-0 md:border-l border-divider/80 bg-bgPanel/95 backdrop-blur-xl p-4 sm:p-5 flex flex-col justify-between gap-4 z-20 animate-fadeIn overflow-y-auto max-h-[260px] md:max-h-full"
      >
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span
                class="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                :style="{ backgroundColor: selectedNode.color || '#E57B55' }"
              ></span>
              <span class="font-technical text-[10px] uppercase tracking-wider text-accent font-semibold">
                {{ selectedNode.type === 'book' ? 'Livro' : (selectedNode.type === 'note' ? 'Nota' : (selectedNode.type === 'canvas' ? 'Quadro' : 'Tema')) }}
              </span>
            </div>
            <button
              @click="selectedNode = null"
              class="text-textSecondary hover:text-textPrimary p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Fechar painel"
              aria-label="Fechar painel"
            >
              <XIcon class="w-4 h-4" />
            </button>
          </div>

          <div>
            <h4 class="font-editorial text-lg sm:text-xl font-light text-textPrimary leading-snug">
              {{ selectedNode.name }}
            </h4>
            <p class="font-interface text-xs text-textSecondary leading-relaxed mt-1">
              {{ selectedNode.summary || selectedNode.description || 'Conceito mapeado no Grafo de Conhecimento do Aresta.' }}
            </p>
          </div>

          <!-- Metadados de Livro / Autor se aplicável -->
          <div v-if="selectedNode.author" class="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-divider/60 flex flex-col gap-1">
            <span class="font-technical text-[10px] uppercase tracking-wider text-accent font-semibold">Autor da Obra</span>
            <span class="font-interface text-xs text-textPrimary font-medium">{{ selectedNode.author }}</span>
          </div>

          <!-- Tags se aplicável -->
          <div v-if="selectedNode.tags && selectedNode.tags.length" class="flex flex-wrap gap-1.5 pt-1">
            <span
              v-for="tag in selectedNode.tags"
              :key="tag"
              class="px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-[10px] font-technical text-accent"
            >
              #{{ tag }}
            </span>
          </div>
        </div>

        <!-- Botão de Ação -->
        <NuxtLink
          to="/login?redirect=%2Fcanvas"
          class="w-full py-2.5 rounded-xl bg-accent text-white font-interface text-xs font-semibold hover:bg-accent/90 transition-all flex items-center justify-center gap-2 shadow-md shadow-accent/20 cursor-pointer"
        >
          <span>Abrir no Grafo Completo</span>
          <ArrowRightIcon class="w-3.5 h-3.5" />
        </NuxtLink>
      </div>

      <!-- Estado Quando Nenhum Nó Está Selecionado (Desktop) -->
      <div
        v-else
        class="hidden md:flex md:w-72 border-l border-divider/80 bg-bgPanel/60 dark:bg-black/20 p-5 flex-col justify-between text-left"
      >
        <div class="flex flex-col gap-3">
          <div class="font-technical text-[10px] uppercase tracking-widest text-textSecondary font-semibold flex items-center gap-2">
            <NetworkIcon class="w-3.5 h-3.5 text-accent" />
            <span>Navegador Conceitual</span>
          </div>

          <h4 class="font-editorial text-base text-textPrimary leading-snug">
            Selecione qualquer nó no grafo
          </h4>
          <p class="font-interface text-xs text-textSecondary leading-relaxed">
            Cada vértice representa um nó conceitual criado durante sua leitura. Conexões automáticas e manuais estruturam um mapa mental contínuo.
          </p>

          <div class="flex flex-col gap-2 pt-2 text-[11px] font-technical text-textSecondary">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-[#E57B55]"></span>
              <span class="text-textPrimary/80">Neurociência & Memória</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
              <span class="text-textPrimary/80">Modelos Mentais</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-[#10B981]"></span>
              <span class="text-textPrimary/80">Literatura & Filosofia</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-[#8B5CF6]"></span>
              <span class="text-textPrimary/80">Leitura Ativa & Sintópica</span>
            </div>
          </div>
        </div>

        <NuxtLink
          to="/login?redirect=%2Fcanvas"
          class="inline-flex items-center justify-between text-xs text-accent font-interface hover:underline pt-3 border-t border-divider/60"
        >
          <span>Explorar no Espaço de Notas</span>
          <ArrowRightIcon class="w-3.5 h-3.5" />
        </NuxtLink>
      </div>
    </div>

    <!-- Modal Convidativo de Login (Auth Gate para Ações Interativas) -->
    <div
      v-if="showAuthModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      @click.self="showAuthModal = false"
    >
      <div class="w-full max-w-md rounded-3xl bg-bgPanel border border-divider shadow-2xl p-6 sm:p-8 flex flex-col gap-5 text-left relative overflow-hidden animate-in zoom-in-95 duration-200">
        <button
          @click="showAuthModal = false"
          class="absolute top-4 right-4 p-2 rounded-xl text-textSecondary hover:text-textPrimary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title="Fechar"
        >
          <XIcon class="w-4 h-4" />
        </button>

        <div class="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
          <SparklesIcon class="w-6 h-6" />
        </div>

        <div class="flex flex-col gap-1.5">
          <h3 class="font-editorial text-2xl font-light text-textPrimary">
            Construa seu Grafo de Conhecimento
          </h3>
          <p class="font-interface text-xs sm:text-sm text-textSecondary leading-relaxed">
            Faça login com sua conta Google para criar novos temas, conectar notas das suas leituras e sincronizar seu mapa mental permanentemente.
          </p>
        </div>

        <div class="flex flex-col gap-3 pt-2">
          <NuxtLink
            to="/login?redirect=%2Fcanvas"
            class="w-full py-3 px-4 rounded-2xl bg-accent hover:bg-accent/90 text-white font-interface text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20 cursor-pointer"
          >
            <span>Continuar com Google</span>
            <ArrowRightIcon class="w-4 h-4" />
          </NuxtLink>

          <button
            @click="showAuthModal = false"
            class="w-full py-2.5 px-4 rounded-2xl border border-divider hover:bg-black/5 dark:hover:bg-white/5 text-textSecondary hover:text-textPrimary font-interface text-xs transition-colors cursor-pointer"
          >
            Continuar explorando como visitante
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  SparklesIcon,
  XIcon,
  ArrowRightIcon,
  NetworkIcon
} from 'lucide-vue-next'
import GraphCanvas from '~/components/GraphCanvas.vue'
import { sampleLandingNodes, sampleLandingEdges } from '~/data/sampleLandingGraph'
import type { GraphNode } from '~/interfaces/graph'

const graphContainerRef = ref<HTMLElement | null>(null)
const selectedNode = ref<GraphNode | null>(null)
const showAuthModal = ref(false)

const categories = [
  { id: 'all', label: 'Todos os Nós' },
  { id: 'Filosofia', label: 'Filosofia' },
  { id: 'Literatura', label: 'Literatura' },
  { id: 'Psicologia', label: 'Psicologia' }
]

const activeCategory = ref('all')

const visibleNodes = computed(() => {
  if (activeCategory.value === 'all') {
    return sampleLandingNodes
  }

  // Filtragem inteligente por categoria
  if (activeCategory.value === 'Filosofia') {
    return sampleLandingNodes.filter((n) =>
      n.isRoot ||
      n.id === 'theme-3' ||
      n.id === 'theme-2' ||
      n.id === 'book-1' ||
      n.id === 'book-2' ||
      n.id === 'note-2' ||
      n.id === 'canvas-1'
    )
  }

  if (activeCategory.value === 'Literatura') {
    return sampleLandingNodes.filter((n) =>
      n.isRoot ||
      n.id === 'theme-3' ||
      n.id === 'theme-4' ||
      n.id === 'book-1' ||
      n.id === 'book-4' ||
      n.id === 'note-3'
    )
  }

  if (activeCategory.value === 'Psicologia') {
    return sampleLandingNodes.filter((n) =>
      n.isRoot ||
      n.id === 'theme-1' ||
      n.id === 'theme-2' ||
      n.id === 'book-2' ||
      n.id === 'book-3' ||
      n.id === 'note-1' ||
      n.id === 'note-2'
    )
  }

  return sampleLandingNodes
})

const visibleEdges = computed(() => {
  const nodeIds = new Set(visibleNodes.value.map((n) => String(n.id)))
  return sampleLandingEdges.filter((e) => {
    const sId = typeof e.source === 'object' ? String((e.source as any).id) : String(e.source)
    const tId = typeof e.target === 'object' ? String((e.target as any).id) : String(e.target)
    return nodeIds.has(sId) && nodeIds.has(tId)
  })
})

const handleSelectNode = (node: GraphNode) => {
  selectedNode.value = node
}

const handleConnectNodes = (_payload: any) => {
  // A conexão magnética é renderizada pelo GraphCanvas em localCustomEdges.
  // Notificamos suavemente o usuário para salvar na conta
  showAuthModal.value = true
}
</script>
