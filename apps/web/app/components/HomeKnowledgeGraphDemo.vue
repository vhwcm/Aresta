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

    <!-- Container do Grafo Interativo + Painel Lateral de Detalhes -->
    <div class="relative w-full h-[420px] sm:h-[500px] rounded-2xl overflow-hidden bg-black/[0.02] dark:bg-black/40 border border-divider flex flex-col md:flex-row">
      <!-- Canvas SVG Interativo D3 -->
      <div class="relative flex-1 h-full select-none overflow-hidden" ref="graphContainerRef">
        <!-- Grid de fundo sutil -->
        <div class="absolute inset-0 bg-grid-pattern bg-grid-size opacity-15 pointer-events-none"></div>

        <svg ref="svgElementRef" class="w-full h-full cursor-grab active:cursor-grabbing">
          <g ref="gElementRef">
            <!-- Arestas / Conexões -->
            <g class="edges-group"></g>
            <!-- Nós / Temas -->
            <g class="nodes-group"></g>
          </g>
        </svg>

        <!-- Controles Flutuantes de Zoom / Ação -->
        <div class="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-bgPanel/90 backdrop-blur-md border border-divider p-1.5 rounded-2xl shadow-xl">
          <button
            @click="handleZoomIn"
            title="Aumentar zoom"
            aria-label="Aumentar zoom"
            class="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/15 text-textPrimary flex items-center justify-center transition-colors text-sm font-bold cursor-pointer"
          >
            +
          </button>
          <button
            @click="handleZoomOut"
            title="Diminuir zoom"
            aria-label="Diminuir zoom"
            class="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/15 text-textPrimary flex items-center justify-center transition-colors text-sm font-bold cursor-pointer"
          >
            -
          </button>
          <button
            @click="handleResetZoom"
            title="Recentralizar grafo"
            aria-label="Recentralizar grafo"
            class="px-2.5 h-8 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/15 text-textSecondary hover:text-textPrimary flex items-center gap-1.5 transition-colors text-xs font-technical cursor-pointer"
          >
            <RotateCcwIcon class="w-3.5 h-3.5" />
            <span>Resetar</span>
          </button>
        </div>

        <!-- Dica de Interação Flutuante no Topo Esquerdo -->
        <div class="absolute top-3 left-3 pointer-events-none z-10 bg-bgPanel/90 backdrop-blur-md border border-divider px-3 py-1.5 rounded-xl font-technical text-[10px] text-textSecondary flex items-center gap-1.5 shadow-sm">
          <SparklesIcon class="w-3 h-3 text-accent" />
          <span>Arraste os nós ou clique para inspecionar</span>
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
                :style="{ backgroundColor: selectedNode.color }"
              ></span>
              <span class="font-technical text-[10px] uppercase tracking-wider text-accent font-semibold">
                {{ selectedNode.category }}
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
              {{ selectedNode.description }}
            </p>
          </div>

          <!-- Obras Vinculadas a este tema -->
          <div class="flex flex-col gap-2 pt-2 border-t border-divider/60">
            <span class="font-technical text-[10px] uppercase tracking-widest text-textSecondary font-semibold">
              Obras Conectadas ({{ selectedNode.books.length }})
            </span>

            <div class="flex flex-col gap-2">
              <div
                v-for="b in selectedNode.books"
                :key="b.title"
                class="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-divider/60 flex flex-col gap-1 hover:border-accent/30 transition-colors"
              >
                <div class="flex items-center justify-between text-xs">
                  <span class="font-interface font-medium text-textPrimary truncate">{{ b.title }}</span>
                  <span class="font-technical text-[10px] text-accent font-semibold">{{ b.author }}</span>
                </div>
                <p class="font-editorial italic text-[11px] text-textSecondary/90 leading-tight">
                  "{{ b.quote }}"
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Botão de Ação -->
        <NuxtLink
          to="/grafo"
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
              <span class="text-textPrimary/80">Epistemologia & Razão</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-[#38BDF8]"></span>
              <span class="text-textPrimary/80">Filosofia da Mente</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-[#34D399]"></span>
              <span class="text-textPrimary/80">Literatura Brasileira</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-[#F472B6]"></span>
              <span class="text-textPrimary/80">Psicologia Comportamental</span>
            </div>
          </div>
        </div>

        <NuxtLink
          to="/grafo"
          class="inline-flex items-center justify-between text-xs text-accent font-interface hover:underline pt-3 border-t border-divider/60"
        >
          <span>Explorar Tela Cheia</span>
          <ArrowRightIcon class="w-3.5 h-3.5" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import * as d3 from 'd3'
import {
  SparklesIcon,
  RotateCcwIcon,
  XIcon,
  ArrowRightIcon,
  NetworkIcon
} from 'lucide-vue-next'
import { useSettings } from '~/composables/useSettings'

const { themeMode } = useSettings()
const isSepiaMode = computed(() => themeMode.value === 'sepia')
const isLightMode = computed(() => themeMode.value === 'light')

interface DemoBook {
  title: string
  author: string
  quote: string
}

interface DemoNode {
  id: number
  name: string
  category: 'Filosofia' | 'Literatura' | 'Psicologia' | 'Central'
  color: string
  description: string
  books: DemoBook[]
  isRoot?: boolean
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface DemoEdge {
  id: string
  source: number | DemoNode
  target: number | DemoNode
}

const categories = [
  { id: 'all', label: 'Todos os Nós' },
  { id: 'Filosofia', label: 'Filosofia' },
  { id: 'Literatura', label: 'Literatura' },
  { id: 'Psicologia', label: 'Psicologia' }
]

const activeCategory = ref('all')
const selectedNode = ref<DemoNode | null>(null)

const graphContainerRef = ref<HTMLElement | null>(null)
const svgElementRef = ref<SVGSVGElement | null>(null)
const gElementRef = ref<SVGGElement | null>(null)

let simulation: d3.Simulation<any, any> | null = null
let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null
let resizeObserver: ResizeObserver | null = null

// Dados ricos de demonstração de Grafo
const sampleNodes: DemoNode[] = [
  {
    id: -999,
    name: 'Meu Conhecimento',
    category: 'Central',
    color: '#E57B55',
    description: 'Nó raiz agregador de todas as leituras e reflexões registradas no Aresta.',
    books: [
      { title: 'O Alienista', author: 'Machado de Assis', quote: 'A razão é a perfeita saúde da alma.' },
      { title: 'Dom Casmurro', author: 'Machado de Assis', quote: 'Olhos de ressaca, oblíquos e dissimulados.' },
      { title: 'Meditações', author: 'Marco Aurélio', quote: 'Você tem poder sobre sua mente, não sobre eventos externos.' }
    ],
    isRoot: true
  },
  {
    id: 1,
    name: 'Epistemologia & Razão',
    category: 'Filosofia',
    color: '#E57B55',
    description: 'Investigação sobre os limites da racionalidade humana, fronteiras do conhecimento e o perigo do dogmatismo científico.',
    books: [
      { title: 'O Alienista', author: 'Machado de Assis', quote: 'A ciência é a minha esposa única, e a Casa Verde o meu laboratório.' },
      { title: 'Crítica da Razão Pura', author: 'Immanuel Kant', quote: 'Pensamentos sem conteúdos são vazios, intuições sem conceitos são cegas.' }
    ]
  },
  {
    id: 2,
    name: 'Filosofia da Mente',
    category: 'Filosofia',
    color: '#38BDF8',
    description: 'Natureza da consciência subjetiva, percepção e os critérios sociais para a definição de sanidade versus loucura.',
    books: [
      { title: 'O Alienista', author: 'Machado de Assis', quote: 'A loucura era até agora uma ilha perdida; começo a suspeitar que é um continente.' }
    ]
  },
  {
    id: 3,
    name: 'Literatura Brasileira',
    category: 'Literatura',
    color: '#34D399',
    description: 'O Realismo machadiano, a ironia reflexiva e a dissecação da vaidade humana na sociedade do século XIX.',
    books: [
      { title: 'Dom Casmurro', author: 'Machado de Assis', quote: 'A imaginação foi a companheira de toda a minha existência.' },
      { title: 'Memórias Póstumas', author: 'Machado de Assis', quote: 'Não tive filhos, não transmiti a nenhuma criatura o legado da nossa miséria.' }
    ]
  },
  {
    id: 4,
    name: 'Psicologia Comportamental',
    category: 'Psicologia',
    color: '#F472B6',
    description: 'Mecanismos de autoridade, obsessão por controle, conformismo social e distorções cognitivas.',
    books: [
      { title: 'O Alienista', author: 'Machado de Assis', quote: 'Quem estava são? Quem estava louco?' },
      { title: 'Rápido e Devagar', author: 'Daniel Kahneman', quote: 'A ilusão de que compreendemos o passado fomenta a confiança excessiva no futuro.' }
    ]
  },
  {
    id: 5,
    name: 'Estoicismo & Lucidez',
    category: 'Filosofia',
    color: '#A78BFA',
    description: 'Treinamento da atenção, distinção entre o que podemos e não podemos controlar, serenidade diante do ruído.',
    books: [
      { title: 'Meditações', author: 'Marco Aurélio', quote: 'A serenidade não é a ausência de tempestade, mas a paz interior.' }
    ]
  },
  {
    id: 6,
    name: 'Crítica Social & Ironia',
    category: 'Literatura',
    color: '#FBBF24',
    description: 'Desconstrução do prestígio acadêmico e das instituições que confundem arrogância com autoridade.',
    books: [
      { title: 'O Alienista', author: 'Machado de Assis', quote: 'A câmara de Itaguaí curvou-se reverente diante do alienista.' }
    ]
  }
]

const sampleEdges: DemoEdge[] = [
  { id: 'e1', source: -999, target: 1 },
  { id: 'e2', source: -999, target: 2 },
  { id: 'e3', source: -999, target: 3 },
  { id: 'e4', source: -999, target: 4 },
  { id: 'e5', source: -999, target: 5 },
  { id: 'e6', source: 1, target: 2 },
  { id: 'e7', source: 1, target: 3 },
  { id: 'e8', source: 2, target: 4 },
  { id: 'e9', source: 3, target: 6 },
  { id: 'e10', source: 4, target: 6 },
  { id: 'e11', source: 5, target: 1 }
]

const getPastelFill = (colorHex: string, isRoot = false) => {
  const neutral = isSepiaMode.value ? '#F5EEDC' : (isLightMode.value ? '#FFFFFF' : '#121316')
  return d3.interpolateRgb(neutral, colorHex)(isRoot ? 0.45 : (isLightMode.value || isSepiaMode.value ? 0.35 : 0.3))
}

const getPastelStroke = (colorHex: string, isRoot = false) => {
  const neutral = isSepiaMode.value ? '#D8CCB0' : (isLightMode.value ? '#CBD5E1' : '#121316')
  return d3.interpolateRgb(neutral, colorHex)(isRoot ? 0.95 : (isLightMode.value || isSepiaMode.value ? 0.85 : 0.75))
}

const initGraphSimulation = () => {
  if (!svgElementRef.value || !gElementRef.value || !graphContainerRef.value) return

  const width = graphContainerRef.value.clientWidth || 600
  const height = graphContainerRef.value.clientHeight || 450

  const svg = d3.select(svgElementRef.value)
  const g = d3.select(gElementRef.value)

  // Zoom behavior
  zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.4, 3])
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })

  svg.call(zoomBehavior as any).on('dblclick.zoom', null)

  // Filtrar nós baseado na categoria
  const visibleNodes = sampleNodes.filter(n => {
    if (n.isRoot) return true
    if (activeCategory.value === 'all') return true
    return n.category === activeCategory.value
  }).map(n => ({ ...n }))

  const nodeMap = new Map(visibleNodes.map(n => [n.id, n]))

  // Filtrar links pertinentes aos nós visíveis
  const visibleEdges = sampleEdges
    .map(e => ({
      id: e.id,
      source: nodeMap.get(typeof e.source === 'object' ? e.source.id : e.source),
      target: nodeMap.get(typeof e.target === 'object' ? e.target.id : e.target)
    }))
    .filter(link => link.source && link.target)

  // Configuração física da simulação
  simulation = d3.forceSimulation(visibleNodes)
    .force('link', d3.forceLink(visibleEdges).id((d: any) => d.id).distance((d: any) => (d.source?.isRoot || d.target?.isRoot) ? 140 : 110))
    .force('charge', d3.forceManyBody().strength(-380))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide().radius((d: any) => (d.isRoot ? 40 : 30) + 18))

  // Renderizar Arestas
  const linkGroup = g.select('.edges-group')
  const links = linkGroup.selectAll<SVGLineElement, any>('line')
    .data(visibleEdges, (d: any) => d.id)
    .join('line')
    .attr('stroke', (d: any) => (d.source?.isRoot || d.target?.isRoot) ? (isLightMode.value || isSepiaMode.value ? 'rgba(229, 123, 85, 0.45)' : 'rgba(229, 123, 85, 0.35)') : (isSepiaMode.value ? 'rgba(80, 60, 30, 0.18)' : (isLightMode.value ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.16)')))
    .attr('stroke-width', (d: any) => (d.source?.isRoot || d.target?.isRoot) ? 1.6 : 1.2)
    .attr('stroke-opacity', 0.8)

  // Renderizar Nós
  const nodeGroup = g.select('.nodes-group')
  const nodes = nodeGroup.selectAll<SVGGElement, any>('g.demo-node')
    .data(visibleNodes, (d: any) => d.id)
    .join('g')
    .attr('class', 'demo-node cursor-pointer')
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
        d.fx = null
        d.fy = null
      })
    )

  nodes.html('') // Limpar

  // Círculo de brilho externo
  nodes.append('circle')
    .attr('r', (d: any) => d.isRoot ? 38 : 28)
    .attr('fill', (d: any) => getPastelFill(d.color, d.isRoot))
    .attr('opacity', 0.2)

  // Círculo principal
  nodes.append('circle')
    .attr('r', (d: any) => d.isRoot ? 30 : 22)
    .attr('fill', (d: any) => getPastelFill(d.color, d.isRoot))
    .attr('stroke', (d: any) => getPastelStroke(d.color, d.isRoot))
    .attr('stroke-width', (d: any) => d.isRoot ? 2.2 : 1.5)
    .attr('class', 'transition-all duration-300')

  // Contagem de livros no interior do nó
  nodes.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', 4)
    .attr('font-size', (d: any) => d.isRoot ? '12px' : '11px')
    .attr('font-weight', '600')
    .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
    .attr('fill', (d: any) => isSepiaMode.value ? (d.isRoot ? '#8B4513' : '#2C2621') : (isLightMode.value ? (d.isRoot ? '#9A3412' : '#1E293B') : '#FFFFFF'))
    .attr('pointer-events', 'none')
    .text((d: any) => d.isRoot ? '★' : d.books.length)

  // Rótulo textual do nó
  nodes.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', (d: any) => (d.isRoot ? 30 : 22) + 16)
    .attr('fill', (d: any) => d.isRoot ? (isSepiaMode.value ? '#8B4513' : (isLightMode.value ? '#9A3412' : '#F59E0B')) : (isSepiaMode.value ? '#2C2621' : (isLightMode.value ? '#1E293B' : '#E2E8F0')))
    .attr('font-size', (d: any) => d.isRoot ? '12.5px' : '11px')
    .attr('font-weight', '600')
    .attr('font-family', 'system-ui, -apple-system, sans-serif')
    .attr('pointer-events', 'none')
    .text((d: any) => d.name)

  // Clique para selecionar o nó
  nodes.on('click', (event, d) => {
    event.stopPropagation()
    selectedNode.value = d
  })

  // Destaque nas arestas ao passar o cursor
  nodes.on('mouseenter', (event, d) => {
    links
      .attr('stroke', (l: any) => (l.source?.id === d.id || l.target?.id === d.id) ? (d.color || '#E57B55') : (isSepiaMode.value ? 'rgba(80, 60, 30, 0.08)' : 'rgba(255, 255, 255, 0.05)'))
      .attr('stroke-width', (l: any) => (l.source?.id === d.id || l.target?.id === d.id) ? 2.2 : 1)
      .attr('stroke-opacity', (l: any) => (l.source?.id === d.id || l.target?.id === d.id) ? 1 : 0.2)
  }).on('mouseleave', () => {
    links
      .attr('stroke', (d: any) => (d.source?.isRoot || d.target?.isRoot) ? (isLightMode.value || isSepiaMode.value ? 'rgba(229, 123, 85, 0.45)' : 'rgba(229, 123, 85, 0.35)') : (isSepiaMode.value ? 'rgba(80, 60, 30, 0.18)' : (isLightMode.value ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.16)')))
      .attr('stroke-width', (d: any) => (d.source?.isRoot || d.target?.isRoot) ? 1.6 : 1.2)
      .attr('stroke-opacity', 0.8)
  })

  // Atualização física por tick
  simulation.on('tick', () => {
    links
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y)

    nodes.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
  })
}

const handleZoomIn = () => {
  if (!svgElementRef.value || !zoomBehavior) return
  d3.select(svgElementRef.value).transition().duration(250).call(zoomBehavior.scaleBy as any, 1.3)
}

const handleZoomOut = () => {
  if (!svgElementRef.value || !zoomBehavior) return
  d3.select(svgElementRef.value).transition().duration(250).call(zoomBehavior.scaleBy as any, 0.75)
}

const handleResetZoom = () => {
  if (!svgElementRef.value || !zoomBehavior || !graphContainerRef.value) return
  d3.select(svgElementRef.value).transition().duration(400).call(
    zoomBehavior.transform as any,
    d3.zoomIdentity.translate(0, 0).scale(1)
  )
}

watch([activeCategory, themeMode], () => {
  initGraphSimulation()
})

onMounted(() => {
  initGraphSimulation()
  if (graphContainerRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      if (simulation && graphContainerRef.value) {
        const width = graphContainerRef.value.clientWidth
        const height = graphContainerRef.value.clientHeight
        simulation.force('center', d3.forceCenter(width / 2, height / 2))
        simulation.alpha(0.2).restart()
      }
    })
    resizeObserver.observe(graphContainerRef.value)
  }
})

onBeforeUnmount(() => {
  if (simulation) simulation.stop()
  if (resizeObserver) resizeObserver.disconnect()
})
</script>
