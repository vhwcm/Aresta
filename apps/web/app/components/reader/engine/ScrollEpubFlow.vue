<template>
  <div class="scroll-epub-flow">
    <div
      v-for="sectionIdx in sectionCount"
      :key="'epub-sec-' + sectionIdx"
      :ref="(el) => setSectionSlotRef(el as HTMLElement, sectionIdx - 1)"
      class="scroll-section-slot"
      :data-section-index="sectionIdx - 1"
      :data-page-number="getPageForSection(sectionIdx - 1)"
      :style="{
        fontFamily: fontFamily,
        fontSize: `${fontSize}px`,
      }"
    >
      <template v-if="visibleSections[sectionIdx - 1]">
        <div
          :ref="(el) => setSectionContentRef(el as HTMLElement, sectionIdx - 1)"
          class="scroll-section-content"
          @click="$emit('highlight-click', $event)"
        />
        <slot name="focus-overlay" :section-idx="sectionIdx - 1" />
      </template>

      <div
        v-else
        class="scroll-section-placeholder min-h-[300px] flex items-center justify-center opacity-30 select-none text-xs font-technical"
      >
        Carregando seção {{ sectionIdx }}...
      </div>

      <div
        v-if="getPageForSection(sectionIdx - 1) > 0"
        class="scroll-page-slot__badge"
        aria-hidden="true"
      >
        {{ getPageForSection(sectionIdx - 1) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IBookDocument } from '~/interfaces/reader/IBookDocument'
import { computeAnchorScrollDelta, applyScrollDelta } from '~/utils/reader/scroll/anchorCompensation'
import { estimateBlockHeight } from '~/utils/reader/scroll/heightEstimator'

const props = defineProps<{
  document: IBookDocument | null
  sectionCount: number
  visibleSections: Record<number, boolean>
  fontFamily: string
  fontSize: number
}>()

const emit = defineEmits<{
  (_e: 'section-slot-ref', _el: HTMLElement | null, _sectionIdx: number): void
  (_e: 'section-content-ref', _el: HTMLElement | null, _sectionIdx: number): void
  (_e: 'highlight-click', _e2: MouseEvent): void
}>()

function getPageForSection(sectionIdx: number): number {
  if (props.document && typeof (props.document as any).getPageForSection === 'function') {
    return (props.document as any).getPageForSection(sectionIdx) || 1
  }
  return 1
}

function setSectionSlotRef(el: HTMLElement | null, sectionIdx: number) {
  emit('section-slot-ref', el, sectionIdx)
}

function setSectionContentRef(el: HTMLElement | null, sectionIdx: number) {
  emit('section-content-ref', el, sectionIdx)
}

/**
 * Procura nó de texto e offset exato dentro da seção para scroll por Range
 */
function findRangeForOffset(container: HTMLElement, charOffset: number): Range | null {
  if (typeof document === 'undefined' || !container) return null
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT
        const tag = parent.tagName.toLowerCase()
        if (tag === 'script' || tag === 'style' || tag === 'noscript') return NodeFilter.FILTER_REJECT
        return NodeFilter.FILTER_ACCEPT
      }
    }
  )

  let accumulated = 0
  let node = walker.nextNode() as Text | null
  while (node) {
    const len = node.data.length
    if (accumulated + len >= charOffset) {
      const localOffset = Math.max(0, Math.min(len, charOffset - accumulated))
      const range = document.createRange()
      range.setStart(node, localOffset)
      range.setEnd(node, localOffset)
      return range
    }
    accumulated += len
    node = walker.nextNode() as Text | null
  }
  return null
}

defineExpose({
  getPageForSection,
  findRangeForOffset,
  computeAnchorScrollDelta,
  applyScrollDelta,
  estimateBlockHeight
})
</script>

<style scoped>
.scroll-epub-flow {
  display: flex;
  flex-direction: column;
  gap: 32px;
  width: 100%;
}

.scroll-section-slot {
  position: relative;
  width: 100%;
}

.scroll-section-content {
  width: 100%;
  line-height: 1.7;
}

.scroll-page-slot__badge {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 9999px;
  pointer-events: none;
  opacity: 0.6;
  background: rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(4px);
}
</style>
