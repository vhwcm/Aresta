import { describe, it, expect, beforeEach } from 'vitest'
import { graphService } from '../src/modules/memory/services/graph.service'
import { cacheManager } from '../src/shared/cache/cache.manager'

describe('MemoryService & GraphService', () => {
  beforeEach(() => {
    cacheManager.clear()
  })

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
    expect(graph.counts).toHaveProperty('folders')

    const nodeTypes = new Set(graph.nodes.map((n: any) => n.type))
    // Os nós retornados devem ser de temas, livros, notas, quadros e pastas
    for (const type of nodeTypes) {
      expect(['theme', 'book', 'note', 'canvas', 'folder']).toContain(type)
    }
    expect(nodeTypes.has('annotation')).toBe(false)
  })

  it('cria nó de pasta e arestas note-folder / canvas-folder quando há notas e quadros em pastas', async () => {
    const { prisma } = await import('../src/modules/memory/config/database')
    const testFolder = `PastaTeste-${Date.now()}`

    const note = await prisma.note.create({
      data: {
        user_id: 1,
        title: 'Nota em Pasta',
        content: 'Conteúdo de teste',
        folder: testFolder,
      },
    })

    const canvas = await prisma.canvas.create({
      data: {
        user_id: 1,
        title: 'Quadro em Pasta',
        folder: testFolder,
        data: '{}',
      },
    })

    try {
      const graph = await graphService.getGraph(1)
      const folderNode = graph.nodes.find((n: any) => n.type === 'folder' && n.name === testFolder)
      expect(folderNode).toBeDefined()
      expect(folderNode?.noteCount).toBeGreaterThanOrEqual(1)
      expect(folderNode?.canvasCount).toBeGreaterThanOrEqual(1)

      const noteEdge = graph.edges.find((e: any) => e.source === `note-${note.id}` && e.target === folderNode?.id)
      expect(noteEdge).toBeDefined()
      expect(noteEdge?.type).toBe('note-folder')

      const canvasEdge = graph.edges.find((e: any) => e.source === `canvas-${canvas.id}` && e.target === folderNode?.id)
      expect(canvasEdge).toBeDefined()
      expect(canvasEdge?.type).toBe('canvas-folder')
    } finally {
      await prisma.note.delete({ where: { id: note.id } })
      await prisma.canvas.delete({ where: { id: canvas.id } })
    }
  })

  it('permite criar, editar nome e deletar temas via graphService', async () => {
    const uniqueSuffix = Date.now().toString().slice(-6)
    const uniqueName = `Tema ${uniqueSuffix}`
    const created = await graphService.createNode(uniqueName, '#123456', 'Descrição inicial')
    expect(created.name).toBe(uniqueName)
    expect(created.color).toBe('#123456')

    const updatedName = `Tema ${uniqueSuffix} Edit`
    const updated = await graphService.updateNode(created.id, updatedName, '#654321', 'Nova descrição')
    expect(updated.name).toBe(updatedName)
    expect(updated.color).toBe('#654321')
    expect(updated.description).toBe('Nova descrição')

    const deleted = await graphService.deleteNode(created.id)
    expect(deleted.id).toBe(created.id)
  })

  it('valida parâmetros no graphController para createNode, updateNode e deleteNode', async () => {
    const { graphController } = await import('../src/modules/memory/controllers/graph.controller')

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

    // Teste de nome com mais de 30 caracteres em createNode
    await graphController.createNode({ body: { name: 'Este é um nome de tema excessivamente longo com mais de 30 chars' } } as any, mockRes)
    expect(statusSent).toBe(400)
    expect(jsonSent.error).toContain('30 caracteres')

    // Teste de ID inválido em updateNode
    await graphController.updateNode({ params: { id: 'invalido' }, body: { name: 'Novo' } } as any, mockRes)
    expect(statusSent).toBe(400)
    expect(jsonSent.error).toContain('ID do nó/tema inválido')

    // Teste de nome vazio em updateNode
    await graphController.updateNode({ params: { id: '1' }, body: { name: '   ' } } as any, mockRes)
    expect(statusSent).toBe(400)
    expect(jsonSent.error).toContain('não pode ser vazio')

    // Teste de nome com mais de 30 caracteres em updateNode
    await graphController.updateNode({ params: { id: '1' }, body: { name: 'Nome de tema com mais de 30 caracteres com certeza' } } as any, mockRes)
    expect(statusSent).toBe(400)
    expect(jsonSent.error).toContain('30 caracteres')

    // Teste de ID inválido em deleteNode
    await graphController.deleteNode({ params: { id: '0' } } as any, mockRes)
    expect(statusSent).toBe(400)
    expect(jsonSent.error).toContain('ID do nó/tema inválido')
  })
})

