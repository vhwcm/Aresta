<template>
  <div
    class="drop-zone"
    :class="{
      'drop-zone--dragging': isDraggingOver,
      'drop-zone--error': hasError,
      'drop-zone--validating': isValidating,
    }"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
    @click="triggerFileInput"
    id="drop-zone-area"
    role="button"
    tabindex="0"
    :aria-label="ariaLabel"
    @keydown.enter.space.prevent="triggerFileInput"
  >
    <input
      ref="fileInputRef"
      type="file"
      class="drop-zone__input"
      accept=".pdf,.epub"
      @change="onFileInputChange"
      id="file-input-hidden"
      aria-hidden="true"
    />

    <div class="drop-zone__content">
      <div class="drop-zone__icon" aria-hidden="true">
        <svg v-if="!isValidating" width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path
            d="M24 4L24 32M24 4L16 12M24 4L32 12"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M8 36V40C8 41.1 8.9 42 10 42H38C39.1 42 40 41.1 40 40V36"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          />
        </svg>
        <div v-else class="drop-zone__spinner" />
      </div>

      <div class="drop-zone__text">
        <p class="drop-zone__primary-text">
          {{ primaryText }}
        </p>
        <p class="drop-zone__secondary-text">
          {{ secondaryText }}
        </p>
      </div>

      <div v-if="hasError" class="drop-zone__error" role="alert" id="drop-zone-error">
        <span class="drop-zone__error-icon" aria-hidden="true">⚠️</span>
        {{ errorMessage }}
      </div>

      <div class="drop-zone__formats" aria-label="Formatos aceitos">
        <span class="drop-zone__format-badge">PDF</span>
        <span class="drop-zone__format-badge">EPUB</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFileValidator } from '~/composables/reader/useFileValidator'
import type { SupportedFileType } from '~/interfaces/reader/IValidationResult'

const emit = defineEmits<{
  (e: 'file-validated', result: { file: File; type: SupportedFileType }): void
}>()

const { validate, isValidating } = useFileValidator()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDraggingOver = ref(false)
const errorMessage = ref<string | null>(null)
const dragCounter = ref(0)

const hasError = computed(() => errorMessage.value !== null)

const primaryText = computed(() => {
  if (isValidating.value) return 'Validando arquivo...'
  if (isDraggingOver.value) return 'Solte o arquivo aqui'
  return 'Solte seu arquivo aqui'
})

const secondaryText = computed(() => {
  if (isValidating.value) return 'Verificando assinatura de bytes...'
  return 'ou clique para selecionar'
})

const ariaLabel = computed(() => {
  if (isValidating.value) return 'Validando arquivo, aguarde'
  return 'Área de upload. Clique ou arraste um arquivo PDF ou EPUB'
})

function triggerFileInput() {
  if (isValidating.value) return
  fileInputRef.value?.click()
}

function onDragEnter() {
  dragCounter.value++
  isDraggingOver.value = true
}

function onDragOver() {
  isDraggingOver.value = true
}

function onDragLeave() {
  dragCounter.value--
  if (dragCounter.value <= 0) {
    dragCounter.value = 0
    isDraggingOver.value = false
  }
}

async function onDrop(event: DragEvent) {
  isDraggingOver.value = false
  dragCounter.value = 0
  const file = event.dataTransfer?.files?.[0]
  if (file) await processFile(file)
}

async function onFileInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await processFile(file)
  input.value = ''
}

async function processFile(file: File) {
  errorMessage.value = null
  const result = await validate(file)

  if (!result.valid) {
    errorMessage.value = result.message
    return
  }

  emit('file-validated', { file, type: result.fileType })
}
</script>

<style scoped>
.drop-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 320px;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  cursor: pointer;
  transition:
    border-color 0.25s ease,
    background 0.25s ease,
    transform 0.15s ease;
  outline: none;
  user-select: none;
}

.drop-zone:focus-visible {
  box-shadow: 0 0 0 3px rgba(124, 106, 247, 0.5);
}

.drop-zone:hover,
.drop-zone--dragging {
  border-color: var(--color-accent);
  background: rgba(124, 106, 247, 0.06);
  transform: scale(1.01);
}

.drop-zone--error {
  border-color: var(--color-error);
  background: rgba(247, 106, 106, 0.04);
}

.drop-zone--validating {
  pointer-events: none;
  border-color: rgba(124, 106, 247, 0.5);
}

.drop-zone__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.drop-zone__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
}

.drop-zone__icon {
  color: var(--color-accent);
  opacity: 0.8;
  transition: opacity 0.2s, transform 0.2s;
}

.drop-zone:hover .drop-zone__icon {
  opacity: 1;
  transform: translateY(-4px);
}

.drop-zone__spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(124, 106, 247, 0.2);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.drop-zone__text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.drop-zone__primary-text {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.drop-zone__secondary-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.drop-zone__error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: rgba(247, 106, 106, 0.12);
  border: 1px solid rgba(247, 106, 106, 0.3);
  border-radius: var(--radius-sm);
  color: var(--color-error);
  font-size: 0.875rem;
  max-width: 400px;
}

.drop-zone__formats {
  display: flex;
  gap: 0.5rem;
}

.drop-zone__format-badge {
  padding: 0.2rem 0.6rem;
  background: rgba(124, 106, 247, 0.1);
  border: 1px solid rgba(124, 106, 247, 0.25);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-accent);
  letter-spacing: 0.05em;
}
</style>
