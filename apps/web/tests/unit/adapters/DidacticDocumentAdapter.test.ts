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

  it('2. Deve carregar documento JSON e paginar corretamente os capítulos', async () => {
    await adapter.load(mockBookletJson, 'caderno.ardoc', 18, 'newsreader')

    expect(adapter.isLoaded).toBe(true)
    expect(adapter.metadata.title).toBe('Caderno de Algoritmos & Grafos')
    expect(adapter.metadata.author).toBe('Aresta Didactic AI')
    // Capítulo 1 tem 2 seções, Capítulo 2 tem 2 seções = total 4 páginas virtuais
    expect(adapter.totalPages).toBe(4)
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

  it('5. Deve renderizar a camada de texto com Callouts, Mermaid e Âncoras de Anotação', async () => {
    await adapter.load(mockBookletJson)

    const containerP1 = document.createElement('div')
    await adapter.renderTextLayer(1, containerP1)

    expect(containerP1.innerHTML).toContain('didactic-page-wrapper')
    expect(containerP1.innerHTML).toContain('callout-analogy')
    expect(containerP1.innerHTML).toContain('Analogia Visual')
    expect(containerP1.innerHTML).toContain('didactic-heading')
    expect(containerP1.innerHTML).toContain('data-anchor="didactic://c1/p1#b1"')

    const containerP2 = document.createElement('div')
    await adapter.renderTextLayer(2, containerP2)
    expect(containerP2.innerHTML).toContain('didactic-mermaid-container')
  }, 15000)

  it('6. Deve extrair texto puro através de getTextContent', async () => {
    await adapter.load(mockBookletJson)

    const text = await adapter.getTextContent(1)
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
})
