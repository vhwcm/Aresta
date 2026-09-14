<template>
  <div class="relative w-full h-full overflow-hidden bg-bgDarker select-none" ref="containerRef">
    <!-- SVG do Grafo de Conhecimento D3 -->
    <svg ref="svgRef" class="w-full h-full cursor-grab active:cursor-grabbing"></svg>



    <!-- Tooltip Flutuante de Detalhes do Nó -->
    <div
      v-if="hoveredNode"
      class="absolute z-20 pointer-events-none p-3 rounded-xl bg-bgPanel/95 backdrop-blur-md border border-divider shadow-2xl text-xs font-interface max-w-xs transition-opacity duration-150 animate-in fade-in"
      :style="{ left: tooltipPos.x + 15 + 'px', top: tooltipPos.y + 15 + 'px' }"
    >
      <div class="flex items-center gap-1.5 mb-1">
        <span
          class="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded tracking-wider"
          :class="hoveredNode.kind === 'canvas' ? 'bg-accent/20 text-accent' : (hoveredNode.kind === 'folder' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400')"
        >
          {{ hoveredNode.kind === 'canvas' ? 'Quadro' : (hoveredNode.kind === 'folder' ? 'Pasta' : 'Nota') }}
        </span>
        <span v-if="hoveredNode.folder" class="text-[10px] text-textSecondary truncate">
          📁 {{ hoveredNode.folder }}
        </span>
      </div>

      <h4 class="font-semibold text-textPrimary text-sm line-clamp-1">
        {{ hoveredNode.title }}
      </h4>

      <p v-if="hoveredNode.description" class="text-[11px] text-textSecondary mt-1 line-clamp-2">
        {{ hoveredNode.description }}
      </p>

      <div v-if="hoveredNode.tags && hoveredNode.tags.length > 0" class="flex flex-wrap gap-1 mt-2">
        <span
          v-for="t in hoveredNode.tags"
          :key="t"
          class="text-[9px] px-1.5 py-0.2 rounded bg-bgRoot text-textSecondary border border-divider"
        >
          #{{ t }}
        </span>
      </div>

      <p class="text-[9px] text-accent/80 mt-2 font-mono">
        💡 Clique para abrir
      </p>
    </div>

    <!-- Estado Vazio se não houver nós -->
    <div
      v-if="nodes.length === 0"
      class="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
    >
      <div class="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-2xl mb-4">
        🕸️
      </div>
      <h3 class="text-base font-semibold text-textPrimary">Grafo de Conhecimento Vazio</h3>
      <p class="text-xs text-textSecondary max-w-sm mt-1">
        Crie seu primeiro quadro ou nota para vê-los se interconectarem dinamicamente neste grafo.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as d3 from 'd3'
import type { CanvasSummary } from '~/interfaces/canvas'
import type { NoteItem } from '~/interfaces/note'

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string
  rawId: string
  title: string
  kind: 'canvas' | 'note' | 'folder'
  description?: string
  folder?: string | null
  tags?: string[]
  rawNote?: NoteItem
  color: string
  radius: number
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode
  target: string | GraphNode
  type: 'embed' | 'folder' | 'tag'
}

const props = defineProps<{
  canvases: CanvasSummary[]
  notes: NoteItem[]
  searchQuery?: string
  activeFolder?: string | null
  activeTag?: string | null
}>()

const emit = defineEmits<{
  (_e: 'select-canvas', _id: string): void
  (_e: 'select-note', _note: NoteItem): void
  (_e: 'select-folder', _folder: string): void
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)

const hoveredNode = ref<GraphNode | null>(null)
const tooltipPos = ref({ x: 0, y: 0 })

const canvasesCount = computed(() => props.canvases.length)
const notesCount = computed(() => props.notes.length)

// Construção de Nós do Grafo
const nodes = computed<GraphNode[]>(() => {
  const list: GraphNode[] = []

  for (const c of props.canvases) {
    list.push({
      id: `canvas-${c.id}`,
      rawId: c.id,
      title: c.title || 'Quadro sem título',
      kind: 'canvas',
      description: c.description || undefined,
      folder: c.folder,
      tags: c.tags || [],
      color: '#E57B55', // Laranja Aresta
      radius: 18
    })
  }

  for (const n of props.notes) {
    list.push({
      id: `note-${n.id}`,
      rawId: n.id,
      title: n.title || 'Nota sem título',
      kind: 'note',
      description: n.content ? n.content.substring(0, 100) : undefined,
      folder: n.folder,
      tags: n.tags || [],
      rawNote: n,
      color: '#6366F1', // Índigo / Violeta
      radius: 14
    })
  }

  // 3. Criação de Nós de Pastas
  const foldersSet = new Set<string>()
  for (const c of props.canvases) {
    if (c.folder && c.folder.trim()) foldersSet.add(c.folder.trim())
  }
  for (const n of props.notes) {
    if (n.folder && n.folder.trim()) foldersSet.add(n.folder.trim())
  }

  for (const f of foldersSet) {
    list.push({
      id: `folder-${f}`,
      rawId: f,
      title: f,
      kind: 'folder',
      description: `Pasta de notas e quadros`,
      color: '#F59E0B', // Âmbar
      radius: 16
    })
  }

  return list
})

// Construção de Conexões / Arestas (Links)
const links = computed<GraphLink[]>(() => {
  const result: GraphLink[] = []
  const nodeMap = new Map<string, GraphNode>()
  for (const n of nodes.value) {
    nodeMap.set(n.id, n)
  }

  const existingPairs = new Set<string>()
  const addLink = (source: string, target: string, type: 'embed' | 'folder' | 'tag') => {
    if (source === target) return
    const key1 = `${source}---${target}`
    const key2 = `${target}---${source}`
    if (existingPairs.has(key1) || existingPairs.has(key2)) return
    existingPairs.add(key1)
    existingPairs.add(key2)
    result.push({ source, target, type })
  }

  // 1. Conexões por Notas embutidas em Quadros (Canvas -> Note)
  for (const c of props.canvases) {
    const noteIds = c.noteIds || []
    const canvasKey = `canvas-${c.id}`
    for (const noteId of noteIds) {
      const noteKey = `note-${noteId}`
      if (nodeMap.has(canvasKey) && nodeMap.has(noteKey)) {
        addLink(canvasKey, noteKey, 'embed')
      }
    }
  }

  // 2. Conexões por Links registrados na Nota (NoteLink) e Embeds em Markdown
  const processNoteLinks = (n: NoteItem, noteKey: string) => {
    const noteLinks = Array.isArray(n.links) ? n.links : []
    for (const l of noteLinks) {
      const prefix = l.targetType === 'CANVAS' ? 'canvas' : (l.targetType === 'NOTE' ? 'note' : null)
      if (!prefix) continue
      const targetKey = `${prefix}-${l.targetId}`
      if (nodeMap.has(targetKey)) {
        addLink(noteKey, targetKey, 'embed')
      }
    }

    if (!n.content) return
    const canvasMatches = n.content.matchAll(/!\[\[canvas:([a-zA-Z0-9_-]+)\]\]/gi)
    for (const match of canvasMatches) {
      const targetKey = `canvas-${match[1]}`
      if (nodeMap.has(targetKey)) {
        addLink(noteKey, targetKey, 'embed')
      }
    }

    const noteMatches = n.content.matchAll(/!\[\[note:([a-zA-Z0-9_-]+)\]\]/gi)
    for (const match of noteMatches) {
      const targetKey = `note-${match[1]}`
      if (nodeMap.has(targetKey)) {
        addLink(noteKey, targetKey, 'embed')
      }
    }
  }

  for (const n of props.notes) {
    const noteKey = `note-${n.id}`
    if (nodeMap.has(noteKey)) {
      processNoteLinks(n, noteKey)
    }
  }

  // 3. Conexões de itens com a respectiva Pasta
  for (const n of nodes.value) {
    if (n.kind !== 'folder' && n.folder && n.folder.trim()) {
      const folderKey = `folder-${n.folder.trim()}`
      if (nodeMap.has(folderKey)) {
        addLink(n.id, folderKey, 'folder')
      }
    }
  }

  // 4. Conexões por tags compartilhadas (máximo 1 link por par de nós para não sobrecarregar)
  const tagMap = new Map<string, string[]>()
  for (const n of nodes.value) {
    const nodeTags = n.tags || []
    for (const t of nodeTags) {
      const arr = tagMap.get(t) || []
      arr.push(n.id)
      tagMap.set(t, arr)
    }
  }

  for (const [, ids] of tagMap) {
    if (ids.length <= 1) continue
    for (let i = 0; i < ids.length - 1; i++) {
      const src = ids[i]
      const tgt = ids[i + 1]
      if (src && tgt) {
        addLink(src, tgt, 'tag')
      }
    }
  }

  return result
})

const totalLinksCount = computed(() => links.value.length)

// Instâncias D3
let simulation: d3.Simulation<GraphNode, GraphLink> | null = null
let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null
let svgGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null

const initGraph = () => {
  if (!svgRef.value || !containerRef.value) return

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const rect = containerRef.value.getBoundingClientRect()
  const width = rect.width || containerRef.value.clientWidth || 800
  const height = rect.height || containerRef.value.clientHeight || 600

  svg.attr('viewBox', `0 0 ${width} ${height}`)

  svgGroup = svg.append('g').attr('class', 'graph-root')

  // Configuração de Zoom & Pan
  zoomBehavior = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.15, 3.5])
    .on('zoom', (event) => {
      svgGroup?.attr('transform', event.transform)
    })

  svg.call(zoomBehavior)

  // Camadas SVG
  const linkGroup = svgGroup.append('g').attr('class', 'links')
  const nodeGroup = svgGroup.append('g').attr('class', 'nodes')
  const labelGroup = svgGroup.append('g').attr('class', 'labels')

  // Criação dos dados locais para D3 force simulation
  const graphNodes = nodes.value.map((d) => ({ ...d }))
  const graphLinks = links.value.map((d) => ({ ...d }))

  simulation = d3
    .forceSimulation<GraphNode>(graphNodes)
    .force(
      'link',
      d3
        .forceLink<GraphNode, GraphLink>(graphLinks)
        .id((d) => d.id)
        .distance((d) => (d.type === 'embed' ? 90 : 130))
        .strength(0.3)
    )
    .force('charge', d3.forceManyBody().strength(-220))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide().radius((d: any) => d.radius + 18).iterations(2))

  // Renderização das Arestas (Links)
  const linkElements = linkGroup
    .selectAll('line')
    .data(graphLinks)
    .join('line')
    .attr('stroke', (d) => {
      if (d.type === 'embed') return '#E57B55'
      if (d.type === 'folder') return 'rgba(255, 255, 255, 0.18)'
      return 'rgba(99, 102, 241, 0.25)'
    })
    .attr('stroke-width', (d) => (d.type === 'embed' ? 2 : 1))
    .attr('stroke-dasharray', (d) => (d.type === 'tag' ? '3,3' : 'none'))
    .attr('stroke-opacity', 0.6)

  const dragBehavior = d3
    .drag<any, GraphNode>()
    .on('start', (event, d) => {
      if (!event.active) simulation?.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    })
    .on('drag', (event, d) => {
      d.fx = event.x
      d.fy = event.y
    })
    .on('end', (event, d) => {
      if (!event.active) simulation?.alphaTarget(0)
      d.fx = null
      d.fy = null
    })

  // Renderização dos Nós
  const nodeElements = nodeGroup
    .selectAll('g')
    .data(graphNodes)
    .join('g')
    .attr('class', 'node-item cursor-pointer')
    .call(dragBehavior as any)

  // Círculo com halo de brilho
  nodeElements
    .append('circle')
    .attr('r', (d) => d.radius + 4)
    .attr('fill', (d) => d.color)
    .attr('fill-opacity', 0.15)
    .attr('class', 'node-halo')

  // Círculo principal
  nodeElements
    .append('circle')
    .attr('r', (d) => d.radius)
    .attr('fill', (d) => d.color)
    .attr('stroke', '#ffffff')
    .attr('stroke-width', 1.5)
    .attr('stroke-opacity', 0.8)
    .attr('class', 'node-core')

  // Rótulo textual abaixo do nó
  const labelElements = labelGroup
    .selectAll('text')
    .data(graphNodes)
    .join('text')
    .text((d) => d.title)
    .attr('text-anchor', 'middle')
    .attr('dy', (d) => d.radius + 14)
    .attr('fill', 'var(--text-primary, #F2F2F2)')
    .attr('font-size', '10px')
    .attr('font-family', 'Inter, sans-serif')
    .attr('font-weight', '500')
    .attr('pointer-events', 'none')
    .attr('fill-opacity', 0.85)

  // Interatividade: Hover, Click
  nodeElements
    .on('mouseenter', (event, d) => {
      hoveredNode.value = d
      tooltipPos.value = { x: event.clientX, y: event.clientY }

      // Destaca vizinhos e atenua os demais
      const connectedIds = new Set<string>([d.id])
      for (const l of graphLinks) {
        const sId = typeof l.source === 'object' ? l.source.id : l.source
        const tId = typeof l.target === 'object' ? l.target.id : l.target
        if (sId === d.id) connectedIds.add(tId)
        if (tId === d.id) connectedIds.add(sId)
      }

      nodeElements.attr('opacity', (n) => (connectedIds.has(n.id) ? 1 : 0.2))
      labelElements.attr('opacity', (n) => (connectedIds.has(n.id) ? 1 : 0.15))
      linkElements.attr('stroke-opacity', (l) => {
        const sId = typeof l.source === 'object' ? l.source.id : l.source
        const tId = typeof l.target === 'object' ? l.target.id : l.target
        return sId === d.id || tId === d.id ? 1 : 0.08
      })
    })
    .on('mousemove', (event) => {
      tooltipPos.value = { x: event.clientX, y: event.clientY }
    })
    .on('mouseleave', () => {
      hoveredNode.value = null
      nodeElements.attr('opacity', 1)
      labelElements.attr('opacity', 0.85)
      linkElements.attr('stroke-opacity', 0.6)
    })
    .on('click', (_event, d) => {
      if (d.kind === 'canvas') {
        emit('select-canvas', d.rawId)
      } else if (d.kind === 'folder') {
        emit('select-folder', d.rawId || d.title)
      } else if (d.rawNote) {
        emit('select-note', d.rawNote)
      }
    })

  // Atualização a cada tick da simulação de física
  simulation.on('tick', () => {
    linkElements
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y)

    nodeElements.attr('transform', (d) => `translate(${d.x || 0}, ${d.y || 0})`)
    labelElements.attr('x', (d) => d.x || 0).attr('y', (d) => d.y || 0)
  })
}

// Ações de Zoom e Reset
const zoomIn = () => {
  if (!svgRef.value || !zoomBehavior) return
  d3.select(svgRef.value).transition().duration(250).call(zoomBehavior.scaleBy, 1.3)
}

const zoomOut = () => {
  if (!svgRef.value || !zoomBehavior) return
  d3.select(svgRef.value).transition().duration(250).call(zoomBehavior.scaleBy, 0.75)
}

const resetZoom = () => {
  if (!svgRef.value || !zoomBehavior || !containerRef.value) return
  const { width, height } = containerRef.value.getBoundingClientRect()
  d3.select(svgRef.value)
    .transition()
    .duration(350)
    .call(zoomBehavior.transform, d3.zoomIdentity.translate(0, 0).scale(1))

  simulation?.force('center', d3.forceCenter(width / 2, height / 2))
  simulation?.alpha(0.3).restart()
}

// Redimensionamento responsivo
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  nextTick(() => {
    initGraph()
    if (containerRef.value && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        initGraph()
      })
      resizeObserver.observe(containerRef.value)
    }
  })
})

watch([() => props.canvases, () => props.notes], () => {
  nextTick(() => {
    initGraph()
  })
}, { deep: true })

onUnmounted(() => {
  if (simulation) simulation.stop()
  if (resizeObserver) resizeObserver.disconnect()
})

defineExpose({
  nodes,
  links,
  initGraph,
})
</script>

<style scoped>
.node-item:hover .node-halo {
  fill-opacity: 0.35;
  transition: fill-opacity 0.2s ease;
}
.node-item:hover .node-core {
  stroke-width: 2.5;
  transition: stroke-width 0.2s ease;
}
</style>
