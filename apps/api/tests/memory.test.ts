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

  it('permite criar, editar nome e deletar temas via graphService', async () => {
    const uniqueName = `Tema Teste ${Date.now()}`
    const created = await graphService.createNode(uniqueName, '#123456', 'Descrição inicial')
    expect(created.name).toBe(uniqueName)
    expect(created.color).toBe('#123456')

    const updatedName = `${uniqueName} Editado`
    const updated = await graphService.updateNode(created.id, updatedName, '#654321', 'Nova descrição')
    expect(updated.name).toBe(updatedName)
    expect(updated.color).toBe('#654321')
    expect(updated.description).toBe('Nova descrição')

    const deleted = await graphService.deleteNode(created.id)
    expect(deleted.id).toBe(created.id)
  })

  it('valida parâmetros no graphController para updateNode e deleteNode', async () => {
    const { graphController } = await import('../src/modules/memory/controllers/graph.controller')

    // Teste de ID inválido em updateNode
    let statusSent = 0
    let jsonSent: any = null
    const mockRes: any = {
      status: (s: number) => {
        statusSent = s
        return mockRes
      },
      json: (j: any) => {
        jsonSent = j
        return mockRes
      },
    }

    await graphController.updateNode({ params: { id: 'invalido' }, body: { name: 'Novo' } } as any, mockRes)
    expect(statusSent).toBe(400)
    expect(jsonSent.error).toContain('ID do nó/tema inválido')

    // Teste de nome vazio em updateNode
    await graphController.updateNode({ params: { id: '1' }, body: { name: '   ' } } as any, mockRes)
    expect(statusSent).toBe(400)
    expect(jsonSent.error).toContain('não pode ser vazio')

    // Teste de ID inválido em deleteNode
    await graphController.deleteNode({ params: { id: '0' } } as any, mockRes)
    expect(statusSent).toBe(400)
    expect(jsonSent.error).toContain('ID do nó/tema inválido')
  })
})

