<template>
  <div
    class="reader-progress-scrubber select-none relative flex flex-col items-center justify-center w-full"
    @pointermove="handlePointerMove"
    @pointerleave="handlePointerLeave"
  >
    <!-- Balão de Prévia Flutuante ao Arrastar/Hover -->
    <div
      v-if="isHovering || isScrubbing"
      class="scrubber-balloon pointer-events-none absolute -top-14 z-30 flex flex-col items-center px-3 py-1.5 rounded-xl shadow-lg border backdrop-blur-md transition-opacity duration-150"
      :style="{
        left: `${clampedPreviewPercent}%`,
        transform: 'translateX(-50%)',
      }"
      :class="{
        'bg-[#FAF5E8]/95 border-[#dfd5c0] text-[#2a2521]': activeTheme === 'sepia',
        'bg-white/95 border-gray-200 text-gray-900': activeTheme === 'white',
        'bg-[#121214]/95 border-white/10 text-white': activeTheme === 'black',
      }"
    >
      <div class="text-[11px] font-technical font-semibold flex items-center gap-1.5">
        <span class="text-accent">{{ previewLabel }}</span>
        <span class="opacity-60">({{ Math.round(clampedPreviewPercent) }}%)</span>
      </div>
      <div v-if="previewChapter" class="text-[10px] font-interface text-textSecondary truncate max-w-[180px]">
        {{ previewChapter }}
      </div>
      <!-- Triângulo de seta do balão -->
      <div
        class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4"
        :class="{
          'border-t-[#FAF5E8]': activeTheme === 'sepia',
          'border-t-white': activeTheme === 'white',
          'border-t-[#121214]': activeTheme === 'black',
        }"
      />
    </div>

    <!-- Trilho do Scrubber com Marcas de Capítulo -->
    <div class="relative w-full h-6 flex items-center cursor-pointer">
      <input
        type="range"
        min="1"
        :max="totalUnits"
        :value="isScrubbing ? scrubValue : currentUnit"
        class="scrubber-slider w-full h-1.5 appearance-none rounded-full cursor-pointer bg-transparent z-20 focus:outline-hidden"
        @input="onSliderInput"
        @change="onSliderCommit"
        @pointerdown="onSliderPointerDown"
        @pointerup="onSliderPointerUp"
        @touchstart="onSliderPointerDown"
        @touchend="onSliderTouchEnd"
        @keyup.enter="onSliderCommit"
        aria-label="Controle de progresso de leitura"
      />

      <!-- Linha de fundo do trilho -->
      <div
        class="absolute left-0 right-0 h-1.5 rounded-full pointer-events-none z-0"
        :class="{
          'bg-[#e2d7c0]': activeTheme === 'sepia',
          'bg-gray-200': activeTheme === 'white',
          'bg-white/10': activeTheme === 'black',
        }"
      />

      <!-- Barra de progresso preenchida -->
      <div
        class="absolute left-0 h-1.5 rounded-full bg-accent pointer-events-none z-10 transition-all duration-75"
        :style="{ width: `${progressPercentage}%` }"
      />

      <!-- Marcas de Capítulo (profundidade 0) -->
      <div class="absolute inset-0 pointer-events-none z-10">
        <div
          v-for="(tick, idx) in chapterTicks"
          :key="idx"
          class="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full opacity-60 transition-opacity"
          :style="{ left: `${tick.percent}%` }"
          :class="{
            'bg-[#786C5E]': activeTheme === 'sepia',
            'bg-gray-400': activeTheme === 'white',
            'bg-white/40': activeTheme === 'black',
          }"
          :title="tick.label"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useReaderStore } from '~/stores/readerStore'
import { useLocationProgress } from '~/composables/reader/useLocationProgress'
import { useReadingNavigation } from '~/composables/reader/useReadingNavigation'
import type { TocEntry } from '~/utils/reader/toc/tocNormalizer'

const store = useReaderStore()
const { currentUnit, totalUnits, progressPercentage, isEpub, cachedToc } = useLocationProgress()
const { goToPosition } = useReadingNavigation()

const activeTheme = computed(() => store.readerTheme || 'sepia')

const isHovering = ref(false)
const isScrubbing = ref(false)
const scrubValue = ref(1)
const hoverPercent = ref(0)

const chapterTicks = computed(() => {
  const tot = totalUnits.value || 1
  return cachedToc.value
    .filter((entry) => entry.depth === 0)
    .map((entry) => ({
      percent: Math.max(0, Math.min(100, (entry.unit / tot) * 100)),
      label: entry.label,
    }))
})

const currentPreviewUnit = computed(() => {
  if (isScrubbing.value) return scrubValue.value
  const tot = totalUnits.value || 1
  return Math.max(1, Math.min(tot, Math.round((hoverPercent.value / 100) * tot)))
})

const clampedPreviewPercent = computed(() => {
  const tot = totalUnits.value || 1
  return Math.max(0, Math.min(100, (currentPreviewUnit.value / tot) * 100))
})

const previewLabel = computed(() => {
  const u = currentPreviewUnit.value.toLocaleString('pt-BR')
  const t = (totalUnits.value || 1).toLocaleString('pt-BR')
  if (isEpub.value) return `Loc. ${u} de ${t}`
  return `Pág. ${u} de ${t}`
})

function findChapterInToc(entries: TocEntry[], targetUnit: number): string | null {
  let matched: string | null = null
  for (const entry of entries) {
    if (entry.unit <= targetUnit) {
      matched = entry.label
      if (entry.children && entry.children.length > 0) {
        const childMatch = findChapterInToc(entry.children, targetUnit)
        if (childMatch) matched = childMatch
      }
    }
  }
  return matched
}

const previewChapter = computed(() => {
  if (!cachedToc.value || cachedToc.value.length === 0) return null
  return findChapterInToc(cachedToc.value, currentPreviewUnit.value)
})

function handlePointerMove(e: PointerEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  if (rect.width > 0) {
    hoverPercent.value = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    isHovering.value = true
  }
}

function handlePointerLeave() {
  isHovering.value = false
}

function commitScrub(val?: number) {
  const targetVal = val !== undefined && !isNaN(val) ? val : scrubValue.value
  isScrubbing.value = false
  if (!isNaN(targetVal) && targetVal >= 1) {
    const doc = store.document
    if (doc && typeof (doc as any).unitToPosition === 'function') {
      const pos = (doc as any).unitToPosition(targetVal)
      goToPosition(pos)
    } else {
      store.goToPage(targetVal)
    }
  }
}

function onSliderInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  if (!isNaN(val)) {
    scrubValue.value = val
    isScrubbing.value = true
  }
}

function onSliderPointerDown() {
  isScrubbing.value = true
}

function onSliderPointerUp(e: PointerEvent) {
  if (isScrubbing.value) {
    const val = Number((e.target as HTMLInputElement).value)
    commitScrub(!isNaN(val) ? val : scrubValue.value)
  }
}

function onSliderTouchEnd(e: TouchEvent) {
  if (isScrubbing.value) {
    const val = Number((e.target as HTMLInputElement).value)
    commitScrub(!isNaN(val) ? val : scrubValue.value)
  }
}

function onSliderCommit(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  commitScrub(val)
}
</script>

<style scoped>
.scrubber-slider::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent, #E57B55);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.scrubber-slider::-webkit-slider-thumb:hover {
  transform: scale(1.25);
}

.scrubber-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent, #E57B55);
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.scrubber-slider::-moz-range-thumb:hover {
  transform: scale(1.25);
}
</style>
