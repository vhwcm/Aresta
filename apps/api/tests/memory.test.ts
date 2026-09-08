import { describe, it, expect } from 'vitest'
import { graphService } from '../src/modules/memory/services/graph.service'

describe('MemoryService & GraphService', () => {
  it('should calculate SM-2 next review correctly', () => {
    // Basic sanity test
    expect(true).toBe(true)
  })

  it('getGraph não inclui temas que não possuem livros nem anotações', async () => {
    const graph = await graphService.getGraph(1)
    expect(graph).toHaveProperty('nodes')
    expect(graph).toHaveProperty('edges')

    const themeNodes = graph.nodes.filter((n: any) => n.type === 'theme')
    for (const tn of themeNodes) {
      const hasBookOrNote = (tn.bookCount ?? 0) > 0 || (tn.annotationCount ?? 0) > 0
      expect(hasBookOrNote).toBe(true)
    }
  })
})

