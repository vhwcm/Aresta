import { computed, ref, shallowRef, type Ref } from 'vue'
import { useReaderStore } from '~/stores/readerStore'

export interface FocusLineRect {
  top: number
  bottom: number
  left: number
  right: number
  height: number
  width: number
}

export interface FocusWindowBounds {
  top: number
  bottom: number
  height: number
  isLastBlock: boolean
  startLine: number
  endLine: number
  totalLines: number
}

/**
 * Agrupa retângulos de caracteres ou palavras em linhas de texto horizontais discretas.
 * @param rects Lista de retângulos relativos ao contêiner
 * @param tolerance Tolerância vertical em pixels para considerar mesma linha
 */
export function extractLinesFromRects(
  rects: Array<{ top: number; bottom: number; left: number; right: number; width?: number; height?: number }>,
  tolerance = 6,
): FocusLineRect[] {
  if (!rects || rects.length === 0) return []

  // Filtra retângulos vazios ou invisíveis
  const validRects = rects.filter((r) => {
    const w = r.width ?? (r.right - r.left)
    const h = r.height ?? (r.bottom - r.top)
    return w > 0 && h > 0
  })

  if (validRects.length === 0) return []

  // Ordena por posição vertical (top) e depois horizontal (left)
  const sorted = [...validRects].sort((a, b) => {
    if (Math.abs(a.top - b.top) <= tolerance) {
      return a.left - b.left
    }
    return a.top - b.top
  })

  const lines: FocusLineRect[] = []
  let currentGroup: Array<{ top: number; bottom: number; left: number; right: number }> = []

  for (const rect of sorted) {
    if (currentGroup.length === 0) {
      currentGroup.push(rect)
      continue
    }

    const groupTopAvg = currentGroup.reduce((sum, r) => sum + r.top, 0) / currentGroup.length
    if (Math.abs(rect.top - groupTopAvg) <= tolerance) {
      currentGroup.push(rect)
    } else {
      // Fecha a linha anterior
      const lineTop = Math.min(...currentGroup.map((r) => r.top))
      const lineBottom = Math.max(...currentGroup.map((r) => r.bottom))
      const lineLeft = Math.min(...currentGroup.map((r) => r.left))
      const lineRight = Math.max(...currentGroup.map((r) => r.right))
      lines.push({
        top: Math.round(lineTop),
        bottom: Math.round(lineBottom),
        left: Math.round(lineLeft),
        right: Math.round(lineRight),
        height: Math.round(lineBottom - lineTop),
        width: Math.round(lineRight - lineLeft),
      })
      currentGroup = [rect]
    }
  }

  if (currentGroup.length > 0) {
    const lineTop = Math.min(...currentGroup.map((r) => r.top))
    const lineBottom = Math.max(...currentGroup.map((r) => r.bottom))
    const lineLeft = Math.min(...currentGroup.map((r) => r.left))
    const lineRight = Math.max(...currentGroup.map((r) => r.right))
    lines.push({
      top: Math.round(lineTop),
      bottom: Math.round(lineBottom),
      left: Math.round(lineLeft),
      right: Math.round(lineRight),
      height: Math.round(lineBottom - lineTop),
      width: Math.round(lineRight - lineLeft),
    })
  }

  return lines
}

/**
 * Inspeciona o elemento DOM da página (PDF textLayer ou EPUB HTML) e extrai as linhas visuais.
 */
export function extractLinesFromContainer(
  container: HTMLElement | null,
  tolerance = 6,
): FocusLineRect[] {
  if (!container || typeof window === 'undefined') return []

  const containerRect = container.getBoundingClientRect()
  if (containerRect.width === 0 || containerRect.height === 0) return []

  const rawRects: Array<{ top: number; bottom: number; left: number; right: number }> = []

  // 1. Tenta extrair primeiro de spans (comum no PDF.js .textLayer)
  const spans = container.querySelectorAll('.textLayer > span, span[role="presentation"]')
  if (spans.length > 0) {
    spans.forEach((span) => {
      const rect = span.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        rawRects.push({
          top: rect.top - containerRect.top + container.scrollTop,
          bottom: rect.bottom - containerRect.top + container.scrollTop,
          left: rect.left - containerRect.left + container.scrollLeft,
          right: rect.right - containerRect.left + container.scrollLeft,
        })
      }
    })
  }

  // 2. Se não houver spans de PDF, inspeciona nós de texto usando Range (EPUB / HTML)
  if (rawRects.length === 0) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const text = node.textContent?.trim() || ''
        if (!text) return NodeFilter.FILTER_REJECT
        const parent = node.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT
        const display = window.getComputedStyle(parent).display
        if (display === 'none') return NodeFilter.FILTER_REJECT
        return NodeFilter.FILTER_ACCEPT
      },
    })

    let textNode = walker.nextNode()
    while (textNode) {
      try {
        const range = document.createRange()
        range.selectNodeContents(textNode)
        const clientRects = range.getClientRects()
        for (let i = 0; i < clientRects.length; i++) {
          const r = clientRects[i]
          if (r && r.width > 2 && r.height > 2) {
            rawRects.push({
              top: r.top - containerRect.top + container.scrollTop,
              bottom: r.bottom - containerRect.top + container.scrollTop,
              left: r.left - containerRect.left + container.scrollLeft,
              right: r.right - containerRect.left + container.scrollLeft,
            })
          }
        }
      } catch {
        // Ignora erro em nós transitórios
      }
      textNode = walker.nextNode()
    }
  }

  const lines = extractLinesFromRects(rawRects, tolerance)

  // Fallback caso a página não contenha texto selecionável (ex: imagem escaneada)
  if (lines.length === 0 && containerRect.height > 50) {
    const defaultLineHeight = 32
    const totalFallbackLines = Math.max(1, Math.floor(containerRect.height / defaultLineHeight))
    for (let i = 0; i < totalFallbackLines; i++) {
      const top = i * defaultLineHeight
      lines.push({
        top,
        bottom: top + defaultLineHeight,
        left: 0,
        right: containerRect.width,
        height: defaultLineHeight,
        width: containerRect.width,
      })
    }
  }

  return lines
}

/**
 * Calcula os limites verticais e metadados da janela focal para o bloco de linhas solicitado.
 */
export function calculateFocusWindow(
  lines: FocusLineRect[],
  startIndex: number,
  lineCount: number,
  containerHeight: number,
): FocusWindowBounds {
  const totalLines = lines.length

  if (totalLines === 0) {
    return {
      top: 0,
      bottom: Math.max(100, containerHeight),
      height: Math.max(100, containerHeight),
      isLastBlock: true,
      startLine: 0,
      endLine: 0,
      totalLines: 0,
    }
  }

  const clampedCount = Math.max(1, lineCount)
  const clampedStart = Math.max(0, Math.min(startIndex, totalLines - 1))
  const remaining = totalLines - clampedStart

  let endIndex: number
  let isLastBlock: boolean

  if (remaining <= clampedCount) {
    // Edge case: menos ou exatamente X linhas restantes -> exibe todas as restantes
    endIndex = totalLines - 1
    isLastBlock = true
  } else {
    endIndex = clampedStart + clampedCount - 1
    isLastBlock = false
  }

  const activeSlice = lines.slice(clampedStart, endIndex + 1)
  const top = Math.min(...activeSlice.map((l) => l.top))
  const bottom = Math.max(...activeSlice.map((l) => l.bottom))
  const height = Math.max(20, bottom - top)

  return {
    top: Math.max(0, top),
    bottom,
    height,
    isLastBlock,
    startLine: clampedStart,
    endLine: endIndex,
    totalLines,
  }
}

export interface UseReaderFocusOptions {
  containerRef?: Ref<HTMLElement | null>
  onNextPage?: () => void | Promise<void>
  onPrevPage?: () => void | Promise<void>
}

export function useReaderFocus(options: UseReaderFocusOptions = {}) {
  const store = useReaderStore()
  const lines = shallowRef<FocusLineRect[]>([])
  const containerHeight = ref<number>(800)

  function refreshLines(targetContainer?: HTMLElement | null) {
    const el = targetContainer || options.containerRef?.value || null
    if (!el) {
      lines.value = []
      return
    }
    containerHeight.value = el.clientHeight || el.getBoundingClientRect().height || 800
    lines.value = extractLinesFromContainer(el)
  }

  const focusBounds = computed<FocusWindowBounds>(() => {
    return calculateFocusWindow(
      lines.value,
      store.focusBlockIndex,
      store.focusLineCount,
      containerHeight.value,
    )
  })

  const progressLabel = computed<string>(() => {
    if (focusBounds.value.totalLines === 0) return '0 / 0'
    const startNum = focusBounds.value.startLine + 1
    const endNum = focusBounds.value.endLine + 1
    const total = focusBounds.value.totalLines
    if (startNum === endNum) {
      return `Linha ${startNum} de ${total}`
    }
    return `Linhas ${startNum}-${endNum} de ${total}`
  })

  async function nextBlock(): Promise<{ transitionedPage: boolean }> {
    if (!store.isFocusMode) return { transitionedPage: false }

    if (focusBounds.value.isLastBlock) {
      // Estava no último bloco da página/seção: avançar de página e voltar ao início
      store.setFocusBlockIndex(0)
      if (options.onNextPage) {
        await options.onNextPage()
      } else {
        store.nextPage()
      }
      return { transitionedPage: true }
    }

    // Avança para as próximas X linhas
    const nextIndex = focusBounds.value.endLine + 1
    store.setFocusBlockIndex(nextIndex)
    return { transitionedPage: false }
  }

  async function prevBlock(): Promise<{ transitionedPage: boolean }> {
    if (!store.isFocusMode) return { transitionedPage: false }

    if (store.focusBlockIndex <= 0) {
      // Estava no topo da página: voltar de página se possível
      if (options.onPrevPage) {
        await options.onPrevPage()
      } else {
        store.prevPage()
      }
      return { transitionedPage: true }
    }

    const prevIndex = Math.max(0, store.focusBlockIndex - store.focusLineCount)
    store.setFocusBlockIndex(prevIndex)
    return { transitionedPage: false }
  }

  function resetFocus() {
    store.setFocusBlockIndex(0)
  }

  return {
    lines,
    focusBounds,
    progressLabel,
    refreshLines,
    nextBlock,
    prevBlock,
    resetFocus,
  }
}
