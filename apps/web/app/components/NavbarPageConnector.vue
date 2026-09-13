<template>
  <div
    v-if="isVisible"
    class="navbar-page-connector fixed inset-y-0 left-0 pointer-events-none z-30 hidden lg:block md:landscape:block overflow-visible select-none"
    aria-hidden="true"
  >
    <svg
      :width="svgWidth"
      :height="viewportHeight"
      class="w-full h-full overflow-visible"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <!-- Gradiente linear que acende e destaca o contorno ao redor do botão ativo -->
        <linearGradient
          id="connector-stroke-gradient"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stop-color="var(--divider, rgba(255, 255, 255, 0.06))" />
          <stop :offset="gradientStart" stop-color="var(--divider, rgba(255, 255, 255, 0.08))" />
          <stop :offset="gradientCenter" stop-color="var(--accent, #E57B55)" stop-opacity="0.95" />
          <stop :offset="gradientEnd" stop-color="var(--divider, rgba(255, 255, 255, 0.08))" />
          <stop offset="100%" stop-color="var(--divider, rgba(255, 255, 255, 0.06))" />
        </linearGradient>

        <!-- Brilho e reflexo luminoso sutil no abraço do ícone -->
        <filter id="connector-accent-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="3.5" flood-color="var(--accent, #E57B55)" flood-opacity="0.35" />
        </filter>
      </defs>

      <!-- 1. Preenchimento de fusão (mesma cor da navbar e do painel, criando a aba contínua) -->
      <path
        v-if="currentY !== null && activeIndex >= 0"
        :d="fillPathD"
        fill="var(--bg-panel, #121315)"
        class="transition-opacity duration-200"
      />

      <!-- 2. Linha de contorno orgânica contínua (exatamente como no desenho) -->
      <path
        :d="strokePathD"
        fill="none"
        stroke="url(#connector-stroke-gradient)"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        filter="url(#connector-accent-glow)"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { getNavIndexFromPath } from '~/composables/useBottomNavbar'

const route = useRoute()
const auth = useAuth()

const svgWidth = 84
const viewportHeight = ref(800)

// Geometria de encaixe estritamente ENTRE a navbar e o início da página:
const X_PAGE = 74 // Linha vertical da borda da página
const X_ACTIVE_TAB = 56 // Ponto de encaixe com o botão ativo da navbar
const R_NOTCH = 32 // Amplitude vertical suave da transição
const R_BTN = 20 // Meia-altura do botão ativo

// Offsets verticais de cada botão em relação ao centro vertical (50vh):
// Navbar vertical com 5 botões (44px altura + 10px gap):
// Índice 0 (Home): -108px
// Índice 1 (Livros): -54px
// Índice 2 (Canvas / Notas): 0px
// Índice 3 (Revisão): +54px
// Índice 4 (Conta): +108px
const ITEM_OFFSETS = [-108, -54, 0, 54, 108]

const isVisible = computed(() => {
  if (!auth?.isLoggedIn?.value) return false
  const path = route?.path || ''
  if (path.startsWith('/reader')) return false
  if (path.startsWith('/canvas/') && path !== '/canvas') return false
  return true
})

const activeIndex = computed(() => {
  return getNavIndexFromPath(route?.path || '')
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

// Caminho do preenchimento da aba física fundindo botão e painel
const fillPathD = computed(() => {
  const y = currentY.value
  if (y === null || activeIndex.value < 0) return ''

  const yTop = y - R_NOTCH
  const yBtnTop = y - R_BTN
  const yBtnBottom = y + R_BTN
  const yBottom = y + R_NOTCH

  return [
    `M ${X_PAGE} ${yTop}`,
    `C ${X_PAGE} ${y - 16}, ${X_ACTIVE_TAB} ${yBtnTop - 8}, ${X_ACTIVE_TAB} ${yBtnTop}`,
    `L ${X_ACTIVE_TAB} ${yBtnBottom}`,
    `C ${X_ACTIVE_TAB} ${yBtnBottom + 8}, ${X_PAGE} ${y + 16}, ${X_PAGE} ${yBottom}`,
    `Z`
  ].join(' ')
})

// Caminho da linha contínua de contorno externa
const strokePathD = computed(() => {
  const H = viewportHeight.value
  const y = currentY.value

  if (y === null || activeIndex.value < 0) {
    // Linha reta vertical se nenhum item estiver ativo
    return `M ${X_PAGE} 0 L ${X_PAGE} ${H}`
  }

  const yTop = y - R_NOTCH
  const yBtnTop = y - R_BTN
  const yBtnBottom = y + R_BTN
  const yBottom = y + R_NOTCH

  return [
    `M ${X_PAGE} 0`,
    `L ${X_PAGE} ${yTop}`,
    `C ${X_PAGE} ${y - 16}, ${X_ACTIVE_TAB} ${yBtnTop - 8}, ${X_ACTIVE_TAB} ${yBtnTop}`,
    `L ${X_ACTIVE_TAB} ${yBtnBottom}`,
    `C ${X_ACTIVE_TAB} ${yBtnBottom + 8}, ${X_PAGE} ${y + 16}, ${X_PAGE} ${yBottom}`,
    `L ${X_PAGE} ${H}`
  ].join(' ')
})

// Paradas dinâmicas do gradiente de cor para acender ao redor do item ativo
const gradientCenter = computed(() => {
  if (currentY.value === null || viewportHeight.value === 0) return '50%'
  const pct = Math.max(0, Math.min(100, (currentY.value / viewportHeight.value) * 100))
  return `${pct.toFixed(1)}%`
})

const gradientStart = computed(() => {
  if (currentY.value === null || viewportHeight.value === 0) return '42%'
  const pct = Math.max(0, Math.min(100, ((currentY.value - 60) / viewportHeight.value) * 100))
  return `${pct.toFixed(1)}%`
})

const gradientEnd = computed(() => {
  if (currentY.value === null || viewportHeight.value === 0) return '58%'
  const pct = Math.max(0, Math.min(100, ((currentY.value + 60) / viewportHeight.value) * 100))
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
.navbar-page-connector {
  width: 84px;
}
</style>
