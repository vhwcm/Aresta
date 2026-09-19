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
 * Verifica se dois retângulos pertencem à mesma linha visual de leitura.
 */
function areRectsOnSameLine(
  rectA: { top: number; bottom: number },
  rectB: { top: number; bottom: number },
  tolerance = 8,
): boolean {
  const heightA = rectA.bottom - rectA.top
  const heightB = rectB.bottom - rectB.top
  const midA = (rectA.top + rectA.bottom) / 2
  const midB = (rectB.top + rectB.bottom) / 2

  // Se a diferença entre os topos for menor que a tolerância
  if (Math.abs(rectA.top - rectB.top) <= tolerance) {
    return true
  }

  // Se os pontos médios estiverem alinhados com base na menor altura
  const minHeight = Math.min(heightA, heightB)
  if (minHeight > 10 && Math.abs(midA - midB) <= minHeight * 0.45) {
    return true
  }

  // Se houver sobreposição vertical de pelo menos 55%
  const overlapTop = Math.max(rectA.top, rectB.top)
  const overlapBottom = Math.min(rectA.bottom, rectB.bottom)
  const overlap = overlapBottom - overlapTop
  if (overlap > 0 && overlap >= minHeight * 0.55) {
    return true
  }

  return false
}

/**
 * Agrupa retângulos de caracteres, palavras, títulos ou imagens em linhas/blocos visuais discretos.
 */
export function extractLinesFromRects(
  rects: Array<{ top: number; bottom: number; left: number; right: number; width?: number; height?: number }>,
  tolerance = 8,
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
    if (areRectsOnSameLine(a, b, tolerance)) {
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

    const groupTopMin = Math.min(...currentGroup.map((r) => r.top))
    const groupBottomMax = Math.max(...currentGroup.map((r) => r.bottom))

    if (areRectsOnSameLine({ top: groupTopMin, bottom: groupBottomMax }, rect, tolerance)) {
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
 * Inspeciona o elemento DOM da página (PDF textLayer ou EPUB HTML) e extrai com precisão as linhas visuais,
 * títulos e imagens contidos estritamente na área visível da folha.
 */
export function extractLinesFromContainer(
  container: HTMLElement | null,
  tolerance = 8,
): FocusLineRect[] {
  if (!container || typeof window === 'undefined') return []

  const containerRect = container.getBoundingClientRect()
  if (containerRect.width === 0 || containerRect.height === 0) return []

  const cLeft = containerRect.left
  const cRight = containerRect.right
  const cTop = containerRect.top
  const cBottom = containerRect.bottom

  const rawRects: Array<{ top: number; bottom: number; left: number; right: number }> = []

  // 1. Extração de Imagens e Figuras (exibe imagens por completo)
  const mediaElements = container.querySelectorAll('img, svg, picture, figure, table, [role="img"]')
  mediaElements.forEach((el) => {
    const rect = el.getBoundingClientRect()
    if (rect.width > 12 && rect.height > 12) {
      // Garante que o elemento está visível na janela/coluna da página atual
      if (rect.right > cLeft + 4 && rect.left < cRight - 4 && rect.bottom > cTop + 2 && rect.top < cBottom - 2) {
        rawRects.push({
          top: rect.top - cTop + container.scrollTop,
          bottom: rect.bottom - cTop + container.scrollTop,
          left: rect.left - cLeft + container.scrollLeft,
          right: rect.right - cLeft + container.scrollLeft,
        })
      }
    }
  })

  // 2. Extração de Spans do PDF (.textLayer)
  const spans = container.querySelectorAll('.textLayer > span, span[role="presentation"]')
  if (spans.length > 0) {
    spans.forEach((span) => {
      const rect = span.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        if (rect.right > cLeft + 2 && rect.left < cRight - 2 && rect.bottom > cTop + 2 && rect.top < cBottom - 2) {
          rawRects.push({
            top: rect.top - cTop + container.scrollTop,
            bottom: rect.bottom - cTop + container.scrollTop,
            left: rect.left - cLeft + container.scrollLeft,
            right: rect.right - cLeft + container.scrollLeft,
          })
        }
      }
    })
  }

  // 3. Extração via Range de Nós de Texto (EPUB HTML / Reflow / Headings / Parágrafos)
  if (spans.length === 0) {
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
            // Filtro estrito: apenas retângulos pertencentes à coluna/página visível
            if (r.right > cLeft + 4 && r.left < cRight - 4 && r.bottom > cTop + 2 && r.top < cBottom - 2) {
              rawRects.push({
                top: r.top - cTop + container.scrollTop,
                bottom: r.bottom - cTop + container.scrollTop,
                left: r.left - cLeft + container.scrollLeft,
                right: r.right - cLeft + container.scrollLeft,
              })
            }
          }
        }
      } catch {
        // Ignora nós transitórios
      }
      textNode = walker.nextNode()
    }
  }

  const lines = extractLinesFromRects(rawRects, tolerance)

  // Fallback caso a página não contenha texto selecionável (ex: imagem escaneada ou capa pura)
  if (lines.length === 0 && containerRect.height > 50) {
    const defaultLineHeight = 36
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
 * Calcula os limites verticais e metadados da janela focal para o bloco de linhas solicitado,
 * garantindo espaçamento vertical confortável (padding) para não cortar descendentes de letras ou acentos.
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
  const rawTop = Math.min(...activeSlice.map((l) => l.top))
  const rawBottom = Math.max(...activeSlice.map((l) => l.bottom))

  // Margem de respiro vertical para acentuação (á, ô, É) e descendentes (g, j, p, q, y)
  const PADDING_Y = 6
  const top = Math.max(0, rawTop - PADDING_Y)
  const bottom = Math.min(containerHeight, rawBottom + PADDING_Y)
  const height = Math.max(24, bottom - top)

  return {
    top: Math.round(top),
    bottom: Math.round(bottom),
    height: Math.round(height),
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
