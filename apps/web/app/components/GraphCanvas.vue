<template>
  <div class="relative w-full h-full overflow-hidden bg-transparent select-none" ref="containerRef">
    <!-- Overlay de Grid de Fundo -->
    <div
      class="absolute inset-0 bg-grid-size pointer-events-none transition-opacity duration-300"
      :class="isSepiaMode ? 'opacity-25' : (isLightMode ? 'opacity-20' : 'opacity-15')"
      :style="{
        backgroundImage: isSepiaMode
          ? 'radial-gradient(circle, #786C5E 1.2px, transparent 1.2px)'
          : (isLightMode ? 'radial-gradient(circle, #94a3b8 1.2px, transparent 1.2px)' : 'radial-gradient(circle, #333 1px, transparent 1px)')
      }"
    ></div>

    <!-- Canvas D3 / SVG do Grafo -->
    <svg ref="svgRef" class="w-full h-full cursor-grab active:cursor-grabbing">
      <defs>
        <!-- Filtro para sombra dos nós de livros -->
        <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.25" />
        </filter>
      </defs>
      <g ref="gRef">
        <!-- Links/Arestas -->
        <g class="links-group"></g>
        <!-- Nós/Temas e Livros -->
        <g class="nodes-group"></g>
      </g>
    </svg>

    <!-- Toolbar Flutuante de Controles Superiores -->
    <div
      class="absolute z-10 flex items-center gap-2 backdrop-blur-md border p-2.5 rounded-2xl shadow-2xl max-w-[calc(100%-1.5rem)] flex-wrap transition-colors duration-200"
      :class="[
        isCompact ? 'top-3 left-3 right-3 justify-between' : 'top-6 left-6',
        isSepiaMode
          ? 'bg-[#FAF5E8]/90 border-[#dfd5c0] text-[#2C2621]'
          : (isLightMode ? 'bg-white/90 border-gray-200 text-gray-900' : 'bg-bgPanel/80 border-divider text-textPrimary')
      ]"
    >
      <!-- Campo de Busca -->
      <div class="relative flex items-center flex-1 min-w-[110px]">
        <SearchIcon
          class="w-4 h-4 absolute left-3 pointer-events-none"
          :class="isSepiaMode ? 'text-[#786C5E]' : (isLightMode ? 'text-gray-500' : 'text-textSecondary')"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar tema ou livro..."
          class="rounded-xl pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:border-accent w-full transition-all border"
          :class="isSepiaMode
            ? 'bg-[#F5EEDC]/80 border-[#dfd5c0] text-[#2C2621] placeholder:text-[#786C5E]/60'
            : (isLightMode
              ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
              : 'bg-bgApp/60 border-divider/60 text-textPrimary placeholder:text-textSecondary/50')"
        />
      </div>

      <div
        v-if="!isCompact"
        class="h-5 w-px"
        :class="isSepiaMode ? 'bg-[#dfd5c0]' : (isLightMode ? 'bg-gray-200' : 'bg-divider')"
      ></div>

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
        class="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border text-xs sm:text-sm transition-all active:scale-95 shrink-0"
        :class="isSepiaMode
          ? 'bg-[#F5EEDC]/60 border-[#dfd5c0] text-[#2C2621] hover:bg-[#F5EEDC]'
          : (isLightMode
            ? 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
            : 'bg-white/5 border-divider text-textPrimary hover:bg-white/10')"
        title="Criar conexão hierárquica entre temas"
      >
        <LinkIcon class="w-4 h-4 text-accent" />
        <span :class="{ 'hidden sm:inline': isCompact }">Conectar</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import * as d3 from 'd3'
import type { GraphNode, GraphEdge } from '~/interfaces/graph'
import { PlusIcon, SearchIcon, LinkIcon } from 'lucide-vue-next'
import { useSettings } from '~/composables/useSettings'

const props = withDefaults(
  defineProps<{
    nodes: GraphNode[]
    edges: GraphEdge[]
    selectedNodeId?: string | number | null
    isCompact?: boolean
    themeOverride?: 'sepia' | 'white' | 'black' | null
  }>(),
  {
    themeOverride: null,
  }
)

const emit = defineEmits<{
  (e: 'selectNode', node: GraphNode): void
  (e: 'openCreateNode'): void
  (e: 'openConnectModal'): void
}>()

const { themeMode } = useSettings()

const effectiveTheme = computed(() => {
  if (props.themeOverride) return props.themeOverride
  return themeMode.value
})

const isSepiaMode = computed(() => effectiveTheme.value === 'sepia')
const isLightMode = computed(() => effectiveTheme.value === 'light' || effectiveTheme.value === 'white')
const isDarkMode = computed(() => effectiveTheme.value === 'dark' || effectiveTheme.value === 'black')

const containerRef = ref<HTMLElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
const gRef = ref<SVGGElement | null>(null)

const searchQuery = ref('')

let simulation: any = null
let zoomBehavior: any = null

const API_BASE = 'http://localhost:7070'

const getPastelFill = (colorHex?: string, isRoot = false) => {
  const baseColor = colorHex || (isRoot ? '#E57B55' : '#64748B')
  const neutral = isSepiaMode.value ? '#F5EEDC' : (isLightMode.value ? '#FFFFFF' : '#161619')
  return d3.interpolateRgb(neutral, baseColor)(isRoot ? 0.35 : 0.25)
}

const getPastelStroke = (colorHex?: string, isRoot = false) => {
  const baseColor = colorHex || (isRoot ? '#E57B55' : '#64748B')
  const neutral = isSepiaMode.value ? '#D8CCB0' : (isLightMode.value ? '#CBD5E1' : '#161619')
  return d3.interpolateRgb(neutral, baseColor)(isRoot ? 0.85 : 0.70)
}

const getNodeRadius = (node: GraphNode) => {
  if (node.isRoot || node.id === -999 || node.id === 'root') return 36
  if (node.type === 'book') return 26
  const count = node.bookCount || 0
  return Math.min(24 + count * 3, 40)
}

const getTruncatedTitle = (title?: string) => {
  if (!title) return ''
  return title.length > 10 ? `${title.slice(0, 10)}...` : title
}

const initGraph = () => {
  if (!svgRef.value || !gRef.value || !containerRef.value) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  const svg = d3.select(svgRef.value)
  const g = d3.select(gRef.value)

  // Configurar Zoom
  zoomBehavior = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })

  svg.call(zoomBehavior as any).on('dblclick.zoom', null)

  // 1. Nó Central de Origem (Meu Conhecimento)
  const rootNode: GraphNode = {
    id: 'root',
    rawId: -999,
    name: 'Meu Conhecimento',
    color: '#E57B55',
    description: 'Nó central agregador do seu universo de leitura',
    type: 'theme',
    isRoot: true,
    x: width / 2,
    y: height / 2,
    fx: width / 2,
    fy: height / 2,
  }

  // Filtrar nós conforme busca
  const query = searchQuery.value.trim().toLowerCase()
  const filteredPropsNodes = query
    ? props.nodes.filter(
        (n) =>
          (n.name && n.name.toLowerCase().includes(query)) ||
          (n.fullTitle && n.fullTitle.toLowerCase().includes(query)) ||
          (n.author && n.author.toLowerCase().includes(query))
      )
    : props.nodes

  const inputNodes = filteredPropsNodes.map((n) => ({ ...n }))
  const simulationNodes = [rootNode, ...inputNodes]
  const nodeMap = new Map(simulationNodes.map((n) => [String(n.id), n]))

  // 2. Links explícitos entre nós
  const explicitLinks = props.edges
    .map((e) => {
      const sourceId = String(typeof e.source === 'object' ? e.source.id : e.source)
      const targetId = String(typeof e.target === 'object' ? e.target.id : e.target)
      return {
        id: String(e.id),
        source: nodeMap.get(sourceId),
        target: nodeMap.get(targetId),
        type: e.type || 'theme-hierarchy',
        isRootEdge: false,
      }
    })
    .filter((link) => link.source && link.target)

  // 3. Links conectando Nós de Temas principais ao Nó Raiz
  const themeNodes = inputNodes.filter((n) => n.type === 'theme')
  const rootLinks = themeNodes
    .map((node) => ({
      id: `root-edge-${node.id}`,
      source: rootNode,
      target: nodeMap.get(String(node.id)),
      type: 'root',
      isRootEdge: true,
    }))
    .filter((link) => link.target)

  const simulationLinks = [...rootLinks, ...explicitLinks]

  // Criar Simulação de Forças D3
  simulation = d3
    .forceSimulation(simulationNodes)
    .force(
      'link',
      d3
        .forceLink(simulationLinks as any)
        .id((d: any) => String(d.id))
        .distance((d: any) => (d.isRootEdge ? 180 : d.type === 'book-theme' ? 95 : 140))
    )
    .force('charge', d3.forceManyBody().strength((d: any) => (d.type === 'book' ? -220 : -440)))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide().radius((d: any) => getNodeRadius(d) + 20))

  // Renderizar Links (Arestas)
  const linkGroup = g.select('.links-group')
  const links = linkGroup
    .selectAll<SVGLineElement, any>('line')
    .data(simulationLinks, (d: any) => d.id)
    .join('line')
    .attr('stroke', (d: any) =>
      d.isRootEdge
        ? isSepiaMode.value
          ? 'rgba(217, 119, 6, 0.45)'
          : isLightMode.value
          ? 'rgba(229, 123, 85, 0.45)'
          : 'rgba(229, 123, 85, 0.35)'
        : d.type === 'book-theme'
        ? isSepiaMode.value
          ? 'rgba(180, 83, 9, 0.40)'
          : isLightMode.value
          ? 'rgba(59, 130, 246, 0.35)'
          : 'rgba(59, 130, 246, 0.30)'
        : isSepiaMode.value
        ? 'rgba(120, 108, 94, 0.22)'
        : isLightMode.value
        ? 'rgba(0, 0, 0, 0.15)'
        : 'rgba(255, 255, 255, 0.12)'
    )
    .attr('stroke-width', (d: any) => (d.isRootEdge ? 1.6 : d.type === 'book-theme' ? 1.4 : 1.2))
    .attr('stroke-dasharray', (d: any) => (d.type === 'book-theme' ? '3,3' : 'none'))
    .attr('stroke-opacity', 1)

  // Renderizar Nós
  const nodeGroup = g.select('.nodes-group')
  const nodesSelection = nodeGroup
    .selectAll<SVGGElement, any>('g.node')
    .data(simulationNodes, (d: any) => String(d.id))
    .join('g')
    .attr('class', 'node cursor-pointer')
    .call(
      d3
        .drag<SVGGElement, any>()
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

  nodesSelection.html('') // Limpar renderização anterior

  // ----------------------------------------------------
  // A. NÓS DE LIVROS (TIPO 'book')
  // ----------------------------------------------------
  const bookNodesSelection = nodesSelection.filter((d: any) => d.type === 'book')

  // Fundo/Card arredondado para livro
  bookNodesSelection
    .append('rect')
    .attr('x', -22)
    .attr('y', -30)
    .attr('width', 44)
    .attr('height', 60)
    .attr('rx', 8)
    .attr('ry', 8)
    .attr('fill', isSepiaMode.value ? '#FAF5E8' : (isLightMode.value ? '#FFFFFF' : '#1E1E24'))
    .attr('stroke', isSepiaMode.value ? '#D8CCB0' : (isLightMode.value ? '#CBD5E1' : '#334155'))
    .attr('stroke-width', 1.5)
    .attr('filter', 'url(#node-shadow)')
    .attr('class', 'transition-all duration-300 hover:scale-105')

  // Miniatura da Capa do Livro
  bookNodesSelection.each(function (d: any) {
    const nodeEl = d3.select(this)
    const coverUrl = d.coverPath
      ? d.coverPath.startsWith('http')
        ? d.coverPath
        : `${API_BASE}/api/books/${d.rawId}/cover`
      : null

    if (coverUrl) {
      const clipId = `book-clip-${d.rawId}`
      nodeEl
        .append('clipPath')
        .attr('id', clipId)
        .append('rect')
        .attr('x', -21)
        .attr('y', -29)
        .attr('width', 42)
        .attr('height', 58)
        .attr('rx', 7)
        .attr('ry', 7)

      nodeEl
        .append('image')
        .attr('href', coverUrl)
        .attr('x', -21)
        .attr('y', -29)
        .attr('width', 42)
        .attr('height', 58)
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .attr('clip-path', `url(#${clipId})`)
    }
  })

  // Rótulo do Livro: Título truncado em 10 caracteres + '...'
  bookNodesSelection
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', 44)
    .attr('fill', isSepiaMode.value ? '#2C2621' : (isLightMode.value ? '#0F172A' : '#F1F5F9'))
    .attr('font-size', '11px')
    .attr('font-weight', '600')
    .attr('font-family', 'system-ui, -apple-system, sans-serif')
    .attr('pointer-events', 'none')
    .text((d: any) => getTruncatedTitle(d.fullTitle || d.name))

  // ----------------------------------------------------
  // B. NÓS DE TEMAS & NÓ RAIZ (TIPO 'theme' / isRoot)
  // ----------------------------------------------------
  const themeAndRootNodesSelection = nodesSelection.filter((d: any) => d.type !== 'book')

  // Círculo com efeito de ambient ring
  themeAndRootNodesSelection
    .append('circle')
    .attr('r', (d: any) => getNodeRadius(d) + 5)
    .attr('fill', (d: any) => getPastelFill(d.color, d.isRoot))
    .attr('opacity', 0.16)
    .attr('class', 'transition-all duration-300')

  // Círculo principal do nó
  themeAndRootNodesSelection
    .append('circle')
    .attr('r', (d: any) => getNodeRadius(d))
    .attr('fill', (d: any) => getPastelFill(d.color, d.isRoot))
    .attr('stroke', (d: any) => getPastelStroke(d.color, d.isRoot))
    .attr('stroke-width', (d: any) => (d.isRoot ? 2 : 1.4))
    .attr('class', 'transition-all duration-300 shadow-lg')

  // Ícone Nó Raiz (Meu Conhecimento)
  const rootNodesSelection = themeAndRootNodesSelection.filter((d: any) => d.isRoot)
  const rootIconGroup = rootNodesSelection
    .append('g')
    .attr('transform', 'translate(-10.5, -10.5)')
    .attr('pointer-events', 'none')

  rootIconGroup
    .append('path')
    .attr(
      'd',
      'M12 18V5 M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4 M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5 M17.997 5.125a4 4 0 0 1 2.526 5.77 M18 18a4 4 0 0 0 2-7.464 M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517 M6 18a4 4 0 0 1-2-7.464 M6.003 5.125a4 4 0 0 0-2.526 5.77'
    )
    .attr('fill', 'none')
    .attr('stroke', isSepiaMode.value ? '#8B4513' : (isLightMode.value ? '#C2410C' : '#FFFFFF'))
    .attr('stroke-width', '1.6')
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round')
    .attr('transform', 'scale(0.9)')

  // Ícone & Contagem para Temas
  const standardThemeSelection = themeAndRootNodesSelection.filter((d: any) => !d.isRoot)
  standardThemeSelection.each(function (d: any) {
    const nodeEl = d3.select(this)
    const bookCount = d.bookCount || 0

    const iconG = nodeEl.append('g').attr('pointer-events', 'none').attr('class', 'theme-icon-group')

    if (bookCount > 0) {
      iconG
        .append('path')
        .attr('d', 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z')
        .attr('fill', 'none')
        .attr('stroke', isSepiaMode.value ? 'rgba(44, 38, 33, 0.85)' : (isLightMode.value ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)'))
        .attr('stroke-width', '1.5')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('transform', 'translate(-13, -7.5) scale(0.62)')

      iconG
        .append('text')
        .attr('x', 4)
        .attr('y', 4)
        .attr('font-size', '11.5px')
        .attr('font-weight', '600')
        .attr('font-family', 'ui-monospace, monospace')
        .attr('fill', isSepiaMode.value ? '#2C2621' : (isLightMode.value ? '#1E293B' : 'rgba(255, 255, 255, 0.92)'))
        .text(bookCount)
    } else {
      iconG
        .append('path')
        .attr('d', 'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20')
        .attr('fill', 'none')
        .attr('stroke', isSepiaMode.value ? 'rgba(44, 38, 33, 0.75)' : (isLightMode.value ? 'rgba(30, 41, 59, 0.75)' : 'rgba(255, 255, 255, 0.55)'))
        .attr('stroke-width', '1.5')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('transform', 'translate(-7, -7.5) scale(0.62)')
    }
  })

  // Rótulo para Temas
  themeAndRootNodesSelection
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', (d: any) => getNodeRadius(d) + 18)
    .attr('fill', (d: any) =>
      d.isRoot
        ? isSepiaMode.value
          ? '#8B4513'
          : isLightMode.value
          ? '#9A3412'
          : '#F59E0B'
        : isSepiaMode.value
        ? '#2C2621'
        : isLightMode.value
        ? '#1E293B'
        : '#E2E8F0'
    )
    .attr('font-size', (d: any) => (d.isRoot ? '13.5px' : '12px'))
    .attr('font-weight', '600')
    .attr('font-family', 'system-ui, -apple-system, sans-serif')
    .attr('pointer-events', 'none')
    .text((d: any) => d.name)

  // ----------------------------------------------------
  // INTERAÇÕES & EVENTOS
  // ----------------------------------------------------
  nodesSelection.on('click', (event, d) => {
    event.stopPropagation()
    if (d.isRoot) {
      emit('selectNode', rootNode)
    } else {
      const originalNode = props.nodes.find((n) => String(n.id) === String(d.id))
      if (originalNode) {
        emit('selectNode', originalNode)
      } else {
        emit('selectNode', d)
      }
    }
  })

  // Destaque no Hover
  nodesSelection
    .on('mouseenter', (event, d) => {
      links
        .attr('stroke', (l: any) =>
          String(l.source.id) === String(d.id) || String(l.target.id) === String(d.id)
            ? d.color || '#E57B55'
            : isSepiaMode.value
            ? 'rgba(120, 108, 94, 0.08)'
            : isLightMode.value
            ? 'rgba(0, 0, 0, 0.04)'
            : 'rgba(255, 255, 255, 0.05)'
        )
        .attr('stroke-width', (l: any) =>
          String(l.source.id) === String(d.id) || String(l.target.id) === String(d.id) ? 2 : 1
        )
        .attr('stroke-opacity', (l: any) =>
          String(l.source.id) === String(d.id) || String(l.target.id) === String(d.id) ? 0.9 : 0.25
        )
    })
    .on('mouseleave', () => {
      links
        .attr('stroke', (d: any) =>
          d.isRootEdge
            ? isSepiaMode.value
              ? 'rgba(217, 119, 6, 0.45)'
              : 'rgba(229, 123, 85, 0.35)'
            : d.type === 'book-theme'
            ? isSepiaMode.value
              ? 'rgba(180, 83, 9, 0.40)'
              : isLightMode.value
              ? 'rgba(59, 130, 246, 0.35)'
              : 'rgba(59, 130, 246, 0.30)'
            : isSepiaMode.value
            ? 'rgba(120, 108, 94, 0.18)'
            : isLightMode.value
            ? 'rgba(0, 0, 0, 0.08)'
            : 'rgba(255, 255, 255, 0.12)'
        )
        .attr('stroke-width', (d: any) => (d.isRootEdge ? 1.5 : 1.2))
        .attr('stroke-opacity', 1)
    })

  // Tick da simulação
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

watch(
  () => [props.nodes, props.edges, searchQuery.value],
  () => {
    initGraph()
  },
  { deep: true }
)

watch(
  () => effectiveTheme.value,
  () => {
    initGraph()
  }
)

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
