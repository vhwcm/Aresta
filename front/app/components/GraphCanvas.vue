<template>
  <div class="relative w-full h-full overflow-hidden bg-transparent select-none" ref="containerRef">
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
      class="absolute z-10 flex items-center gap-2 bg-bgPanel/80 backdrop-blur-md border border-divider p-2.5 rounded-2xl shadow-2xl max-w-[calc(100%-1.5rem)] flex-wrap"
      :class="isCompact ? 'top-3 left-3 right-3 justify-between' : 'top-6 left-6'"
    >
      <!-- Campo de Busca -->
      <div class="relative flex items-center flex-1 min-w-[110px]">
        <SearchIcon class="w-4 h-4 text-textSecondary absolute left-3 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar tema ou livro..."
          class="bg-bgApp/60 border border-divider/60 rounded-xl pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:border-accent w-full transition-all"
        />
      </div>

      <div v-if="!isCompact" class="h-5 w-px bg-divider"></div>

      <!-- Botão Novo Tema -->
      <button
        @click="$emit('openCreateNode')"
        class="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-accent text-white text-xs sm:text-sm font-semibold hover:bg-accent/90 transition-all shadow-md active:scale-95 shrink-0"
        title="Criar Novo Tema"
      >
        <PlusIcon class="w-4 h-4" />
        <span :class="{ 'hidden sm:inline': isCompact }">Novo Tema</span>
      </button>

      <!-- Botão Conectar Nós -->
      <button
        @click="$emit('openConnectModal')"
        class="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white/5 border border-divider text-textPrimary text-xs sm:text-sm hover:bg-white/10 transition-all active:scale-95 shrink-0"
        title="Criar conexão entre temas"
      >
        <LinkIcon class="w-4 h-4 text-accent" />
        <span :class="{ 'hidden sm:inline': isCompact }">Conectar</span>
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import * as d3 from 'd3'
import type { GraphNode, GraphEdge } from '~/interfaces/graph'
import { PlusIcon, SearchIcon, LinkIcon } from 'lucide-vue-next'
import { useSettings } from '~/composables/useSettings'

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

const { themeMode } = useSettings()
const isLightMode = computed(() => themeMode.value === 'light')

const containerRef = ref<HTMLElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
const gRef = ref<SVGGElement | null>(null)

const searchQuery = ref('')

let simulation: d3.Simulation<any, any> | null = null
let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null

// Helpers de cores pastéis e suaves (Low Dopamine)
const getPastelFill = (colorHex?: string, isRoot = false) => {
  const baseColor = colorHex || (isRoot ? '#E57B55' : '#64748B')
  const neutral = isLightMode.value ? '#FFFFFF' : '#161619'
  return d3.interpolateRgb(neutral, baseColor)(isRoot ? 0.35 : 0.25)
}

const getPastelStroke = (colorHex?: string, isRoot = false) => {
  const baseColor = colorHex || (isRoot ? '#E57B55' : '#64748B')
  const neutral = isLightMode.value ? '#CBD5E1' : '#161619'
  return d3.interpolateRgb(neutral, baseColor)(isRoot ? 0.85 : 0.70)
}

const getNodeRadius = (node: GraphNode) => {
  if (node.isRoot || node.id === -999) return 36
  const count = node.books?.length || 0
  return Math.min(22 + count * 4, 40)
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
    .force('charge', d3.forceManyBody().strength(-460))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide().radius((d: any) => getNodeRadius(d) + 24))

  // Renderizar Links (Arestas) Contínuas (Solid lines)
  const linkGroup = g.select('.links-group')
  const links = linkGroup.selectAll<SVGLineElement, any>('line')
    .data(simulationLinks, (d: any) => d.id)
    .join('line')
    .attr('stroke', (d: any) => d.isRootEdge ? (isLightMode.value ? 'rgba(229, 123, 85, 0.45)' : 'rgba(229, 123, 85, 0.35)') : (isLightMode.value ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.12)'))
    .attr('stroke-width', (d: any) => d.isRootEdge ? 1.6 : 1.2)
    .attr('stroke-opacity', 1)

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

  // Círculo com efeito sutil de ambient ring (low-dopamine)
  nodesSelection.append('circle')
    .attr('r', (d: any) => getNodeRadius(d) + 5)
    .attr('fill', (d: any) => getPastelFill(d.color, d.isRoot))
    .attr('opacity', 0.16)
    .attr('class', 'transition-all duration-300')

  // Círculo principal do nó (cor de fundo pastel e borda fina delicada)
  nodesSelection.append('circle')
    .attr('r', (d: any) => getNodeRadius(d))
    .attr('fill', (d: any) => getPastelFill(d.color, d.isRoot))
    .attr('stroke', (d: any) => getPastelStroke(d.color, d.isRoot))
    .attr('stroke-width', (d: any) => d.isRoot ? 2 : 1.4)
    .attr('class', 'transition-all duration-300 shadow-lg')

  // Ícone 2D Vetorial Clean para o Nó Raiz (Cérebro / Conhecimento)
  const rootNodesSelection = nodesSelection.filter((d: any) => d.isRoot)
  const rootIconGroup = rootNodesSelection.append('g')
    .attr('transform', 'translate(-10.5, -10.5)')
    .attr('pointer-events', 'none')

  rootIconGroup.append('path')
    .attr('d', 'M12 18V5 M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4 M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5 M17.997 5.125a4 4 0 0 1 2.526 5.77 M18 18a4 4 0 0 0 2-7.464 M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517 M6 18a4 4 0 0 1-2-7.464 M6.003 5.125a4 4 0 0 0-2.526 5.77')
    .attr('fill', 'none')
    .attr('stroke', isLightMode.value ? '#C2410C' : '#FFFFFF')
    .attr('stroke-width', '1.6')
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round')
    .attr('transform', 'scale(0.9)')

  // Ícone 2D e Contagem para Nós de Temas
  const themeNodesSelection = nodesSelection.filter((d: any) => !d.isRoot)
  themeNodesSelection.each(function(d: any) {
    const nodeEl = d3.select(this)
    const bookCount = d.books?.length || 0

    const iconG = nodeEl.append('g')
      .attr('pointer-events', 'none')
      .attr('class', 'theme-icon-group')

    if (bookCount > 0) {
      // Ícone 2D de Livro Aberto + Contagem
      iconG.append('path')
        .attr('d', 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z')
        .attr('fill', 'none')
        .attr('stroke', isLightMode.value ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)')
        .attr('stroke-width', '1.5')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('transform', 'translate(-13, -7.5) scale(0.62)')

      iconG.append('text')
        .attr('x', 4)
        .attr('y', 4)
        .attr('font-size', '11.5px')
        .attr('font-weight', '600')
        .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
        .attr('fill', isLightMode.value ? '#1E293B' : 'rgba(255, 255, 255, 0.92)')
        .text(bookCount)
    } else {
      // Ícone 2D sutil para tema sem livros vinculados
      iconG.append('path')
        .attr('d', 'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20')
        .attr('fill', 'none')
        .attr('stroke', isLightMode.value ? 'rgba(30, 41, 59, 0.75)' : 'rgba(255, 255, 255, 0.55)')
        .attr('stroke-width', '1.5')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('transform', 'translate(-7, -7.5) scale(0.62)')
    }
  })

  // Rótulo/Nome do nó
  nodesSelection.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', (d: any) => getNodeRadius(d) + 18)
    .attr('fill', (d: any) => d.isRoot ? (isLightMode.value ? '#9A3412' : '#F59E0B') : (isLightMode.value ? '#1E293B' : '#E2E8F0'))
    .attr('font-size', (d: any) => d.isRoot ? '13.5px' : '12px')
    .attr('font-weight', '600')
    .attr('font-family', 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')
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
    links
      .attr('stroke', (l: any) => (l.source.id === d.id || l.target.id === d.id) ? (d.color || '#E57B55') : (isLightMode.value ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)'))
      .attr('stroke-width', (l: any) => (l.source.id === d.id || l.target.id === d.id) ? 2 : 1)
      .attr('stroke-opacity', (l: any) => (l.source.id === d.id || l.target.id === d.id) ? 0.9 : 0.25)
  }).on('mouseleave', () => {
    links
      .attr('stroke', (d: any) => d.isRootEdge ? 'rgba(229, 123, 85, 0.35)' : (isLightMode.value ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)'))
      .attr('stroke-width', (d: any) => d.isRootEdge ? 1.5 : 1.2)
      .attr('stroke-opacity', 1)
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


let resizeObserver: ResizeObserver | null = null

watch(() => [props.nodes, props.edges], () => {
  initGraph()
}, { deep: true })

watch(themeMode, () => {
  initGraph()
})

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
