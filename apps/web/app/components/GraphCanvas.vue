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
import { getCoverUrl } from '~/utils/cover'

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

const getMonochromeIconColor = () => {
  if (isSepiaMode.value) return '#4A3E31'
  if (isLightMode.value) return '#1E293B'
  return '#F1F5F9'
}

const getNodeFill = (isRoot = false) => {
  if (isSepiaMode.value) return isRoot ? '#F5EEDC' : '#FAF5E8'
  if (isLightMode.value) return isRoot ? '#F8FAFC' : '#FFFFFF'
  return isRoot ? '#232329' : '#1A1A1F'
}

const getNodeStroke = (colorHex?: string, isRoot = false) => {
  if (isRoot) return '#E57B55'
  if (isSepiaMode.value) return '#C4B59D'
  if (isLightMode.value) return '#CBD5E1'
  return '#3F3F46'
}

const getNodeInnerBorderStroke = () => {
  if (isSepiaMode.value) return 'rgba(120, 108, 94, 0.28)'
  if (isLightMode.value) return 'rgba(0, 0, 0, 0.12)'
  return 'rgba(255, 255, 255, 0.16)'
}

const getThemeIconSvg = (name?: string, category?: string, isRoot = false): string => {
  if (isRoot) {
    return `<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04" />`
  }

  const str = `${name || ''} ${category || ''}`.toLowerCase()
  if (/filosof|ética|epistem|moral|lógica/.test(str)) {
    return `<line x1="3" y1="21" x2="21" y2="21"/><line x1="12" y1="3" x2="3" y2="8"/><line x1="12" y1="3" x2="21" y2="8"/><line x1="3" y1="8" x2="21" y2="8"/><line x1="7" y1="11" x2="7" y2="18"/><line x1="12" y1="11" x2="12" y2="18"/><line x1="17" y1="11" x2="17" y2="18"/>`
  }
  if (/psicolog|mente|cogni|comportamento|emoção|sanidade/.test(str)) {
    return `<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>`
  }
  if (/literatur|ficção|romance|poesia|alienista|machado|conto|ensaio/.test(str)) {
    return `<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/>`
  }
  if (/ciênc|tecnolog|física|químic|biolog|computa|software|program/.test(str)) {
    return `<circle cx="12" cy="12" r="1.5" fill="currentColor"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 8.3c4.54 4.54 6.54 9.87 4.5 11.9-2.03 2.04-7.36.02-11.9-4.5-4.52-4.54-6.54-9.87-4.5-11.9 2.03-2.04 7.36-.02 11.9 4.5Z"/>`
  }
  if (/história|sociedade|política|economia|antropolog/.test(str)) {
    return `<circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a14.5 14.5 0 0 1 3.8 9 14.5 14.5 0 0 1-3.8 9 14.5 14.5 0 0 1-3.8-9 14.5 14.5 0 0 1 3.8-9z"/>`
  }
  if (/arte|design|música|cinema/.test(str)) {
    return `<circle cx="13.5" cy="6.5" r=".75" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".75" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".75" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".75" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>`
  }
  if (/saúde|medicina|corpo|natureza/.test(str)) {
    return `<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>`
  }
  if (/estoic|sabedoria|medita/.test(str)) {
    return `<circle cx="12" cy="12" r="9"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>`
  }
  return `<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>`
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

  // 4. Links conectando Livros sem tema ao Nó Raiz (para nenhum livro ficar flutuando isolado)
  const bookNodes = inputNodes.filter((n) => n.type === 'book')
  const connectedBookNodeIds = new Set<string>()
  for (const link of explicitLinks) {
    if (link.source) connectedBookNodeIds.add(String(link.source.id))
    if (link.target) connectedBookNodeIds.add(String(link.target.id))
  }

  const orphanBookLinks = bookNodes
    .filter((b) => !connectedBookNodeIds.has(String(b.id)))
    .map((b) => ({
      id: `root-book-edge-${b.id}`,
      source: rootNode,
      target: nodeMap.get(String(b.id)),
      type: 'root-book',
      isRootEdge: true,
    }))
    .filter((link) => link.target)

  const simulationLinks = [...rootLinks, ...orphanBookLinks, ...explicitLinks]

  // Criar Simulação de Forças D3
  simulation = d3
    .forceSimulation(simulationNodes)
    .force(
      'link',
      d3
        .forceLink(simulationLinks as any)
        .id((d: any) => String(d.id))
        .distance((d: any) => (d.isRootEdge ? (d.type === 'root-book' ? 200 : 170) : d.type === 'book-theme' ? 95 : 130))
    )
    .force('charge', d3.forceManyBody().strength((d: any) => (d.type === 'book' ? -220 : -420)))
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
    .attr('stroke-dasharray', (d: any) => (d.type === 'book-theme' ? '3,3' : (d.type === 'root-book' ? '4,4' : 'none')))
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

  // Ícone de placeholder elegante e capa do livro
  bookNodesSelection.each(function (d: any) {
    const nodeEl = d3.select(this)
    const rawBookId = d.rawId || (typeof d.id === 'number' ? d.id : parseInt(String(d.id).replace('book-', ''), 10))
    const coverUrl = getCoverUrl(d.coverPath, rawBookId)

    // Ícone SVG de fallback sempre posicionado centralmente no card
    const fallbackG = nodeEl.append('g').attr('class', 'book-fallback-icon').attr('pointer-events', 'none')
    fallbackG
      .append('path')
      .attr(
        'd',
        'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20'
      )
      .attr('fill', 'none')
      .attr('stroke', isSepiaMode.value ? '#8B4513' : (isLightMode.value ? '#EA580C' : '#E57B55'))
      .attr('stroke-width', '1.6')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('transform', 'translate(-10, -10) scale(0.85)')

    if (coverUrl) {
      const clipId = `book-clip-${rawBookId || d.id}`
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

      const img = nodeEl
        .append('image')
        .attr('href', coverUrl)
        .attr('x', -21)
        .attr('y', -29)
        .attr('width', 42)
        .attr('height', 58)
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .attr('clip-path', `url(#${clipId})`)

      // Se falhar o carregamento da imagem remota/local, remove a tag image sem exibir ícone quebrado do navegador
      img.on('error', function () {
        d3.select(this).remove()
      })
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

  // 1. Círculo com efeito de borda externa decorativa
  themeAndRootNodesSelection
    .append('circle')
    .attr('r', (d: any) => getNodeRadius(d) + 4)
    .attr('fill', 'none')
    .attr('stroke', (d: any) => (d.isRoot ? 'rgba(229, 123, 85, 0.35)' : getNodeInnerBorderStroke()))
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', (d: any) => (d.isRoot ? 'none' : '2,2'))
    .attr('opacity', 0.7)

  // 2. Círculo principal do nó (monocromático com borda definida)
  themeAndRootNodesSelection
    .append('circle')
    .attr('r', (d: any) => getNodeRadius(d))
    .attr('fill', (d: any) => getNodeFill(d.isRoot))
    .attr('stroke', (d: any) => (d.isRoot ? '#E57B55' : getNodeStroke(d.color, d.isRoot)))
    .attr('stroke-width', (d: any) => (d.isRoot ? 2 : 1.5))
    .attr('class', 'transition-all duration-300 shadow-md')

  // 3. Borda interna fina para acabamento clean e elegante com bordas
  themeAndRootNodesSelection
    .append('circle')
    .attr('r', (d: any) => Math.max(getNodeRadius(d) - 5, 12))
    .attr('fill', 'none')
    .attr('stroke', getNodeInnerBorderStroke())
    .attr('stroke-width', 1)
    .attr('pointer-events', 'none')

  // 4. Ícone Monocromático Vetorial Clean com Bordas
  themeAndRootNodesSelection.each(function (d: any) {
    const nodeEl = d3.select(this)
    const iconMarkup = getThemeIconSvg(d.name, d.category, d.isRoot)
    const iconColor = getMonochromeIconColor()
    const scale = d.isRoot ? 0.85 : 0.66
    const offset = -(24 * scale) / 2

    const iconG = nodeEl
      .append('g')
      .attr('class', 'node-icon-monochrome')
      .attr('pointer-events', 'none')
      .attr('transform', `translate(${offset}, ${offset}) scale(${scale})`)
      .attr('fill', 'none')
      .attr('stroke', iconColor)
      .attr('stroke-width', '1.65')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')

    iconG.html(iconMarkup)
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
