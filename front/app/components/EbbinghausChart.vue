<template>
  <div class="w-full flex flex-col gap-4">
    <!-- Controles & Legenda do Gráfico -->
    <div class="flex flex-wrap items-center justify-between gap-3 text-xs">
      <div class="flex items-center gap-4 flex-wrap">
        <div class="flex items-center gap-1.5 font-technical text-[11px] text-rose-400">
          <div class="w-3 h-0.5 bg-rose-500"></div>
          <span>Sem Revisão (Queda Livre)</span>
        </div>
        <div class="flex items-center gap-1.5 font-technical text-[11px] text-emerald-400">
          <div class="w-3 h-0.5 bg-emerald-400"></div>
          <span>Com Repetição Espaçada (Aresta)</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span class="font-technical text-[10px] uppercase tracking-wider text-textSecondary">Simulação:</span>
        <button
          v-for="step in [1, 2, 3, 4]"
          :key="step"
          @click="activeRevisions = step"
          :class="activeRevisions === step ? 'bg-accent text-white shadow-md' : 'bg-white/5 text-textSecondary hover:text-white'"
          class="px-2.5 py-1 rounded-lg font-technical text-[10px] transition-all border border-divider"
        >
          {{ step }}ª Rev
        </button>
      </div>
    </div>

    <!-- Container do SVG D3 -->
    <div ref="containerRef" class="w-full h-64 sm:h-80 relative bg-black/40 rounded-2xl border border-divider overflow-hidden p-2">
      <svg ref="svgRef" class="w-full h-full"></svg>
    </div>

    <!-- Dica explicativa inferior -->
    <div class="flex items-center justify-between text-[11px] font-technical text-textSecondary px-1">
      <span>Eixo X: Tempo decorrido (Dias)</span>
      <span>Eixo Y: Retenção na memória (%)</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'

const containerRef = ref<HTMLElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
const activeRevisions = ref(3)

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
  for (let i = 0; i <= Math.min(revisions, intervals.length - 1); i++) {
    const inter = intervals[i]
    for (let t = inter.start; t <= inter.end; t += 0.2) {
      const dt = t - inter.start
      const r = Math.max(20, inter.base * Math.exp(-dt / inter.s))
      currentPoints.push([t, r])
    }
  }

  // Se não cobriu até 30 dias, projetar decaimento a partir da última revisão ativa
  if (revisions < intervals.length) {
    const lastInter = intervals[revisions]
    const lastStart = lastInter.start
    for (let t = lastStart; t <= 30; t += 0.5) {
      const dt = t - lastStart
      const r = Math.max(10, 100 * Math.exp(-dt / lastInter.s))
      currentPoints.push([t, r])
    }
  }

  reviewLines.push({ points: currentPoints, step: revisions })

  return { noReviewData, reviewLines }
}

const renderChart = () => {
  if (!svgRef.value || !containerRef.value) return

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const width = containerRef.value.clientWidth || 500
  const height = containerRef.value.clientHeight || 300
  const margin = { top: 20, right: 30, bottom: 35, left: 45 }

  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  svg.attr('viewBox', `0 0 ${width} ${height}`)

  const g = svg
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Escalas
  const xScale = d3.scaleLinear().domain([0, 30]).range([0, innerWidth])
  const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0])

  // Linhas de Grade de Fundo
  const yGrid = d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(() => '')
  g.append('g')
    .attr('class', 'grid text-white/5')
    .call(yGrid)
    .selectAll('line')
    .attr('stroke', 'rgba(255,255,255,0.06)')
    .attr('stroke-dasharray', '2,2')

  // Eixos
  const xAxis = d3.axisBottom(xScale).ticks(6).tickFormat((d) => `Dia ${d}`)
  const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat((d) => `${d}%`)

  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(xAxis)
    .attr('color', '#6b7280')
    .selectAll('text')
    .attr('fill', '#9ca3af')
    .attr('font-size', '10px')
    .attr('font-family', 'var(--font-technical, monospace)')

  g.append('g')
    .call(yAxis)
    .attr('color', '#6b7280')
    .selectAll('text')
    .attr('fill', '#9ca3af')
    .attr('font-size', '10px')
    .attr('font-family', 'var(--font-technical, monospace)')

  const { noReviewData, reviewLines } = generateData(activeRevisions.value)

  const lineGenerator = d3
    .line<[number, number]>()
    .x((d) => xScale(d[0]))
    .y((d) => yScale(d[1]))
    .curve(d3.curveMonotoneX)

  // 1. Plotar Área de Perda de Memória (Sem Revisão)
  const areaGenerator = d3
    .area<[number, number]>()
    .x((d) => xScale(d[0]))
    .y0(innerHeight)
    .y1((d) => yScale(d[1]))
    .curve(d3.curveMonotoneX)

  g.append('path')
    .datum(noReviewData)
    .attr('fill', 'rgba(244, 63, 94, 0.08)')
    .attr('d', areaGenerator)

  // Linha Sem Revisão
  g.append('path')
    .datum(noReviewData)
    .attr('fill', 'none')
    .attr('stroke', '#f43f5e')
    .attr('stroke-width', 2.5)
    .attr('stroke-dasharray', '4,4')
    .attr('d', lineGenerator)

  // 2. Plotar Curva de Repetição Espaçada
  reviewLines.forEach((rev) => {
    // Área protegida da memória
    g.append('path')
      .datum(rev.points)
      .attr('fill', 'rgba(52, 211, 153, 0.12)')
      .attr('d', areaGenerator)

    g.append('path')
      .datum(rev.points)
      .attr('fill', 'none')
      .attr('stroke', '#34d399')
      .attr('stroke-width', 3)
      .attr('d', lineGenerator)
  })

  // 3. Marcadores de Revisão (Flashcards no dia 1, 3, 7, 15)
  const reviewPoints = [
    { day: 1, label: '1ª Rev (24h)' },
    { day: 3, label: '2ª Rev (3d)' },
    { day: 7, label: '3ª Rev (7d)' },
    { day: 15, label: '4ª Rev (15d)' }
  ]

  reviewPoints.slice(0, activeRevisions.value).forEach((pt) => {
    const cx = xScale(pt.day)
    const cy = yScale(100)

    // Linha vertical de revisão
    g.append('line')
      .attr('x1', cx)
      .attr('y1', innerHeight)
      .attr('x2', cx)
      .attr('y2', cy)
      .attr('stroke', 'rgba(229, 123, 85, 0.4)')
      .attr('stroke-dasharray', '3,3')

    // Ponto de pulso
    g.append('circle')
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', 5)
      .attr('fill', '#E57B55')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)

    // Rótulo
    g.append('text')
      .attr('x', cx)
      .attr('y', cy - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', '#E57B55')
      .attr('font-size', '9px')
      .attr('font-weight', '600')
      .attr('font-family', 'var(--font-technical, monospace)')
      .text(pt.label)
  })
}

watch(activeRevisions, () => {
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
