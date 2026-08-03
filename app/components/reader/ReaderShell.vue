<template>
  <div class="reader-shell">
    <transition name="fade" mode="out-in">
      <ReaderUploader v-if="!store.hasDocument" key="upload" />
      <ReaderViewer v-else key="reader" />
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
import { computed } from 'vue'
import { useReaderStore } from '~/stores/readerStore'

const store = useReaderStore()

const loadingLabel = computed(() =>
  store.documentType === 'epub' ? 'EPUB' : 'PDF',
)
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
