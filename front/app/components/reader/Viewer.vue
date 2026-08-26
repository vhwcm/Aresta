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
          @open-typography="isTypographyOpen = true"
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
      :current-page="annotationPage"
      :book-id="store.bookId"
      @close="isAnnotationModalOpen = false"
      @expand="handleExpandToDrawer"
      @created="handleAnnotationCreated"
    />

    <!-- Painel Lateral Expandido de Escrita e Desenho Manual (OCR) -->
    <ReaderAnnotationDrawer
      :is-open="isAnnotationDrawerOpen"
      :initial-text="capturedSelectionText"
      :current-page="annotationPage"
      :book-id="store.bookId"
      :initial-mode="drawerInitialMode"
      @close="isAnnotationDrawerOpen = false"
      @created="handleAnnotationCreated"
    />

    <!-- Modal de Tipografia (EPUB) -->
    <ReaderTypographyPopover
      :is-open="isTypographyOpen"
      @close="isTypographyOpen = false"
    />

    <!-- Tooltip de Sugestão na Seleção de Texto (Kindle / Google Play Livros) -->
    <ReaderSelectionTooltip
      :visible="isSelectionTooltipVisible"
      :x="selectionTooltipX"
      :y="selectionTooltipY"
      :selected-text="selectionTooltipText"
      :page-number="selectionTooltipPage"
      :is-above="isSelectionTooltipAbove"
      @annotate="handleAnnotateFromTooltip"
      @close="isSelectionTooltipVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useReaderStore } from '~/stores/readerStore'
import { useReaderTypography } from '~/composables/useReaderTypography'

import ReaderEnginePageCurlCanvas from '~/components/reader/engine/PageCurlCanvas.vue'
import ReaderBottomBar from '~/components/reader/ReaderBottomBar.vue'
import ReaderSavedPagesModal from '~/components/reader/ReaderSavedPagesModal.vue'
import ReaderAnnotationModal from '~/components/reader/ReaderAnnotationModal.vue'
import ReaderAnnotationDrawer from '~/components/reader/ReaderAnnotationDrawer.vue'
import ReaderGraphPanel from '~/components/reader/ReaderGraphPanel.vue'
import ReaderSelectionTooltip from '~/components/reader/ReaderSelectionTooltip.vue'
import ReaderTypographyPopover from '~/components/reader/ReaderTypographyPopover.vue'

const store = useReaderStore()
const router = useRouter()
const typography = useReaderTypography()

const isTypographyOpen = ref(false)

const isSavedPagesOpen = ref(false)
const isAnnotationModalOpen = ref(false)
const isAnnotationDrawerOpen = ref(false)
const drawerInitialMode = ref<'type' | 'handwriting'>('handwriting')
const capturedSelectionText = ref('')
const annotationPage = ref(1)
const isDesktop = ref(true)
const canvasAreaRef = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null

// Estado do Tooltip de Seleção Flutuante
const isSelectionTooltipVisible = ref(false)
const selectionTooltipX = ref(0)
const selectionTooltipY = ref(0)
const selectionTooltipText = ref('')
const selectionTooltipPage = ref(1)
const isSelectionTooltipAbove = ref(true)

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

function getTargetPageFromSelection(selection: Selection): number {
  if (!selection.anchorNode) return store.currentPage
  const element = selection.anchorNode instanceof HTMLElement
    ? selection.anchorNode
    : selection.anchorNode.parentElement
  const pageLayer = element?.closest('.page-text-layer')
  if (pageLayer && pageLayer.classList.contains('page-text-layer--right')) {
    const leftNum = store.currentPage % 2 === 0 ? store.currentPage : Math.max(1, store.currentPage - 1)
    const rightNum = leftNum + 1
    return rightNum <= store.totalPages ? rightNum : store.currentPage
  } else if (pageLayer && pageLayer.classList.contains('page-text-layer--left')) {
    const leftNum = store.currentPage % 2 === 0 ? store.currentPage : Math.max(1, store.currentPage - 1)
    return leftNum
  }
  return store.currentPage
}

async function handleOpenAnnotation() {
  isSelectionTooltipVisible.value = false
  const selection = typeof window !== 'undefined' ? window.getSelection() : null
  const selectedStr = selection?.toString()?.trim() || ''

  if (selectedStr.length > 0) {
    capturedSelectionText.value = selectedStr
    if (selection) {
      annotationPage.value = getTargetPageFromSelection(selection)
    }
  } else if (store.document && typeof store.document.getTextContent === 'function') {
    annotationPage.value = store.currentPage
    try {
      const pageText = await store.document.getTextContent(store.currentPage)
      capturedSelectionText.value = pageText ? pageText.slice(0, 300) : ''
    } catch {
      capturedSelectionText.value = ''
    }
  } else {
    annotationPage.value = store.currentPage
    capturedSelectionText.value = ''
  }
  isAnnotationModalOpen.value = true
}

function handleExpandToDrawer(mode: 'type' | 'handwriting' = 'handwriting') {
  isAnnotationModalOpen.value = false
  drawerInitialMode.value = mode
  isAnnotationDrawerOpen.value = true
}

function handleTextSelectionCheck() {
  if (typeof window === 'undefined') return
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) {
    isSelectionTooltipVisible.value = false
    return
  }

  const selectedText = selection.toString().trim()
  if (!selectedText || selectedText.length < 2) {
    isSelectionTooltipVisible.value = false
    return
  }

  // Verifica se a seleção ocorreu dentro da área de leitura/livro
  if (canvasAreaRef.value) {
    const anchor = selection.anchorNode
    const focus = selection.focusNode
    const isAnchorInside = anchor && canvasAreaRef.value.contains(anchor)
    const isFocusInside = focus && canvasAreaRef.value.contains(focus)
    if (!isAnchorInside && !isFocusInside) {
      isSelectionTooltipVisible.value = false
      return
    }
  }

  if (selection.rangeCount === 0) return
  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()

  if (rect.width === 0 && rect.height === 0) {
    isSelectionTooltipVisible.value = false
    return
  }

  capturedSelectionText.value = selectedText
  selectionTooltipText.value = selectedText

  const pageNum = getTargetPageFromSelection(selection)
  selectionTooltipPage.value = pageNum
  annotationPage.value = pageNum

  // Centraliza o tooltip sobre a seleção e delimita às margens da janela (com coordenadas inteiras)
  const centerX = Math.round(rect.left + rect.width / 2)
  const clampedX = Math.max(110, Math.min(window.innerWidth - 110, centerX))

  if (rect.top > 60) {
    selectionTooltipY.value = Math.round(rect.top - 12)
    isSelectionTooltipAbove.value = true
  } else {
    selectionTooltipY.value = Math.round(rect.bottom + 12)
    isSelectionTooltipAbove.value = false
  }

  selectionTooltipX.value = clampedX
  isSelectionTooltipVisible.value = true
}

function handleAnnotateFromTooltip(payload: { text: string; pageNumber?: number }) {
  capturedSelectionText.value = payload.text || ''
  annotationPage.value = payload.pageNumber || store.currentPage
  isSelectionTooltipVisible.value = false
  isAnnotationModalOpen.value = true
}

function onDocumentSelectionChange() {
  if (typeof window === 'undefined') return
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || !selection.toString().trim()) {
    isSelectionTooltipVisible.value = false
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

watch(
  () => store.currentPage,
  () => {
    isSelectionTooltipVisible.value = false
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
  if (typography.currentFont.value) {
    store.setFontFamily(typography.currentFont.value.fontFamily)
  }
  updateDeviceType()
  window.addEventListener('resize', updateDeviceType)
  window.addEventListener('keydown', onKeyDown)
  document.addEventListener('selectionchange', onDocumentSelectionChange)
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
  document.removeEventListener('selectionchange', onDocumentSelectionChange)
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
  background: rgba(229, 123, 85, 0.18);
  border-color: rgba(229, 123, 85, 0.45);
  color: var(--color-accent, #E57B55);
  transform: translateY(-50%) scale(1.08);
}

.reader-viewer__nav-btn:disabled {
  opacity: 0.15;
  cursor: not-allowed;
}
</style>
