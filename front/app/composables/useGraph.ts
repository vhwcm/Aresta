import { ref } from 'vue'
import type { GraphData, GraphNode, GraphEdge } from '~/interfaces/graph'
import { useAuth } from '~/composables/useAuth'

const API_BASE = 'http://localhost:7070/api'

export const useGraph = () => {
  const graphData = ref<GraphData>({ nodes: [], edges: [] })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const auth = useAuth()

  const getHeaders = () => {
    const headers: Record<string, string> = {}
    if (auth.token.value) {
      headers['Authorization'] = `Bearer ${auth.token.value}`
    }
    return headers
  }

  const fetchGraph = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<GraphData>(`${API_BASE}/graph`, {
        headers: getHeaders()
      })
      graphData.value = data
    } catch (e: any) {
      console.error('Erro ao carregar dados do Grafo:', e)
      error.value = 'Falha ao carregar o Mapa Mental.'
    } finally {
      loading.value = false
    }
  }

  const createNode = async (name: string, color = '#E57B55', description = '') => {
    try {
      const newNode = await $fetch<GraphNode>(`${API_BASE}/graph/nodes`, {
        method: 'POST',
        headers: getHeaders(),
        body: { name, color, description }
      })
      await fetchGraph()
      return newNode
    } catch (e: any) {
      console.error('Erro ao criar nó:', e)
      throw e
    }
  }

  const updateNode = async (id: number, name: string, color: string, description: string) => {
    try {
      const updated = await $fetch<GraphNode>(`${API_BASE}/graph/nodes/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: { name, color, description }
      })
      await fetchGraph()
      return updated
    } catch (e: any) {
      console.error('Erro ao atualizar nó:', e)
      throw e
    }
  }

  const deleteNode = async (id: number) => {
    try {
      await $fetch(`${API_BASE}/graph/nodes/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      await fetchGraph()
    } catch (e: any) {
      console.error('Erro ao deletar nó:', e)
      throw e
    }
  }

  const createConnection = async (sourceId: number, targetId: number) => {
    try {
      const conn = await $fetch<GraphEdge>(`${API_BASE}/graph/connections`, {
        method: 'POST',
        headers: getHeaders(),
        body: { sourceId, targetId }
      })
      await fetchGraph()
      return conn
    } catch (e: any) {
      console.error('Erro ao criar conexão:', e)
      throw e
    }
  }

  const deleteConnection = async (sourceId: number, targetId: number) => {
    try {
      await $fetch(`${API_BASE}/graph/connections/${sourceId}/${targetId}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      await fetchGraph()
    } catch (e: any) {
      console.error('Erro ao remover conexão:', e)
      throw e
    }
  }

  const linkBookToNode = async (nodeId: number, userBookId: number) => {
    try {
      await $fetch(`${API_BASE}/graph/nodes/${nodeId}/books`, {
        method: 'POST',
        headers: getHeaders(),
        body: { userBookId }
      })
      await fetchGraph()
    } catch (e: any) {
      console.error('Erro ao vincular livro ao nó:', e)
      throw e
    }
  }

  const unlinkBookFromNode = async (nodeId: number, userBookId: number) => {
    try {
      await $fetch(`${API_BASE}/graph/nodes/${nodeId}/books/${userBookId}`, {
        method: 'DELETE',
        headers: getHeaders()
      })
      await fetchGraph()
    } catch (e: any) {
      console.error('Erro ao desvincular livro do nó:', e)
      throw e
    }
  }

  return {
    graphData,
    loading,
    error,
    fetchGraph,
    createNode,
    updateNode,
    deleteNode,
    createConnection,
    deleteConnection,
    linkBookToNode,
    unlinkBookFromNode
  }
}
