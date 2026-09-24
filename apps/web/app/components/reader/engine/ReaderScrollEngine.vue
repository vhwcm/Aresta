<template>
  <div
    ref="containerRef"
    class="reader-scroll-engine"
    :class="[
      'reader-scroll-engine--theme-' + activeTheme,
      {
        'reader-scroll-engine--zen': store.isZenMode,
        'reader-scroll-engine--wide': store.readerWidthMode === 'wide',
      },
    ]"
    :style="{ backgroundColor: themeBgColor, color: themeTextColor }"
    role="region"
    aria-label="Leitor em modo contínuo com rolagem vertical"
    tabindex="0"
    @keydown="onKeyDown"
    @mouseup="handleSelectionEnd"
    @touchend="handleSelectionEnd"
    @pointerup="handleSelectionEnd"
  >
    <!-- Contêiner Central de Leitura com Limite de Largura Ergonômica -->
    <div
      ref="contentAreaRef"
      class="reader-scroll-engine__content"
      :class="store.readerWidthMode === 'wide' ? 'reader-scroll-engine__content--wide' : 'reader-scroll-engine__content--centered'"
    >
      <!-- ================= FLUXO PDF (PÁGINAS VIRTUALIZADAS) ================= -->
      <template v-if="isPdfDocument">
        <div
          v-for="pageNum in store.totalPages"
          :key="'pdf-page-' + pageNum"
          :ref="(el) => setSlotRef(el as HTMLElement, pageNum)"
          class="scroll-page-slot shadow-md transition-shadow"
          :data-page-number="pageNum"
          :style="{
            minHeight: `${getPageHeight(pageNum)}px`,
            backgroundColor: '#ffffff',
          }"
        >
          <!-- Se a página estiver na janela de visualização -->
          <template v-if="visiblePages[pageNum]">
            <canvas
              :ref="(el) => setCanvasRef(el as HTMLCanvasElement, pageNum)"
              class="scroll-page-canvas"
              aria-hidden="true"
            />
            <div
              :ref="(el) => setTextLayerRef(el as HTMLElement, pageNum)"
              class="scroll-page-text-layer"
              @click="handleHighlightClick"
            />
            <!-- Máscara do Modo de Foco no PDF Scroll -->
            <ReaderFocusOverlay
              v-if="store.isFocusMode && store.currentPage === pageNum"
              :top="focusBounds.top"
              :height="focusBounds.height"
              :bottom="focusBounds.bottom"
              @advance="handleFocusAdvance"
            />
            <ReaderFocusOverlay
              v-else-if="store.isFocusMode"
              :top="0"
              :height="0"
              :bottom="0"
              @advance="handleFocusAdvance"
            />
          </template>

          <!-- Placeholder suave enquanto não entra na viewport -->
          <div
            v-else
            class="scroll-page-placeholder flex flex-col items-center justify-center select-none"
            :style="{ height: `${getPageHeight(pageNum)}px` }"
          >
            <span class="text-xs font-technical opacity-40">
              Página {{ pageNum }} de {{ store.totalPages }}
            </span>
          </div>

          <!-- Indicador sutil de número da página no rodapé da folha -->
          <div class="scroll-page-slot__badge" aria-hidden="true">
            {{ pageNum }}
          </div>
        </div>
      </template>

      <!-- ================= FLUXO EPUB CONTÍNUO (REFLOW HTML) ================= -->
      <template v-else-if="isEpubContinuous">
        <div
          v-for="sectionIdx in sectionCount"
          :key="'epub-sec-' + sectionIdx"
          :ref="(el) => setSectionSlotRef(el as HTMLElement, sectionIdx - 1)"
          class="scroll-section-slot"
          :data-section-index="sectionIdx - 1"
          :data-page-number="getPageForSection(sectionIdx - 1)"
          :style="{
            fontFamily: store.fontFamily,
            fontSize: `${store.fontSize}px`,
          }"
        >
          <template v-if="visibleSections[sectionIdx - 1]">
            <div
              :ref="(el) => setSectionContentRef(el as HTMLElement, sectionIdx - 1)"
              class="scroll-section-content"
              @click="handleHighlightClick"
            />
            <!-- Máscara do Modo de Foco no EPUB Contínuo -->
            <ReaderFocusOverlay
              v-if="store.isFocusMode && currentFocusedSection === sectionIdx - 1"
              :top="focusBounds.top"
              :height="focusBounds.height"
              :bottom="focusBounds.bottom"
              @advance="handleFocusAdvance"
            />
            <ReaderFocusOverlay
              v-else-if="store.isFocusMode"
              :top="0"
              :height="0"
              :bottom="0"
              @advance="handleFocusAdvance"
            />
          </template>
          <div
            v-else
            class="scroll-section-placeholder min-h-[300px] flex items-center justify-center opacity-30 select-none text-xs font-technical"
          >
            Carregando seção {{ sectionIdx }}...
          </div>
        </div>
      </template>

      <!-- ================= FALLBACK GENÉRICO / DIDACTIC ================= -->
      <template v-else>
        <div
          v-for="pageNum in store.totalPages"
          :key="'fallback-page-' + pageNum"
          :ref="(el) => setSlotRef(el as HTMLElement, pageNum)"
          class="scroll-page-slot shadow-sm"
          :data-page-number="pageNum"
          :style="{
            minHeight: `${getPageHeight(pageNum)}px`,
            backgroundColor: pageSheetBgColor,
          }"
        >
          <div
            :ref="(el) => setTextLayerRef(el as HTMLElement, pageNum)"
            class="scroll-page-text-layer"
            @click="handleHighlightClick"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useReaderStore } from '~/stores/readerStore'
import { useReaderScroll } from '~/composables/reader/useReaderScroll'
import { useAnnotations } from '~/composables/useAnnotations'
import { applyPageHighlights } from '~/utils/readerHighlight'
import { useReaderFocus } from '~/composables/reader/useReaderFocus'
import ReaderFocusOverlay from '~/components/reader/ReaderFocusOverlay.vue'

const emit = defineEmits<{
  (_e: 'select-annotation', _annotationId: number): void
  (_e: 'text-selected', _event: MouseEvent): void
}>()

const store = useReaderStore()
const { annotations } = useAnnotations()

const containerRef = ref<HTMLElement | null>(null)
const contentAreaRef = ref<HTMLElement | null>(null)

// Total de páginas para sincronização do scroll
const totalPagesRef = computed(() => store.totalPages || 1)

const {
  onPageVisible,
  scrollToPage,
  handleKeyDown,
} = useReaderScroll({
  containerRef,
  totalPages: totalPagesRef,
})

// Conjuntos de visibilidade para virtualização (reativos)
const visiblePages = reactive<Record<number, boolean>>({})
const visibleSections = reactive<Record<number, boolean>>({})

// Mapas de elementos
const slotElements = new Map<number, HTMLElement>()
const canvasElements = new Map<number, HTMLCanvasElement>()
const textLayerElements = new Map<number, HTMLElement>()

const sectionSlotElements = new Map<number, HTMLElement>()
const sectionContentElements = new Map<number, HTMLElement>()

// Observers
let pageObserver: IntersectionObserver | null = null
let sectionObserver: IntersectionObserver | null = null
let baselineObserver: IntersectionObserver | null = null

// Cores e Temas
const activeTheme = computed(() => store.readerTheme || 'sepia')

const themeBgColor = computed(() => {
  if (store.readerTheme === 'sepia') return '#FAF5E8'
  if (store.readerTheme === 'white') return '#F4F4F5'
  return '#121214'
})

const pageSheetBgColor = computed(() => {
  if (store.readerTheme === 'sepia') return '#fbf0d9'
  if (store.readerTheme === 'white') return '#ffffff'
  return '#18181b'
})

const themeTextColor = computed(() => {
  if (store.readerTheme === 'sepia') return '#2a2521'
  if (store.readerTheme === 'white') return '#18181b'
  return '#e4e4e7'
})

// Tipos de Documento
const isPdfDocument = computed(() => store.document?.type === 'pdf')
const isEpubContinuous = computed(() => {
  return (
    store.document?.type === 'epub' &&
    typeof (store.document as any).renderSectionContinuous === 'function'
  )
})

const sectionCount = computed(() => {
  if (isEpubContinuous.value && typeof (store.document as any).getSectionCount === 'function') {
    return (store.document as any).getSectionCount() || 0
  }
  return 0
})

// Pré-preenchimento das páginas/seções no entorno da página atual
function prefillVisibleWindow() {
  const curPage = store.currentPage || 1
  if (isPdfDocument.value) {
    const total = store.totalPages || 1
    for (let p = Math.max(1, curPage - 2); p <= Math.min(total, curPage + 3); p++) {
      visiblePages[p] = true
    }
  } else if (isEpubContinuous.value) {
    const curSec = typeof (store.document as any)?.getSectionForPage === 'function'
      ? (store.document as any).getSectionForPage(curPage)
      : 0
    const totalSec = sectionCount.value || (store.document as any)?.getSectionCount?.() || 1
    for (let s = Math.max(0, curSec - 2); s <= Math.min(totalSec - 1, curSec + 3); s++) {
      visibleSections[s] = true
    }
  }
}

// Inicializa visibilidade inicial no setup
prefillVisibleWindow()

function resetVisibility() {
  for (const key of Object.keys(visiblePages)) {
    delete visiblePages[Number(key)]
  }
  for (const key of Object.keys(visibleSections)) {
    delete visibleSections[Number(key)]
  }
  prefillVisibleWindow()
}

function getPageForSection(sectionIdx: number): number {
  if (
    store.document &&
    typeof (store.document as any).getPageForSection === 'function'
  ) {
    return (store.document as any).getPageForSection(sectionIdx) || 1
  }
  return 1
}

function getPageHeight(pageNum: number): number {
  const containerW = contentAreaRef.value?.clientWidth || 800
  const aspect = store.document?.getAspectRatio?.(pageNum) || 0.707
  return Math.round(containerW / Math.max(0.2, aspect))
}

// Registro de Refs
function setSlotRef(el: HTMLElement | null, pageNum: number) {
  if (el) {
    slotElements.set(pageNum, el)
    pageObserver?.observe(el)
    baselineObserver?.observe(el)
  } else {
    const prev = slotElements.get(pageNum)
    if (prev) {
      pageObserver?.unobserve(prev)
      baselineObserver?.unobserve(prev)
    }
    slotElements.delete(pageNum)
  }
}

function setCanvasRef(el: HTMLCanvasElement | null, pageNum: number) {
  if (el) {
    canvasElements.set(pageNum, el)
    renderPdfPage(pageNum, el)
  } else {
    canvasElements.delete(pageNum)
  }
}

function setTextLayerRef(el: HTMLElement | null, pageNum: number) {
  if (el) {
    textLayerElements.set(pageNum, el)
    renderTextLayer(pageNum, el)
  } else {
    textLayerElements.delete(pageNum)
  }
}

function setSectionSlotRef(el: HTMLElement | null, sectionIdx: number) {
  if (el) {
    sectionSlotElements.set(sectionIdx, el)
    sectionObserver?.observe(el)
    baselineObserver?.observe(el)
  } else {
    const prev = sectionSlotElements.get(sectionIdx)
    if (prev) {
      sectionObserver?.unobserve(prev)
      baselineObserver?.unobserve(prev)
    }
    sectionSlotElements.delete(sectionIdx)
  }
}

function setSectionContentRef(el: HTMLElement | null, sectionIdx: number) {
  if (el) {
    sectionContentElements.set(sectionIdx, el)
    renderEpubSection(sectionIdx, el)
  } else {
    sectionContentElements.delete(sectionIdx)
  }
}

// Renderização de Página PDF
async function renderPdfPage(pageNum: number, canvas: HTMLCanvasElement) {
  if (!store.document) return
  try {
    const slot = slotElements.get(pageNum)
    const renderWidth = slot?.clientWidth || contentAreaRef.value?.clientWidth || 800
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 4) : 1
    const pageData = await store.document.getPage(pageNum, renderWidth)

    const aspect = pageData.aspectRatio || store.document.getAspectRatio?.(pageNum) || 0.707
    const cssWidth = renderWidth
    const cssHeight = Math.round(renderWidth / Math.max(0.2, aspect))

    canvas.width = Math.round(pageData.width || cssWidth * dpr)
    canvas.height = Math.round(pageData.height || cssHeight * dpr)
    canvas.style.width = `${cssWidth}px`
    canvas.style.height = `${cssHeight}px`

    const ctx = canvas.getContext('2d', { alpha: false })
    if (ctx) {
      await pageData.render(ctx)
    }
  } catch {
    // ignorar cancelamento de render
  }
}

// Renderização de Text Layer (Seleção & Highlights)
async function renderTextLayer(pageNum: number, textLayerEl: HTMLElement) {
  if (!store.document) return
  try {
    const slot = slotElements.get(pageNum)
    const width = slot?.clientWidth || contentAreaRef.value?.clientWidth || 800

    if (typeof store.document.renderTextLayer === 'function') {
      // No modo scroll a altura da folha é natural (proporcional à largura).
      // Passar apenas a largura evita cálculos conflitantes de aspect ratio e offsets espúrios.
      await store.document.renderTextLayer(pageNum, textLayerEl, width)
    }

    // Aplica destaques existentes
    if (annotations.value.length > 0) {
      applyPageHighlights(textLayerEl, pageNum, annotations.value, store.bookId)
    }

    if (store.isFocusMode && isPdfDocument.value && pageNum === store.currentPage) {
      await nextTick()
      refreshFocusLines()
    }
  } catch {
    // ignorar erro
  }
}

// Renderização de Seção Contínua EPUB
async function renderEpubSection(sectionIdx: number, container: HTMLElement) {
  if (!store.document) return
  try {
    if (typeof (store.document as any).renderSectionContinuous === 'function') {
      await (store.document as any).renderSectionContinuous(sectionIdx, container)
    }

    // Aplica destaques na seção
    const pageNum = getPageForSection(sectionIdx)
    if (annotations.value.length > 0) {
      applyPageHighlights(container, pageNum, annotations.value, store.bookId)
    }

    if (store.isFocusMode && isEpubContinuous.value && sectionIdx === currentFocusedSection.value) {
      await nextTick()
      refreshFocusLines()
    }
  } catch {
    // ignorar erro
  }
}

// Clique em Anotação
function handleHighlightClick(e: MouseEvent) {
  const target = (e.target as HTMLElement)?.closest('.reader-highlight') as HTMLElement | null
  if (target) {
    const annIdStr = target.getAttribute('data-annotation-id')
    if (annIdStr) {
      const annId = Number(annIdStr)
      if (!isNaN(annId)) {
        emit('select-annotation', annId)
      }
    }
  }
}

// Disparo de Seleção de Texto para Tooltip (Mouse / Toque / Caneta)
function handleSelectionEnd(e: Event) {
  emit('text-selected', e as any)
}

function onKeyDown(e: KeyboardEvent) {
  handleKeyDown(e)
}

// Inicialização de IntersectionObservers
function initObservers() {
  prefillVisibleWindow()

  if (typeof IntersectionObserver === 'undefined') {
    // Fallback: marca tudo como visível se IntersectionObserver não existir no ambiente
    if (isPdfDocument.value) {
      for (let i = 1; i <= (store.totalPages || 0); i++) {
        visiblePages[i] = true
      }
    } else if (isEpubContinuous.value) {
      for (let i = 0; i < sectionCount.value; i++) {
        visibleSections[i] = true
      }
    }
    return
  }

  // Observer com margem ampla para pré-carregar páginas
  pageObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const pageNum = Number(entry.target.getAttribute('data-page-number'))
        if (!isNaN(pageNum)) {
          if (entry.isIntersecting) {
            visiblePages[pageNum] = true
          } else {
            delete visiblePages[pageNum]
          }
        }
      }
    },
    {
      root: containerRef.value,
      rootMargin: '800px 0px 800px 0px',
      threshold: 0.01,
    },
  )

  // Observer para seções EPUB com margem
  sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const secIdx = Number(entry.target.getAttribute('data-section-index'))
        if (!isNaN(secIdx)) {
          if (entry.isIntersecting) {
            visibleSections[secIdx] = true
          } else {
            delete visibleSections[secIdx]
          }
        }
      }
    },
    {
      root: containerRef.value,
      rootMargin: '1000px 0px 1000px 0px',
      threshold: 0.01,
    },
  )

  // Baseline Observer para calcular página ativa (cruza o terço superior)
  baselineObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const pageNum = Number(entry.target.getAttribute('data-page-number'))
          if (!isNaN(pageNum)) {
            onPageVisible(pageNum)
          }
          const secIdx = Number(entry.target.getAttribute('data-section-index'))
          if (!isNaN(secIdx) && secIdx !== currentFocusedSection.value) {
            currentFocusedSection.value = secIdx
            if (store.isFocusMode) {
              refreshFocusLines()
            }
          }
        }
      }
    },
    {
      root: containerRef.value,
      rootMargin: '-15% 0px -70% 0px',
      threshold: 0,
    },
  )

  // Conecta os elementos já montados no DOM
  for (const el of slotElements.values()) {
    pageObserver.observe(el)
    baselineObserver.observe(el)
  }
  for (const el of sectionSlotElements.values()) {
    sectionObserver.observe(el)
    baselineObserver.observe(el)
  }
}

function cleanupObservers() {
  pageObserver?.disconnect()
  sectionObserver?.disconnect()
  baselineObserver?.disconnect()
  pageObserver = null
  sectionObserver = null
  baselineObserver = null
}

// Sincroniza anotações atualizadas com os textLayers visíveis
watch(
  () => annotations.value,
  () => {
    for (const [pageNum, el] of textLayerElements.entries()) {
      applyPageHighlights(el, pageNum, annotations.value, store.bookId)
    }
    for (const [secIdx, el] of sectionContentElements.entries()) {
      const pageNum = getPageForSection(secIdx)
      applyPageHighlights(el, pageNum, annotations.value, store.bookId)
    }
  },
  { deep: true },
)

// Ao montar ou mudar documento
watch(
  () => store.document,
  async () => {
    resetVisibility()
    await nextTick()
    if (store.currentPage && store.currentPage > 1) {
      scrollToPage(store.currentPage, 'auto')
    }
  },
)

// ================= MODO DE FOCO (LEITURA POR LINHAS EM SCROLL) =================
const currentFocusedSection = ref(0)

const focusController = useReaderFocus({
  onNextPage: async () => {
    if (isPdfDocument.value) {
      if (store.currentPage < (store.totalPages || 1)) {
        const nextP = store.currentPage + 1
        store.goToPage(nextP)
        store.setFocusBlockIndex(0)
        scrollToPage(nextP)
        await nextTick()
        refreshFocusLines()
      }
    } else if (isEpubContinuous.value) {
      if (currentFocusedSection.value < sectionCount.value - 1) {
        currentFocusedSection.value++
        store.setFocusBlockIndex(0)
        const secSlot = sectionSlotElements.get(currentFocusedSection.value)
        if (secSlot) {
          secSlot.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        await nextTick()
        refreshFocusLines()
      }
    }
  },
  onPrevPage: async () => {
    if (isPdfDocument.value) {
      if (store.currentPage > 1) {
        const prevP = store.currentPage - 1
        store.goToPage(prevP)
        scrollToPage(prevP)
        await nextTick()
        refreshFocusLines()
        const prevLineCount = focusController.lines.value.length
        store.setFocusBlockIndex(Math.max(0, prevLineCount - store.focusLineCount))
      }
    } else if (isEpubContinuous.value) {
      if (currentFocusedSection.value > 0) {
        currentFocusedSection.value--
        const secSlot = sectionSlotElements.get(currentFocusedSection.value)
        if (secSlot) {
          secSlot.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
        await nextTick()
        refreshFocusLines()
        const prevLineCount = focusController.lines.value.length
        store.setFocusBlockIndex(Math.max(0, prevLineCount - store.focusLineCount))
      }
    }
  },
})

const focusBounds = computed(() => focusController.focusBounds.value)
const focusProgressLabel = computed(() => focusController.progressLabel.value)

function getActiveFocusContainer(): HTMLElement | null {
  if (isPdfDocument.value) {
    return slotElements.get(store.currentPage) || textLayerElements.get(store.currentPage) || null
  } else if (isEpubContinuous.value) {
    return sectionSlotElements.get(currentFocusedSection.value) || sectionContentElements.get(currentFocusedSection.value) || null
  }
  return slotElements.get(store.currentPage) || null
}

function refreshFocusLines() {
  const container = getActiveFocusContainer()
  if (container) {
    focusController.refreshLines(container)
  }
}

async function focusNext(): Promise<{ transitionedPage: boolean }> {
  const res = await focusController.nextBlock()
  if (!res.transitionedPage && containerRef.value) {
    await nextTick()
    const container = getActiveFocusContainer()
    if (container) {
      const containerRect = container.getBoundingClientRect()
      const viewportRect = containerRef.value.getBoundingClientRect()
      const apertureTopViewport = containerRect.top + focusBounds.value.top - viewportRect.top
      const apertureBottomViewport = containerRect.top + focusBounds.value.bottom - viewportRect.top

      if (apertureBottomViewport > viewportRect.height * 0.70) {
        const delta = apertureTopViewport - viewportRect.height * 0.35
        containerRef.value.scrollBy({
          top: delta,
          behavior: 'smooth',
        })
      }
    }
  }
  return res
}

async function focusPrev(): Promise<{ transitionedPage: boolean }> {
  const res = await focusController.prevBlock()
  if (!res.transitionedPage && containerRef.value) {
    await nextTick()
    const container = getActiveFocusContainer()
    if (container) {
      const containerRect = container.getBoundingClientRect()
      const viewportRect = containerRef.value.getBoundingClientRect()
      const apertureTopViewport = containerRect.top + focusBounds.value.top - viewportRect.top

      if (apertureTopViewport < viewportRect.height * 0.15) {
        const delta = apertureTopViewport - viewportRect.height * 0.35
        containerRef.value.scrollBy({
          top: delta,
          behavior: 'smooth',
        })
      }
    }
  }
  return res
}

function handleFocusAdvance() {
  void focusNext()
}

watch(
  [() => store.isFocusMode, () => store.focusLineCount, () => store.currentPage],
  async ([isFocus]) => {
    if (isFocus) {
      if (isEpubContinuous.value && typeof (store.document as any)?.getSectionForPage === 'function') {
        const sec = (store.document as any).getSectionForPage(store.currentPage)
        if (typeof sec === 'number' && sec >= 0 && sec !== currentFocusedSection.value) {
          currentFocusedSection.value = sec
        }
      }
      await nextTick()
      refreshFocusLines()
    }
  },
)

let zoomDebounceTimer: ReturnType<typeof setTimeout> | null = null
let dprMediaQuery: MediaQueryList | null = null

function handleDprChange() {
  handleResizeOrZoom()
  if (typeof window !== 'undefined' && window.matchMedia) {
    dprMediaQuery?.removeEventListener('change', handleDprChange)
    dprMediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    dprMediaQuery.addEventListener('change', handleDprChange)
  }
}

function handleResizeOrZoom() {
  if (zoomDebounceTimer) clearTimeout(zoomDebounceTimer)
  zoomDebounceTimer = setTimeout(async () => {
    if (!store.document) return
    // Quando o usuário dá zoom no navegador (Ctrl + / Ctrl -), re-rasteriza com o novo DPR
    if (isPdfDocument.value) {
      for (const [pageNumStr, isVis] of Object.entries(visiblePages)) {
        if (!isVis) continue
        const pageNum = Number(pageNumStr)
        const canvas = canvasElements.get(pageNum)
        if (canvas) {
          await renderPdfPage(pageNum, canvas)
        }
        const textLayerEl = textLayerElements.get(pageNum)
        if (textLayerEl) {
          await renderTextLayer(pageNum, textLayerEl)
        }
      }
    }
  }, 150)
}

onMounted(async () => {
  initObservers()
  await nextTick()

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResizeOrZoom)
    if (window.matchMedia) {
      dprMediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
      dprMediaQuery.addEventListener('change', handleDprChange)
    }
  }

  // Se já houver página definida, rola até ela
  if (store.currentPage && store.currentPage > 1) {
    scrollToPage(store.currentPage, 'auto')
  }
  if (store.isFocusMode) {
    refreshFocusLines()
  }
})

onUnmounted(() => {
  if (zoomDebounceTimer) clearTimeout(zoomDebounceTimer)
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResizeOrZoom)
  }
  dprMediaQuery?.removeEventListener('change', handleDprChange)
  cleanupObservers()
  slotElements.clear()
  canvasElements.clear()
  textLayerElements.clear()
  sectionSlotElements.clear()
  sectionContentElements.clear()
})

defineExpose({
  scrollToPage,
  focusNext,
  focusPrev,
  focusProgressLabel,
})
</script>

<style scoped>
.reader-scroll-engine {
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  outline: none;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.reader-scroll-engine__content {
  margin: 0 auto;
  padding: 24px 16px 80px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  transition: max-width 0.2s ease-in-out;
}

.reader-scroll-engine__content--centered {
  max-width: 860px;
}

.reader-scroll-engine__content--wide {
  max-width: 1180px;
  width: 96%;
}

/* Slots de Página PDF */
.scroll-page-slot {
  position: relative;
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.scroll-page-canvas {
  display: block;
  width: 100%;
  height: auto;
}

.scroll-page-text-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  user-select: text;
  -webkit-user-select: text;
  pointer-events: auto;
  touch-action: auto !important;
  -webkit-touch-callout: default !important;
}

.scroll-page-placeholder {
  width: 100%;
}

.scroll-page-slot__badge {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-family: var(--font-technical, monospace);
  font-size: 10px;
  opacity: 0.35;
  pointer-events: none;
  user-select: none;
}

/* Seções Contínuas EPUB */
.scroll-section-slot {
  position: relative;
  width: 100%;
  padding: 16px 24px;
  border-radius: 8px;
  box-sizing: border-box;
  user-select: text;
  -webkit-user-select: text;
  touch-action: auto !important;
  -webkit-touch-callout: default !important;
}

.scroll-section-content {
  width: 100%;
  line-height: 1.75;
  word-wrap: break-word;
  user-select: text !important;
  -webkit-user-select: text !important;
  touch-action: auto !important;
  -webkit-touch-callout: default !important;
}

/* ================= TEMAS E CONTRASTE DE CORES NO SCROLL ================= */

/* --- TEMA ESCURO (BLACK) --- */
.reader-scroll-engine--theme-black .scroll-section-content,
.reader-scroll-engine--theme-black .scroll-section-content :deep(*),
.reader-scroll-engine--theme-black .scroll-section-content :deep(.epub-text-layer-content),
.reader-scroll-engine--theme-black .scroll-section-content :deep(.epub-continuous-content),
.reader-scroll-engine--theme-black .scroll-section-content :deep(p),
.reader-scroll-engine--theme-black .scroll-section-content :deep(span),
.reader-scroll-engine--theme-black .scroll-section-content :deep(div),
.reader-scroll-engine--theme-black .scroll-section-content :deep(li),
.reader-scroll-engine--theme-black .scroll-section-content :deep(strong),
.reader-scroll-engine--theme-black .scroll-section-content :deep(b),
.reader-scroll-engine--theme-black .scroll-section-content :deep(em),
.reader-scroll-engine--theme-black .scroll-section-content :deep(i),
.reader-scroll-engine--theme-black .scroll-section-content :deep(small),
.reader-scroll-engine--theme-black .scroll-page-text-layer :deep(.didactic-article-body),
.reader-scroll-engine--theme-black .scroll-page-text-layer :deep(.didactic-paragraph) {
  color: #e4e4e7 !important;
}

.reader-scroll-engine--theme-black .scroll-section-content :deep(h1),
.reader-scroll-engine--theme-black .scroll-section-content :deep(h2),
.reader-scroll-engine--theme-black .scroll-section-content :deep(h3),
.reader-scroll-engine--theme-black .scroll-section-content :deep(h4),
.reader-scroll-engine--theme-black .scroll-section-content :deep(h5),
.reader-scroll-engine--theme-black .scroll-section-content :deep(h6),
.reader-scroll-engine--theme-black .scroll-section-content :deep(.chapter-title),
.reader-scroll-engine--theme-black .scroll-section-content :deep(.book-title),
.reader-scroll-engine--theme-black .scroll-section-content :deep(.title),
.reader-scroll-engine--theme-black .scroll-section-content :deep(.chapter-subtitle),
.reader-scroll-engine--theme-black .scroll-section-content :deep(.book-subtitle),
.reader-scroll-engine--theme-black .scroll-section-content :deep(.subtitle),
.reader-scroll-engine--theme-black .scroll-page-text-layer :deep(.didactic-heading) {
  color: #ffffff !important;
}

.reader-scroll-engine--theme-black .scroll-section-content :deep(a) {
  color: #f97316 !important;
}

.reader-scroll-engine--theme-black .scroll-section-content :deep(blockquote) {
  color: #d4d4d8 !important;
  border-left-color: rgba(255, 255, 255, 0.25) !important;
}

.reader-scroll-engine--theme-black .scroll-section-content :deep(hr) {
  border-top-color: rgba(255, 255, 255, 0.15) !important;
}

.reader-scroll-engine--theme-black .scroll-section-content :deep(table),
.reader-scroll-engine--theme-black .scroll-section-content :deep(th),
.reader-scroll-engine--theme-black .scroll-section-content :deep(td) {
  border-color: rgba(255, 255, 255, 0.15) !important;
  color: #e4e4e7 !important;
}

.reader-scroll-engine--theme-black .scroll-section-placeholder,
.reader-scroll-engine--theme-black .scroll-page-placeholder {
  color: #a1a1aa !important;
}

.reader-scroll-engine--theme-black .scroll-page-slot__badge {
  color: #71717a !important;
}

.reader-scroll-engine--theme-black :deep(::selection) {
  background: rgba(229, 123, 85, 0.45) !important;
  color: #ffffff !important;
}

/* --- TEMA SÉPIA (SEPIA) --- */
.reader-scroll-engine--theme-sepia .scroll-section-content,
.reader-scroll-engine--theme-sepia .scroll-section-content :deep(*),
.reader-scroll-engine--theme-sepia .scroll-section-content :deep(.epub-text-layer-content),
.reader-scroll-engine--theme-sepia .scroll-section-content :deep(.epub-continuous-content),
.reader-scroll-engine--theme-sepia .scroll-section-content :deep(p),
.reader-scroll-engine--theme-sepia .scroll-section-content :deep(span),
.reader-scroll-engine--theme-sepia .scroll-section-content :deep(div),
.reader-scroll-engine--theme-sepia .scroll-section-content :deep(li),
.reader-scroll-engine--theme-sepia .scroll-section-content :deep(strong),
.reader-scroll-engine--theme-sepia .scroll-section-content :deep(b),
.reader-scroll-engine--theme-sepia .scroll-section-content :deep(em),
.reader-scroll-engine--theme-sepia .scroll-section-content :deep(i),
.reader-scroll-engine--theme-sepia .scroll-page-text-layer :deep(.didactic-article-body),
.reader-scroll-engine--theme-sepia .scroll-page-text-layer :deep(.didactic-paragraph) {
  color: #2a2521 !important;
}

.reader-scroll-engine--theme-sepia .scroll-section-content :deep(h1),
.reader-scroll-engine--theme-sepia .scroll-section-content :deep(h2),
.reader-scroll-engine--theme-sepia .scroll-section-content :deep(h3),
.reader-scroll-engine--theme-sepia .scroll-section-content :deep(h4),
.reader-scroll-engine--theme-sepia .scroll-section-content :deep(h5),
.reader-scroll-engine--theme-sepia .scroll-section-content :deep(h6),
.reader-scroll-engine--theme-sepia .scroll-section-content :deep(.chapter-title),
.reader-scroll-engine--theme-sepia .scroll-section-content :deep(.book-title),
.reader-scroll-engine--theme-sepia .scroll-section-content :deep(.title),
.reader-scroll-engine--theme-sepia .scroll-page-text-layer :deep(.didactic-heading) {
  color: #1a1613 !important;
}

.reader-scroll-engine--theme-sepia .scroll-section-content :deep(a) {
  color: #c2410c !important;
}

.reader-scroll-engine--theme-sepia .scroll-section-content :deep(blockquote) {
  color: #3f3630 !important;
  border-left-color: rgba(60, 45, 20, 0.25) !important;
}

.reader-scroll-engine--theme-sepia .scroll-section-content :deep(hr) {
  border-top-color: rgba(60, 45, 20, 0.15) !important;
}

.reader-scroll-engine--theme-sepia :deep(::selection) {
  background: rgba(229, 123, 85, 0.3) !important;
  color: #2a2521 !important;
}

/* --- TEMA BRANCO (WHITE) --- */
.reader-scroll-engine--theme-white .scroll-section-content,
.reader-scroll-engine--theme-white .scroll-section-content :deep(*),
.reader-scroll-engine--theme-white .scroll-section-content :deep(.epub-text-layer-content),
.reader-scroll-engine--theme-white .scroll-section-content :deep(.epub-continuous-content),
.reader-scroll-engine--theme-white .scroll-section-content :deep(p),
.reader-scroll-engine--theme-white .scroll-section-content :deep(span),
.reader-scroll-engine--theme-white .scroll-section-content :deep(div),
.reader-scroll-engine--theme-white .scroll-section-content :deep(li),
.reader-scroll-engine--theme-white .scroll-section-content :deep(strong),
.reader-scroll-engine--theme-white .scroll-section-content :deep(b),
.reader-scroll-engine--theme-white .scroll-section-content :deep(em),
.reader-scroll-engine--theme-white .scroll-section-content :deep(i),
.reader-scroll-engine--theme-white .scroll-page-text-layer :deep(.didactic-article-body),
.reader-scroll-engine--theme-white .scroll-page-text-layer :deep(.didactic-paragraph) {
  color: #18181b !important;
}

.reader-scroll-engine--theme-white .scroll-section-content :deep(h1),
.reader-scroll-engine--theme-white .scroll-section-content :deep(h2),
.reader-scroll-engine--theme-white .scroll-section-content :deep(h3),
.reader-scroll-engine--theme-white .scroll-section-content :deep(h4),
.reader-scroll-engine--theme-white .scroll-section-content :deep(h5),
.reader-scroll-engine--theme-white .scroll-section-content :deep(h6),
.reader-scroll-engine--theme-white .scroll-section-content :deep(.chapter-title),
.reader-scroll-engine--theme-white .scroll-section-content :deep(.book-title),
.reader-scroll-engine--theme-white .scroll-section-content :deep(.title),
.reader-scroll-engine--theme-white .scroll-page-text-layer :deep(.didactic-heading) {
  color: #09090b !important;
}

.reader-scroll-engine--theme-white .scroll-section-content :deep(a) {
  color: #ea580c !important;
}

.reader-scroll-engine--theme-white .scroll-section-content :deep(blockquote) {
  color: #27272a !important;
  border-left-color: rgba(0, 0, 0, 0.15) !important;
}

.reader-scroll-engine--theme-white .scroll-section-content :deep(hr) {
  border-top-color: rgba(0, 0, 0, 0.1) !important;
}

.reader-scroll-engine--theme-white :deep(::selection) {
  background: rgba(229, 123, 85, 0.3) !important;
  color: #18181b !important;
}

/* ================= PDF.JS TEXT LAYER ================= */
/* A camada de texto do PDF.js deve ser estritamente invisível e alinhada ao Canvas.
   Os glifos visuais são renderizados exclusivamente no Canvas subjacente. */
:deep(.textLayer) {
  opacity: 1;
}

:deep(.textLayer :is(span, br)) {
  color: transparent !important;
  user-select: text !important;
  -webkit-user-select: text !important;
  pointer-events: auto !important;
}

:deep(.textLayer ::selection),
:deep(.textLayer *::selection) {
  background: rgba(229, 123, 85, 0.6) !important;
}

:deep(.textLayer ::-moz-selection),
:deep(.textLayer *::-moz-selection) {
  background: rgba(229, 123, 85, 0.6) !important;
}

:deep(.textLayer .reader-highlight) {
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  cursor: pointer;
  mix-blend-mode: multiply !important;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.04);
}

/* Destaques / Highlights */
:deep(.reader-highlight) {
  display: inline;
  border-radius: 3px;
  padding: 0.08em 0.18em;
  margin: 0 -0.05em;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  transition: background-color 0.15s ease, filter 0.15s ease;
  cursor: pointer;
  position: relative;
  z-index: 2;
  pointer-events: auto;
}

:deep(.reader-highlight:hover) {
  filter: brightness(0.92);
}

.reader-scroll-engine--theme-black :deep(.reader-highlight:hover) {
  filter: brightness(1.2);
}

/* Modo Zen */
.reader-scroll-engine--zen .reader-scroll-engine__content {
  padding-top: 16px;
  padding-bottom: 32px;
}
</style>
