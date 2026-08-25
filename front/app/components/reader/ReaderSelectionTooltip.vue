<template>
  <Transition name="tooltip-fade">
    <div
      v-if="visible"
      ref="tooltipRef"
      class="reader-selection-tooltip"
      :style="tooltipStyle"
      @mousedown.stop
      @touchstart.stop
      role="toolbar"
      aria-label="Ações de seleção de texto"
    >
      <div class="reader-selection-tooltip__inner">
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

        <div class="reader-selection-tooltip__divider" role="separator" />

        <!-- Botão Copiar -->
        <button
          type="button"
          class="reader-selection-tooltip__btn"
          @click="handleCopy"
          :title="copied ? 'Copiado!' : 'Copiar texto'"
          :aria-label="copied ? 'Copiado para a área de transferência' : 'Copiar texto'"
        >
          <CheckIcon v-if="copied" class="w-4 h-4 text-emerald-400" />
          <CopyIcon v-else class="w-4 h-4 text-textSecondary" />
          <span :class="{ 'text-emerald-400': copied }">
            {{ copied ? 'Copiado!' : 'Copiar' }}
          </span>
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
import { ref, computed, onUnmounted } from 'vue'
import { HighlighterIcon, CopyIcon, CheckIcon } from 'lucide-vue-next'

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
  (e: 'close'): void
}>()

const tooltipRef = ref<HTMLElement | null>(null)
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

const tooltipStyle = computed(() => {
  return {
    left: `${props.x}px`,
    top: `${props.y}px`,
    transform: 'translate(-50%, 0)',
  }
})

function handleAnnotate() {
  emit('annotate', {
    text: props.selectedText,
    pageNumber: props.pageNumber,
  })
}

async function handleCopy() {
  if (!props.selectedText) return
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(props.selectedText)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = props.selectedText
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Falha ao copiar texto selecionado:', err)
  }
}

onUnmounted(() => {
  if (copyTimer) clearTimeout(copyTimer)
})
</script>

<style scoped>
.reader-selection-tooltip {
  position: fixed;
  z-index: 60;
  pointer-events: auto;
  user-select: none;
  -webkit-user-select: none;
  filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.5));
}

.reader-selection-tooltip__inner {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  background: rgba(18, 19, 21, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 9999px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(229, 123, 85, 0.15);
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
  background: rgba(18, 19, 21, 0.95);
  border-left: 1px solid rgba(255, 255, 255, 0.12);
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  transform: translateX(-50%) rotate(45deg);
  pointer-events: none;
}

.reader-selection-tooltip__arrow--bottom {
  bottom: -5px;
  border-left: none;
  border-top: none;
  border-right: 1px solid rgba(255, 255, 255, 0.12);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.reader-selection-tooltip__arrow--top {
  top: -5px;
}

/* Transições do Tooltip */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 6px) scale(0.92);
}
</style>
