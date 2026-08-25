<template>
  <div class="reader-viewer">
    <!-- Corpo Principal com Divisão Leitor / Grafo -->
    <div class="reader-viewer__body">
      <!-- Seção do Leitor (Mobile: 100% / Desktop: 50% ou 100%) -->
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
          @close="handleClose"
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
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useReaderStore } from '~/stores/readerStore'

import ReaderEnginePageCurlCanvas from '~/components/reader/engine/PageCurlCanvas.vue'
import ReaderBottomBar from '~/components/reader/ReaderBottomBar.vue'
import ReaderSavedPagesModal from '~/components/reader/ReaderSavedPagesModal.vue'
import ReaderAnnotationModal from '~/components/reader/ReaderAnnotationModal.vue'
import ReaderGraphPanel from '~/components/reader/ReaderGraphPanel.vue'

const store = useReaderStore()
const router = useRouter()

const isSavedPagesOpen = ref(false)
const isAnnotationModalOpen = ref(false)
const capturedSelectionText = ref('')
const isDesktop = ref(true)
const canvasAreaRef = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null

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
    let hasSpace = true
    if (canvasAreaRef.value) {
      const width = canvasAreaRef.value.clientWidth
      const height = canvasAreaRef.value.clientHeight
      hasSpace = width >= 800 && (height > 0 ? width / height >= 1.0 : true)
    } else {
      hasSpace = window.innerWidth >= 1024
    }
    const shouldBeTwoPage = isDesktop.value && !store.isGraphOpen && hasSpace && store.totalPages > 1
    store.setTwoPageMode(shouldBeTwoPage)
  }
}

watch(
  [() => store.isGraphOpen, () => store.totalPages],
  () => {
    updateDeviceType()
  },
)

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
  if (canvasAreaRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      updateDeviceType()
    })
    resizeObserver.observe(canvasAreaRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
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

.reader-viewer__body {
  flex: 1;
  display: flex;
  width: 100%;
  height: 100%;
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

.reader-viewer__canvas-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
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
  max-width: 100%;
  margin: 0 auto;
  position: relative;
}

.reader-viewer__book-stage {
  flex: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 0;
}

.reader-viewer__nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(15, 15, 22, 0.75);
  backdrop-filter: blur(8px);
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
  transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.2s, opacity 0.2s;
  z-index: 20;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.reader-viewer__nav-btn--prev {
  left: 0.75rem;
}

.reader-viewer__nav-btn--next {
  right: 0.75rem;
}

.reader-viewer__nav-btn:not(:disabled):hover {
  background: rgba(124, 106, 247, 0.25);
  border-color: rgba(124, 106, 247, 0.5);
  color: var(--color-accent);
  transform: translateY(-50%) scale(1.08);
}

.reader-viewer__nav-btn:disabled {
  opacity: 0.15;
  cursor: not-allowed;
}
</style>
