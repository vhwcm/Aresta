/**
 * Conta os caracteres de texto de um nó DOM ou string XHTML/HTML usando TreeWalker,
 * mantendo fidelidade estrita com o resolvedor de offsets de anotação.
 */
export function countSectionText(nodeOrHtml: Node | string): number {
  if (!nodeOrHtml) return 0

  let rootNode: Node
  if (typeof nodeOrHtml === 'string') {
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser()
      // Tenta parsear como XML primeiro (EPUB é XHTML); se falhar cai para html
      let doc = parser.parseFromString(nodeOrHtml, 'application/xhtml+xml')
      if (doc.querySelector('parsererror')) {
        doc = parser.parseFromString(nodeOrHtml, 'text/html')
      }
      rootNode = doc.body || doc.documentElement
    } else {
      return nodeOrHtml.replace(/<[^>]+>/g, '').length
    }
  } else {
    rootNode = (nodeOrHtml as any).body || nodeOrHtml
  }

  if (
    !rootNode ||
    typeof (rootNode as any).nodeType !== 'number' ||
    typeof document === 'undefined' ||
    typeof document.createTreeWalker !== 'function'
  ) {
    return ((rootNode as any)?.textContent || '').length
  }

  const walker = document.createTreeWalker(
    rootNode,
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
      }
    }
  )

  let count = 0
  let node = walker.nextNode() as Text | null
  while (node) {
    count += node.data.length
    node = walker.nextNode() as Text | null
  }

  const imgCount = (rootNode as any).querySelectorAll ? (rootNode as any).querySelectorAll('img, image, svg').length : 0
  if (count === 0 && imgCount > 0) {
    count = imgCount * 500
  }

  return Math.max(1, count)
}
