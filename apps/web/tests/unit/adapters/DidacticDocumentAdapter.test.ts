import { describe, it, expect, beforeEach } from 'vitest'
import { createBookDocument } from '../../../app/adapters/BookDocumentFactory'
import { DidacticDocumentAdapter } from '../../../app/adapters/DidacticDocumentAdapter'

describe('DidacticDocumentAdapter & Strategy Pattern (aresta-reader/front)', () => {
  let adapter: DidacticDocumentAdapter

  const mockBookletJson = JSON.stringify({
    title: 'Caderno de Algoritmos & Grafos',
    chapters: [
      {
        order_index: 1,
        title: 'Capítulo 1: Árvores Binárias de Busca',
        raw_markdown: `# Árvores Binárias de Busca

> [!ANALOGY]
> Pense em uma árvore binária como uma árvore genealógica ordenada por idade.

---

## O Mecanismo

\`\`\`mermaid
flowchart TD
    Root((50)) --> Left((30))
    Root --> Right((70))
\`\`\`

> [!KEY_CONCEPT]
> O valor à esquerda é sempre menor e à direita é sempre maior.`,
      },
      {
        order_index: 2,
        title: 'Capítulo 2: Grafos e Ciclos',
        raw_markdown: `# Grafos e Ciclos

> [!TIP]
> Use DFS para detectar ciclos direcionados.

---

## Conclusão e Fixação

> [!WARNING]
> Cuidado com grafos desconexos!`,
      },
    ],
  })

  beforeEach(() => {
    adapter = new DidacticDocumentAdapter()
  })

  it('1. Deve ser instanciado corretamente via BookDocumentFactory', () => {
    const doc = createBookDocument('didactic')
    expect(doc).toBeInstanceOf(DidacticDocumentAdapter)
    expect(doc.type).toBe('didactic')
    expect(doc.isLoaded).toBe(false)
  })

  it('2. Deve carregar documento JSON e paginar corretamente a capa como página 1 e os capítulos a seguir', async () => {
    await adapter.load(mockBookletJson, 'caderno.ardoc', 18, 'newsreader')

    expect(adapter.isLoaded).toBe(true)
    expect(adapter.metadata.title).toBe('Caderno de Algoritmos & Grafos')
    expect(adapter.metadata.author).toBe('Aresta Didactic AI')
    expect(adapter.metadata.coverUrl).toBeDefined()
    // 1 página de Capa + 2 seções cap 1 + 2 seções cap 2 = total 5 páginas virtuais
    expect(adapter.totalPages).toBe(5)
  })

  it('3. Deve suportar alteração de tamanho e família de fonte com repaginação', async () => {
    await adapter.load(mockBookletJson)

    adapter.setFontSize(22, 2)
    expect(adapter.fontSize).toBe(22)

    adapter.setFontFamily('inter', 2)
    expect(adapter.fontFamily).toBe('inter')
  })

  it('4. Deve gerar PageData e renderizar no Canvas sem erros', async () => {
    await adapter.load(mockBookletJson)

    const pageData = await adapter.getPage(1, 800, 1200)
    expect(pageData.width).toBe(800)
    expect(pageData.height).toBe(1200)
    expect(pageData.aspectRatio).toBeCloseTo(800 / 1200)

    const mockCtx = {
      save: () => {},
      restore: () => {},
      fillRect: () => {},
      fillText: () => {},
      fillStyle: '',
      font: '',
    } as unknown as CanvasRenderingContext2D

    await expect(pageData.render(mockCtx)).resolves.not.toThrow()
  })

  it('5. Deve renderizar a capa na página 1 e a camada de texto com Callouts e Mermaid nas páginas seguintes', async () => {
    await adapter.load(mockBookletJson)

    // Página 1: Capa do livreto
    const containerP1 = document.createElement('div')
    await adapter.renderTextLayer(1, containerP1)
    expect(containerP1.innerHTML).toContain('didactic-cover-wrapper')
    expect(containerP1.innerHTML).toContain('didactic-cover-img')

    // Página 2: Primeira página de conteúdo (Callout de analogia)
    const containerP2 = document.createElement('div')
    await adapter.renderTextLayer(2, containerP2)
    expect(containerP2.innerHTML).toContain('didactic-page-wrapper')
    expect(containerP2.innerHTML).toContain('callout-analogy')
    expect(containerP2.innerHTML).toContain('Analogia Visual')
    expect(containerP2.innerHTML).toContain('didactic-heading')
    expect(containerP2.innerHTML).toContain('data-anchor="didactic://c1/p2#b1"')

    // Página 3: Segunda página de conteúdo (Mermaid)
    const containerP3 = document.createElement('div')
    await adapter.renderTextLayer(3, containerP3)
    expect(containerP3.innerHTML).toContain('didactic-mermaid-container')
  }, 15000)

  it('6. Deve extrair texto puro através de getTextContent na capa e no conteúdo', async () => {
    await adapter.load(mockBookletJson)

    const coverText = await adapter.getTextContent(1)
    expect(coverText).toContain('Caderno de Algoritmos & Grafos')
    expect(coverText).toContain('Capa')

    const text = await adapter.getTextContent(2)
    expect(text).toContain('Árvores Binárias de Busca')
    expect(text).toContain('genealógica')
  })

  it('7. Deve limpar recursos no destroy', async () => {
    await adapter.load(mockBookletJson)
    expect(adapter.isLoaded).toBe(true)

    adapter.destroy()
    expect(adapter.isLoaded).toBe(false)
    expect(adapter.totalPages).toBe(1)
  })

  it('8. Deve carregar e paginar seções HTML nativas com capa e flashcards interativos', async () => {
    const nativeHtmlBooklet = JSON.stringify({
      title: 'Livro HTML Nativo',
      chapters: [
        {
          order_index: 1,
          title: 'Capítulo HTML',
          raw_markdown: `
            <section class="didactic-page" data-page="1" data-title="Introdução">
              <h1>Introdução aos Sistemas</h1>
              <p>Texto inicial.</p>
            </section>
            <section class="didactic-page" data-page="2" data-title="Passos do Algoritmo">
              <div class="aresta-stepper" data-title="Fluxo">
                <div class="aresta-step" data-step="1">Etapa A</div>
                <div class="aresta-step" data-step="2">Etapa B</div>
              </div>
            </section>
            <section class="didactic-page" data-page="3" data-title="Flashcards">
              <div class="aresta-flashcard" data-question="O que é X?" data-answer="X é Y">
                <div class="aresta-flashcard-inner">
                  <div class="aresta-flashcard-front">O que é X?</div>
                  <div class="aresta-flashcard-back">X é Y</div>
                </div>
                <button type="button" class="aresta-btn-add-deck">Adicionar ao meu Deck</button>
              </div>
            </section>
          `,
        },
      ],
    })

    await adapter.load(nativeHtmlBooklet)
    // 1 Capa + 3 seções nativas = 4 páginas
    expect(adapter.totalPages).toBe(4)

    // Página 1: Capa
    const containerP1 = document.createElement('div')
    await adapter.renderTextLayer(1, containerP1)
    expect(containerP1.innerHTML).toContain('didactic-cover-wrapper')

    // Página 4: Flashcard
    const containerP4 = document.createElement('div')
    await adapter.renderTextLayer(4, containerP4)
    expect(containerP4.innerHTML).toContain('aresta-flashcard')

    // Testa se o runtime montou o listener de clique para flip
    const cardEl = containerP4.querySelector('.aresta-flashcard') as HTMLElement
    expect(cardEl).not.toBeNull()
    cardEl.click()
    expect(cardEl.classList.contains('is-flipped')).toBe(true)
  })

  it('9. Deve renderizar fórmulas matemáticas inline ($A \\rightarrow B$) e de bloco em HTML gerado pelo KaTeX', async () => {
    const mathBooklet = JSON.stringify({
      title: 'Livro de Grafos e Complexidade',
      chapters: [
        {
          order_index: 1,
          title: 'Grafos Dirigidos e Complexidade',
          raw_markdown: `
            <section class="didactic-page" data-page="1" data-title="Grafos e Fluxo">
              <h1>Grafos Dirigidos vs. Não-Dirigidos</h1>
              <p>Define se a conexão possui um fluxo unidirecional ($A \\rightarrow B$) ou bidirecional ($A \\leftrightarrow B$).</p>
              <p>A complexidade de tempo é dada por $\\mathcal{O}(V + E)$.</p>
            </section>
          `,
        },
      ],
    })

    await adapter.load(mathBooklet)
    // 1 Capa + 1 Seção = 2 páginas
    expect(adapter.totalPages).toBe(2)

    const containerP2 = document.createElement('div')
    await adapter.renderTextLayer(2, containerP2)

    // Verifica que KaTeX renderizou as expressões matemáticas e não deixou texto bruto ($A \rightarrow B$)
    expect(containerP2.innerHTML).toContain('katex')
    expect(containerP2.innerHTML).toContain('katex-html')
    expect(containerP2.querySelectorAll('.katex').length).toBeGreaterThanOrEqual(2)
  })

  it('10. Deve proteger fórmulas LaTeX em Markdown com subscritos (_1) para evitar que o parser corrompa o texto', async () => {
    const markdownMathBooklet = JSON.stringify({
      title: 'Equações em Markdown',
      chapters: [
        {
          order_index: 1,
          title: 'Equações',
          raw_markdown: `# Fórmulas

A fórmula de distância é $d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$.

$$E = mc^2$$`,
        },
      ],
    })

    await adapter.load(markdownMathBooklet)
    const containerP2 = document.createElement('div')
    await adapter.renderTextLayer(2, containerP2)

    expect(containerP2.innerHTML).toContain('katex')
    expect(containerP2.querySelectorAll('.katex').length).toBeGreaterThanOrEqual(2)
  })
})
