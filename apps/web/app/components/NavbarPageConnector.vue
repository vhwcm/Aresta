<template>
  <!-- Camada 1 (z-[40]): Fundo preenchido da navbar com cantos curvados para fora (atrás dos botões) -->
  <div
    v-if="isVisible"
    class="navbar-page-bg fixed inset-y-0 left-0 pointer-events-none z-[40] hidden lg:block md:landscape:block overflow-visible select-none"
    aria-hidden="true"
  >
    <svg
      :width="svgWidth"
      :height="viewportHeight"
      class="w-full h-full overflow-visible"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        :d="fillPathD"
        fill="var(--bg-panel, #121315)"
      />
    </svg>
  </div>

  <!-- Camada 2 (z-[60]): Linhas e gradiente de contorno unificados (acima da navbar, sem sobreposição) -->
  <div
    v-if="isVisible"
    class="navbar-page-connector fixed inset-y-0 left-0 pointer-events-none z-[60] hidden lg:block md:landscape:block overflow-visible select-none"
    aria-hidden="true"
  >
    <svg
      :width="svgWidth"
      :height="viewportHeight"
      class="w-full h-full overflow-visible"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <!-- Gradiente linear que distribui o laranja da curva ao longo de metade da página -->
        <linearGradient
          id="connector-stroke-gradient"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stop-color="var(--divider, rgba(255, 255, 255, 0.06))" />
          <stop :offset="gradientFadeStart" stop-color="var(--divider, rgba(255, 255, 255, 0.08))" />
          <stop :offset="gradientOrangeStart" stop-color="var(--accent, #E57B55)" stop-opacity="0.45" />
          <stop :offset="gradientCenter" stop-color="var(--accent, #E57B55)" stop-opacity="1" />
          <stop :offset="gradientOrangeEnd" stop-color="var(--accent, #E57B55)" stop-opacity="0.45" />
          <stop :offset="gradientFadeEnd" stop-color="var(--divider, rgba(255, 255, 255, 0.08))" />
          <stop offset="100%" stop-color="var(--divider, rgba(255, 255, 255, 0.06))" />
        </linearGradient>

        <!-- Brilho e reflexo luminoso sutil no abraço do ícone -->
        <filter id="connector-accent-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="3.5" flood-color="var(--accent, #E57B55)" flood-opacity="0.45" />
        </filter>
      </defs>

      <!-- Prateleira superior da navbar (visível quando o item 0 não estiver ativo) -->
      <path
        v-if="topShelfPathD"
        :d="topShelfPathD"
        fill="none"
        stroke="var(--divider, rgba(255, 255, 255, 0.08))"
        stroke-width="1.5"
        stroke-linecap="round"
      />

      <!-- Prateleira inferior da navbar (visível quando o item 4 não estiver ativo) -->
      <path
        v-if="bottomShelfPathD"
        :d="bottomShelfPathD"
        fill="none"
        stroke="var(--divider, rgba(255, 255, 255, 0.08))"
        stroke-width="1.5"
        stroke-linecap="round"
      />

      <!-- Linha contínua principal da página com curva côncava envolvendo o ícone ativo -->
      <path
        :d="strokePathD"
        fill="none"
        stroke="url(#connector-stroke-gradient)"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        filter="url(#connector-accent-glow)"
      />

      <!-- Extensão da prateleira até a borda da tela x=0 quando o item 0 ou 4 está ativo -->
      <path
        v-if="edgeShelfExtensionD"
        :d="edgeShelfExtensionD"
        fill="none"
        stroke="url(#connector-stroke-gradient)"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { getEffectiveNavIndex } from '~/composables/useBottomNavbar'

const route = useRoute()
const auth = useAuth()

const svgWidth = 80
const viewportHeight = ref(800)

// Geometria da navbar colada na tela (left: 0):
const X_PAGE = 60 // Linha vertical da página e borda direita da navbar (60px)
const X_LEFT = 6 // Borda esquerda do abraço do ícone (deixa margem para o botão de 44px)
const Y_HALF = 24 // Meia-altura do abraço (48px total de altura)
const R = 10 // Raio das curvas côncavas e cantos arredondados

// Offsets verticais de cada botão em relação ao centro vertical (50vh):
// Índice 0 (Home): -108px -> topo = -132px
// Índice 1 (Livros): -54px
// Índice 2 (Canvas / Notas): 0px
// Índice 3 (Revisão): +54px
// Índice 4 (Conta): +108px -> base = +132px
const ITEM_OFFSETS = [-108, -54, 0, 54, 108]

const isVisible = computed(() => {
  if (!auth?.isLoggedIn?.value) return false
  const path = route?.path || ''
  if (path.startsWith('/reader')) return false
  if (path.startsWith('/canvas/') && path !== '/canvas') return false
  return true
})

const activeIndex = computed(() => {
  return getEffectiveNavIndex(route?.path || '')
})

// Posição alvo calculada com base no índice ativo
const targetY = computed<number | null>(() => {
  const idx = activeIndex.value
  if (idx < 0 || idx >= ITEM_OFFSETS.length) return null
  return (viewportHeight.value / 2) + ITEM_OFFSETS[idx]
})

// Posição animada fluida a 120 FPS via requestAnimationFrame lerp
const currentY = ref<number | null>(null)
let animFrameId: number | null = null

const startAnimation = (target: number) => {
  if (currentY.value === null) {
    currentY.value = target
    return
  }

  const animate = () => {
    if (currentY.value === null) {
      currentY.value = target
      return
    }

    const diff = target - currentY.value
    if (Math.abs(diff) < 0.25) {
      currentY.value = target
      animFrameId = null
      return
    }

    // Interpolação suave (lerp amortecido com fator 0.22)
    currentY.value += diff * 0.22
    animFrameId = requestAnimationFrame(animate)
  }

  if (animFrameId) cancelAnimationFrame(animFrameId)
  animFrameId = requestAnimationFrame(animate)
}

watch(
  targetY,
  (newVal) => {
    if (newVal !== null) {
      startAnimation(newVal)
    } else {
      currentY.value = null
    }
  },
  { immediate: true }
)

// Fundo preenchido da navbar com cantos curvados para fora (concavos)
const fillPathD = computed(() => {
  const H = viewportHeight.value
  const Y_CENTER = H / 2
  const Y_NAV_TOP = Y_CENTER - 132
  const Y_NAV_BOTTOM = Y_CENTER + 132

  return [
    `M 0 ${Y_NAV_TOP}`,
    `L ${X_PAGE - R} ${Y_NAV_TOP}`,
    `Q ${X_PAGE} ${Y_NAV_TOP}, ${X_PAGE} ${Y_NAV_TOP - R}`,
    `L ${X_PAGE} ${Y_NAV_BOTTOM + R}`,
    `Q ${X_PAGE} ${Y_NAV_BOTTOM}, ${X_PAGE - R} ${Y_NAV_BOTTOM}`,
    `L 0 ${Y_NAV_BOTTOM}`,
    `Z`
  ].join(' ')
})

// Prateleira superior (quando item 0 não está ativo)
const topShelfPathD = computed(() => {
  if (activeIndex.value === 0) return ''
  const H = viewportHeight.value
  const Y_CENTER = H / 2
  const Y_NAV_TOP = Y_CENTER - 132

  return [
    `M 0 ${Y_NAV_TOP}`,
    `L ${X_PAGE - R} ${Y_NAV_TOP}`,
    `Q ${X_PAGE} ${Y_NAV_TOP}, ${X_PAGE} ${Y_NAV_TOP - R}`
  ].join(' ')
})

// Prateleira inferior (quando item 4 não está ativo)
const bottomShelfPathD = computed(() => {
  if (activeIndex.value === 4) return ''
  const H = viewportHeight.value
  const Y_CENTER = H / 2
  const Y_NAV_BOTTOM = Y_CENTER + 132

  return [
    `M 0 ${Y_NAV_BOTTOM}`,
    `L ${X_PAGE - R} ${Y_NAV_BOTTOM}`,
    `Q ${X_PAGE} ${Y_NAV_BOTTOM}, ${X_PAGE} ${Y_NAV_BOTTOM + R}`
  ].join(' ')
})

// Extensão até a borda da tela x=0 para unificar perfeitamente a linha quando o item da ponta estiver ativo
const edgeShelfExtensionD = computed(() => {
  const H = viewportHeight.value
  const Y_CENTER = H / 2
  if (activeIndex.value === 0) {
    const Y_NAV_TOP = Y_CENTER - 132
    return `M 0 ${Y_NAV_TOP} L ${X_LEFT + R} ${Y_NAV_TOP}`
  }
  if (activeIndex.value === 4) {
    const Y_NAV_BOTTOM = Y_CENTER + 132
    return `M 0 ${Y_NAV_BOTTOM} L ${X_LEFT + R} ${Y_NAV_BOTTOM}`
  }
  return null
})

// Linha de contorno contínua que envolve o ícone ativo
const strokePathD = computed(() => {
  const H = viewportHeight.value
  const y = currentY.value

  if (y === null || activeIndex.value < 0) {
    return `M ${X_PAGE} 0 L ${X_PAGE} ${H}`
  }

  const yTop = y - Y_HALF
  const yBottom = y + Y_HALF

  return [
    `M ${X_PAGE} 0`,
    // Reta vertical da página até a curva superior
    `L ${X_PAGE} ${yTop - R}`,
    // Curva côncava superior conectando a vertical à horizontal superior
    `Q ${X_PAGE} ${yTop}, ${X_PAGE - R} ${yTop}`,
    // Borda superior horizontal
    `L ${X_LEFT + R} ${yTop}`,
    // Canto arredondado superior-esquerdo
    `Q ${X_LEFT} ${yTop}, ${X_LEFT} ${yTop + R}`,
    // Borda lateral esquerda vertical
    `L ${X_LEFT} ${yBottom - R}`,
    // Canto arredondado inferior-esquerdo
    `Q ${X_LEFT} ${yBottom}, ${X_LEFT + R} ${yBottom}`,
    // Borda inferior horizontal
    `L ${X_PAGE - R} ${yBottom}`,
    // Curva côncava inferior conectando a horizontal de volta à vertical da página
    `Q ${X_PAGE} ${yBottom}, ${X_PAGE} ${yBottom + R}`,
    // Reta vertical inferior até o fim da tela
    `L ${X_PAGE} ${H}`
  ].join(' ')
})

// Paradas dinâmicas do gradiente: o laranja dura ~50% da altura da página (25% acima, 25% abaixo)
const HALF_PAGE_SPAN_PCT = 25

const gradientCenter = computed(() => {
  if (currentY.value === null || viewportHeight.value === 0) return '50%'
  const pct = Math.max(0, Math.min(100, (currentY.value / viewportHeight.value) * 100))
  return `${pct.toFixed(1)}%`
})

const gradientOrangeStart = computed(() => {
  if (currentY.value === null || viewportHeight.value === 0) return '37.5%'
  const centerPct = (currentY.value / viewportHeight.value) * 100
  const pct = Math.max(0, Math.min(100, centerPct - (HALF_PAGE_SPAN_PCT * 0.5)))
  return `${pct.toFixed(1)}%`
})

const gradientFadeStart = computed(() => {
  if (currentY.value === null || viewportHeight.value === 0) return '25%'
  const centerPct = (currentY.value / viewportHeight.value) * 100
  const pct = Math.max(0, Math.min(100, centerPct - HALF_PAGE_SPAN_PCT))
  return `${pct.toFixed(1)}%`
})

const gradientOrangeEnd = computed(() => {
  if (currentY.value === null || viewportHeight.value === 0) return '62.5%'
  const centerPct = (currentY.value / viewportHeight.value) * 100
  const pct = Math.max(0, Math.min(100, centerPct + (HALF_PAGE_SPAN_PCT * 0.5)))
  return `${pct.toFixed(1)}%`
})

const gradientFadeEnd = computed(() => {
  if (currentY.value === null || viewportHeight.value === 0) return '75%'
  const centerPct = (currentY.value / viewportHeight.value) * 100
  const pct = Math.max(0, Math.min(100, centerPct + HALF_PAGE_SPAN_PCT))
  return `${pct.toFixed(1)}%`
})

const handleResize = () => {
  if (typeof window !== 'undefined') {
    viewportHeight.value = window.innerHeight
    if (targetY.value !== null) {
      currentY.value = targetY.value
    }
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    viewportHeight.value = window.innerHeight
    if (targetY.value !== null) {
      currentY.value = targetY.value
    }
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
  if (animFrameId) {
    cancelAnimationFrame(animFrameId)
  }
})
</script>

<style scoped>
.navbar-page-bg,
.navbar-page-connector {
  width: 80px;
}
</style>
