<template>
  <Transition name="overlay-fade">
    <div
      v-if="visible"
      class="reader-ai-overlay-container"
      :style="cardStyle"
      @mousedown.stop
      @touchstart.stop
      role="dialog"
      aria-label="Explicação com IA"
    >
      <div class="reader-ai-overlay-card">
        <!-- Header -->
        <header class="reader-ai-overlay-card__header">
          <div class="flex items-center gap-2">
            <SparklesIcon class="w-4 h-4 text-orange-500" />
            <span class="font-semibold text-sm tracking-wide text-zinc-100">Explicação Contextual</span>
          </div>
          <div class="flex items-center gap-1">
            <button
              v-if="htmlContent"
              type="button"
              class="p-1 text-zinc-400 hover:text-zinc-100 rounded transition-colors"
              @click="handleCopy"
              title="Copiar explicação"
            >
              <CheckIcon v-if="copied" class="w-4 h-4 text-emerald-400" />
              <CopyIcon v-else class="w-4 h-4" />
            </button>
            <button
              type="button"
              class="p-1 text-zinc-400 hover:text-zinc-100 rounded transition-colors"
              @click="$emit('close')"
              title="Fechar"
            >
              <XIcon class="w-4 h-4" />
            </button>
          </div>
        </header>

        <!-- Quote Reference (se houver) -->
        <div v-if="selectedText" class="reader-ai-overlay-card__quote">
          <span class="line-clamp-2 italic text-xs text-zinc-400">"{{ selectedText }}"</span>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="reader-ai-overlay-card__loading">
          <div class="flex items-center gap-2 text-sm text-orange-400 py-6 justify-center">
            <Loader2Icon class="w-5 h-5 animate-spin" />
            <span>Gerando explicação didática com IA...</span>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="errorMessage" class="reader-ai-overlay-card__error">
          <AlertCircleIcon class="w-5 h-5 text-rose-400 flex-shrink-0" />
          <div class="text-xs text-rose-300">{{ errorMessage }}</div>
        </div>

        <!-- Content Body -->
        <div v-else class="reader-ai-overlay-card__content" v-html="htmlContent" />

        <!-- Footer Actions -->
        <footer v-if="!isLoading && !errorMessage" class="reader-ai-overlay-card__footer">
          <button
            type="button"
            class="text-xs text-zinc-400 hover:text-orange-400 transition-colors font-medium"
            @click="$emit('create-booklet', selectedText)"
          >
            Aprofundar em Livreto
          </button>
          <button
            type="button"
            class="text-xs bg-orange-600/20 text-orange-400 hover:bg-orange-600 hover:text-white px-3 py-1.5 rounded transition-all font-medium border border-orange-500/30"
            @click="$emit('save-note', { text: selectedText, explanation: htmlContent })"
          >
            Salvar Anotação
          </button>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { SparklesIcon, XIcon, CopyIcon, CheckIcon, Loader2Icon, AlertCircleIcon } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    visible: boolean
    x?: number
    y?: number
    selectedText?: string
    htmlContent?: string
    isLoading?: boolean
    errorMessage?: string | null
  }>(),
  {
    visible: false,
    x: 100,
    y: 100,
    selectedText: '',
    htmlContent: '',
    isLoading: false,
    errorMessage: null,
  }
)

defineEmits<{
  (e: 'close'): void
  (e: 'create-booklet', topic: string): void
  (e: 'save-note', payload: { text: string; explanation: string }): void
}>()

const copied = ref(false)

const cardStyle = computed(() => {
  const safeX = Math.max(16, Math.min(props.x, typeof window !== 'undefined' ? window.innerWidth - 380 : 400))
  const safeY = Math.max(70, Math.min(props.y, typeof window !== 'undefined' ? window.innerHeight - 300 : 300))
  return {
    left: `${safeX}px`,
    top: `${safeY}px`,
  }
})

function handleCopy() {
  if (!props.htmlContent) return
  const temp = document.createElement('div')
  temp.innerHTML = props.htmlContent
  const text = temp.textContent || temp.innerText || ''
  navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<style scoped>
.reader-ai-overlay-container {
  position: fixed;
  z-index: 9999;
  width: 360px;
  max-width: calc(100vw - 32px);
}

.reader-ai-overlay-card {
  background: rgba(18, 19, 21, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(249, 115, 22, 0.35);
  border-radius: 1rem;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.65);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.reader-ai-overlay-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.reader-ai-overlay-card__quote {
  padding: 0.5rem 1rem;
  background: rgba(249, 115, 22, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.reader-ai-overlay-card__content {
  padding: 1rem;
  max-height: 280px;
  overflow-y: auto;
  font-size: 0.95rem;
  color: #f4f4f5;
  line-height: 1.6;
}

.reader-ai-overlay-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.reader-ai-overlay-card__error {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem;
  background: rgba(244, 63, 94, 0.1);
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}
</style>
