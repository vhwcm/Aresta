<template>
  <div
    class="relative w-full h-full overflow-hidden bg-transparent select-none touch-none"
    style="touch-action: none; overscroll-behavior: contain;"
    ref="containerRef"
  >
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
    <svg
      ref="svgRef"
      class="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none"
      style="touch-action: none; overscroll-behavior: contain;"
    >
      <defs>
        <!-- Filtro para sombra dos nós de livros -->
        <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.25" />
        </filter>
        <!-- Filtro para brilho da aresta magnética em conexão -->
        <filter id="wire-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#E57B55" flood-opacity="0.85" />
        </filter>
      </defs>
      <g ref="gRef">
        <!-- Links/Arestas -->
        <g class="links-group"></g>
        <!-- Aresta magnética temporária puxada pelo usuário -->
        <g class="temp-wire-group">
          <line
            class="drag-wire"
            stroke="#E57B55"
            stroke-width="2.5"
            stroke-dasharray="6,4"
            stroke-linecap="round"
            filter="url(#wire-glow)"
            style="display: none; pointer-events: none;"
          />
          <circle
            class="drag-wire-tip"
            r="5"
            fill="#E57B55"
            stroke="#ffffff"
            stroke-width="1.5"
            style="display: none; pointer-events: none;"
          />
        </g>
        <!-- Nós/Temas, Livros, Anotações, Notas e Quadros -->
        <g class="nodes-group"></g>
      </g>
    </svg>

    <!-- Toolbar de Controles (Topo-Esquerda) -->
    <div
      v-if="showControls"
      class="absolute z-10 flex items-center gap-2 backdrop-blur-md border p-2.5 rounded-2xl shadow-2xl max-w-[calc(100%-1.5rem)] flex-wrap transition-colors duration-200"
      :class="[
        isCompact ? 'top-3 left-3 right-3 justify-between' : 'top-6 left-6',
        isSepiaMode
          ? 'bg-[#FAF5E8]/90 border-[#dfd5c0] text-[#2C2621]'
          : (isLightMode ? 'bg-white/90 border-gray-200 text-gray-900' : 'bg-bgPanel/80 border-divider text-textPrimary')
      ]"
    >
      <!-- Campo de Busca -->
      <div v-if="showSearch" class="relative flex items-center flex-1 min-w-[110px]">
        <SearchIcon
          class="w-4 h-4 absolute left-3 pointer-events-none"
          :class="isSepiaMode ? 'text-[#786C5E]' : (isLightMode ? 'text-gray-500' : 'text-textSecondary')"
        />
        <input
          v-model="currentSearchQuery"
          type="text"
          placeholder="Buscar tema, livro, anotação..."
          class="rounded-xl pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:border-accent w-full transition-all border"
          :class="isSepiaMode
            ? 'bg-[#F5EEDC]/80 border-[#dfd5c0] text-[#2C2621] placeholder:text-[#786C5E]/60'
            : (isLightMode
              ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
              : 'bg-bgApp/60 border-divider/60 text-textPrimary placeholder:text-textSecondary/50')"
        />
      </div>

      <div
        v-if="!isCompact && showSearch"
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

      <!-- Botão Sincronizar Grafo -->
      <button
        @click="handleManualSync"
        :disabled="isSyncing"
        class="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border text-xs sm:text-sm transition-all active:scale-95 shrink-0 cursor-pointer disabled:opacity-60"
        :class="isSepiaMode
          ? 'bg-[#F5EEDC]/60 border-[#dfd5c0] text-[#2C2621] hover:bg-[#F5EEDC]'
          : (isLightMode
            ? 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
            : 'bg-white/5 border-divider text-textPrimary hover:bg-white/10')"
        :title="isSyncing ? 'Sincronizando dados...' : (lastSyncFormatted ? `Sincronizar grafo (Último sync: ${lastSyncFormatted})` : 'Sincronizar dados com outros dispositivos')"
      >
        <RefreshCwIcon class="w-4 h-4 text-accent" :class="{ 'animate-spin': isSyncing }" />
        <span :class="{ 'hidden sm:inline': isCompact }">{{ isSyncing ? 'Sincronizando...' : 'Sincronizar' }}</span>
        <span
          v-if="pendingCount > 0"
          class="w-2 h-2 rounded-full bg-accent animate-pulse"
          title="Alterações pendentes de sincronização"
        ></span>
      </button>
    </div>

    <!-- Barra de Filtros por Camadas de Nós (Chips Visíveis quando não compacto) -->
    <div
      v-if="!isCompact"
      data-testid="layers-filter-bar"
      class="absolute z-10 flex items-center gap-1.5 p-1.5 rounded-2xl backdrop-blur-md border shadow-lg transition-all duration-200 max-w-[calc(100%-3rem)] flex-wrap"
      :class="[
        showControls ? 'top-20 left-6' : 'top-4 sm:top-5 left-4 sm:left-6',
        isSepiaMode
          ? 'bg-[#FAF5E8]/90 border-[#dfd5c0] text-[#2C2621]'
          : (isLightMode ? 'bg-white/90 border-gray-200 text-gray-800' : 'bg-bgPanel/85 border-divider text-textPrimary')
      ]"
    >
      <span class="text-[11px] font-medium text-textSecondary px-2 select-none">Camadas:</span>

      <button
        v-for="layer in layerDefinitions"
        :key="layer.type"
        @click="toggleLayer(layer.type)"
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer select-none border"
        :class="activeLayers.has(layer.type)
          ? `${layer.activeBg} ${layer.activeText} shadow-xs font-semibold`
          : 'opacity-40 hover:opacity-75 bg-transparent text-textSecondary border-transparent'"
        :title="`Alternar exibição de ${layer.label}`"
      >
        <component :is="layer.icon" class="w-3.5 h-3.5 shrink-0" />
        <span>{{ layer.label }}</span>
        <span class="text-[10px] ml-0.5 opacity-75 font-mono">({{ getLayerCount(layer.type) }})</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
import * as d3 from 'd3'
import type { GraphNode, GraphEdge, GraphNodeType } from '~/interfaces/graph'
import { PlusIcon, SearchIcon, LinkIcon, TagIcon, BookOpenIcon, FileTextIcon, LayoutGridIcon, FolderIcon, RefreshCw as RefreshCwIcon } from 'lucide-vue-next'
import { useSettings } from '~/composables/useSettings'
import { useDriveSync } from '~/composables/useDriveSync'
import { getCoverUrl, resolveBookCover } from '~/utils/cover'
import { resolveNoteTitle } from '~/utils/noteTitle'

const props = withDefaults(
  defineProps<{
    nodes: GraphNode[]
    edges: GraphEdge[]
    selectedNodeId?: string | number | null
    isCompact?: boolean
    themeOverride?: 'sepia' | 'white' | 'black' | null
    searchQuery?: string
    showControls?: boolean
    showSearch?: boolean
  }>(),
  {
    themeOverride: null,
    searchQuery: undefined,
    showControls: true,
    showSearch: true,
  }
)

const emit = defineEmits<{
  (e: 'selectNode', node: GraphNode): void
  (e: 'openCreateNode'): void
  (e: 'openConnectModal'): void
  (
    e: 'connectNodes',
    payload: {
      sourceId: number | string
      targetId: number | string
      sourceRawId?: number | string
      targetRawId?: number | string
      sourceType?: string
      targetType?: string
    }
  ): void
  (
    e: 'connect-nodes',
    payload: {
      sourceId: number | string
      targetId: number | string
      sourceRawId?: number | string
      targetRawId?: number | string
      sourceType?: string
      targetType?: string
    }
  ): void
}>()

const { themeMode } = useSettings()
const { isSyncing, lastSyncFormatted, pendingCount, sync } = useDriveSync()

const handleManualSync = async () => {
  await sync()
}

const effectiveTheme = computed(() => {
  if (props.themeOverride) return props.themeOverride
  return themeMode.value
})

const isSepiaMode = computed(() => effectiveTheme.value === 'sepia')
const isLightMode = computed(() => effectiveTheme.value === 'light' || effectiveTheme.value === 'white')

const containerRef = ref<HTMLElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
const gRef = ref<SVGGElement | null>(null)

// Arestas locais criadas interativamente na tela (renderizadas no mesmo milissegundo)
const localCustomEdges = ref<GraphEdge[]>([])

watch(
  () => props.edges,
  (newEdges) => {
    const propEdgeKeys = new Set(newEdges.map((e) => `${String(e.source)}---${String(e.target)}`))
    localCustomEdges.value = localCustomEdges.value.filter((le) => {
      const k1 = `${String(le.source)}---${String(le.target)}`
      const k2 = `${String(le.target)}---${String(le.source)}`
      return !propEdgeKeys.has(k1) && !propEdgeKeys.has(k2)
    })
  },
  { deep: true }
)

const allEdges = computed(() => {
  return [...props.edges, ...localCustomEdges.value]
})

const internalSearchQuery = ref('')
const currentSearchQuery = computed({
  get: () => (props.searchQuery !== undefined ? props.searchQuery : internalSearchQuery.value),
  set: (val: string) => {
    internalSearchQuery.value = val
  }
})
const hoveredNode = ref<GraphNode | null>(null)
const tooltipPos = ref({ x: 0, y: 0 })

// Filtros de camadas ativas (por padrão, todas visíveis)
const activeLayers = ref<Set<GraphNodeType>>(
  new Set(['theme', 'book', 'folder', 'note', 'canvas', 'link'])
)

const layerDefinitions: Array<{
  type: GraphNodeType
  label: string
  icon: any
  activeBg: string
  activeText: string
}> = [
  { type: 'theme', label: 'Temas', icon: TagIcon, activeBg: 'bg-accent/20 border-accent/40', activeText: 'text-accent' },
  { type: 'book', label: 'Livros', icon: BookOpenIcon, activeBg: 'bg-blue-500/20 border-blue-500/40', activeText: 'text-blue-400' },
  { type: 'folder', label: 'Pastas', icon: FolderIcon, activeBg: 'bg-amber-500/20 border-amber-500/40', activeText: 'text-amber-400' },
  { type: 'note', label: 'Notas', icon: FileTextIcon, activeBg: 'bg-indigo-500/20 border-indigo-500/40', activeText: 'text-indigo-400' },
  { type: 'canvas', label: 'Quadros', icon: LayoutGridIcon, activeBg: 'bg-emerald-500/20 border-emerald-500/40', activeText: 'text-emerald-400' },
  { type: 'link', label: 'Links', icon: LinkIcon, activeBg: 'bg-cyan-500/20 border-cyan-500/40', activeText: 'text-cyan-400' },
]

const toggleLayer = (type: GraphNodeType) => {
  const allCount = layerDefinitions.length
  const current = activeLayers.value

  // Se todas as camadas estão ativas (estado inicial / sem restrição ativa),
  // clicar em uma camada isola a categoria (somente ela fica ativa)
  if (current.size >= allCount) {
    activeLayers.value = new Set([type])
  } else if (current.has(type)) {
    // Se a camada já está ativa no conjunto filtrado, desativa-a
    const next = new Set(current)
    next.delete(type)
    // Se era o último filtro ativo restante, restaura o padrão com tudo visível
    if (next.size === 0) {
      activeLayers.value = new Set(layerDefinitions.map((l) => l.type))
    } else {
      activeLayers.value = next
    }
  } else {
    // Adiciona uma nova camada ao conjunto de filtros ativos (multi-seleção)
    const next = new Set(current)
    next.add(type)
    activeLayers.value = next
  }

  initGraph()
}

const getLayerCount = (type: GraphNodeType) => {
  return props.nodes.filter((n) => (n.type || 'theme') === type).length
}

const getNodeBadgeLabel = (type?: GraphNodeType) => {
  switch (type) {
    case 'book': return 'Livro'
    case 'folder': return 'Pasta'
    case 'note': return 'Nota'
    case 'canvas': return 'Quadro'
    case 'link': return 'Link'
    case 'theme':
    default: return 'Tema'
  }
}

const getNodeBadgeClass = (type?: GraphNodeType) => {
  switch (type) {
    case 'book': return 'bg-blue-500/20 text-blue-400'
    case 'folder': return 'bg-amber-500/20 text-amber-400'
    case 'note': return 'bg-indigo-500/20 text-indigo-400'
    case 'canvas': return 'bg-emerald-500/20 text-emerald-400'
    case 'link': return 'bg-cyan-500/20 text-cyan-400'
    case 'theme':
    default: return 'bg-accent/20 text-accent'
  }
}

let simulation: any = null
let zoomBehavior: any = null
let animFrameId: number | null = null
let currentSimulationNodes: any[] = []

// Cache persistente de posições anteriores dos nós para interpolação orgânica e suave
const persistentNodePositions = new Map<string, { x: number; y: number }>()
let transitionStartTime = 0
let isTransitioning = false
const TRANSITION_DURATION = 2400 // 2.4s para deslocamento lento, fluido e orgânico

const fitToScreen = (animate = true, duration = 500) => {
  if (!svgRef.value || !containerRef.value || currentSimulationNodes.length === 0) return

  const containerWidth = containerRef.value.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1200)
  const containerHeight = containerRef.value.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 800)
  if (!containerWidth || !containerHeight || !Number.isFinite(containerWidth) || !Number.isFinite(containerHeight) || containerWidth <= 0 || containerHeight <= 0) return

  if (currentSimulationNodes.length <= 1) {
    const targetTransform = d3.zoomIdentity.translate(0, 0).scale(1.0)
    const svg = d3.select(svgRef.value)
    if (animate) {
      svg.transition().duration(duration).ease(d3.easeCubicInOut).call(zoomBehavior.transform as any, targetTransform)
    } else {
      svg.call(zoomBehavior.transform as any, targetTransform)
    }
    return
  }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const d of currentSimulationNodes) {
    // Utiliza a posição de destino final prevista para que o enquadramento acompanhe o destino
    const x = d.targetX ?? d.baseX ?? d.x ?? (containerWidth / 2)
    const y = d.targetY ?? d.baseY ?? d.y ?? (containerHeight / 2)
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue

    const r = getNodeRadius(d) + 36
    if (x - r < minX) minX = x - r
    if (x + r > maxX) maxX = x + r
    if (y - r < minY) minY = y - r
    if (y + r + 24 > maxY) maxY = y + r + 24
  }

  if (
    !Number.isFinite(minX) ||
    !Number.isFinite(maxX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(maxY) ||
    minX >= maxX ||
    minY >= maxY
  ) {
    return
  }

  const graphW = maxX - minX
  const graphH = maxY - minY
  const padding = 75

  if (!Number.isFinite(graphW) || !Number.isFinite(graphH) || graphW <= 0 || graphH <= 0) {
    return
  }

  const scaleX = containerWidth / (graphW + padding * 2)
  const scaleY = containerHeight / (graphH + padding * 2)
  const rawScale = Math.min(scaleX, scaleY)
  if (!Number.isFinite(rawScale) || rawScale <= 0) return

  const scale = Math.max(0.15, Math.min(rawScale, 1.0))

  const midX = (minX + maxX) / 2
  const midY = (minY + maxY) / 2

  const tx = containerWidth / 2 - midX * scale
  const ty = containerHeight / 2 - midY * scale

  if (
    !zoomBehavior ||
    !Number.isFinite(tx) ||
    !Number.isFinite(ty) ||
    !Number.isFinite(scale) ||
    scale <= 0
  ) {
    return
  }

  const targetTransform = d3.zoomIdentity.translate(tx, ty).scale(scale)
  const svg = d3.select(svgRef.value)

  if (animate) {
    svg.transition().duration(duration).ease(d3.easeCubicInOut).call(zoomBehavior.transform as any, targetTransform)
  } else {
    svg.call(zoomBehavior.transform as any, targetTransform)
  }
}

const parseColorRgb = (hex?: string) => {
  if (!hex) return { r: 229, g: 123, b: 85 } // #E57B55
  try {
    const c = d3.color(hex)
    if (c) {
      const rgb = c.rgb()
      return { r: rgb.r, g: rgb.g, b: rgb.b }
    }
  } catch {
    // fallback
  }
  return { r: 229, g: 123, b: 85 }
}

const getThemeNodeStroke = (colorHex?: string, isRoot = false) => {
  if (isRoot) return '#E57B55'
  return colorHex || '#E57B55'
}

const getThemeNodeFill = (colorHex?: string, isRoot = false) => {
  const hex = isRoot ? '#E57B55' : (colorHex || '#E57B55')
  const { r, g, b } = parseColorRgb(hex)
  if (isSepiaMode.value) {
    return `rgb(${Math.round(r * 0.14 + 250 * 0.86)}, ${Math.round(g * 0.14 + 245 * 0.86)}, ${Math.round(b * 0.14 + 232 * 0.86)})`
  }
  if (isLightMode.value) {
    return `rgb(${Math.round(r * 0.10 + 255 * 0.90)}, ${Math.round(g * 0.10 + 255 * 0.90)}, ${Math.round(b * 0.10 + 255 * 0.90)})`
  }
  return `rgb(${Math.round(r * 0.16 + 24 * 0.84)}, ${Math.round(g * 0.16 + 24 * 0.84)}, ${Math.round(b * 0.16 + 29 * 0.84)})`
}

const getThemeNodeOuterRingStroke = (colorHex?: string, isRoot = false) => {
  const hex = isRoot ? '#E57B55' : (colorHex || '#E57B55')
  const { r, g, b } = parseColorRgb(hex)
  return `rgba(${r}, ${g}, ${b}, 0.35)`
}

const getThemeNodeInnerBorderStroke = (colorHex?: string, isRoot = false) => {
  const hex = isRoot ? '#E57B55' : (colorHex || '#E57B55')
  const { r, g, b } = parseColorRgb(hex)
  return `rgba(${r}, ${g}, ${b}, 0.25)`
}

const getThemeNodeIconColor = (colorHex?: string, isRoot = false) => {
  if (isRoot) return '#E57B55'
  return colorHex || '#E57B55'
}

const getThemeNodeTextColor = (colorHex?: string, isRoot = false) => {
  if (isRoot) {
    if (isSepiaMode.value) return '#8B4513'
    if (isLightMode.value) return '#EA580C'
    return '#F59E0B'
  }
  return colorHex || (isSepiaMode.value ? '#8B4513' : (isLightMode.value ? '#EA580C' : '#F59E0B'))
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
  if (node.type === 'annotation') return 14
  if (node.type === 'folder') return 18
  if (node.type === 'note') return 17
  if (node.type === 'canvas') return 19
  if (node.type === 'link') return 17
  const count = node.bookCount || 0
  return Math.min(22 + count * 2, 38)
}

const getTruncatedTitle = (title?: string, max = 14) => {
  if (!title) return ''
  const trimmed = title.trim()
  if (trimmed.length <= max) return trimmed
  if (trimmed.includes(': ')) {
    const parts = trimmed.split(': ')
    const subtitle = parts.slice(1).join(': ').trim()
    if (subtitle.length > 0 && subtitle.length <= max) {
      return subtitle
    }
  }
  return `${trimmed.slice(0, max - 2)}...`
}

const initGraph = (animateTransition = true) => {
  if (!svgRef.value || !gRef.value || !containerRef.value) return

  const width = containerRef.value.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1200)
  const height = containerRef.value.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 800)

  const svg = d3.select(svgRef.value)
  const g = d3.select(gRef.value)

  // Configurar Zoom e Pan com filtro estrito (ignorar pan quando clicar/arrastar a partir de um nó)
  zoomBehavior = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .filter((event) => {
      // Bloquear pan do canvas se o ponteiro estiver sobre um nó
      const target = event.target as HTMLElement | SVGElement | null
      if (target && typeof target.closest === 'function' && target.closest('.node')) {
        return false
      }

      // Tratar evento de roda do mouse/trackpad:
      if (event.type === 'wheel') {
        if (event.cancelable) {
          event.preventDefault()
        }
        event.stopPropagation()

        // No modo compacto (Home do desktop), o scrolling vertical não afeta o grafo.
        // O zoom só é ativado se segurar Ctrl (ou gesto de pinça no trackpad).
        // Em tela cheia (!isCompact), o zoom livre com a roda continua funcionando normalmente.
        if (props.isCompact && !event.ctrlKey) {
          return false
        }
        return true
      }

      // Permitir pan (mover o grafo como um todo) com botão esquerdo ou toque no fundo
      return !event.button
    })
    .on('zoom', (event) => {
      const t = event.transform
      if (t && Number.isFinite(t.x) && Number.isFinite(t.y) && Number.isFinite(t.k) && t.k > 0) {
        g.attr('transform', t)
      }
    })

  svg.call(zoomBehavior as any).on('dblclick.zoom', null)

  // 1. Nó Central de Origem (Meu Conhecimento)
  const rootNode: GraphNode = {
    id: 'root',
    rawId: -999,
    name: 'Meu Conhecimento',
    title: 'Meu Conhecimento',
    color: '#E57B55',
    description: 'Nó central agregador do seu universo de conhecimento',
    type: 'theme',
    isRoot: true,
    x: width / 2,
    y: height / 2,
    fx: width / 2,
    fy: height / 2,
  }

  // Filtrar nós conforme busca e camadas ativas
  const query = (currentSearchQuery.value || '').trim().toLowerCase()
  const filteredPropsNodes = props.nodes.filter((n) => {
    const nodeType = n.type || 'theme'
    if (!activeLayers.value.has(nodeType)) return false
    if (!query) return true
    return (
      (n.name && n.name.toLowerCase().includes(query)) ||
      (n.title && n.title.toLowerCase().includes(query)) ||
      (n.fullTitle && n.fullTitle.toLowerCase().includes(query)) ||
      (n.author && n.author.toLowerCase().includes(query)) ||
      (n.selectedText && n.selectedText.toLowerCase().includes(query)) ||
      (n.note && n.note.toLowerCase().includes(query)) ||
      (n.folder && n.folder.toLowerCase().includes(query)) ||
      (n.tags && n.tags.some((t) => t.toLowerCase().includes(query)))
    )
  })

  const inputNodes = filteredPropsNodes.map((n) => ({ ...n }))
  const simulationNodes = [rootNode, ...inputNodes]
  const nodeMap = new Map<string, GraphNode>()
  for (const n of simulationNodes) {
    nodeMap.set(String(n.id), n)
    if (n.rawId !== undefined && n.rawId !== null) {
      nodeMap.set(String(n.rawId), n)
      nodeMap.set(`${n.type || 'theme'}-${n.rawId}`, n)
    }
  }

  const resolveNode = (id: any): GraphNode | undefined => {
    if (!id && id !== 0) return undefined
    const str = String(typeof id === 'object' ? (id as any).id : id)
    if (nodeMap.has(str)) return nodeMap.get(str)

    // Tenta remover prefixos conhecidos
    const stripped = str.replace(/^(book-|theme-|note-|canvas-|annotation-|folder-|link-)/, '')
    if (nodeMap.has(stripped)) return nodeMap.get(stripped)

    // Tenta prefixos conhecidos
    for (const prefix of ['book-', 'theme-', 'note-', 'canvas-', 'annotation-', 'folder-', 'link-']) {
      if (nodeMap.has(`${prefix}${str}`)) return nodeMap.get(`${prefix}${str}`)
      if (nodeMap.has(`${prefix}${stripped}`)) return nodeMap.get(`${prefix}${stripped}`)
    }

    return undefined
  }

  // 2. Links explícitos entre nós válidos (props + conexões interativas locais)
  const explicitLinks = allEdges.value
    .map((e) => {
      const sourceNode = resolveNode(e.source)
      const targetNode = resolveNode(e.target)
      return {
        id: String(e.id),
        source: sourceNode,
        target: targetNode,
        type: e.type || 'theme-hierarchy',
        isRootEdge: false,
      }
    })
    .filter((link) => Boolean(link.source && link.target))

  // 3. Links conectando Nós de Temas ao Nó Raiz
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

  // 4. Conectar componentes conexos (ilhas) e nós órfãos ao Nó Raiz para evitar dispersão infinita
  // Montamos adjacência para encontrar nós que têm caminho até a raiz
  const adj = new Map<string, string[]>()
  for (const n of simulationNodes) {
    adj.set(String(n.id), [])
  }
  for (const link of explicitLinks) {
    if (link.source && link.target) {
      const sId = String(link.source.id)
      const tId = String(link.target.id)
      adj.get(sId)?.push(tId)
      adj.get(tId)?.push(sId)
    }
  }
  for (const rLink of rootLinks) {
    if (rLink.target) {
      const tId = String(rLink.target.id)
      adj.get('root')?.push(tId)
      adj.get(tId)?.push('root')
    }
  }

  // BFS a partir do nó raiz para descobrir todos os nós já alcançáveis
  const reachableFromRoot = new Set<string>(['root'])
  const queue: string[] = ['root']
  while (queue.length > 0) {
    const curr = queue.shift()!
    for (const neighbor of adj.get(curr) || []) {
      if (!reachableFromRoot.has(neighbor)) {
        reachableFromRoot.add(neighbor)
        queue.push(neighbor)
      }
    }
  }

  // Para cada componente não alcançável a partir da raiz, conecta seu primeiro nó (ou todos os isolados) à raiz
  const islandLinks: any[] = []
  const visitedIslands = new Set<string>()

  for (const node of inputNodes) {
    const nId = String(node.id)
    if (!reachableFromRoot.has(nId) && !visitedIslands.has(nId)) {
      // Conectar este nó representante da ilha ao nó raiz
      islandLinks.push({
        id: `root-island-${node.id}`,
        source: rootNode,
        target: nodeMap.get(nId),
        type: 'root-island',
        isRootEdge: true,
      })

      // Marcar toda a ilha como visitada e conectada
      const expandIsland = (startId: string) => {
        const islandQueue: string[] = [startId]
        visitedIslands.add(startId)
        reachableFromRoot.add(startId)
        while (islandQueue.length > 0) {
          const curr = islandQueue.shift()!
          for (const neighbor of adj.get(curr) || []) {
            if (!visitedIslands.has(neighbor)) {
              visitedIslands.add(neighbor)
              reachableFromRoot.add(neighbor)
              islandQueue.push(neighbor)
            }
          }
        }
      }
      expandIsland(nId)
    }
  }

  const validIslandLinks = islandLinks.filter((link) => link.target)
  const simulationLinks = [...rootLinks, ...validIslandLinks, ...explicitLinks]

  const centerX = width / 2
  const centerY = height / 2
  rootNode.x = centerX
  rootNode.y = centerY
  rootNode.fx = centerX
  rootNode.fy = centerY

  currentSimulationNodes = simulationNodes

  // ----------------------------------------------------
  // LAYOUT RADIAL HIERÁRQUICO COM EXPANSÃO PARA FORA
  // (Pai -> Filho -> Neto SEMPRE aumentam a distância do centro na mesma direção radial)
  // ----------------------------------------------------
  const visited = new Set<string>(['root'])
  const nodeRadius = new Map<string, number>()
  const nodeAngle = new Map<string, number>()
  nodeRadius.set('root', 0)
  nodeAngle.set('root', 0)

  // Nível 1: Temas distribuídos radialmente em torno do centro (R1 ~ 135px)
  const numThemes = Math.max(themeNodes.length, 1)
  const R1 = Math.min(150, Math.max(120, 105 + numThemes * 10))
  const bfsQueue: string[] = []

  themeNodes.forEach((theme, i) => {
    const tId = String(theme.id)
    const baseAngle = (2 * Math.PI * i) / numThemes - Math.PI / 2
    visited.add(tId)
    nodeRadius.set(tId, R1)
    nodeAngle.set(tId, baseAngle)
    theme.targetAngle = baseAngle
    theme.x = centerX + R1 * Math.cos(baseAngle)
    theme.y = centerY + R1 * Math.sin(baseAngle)
    bfsQueue.push(tId)
  })

  // Representantes de ilhas conectadas à raiz
  validIslandLinks.forEach((iLink, idx) => {
    const iId = String(iLink.target.id)
    if (!visited.has(iId)) {
      visited.add(iId)
      const islandAngle = ((2 * Math.PI * (idx + 0.5)) / Math.max(validIslandLinks.length, 1)) - Math.PI / 2
      const islandR = R1 + 10
      nodeRadius.set(iId, islandR)
      nodeAngle.set(iId, islandAngle)
      const targetNode = nodeMap.get(iId)
      if (targetNode) {
        targetNode.targetAngle = islandAngle
        targetNode.x = centerX + islandR * Math.cos(islandAngle)
        targetNode.y = centerY + islandR * Math.sin(islandAngle)
      }
      bfsQueue.push(iId)
    }
  })

  // BFS para posicionar todos os descendentes (Livros, Livretos, Anotações, Sub-notas)
  // Cada nível propaga na MESMA direção radial do pai e AUMENTA a distância em relação ao centro
  while (bfsQueue.length > 0) {
    const parentId = bfsQueue.shift()!
    const parentR = nodeRadius.get(parentId) ?? R1
    const parentAngle = nodeAngle.get(parentId) ?? 0

    // Vizinhos conectados diretamente que ainda não foram posicionados
    const unvisitedNeighbors = (adj.get(parentId) || []).filter((id) => !visited.has(id))
    const K = unvisitedNeighbors.length
    if (K > 0) {
      // Se houver múltiplos filhos, abre um leque estreito simétrico em torno da direção do pai
      const arcSpan = K > 1 ? Math.min(0.55, Math.max(0.2, K * 0.16)) : 0

      unvisitedNeighbors.forEach((childId, k) => {
        visited.add(childId)
        const childNode = nodeMap.get(childId)
        if (!childNode) return

        // Distância radial incremental para fora:
        // Livro/Livreto: +95px, Anotação: +75px, Nota: +85px, Pasta: +80px
        let deltaR = 95
        if (childNode.type === 'annotation') deltaR = 75
        else if (childNode.type === 'folder') deltaR = 80
        else if (childNode.type === 'note') deltaR = 85
        else if (childNode.type === 'canvas') deltaR = 85
        else if (childNode.type === 'link') deltaR = 85

        const childR = parentR + deltaR
        // Se 1 filho: EXATAMENTE no mesmo ângulo (para fora!). Se K > 1: cone estreito apontando para fora
        const childAngle = K > 1
          ? parentAngle + (k / (K - 1) - 0.5) * arcSpan
          : parentAngle

        nodeRadius.set(childId, childR)
        nodeAngle.set(childId, childAngle)
        ;(childNode as any).targetAngle = childAngle

        childNode.x = centerX + childR * Math.cos(childAngle)
        childNode.y = centerY + childR * Math.sin(childAngle)

        bfsQueue.push(childId)
      })
    }
  }

  // Nós órfãos ou avulsos (sem conexão a ninguém)
  const unassigned = inputNodes.filter((n) => !visited.has(String(n.id)))
  if (unassigned.length > 0) {
    const orphanR = R1 + 35
    unassigned.forEach((node, idx) => {
      const angle = (2 * Math.PI * idx) / unassigned.length + Math.PI / 4
      node.x = centerX + orphanR * Math.cos(angle)
      node.y = centerY + orphanR * Math.sin(angle)
      nodeRadius.set(String(node.id), orphanR)
      nodeAngle.set(String(node.id), angle)
    })
  }

  // Inicializar sementes de fase para oscilação harmônica
  simulationNodes.forEach((node, idx) => {
    node.baseX = node.x ?? centerX
    node.baseY = node.y ?? centerY
    node.currentX = node.baseX
    node.currentY = node.baseY
    const seed = ((node.rawId as number) || (typeof node.id === 'number' ? node.id : idx + 1)) * 1.61803398875
    node.phaseX = seed
    node.phaseY = seed + Math.PI / 2
  })

  // Criar Simulação de Forças D3: preserva alinhamento radial outward e previne sobreposição
  if (simulation) simulation.stop()
  simulation = d3
    .forceSimulation(simulationNodes)
    .force('x', d3.forceX((d: any) => d.baseX).strength(0.8))
    .force('y', d3.forceY((d: any) => d.baseY).strength(0.8))
    .force('collide', d3.forceCollide().radius((d: any) => getNodeRadius(d) + 12).strength(0.95))

  // 25 ticks de acomodação de colisão suave
  for (let i = 0; i < 25; ++i) {
    simulation.tick()
  }
  // Parar imediatamente para garantir fidelidade estrita à progressão radial para fora
  simulation.stop()

  const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'
  const shouldAnimate = !isTestEnv && animateTransition && persistentNodePositions.size > 0

  for (const d of simulationNodes) {
    const nKey = String(d.id)
    d.targetX = d.x ?? centerX
    d.targetY = d.y ?? centerY

    if (persistentNodePositions.has(nKey) && shouldAnimate) {
      const prev = persistentNodePositions.get(nKey)!
      d.startX = prev.x
      d.startY = prev.y
      d.baseX = prev.x
      d.baseY = prev.y
      d.currentX = prev.x
      d.currentY = prev.y
    } else {
      d.startX = d.targetX
      d.startY = d.targetY
      d.baseX = d.targetX
      d.baseY = d.targetY
      d.currentX = d.targetX
      d.currentY = d.targetY
      persistentNodePositions.set(nKey, { x: d.startX, y: d.startY })
    }
  }

  if (shouldAnimate) {
    transitionStartTime = typeof performance !== 'undefined' ? performance.now() : Date.now()
    isTransitioning = true
  } else {
    isTransitioning = false
  }

  // Renderizar Links (Arestas)
  const linkGroup = g.select('.links-group')
  const links = linkGroup
    .selectAll<SVGLineElement, any>('line')
    .data(simulationLinks, (d: any) => d.id)
    .join('line')
    .attr('data-edge-id', (d: any) => d.id)
    .attr('data-edge-type', (d: any) => d.type)
    .attr('x1', (d: any) => d.source.currentX ?? d.source.x ?? centerX)
    .attr('y1', (d: any) => d.source.currentY ?? d.source.y ?? centerY)
    .attr('x2', (d: any) => d.target.currentX ?? d.target.x ?? centerX)
    .attr('y2', (d: any) => d.target.currentY ?? d.target.y ?? centerY)
    .attr('stroke', (d: any) => {
      if (d.isRootEdge) {
        return isSepiaMode.value
          ? 'rgba(217, 119, 6, 0.40)'
          : isLightMode.value
          ? 'rgba(229, 123, 85, 0.40)'
          : 'rgba(229, 123, 85, 0.30)'
      }
      switch (d.type) {
        case 'book-theme':
          return isLightMode.value ? 'rgba(59, 130, 246, 0.40)' : 'rgba(59, 130, 246, 0.35)'
        case 'annotation-book':
        case 'annotation-theme':
          return isLightMode.value ? 'rgba(245, 158, 11, 0.45)' : 'rgba(245, 158, 11, 0.35)'
        case 'note-folder':
        case 'canvas-folder':
          return isLightMode.value ? 'rgba(217, 119, 6, 0.48)' : 'rgba(245, 158, 11, 0.42)'
        case 'note-book':
        case 'note-note':
          return isLightMode.value ? 'rgba(99, 102, 241, 0.45)' : 'rgba(99, 102, 241, 0.35)'
        case 'canvas-note':
        case 'note-canvas':
          return isLightMode.value ? 'rgba(16, 185, 129, 0.45)' : 'rgba(16, 185, 129, 0.35)'
        case 'note-theme':
          return isLightMode.value ? 'rgba(167, 139, 250, 0.45)' : 'rgba(167, 139, 250, 0.35)'
        case 'note-link':
        case 'canvas-link':
        case 'link-folder':
          return isLightMode.value ? 'rgba(6, 182, 212, 0.50)' : 'rgba(6, 182, 212, 0.40)'
        default:
          return isSepiaMode.value
            ? 'rgba(120, 108, 94, 0.20)'
            : isLightMode.value
            ? 'rgba(0, 0, 0, 0.12)'
            : 'rgba(255, 255, 255, 0.12)'
      }
    })
    .attr('stroke-width', (d: any) => (d.isRootEdge ? 1.4 : 1.2))
    .attr('stroke-dasharray', (d: any) => {
      if (d.type === 'book-theme' || d.type === 'annotation-theme' || d.type === 'note-theme' || d.type === 'note-folder' || d.type === 'canvas-folder' || d.type === 'link-folder') return '3,3'
      if (d.isRootEdge) return '4,4'
      return 'none'
    })
    .attr('stroke-opacity', 1)

  // Renderizar Nós
  const nodeGroup = g.select('.nodes-group')
  const nodesSelection = nodeGroup
    .selectAll<SVGGElement, any>('g.node')
    .data(simulationNodes, (d: any) => String(d.id))
    .join('g')
    .attr('class', 'node cursor-pointer')

  nodesSelection.html('') // Limpar renderização anterior

  // ----------------------------------------------------
  // A. NÓS DE LIVROS (TIPO 'book')
  // ----------------------------------------------------
  const bookNodesSelection = nodesSelection.filter((d: any) => d.type === 'book')

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

  bookNodesSelection.each(function (d: any) {
    const nodeEl = d3.select(this)
    nodeEl.append('title').text(d.fullTitle || d.title || d.name || '')
    const rawBookId = d.rawId || (typeof d.id === 'number' ? d.id : parseInt(String(d.id).replace('book-', ''), 10))
    const coverUrl = resolveBookCover({
      coverPath: d.coverPath,
      bookId: rawBookId,
      filePath: d.filePath,
      title: d.fullTitle || d.title || d.name,
    })

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

      img.on('error', function () {
        d3.select(this).remove()
      })
    }
  })

  bookNodesSelection
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', 44)
    .attr('fill', isSepiaMode.value ? '#2C2621' : (isLightMode.value ? '#0F172A' : '#F1F5F9'))
    .attr('font-size', '11px')
    .attr('font-weight', '600')
    .attr('font-family', 'system-ui, -apple-system, sans-serif')
    .attr('pointer-events', 'none')
    .text((d: any) => getTruncatedTitle(d.fullTitle || d.name, 12))

  // ----------------------------------------------------
  // B. NÓS DE ANOTAÇÕES (TIPO 'annotation')
  // ----------------------------------------------------
  const annotationNodesSelection = nodesSelection.filter((d: any) => d.type === 'annotation')

  annotationNodesSelection
    .append('circle')
    .attr('r', 14)
    .attr('fill', isSepiaMode.value ? '#FEF3C7' : (isLightMode.value ? '#FFFBEB' : '#2D2312'))
    .attr('stroke', '#F59E0B')
    .attr('stroke-width', 1.5)
    .attr('class', 'transition-all duration-300 shadow-md')

  annotationNodesSelection.each(function (d: any) {
    const nodeEl = d3.select(this)
    nodeEl.append('title').text(d.fullTitle || d.title || d.name || '')
    const iconG = nodeEl
      .append('g')
      .attr('class', 'annotation-icon')
      .attr('pointer-events', 'none')
      .attr('transform', 'translate(-6, -6) scale(0.5)')
      .attr('fill', 'none')
      .attr('stroke', '#F59E0B')
      .attr('stroke-width', '2')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')

    iconG.html(`<path d="m18 2 4 4-12 12H6v-4L18 2Z"/><path d="m14 6 4 4"/>`)
  })

  annotationNodesSelection
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', 26)
    .attr('fill', isSepiaMode.value ? '#854D0E' : (isLightMode.value ? '#B45309' : '#FBBF24'))
    .attr('font-size', '10px')
    .attr('font-weight', '500')
    .attr('font-family', 'system-ui, -apple-system, sans-serif')
    .attr('pointer-events', 'none')
    .text((d: any) => getTruncatedTitle(d.title || d.name, 10))

  // ----------------------------------------------------
  // C. NÓS DE NOTAS LIVRES (TIPO 'note')
  // ----------------------------------------------------
  const noteNodesSelection = nodesSelection.filter((d: any) => d.type === 'note')

  noteNodesSelection
    .append('circle')
    .attr('r', 16)
    .attr('fill', (d: any) => {
      if (d.isDrawing) return isSepiaMode.value ? '#F3E8FF' : (isLightMode.value ? '#FAF5FF' : '#2A1B3D')
      if (d.isHtml) return isSepiaMode.value ? '#FEF3C7' : (isLightMode.value ? '#FFFBEB' : '#2D2312')
      return isSepiaMode.value ? '#EEF2FF' : (isLightMode.value ? '#F5F3FF' : '#1E1E38')
    })
    .attr('stroke', (d: any) => {
      if (d.isDrawing) return '#8B5CF6'
      if (d.isHtml) return '#F59E0B'
      return '#6366F1'
    })
    .attr('stroke-width', 1.5)
    .attr('class', 'transition-all duration-300 shadow-md')

  noteNodesSelection.each(function (d: any) {
    const nodeEl = d3.select(this)
    nodeEl.append('title').text(resolveNoteTitle(d.fullTitle || d.title || d.name, d.description))
    const iconG = nodeEl
      .append('g')
      .attr('class', 'note-icon')
      .attr('pointer-events', 'none')
      .attr('transform', 'translate(-6, -6) scale(0.5)')
      .attr('fill', 'none')
      .attr('stroke', d.isDrawing ? '#8B5CF6' : (d.isHtml ? '#F59E0B' : '#6366F1'))
      .attr('stroke-width', '2')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')

    if (d.isDrawing) {
      iconG.html(`<path d="m18 2 4 4-12 12H6v-4L18 2Z"/><path d="m14 6 4 4"/>`)
    } else if (d.isHtml) {
      iconG.html(`<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`)
    } else {
      iconG.html(`<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>`)
    }
  })

  noteNodesSelection
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', 28)
    .attr('fill', (d: any) => {
      if (d.isDrawing) return isSepiaMode.value ? '#6B21A8' : (isLightMode.value ? '#7E22CE' : '#C084FC')
      if (d.isHtml) return isSepiaMode.value ? '#854D0E' : (isLightMode.value ? '#B45309' : '#FBBF24')
      return isSepiaMode.value ? '#3730A3' : (isLightMode.value ? '#4F46E5' : '#818CF8')
    })
    .attr('font-size', '10px')
    .attr('font-weight', '500')
    .attr('font-family', 'system-ui, -apple-system, sans-serif')
    .attr('pointer-events', 'none')
    .text((d: any) => getTruncatedTitle(resolveNoteTitle(d.title || d.name, d.description), 14))

  // ----------------------------------------------------
  // D. NÓS DE QUADROS (TIPO 'canvas')
  // ----------------------------------------------------
  const canvasNodesSelection = nodesSelection.filter((d: any) => d.type === 'canvas')

  canvasNodesSelection
    .append('rect')
    .attr('x', -16)
    .attr('y', -16)
    .attr('width', 32)
    .attr('height', 32)
    .attr('rx', 7)
    .attr('ry', 7)
    .attr('fill', isSepiaMode.value ? '#ECFDF5' : (isLightMode.value ? '#F0FDF4' : '#12261E'))
    .attr('stroke', '#10B981')
    .attr('stroke-width', 1.5)
    .attr('class', 'transition-all duration-300 shadow-md')

  canvasNodesSelection.each(function (d: any) {
    const nodeEl = d3.select(this)
    nodeEl.append('title').text(d.fullTitle || d.title || d.name || '')
    const iconG = nodeEl
      .append('g')
      .attr('class', 'canvas-icon')
      .attr('pointer-events', 'none')
      .attr('transform', 'translate(-6, -6) scale(0.5)')
      .attr('fill', 'none')
      .attr('stroke', '#10B981')
      .attr('stroke-width', '2')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')

    iconG.html(`<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>`)
  })

  canvasNodesSelection
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', 28)
    .attr('fill', isSepiaMode.value ? '#065F46' : (isLightMode.value ? '#047857' : '#34D399'))
    .attr('font-size', '10px')
    .attr('font-weight', '500')
    .attr('font-family', 'system-ui, -apple-system, sans-serif')
    .attr('pointer-events', 'none')
    .text((d: any) => getTruncatedTitle(d.title || d.name, 12))

  // ----------------------------------------------------
  // E. NÓS DE PASTAS (TIPO 'folder')
  // ----------------------------------------------------
  const folderNodesSelection = nodesSelection.filter((d: any) => d.type === 'folder')

  folderNodesSelection
    .append('rect')
    .attr('x', -18)
    .attr('y', -16)
    .attr('width', 36)
    .attr('height', 32)
    .attr('rx', 8)
    .attr('ry', 8)
    .attr('fill', isSepiaMode.value ? '#FEF3C7' : (isLightMode.value ? '#FFFBEB' : '#271F0C'))
    .attr('stroke', '#F59E0B')
    .attr('stroke-width', 1.8)
    .attr('class', 'transition-all duration-300 shadow-md')

  folderNodesSelection.each(function (d: any) {
    const nodeEl = d3.select(this)
    nodeEl.append('title').text(d.fullTitle || d.title || d.name || '')
    const iconG = nodeEl
      .append('g')
      .attr('class', 'folder-icon')
      .attr('pointer-events', 'none')
      .attr('transform', 'translate(-7, -7) scale(0.58)')
      .attr('fill', 'none')
      .attr('stroke', '#F59E0B')
      .attr('stroke-width', '2')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')

    iconG.html(`<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>`)
  })

  folderNodesSelection
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', 28)
    .attr('fill', isSepiaMode.value ? '#92400E' : (isLightMode.value ? '#B45309' : '#FBBF24'))
    .attr('font-size', '10px')
    .attr('font-weight', '600')
    .attr('font-family', 'system-ui, -apple-system, sans-serif')
    .attr('pointer-events', 'none')
    .text((d: any) => getTruncatedTitle(d.title || d.name, 12))

  // ----------------------------------------------------
  // F. NÓS DE LINKS WEB (TIPO 'link')
  // ----------------------------------------------------
  const linkNodesSelection = nodesSelection.filter((d: any) => d.type === 'link')

  linkNodesSelection
    .append('rect')
    .attr('x', -16)
    .attr('y', -16)
    .attr('width', 32)
    .attr('height', 32)
    .attr('rx', 16)
    .attr('fill', isSepiaMode.value ? '#ECFEFF' : (isLightMode.value ? '#F0FDFA' : '#082F49'))
    .attr('stroke', '#06B6D4')
    .attr('stroke-width', 1.6)
    .attr('class', 'transition-all duration-300 shadow-md')

  linkNodesSelection.each(function (d: any) {
    const nodeEl = d3.select(this)
    nodeEl.append('title').text(d.fullTitle || d.title || d.name || d.url || '')
    const iconG = nodeEl
      .append('g')
      .attr('class', 'link-icon')
      .attr('pointer-events', 'none')
      .attr('transform', 'translate(-7, -7) scale(0.58)')
      .attr('fill', 'none')
      .attr('stroke', '#06B6D4')
      .attr('stroke-width', '2')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')

    iconG.html(`<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>`)
  })

  linkNodesSelection
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', 28)
    .attr('fill', isSepiaMode.value ? '#155E75' : (isLightMode.value ? '#0E7490' : '#38BDF8'))
    .attr('font-size', '10px')
    .attr('font-weight', '500')
    .attr('font-family', 'system-ui, -apple-system, sans-serif')
    .attr('pointer-events', 'none')
    .text((d: any) => getTruncatedTitle(d.title || d.name || d.domain || 'Link', 12))

  // ----------------------------------------------------
  // G. NÓS DE TEMAS & NÓ RAIZ (TIPO 'theme' / isRoot)
  // ----------------------------------------------------
  const themeAndRootNodesSelection = nodesSelection.filter(
    (d: any) => d.type === 'theme' || d.isRoot
  )

  themeAndRootNodesSelection
    .append('circle')
    .attr('r', (d: any) => getNodeRadius(d) + 4)
    .attr('fill', 'none')
    .attr('stroke', (d: any) => getThemeNodeOuterRingStroke(d.color, d.isRoot))
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', (d: any) => (d.isRoot ? 'none' : '2,2'))
    .attr('opacity', 0.8)

  themeAndRootNodesSelection
    .append('circle')
    .attr('r', (d: any) => getNodeRadius(d))
    .attr('fill', (d: any) => getThemeNodeFill(d.color, d.isRoot))
    .attr('stroke', (d: any) => getThemeNodeStroke(d.color, d.isRoot))
    .attr('stroke-width', (d: any) => (d.isRoot ? 2 : 1.5))
    .attr('class', 'transition-all duration-300 shadow-md')

  themeAndRootNodesSelection
    .append('circle')
    .attr('r', (d: any) => Math.max(getNodeRadius(d) - 5, 12))
    .attr('fill', 'none')
    .attr('stroke', (d: any) => getThemeNodeInnerBorderStroke(d.color, d.isRoot))
    .attr('stroke-width', 1)
    .attr('pointer-events', 'none')

  themeAndRootNodesSelection.each(function (d: any) {
    const nodeEl = d3.select(this)
    if (!d.isRoot) {
      nodeEl.append('title').text(d.fullTitle || d.title || d.name || '')
    }
    const iconMarkup = getThemeIconSvg(d.name, (d as any).category, d.isRoot)
    const iconColor = getThemeNodeIconColor(d.color, d.isRoot)
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

  themeAndRootNodesSelection
    .filter((d: any) => !d.isRoot)
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', (d: any) => getNodeRadius(d) + 18)
    .attr('fill', (d: any) => getThemeNodeTextColor(d.color, d.isRoot))
    .attr('font-size', '12px')
    .attr('font-weight', '600')
    .attr('font-family', 'system-ui, -apple-system, sans-serif')
    .attr('pointer-events', 'none')
    .text((d: any) => d.name)

  // ----------------------------------------------------
  // INTERAÇÕES, ARESTA MAGNÉTICA, TOOLTIPS & EVENTOS
  // ----------------------------------------------------
  let dragSourceNode: any = null
  let isDraggingWire = false
  let snapTargetNode: any = null
  let startClientPos = { x: 0, y: 0 }
  let didJustDrag = false
  let didEmitOnPointerUp = false // flag para evitar dupla emissão (pointerup + click)

  const tempWire = g.select<SVGLineElement>('.drag-wire')
  const tempWireTip = g.select<SVGCircleElement>('.drag-wire-tip')

  const onWindowPointerMove = (e: PointerEvent) => {
    if (!dragSourceNode || !svgRef.value) return

    const dx = e.clientX - startClientPos.x
    const dy = e.clientY - startClientPos.y
    const dist = Math.hypot(dx, dy)

    if (!isDraggingWire && dist > 6) {
      isDraggingWire = true
      didJustDrag = true
      tempWire.style('display', null)
      tempWireTip.style('display', null)
    }

    if (isDraggingWire) {
      e.preventDefault()
      const rect = svgRef.value.getBoundingClientRect()
      const mouseCanvasX = e.clientX - rect.left
      const mouseCanvasY = e.clientY - rect.top
      const transform = d3.zoomTransform(svgRef.value)
      const [svgX, svgY] = transform.invert([mouseCanvasX, mouseCanvasY])

      const srcX = dragSourceNode.currentX ?? dragSourceNode.x
      const srcY = dragSourceNode.currentY ?? dragSourceNode.y

      const currentScale = transform.k || 1
      snapTargetNode = null
      let closestDist = Infinity

      for (const target of simulationNodes) {
        if (target.id === dragSourceNode.id || target.isRoot) continue
        const tX = target.currentX ?? target.x ?? 0
        const tY = target.currentY ?? target.y ?? 0
        const d = Math.hypot(svgX - tX, svgY - tY)
        const snapThreshold = Math.max(getNodeRadius(target) + 36, 65 / currentScale)
        if (d < snapThreshold && d < closestDist) {
          closestDist = d
          snapTargetNode = target
        }
      }

      nodesSelection.classed('node-snap-highlight', (d: any) => Boolean(snapTargetNode && d.id === snapTargetNode.id))

      let endX = svgX
      let endY = svgY
      if (snapTargetNode) {
        endX = snapTargetNode.currentX ?? snapTargetNode.x
        endY = snapTargetNode.currentY ?? snapTargetNode.y
      }

      tempWire
        .attr('x1', srcX)
        .attr('y1', srcY)
        .attr('x2', endX)
        .attr('y2', endY)

      tempWireTip
        .attr('cx', endX)
        .attr('cy', endY)
    }
  }

  const onWindowPointerUp = (e: PointerEvent) => {
    window.removeEventListener('pointermove', onWindowPointerMove)
    window.removeEventListener('pointerup', onWindowPointerUp)

    if (isDraggingWire) {
      tempWire.style('display', 'none')
      tempWireTip.style('display', 'none')
      nodesSelection.classed('node-snap-highlight', false)

      let finalTarget = snapTargetNode
      // Fallback de snap magnético no momento do release caso o ponteiro esteja no limiar do nó
      if (!finalTarget && dragSourceNode && svgRef.value) {
        const rect = svgRef.value.getBoundingClientRect()
        const mouseCanvasX = e.clientX - rect.left
        const mouseCanvasY = e.clientY - rect.top
        const transform = d3.zoomTransform(svgRef.value)
        const [svgX, svgY] = transform.invert([mouseCanvasX, mouseCanvasY])
        const currentScale = transform.k || 1
        let closestDist = Infinity

        for (const target of simulationNodes) {
          if (target.id === dragSourceNode.id || target.isRoot) continue
          const tX = target.currentX ?? target.x ?? 0
          const tY = target.currentY ?? target.y ?? 0
          const d = Math.hypot(svgX - tX, svgY - tY)
          const threshold = Math.max(getNodeRadius(target) + 40, 75 / currentScale)
          if (d < threshold && d < closestDist) {
            closestDist = d
            finalTarget = target
          }
        }
      }

      if (finalTarget && finalTarget.id !== dragSourceNode.id) {
        let edgeType = 'theme-hierarchy'
        const isSrcBook = dragSourceNode.type === 'book'
        const isTgtBook = finalTarget.type === 'book'
        const isSrcFolder = dragSourceNode.type === 'folder'
        const isTgtFolder = finalTarget.type === 'folder'

        if (isSrcBook && isTgtBook) edgeType = 'book-hierarchy'
        else if (isSrcBook || isTgtBook) edgeType = 'book-theme'
        else if (isSrcFolder || isTgtFolder) {
          if (dragSourceNode.type === 'note' || finalTarget.type === 'note') edgeType = 'note-folder'
          else if (dragSourceNode.type === 'canvas' || finalTarget.type === 'canvas') edgeType = 'canvas-folder'
          else edgeType = 'theme-hierarchy'
        }

        const optimisticEdgeId = `edge-live-${dragSourceNode.id}-${finalTarget.id}`
        const alreadyExists = allEdges.value.some((e) => {
          const s = String(e.source)
          const t = String(e.target)
          const ns = String(dragSourceNode.id)
          const nt = String(finalTarget.id)
          return (s === ns && t === nt) || (s === nt && t === ns)
        })

        if (!alreadyExists) {
          skipNextWatch = true
          localCustomEdges.value.push({
            id: optimisticEdgeId,
            source: dragSourceNode.id,
            target: finalTarget.id,
            type: edgeType,
          })
          initGraph(true)
        }

        emit('connectNodes', {
          sourceId: dragSourceNode.id,
          targetId: finalTarget.id,
          sourceRawId: dragSourceNode.rawId,
          targetRawId: finalTarget.rawId,
          sourceType: dragSourceNode.type,
          targetType: finalTarget.type,
        })
        emit('connect-nodes' as any, {
          sourceId: dragSourceNode.id,
          targetId: finalTarget.id,
          sourceRawId: dragSourceNode.rawId,
          targetRawId: finalTarget.rawId,
          sourceType: dragSourceNode.type,
          targetType: finalTarget.type,
        })
      }
      setTimeout(() => {
        didJustDrag = false
      }, 60)
    } else {
      // Clique simples (sem drag de aresta): disparar selectNode diretamente no pointerup.
      // Isso é mais confiável do que o evento 'click' do DOM, que pode ser suprimido
      // em WebView2/Chromium quando outro handler chama stopPropagation ou preventDefault.
      const clickedNode = dragSourceNode
      if (clickedNode && !didJustDrag) {
        didEmitOnPointerUp = true
        emitSelectForNode(clickedNode)
      }
    }

    dragSourceNode = null
    isDraggingWire = false
    snapTargetNode = null
  }

  // Helper para emitir selectNode a partir de um dado nó D3
  const emitSelectForNode = (d: any) => {
    if (d.isRoot) {
      emit('selectNode', rootNode)
    } else {
      const originalNode = props.nodes.find((n) => String(n.id) === String(d.id))
      emit('selectNode', originalNode ?? d)
    }
  }

  nodesSelection.on('pointerdown', (event, d) => {
    if (event.button !== 0) return
    event.stopPropagation()
    // NÃO chamar event.preventDefault() — em WebView2/Chromium (Tauri) isso suprime o 'click'
    dragSourceNode = d
    isDraggingWire = false
    snapTargetNode = null
    didJustDrag = false
    didEmitOnPointerUp = false
    startClientPos = { x: event.clientX, y: event.clientY }

    window.addEventListener('pointermove', onWindowPointerMove, { passive: false })
    window.addEventListener('pointerup', onWindowPointerUp)
  })

  nodesSelection.on('mousedown', (event) => {
    event.stopPropagation()
  })

  // O evento 'click' serve como fallback secundário (ex: touch sem pointer events).
  // Se o pointerup já emitiu (didEmitOnPointerUp), não emitir novamente.
  nodesSelection.on('click', (event, d) => {
    event.stopPropagation()
    if (didJustDrag || didEmitOnPointerUp) return
    emitSelectForNode(d)
  })

  // Destaque e Tooltip no Hover
  nodesSelection
    .on('mouseenter', (event, d) => {
      if (!d.isRoot) {
        hoveredNode.value = d
        tooltipPos.value = { x: event.clientX, y: event.clientY }
      }

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
    .on('mousemove', (event) => {
      tooltipPos.value = { x: event.clientX, y: event.clientY }
    })
    .on('mouseleave', () => {
      hoveredNode.value = null
      links
        .attr('stroke', (d: any) => {
          if (d.isRootEdge) {
            return isSepiaMode.value
              ? 'rgba(217, 119, 6, 0.40)'
              : 'rgba(229, 123, 85, 0.30)'
          }
          switch (d.type) {
            case 'book-theme':
              return isLightMode.value ? 'rgba(59, 130, 246, 0.40)' : 'rgba(59, 130, 246, 0.35)'
            case 'annotation-book':
            case 'annotation-theme':
              return isLightMode.value ? 'rgba(245, 158, 11, 0.45)' : 'rgba(245, 158, 11, 0.35)'
            case 'note-book':
            case 'note-note':
              return isLightMode.value ? 'rgba(99, 102, 241, 0.45)' : 'rgba(99, 102, 241, 0.35)'
            case 'canvas-note':
            case 'note-canvas':
              return isLightMode.value ? 'rgba(16, 185, 129, 0.45)' : 'rgba(16, 185, 129, 0.35)'
            case 'note-link':
            case 'canvas-link':
            case 'link-folder':
              return isLightMode.value ? 'rgba(6, 182, 212, 0.50)' : 'rgba(6, 182, 212, 0.40)'
            default:
              return isSepiaMode.value
                ? 'rgba(120, 108, 94, 0.20)'
                : isLightMode.value
                ? 'rgba(0, 0, 0, 0.12)'
                : 'rgba(255, 255, 255, 0.12)'
          }
        })
        .attr('stroke-width', (d: any) => (d.isRootEdge ? 1.4 : 1.2))
        .attr('stroke-opacity', 1)
    })

  // Atualização de posições de nós e arestas sincronizadas
  const updatePositions = () => {
    links
      .attr('x1', (d: any) => {
        const val = d.source.currentX ?? d.source.baseX ?? d.source.x
        return Number.isFinite(val) ? val : 0
      })
      .attr('y1', (d: any) => {
        const val = d.source.currentY ?? d.source.baseY ?? d.source.y
        return Number.isFinite(val) ? val : 0
      })
      .attr('x2', (d: any) => {
        const val = d.target.currentX ?? d.target.baseX ?? d.target.x
        return Number.isFinite(val) ? val : 0
      })
      .attr('y2', (d: any) => {
        const val = d.target.currentY ?? d.target.baseY ?? d.target.y
        return Number.isFinite(val) ? val : 0
      })

    nodesSelection.attr('transform', (d: any) => {
      const cx = Number.isFinite(d.currentX) ? d.currentX : (Number.isFinite(d.baseX) ? d.baseX : (Number.isFinite(d.x) ? d.x : (width / 2)))
      const cy = Number.isFinite(d.currentY) ? d.currentY : (Number.isFinite(d.baseY) ? d.baseY : (Number.isFinite(d.y) ? d.y : (height / 2)))
      return `translate(${cx},${cy})`
    })
  }

  // Animação contínua de micro-balanço suave e interpolação lenta de transição
  const startFloatingAnimation = () => {
    if (animFrameId) cancelAnimationFrame(animFrameId)

    const tickFloating = (time: number) => {
      const speed = 0.0016
      const amplitude = 2.8

      let ease = 1
      if (isTransitioning) {
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
        const elapsed = now - transitionStartTime
        const progress = Math.min(1, Math.max(0, elapsed / TRANSITION_DURATION))
        // easeInOutCubic: aceleração suave, deslocamento lento e desaceleração gradual e orgânica
        ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2
        if (progress >= 1) {
          isTransitioning = false
        }
      }

      for (const d of simulationNodes) {
        if (isTransitioning && d.startX !== undefined && d.targetX !== undefined && d.startY !== undefined && d.targetY !== undefined) {
          d.baseX = d.startX + (d.targetX - d.startX) * ease
          d.baseY = d.startY + (d.targetY - d.startY) * ease
        } else if (d.targetX !== undefined) {
          d.baseX = d.targetX
          d.baseY = d.targetY
        }

        if (d.isRoot) {
          d.currentX = d.baseX ?? d.x
          d.currentY = d.baseY ?? d.y
        } else {
          const offX = Math.sin(time * speed + (d.phaseX || 0)) * amplitude
          const offY = Math.cos(time * speed + (d.phaseY || 0)) * amplitude
          d.currentX = (d.baseX ?? d.x ?? 0) + offX
          d.currentY = (d.baseY ?? d.y ?? 0) + offY
        }

        if (d.id !== undefined && d.id !== null) {
          persistentNodePositions.set(String(d.id), {
            x: d.baseX ?? d.x ?? 0,
            y: d.baseY ?? d.y ?? 0,
          })
        }
      }

      updatePositions()
      animFrameId = requestAnimationFrame(tickFloating)
    }

    animFrameId = requestAnimationFrame(tickFloating)
  }

  updatePositions()
  startFloatingAnimation()

  nextTick(() => {
    fitToScreen(shouldAnimate, shouldAnimate ? TRANSITION_DURATION : 500)
  })
}

let resizeObserver: ResizeObserver | null = null
let skipNextWatch = false

watch(
  () => [props.nodes, allEdges.value, currentSearchQuery.value],
  () => {
    if (skipNextWatch) {
      skipNextWatch = false
      return
    }
    initGraph(true)
  },
  { deep: true }
)

watch(
  () => effectiveTheme.value,
  () => {
    initGraph(false)
  }
)

const handleNativeWheel = (e: WheelEvent) => {
  e.stopPropagation()
  if (props.isCompact && !e.ctrlKey) {
    if (e.cancelable) e.preventDefault()
  }
}

onMounted(() => {
  initGraph(false)
  nextTick(() => {
    fitToScreen(false)
  })
  if (svgRef.value) {
    svgRef.value.addEventListener('wheel', handleNativeWheel, { passive: false })
  }
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      if (containerRef.value) {
        fitToScreen(true)
      }
    })
    resizeObserver.observe(containerRef.value)
  }
})

onBeforeUnmount(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId)
  if (simulation) simulation.stop()
  if (svgRef.value) {
    svgRef.value.removeEventListener('wheel', handleNativeWheel)
  }
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<style scoped>
:deep(.node-snap-highlight circle),
:deep(.node-snap-highlight rect) {
  stroke: #E57B55 !important;
  stroke-width: 3px !important;
  filter: drop-shadow(0 0 10px rgba(229, 123, 85, 0.95)) !important;
  transition: all 0.15s ease-out;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
