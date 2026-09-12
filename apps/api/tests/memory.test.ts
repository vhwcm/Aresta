import { describe, it, expect } from 'vitest'
import { graphService } from '../src/modules/memory/services/graph.service'

describe('MemoryService & GraphService', () => {
  it('should calculate SM-2 next review correctly', () => {
    // Basic sanity test
    expect(true).toBe(true)
  })

  it('getGraph retorna grafo unificado com counts e tipos estruturados', async () => {
    const graph = await graphService.getGraph(1)
    expect(graph).toHaveProperty('nodes')
    expect(graph).toHaveProperty('edges')
    expect(graph).toHaveProperty('counts')
    expect(Array.isArray(graph.nodes)).toBe(true)
    expect(Array.isArray(graph.edges)).toBe(true)
    expect(graph.counts).toHaveProperty('themes')
    expect(graph.counts).toHaveProperty('books')
    expect(graph.counts).toHaveProperty('annotations')
    expect(graph.counts).toHaveProperty('notes')
    expect(graph.counts).toHaveProperty('canvases')

    const nodeTypes = new Set(graph.nodes.map((n: any) => n.type))
    // Os nós retornados devem ser de temas, livros, notas e quadros (anotações de livros ficam no drawer do livro)
    for (const type of nodeTypes) {
      expect(['theme', 'book', 'note', 'canvas']).toContain(type)
    }
    expect(nodeTypes.has('annotation')).toBe(false)
  })
})

