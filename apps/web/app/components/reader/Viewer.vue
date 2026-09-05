<template>
  <div
    class="reader-viewer"
    :class="['reader-viewer--theme-' + activeTheme, { 'reader-viewer--zen': store.isZenMode }]"
    :data-theme="activeTheme === 'sepia' ? 'sepia' : (activeTheme === 'white' ? 'light' : 'dark')"
    :style="{ backgroundColor: themeBgColor }"
  >
    <!-- Corpo Principal com Divisão Leitor / Grafo -->
    <div class="reader-viewer__body" :style="{ backgroundColor: themeBgColor }">
      <!-- Seção do Leitor (Sempre 100% de largura útil para foco na leitura) -->
      <section
        class="reader-viewer__reader-pane reader-viewer__reader-pane--full"
        :style="{ backgroundColor: themeBgColor }"
      >
        <!-- Barra de Ferramentas de Leitura (Esquerda no Desktop/Tablet, Inferior no Mobile) (Oculta no Modo Zen) -->
        <ReaderBottomBar
          v-if="!store.isZenMode"
          :is-notes-active="isDesktop ? store.isNotesOpen : store.isMobileNotesOpen"
          :is-graph-active="isDesktop ? store.isNotesOpen : store.isMobileNotesOpen"
          @close="handleClose"
          @open-saved-pages="isSavedPagesOpen = true"
          @open-annotation="handleOpenAnnotation"
          @toggle-notes="handleToggleNotes"
          @toggle-graph="handleToggleNotes"
          @open-typography="isTypographyOpen = true"
        />

        <!-- Coluna de Leitura e Título do Livro -->
        <div class="reader-viewer__content-column" :style="{ backgroundColor: themeBgColor }">
          <!-- Área do Livro / Stage -->
          <main
            class="reader-viewer__canvas-area"
            ref="canvasAreaRef"
            :style="{ backgroundColor: themeBgColor }"
            @mouseup="handleTextSelectionCheck"
          >
            <div class="reader-viewer__stage-container" :style="{ backgroundColor: themeBgColor }">
              <button
                class="reader-viewer__nav-btn reader-viewer__nav-btn--prev"
                :disabled="store.isFirstPage || isTransitioning"
                @click="pageRenderer?.previous()"
                aria-label="Página anterior"
                id="btn-prev-page"
              >
                ‹
              </button>

              <div class="reader-viewer__book-stage" id="book-stage" :style="{ backgroundColor: themeBgColor }">
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

          <!-- Título do Livro em Fonte Medieval -->
          <footer
            v-if="store.title && !store.isZenMode"
            class="reader-viewer__book-title-bar"
            :class="{
              'reader-viewer__book-title-bar--sepia': activeTheme === 'sepia',
              'reader-viewer__book-title-bar--white': activeTheme === 'white',
              'reader-viewer__book-title-bar--black': activeTheme === 'black'
            }"
            :title="store.title"
            aria-label="Título do livro"
          >
            <h2 class="reader-viewer__book-title-text font-medieval">
              {{ store.title }}
            </h2>
          </footer>
        </div>
      </section>

      <!-- Painel de Notas do Livro no Desktop (Gaveta Lateral / Slide-over Drawer) -->
      <transition name="slide-left">
        <aside
          v-if="store.isNotesOpen && !store.isZenMode"
          class="hidden lg:flex fixed inset-y-0 right-0 z-40 w-[520px] max-w-[85vw] h-full shadow-2xl flex-col border-l transition-all duration-300"
          :class="{
            'bg-[#FAF5E8] text-[#2a2521] border-[#dfd5c0]': activeTheme === 'sepia',
            'bg-white text-gray-900 border-gray-200': activeTheme === 'white',
            'bg-[#121214] text-[#e4e4e7] border-white/10': activeTheme === 'black',
          }"
        >
          <ReaderBookNotesPanel
            ref="notesPanelRef"
            :is-mobile="false"
            :theme="activeTheme"
            :book-id="store.bookId"
            :book-title="store.title"
            @close="store.setNotesOpen(false)"
            @open-annotation-modal="handleOpenAnnotation"
            @go-to-page="handleSelectSavedPage"
          />
        </aside>
      </transition>

      <!-- Backdrop sutil para fechar o painel de notas ao clicar fora no desktop -->
      <transition name="fade">
        <div
          v-if="store.isNotesOpen && !store.isZenMode"
          class="hidden lg:block fixed inset-0 bg-black/25 z-30 backdrop-blur-[1px] transition-opacity"
          @click="store.setNotesOpen(false)"
          aria-hidden="true"
        />
      </transition>
    </div>

    <!-- Painel de Notas do Livro em Tela Cheia no Mobile (Oculto no Modo Zen) -->
    <div
      v-if="store.isMobileNotesOpen && !store.isZenMode"
      class="fixed inset-0 z-50 flex flex-col lg:hidden animate-fadeIn"
      :class="{
        'bg-[#f5eedc] text-[#2a2521]': activeTheme === 'sepia',
        'bg-[#ffffff] text-[#1a1a1a]': activeTheme === 'white',
        'bg-[#121214] text-[#e4e4e7]': activeTheme === 'black',
      }"
      role="dialog"
      aria-modal="true"
    >
      <ReaderBookNotesPanel
        ref="mobileNotesPanelRef"
        :is-mobile="true"
        :theme="activeTheme"
        :book-id="store.bookId"
        :book-title="store.title"
        @close="store.setMobileNotesOpen(false)"
        @open-annotation-modal="handleOpenAnnotation"
        @go-to-page="handleSelectSavedPage"
      />
    </div>

    <!-- Controles e Avisos Flutuantes do Modo Zen -->
    <div v-if="store.isZenMode" class="reader-viewer__zen-overlay">
      <!-- Toast Transitório de Boas-Vindas ao Modo Zen -->
      <transition name="fade">
        <div
          v-if="showZenToast"
          class="reader-viewer__zen-toast"
          role="status"
          aria-live="polite"
        >
          <span class="font-medium text-white">Modo Zen ativado</span>
          <span class="text-white/70 text-xs hidden xs:inline">• Pressione <kbd class="px-1.5 py-0.5 rounded bg-white/20 text-[11px] font-mono text-white">Esc</kbd> ou Voltar para sair</span>
        </div>
      </transition>

      <!-- Botão Flutuante Discreto para Sair do Modo Zen -->
      <button
        @click="exitZenMode"
        class="reader-viewer__zen-exit-btn group"
        title="Sair do Modo Zen (Esc ou Voltar)"
        aria-label="Sair do Modo Zen"
        id="btn-exit-zen-mode"
      >
        <Minimize2Icon class="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
        <span class="text-xs font-medium text-white/70 group-hover:text-white transition-colors hidden sm:inline">Sair do Zen</span>
      </button>
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
      @open-dictionary="handleOpenDictionaryFromTooltip"
      @close="isSelectionTooltipVisible = false"
    />

    <!-- Card de Definição do Dicionário Offline -->
    <ReaderDictionaryCard
      :visible="isDictionaryCardVisible"
      :x="dictionaryCardX"
      :y="dictionaryCardY"
      :word="dictionaryCardWord"
      :book-language="bookDetectedLanguage"
      :page-number="dictionaryCardPage"
      :is-above="dictionaryCardIsAbove"
      @close="isDictionaryCardVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Minimize2Icon } from 'lucide-vue-next'
import { useReaderStore } from '~/stores/readerStore'
import { useReaderTypography } from '~/composables/useReaderTypography'

import ReaderEnginePageCurlCanvas from '~/components/reader/engine/PageCurlCanvas.vue'
import ReaderBottomBar from '~/components/reader/ReaderBottomBar.vue'
import ReaderSavedPagesModal from '~/components/reader/ReaderSavedPagesModal.vue'
import ReaderAnnotationModal from '~/components/reader/ReaderAnnotationModal.vue'
import ReaderAnnotationDrawer from '~/components/reader/ReaderAnnotationDrawer.vue'
import ReaderBookNotesPanel from '~/components/reader/ReaderBookNotesPanel.vue'
import ReaderSelectionTooltip from '~/components/reader/ReaderSelectionTooltip.vue'
import ReaderDictionaryCard from '~/components/reader/ReaderDictionaryCard.vue'
import ReaderTypographyPopover from '~/components/reader/ReaderTypographyPopover.vue'

const store = useReaderStore()
const router = useRouter()
const typography = useReaderTypography()

const activeTheme = computed(() => store.readerTheme || 'sepia')
const themeBgColor = computed(() => {
  if (activeTheme.value === 'white') return '#ffffff'
  if (activeTheme.value === 'black') return '#121214'
  return '#f5eedc'
})

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

// Estado do Modo Zen (Toast e Controle)
const showZenToast = ref(false)
let zenToastTimeout: any = null

// Estado do Tooltip de Seleção Flutuante
const isSelectionTooltipVisible = ref(false)
const selectionTooltipX = ref(0)
const selectionTooltipY = ref(0)
const selectionTooltipText = ref('')
const selectionTooltipPage = ref(1)
const isSelectionTooltipAbove = ref(true)

// Estado do Card de Dicionário Offline
const isDictionaryCardVisible = ref(false)
const dictionaryCardX = ref(0)
const dictionaryCardY = ref(0)
const dictionaryCardWord = ref('')
const dictionaryCardPage = ref(1)
const dictionaryCardIsAbove = ref(true)

const bookDetectedLanguage = computed(() => {
  const doc: any = store.document
  return doc?.metadata?.language || 'en'
})

const notesPanelRef = ref<any>(null)
const mobileNotesPanelRef = ref<any>(null)

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

function exitZenMode() {
  if (!store.isZenMode) return
  store.setZenMode(false)
  if (typeof window !== 'undefined' && window.history.state?.arestaZenMode) {
    window.history.back()
  }
}

function handleToggleNotes() {
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    store.toggleMobileNotes()
  } else {
    store.toggleNotes()
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
    const leftNum = store.currentPage % 2 !== 0 ? store.currentPage : Math.max(1, store.currentPage - 1)
    const rightNum = leftNum + 1
    return rightNum <= store.totalPages ? rightNum : store.currentPage
  } else if (pageLayer && pageLayer.classList.contains('page-text-layer--left')) {
    const leftNum = store.currentPage % 2 !== 0 ? store.currentPage : Math.max(1, store.currentPage - 1)
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
  } else if (capturedSelectionText.value && capturedSelectionText.value.trim().length > 0) {
    // Preserva o trecho previamente selecionado se o clique no botão tiver desfocado o texto
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
  if (!selectedText) {
    isSelectionTooltipVisible.value = false
    return
  }

  // Verifica se a seleção ocorreu dentro da área de leitura/livro
  if (canvasAreaRef.value) {
    const anchor = selection.anchorNode
    const focus = selection.focusNode
    const isAnchorInside = anchor && (canvasAreaRef.value === anchor || (typeof canvasAreaRef.value.contains === 'function' && canvasAreaRef.value.contains(anchor)))
    const isFocusInside = focus && (canvasAreaRef.value === focus || (typeof canvasAreaRef.value.contains === 'function' && canvasAreaRef.value.contains(focus)))
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
  isDictionaryCardVisible.value = false
  isAnnotationModalOpen.value = true
}

function handleOpenDictionaryFromTooltip(payload: { word: string; pageNumber?: number }) {
  dictionaryCardWord.value = payload.word
  dictionaryCardPage.value = payload.pageNumber || store.currentPage
  dictionaryCardX.value = selectionTooltipX.value
  dictionaryCardY.value = selectionTooltipY.value
  dictionaryCardIsAbove.value = isSelectionTooltipAbove.value
  isSelectionTooltipVisible.value = false
  isDictionaryCardVisible.value = true
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
  notesPanelRef.value?.refresh?.()
  mobileNotesPanelRef.value?.refresh?.()
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
    const isNotesShowing = (store.isNotesOpen || store.isGraphOpen) && !store.isZenMode
    const shouldBeTwoPage = isDesktop.value && !isNotesShowing && hasSpace && store.totalPages > 1
    store.setTwoPageMode(shouldBeTwoPage)
  }
}

function onPopState() {
  if (store.isZenMode) {
    // Ao pressionar o botão de voltar no celular ou navegador, sai do Modo Zen
    store.setZenMode(false)
  }
}

watch(
  [() => store.isNotesOpen, () => store.isGraphOpen, () => store.totalPages],
  () => {
    updateDeviceType()
  },
)

watch(
  () => store.isZenMode,
  (isZen) => {
    if (isZen) {
      showZenToast.value = true
      if (zenToastTimeout) clearTimeout(zenToastTimeout)
      zenToastTimeout = setTimeout(() => {
        showZenToast.value = false
      }, 2800)

      if (typeof window !== 'undefined' && !window.history.state?.arestaZenMode) {
        window.history.pushState({ arestaZenMode: true }, '')
      }
    } else {
      showZenToast.value = false
    }
    updateDeviceType()
  },
)

watch(
  () => store.currentPage,
  () => {
    isSelectionTooltipVisible.value = false
    isDictionaryCardVisible.value = false
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

  if (event.key === 'Escape') {
    if (isAnnotationModalOpen.value) {
      isAnnotationModalOpen.value = false
      return
    }
    if (isAnnotationDrawerOpen.value) {
      isAnnotationDrawerOpen.value = false
      return
    }
    if (isSavedPagesOpen.value) {
      isSavedPagesOpen.value = false
      return
    }
    if (isTypographyOpen.value) {
      isTypographyOpen.value = false
      return
    }
    if (store.isNotesOpen || store.isGraphOpen) {
      store.setNotesOpen(false)
      return
    }
    if (store.isMobileNotesOpen || store.isMobileGraphOpen) {
      store.setMobileNotesOpen(false)
      return
    }
    if (store.isZenMode) {
      event.preventDefault()
      exitZenMode()
      return
    }
  }

  // Atalho 'z' ou 'Z' para alternar Modo Zen
  if ((event.key === 'z' || event.key === 'Z') && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault()
    if (store.isZenMode) {
      exitZenMode()
    } else {
      store.setZenMode(true)
    }
    return
  }

  // Atalhos de teclado para ajustar tamanho da fonte durante a leitura (EPUB)
  if (store.documentType === 'epub' && !event.altKey) {
    if (event.key === '+' || event.key === '=') {
      event.preventDefault()
      store.increaseFontSize(2)
      return
    }
    if (event.key === '-' || event.key === '_') {
      event.preventDefault()
      store.decreaseFontSize(2)
      return
    }
    if (event.key === '0' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      store.resetFontSize()
      return
    }
  }

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
  store.setGraphOpen(false)
  store.setMobileGraphOpen(false)
  if (typography.currentFont.value) {
    store.setFontFamily(typography.currentFont.value.fontFamily)
  }
  updateDeviceType()
  window.addEventListener('resize', updateDeviceType)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('popstate', onPopState)
  window.addEventListener('mouseup', handleTextSelectionCheck)
  document.addEventListener('selectionchange', onDocumentSelectionChange)
  if (canvasAreaRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      updateDeviceType()
    })
    resizeObserver.observe(canvasAreaRef.value)
  }
})

onUnmounted(() => {
  if (zenToastTimeout) clearTimeout(zenToastTimeout)
  if (touchTimer) clearTimeout(touchTimer)
  resizeObserver?.disconnect()
  window.removeEventListener('resize', updateDeviceType)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('popstate', onPopState)
  window.removeEventListener('mouseup', handleTextSelectionCheck)
  document.removeEventListener('selectionchange', onDocumentSelectionChange)
  store.setGraphOpen(false)
  store.setMobileGraphOpen(false)
  if (store.isZenMode) {
    store.setZenMode(false)
  }
})
</script>

<style scoped>
.reader-viewer {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100%;
  overflow: hidden;
  position: relative;
  transition: background-color 0.2s ease;
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

@media (min-width: 768px) {
  .reader-viewer__reader-pane {
    flex-direction: row;
  }
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

.reader-viewer__content-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  position: relative;
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

.reader-viewer__book-title-bar {
  flex-shrink: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0.35rem 1rem 0.5rem 1rem;
  user-select: none;
  z-index: 10;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.reader-viewer__book-title-text {
  font-family: 'MedievalSharp', 'Almendra', '"Cinzel Decorative"', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: 0.04em;
  max-width: 92%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 768px) {
  .reader-viewer__book-title-bar {
    padding: 0.5rem 1.5rem 0.65rem 1.5rem;
  }
  .reader-viewer__book-title-text {
    font-size: 1.5rem;
    letter-spacing: 0.05em;
  }
}

.reader-viewer__book-title-bar--sepia {
  background-color: #f5eedc;
  color: #3e3328;
}

.reader-viewer__book-title-bar--white {
  background-color: #ffffff;
  color: #1a1a1a;
}

.reader-viewer__book-title-bar--black {
  background-color: #121214;
  color: #e4e4e7;
}

.reader-viewer--theme-sepia .reader-viewer__content-column {
  background-color: #f5eedc !important;
}

.reader-viewer--theme-white .reader-viewer__content-column {
  background-color: #ffffff !important;
}

.reader-viewer--theme-black .reader-viewer__content-column {
  background-color: #121214 !important;
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

@media (max-width: 767px) {
  .reader-viewer__canvas-area {
    padding: 0 !important;
  }
  .reader-viewer__stage-container {
    width: 100% !important;
    height: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
  }
  .reader-viewer__nav-btn {
    width: 36px;
    height: 36px;
    font-size: 1.5rem;
    opacity: 0.35;
  }
  .reader-viewer__nav-btn:hover,
  .reader-viewer__nav-btn:active {
    opacity: 0.95;
  }
  .reader-viewer__nav-btn--prev {
    left: 0.35rem;
  }
  .reader-viewer__nav-btn--next {
    right: 0.35rem;
  }
}

/* =========================================================================
   Temas de Leitura (Amarelado / Sépia, Branco, Preto)
   ========================================================================= */
.reader-viewer--theme-sepia,
.reader-viewer--theme-sepia .reader-viewer__body,
.reader-viewer--theme-sepia .reader-viewer__reader-pane,
.reader-viewer--theme-sepia .reader-viewer__canvas-area,
.reader-viewer--theme-sepia .reader-viewer__stage-container,
.reader-viewer--theme-sepia .reader-viewer__book-stage,
.reader-viewer--theme-sepia :deep(.page-curl-wrapper),
.reader-viewer--theme-sepia :deep(.book-viewport-track),
.reader-viewer--theme-sepia :deep(.spread-container) {
  background-color: #f5eedc !important;
}

.reader-viewer--theme-white,
.reader-viewer--theme-white .reader-viewer__body,
.reader-viewer--theme-white .reader-viewer__reader-pane,
.reader-viewer--theme-white .reader-viewer__canvas-area,
.reader-viewer--theme-white .reader-viewer__stage-container,
.reader-viewer--theme-white .reader-viewer__book-stage,
.reader-viewer--theme-white :deep(.page-curl-wrapper),
.reader-viewer--theme-white :deep(.book-viewport-track),
.reader-viewer--theme-white :deep(.spread-container) {
  background-color: #ffffff !important;
}

.reader-viewer--theme-black,
.reader-viewer--theme-black .reader-viewer__body,
.reader-viewer--theme-black .reader-viewer__reader-pane,
.reader-viewer--theme-black .reader-viewer__canvas-area,
.reader-viewer--theme-black .reader-viewer__stage-container,
.reader-viewer--theme-black .reader-viewer__book-stage,
.reader-viewer--theme-black :deep(.page-curl-wrapper),
.reader-viewer--theme-black :deep(.book-viewport-track),
.reader-viewer--theme-black :deep(.spread-container) {
  background-color: #121214 !important;
}

/* Botões de Navegação adaptados a cada tema */
.reader-viewer--theme-sepia .reader-viewer__nav-btn {
  background: rgba(235, 224, 200, 0.85);
  border-color: rgba(180, 160, 130, 0.35);
  color: #5c4d3c;
  box-shadow: 0 4px 12px rgba(60, 45, 20, 0.12);
}

.reader-viewer--theme-sepia .reader-viewer__nav-btn:not(:disabled):hover {
  background: rgba(229, 123, 85, 0.2);
  border-color: rgba(229, 123, 85, 0.6);
  color: var(--color-accent, #E57B55);
}

.reader-viewer--theme-white .reader-viewer__nav-btn {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(0, 0, 0, 0.12);
  color: #374151;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.reader-viewer--theme-white .reader-viewer__nav-btn:not(:disabled):hover {
  background: rgba(229, 123, 85, 0.15);
  border-color: rgba(229, 123, 85, 0.5);
  color: var(--color-accent, #E57B55);
}

.reader-viewer--theme-black .reader-viewer__nav-btn {
  background: rgba(25, 25, 30, 0.85);
  border-color: rgba(255, 255, 255, 0.1);
  color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.reader-viewer--zen.reader-viewer--theme-sepia {
  background: #f5eedc !important;
}

.reader-viewer--zen.reader-viewer--theme-white {
  background: #ffffff !important;
}

.reader-viewer--zen.reader-viewer--theme-black {
  background: #0a0a0e !important;
}

.reader-viewer--zen .reader-viewer__nav-btn {
  opacity: 0.25;
}

.reader-viewer--zen .reader-viewer__nav-btn:not(:disabled):hover {
  opacity: 1;
  background: rgba(229, 123, 85, 0.25);
  border-color: rgba(229, 123, 85, 0.5);
}

.reader-viewer__zen-overlay {
  position: absolute;
  top: 1rem;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.25rem;
  pointer-events: none;
  z-index: 40;
}

.reader-viewer__zen-toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(18, 18, 24, 0.88);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(229, 123, 85, 0.35);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  border-radius: 9999px;
  padding: 0.5rem 1rem;
  font-size: 0.825rem;
  animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.reader-viewer__zen-exit-btn {
  pointer-events: auto;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(18, 18, 24, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 9999px;
  padding: 0.45rem 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.reader-viewer__zen-exit-btn:hover {
  background: rgba(229, 123, 85, 0.2);
  border-color: rgba(229, 123, 85, 0.45);
  transform: translateY(-1px);
}

.reader-viewer__zen-exit-btn:active {
  transform: scale(0.96);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
