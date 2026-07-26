<template>
  <div class="reader-shell">
    <transition name="fade" mode="out-in">
      <div v-if="!store.hasDocument" class="reader-shell__upload" key="upload">
        <div class="reader-shell__upload-inner">
          <div class="reader-shell__upload-header">
            <NuxtLink to="/" class="reader-shell__back">
              ← Voltar
            </NuxtLink>
            <h1 class="reader-shell__title">Aresta</h1>
          </div>
          <ReaderUploadDropZone
            id="reader-drop-zone"
            @file-validated="onFileValidated"
          />
          <p v-if="store.error" class="reader-shell__global-error" role="alert">
            {{ store.error }}
          </p>
        </div>
      </div>

      <div v-else class="reader-shell__reader" key="reader">
        <header class="reader-shell__header" id="reader-header">
          <div class="reader-shell__header-left">
            <button
              class="reader-shell__icon-btn"
              @click="store.reset()"
              aria-label="Fechar livro"
              id="btn-close-book"
            >
              ✕
            </button>
          </div>
          <div class="reader-shell__header-center">
            <span class="reader-shell__book-title">{{ store.title }}</span>
          </div>
          <div class="reader-shell__header-right">
            <span class="reader-shell__page-info">
              {{ store.currentPage }} / {{ store.totalPages }}
            </span>
          </div>
        </header>

        <main class="reader-shell__canvas-area">
          <button
            class="reader-shell__nav-btn reader-shell__nav-btn--prev"
            :disabled="store.isFirstPage || isTransitioning"
            @click="pageRenderer?.previous()"
            aria-label="Página anterior"
            id="btn-prev-page"
          >
            ‹
          </button>

          <div class="reader-shell__book-stage" id="book-stage">
            <ReaderEnginePageCurlCanvas
              ref="pageRenderer"
              @transition-state="isTransitioning = $event"
            />
          </div>

          <button
            class="reader-shell__nav-btn reader-shell__nav-btn--next"
            :disabled="store.isLastPage || isTransitioning"
            @click="pageRenderer?.next()"
            aria-label="Próxima página"
            id="btn-next-page"
          >
            ›
          </button>
        </main>
      </div>
    </transition>

    <div
      v-if="store.isLoading"
      class="reader-shell__global-loading"
      role="status"
      aria-live="polite"
      aria-label="Carregando livro"
    >
      <div class="reader-shell__global-spinner" />
      <p>Carregando {{ loadingLabel }}...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useReaderStore } from '~/stores/readerStore'
import { useFileValidator } from '~/composables/reader/useFileValidator'
import { createBookDocument } from '~/adapters/BookDocumentFactory'

const store = useReaderStore()
const { validate } = useFileValidator()

interface PageRenderer {
  next: () => Promise<void>
  previous: () => Promise<void>
}

const pageRenderer = ref<PageRenderer | null>(null)
const isTransitioning = ref(false)

const loadingLabel = computed(() =>
  store.documentType === 'epub' ? 'EPUB' : 'PDF',
)

async function onFileValidated({ file, type }: { file: File; type: 'pdf' | 'epub' }) {
  store.setLoading(true)

  try {
    const doc = createBookDocument(type)
    await doc.load(file)
    store.setDocument(doc, file.name)
  } catch (error) {
    store.setError(`Falha ao abrir o arquivo: ${String(error)}`)
  }
}

function isTextInput(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement
    || (target instanceof HTMLElement && target.isContentEditable)
}

function onKeyDown(event: KeyboardEvent) {
  if (!store.hasDocument || isTransitioning.value || isTextInput(event.target)) return
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    void pageRenderer.value?.next()
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    void pageRenderer.value?.previous()
  }
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<style scoped>
.reader-shell {
  position: relative;
  width: 100%;
  height: 100dvh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
}

.reader-shell__upload {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 2rem;
}

.reader-shell__upload-inner {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.reader-shell__upload-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.reader-shell__back {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.reader-shell__back:hover {
  color: var(--color-text-primary);
}

.reader-shell__title {
  font-size: 1.2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #7c6af7, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.reader-shell__global-error {
  color: var(--color-error);
  font-size: 0.875rem;
  text-align: center;
  padding: 0.75rem 1rem;
  background: rgba(247, 106, 106, 0.08);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(247, 106, 106, 0.2);
}

.reader-shell__reader {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
}

.reader-shell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: rgba(10, 10, 14, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  z-index: 10;
}

.reader-shell__header-left,
.reader-shell__header-right {
  min-width: 80px;
  display: flex;
  align-items: center;
}

.reader-shell__header-right {
  justify-content: flex-end;
}

.reader-shell__icon-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 1rem;
  cursor: pointer;
  padding: 0.4rem 0.6rem;
  border-radius: var(--radius-sm);
  transition: background 0.2s, color 0.2s;
}

.reader-shell__icon-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text-primary);
}

.reader-shell__book-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

.reader-shell__page-info {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.reader-shell__canvas-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem;
  overflow: hidden;
}

.reader-shell__book-stage {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: calc(100% - 120px);
}

.reader-shell__nav-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 2rem;
  line-height: 1;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.reader-shell__nav-btn:not(:disabled):hover {
  background: rgba(124, 106, 247, 0.12);
  border-color: rgba(124, 106, 247, 0.4);
  color: var(--color-accent);
}

.reader-shell__nav-btn:disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

.reader-shell__global-loading {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 14, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  z-index: 100;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.reader-shell__global-spinner {
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
