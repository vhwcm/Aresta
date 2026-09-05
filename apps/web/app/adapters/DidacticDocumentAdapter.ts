import type { IBookDocument, BookMetadata, PageData, PageViewport } from '~/interfaces/reader/IBookDocument'
import { marked } from 'marked'

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
}

export class DidacticDocumentAdapter implements IBookDocument {
  readonly type = 'didactic' as const
  private _metadata: BookMetadata = { title: '' }
  private _isLoaded = false
  private _fontSize = 18
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
    initialFontSize = 18,
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
    this._metadata = {
      title: parsedData.title,
      author: 'Aresta Didactic AI',
      coverUrl,
    }

    this.paginate(parsedData)
    this._isLoaded = true
  }

  /**
   * Divide os capítulos em páginas virtuais equilibradas para leitura móvel
   */
  private paginate(booklet: DidacticBookletData): void {
    const pages: VirtualDidacticPage[] = []
    let pageCounter = 1

    for (const chapter of booklet.chapters) {
      // Divide o markdown por separadores horizontais '---' ou por blocos grandes
      const sections = chapter.raw_markdown.split(/\n---\n/).map((s) => s.trim()).filter(Boolean)

      if (sections.length === 0) {
        sections.push(chapter.raw_markdown)
      }

      for (let i = 0; i < sections.length; i++) {
        const raw = sections[i] || ''
        const html = this.convertMarkdownToHtml(raw, chapter.order_index, pageCounter)
        const plainText = raw.replace(/[#*`_>[\]]/g, '').trim()

        pages.push({
          pageNumber: pageCounter,
          chapterIndex: chapter.order_index,
          chapterTitle: chapter.title,
          rawContent: raw,
          htmlContent: html,
          plainText,
        })

        pageCounter++
      }
    }

    this._virtualPages = pages
  }

  /**
   * Converte Markdown para HTML rico com suporte a Callouts e Mermaid
   */
  private convertMarkdownToHtml(markdown: string, chapterIndex: number, pageNumber: number): string {
    let processed = markdown

    // Transformação de Callouts GitHub / Didáticos
    processed = processed.replace(
      />\s*\[!(ANALOGY|KEY_CONCEPT|TIP|WARNING|NOTE)\]\s*\n([\s\S]*?)(?=(?:\n\s*>\s*\[!|\n\n|$))/gi,
      (_match, type, content) => {
        const cleanContent = content.replace(/^>\s?/gm, '').trim()
        const upperType = type.toUpperCase()

        const titles: Record<string, string> = {
          ANALOGY: '💡 Analogia Visual',
          KEY_CONCEPT: '⭐ Conceito Central',
          TIP: '🚀 Dica Prática',
          WARNING: '⚠️ Cuidado & Armadilhas',
          NOTE: '📌 Nota Didática',
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
        // Fundo padrão claro/papel digital
        ctx.fillStyle = '#1A1817'
        ctx.fillRect(0, 0, renderWidth, renderHeight)

        // Cabeçalho da página virtual no canvas backing
        ctx.fillStyle = '#A8A29E'
        ctx.font = '12px sans-serif'
        if (page) {
          ctx.fillText(page.chapterTitle, 30, 30)
          ctx.fillText(`Página ${page.pageNumber} de ${this.totalPages}`, renderWidth - 120, renderHeight - 20)
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

    container.innerHTML = `
      <div class="didactic-page-wrapper font-${this._fontFamily}" style="font-size: ${this._fontSize}px;">
        <header class="didactic-page-header">
          <span class="chapter-badge">${page.chapterTitle}</span>
          <span class="page-badge">${page.pageNumber} / ${this.totalPages}</span>
        </header>
        <article class="didactic-article-body">
          ${page.htmlContent}
        </article>
      </div>
    `

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
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
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
    this._virtualPages = []
    this._bookletData = null
    this._isLoaded = false
  }
}
