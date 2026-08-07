import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGraph } from '~/composables/useGraph'

// Mock global fetch / $fetch
const mockFetch = vi.fn()
;(globalThis as any).$fetch = mockFetch

describe('useGraph Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchGraph carrega nós e arestas com sucesso', async () => {
    const mockGraphData = {
      nodes: [
        { id: 1, name: 'Literatura Brasileira', color: '#E57B55', books: [] }
      ],
      edges: []
    }
    mockFetch.mockResolvedValueOnce(mockGraphData)

    const { graphData, fetchGraph, loading } = useGraph()
    await fetchGraph()

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:7070/api/graph', expect.any(Object))
    expect(graphData.value.nodes.length).toBe(1)
    expect(graphData.value.nodes[0].name).toBe('Literatura Brasileira')
    expect(loading.value).toBe(false)
  })

  it('createNode envia requisição POST e atualiza o grafo', async () => {
    const mockNewNode = { id: 2, name: 'Filosofia', color: '#3B82F6', description: 'Stoicismo' }
    mockFetch.mockResolvedValueOnce(mockNewNode) // POST
    mockFetch.mockResolvedValueOnce({ nodes: [mockNewNode], edges: [] }) // GET recarregado

    const { createNode } = useGraph()
    const result = await createNode('Filosofia', '#3B82F6', 'Stoicismo')

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:7070/api/graph/nodes', expect.objectContaining({
      method: 'POST',
      body: { name: 'Filosofia', color: '#3B82F6', description: 'Stoicismo' }
    }))
    expect(result.name).toBe('Filosofia')
  })

  it('createConnection cria ligação entre dois nós', async () => {
    mockFetch.mockResolvedValueOnce({ id: 1, source: 1, target: 2 }) // POST
    mockFetch.mockResolvedValueOnce({ nodes: [], edges: [{ id: 1, source: 1, target: 2 }] }) // GET recarregado

    const { createConnection } = useGraph()
    await createConnection(1, 2)

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:7070/api/graph/connections', expect.objectContaining({
      method: 'POST',
      body: { sourceId: 1, targetId: 2 }
    }))
  })

  it('deleteNode envia requisição DELETE', async () => {
    mockFetch.mockResolvedValueOnce(undefined) // DELETE
    mockFetch.mockResolvedValueOnce({ nodes: [], edges: [] }) // GET recarregado

    const { deleteNode } = useGraph()
    await deleteNode(1)

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:7070/api/graph/nodes/1', expect.objectContaining({
      method: 'DELETE'
    }))
  })
})
