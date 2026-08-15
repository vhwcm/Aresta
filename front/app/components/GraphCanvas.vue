<template>
  <div class="relative w-full h-full overflow-hidden bg-bgApp select-none" ref="containerRef">
    <!-- Overlay de Grid de Fundo -->
    <div class="absolute inset-0 bg-grid-pattern bg-grid-size opacity-15 pointer-events-none"></div>

    <!-- Canvas D3 / SVG do Grafo -->
    <svg ref="svgRef" class="w-full h-full cursor-grab active:cursor-grabbing">
      <g ref="gRef">
        <!-- Links/Arestas -->
        <g class="links-group"></g>
        <!-- Nós/Temas -->
        <g class="nodes-group"></g>
      </g>
    </svg>

    <!-- Toolbar Flutuante de Controles Superiores -->
    <div
      class="absolute z-10 flex items-center gap-2 bg-bgPanel/80 backdrop-blur-md border border-divider p-2 rounded-2xl shadow-2xl max-w-[calc(100%-1.5rem)] flex-wrap"
      :class="isCompact ? 'top-3 left-3 right-3 justify-between' : 'top-6 left-6'"
    >
      <!-- Campo de Busca -->
      <div class="relative flex items-center flex-1 min-w-[100px]">
        <SearchIcon class="w-3.5 h-3.5 text-textSecondary absolute left-2.5 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar tema ou livro..."
          class="bg-bgApp/60 border border-divider/60 rounded-xl pl-8 pr-2 py-1 text-xs text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent w-full transition-all"
        />
      </div>

      <div v-if="!isCompact" class="h-4 w-px bg-divider"></div>

      <!-- Botão Novo Tema -->
      <button
        @click="$emit('openCreateNode')"
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-all shadow-md active:scale-95 shrink-0"
        title="Criar Novo Tema"
      >
        <PlusIcon class="w-3.5 h-3.5" />
        <span :class="{ 'hidden sm:inline': isCompact }">Novo Tema</span>
      </button>

      <!-- Botão Conectar Nós -->
      <button
        @click="$emit('openConnectModal')"
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-divider text-textPrimary text-xs hover:bg-white/10 transition-all active:scale-95 shrink-0"
        title="Criar conexão entre temas"
      >
        <LinkIcon class="w-3.5 h-3.5 text-accent" />
        <span :class="{ 'hidden sm:inline': isCompact }">Conectar</span>
      </button>
    </div>

    <!-- Toolbar Flutuante de Zoom & Física no Canto Inferior -->
    <div
      class="absolute z-10 flex items-center gap-1.5 bg-bgPanel/80 backdrop-blur-md border border-divider rounded-2xl shadow-xl"
      :class="isCompact ? 'bottom-3 left-3 p-1.5 scale-90 origin-bottom-left' : 'bottom-6 left-6 p-2'"
    >
      <button @click="zoomIn" class="p-1.5 rounded-xl text-textSecondary hover:text-white hover:bg-white/10 transition-all" title="Aumentar Zoom">
        <ZoomInIcon class="w-3.5 h-3.5" />
      </button>
      <button @click="zoomOut" class="p-1.5 rounded-xl text-textSecondary hover:text-white hover:bg-white/10 transition-all" title="Diminuir Zoom">
        <ZoomOutIcon class="w-3.5 h-3.5" />
      </button>
      <button @click="resetZoom" class="p-1.5 rounded-xl text-textSecondary hover:text-white hover:bg-white/10 transition-all" title="Centralizar Grafo">
        <MaximizeIcon class="w-3.5 h-3.5" />
      </button>
      <div class="h-3 w-px bg-divider mx-0.5"></div>
      <button @click="togglePhysics" class="p-1.5 rounded-xl transition-all" :class="isPhysicsPaused ? 'text-rose-400 bg-rose-500/10' : 'text-emerald-400 hover:bg-white/10'" :title="isPhysicsPaused ? 'Reativar Física' : 'Pausar Física'">
        <PlayIcon v-if="isPhysicsPaused" class="w-3.5 h-3.5" />
        <PauseIcon v-else class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Indicador de Estatísticas de Nós -->
    <div
      class="absolute z-10 flex items-center gap-2 bg-bgPanel/80 backdrop-blur-md border border-divider rounded-2xl font-technical text-textSecondary shadow-xl"
      :class="isCompact ? 'bottom-3 right-3 px-2.5 py-1 text-[10px]' : 'bottom-6 right-6 px-4 py-2 text-xs'"
    >
      <div class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
        <span>{{ nodes.length }} Nós</span>
      </div>
      <div class="h-3 w-px bg-divider"></div>
      <div>{{ edges.length }} Arestas</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import * as d3 from 'd3'
import type { GraphNode, GraphEdge } from '~/interfaces/graph'
import { PlusIcon, SearchIcon, LinkIcon, ZoomInIcon, ZoomOutIcon, MaximizeIcon, PlayIcon, PauseIcon } from 'lucide-vue-next'

const props = defineProps<{
  nodes: GraphNode[]
  edges: GraphEdge[]
  selectedNodeId?: number | null
  isCompact?: boolean
}>()

const emit = defineEmits<{
  (e: 'selectNode', node: GraphNode): void
  (e: 'openCreateNode'): void
  (e: 'openConnectModal'): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
const gRef = ref<SVGGElement | null>(null)

const searchQuery = ref('')
const isPhysicsPaused = ref(false)

let simulation: d3.Simulation<any, any> | null = null
let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null

const getNodeRadius = (node: GraphNode) => {
  if (node.isRoot || node.id === -999) return 36
  const count = node.books?.length || 0
  return Math.min(18 + count * 6, 42)
}

const initGraph = () => {
  if (!svgRef.value || !gRef.value || !containerRef.value) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  const svg = d3.select(svgRef.value)
  const g = d3.select(gRef.value)

  // Configurar Zoom
  zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })

  svg.call(zoomBehavior as any).on('dblclick.zoom', null)

  // 1. Nó Central de Origem (Meu Conhecimento)
  const rootNode: GraphNode = {
    id: -999,
    name: 'Meu Conhecimento',
    color: '#E57B55',
    description: 'Nó central agregador do seu universo de leitura',
    books: [],
    isRoot: true,
    x: width / 2,
    y: height / 2,
    fx: width / 2,
    fy: height / 2
  }

  // Copiar dados para simulação
  const themeNodes = props.nodes.map(n => ({ ...n }))
  const simulationNodes = [rootNode, ...themeNodes]
  const nodeMap = new Map(simulationNodes.map(n => [n.id, n]))

  // 2. Links explícitos entre temas
  const themeLinks = props.edges
    .map(e => {
      const sourceId = typeof e.source === 'object' ? e.source.id : e.source
      const targetId = typeof e.target === 'object' ? e.target.id : e.target
      return {
        id: `theme-edge-${e.id}`,
        source: nodeMap.get(sourceId),
        target: nodeMap.get(targetId),
        isRootEdge: false
      }
    })
    .filter(link => link.source && link.target)

  // 3. Links radiais conectando o Nó Central aos nós de temas principais
  const rootLinks = themeNodes.map(node => ({
    id: `root-edge-${node.id}`,
    source: rootNode,
    target: nodeMap.get(node.id),
    isRootEdge: true
  })).filter(link => link.target)

  const simulationLinks = [...rootLinks, ...themeLinks]

  // Criar Simulação de Forças D3 (Estilo Obsidian)
  simulation = d3.forceSimulation(simulationNodes)
    .force('link', d3.forceLink(simulationLinks).id((d: any) => d.id).distance((d: any) => d.isRootEdge ? 180 : 130))
    .force('charge', d3.forceManyBody().strength(-450))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide().radius((d: any) => getNodeRadius(d) + 22))

  // Renderizar Links (Arestas)
  const linkGroup = g.select('.links-group')
  const links = linkGroup.selectAll<SVGLineElement, any>('line')
    .data(simulationLinks, (d: any) => d.id)
    .join('line')
    .attr('stroke', (d: any) => d.isRootEdge ? 'rgba(229, 123, 85, 0.35)' : 'rgba(255, 255, 255, 0.15)')
    .attr('stroke-width', (d: any) => d.isRootEdge ? 2.5 : 1.5)
    .attr('stroke-dasharray', (d: any) => d.isRootEdge ? '6 3' : '4 2')

  // Renderizar Nós
  const nodeGroup = g.select('.nodes-group')
  const nodesSelection = nodeGroup.selectAll<SVGGElement, any>('g.node')
    .data(simulationNodes, (d: any) => d.id)
    .join('g')
    .attr('class', 'node cursor-pointer')
    .call(d3.drag<SVGGElement, any>()
      .on('start', (event, d) => {
        if (!event.active && simulation) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (event, d) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on('end', (event, d) => {
        if (!event.active && simulation) simulation.alphaTarget(0)
        if (!d.isRoot) {
          d.fx = null
          d.fy = null
        }
      })
    )

  nodesSelection.html('') // Limpar anterior

  // Círculo com efeito Glow de fundo (com cor dourada/accent para a raiz)
  nodesSelection.append('circle')
    .attr('r', (d: any) => getNodeRadius(d) + (d.isRoot ? 10 : 6))
    .attr('fill', (d: any) => d.isRoot ? '#E57B55' : (d.color || '#E57B55'))
    .attr('opacity', (d: any) => d.isRoot ? 0.35 : 0.15)
    .attr('class', 'transition-all duration-300')

  // Círculo principal do nó
  nodesSelection.append('circle')
    .attr('r', (d: any) => getNodeRadius(d))
    .attr('fill', (d: any) => d.isRoot ? '#2A1A14' : '#141416')
    .attr('stroke', (d: any) => d.isRoot ? '#E57B55' : (d.color || '#E57B55'))
    .attr('stroke-width', (d: any) => d.isRoot ? 4 : 2.5)
    .attr('class', 'transition-all duration-300 shadow-2xl')

  // Ícone/Texto do centro do nó
  nodesSelection.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('fill', '#FFFFFF')
    .attr('font-size', (d: any) => d.isRoot ? '16px' : '10px')
    .attr('font-weight', 'bold')
    .attr('pointer-events', 'none')
    .text((d: any) => d.isRoot ? '🧠' : (d.books?.length ? `${d.books.length}📚` : ''))

  // Rótulo/Nome do nó
  nodesSelection.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', (d: any) => getNodeRadius(d) + 18)
    .attr('fill', (d: any) => d.isRoot ? '#F59E0B' : '#E2E8F0')
    .attr('font-size', (d: any) => d.isRoot ? '13px' : '12px')
    .attr('font-weight', (d: any) => d.isRoot ? '800' : '600')
    .attr('font-family', 'sans-serif')
    .attr('pointer-events', 'none')
    .text((d: any) => d.name)

  // Evento de Clique no Nó
  nodesSelection.on('click', (event, d) => {
    event.stopPropagation()
    if (d.isRoot) {
      emit('selectNode', rootNode)
    } else {
      const originalNode = props.nodes.find(n => n.id === d.id)
      if (originalNode) {
        emit('selectNode', originalNode)
      }
    }
  })

  // Evento de Destaque no Hover
  nodesSelection.on('mouseenter', (event, d) => {
    links.attr('stroke', (l: any) => (l.source.id === d.id || l.target.id === d.id) ? (d.color || '#E57B55') : 'rgba(255, 255, 255, 0.08)')
      .attr('stroke-width', (l: any) => (l.source.id === d.id || l.target.id === d.id) ? 3.5 : 1.5)
  }).on('mouseleave', () => {
    links.attr('stroke', (d: any) => d.isRootEdge ? 'rgba(229, 123, 85, 0.35)' : 'rgba(255, 255, 255, 0.15)')
      .attr('stroke-width', (d: any) => d.isRootEdge ? 2.5 : 1.5)
  })

  // Atualização em cada Tick de simulação física
  simulation.on('tick', () => {
    links
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y)

    nodesSelection.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
  })
}

// Funções de zoom
const zoomIn = () => {
  if (!svgRef.value || !zoomBehavior) return
  d3.select(svgRef.value).transition().duration(300).call(zoomBehavior.scaleBy as any, 1.3)
}

const zoomOut = () => {
  if (!svgRef.value || !zoomBehavior) return
  d3.select(svgRef.value).transition().duration(300).call(zoomBehavior.scaleBy as any, 0.7)
}

const resetZoom = () => {
  if (!svgRef.value || !zoomBehavior) return
  d3.select(svgRef.value).transition().duration(500).call(zoomBehavior.transform as any, d3.zoomIdentity)
}

const togglePhysics = () => {
  if (!simulation) return
  isPhysicsPaused.value = !isPhysicsPaused.value
  if (isPhysicsPaused.value) {
    simulation.stop()
  } else {
    simulation.alpha(0.3).restart()
  }
}

let resizeObserver: ResizeObserver | null = null

watch(() => [props.nodes, props.edges], () => {
  initGraph()
}, { deep: true })

onMounted(() => {
  initGraph()
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      if (simulation && containerRef.value) {
        const width = containerRef.value.clientWidth
        const height = containerRef.value.clientHeight
        simulation.force('center', d3.forceCenter(width / 2, height / 2))
        simulation.alpha(0.2).restart()
      }
    })
    resizeObserver.observe(containerRef.value)
  }
})

onBeforeUnmount(() => {
  if (simulation) simulation.stop()
  if (resizeObserver) resizeObserver.disconnect()
})
</script>
