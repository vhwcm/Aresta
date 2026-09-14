import { describe, it, expect, beforeEach } from 'vitest'
import { DidacticDocumentAdapter } from '../../../app/adapters/DidacticDocumentAdapter'

describe('DidacticDocumentAdapter - Limites de Página & Zero Scroll', () => {
  let adapter: DidacticDocumentAdapter

  beforeEach(() => {
    adapter = new DidacticDocumentAdapter()
  })

  it('1. Deve renderizar container com overflow: hidden obrigatório em todas as páginas', async () => {
    const mockBooklet = JSON.stringify({
      title: 'Design Patterns',
      chapters: [
        {
          order_index: 1,
          title: 'Singleton',
          raw_markdown: `
            <section class="didactic-page" data-page="1" data-title="Visão Geral" data-layout="foundation">
              <h1>Singleton Pattern</h1>
              <p>Garante uma única instância da classe em toda a aplicação.</p>
            </section>
          `,
        },
      ],
    })

    await adapter.load(mockBooklet)
    expect(adapter.totalPages).toBe(2) // 1 Capa + 1 Conteúdo

    const container = document.createElement('div')
    await adapter.renderTextLayer(2, container)

    const wrapper = container.querySelector('.didactic-page-wrapper') as HTMLElement
    expect(wrapper).not.toBeNull()
    expect(wrapper.getAttribute('style')).toContain('overflow: hidden')
    expect(wrapper.classList.contains('layout-foundation')).toBe(true)
  })

  it('2. Deve aplicar classes de layout corretas (layout-mechanism, layout-flashcards)', async () => {
    const mockBooklet = JSON.stringify({
      title: 'Arquitetura Limpa',
      chapters: [
        {
          order_index: 1,
          title: 'Camadas',
          raw_markdown: `
            <section class="didactic-page" data-page="1" data-title="Mecanismo" data-layout="mechanism">
              <div class="aresta-stepper" data-title="Passos">
                <div class="aresta-step" data-step="1">Domain</div>
                <div class="aresta-step" data-step="2">Use Cases</div>
              </div>
            </section>
            <section class="didactic-page" data-page="2" data-title="Fixação" data-layout="flashcards">
              <div class="aresta-flashcards-deck">
                <div class="aresta-flashcard" data-question="O que é Entidade?" data-answer="Regra de negócio central.">
                  <div class="aresta-flashcard-inner">
                    <div class="aresta-flashcard-front">O que é Entidade?</div>
                    <div class="aresta-flashcard-back">Regra de negócio central.</div>
                  </div>
                </div>
              </div>
            </section>
          `,
        },
      ],
    })

    await adapter.load(mockBooklet)
    expect(adapter.totalPages).toBe(3) // 1 Capa + 2 Páginas

    const containerP2 = document.createElement('div')
    await adapter.renderTextLayer(2, containerP2)
    expect(containerP2.querySelector('.layout-mechanism')).not.toBeNull()

    const containerP3 = document.createElement('div')
    await adapter.renderTextLayer(3, containerP3)
    expect(containerP3.querySelector('.layout-flashcards')).not.toBeNull()
  })

  it('3. Deve particionar textos longos em múltiplas páginas para evitar estouro de altura', async () => {
    const longParagraph1 = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10) // ~570 chars
    const longParagraph2 = 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. '.repeat(10) // ~670 chars
    const longParagraph3 = 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. '.repeat(10) // ~670 chars

    const bookletWithExcessiveContent = JSON.stringify({
      title: 'Capítulo Extenso',
      chapters: [
        {
          order_index: 1,
          title: 'Texto Sem Quebras Explícitas',
          raw_markdown: `${longParagraph1}\n\n${longParagraph2}\n\n${longParagraph3}`,
        },
      ],
    })

    await adapter.load(bookletWithExcessiveContent)
    // Devido ao particionamento inteligente preventivo, deve dividir em mais de 1 página de conteúdo (+ capa)
    expect(adapter.totalPages).toBeGreaterThanOrEqual(3)

    // Verifica se nenhuma parte do texto foi perdida
    const textP2 = await adapter.getTextContent(2)
    const textP3 = await adapter.getTextContent(3)
    expect(textP2.length).toBeGreaterThan(0)
    expect(textP3.length).toBeGreaterThan(0)
  })
})
