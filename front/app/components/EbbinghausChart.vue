<template>
  <div class="w-full flex flex-col gap-2.5">
    <!-- Controles Compactos & Legenda Enxuta -->
    <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
      <!-- Legenda Direta: Tempo vs Absorção -->
      <div class="flex items-center gap-3 flex-wrap text-[10px] font-technical">
        <div class="flex items-center gap-1 text-rose-500 dark:text-rose-400">
          <div class="w-2.5 h-0.5 bg-rose-500 rounded-full"></div>
          <span>Sem Revisão</span>
        </div>
        <div class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <div class="w-2.5 h-0.5 bg-emerald-500 rounded-full"></div>
          <span>Com Repetição Espaçada</span>
        </div>
      </div>

      <!-- Seletor Rápido de Simulação -->
      <div class="flex items-center gap-1.5 ml-auto">
        <span class="font-technical text-[9px] uppercase tracking-wider text-textSecondary hidden sm:inline">Simulação:</span>
        <div class="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-0.5 rounded-lg border border-divider">
          <button
            v-for="step in [1, 2, 3, 4]"
            :key="step"
            @click="activeRevisions = step"
            :class="activeRevisions === step ? 'bg-accent text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary'"
            class="px-2 py-0.5 rounded font-technical text-[9px] transition-all"
          >
            {{ step }}ª Rev
          </button>
        </div>
      </div>
    </div>

    <!-- Container do SVG D3 Comprimido Vertical e Horizontalmente -->
    <div ref="containerRef" class="w-full h-40 sm:h-48 md:h-52 relative bg-bgPanel/60 rounded-xl sm:rounded-2xl border border-divider overflow-hidden p-1 sm:p-2">
      <svg ref="svgRef" class="w-full h-full"></svg>
    </div>

    <!-- Indicador Enxuto dos Eixos: Linha horizontal = Tempo, Linha vertical = Absorção -->
    <div class="flex items-center justify-between gap-2 text-[10px] font-technical text-textSecondary px-1">
      <span class="whitespace-nowrap flex items-center gap-1">
        <span>&uarr;</span> <strong>Absorção</strong>
      </span>
      <span class="whitespace-nowrap flex items-center gap-1">
        <strong>Tempo</strong> <span>&rarr;</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { useSettings } from '~/composables/useSettings'

const containerRef = ref<HTMLElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
const activeRevisions = ref(3)

const { themeMode } = useSettings()
const isLightMode = computed(() => themeMode.value === 'light' || themeMode.value === 'sepia')

// Função exponencial de Ebbinghaus R = e^(-t / S)
const generateData = (revisions: number) => {
  // Curva 0: Sem revisão
  const noReviewData: [number, number][] = []
  for (let t = 0; t <= 30; t += 0.5) {
    const r = Math.max(15, 100 * Math.exp(-t / 1.8))
    noReviewData.push([t, r])
  }

  // Curvas com repetição espaçada
  // Rev 1 no dia 1, Rev 2 no dia 3, Rev 3 no dia 7, Rev 4 no dia 15
  const intervals = [
    { start: 0, end: 1, s: 1.8, base: 100 },
    { start: 1, end: 3, s: 4.5, base: 100 },
    { start: 3, end: 7, s: 10, base: 100 },
    { start: 7, end: 15, s: 22, base: 100 },
    { start: 15, end: 30, s: 50, base: 100 }
  ]

  const reviewLines: { points: [number, number][]; step: number }[] = []

  let currentPoints: [number, number][] = []
  const maxIdx = Math.min(revisions, intervals.length - 1)
  for (let i = 0; i <= maxIdx; i++) {
    const inter = intervals[i]
    if (inter) {
      for (let t = inter.start; t <= inter.end; t += 0.2) {
        const dt = t - inter.start
        const r = Math.max(20, inter.base * Math.exp(-dt / inter.s))
        currentPoints.push([t, r])
      }
    }
  }

  // Se não cobriu até 30 dias, projetar decaimento a partir da última revisão ativa
  if (revisions < intervals.length) {
    const lastInter = intervals[revisions]
    if (lastInter) {
      const lastStart = lastInter.start
      for (let t = lastStart; t <= 30; t += 0.5) {
        const dt = t - lastStart
        const r = Math.max(10, 100 * Math.exp(-dt / lastInter.s))
        currentPoints.push([t, r])
      }
    }
  }

  reviewLines.push({ points: currentPoints, step: revisions })

  return { noReviewData, reviewLines }
}

const renderChart = () => {
  if (!svgRef.value || !containerRef.value) return

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const width = containerRef.value.clientWidth || 400
  const height = containerRef.value.clientHeight || 180
  const margin = { top: 14, right: 12, bottom: 20, left: 32 }

  const innerWidth = Math.max(10, width - margin.left - margin.right)
  const innerHeight = Math.max(10, height - margin.top - margin.bottom)

  svg.attr('viewBox', `0 0 ${width} ${height}`)

  const g = svg
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Escalas
  const xScale = d3.scaleLinear().domain([0, 30]).range([0, innerWidth])
  const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0])

  // Linhas de Grade de Fundo Sutis
  const yGrid = d3.axisLeft(yScale).ticks(3).tickSize(-innerWidth).tickFormat(() => '')
  g.append('g')
    .attr('class', 'grid')
    .call(yGrid)
    .selectAll('line')
    .attr('stroke', isLightMode.value ? 'rgba(0, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.05)')
    .attr('stroke-dasharray', '2,2')

  // Eixos Simplificados
  const xAxis = d3.axisBottom(xScale).ticks(4).tickFormat((d) => `${d}d`)
  const yAxis = d3.axisLeft(yScale).ticks(3).tickFormat((d) => `${d}%`)

  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(xAxis)
    .attr('color', isLightMode.value ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.2)')
    .selectAll('text')
    .attr('fill', isLightMode.value ? '#6B7280' : '#9ca3af')
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-technical, monospace)')

  g.append('g')
    .call(yAxis)
    .attr('color', isLightMode.value ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.2)')
    .selectAll('text')
    .attr('fill', isLightMode.value ? '#6B7280' : '#9ca3af')
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-technical, monospace)')

  const { noReviewData, reviewLines } = generateData(activeRevisions.value)

  const lineGenerator = d3
    .line<[number, number]>()
    .x((d) => xScale(d[0]))
    .y((d) => yScale(d[1]))
    .curve(d3.curveMonotoneX)

  const areaGenerator = d3
    .area<[number, number]>()
    .x((d) => xScale(d[0]))
    .y0(innerHeight)
    .y1((d) => yScale(d[1]))
    .curve(d3.curveMonotoneX)

  // 1. Área & Linha Sem Revisão (Queda Livre)
  g.append('path')
    .datum(noReviewData)
    .attr('fill', isLightMode.value ? 'rgba(225, 29, 72, 0.08)' : 'rgba(244, 63, 94, 0.08)')
    .attr('d', areaGenerator)

  g.append('path')
    .datum(noReviewData)
    .attr('fill', 'none')
    .attr('stroke', isLightMode.value ? '#e11d48' : '#f43f5e')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '3,3')
    .attr('d', lineGenerator)

  // 2. Curva com Repetição Espaçada
  reviewLines.forEach((rev) => {
    g.append('path')
      .datum(rev.points)
      .attr('fill', isLightMode.value ? 'rgba(5, 150, 105, 0.12)' : 'rgba(52, 211, 153, 0.1)')
      .attr('d', areaGenerator)

    g.append('path')
      .datum(rev.points)
      .attr('fill', 'none')
      .attr('stroke', isLightMode.value ? '#059669' : '#34d399')
      .attr('stroke-width', 2.5)
      .attr('d', lineGenerator)
  })

  // 3. Marcadores de Revisão (Pontos e Linhas Guia)
  const reviewPoints = [
    { day: 1, label: '1ª' },
    { day: 3, label: '2ª' },
    { day: 7, label: '3ª' },
    { day: 15, label: '4ª' }
  ]

  reviewPoints.slice(0, activeRevisions.value).forEach((pt) => {
    const cx = xScale(pt.day)
    const cy = yScale(100)

    g.append('line')
      .attr('x1', cx)
      .attr('y1', innerHeight)
      .attr('x2', cx)
      .attr('y2', cy)
      .attr('stroke', 'rgba(229, 123, 85, 0.35)')
      .attr('stroke-dasharray', '2,2')

    g.append('circle')
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', 3.5)
      .attr('fill', '#E57B55')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1)
  })
}

watch(activeRevisions, () => {
  renderChart()
})

watch(themeMode, () => {
  renderChart()
})

onMounted(() => {
  nextTick(() => {
    renderChart()
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', renderChart)
    }
  })
})
</script>
