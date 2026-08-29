<template>
  <Transition name="tooltip-fade">
    <div
      v-if="visible"
      ref="tooltipRef"
      class="reader-selection-tooltip"
      :class="isAbove ? 'reader-selection-tooltip--above' : 'reader-selection-tooltip--below'"
      :style="{ left: `${Math.round(x)}px`, top: `${Math.round(y)}px` }"
      @mousedown.stop
      @touchstart.stop
      role="toolbar"
      aria-label="Ações de seleção de texto"
    >
      <div class="reader-selection-tooltip__inner">
        <!-- Botão Dicionário (quando for palavra única) -->
        <button
          v-if="isSingleWord"
          type="button"
          class="reader-selection-tooltip__btn reader-selection-tooltip__btn--dictionary"
          @click="handleOpenDictionary"
          title="Consultar no Dicionário Offline"
          aria-label="Consultar no Dicionário"
        >
          <BookOpenIcon class="w-4 h-4 text-accent" />
          <span>Dicionário</span>
        </button>

        <div v-if="isSingleWord" class="reader-selection-tooltip__divider" role="separator" />

        <!-- Botão Criar Anotação -->
        <button
          type="button"
          class="reader-selection-tooltip__btn reader-selection-tooltip__btn--primary"
          @click="handleAnnotate"
          title="Criar anotação com este trecho"
          aria-label="Criar Anotação"
        >
          <HighlighterIcon class="w-4 h-4 text-accent" />
          <span>Anotar</span>
        </button>
      </div>

      <!-- Seta indicadora (Arrow) -->
      <div
        class="reader-selection-tooltip__arrow"
        :class="isAbove ? 'reader-selection-tooltip__arrow--bottom' : 'reader-selection-tooltip__arrow--top'"
      />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { HighlighterIcon, BookOpenIcon } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    visible: boolean
    x: number
    y: number
    selectedText: string
    pageNumber?: number
    isAbove?: boolean
  }>(),
  {
    visible: false,
    x: 0,
    y: 0,
    selectedText: '',
    pageNumber: 1,
    isAbove: true,
  },
)

const emit = defineEmits<{
  (e: 'annotate', payload: { text: string; pageNumber?: number }): void
  (e: 'open-dictionary', payload: { word: string; pageNumber?: number }): void
  (e: 'close'): void
}>()

const tooltipRef = ref<HTMLElement | null>(null)

const isSingleWord = computed(() => {
  const text = props.selectedText.trim()
  return text.length > 0 && text.split(/\s+/).length === 1
})

function handleOpenDictionary() {
  emit('open-dictionary', {
    word: props.selectedText.trim(),
    pageNumber: props.pageNumber,
  })
}

function handleAnnotate() {
  emit('annotate', {
    text: props.selectedText,
    pageNumber: props.pageNumber,
  })
}
</script>

<style scoped>
.reader-selection-tooltip {
  position: fixed;
  z-index: 60;
  pointer-events: auto;
  user-select: none;
  -webkit-user-select: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  backface-visibility: hidden;
  transform: translate3d(-50%, 0, 0);
}

.reader-selection-tooltip--above {
  transform: translate3d(-50%, -100%, 0);
}

.reader-selection-tooltip--below {
  transform: translate3d(-50%, 0, 0);
}

.reader-selection-tooltip__inner {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  background: rgba(18, 19, 21, 0.96);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 9999px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(229, 123, 85, 0.2);
}

.reader-selection-tooltip__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 9999px;
  background: transparent;
  border: none;
  color: var(--color-text-primary, #f2f2f2);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s ease;
}

.reader-selection-tooltip__btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.reader-selection-tooltip__btn:active {
  transform: scale(0.96);
}

.reader-selection-tooltip__btn--primary {
  background: rgba(229, 123, 85, 0.12);
  color: #ffffff;
}

.reader-selection-tooltip__btn--primary:hover {
  background: rgba(229, 123, 85, 0.22);
}

.reader-selection-tooltip__btn--dictionary {
  background: rgba(229, 123, 85, 0.18);
  color: #ffffff;
  font-weight: 600;
}

.reader-selection-tooltip__btn--dictionary:hover {
  background: rgba(229, 123, 85, 0.28);
}

.reader-selection-tooltip__divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.12);
  margin: 0 2px;
}

.reader-selection-tooltip__arrow {
  position: absolute;
  left: 50%;
  width: 10px;
  height: 10px;
  background: rgba(18, 19, 21, 0.96);
  border-left: 1px solid rgba(255, 255, 255, 0.14);
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  transform: translate3d(-50%, 0, 0) rotate(45deg);
  pointer-events: none;
}

.reader-selection-tooltip__arrow--bottom {
  bottom: -5px;
  border-left: none;
  border-top: none;
  border-right: 1px solid rgba(255, 255, 255, 0.14);
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.reader-selection-tooltip__arrow--top {
  top: -5px;
}

/* Transições do Tooltip */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.tooltip-fade-enter-from.reader-selection-tooltip--above,
.tooltip-fade-leave-to.reader-selection-tooltip--above {
  opacity: 0;
  transform: translate3d(-50%, calc(-100% + 6px), 0) scale(0.92);
}

.tooltip-fade-enter-from.reader-selection-tooltip--below,
.tooltip-fade-leave-to.reader-selection-tooltip--below {
  opacity: 0;
  transform: translate3d(-50%, -6px, 0) scale(0.92);
}
</style>

