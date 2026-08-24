<template>
  <div class="reader-viewer">
    <!-- Header Superior -->
    <header class="reader-viewer__header" id="reader-header">
      <div class="reader-viewer__header-left">
        <button
          class="reader-viewer__icon-btn"
          @click="handleClose"
          aria-label="Sair da leitura e voltar"
          id="btn-close-book"
          title="Sair da leitura"
        >
          ← Sair
        </button>
      </div>

      <div class="reader-viewer__header-center">
        <span class="reader-viewer__book-title">{{ store.title }}</span>
      </div>

      <div class="reader-viewer__header-right flex items-center gap-3">
        <!-- Botão para recolher/expandir Grafo no Desktop -->
        <button
          @click="store.toggleGraph()"
          class="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-divider hover:bg-white/5 transition-all text-textSecondary hover:text-textPrimary"
          :title="store.isGraphOpen ? 'Recolher Grafo para focar 100% no livro' : 'Exibir Grafo de Conhecimento (50% da tela)'"
        >
          <NetworkIcon class="w-3.5 h-3.5 text-accent" />
          <span>{{ store.isGraphOpen ? 'Foco Leitura (100%)' : 'Abrir Grafo (50%)' }}</span>
        </button>

        <span class="reader-viewer__page-info">
          {{ store.currentPage }} / {{ store.totalPages }}
        </span>
      </div>
    </header>

    <!-- Corpo Principal com Divisão Leitor / Grafo -->
    <div class="reader-viewer__body">
      <!-- Seção do Leitor (Mobile: 80% verticalidade / Desktop: 50% ou 100%) -->
      <section
        class="reader-viewer__reader-pane"
        :class="store.isGraphOpen ? 'reader-viewer__reader-pane--half' : 'reader-viewer__reader-pane--full'"
      >
        <!-- Área do Livro / Stage -->
        <main
          class="reader-viewer__canvas-area"
          ref="canvasAreaRef"
          @mouseup="handleTextSelectionCheck"
          @touchend="handleTouchEnd"
          @touchstart="handleTouchStart"
        >
          <div class="reader-viewer__stage-container">
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
          </div>
        </main>

        <!-- Barra Inferior de Controles -->
        <ReaderBottomBar
          :is-graph-active="isDesktop ? store.isGraphOpen : store.isMobileGraphOpen"
          @open-saved-pages="isSavedPagesOpen = true"
          @open-annotation="handleOpenAnnotation"
          @toggle-graph="handleToggleGraph"
        />
      </section>

      <!-- Seção do Grafo de Conhecimento no Desktop (50% da tela) -->
      <aside
        v-if="store.isGraphOpen"
        class="hidden lg:flex lg:w-1/2 h-full flex-col shrink-0 transition-all duration-300"
      >
        <ReaderGraphPanel
          ref="graphPanelRef"
          :is-mobile="false"
          @close="store.setGraphOpen(false)"
          @open-annotation-modal="handleOpenAnnotation"
        />
      </aside>
    </div>

    <!-- Grafo de Conhecimento em Tela Cheia no Mobile -->
    <div
      v-if="store.isMobileGraphOpen"
      class="fixed inset-0 z-50 flex flex-col bg-bgApp lg:hidden animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <ReaderGraphPanel
        ref="mobileGraphPanelRef"
        :is-mobile="true"
        @close="store.setMobileGraphOpen(false)"
        @open-annotation-modal="handleOpenAnnotation"
      />
    </div>

    <!-- Modal de Páginas Salvas (Bookmarks) -->
    <ReaderSavedPagesModal
      :is-open="isSavedPagesOpen"
      @close="isSavedPagesOpen = false"
      @select-page="handleSelectSavedPage"
    />

    <!-- Modal de Criação de Anotação com Seleção de Tema e Nota -->
    <ReaderAnnotationModal
      :is-open="isAnnotationModalOpen"
      :initial-text="capturedSelectionText"
      :current-page="store.currentPage"
      :book-id="store.bookId"
      @close="isAnnotationModalOpen = false"
      @created="handleAnnotationCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { NetworkIcon } from 'lucide-vue-next'
import { useReaderStore } from '~/stores/readerStore'
import { useReadingTimer } from '~/composables/reader/useReadingTimer'

import ReaderEnginePageCurlCanvas from '~/components/reader/engine/PageCurlCanvas.vue'
import ReaderBottomBar from '~/components/reader/ReaderBottomBar.vue'
import ReaderSavedPagesModal from '~/components/reader/ReaderSavedPagesModal.vue'
import ReaderAnnotationModal from '~/components/reader/ReaderAnnotationModal.vue'
import ReaderGraphPanel from '~/components/reader/ReaderGraphPanel.vue'

const store = useReaderStore()
const router = useRouter()
const readingTimer = useReadingTimer()

watch(() => store.currentPage, (newPage) => {
  if (newPage) {
    readingTimer.onPageChange(newPage)
  }
})

const isSavedPagesOpen = ref(false)
const isAnnotationModalOpen = ref(false)
const capturedSelectionText = ref('')
const isDesktop = ref(true)

const graphPanelRef = ref<any>(null)
const mobileGraphPanelRef = ref<any>(null)

interface PageRenderer {
  next: () => Promise<void>
  previous: () => Promise<void>
}

const pageRenderer = ref<PageRenderer | null>(null)
const isTransitioning = ref(false)

function handleClose() {
  store.reset()
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back()
  } else {
    router.push('/library')
  }
}

function handleToggleGraph() {
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    store.toggleMobileGraph()
  } else {
    store.toggleGraph()
  }
}

function handleSelectSavedPage(page: number) {
  store.goToPage(page)
}

async function handleOpenAnnotation() {
  const selection = typeof window !== 'undefined' ? window.getSelection()?.toString() : ''
  if (selection && selection.trim().length > 0) {
    capturedSelectionText.value = selection.trim()
  } else if (store.document && typeof store.document.getTextContent === 'function') {
    try {
      const pageText = await store.document.getTextContent(store.currentPage)
      capturedSelectionText.value = pageText ? pageText.slice(0, 300) : ''
    } catch {
      capturedSelectionText.value = ''
    }
  } else {
    capturedSelectionText.value = ''
  }
  isAnnotationModalOpen.value = true
}

function handleTextSelectionCheck() {
  const selection = typeof window !== 'undefined' ? window.getSelection()?.toString() : ''
  if (selection && selection.trim().length > 2) {
    capturedSelectionText.value = selection.trim()
  }
}

let touchTimer: any = null
function handleTouchStart() {
  touchTimer = setTimeout(async () => {
    await handleOpenAnnotation()
  }, 750)
}

function handleTouchEnd() {
  if (touchTimer) {
    clearTimeout(touchTimer)
    touchTimer = null
  }
  handleTextSelectionCheck()
}

function handleAnnotationCreated() {
  graphPanelRef.value?.refresh?.()
  mobileGraphPanelRef.value?.refresh?.()
}

function updateDeviceType() {
  if (typeof window !== 'undefined') {
    isDesktop.value = window.innerWidth >= 1024
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

onMounted(() => {
  updateDeviceType()
  window.addEventListener('resize', updateDeviceType)
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateDeviceType)
  window.removeEventListener('keydown', onKeyDown)
})
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
  max-width: 260px;
}

.reader-viewer__page-info {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.reader-viewer__body {
  flex: 1;
  display: flex;
  width: 100%;
  height: calc(100dvh - 57px);
  overflow: hidden;
  position: relative;
}

.reader-viewer__reader-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  position: relative;
  transition: width 0.3s ease;
}

.reader-viewer__reader-pane--half {
  width: 100%;
}

@media (min-width: 1024px) {
  .reader-viewer__reader-pane--half {
    width: 50%;
  }
}

.reader-viewer__reader-pane--full {
  width: 100%;
}

/* Mobile: Leitor ocupa 80% da verticalidade */
@media (max-width: 1023px) {
  .reader-viewer__canvas-area {
    height: 80dvh;
    max-height: 80dvh;
    flex: none;
  }
}

.reader-viewer__canvas-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow: hidden;
  position: relative;
  width: 100%;
  min-height: 0;
}

.reader-viewer__stage-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  max-width: min(calc(100vw - 40px), 960px);
  gap: 1rem;
  margin: 0 auto;
  position: relative;
}

.reader-viewer__book-stage {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.reader-viewer__nav-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 2rem;
  line-height: 1;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.2s;
  z-index: 20;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.reader-viewer__nav-btn:not(:disabled):hover {
  background: rgba(124, 106, 247, 0.2);
  border-color: rgba(124, 106, 247, 0.5);
  color: var(--color-accent);
  transform: scale(1.05);
}

.reader-viewer__nav-btn:disabled {
  opacity: 0.2;
  cursor: not-allowed;
}
</style>
