import type { IBookDocument, BookMetadata, PageData, PageViewport } from '~/interfaces/reader/IBookDocument'
import { marked } from 'marked'
import renderMathInElement from 'katex/contrib/auto-render'
import { ArestaInteractiveRuntime } from '~/utils/reader/ArestaInteractiveRuntime'
import { generateDidacticCoverDataUri } from '~/utils/cover'

export interface DidacticChapterData {
  id?: string
  order_index: number
  title: string
  topic?: string
  raw_markdown: string
}

export interface DidacticBookletData {
  id?: string
  title: string
  description?: string
  chapters: DidacticChapterData[]
}

interface VirtualDidacticPage {
  pageNumber: number
  chapterIndex: number
  chapterTitle: string
  rawContent: string
  htmlContent: string
  plainText: string
  layout?: string
}

export class DidacticDocumentAdapter implements IBookDocument {
  readonly type = 'didactic' as const
  private _metadata: BookMetadata = { title: '' }
  private _isLoaded = false
  private _fontSize = 15
  private _fontFamily = 'newsreader'
  private _bookletData: DidacticBookletData | null = null
  private _virtualPages: VirtualDidacticPage[] = []

  get metadata(): BookMetadata {
    return this._metadata
  }

  get totalPages(): number {
    return Math.max(1, this._virtualPages.length)
  }

  get isLoaded(): boolean {
    return this._isLoaded
  }

  get fontSize(): number {
    return this._fontSize
  }

  get fontFamily(): string {
    return this._fontFamily
  }

  setFontSize(fontSize: number, currentPage = 1): number {
    this._fontSize = fontSize
    if (this._bookletData) {
      this.paginate(this._bookletData)
    }
    return Math.min(currentPage, this.totalPages)
  }

  setFontFamily(fontFamily: string, currentPage = 1): number {
    this._fontFamily = fontFamily
    return Math.min(currentPage, this.totalPages)
  }

  async load(
    source: File | ArrayBuffer | string,
    fileName?: string,
    initialFontSize = 15,
    initialFontFamily = 'newsreader',
    coverUrl?: string
  ): Promise<void> {
    this._fontSize = initialFontSize
    this._fontFamily = initialFontFamily

    let rawString = ''

    if (typeof source === 'string') {
      rawString = source
    } else if (source instanceof File) {
      rawString = await source.text()
    } else if (source instanceof ArrayBuffer) {
      const decoder = new TextDecoder('utf-8')
      rawString = decoder.decode(source)
    }

    let parsedData: DidacticBookletData

    try {
      const json = JSON.parse(rawString)
      if (json.chapters && Array.isArray(json.chapters)) {
        parsedData = json
      } else if (json.booklet && json.booklet.chapters) {
        parsedData = json.booklet
      } else {
        parsedData = {
          title: json.title || fileName || 'Livreto Didático',
          chapters: [
            {
              order_index: 1,
              title: json.title || 'Capítulo 1',
              raw_markdown: json.raw_markdown || json.content || rawString,
            },
          ],
        }
      }
    } catch {
      // Se não for JSON, trata a string como Markdown puro
      parsedData = {
        title: fileName?.replace(/\.(ardoc|md|json)$/i, '') || 'Livreto Didático',
        chapters: [
          {
            order_index: 1,
            title: 'Capítulo 1',
            raw_markdown: rawString,
          },
        ],
      }
    }

    this._bookletData = parsedData
    const resolvedCoverUrl = coverUrl || generateDidacticCoverDataUri({
      title: parsedData.title,
      topic: parsedData.chapters[0]?.topic,
    })
    this._metadata = {
      title: parsedData.title,
      author: 'Aresta Didactic AI',
      coverUrl: resolvedCoverUrl,
    }

    this.paginate(parsedData)
    this._isLoaded = true
  }

  private _runtimeCleanup: (() => void) | null = null

  /**
   * Divide os capítulos em páginas virtuais equilibradas para leitura móvel
   */
  private paginate(booklet: DidacticBookletData): void {
    const pages: VirtualDidacticPage[] = []

    const coverUrl = this._metadata.coverUrl || generateDidacticCoverDataUri({
      title: booklet.title,
      topic: booklet.chapters[0]?.topic,
    })

    // Página 1: Capa do livreto (idêntica à capa exibida na estante)
    pages.push({
      pageNumber: 1,
      chapterIndex: 0,
      chapterTitle: 'Capa',
      rawContent: `<section class="didactic-page didactic-cover-page" data-page="1" data-title="Capa"><img src="${coverUrl}" alt="${booklet.title}" /></section>`,
      htmlContent: `
        <section class="didactic-page didactic-cover-page" data-page="1" data-title="Capa">
          <div class="didactic-cover-container">
            <img src="${coverUrl}" alt="${booklet.title}" class="didactic-cover-img" />
          </div>
        </section>
      `,
      plainText: `${booklet.title} - Livreto Didático - Capa`,
    })

    let pageCounter = 2

    for (const chapter of booklet.chapters) {
      const rawContent = chapter.raw_markdown || ''
      const pageSectionsMatch = rawContent.match(/<section class="didactic-page"[\s\S]*?<\/section>/gi)

      let sections: string[] = []
      let isNativeHtml = false

      if (pageSectionsMatch && pageSectionsMatch.length > 0) {
        sections = pageSectionsMatch
        isNativeHtml = true
      } else {
        const rawSplits = rawContent.split(/\n---\n/).map((s) => s.trim()).filter(Boolean)
        const initialSections = rawSplits.length > 0 ? rawSplits : [rawContent]
        sections = []
        for (const sec of initialSections) {
          // Particionamento preventivo para garantir páginas estritas sem estouro de altura
          if (sec.length > 1100 && sec.includes('\n\n')) {
            const paragraphs = sec.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
            let currentChunk = ''
            for (const p of paragraphs) {
              if (currentChunk && currentChunk.length + p.length > 850) {
                sections.push(currentChunk)
                currentChunk = p
              } else {
                currentChunk = currentChunk ? `${currentChunk}\n\n${p}` : p
              }
            }
            if (currentChunk) sections.push(currentChunk)
          } else {
            sections.push(sec)
          }
        }
      }

      for (let i = 0; i < sections.length; i++) {
        const raw = sections[i] || ''
        if (raw.includes('didactic-cover-page')) {
          continue
        }
        let html: string
        let plainText: string
        let pageTitle = chapter.title
        let layout: string | undefined

        if (isNativeHtml) {
          html = raw
          const layoutMatch = raw.match(/data-layout="([^"]+)"/i)
          if (layoutMatch && layoutMatch[1]) {
            layout = layoutMatch[1].trim()
          }
          const titleMatch = raw.match(/data-title="([^"]+)"/i) || raw.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/i)
          if (titleMatch && titleMatch[1]) {
            pageTitle = titleMatch[1].trim()
          }
          plainText = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        } else {
          html = this.convertMarkdownToHtml(raw, chapter.order_index, pageCounter)
          plainText = raw.replace(/[#*`_>[\]]/g, '').trim()
        }

        pages.push({
          pageNumber: pageCounter,
          chapterIndex: chapter.order_index,
          chapterTitle: pageTitle,
          rawContent: raw,
          htmlContent: html,
          plainText,
          layout,
        })

        pageCounter++
      }
    }

    this._virtualPages = pages
  }

  /**
   * Converte Markdown para HTML rico com suporte a Callouts, Fórmulas Matemáticas e Mermaid
   */
  private convertMarkdownToHtml(markdown: string, chapterIndex: number, pageNumber: number): string {
    let processed = markdown

    // Protege expressões matemáticas inline ($...$, \(...\)) e de bloco ($$...$$, \[...\]) antes de processar com marked
    const mathTokens: string[] = []
    processed = processed.replace(
      /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$(?!\s)[^$\n]+(?<!\s)\$|\\\([\s\S]*?\\\))/g,
      (match) => {
        mathTokens.push(match)
        return `%%ARESTA_MATH_${mathTokens.length - 1}%%`
      }
    )

    // Transformação de Callouts GitHub / Didáticos (sem emojis)
    processed = processed.replace(
      />\s*\[!(ANALOGY|KEY_CONCEPT|TIP|WARNING|NOTE)\]\s*\n([\s\S]*?)(?=(?:\n\s*>\s*\[!|\n\n|$))/gi,
      (_match, type, content) => {
        const cleanContent = content.replace(/^>\s?/gm, '').trim()
        const upperType = type.toUpperCase()

        const titles: Record<string, string> = {
          ANALOGY: 'Analogia Visual',
          KEY_CONCEPT: 'Conceito Central',
          TIP: 'Dica Prática',
          WARNING: 'Cuidado & Armadilhas',
          NOTE: 'Nota Didática',
        }

        const typeClasses: Record<string, string> = {
          ANALOGY: 'callout-analogy',
          KEY_CONCEPT: 'callout-key-concept',
          TIP: 'callout-tip',
          WARNING: 'callout-warning',
          NOTE: 'callout-note',
        }

        return `<div class="didactic-callout ${typeClasses[upperType] || 'callout-note'}">
          <div class="callout-header">${titles[upperType] || 'Nota'}</div>
          <div class="callout-body">${cleanContent}</div>
        </div>\n\n`
      }
    )

    // Renderiza blocos markdown
    let html = (marked.parse(processed) as string) || ''

    // Restaura as expressões matemáticas protegidas
    html = html.replace(/%%ARESTA_MATH_(\d+)%%/g, (_m, idx) => {
      return mathTokens[parseInt(idx, 10)] || ''
    })

    // Transforma blocos ```mermaid em contêineres <div class="mermaid">
    html = html.replace(
      /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/gi,
      (_match, code) => {
        const decoded = code
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .trim()
        return `<div class="didactic-mermaid-container"><div class="mermaid" data-diagram-id="mermaid-p${pageNumber}">${decoded}</div></div>`
      }
    )

    // Envolve parágrafos e títulos com data-anchor para rastreamento preciso de anotações
    let blockIndex = 0
    html = html.replace(/<(p|h1|h2|h3|h4)>([\s\S]*?)<\/\1>/gi, (_match, tag, inner) => {
      blockIndex++
      const anchor = `didactic://c${chapterIndex}/p${pageNumber}#b${blockIndex}`
      const isPara = tag.toLowerCase() === 'p'
      const className = isPara ? 'didactic-paragraph' : 'didactic-heading'
      return `<${tag} class="${className}" data-anchor="${anchor}">${inner}</${tag}>`
    })

    return html
  }

  async getPage(pageNumber: number, targetWidth = 800, targetHeight = 1100): Promise<PageData> {
    const pageIndex = Math.max(0, Math.min(pageNumber - 1, this._virtualPages.length - 1))
    const page = this._virtualPages[pageIndex]

    const width = targetWidth
    const height = targetHeight
    const aspectRatio = width / Math.max(1, height)

    return {
      width,
      height,
      aspectRatio,
      render: async (ctx: CanvasRenderingContext2D, viewport?: PageViewport) => {
        const renderWidth = viewport ? viewport.width : width
        const renderHeight = viewport ? viewport.height : height

        ctx.save()
        if (typeof ctx.clearRect === 'function') {
          ctx.clearRect(0, 0, renderWidth, renderHeight)
        } else if (typeof ctx.fillRect === 'function') {
          ctx.fillRect(0, 0, renderWidth, renderHeight)
        }
        ctx.restore()
      },
    }
  }

  async getTextContent(pageNumber: number): Promise<string> {
    const pageIndex = Math.max(0, Math.min(pageNumber - 1, this._virtualPages.length - 1))
    const page = this._virtualPages[pageIndex]
    return page?.plainText || ''
  }

  async renderTextLayer(pageNumber: number, container: HTMLElement): Promise<void> {
    const pageIndex = Math.max(0, Math.min(pageNumber - 1, this._virtualPages.length - 1))
    const page = this._virtualPages[pageIndex]
    if (!page || !container) return

    if (page.chapterTitle === 'Capa' || page.htmlContent.includes('didactic-cover-page')) {
      container.innerHTML = `
        <div class="didactic-page-wrapper didactic-cover-wrapper font-${this._fontFamily}">
          ${page.htmlContent}
        </div>
      `
      return
    }

    const layoutClass = page.layout ? `layout-${page.layout}` : ''

    container.innerHTML = `
      <div class="didactic-page-wrapper font-${this._fontFamily} ${layoutClass}" style="font-size: ${this._fontSize}px; overflow: hidden !important;">
        <header class="didactic-page-header">
          <span class="chapter-badge" title="${page.chapterTitle}">${page.chapterTitle}</span>
          <span class="page-badge">${page.pageNumber} / ${this.totalPages}</span>
        </header>
        <article class="didactic-article-body">
          ${page.htmlContent}
        </article>
      </div>
    `

    // Renderiza fórmulas matemáticas e equações LaTeX via KaTeX
    try {
      if (typeof document !== 'undefined' && document.compatMode !== 'CSS1Compat') {
        try {
          Object.defineProperty(document, 'compatMode', {
            value: 'CSS1Compat',
            configurable: true,
            writable: true,
          })
        } catch {}
      }

      renderMathInElement(container, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\begin{equation}', right: '\\end{equation}', display: true },
          { left: '\\begin{align}', right: '\\end{align}', display: true },
          { left: '\\begin{alignat}', right: '\\end{alignat}', display: true },
          { left: '\\begin{gather}', right: '\\end{gather}', display: true },
          { left: '\\begin{CD}', right: '\\end{CD}', display: true },
        ],
        throwOnError: false,
        errorColor: '#f97316',
      })
    } catch (mathErr) {
      console.warn('[DidacticDocumentAdapter] Aviso KaTeX:', mathErr)
    }

    // Executa e registra o runtime de componentes interativos (Flashcards 3D, Steppers, Subtemas)
    if (this._runtimeCleanup) {
      this._runtimeCleanup()
      this._runtimeCleanup = null
    }
    this._runtimeCleanup = ArestaInteractiveRuntime.mount(container, {
      bookTitle: this._metadata.title,
      pageNumber: page.pageNumber,
    })

    // Renderiza Mermaid se disponível no escopo do navegador real (com suporte completo a SVG)
    if (
      typeof window !== 'undefined' &&
      typeof (window as any).SVGGraphicsElement !== 'undefined' &&
      !process.env.VITEST &&
      !(window as any).__VITEST__ &&
      typeof (window as any).requestAnimationFrame === 'function'
    ) {
      try {
        const mermaid = (await import('mermaid')).default
        const isDarkTheme =
          document.documentElement.getAttribute('data-theme') === 'dark' ||
          container.closest('.theme-black') !== null ||
          container.closest('.reader-viewer--theme-black') !== null ||
          (!container.closest('.theme-sepia') && !container.closest('.theme-white') && !document.documentElement.getAttribute('data-theme'))

        mermaid.initialize({
          startOnLoad: false,
          theme: isDarkTheme ? 'dark' : 'neutral',
          securityLevel: 'loose',
        })
        const mermaidNodes = container.querySelectorAll('.mermaid')
        if (mermaidNodes.length > 0) {
          await mermaid.run({ nodes: mermaidNodes as any }).catch((e: any) => {
            console.warn('[DidacticDocumentAdapter] Aviso Mermaid:', e)
          })
        }
      } catch (err) {
        console.warn('[DidacticDocumentAdapter] Não foi possível carregar módulo Mermaid:', err)
      }
    }
  }

  destroy(): void {
    if (this._runtimeCleanup) {
      this._runtimeCleanup()
      this._runtimeCleanup = null
    }
    this._virtualPages = []
    this._bookletData = null
    this._isLoaded = false
  }
}
