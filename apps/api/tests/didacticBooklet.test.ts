import { describe, it, expect, vi, beforeEach } from 'vitest'
import { aiService } from '../src/modules/ai/services/ai.service'

vi.mock('../src/modules/ai/services/ai.service', () => ({
  aiService: {
    generateDidacticExplanation: vi.fn().mockResolvedValue({
      title: 'Didático: Estruturas de Dados em Árvore',
      markdown: '# Didático: Estruturas de Dados em Árvore\n\n> [!ANALOGY]\n> Analogia\n\n> [!KEY_CONCEPT]\n> Conceito\n\n```mermaid\nflowchart TD\n  A --> B\n```',
      diagramCount: 1,
    }),
  },
}))

describe('Didactic Content Generation (AI Service)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gera conteúdo pedagógico com Callouts e Mermaid via aiService', async () => {
    const result = await aiService.generateDidacticExplanation({
      topic: 'Estruturas de Dados em Árvore',
    })

    expect(result.title).toContain('Didático')
    expect(result.markdown).toContain('> [!ANALOGY]')
    expect(result.markdown).toContain('> [!KEY_CONCEPT]')
    expect(result.markdown).toContain('```mermaid')
    expect(result.diagramCount).toBeGreaterThanOrEqual(1)
  })
})
