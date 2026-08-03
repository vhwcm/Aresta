<template>
  <div class="reader-viewer">
    <header class="reader-viewer__header" id="reader-header">
      <div class="reader-viewer__header-left">
        <button
          class="reader-viewer__icon-btn"
          @click="store.reset()"
          aria-label="Fechar livro"
          id="btn-close-book"
        >
          ✕
        </button>
      </div>
      <div class="reader-viewer__header-center">
        <span class="reader-viewer__book-title">{{ store.title }}</span>
      </div>
      <div class="reader-viewer__header-right">
        <span class="reader-viewer__page-info">
          {{ store.currentPage }} / {{ store.totalPages }}
        </span>
      </div>
    </header>

    <main class="reader-viewer__canvas-area">
      <button
        class="reader-viewer__nav-btn reader-viewer__nav-btn--prev"
        :disabled="store.isFirstPage || isTransitioning"
        @click="pageRenderer?.previous()"
        aria-label="Página anterior"
        id="btn-prev-page"
      >
        ‹
      </button>

      <div class="reader-viewer__book-stage" id="book-stage">
        <ReaderEnginePageCurlCanvas
          ref="pageRenderer"
          @transition-state="isTransitioning = $event"
        />
      </div>

      <button
        class="reader-viewer__nav-btn reader-viewer__nav-btn--next"
        :disabled="store.isLastPage || isTransitioning"
        @click="pageRenderer?.next()"
        aria-label="Próxima página"
        id="btn-next-page"
      >
        ›
      </button>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useReaderStore } from '~/stores/readerStore'

const store = useReaderStore()

interface PageRenderer {
  next: () => Promise<void>
  previous: () => Promise<void>
}

const pageRenderer = ref<PageRenderer | null>(null)
const isTransitioning = ref(false)

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
.reader-viewer {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100%;
  overflow: hidden;
  background: var(--color-bg);
}

.reader-viewer__header {
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

.reader-viewer__header-left,
.reader-viewer__header-right {
  min-width: 80px;
  display: flex;
  align-items: center;
}

.reader-viewer__header-right {
  justify-content: flex-end;
}

.reader-viewer__icon-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 1rem;
  cursor: pointer;
  padding: 0.4rem 0.6rem;
  border-radius: var(--radius-sm);
  transition: background 0.2s, color 0.2s;
}

.reader-viewer__icon-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text-primary);
}

.reader-viewer__book-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

.reader-viewer__page-info {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.reader-viewer__canvas-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem;
  overflow: hidden;
}

.reader-viewer__book-stage {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: calc(100% - 120px);
}

.reader-viewer__nav-btn {
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

.reader-viewer__nav-btn:not(:disabled):hover {
  background: rgba(124, 106, 247, 0.12);
  border-color: rgba(124, 106, 247, 0.4);
  color: var(--color-accent);
}

.reader-viewer__nav-btn:disabled {
  opacity: 0.2;
  cursor: not-allowed;
}
</style>
