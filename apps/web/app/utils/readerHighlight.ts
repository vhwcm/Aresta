import type { AnnotationItem } from '~/composables/useAnnotations'

export interface TextChunk {
  node: Text
  start: number
  end: number
}

const BLOCK_TAGS = new Set([
  'p', 'div', 'article', 'section', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'li', 'blockquote', 'header', 'footer', 'tr', 'td', 'th', 'br'
])

function isBlockElement(el: HTMLElement | null): boolean {
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  return BLOCK_TAGS.has(tag)
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Converte cor HEX (#RGB ou #RRGGBB) para rgba(r, g, b, alpha) com transparência suave
 */
export function hexToRgba(hex: string | null | undefined, alpha = 0.38): string {
  if (!hex || typeof hex !== 'string') return `rgba(229, 123, 85, ${alpha})`
  const trimmed = hex.trim()
  if (trimmed.startsWith('rgb')) {
    return trimmed
  }
  const cleanHex = trimmed.replace('#', '')
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0]! + cleanHex[0]!, 16)
    const g = parseInt(cleanHex[1]! + cleanHex[1]!, 16)
    const b = parseInt(cleanHex[2]! + cleanHex[2]!, 16)
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.slice(0, 2), 16)
    const g = parseInt(cleanHex.slice(2, 4), 16)
    const b = parseInt(cleanHex.slice(4, 6), 16)
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
  }
  return `rgba(229, 123, 85, ${alpha})`
}

/**
 * Extrai o número da página a partir dos metadados da anotação (cfi ou chapterTitle)
 */
export function getAnnotationPageNumber(item: AnnotationItem): number | null {
  if (item.cfi && item.cfi.startsWith('page:')) {
    const parsed = parseInt(item.cfi.replace('page:', ''), 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  if (item.chapterTitle) {
    const match = item.chapterTitle.match(/P[áa]gina\s+(\d+)/i)
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10)
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
  }
  return null
}

/**
 * Extrai todos os nós de texto visíveis dentro de um container,
 * inserindo separadores virtuais entre blocos para permitir busca contínua multilinhas/parágrafos.
 */
export function getVisibleTextChunks(container: HTMLElement): { chunks: TextChunk[]; fullText: string } {
  const chunks: TextChunk[] = []
  let fullText = ''

  if (typeof document === 'undefined' || !container) {
    return { chunks, fullText }
  }

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT
        const tag = parent.tagName.toLowerCase()
        if (tag === 'script' || tag === 'style' || tag === 'noscript') {
          return NodeFilter.FILTER_REJECT
        }
        return NodeFilter.FILTER_ACCEPT
      },
    },
  )

  let currentNode = walker.nextNode() as Text | null
  let lastParent: HTMLElement | null = null

  while (currentNode) {
    const parent = currentNode.parentElement
    if (lastParent && parent && lastParent !== parent) {
      const isBlock = isBlockElement(lastParent) || isBlockElement(parent)
      if (isBlock && !fullText.endsWith(' ') && !currentNode.data.startsWith(' ')) {
        fullText += ' '
      }
    }

    const start = fullText.length
    fullText += currentNode.data
    const end = fullText.length

    chunks.push({
      node: currentNode,
      start,
      end,
    })

    lastParent = parent
    currentNode = walker.nextNode() as Text | null
  }

  return { chunks, fullText }
}

/**
 * Remove todos os elementos mark.reader-highlight de um container e une nós de texto adjacentes.
 */
export function clearPageHighlights(container: HTMLElement | null): void {
  if (!container) return
  const marks = Array.from(container.querySelectorAll('mark.reader-highlight'))
  for (const mark of marks) {
    const parent = mark.parentNode
    if (!parent) continue
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark)
    }
    parent.removeChild(mark)
  }
  container.normalize()
}

/**
 * Aplica um destaque no texto do container para a anotação fornecida.
 */
export function applyAnnotationHighlight(
  container: HTMLElement | null,
  annotation: AnnotationItem,
): boolean {
  if (!container || !annotation.selectedText) return false
  const searchText = annotation.selectedText.trim()
  if (!searchText) return false

  const { chunks, fullText } = getVisibleTextChunks(container)
  if (!fullText || chunks.length === 0) return false

  const words = searchText.split(/\s+/).filter(Boolean).map(escapeRegExp)
  if (words.length === 0) return false

  const pattern = words.join('[\\s\\u00A0\\n\\r]+')
  let regex: RegExp
  try {
    regex = new RegExp(pattern, 'i')
  } catch {
    return false
  }

  const match = regex.exec(fullText)
  if (!match) return false

  const matchStart = match.index
  const matchEnd = match.index + match[0].length

  const intersectingChunks = chunks.filter(
    (c) => c.end > matchStart && c.start < matchEnd,
  )

  if (intersectingChunks.length === 0) return false

  const color = annotation.color || '#E57B55'
  const bgColor = hexToRgba(color, 0.38)

  // Itera em ordem reversa (do fim para o início) para que os splits não desloquem nós anteriores
  for (let i = intersectingChunks.length - 1; i >= 0; i--) {
    const chunk = intersectingChunks[i]!
    const localStart = Math.max(0, matchStart - chunk.start)
    const localEnd = Math.min(chunk.node.length, matchEnd - chunk.start)

    if (localStart >= localEnd) continue

    let targetNode: Text = chunk.node
    if (localEnd < targetNode.length) {
      targetNode.splitText(localEnd)
    }
    if (localStart > 0) {
      targetNode = targetNode.splitText(localStart)
    }

    const mark = document.createElement('mark')
    mark.className = 'reader-highlight'
    mark.setAttribute('data-annotation-id', String(annotation.id))
    mark.style.backgroundColor = bgColor
    mark.style.borderBottom = `2px solid ${color}`
    mark.style.color = 'inherit'
    mark.style.cursor = 'pointer'
    mark.style.padding = '0.05em 0.15em'
    mark.style.margin = '0 -0.05em'
    mark.style.borderRadius = '2px'
    mark.style.boxDecorationBreak = 'clone'
    ;(mark.style as any).webkitBoxDecorationBreak = 'clone'
    mark.style.pointerEvents = 'auto'

    if (annotation.note) {
      mark.title = annotation.note
    }

    targetNode.parentNode?.insertBefore(mark, targetNode)
    mark.appendChild(targetNode)
  }

  return true
}

/**
 * Limpa e aplica os destaques de todas as anotações pertencentes a uma página específica.
 */
export function applyPageHighlights(
  container: HTMLElement | null,
  pageNumber: number,
  annotations: AnnotationItem[],
  bookId?: number | null,
): number {
  if (!container || !annotations || annotations.length === 0) return 0

  clearPageHighlights(container)

  const relevantAnnotations = annotations.filter((a) => {
    if (bookId && a.bookId && Number(a.bookId) !== Number(bookId)) return false
    if (!a.selectedText || !a.selectedText.trim()) return false

    const p = getAnnotationPageNumber(a)
    if (p !== null) {
      return p === pageNumber
    }
    return true
  })

  let appliedCount = 0
  for (const annotation of relevantAnnotations) {
    const success = applyAnnotationHighlight(container, annotation)
    if (success) {
      appliedCount++
    }
  }

  return appliedCount
}
