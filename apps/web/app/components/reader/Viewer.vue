<template>
  <div
    class="reader-viewer"
    :class="['reader-viewer--theme-' + activeTheme, { 'reader-viewer--zen': store.isZenMode }]"
    :data-theme="activeTheme === 'sepia' ? 'sepia' : (activeTheme === 'white' ? 'light' : 'dark')"
    :style="{ backgroundColor: themeBgColor }"
  >
    <!-- Corpo Principal com Divisão Leitor / Grafo -->
    <div class="reader-viewer__body" :style="{ backgroundColor: themeBgColor }">
      <!-- Seção do Leitor (Ajusta suavemente de largura para ficar lado a lado com as anotações no desktop) -->
      <section
        class="reader-viewer__reader-pane"
        :class="store.isNotesOpen && !store.isZenMode ? 'reader-viewer__reader-pane--with-notes' : 'reader-viewer__reader-pane--full'"
        :style="{ backgroundColor: themeBgColor }"
      >
        <!-- Barra de Ferramentas de Leitura (Esquerda no Desktop/Tablet, Inferior no Mobile) (Oculta no Modo Zen) -->
        <ReaderBottomBar
          v-if="!store.isZenMode"
          :is-notes-active="isDesktop ? store.isNotesOpen : store.isMobileNotesOpen"
          @close="handleClose"
          @open-saved-pages="isSavedPagesOpen = true"
          @open-annotation="handleOpenAnnotation"
          @toggle-notes="handleToggleNotes"
        />

        <!-- Coluna de Leitura e Título do Livro -->
        <div class="reader-viewer__content-column" :style="{ backgroundColor: themeBgColor }">
          <!-- Área do Livro / Stage -->
          <main
            class="reader-viewer__canvas-area"
            ref="canvasAreaRef"
            :style="{ backgroundColor: themeBgColor }"
            @mouseup="handleTextSelectionCheck"
            @touchend="handleTouchEnd"
            @pointerup="handleTextSelectionCheck"
          >
            <div class="reader-viewer__stage-container" :style="{ backgroundColor: themeBgColor }">
              <button
                v-if="store.readingMode !== 'scroll'"
                class="reader-viewer__nav-btn reader-viewer__nav-btn--prev hidden md:flex"
                :disabled="store.isFirstPage || isTransitioning"
                @click="pageRenderer?.previous()"
                aria-label="Página anterior"
                id="btn-prev-page"
              >
                <ChevronLeftIcon class="w-8 h-8 sm:w-10 sm:h-10" />
              </button>

              <div class="reader-viewer__book-stage" id="book-stage" :style="{ backgroundColor: themeBgColor }">
                <ReaderEnginePageCurlCanvas
                  v-if="store.readingMode !== 'scroll'"
                  ref="pageRenderer"
                  @transition-state="isTransitioning = $event"
                  @select-annotation="handleHighlightSelected"
                />
                <ReaderEngineScrollEngine
                  v-else
                  ref="scrollRenderer"
                  @select-annotation="handleHighlightSelected"
                  @text-selected="handleTextSelectionCheck"
                />
              </div>

              <button
                v-if="store.readingMode !== 'scroll'"
                class="reader-viewer__nav-btn reader-viewer__nav-btn--next hidden md:flex"
                :disabled="store.isLastPage || isTransitioning"
                @click="pageRenderer?.next()"
                aria-label="Próxima página"
                id="btn-next-page"
              >
                <ChevronRightIcon class="w-8 h-8 sm:w-10 sm:h-10" />
              </button>
            </div>
          </main>

          <!-- Título do Livro em Fonte Editorial com Página ao lado -->
          <footer
            v-if="store.title && !store.isZenMode"
            class="reader-viewer__book-title-bar"
            :class="{
              'reader-viewer__book-title-bar--sepia': activeTheme === 'sepia',
              'reader-viewer__book-title-bar--white': activeTheme === 'white',
              'reader-viewer__book-title-bar--black': activeTheme === 'black'
            }"
            :title="`${store.title} (${pageDisplay})`"
            aria-label="Título do livro"
          >
            <div class="flex items-center justify-center gap-2 max-w-[95%]">
              <h2 class="reader-viewer__book-title-text font-editorial font-normal">
                {{ store.title }}
              </h2>
              <span
                class="reader-viewer__book-progress-badge font-technical font-bold text-accent shrink-0 text-xs sm:text-sm px-2 py-0.5 rounded-full border border-accent/30 bg-accent/10"
                :title="`Progresso da leitura: ${pageDisplay}`"
              >
                {{ pageDisplay }}
              </span>
            </div>
          </footer>
          <!-- Painel de Notas do Livro no Mobile (Cobre toda a área útil do livro, sem cobrir a navbar) -->
          <transition name="mobile-notes">
            <div
              v-if="store.isMobileNotesOpen && !store.isZenMode"
              class="lg:hidden absolute inset-0 z-30 flex flex-col overflow-hidden"
              :class="{
                'bg-[#FAF5E8] text-[#2a2521]': activeTheme === 'sepia',
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
          </transition>
        </div>
      </section>

      <!-- Painel de Notas do Livro no Desktop (Fica AO LADO do livro, não sobreposto) -->
      <transition name="panel-slide">
        <aside
          v-if="store.isNotesOpen && !store.isZenMode"
          class="hidden lg:flex relative z-20 w-[420px] xl:w-[460px] 2xl:w-[500px] shrink-0 h-full shadow-2xl flex-col border-l transition-all duration-300"
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
      :book-title="store.title"
      @close="isAnnotationModalOpen = false"
      @created="handleAnnotationCreated"
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
      @request-short-explanation="handleRequestShortExplanationFromTooltip"
      @request-booklet="handleRequestBookletFromTooltip"
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

    <!-- Card Flutuante de Explicação Contextual com IA (Glassmorphism Overlay) -->
    <ReaderAiOverlayCard
      :visible="isAiOverlayVisible"
      :x="aiOverlayX"
      :y="aiOverlayY"
      :selected-text="aiOverlayText"
      :html-content="aiOverlayHtml"
      :is-loading="isAiOverlayLoading"
      :error-message="aiOverlayError"
      @close="isAiOverlayVisible = false"
      @save-note="handleSaveAiExplanationAsAnnotation"
      @create-booklet="handleRequestBooklet"
    />

    <!-- Modal Sobreposto de Criação de Livreto Didático com IA -->
    <ReaderCreateBookletModal
      :is-open="isCreateBookletModalOpen"
      :initial-topic="createBookletTopic"
      :parent-book-id="store.bookId"
      :parent-book-title="store.title"
      @close="isCreateBookletModalOpen = false"
    />

    <!-- HUD Flutuante do Modo de Foco -->
    <ReaderFocusHUD
      v-if="store.isFocusMode"
      :progress-label="focusProgressLabelComputed"
      @next="handleFocusNext"
      @prev="handleFocusPrev"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Minimize2Icon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next'
import { useReaderStore } from '~/stores/readerStore'
import { useReaderTypography } from '~/composables/useReaderTypography'
import { useAnnotations } from '~/composables/useAnnotations'
import { useReadingTimer } from '~/composables/reader/useReadingTimer'

import ReaderEnginePageCurlCanvas from '~/components/reader/engine/PageCurlCanvas.vue'
import ReaderEngineScrollEngine from '~/components/reader/engine/ReaderScrollEngine.vue'
import ReaderBottomBar from '~/components/reader/ReaderBottomBar.vue'
import ReaderSavedPagesModal from '~/components/reader/ReaderSavedPagesModal.vue'
import ReaderAnnotationModal from '~/components/reader/ReaderAnnotationModal.vue'
import ReaderBookNotesPanel from '~/components/reader/ReaderBookNotesPanel.vue'
import ReaderSelectionTooltip from '~/components/reader/ReaderSelectionTooltip.vue'
import ReaderDictionaryCard from '~/components/reader/ReaderDictionaryCard.vue'
import ReaderAiOverlayCard from '~/components/reader/ReaderAiOverlayCard.vue'
import ReaderCreateBookletModal from '~/components/reader/ReaderCreateBookletModal.vue'
import ReaderFocusHUD from '~/components/reader/ReaderFocusHUD.vue'
import { getApiBase } from '~/utils/apiBase'
import { getStoredAuthToken } from '~/composables/useAuth'

const store = useReaderStore()
const router = useRouter()
const { fetchAnnotations, annotations, createAnnotation } = useAnnotations()
const { startTimer: startReadingTimer, stopTimer: stopReadingTimer } = useReadingTimer()

const activeTheme = computed(() => store.readerTheme || 'sepia')
const themeBgColor = computed(() => {
  if (activeTheme.value === 'white') return '#ffffff'
  if (activeTheme.value === 'black') return '#000000'
  return '#f5eedc'
})

const pageDisplay = computed(() => {
  if (store.isTwoPageMode && store.totalPages > 1) {
    const leftNum = store.currentPage % 2 !== 0 ? store.currentPage : Math.max(1, store.currentPage - 1)
    const rightNum = Math.min(leftNum + 1, store.totalPages)
    return leftNum === rightNum
      ? `Pág. ${leftNum}/${store.totalPages}`
      : `Pág. ${leftNum}-${rightNum}/${store.totalPages}`
  }
  return store.totalPages > 0 ? `Pág. ${store.currentPage}/${store.totalPages}` : `Pág. ${store.currentPage}`
})

const isSavedPagesOpen = ref(false)
const isAnnotationModalOpen = ref(false)
const isCreateBookletModalOpen = ref(false)
const createBookletTopic = ref('')
const capturedSelectionText = ref('')
const annotationPage = ref(1)
const isDesktop = ref(true)

watch([isAnnotationModalOpen, isCreateBookletModalOpen], ([annOpen, bookOpen]) => {
  if (annOpen || bookOpen) {
    isSelectionTooltipVisible.value = false
  }
})
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

// Estado do Card de Explicação Contextual com IA (Glassmorphism Overlay)
const isAiOverlayVisible = ref(false)
const aiOverlayX = ref(0)
const aiOverlayY = ref(0)
const aiOverlayText = ref('')
const aiOverlayHtml = ref('')
const isAiOverlayLoading = ref(false)
const aiOverlayError = ref<string | null>(null)

let handleAddFlashcardEvent: ((e: Event) => void) | null = null
let handleExplainSubtopicEvent: ((e: Event) => void) | null = null
let handleCreateSubtopicBookletEvent: ((e: Event) => void) | null = null

const bookDetectedLanguage = computed(() => {
  const doc: any = store.document
  return doc?.metadata?.language || 'en'
})

const notesPanelRef = ref<any>(null)
const mobileNotesPanelRef = ref<any>(null)

interface PageRenderer {
  next: () => Promise<void>
  previous: () => Promise<void>
  refreshHighlights?: () => void
  renderCurrentSpread?: () => Promise<void>
}

const pageRenderer = ref<PageRenderer | null>(null)
const scrollRenderer = ref<{ scrollToPage: (_pageNumber: number, _behavior?: ScrollBehavior) => void } | null>(null)
const isTransitioning = ref(false)

function handleClose() {
  store.reset()
  if (router?.push) {
    router.push('/')
  } else if (typeof window !== 'undefined') {
    window.location.href = '/'
  }
}

function exitZenMode() {
  if (!store.isZenMode) return
  store.setZenMode(false)
  if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {})
  }
  if (typeof window !== 'undefined' && window.history.state?.arestaZenMode) {
    window.history.back()
  }
}

let lastToggleNotesTime = 0
function handleToggleNotes() {
  const now = Date.now()
  if (now - lastToggleNotesTime < 200) return
  lastToggleNotesTime = now

  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    store.toggleMobileNotes()
  } else {
    store.toggleNotes()
  }
}

function handleSelectSavedPage(page: number) {
  store.goToPage(page)
  if (store.readingMode === 'scroll') {
    scrollRenderer.value?.scrollToPage(page)
  }
}

function getTargetPageFromSelection(selection: Selection): number {
  if (!selection.anchorNode) return store.currentPage
  const element = selection.anchorNode instanceof HTMLElement
    ? selection.anchorNode
    : selection.anchorNode.parentElement

  const scrollSlot = element?.closest('[data-page-number]') as HTMLElement | null
  if (scrollSlot) {
    const pageAttr = scrollSlot.getAttribute('data-page-number')
    if (pageAttr) {
      const parsed = Number(pageAttr)
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
  }

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

// ================= CONTROLES DO MODO DE FOCO =================
async function handleFocusNext() {
  if (store.readingMode !== 'scroll') {
    await (pageRenderer.value as any)?.focusNext?.()
  } else {
    await (scrollRenderer.value as any)?.focusNext?.()
  }
}

async function handleFocusPrev() {
  if (store.readingMode !== 'scroll') {
    await (pageRenderer.value as any)?.focusPrev?.()
  } else {
    await (scrollRenderer.value as any)?.focusPrev?.()
  }
}

const focusProgressLabelComputed = computed(() => {
  if (store.readingMode !== 'scroll') {
    return (pageRenderer.value as any)?.focusProgressLabel || ''
  } else {
    return (scrollRenderer.value as any)?.focusProgressLabel || ''
  }
})

async function handleOpenAnnotation() {
  if (store.isFocusMode) return
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

function handleTextSelectionCheck() {
  if (typeof window === 'undefined') return
  if (store.isFocusMode || isAnnotationModalOpen.value || isCreateBookletModalOpen.value) {
    isSelectionTooltipVisible.value = false
    isDictionaryCardVisible.value = false
    isAiOverlayVisible.value = false
    return
  }
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

async function handleRequestShortExplanationFromTooltip(payload: { text: string; pageNumber?: number; x: number; y: number }) {
  isSelectionTooltipVisible.value = false
  isDictionaryCardVisible.value = false
  aiOverlayX.value = payload.x
  aiOverlayY.value = payload.y
  aiOverlayText.value = payload.text
  aiOverlayHtml.value = ''
  aiOverlayError.value = null
  isAiOverlayLoading.value = true
  isAiOverlayVisible.value = true

  try {
    const base = getApiBase()
    const token = getStoredAuthToken()

    const res: any = await $fetch(`${base}/ai/short-explanation`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: {
        text: payload.text,
        bookTitle: store.title || undefined,
      },
    })

    if (res?.html) {
      aiOverlayHtml.value = res.html
    } else {
      throw new Error('Resposta vazia da IA')
    }
  } catch (err: any) {
    console.error('Erro ao gerar explicação curta:', err)
    aiOverlayError.value = 'Não foi possível obter a explicação da IA no momento. Tente novamente em instantes.'
  } finally {
    isAiOverlayLoading.value = false
  }
}

function handleRequestBookletFromTooltip(payload: { text: string; pageNumber?: number }) {
  handleRequestBooklet(payload.text)
}

function handleRequestBooklet(topic: string) {
  isSelectionTooltipVisible.value = false
  isAiOverlayVisible.value = false
  createBookletTopic.value = topic
  isCreateBookletModalOpen.value = true
}

async function handleSaveAiExplanationAsAnnotation(payload: { text: string; explanation: string }) {
  try {
    await createAnnotation({
      bookId: Number(store.bookId),
      cfi: `page-${annotationPage.value}`,
      selectedText: payload.text,
      note: JSON.stringify({
        type: 'ai_explanation',
        html: payload.explanation,
      }),
      color: '#f97316',
      chapterTitle: store.document?.metadata?.title || 'Explicação IA',
      progress: (store.currentPage / (store.totalPages || 1)) * 100,
    })
    handleAnnotationCreated()
    isAiOverlayVisible.value = false
  } catch (err) {
    console.error('Erro ao salvar anotação de IA:', err)
  }
}

let selectionChangeTimeout: any = null
function onDocumentSelectionChange() {
  if (typeof window === 'undefined') return
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || !selection.toString().trim()) {
    isSelectionTooltipVisible.value = false
    return
  }

  // Em tablets e touchscreens, atualiza a seleção e posiciona o tooltip suavemente
  if (selectionChangeTimeout) clearTimeout(selectionChangeTimeout)
  selectionChangeTimeout = setTimeout(() => {
    handleTextSelectionCheck()
  }, 100)
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
  setTimeout(() => {
    handleTextSelectionCheck()
  }, 50)
}

function handleAnnotationCreated() {
  isSelectionTooltipVisible.value = false
  notesPanelRef.value?.refresh?.()
  mobileNotesPanelRef.value?.refresh?.()
  if (typeof window !== 'undefined') {
    window.getSelection()?.removeAllRanges()
  }
  pageRenderer.value?.refreshHighlights?.()
}

function handleHighlightSelected(annotationId: number) {
  if (store.isFocusMode) return
  const ann = (annotations.value || []).find((a: any) => a.id === annotationId)
  if (ann?.note) {
    try {
      const parsed = JSON.parse(ann.note)
      if (parsed.type === 'didactic_booklet' && parsed.bookletBookId) {
        // Redireciona diretamente para o leitor do livreto!
        router.push(`/reader?bookId=${parsed.bookletBookId}`)
        return
      }
      if (parsed.type === 'ai_explanation' && parsed.html) {
        // Abre o card flutuante sobreposto com o conteúdo salvo da explicação
        aiOverlayHtml.value = parsed.html
        aiOverlayText.value = (ann as any).selectedText || (ann as any).selected_text || ''
        aiOverlayError.value = null
        isAiOverlayLoading.value = false
        aiOverlayX.value = typeof window !== 'undefined' ? window.innerWidth / 2 - 180 : 100
        aiOverlayY.value = typeof window !== 'undefined' ? window.innerHeight / 3 : 150
        isAiOverlayVisible.value = true
        return
      }
    } catch {
      // Anotação textual padrão
    }
  }

  if (isDesktop.value) {
    store.setNotesOpen(true)
    notesPanelRef.value?.focusAnnotation?.(annotationId)
  } else {
    store.setMobileNotesOpen(true)
    mobileNotesPanelRef.value?.focusAnnotation?.(annotationId)
  }
}

function updateDeviceType() {
  if (typeof window !== 'undefined') {
    const wasDesktop = isDesktop.value
    isDesktop.value = window.innerWidth >= 1024
    if (wasDesktop !== isDesktop.value) {
      if (isDesktop.value && store.isMobileNotesOpen) {
        store.setNotesOpen(true)
        store.setMobileNotesOpen(false)
      } else if (!isDesktop.value && store.isNotesOpen) {
        store.setMobileNotesOpen(true)
        store.setNotesOpen(false)
      }
    }
  }
}

function onPopState() {
  if (store.isZenMode) {
    // Ao pressionar o botão de voltar no celular ou navegador, sai do Modo Zen
    store.setZenMode(false)
  }
}

function onFullscreenChange() {
  if (typeof document !== 'undefined' && !document.fullscreenElement && store.isZenMode) {
    store.setZenMode(false)
  }
}

watch(
  () => store.isZenMode,
  (isZen) => {
    if (isZen) {
      if (typeof document !== 'undefined' && !document.fullscreenElement && document.documentElement?.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {})
      }
      showZenToast.value = true
      if (zenToastTimeout) clearTimeout(zenToastTimeout)
      zenToastTimeout = setTimeout(() => {
        showZenToast.value = false
      }, 2800)

      if (typeof window !== 'undefined' && !window.history.state?.arestaZenMode) {
        window.history.pushState({ arestaZenMode: true }, '')
      }
    } else {
      if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
      }
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

watch(
  () => store.bookId,
  (newId) => {
    if (newId) {
      void fetchAnnotations({ bookId: Number(newId) }).then(() => {
        pageRenderer.value?.refreshHighlights?.()
      })
    }
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
    if (store.isFocusMode) {
      event.preventDefault()
      store.setFocusMode(false)
      return
    }
    if (isAnnotationModalOpen.value) {
      isAnnotationModalOpen.value = false
      return
    }
    if (isCreateBookletModalOpen.value) {
      isCreateBookletModalOpen.value = false
      return
    }
    if (isAiOverlayVisible.value) {
      isAiOverlayVisible.value = false
      return
    }
    if (isDictionaryCardVisible.value) {
      isDictionaryCardVisible.value = false
      return
    }
    if (isSelectionTooltipVisible.value) {
      isSelectionTooltipVisible.value = false
      return
    }
    if (isSavedPagesOpen.value) {
      isSavedPagesOpen.value = false
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

  // Atalhos em Modo de Foco
  if (store.isFocusMode) {
    if (event.key === ' ' || event.key === 'ArrowDown' || event.key === 'j' || event.key === 'J' || event.key === 'Enter') {
      event.preventDefault()
      void handleFocusNext()
      return
    }
    if (event.key === 'ArrowUp' || event.key === 'k' || event.key === 'K') {
      event.preventDefault()
      void handleFocusPrev()
      return
    }
  }

  // Atalho 'f' ou 'F' para alternar Modo de Foco
  if ((event.key === 'f' || event.key === 'F') && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault()
    store.toggleFocusMode()
    return
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

  if (store.readingMode !== 'scroll') {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      void pageRenderer.value?.next()
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      void pageRenderer.value?.previous()
    }
  }
}

onMounted(() => {
  startReadingTimer()
  store.setGraphOpen(false)
  store.setMobileGraphOpen(false)
  updateDeviceType()
  window.addEventListener('resize', updateDeviceType)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('popstate', onPopState)
  window.addEventListener('mouseup', handleTextSelectionCheck)
  window.addEventListener('touchend', handleTouchEnd, { passive: true })
  window.addEventListener('pointerup', handleTextSelectionCheck, { passive: true })
  document.addEventListener('selectionchange', onDocumentSelectionChange)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  if (canvasAreaRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      updateDeviceType()
    })
    resizeObserver.observe(canvasAreaRef.value)
  }
  handleAddFlashcardEvent = async (e: Event) => {
    const detail = (e as CustomEvent).detail
    if (!detail) return
    try {
      const base = getApiBase()
      const token = getStoredAuthToken()
      await $fetch(`${base}/flashcards`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        body: {
          bookId: detail.bookId || Number(store.bookId),
          question: detail.question,
          answer: detail.answer,
          cardType: detail.cardType || 'CONCEPT_RECALL',
          difficulty: detail.difficulty || 2.5,
        },
      })
    } catch (err) {
      console.warn('Erro ao salvar flashcard do livreto:', err)
    }
  }

  handleExplainSubtopicEvent = (e: Event) => {
    const detail = (e as CustomEvent).detail
    if (!detail?.topic) return
    handleRequestShortExplanationFromTooltip({
      text: detail.topic,
      x: typeof window !== 'undefined' ? window.innerWidth / 2 - 180 : 100,
      y: typeof window !== 'undefined' ? window.innerHeight / 3 : 150,
    })
  }

  handleCreateSubtopicBookletEvent = (e: Event) => {
    const detail = (e as CustomEvent).detail
    if (!detail?.topic) return
    handleRequestBooklet(detail.topic)
  }

  window.addEventListener('aresta:add-flashcard', handleAddFlashcardEvent)
  window.addEventListener('aresta:explain-subtopic', handleExplainSubtopicEvent)
  window.addEventListener('aresta:create-subtopic-booklet', handleCreateSubtopicBookletEvent)

  if (store.bookId) {
    void fetchAnnotations({ bookId: Number(store.bookId) }).then(() => {
      pageRenderer.value?.refreshHighlights?.()
    })
  }
})

onUnmounted(() => {
  stopReadingTimer()
  if (zenToastTimeout) clearTimeout(zenToastTimeout)
  if (touchTimer) clearTimeout(touchTimer)
  if (selectionChangeTimeout) clearTimeout(selectionChangeTimeout)
  resizeObserver?.disconnect()
  window.removeEventListener('resize', updateDeviceType)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('popstate', onPopState)
  window.removeEventListener('mouseup', handleTextSelectionCheck)
  window.removeEventListener('touchend', handleTouchEnd)
  window.removeEventListener('pointerup', handleTextSelectionCheck)
  document.removeEventListener('selectionchange', onDocumentSelectionChange)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  if (handleAddFlashcardEvent) window.removeEventListener('aresta:add-flashcard', handleAddFlashcardEvent)
  if (handleExplainSubtopicEvent) window.removeEventListener('aresta:explain-subtopic', handleExplainSubtopicEvent)
  if (handleCreateSubtopicBookletEvent) window.removeEventListener('aresta:create-subtopic-booklet', handleCreateSubtopicBookletEvent)
  store.setGraphOpen(false)
  store.setMobileGraphOpen(false)
  if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {})
  }
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
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1), flex 0.3s cubic-bezier(0.16, 1, 0.3, 1);
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
  flex: 1 1 100%;
}

.reader-viewer__reader-pane--with-notes {
  flex: 1 1 0%;
  width: auto;
  min-width: 0;
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
  touch-action: none;
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
  background-color: transparent;
  transition: color 0.2s ease;
}

.reader-viewer__book-title-text {
  font-family: 'Newsreader', serif;
  font-size: 1.15rem;
  font-weight: 400;
  line-height: 1.3;
  letter-spacing: 0.01em;
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
    font-size: 1.35rem;
    letter-spacing: 0.015em;
  }
}

.reader-viewer__book-title-bar--sepia {
  background-color: transparent;
  color: #3e3328;
}

.reader-viewer__book-title-bar--white {
  background-color: transparent;
  color: #1a1a1a;
}

.reader-viewer__book-title-bar--black {
  background-color: transparent;
  color: #e4e4e7;
}

.reader-viewer--theme-sepia .reader-viewer__content-column {
  background-color: #f5eedc !important;
}

.reader-viewer--theme-white .reader-viewer__content-column {
  background-color: #ffffff !important;
}

.reader-viewer--theme-black .reader-viewer__content-column {
  background-color: #0c0c0e !important;
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
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0.5rem;
  opacity: 0.5;
  transition: color 0.2s, transform 0.2s, opacity 0.2s;
  z-index: 20;
}

.reader-viewer__nav-btn--prev {
  left: 0.5rem;
}

.reader-viewer__nav-btn--next {
  right: 0.5rem;
}

.reader-viewer__nav-btn:not(:disabled):hover {
  color: var(--color-accent, #E57B55);
  transform: translateY(-50%) scale(1.15);
  opacity: 1;
}

.reader-viewer__nav-btn:disabled {
  opacity: 0;
  pointer-events: none;
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
    display: none !important;
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
.reader-viewer--theme-black .reader-viewer__content-column,
.reader-viewer--theme-black .reader-viewer__canvas-area,
.reader-viewer--theme-black .reader-viewer__stage-container,
.reader-viewer--theme-black .reader-viewer__book-stage,
.reader-viewer--theme-black :deep(.page-curl-wrapper),
.reader-viewer--theme-black :deep(.book-viewport-track),
.reader-viewer--theme-black :deep(.spread-container) {
  background-color: #000000 !important;
}

/* Botões de Navegação adaptados a cada tema */
.reader-viewer--theme-sepia .reader-viewer__nav-btn {
  color: #5c4d3c;
}

.reader-viewer--theme-sepia .reader-viewer__nav-btn:not(:disabled):hover {
  color: var(--color-accent, #E57B55);
}

.reader-viewer--theme-white .reader-viewer__nav-btn {
  color: #4b5563;
}

.reader-viewer--theme-white .reader-viewer__nav-btn:not(:disabled):hover {
  color: var(--color-accent, #E57B55);
}

.reader-viewer--theme-black .reader-viewer__nav-btn {
  color: #9ca3af;
}

.reader-viewer--theme-black .reader-viewer__nav-btn:not(:disabled):hover {
  color: var(--color-accent, #E57B55);
}

.reader-viewer--zen.reader-viewer--theme-sepia {
  background: #f5eedc !important;
}

.reader-viewer--zen.reader-viewer--theme-white {
  background: #ffffff !important;
}

.reader-viewer--zen.reader-viewer--theme-black {
  background: #000000 !important;
}

.reader-viewer--zen .reader-viewer__nav-btn {
  opacity: 0.2;
}

.reader-viewer--zen .reader-viewer__nav-btn:not(:disabled):hover {
  opacity: 1;
  color: var(--color-accent, #E57B55);
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

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  width: 0 !important;
  opacity: 0;
  transform: translateX(30px);
}

.mobile-notes-enter-active,
.mobile-notes-leave-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.mobile-notes-enter-from,
.mobile-notes-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>
