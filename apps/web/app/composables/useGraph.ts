import { ref } from 'vue'
import type { GraphData, GraphNode, GraphEdge, BookItem, AnnotationThemeItem } from '~/interfaces/graph'
import { useAuth } from '~/composables/useAuth'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'

const getApiBase = () => {
  if (typeof useRuntimeConfig === 'function') {
    try {
      const config = useRuntimeConfig()
      if (config?.public?.memoryApiUrl) {
        return `${config.public.memoryApiUrl}/api`
      }
      if (config?.public?.apiUrl) {
        return `${config.public.apiUrl}/api`
      }
    } catch {
      // fallback gracioso
    }
  }
  return 'http://localhost:3001/api'
}

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
      const data = await $fetch<any>(`${getApiBase()}/graph`, {
        headers: getHeaders(),
      })
      if (data) {
        let nodes: GraphNode[] = Array.isArray(data.nodes)
          ? data.nodes
          : (data.themes || []).map((t: any) => ({
              id: t.id,
              rawId: t.id,
              type: 'theme',
              name: t.name,
              color: t.color || '#E57B55',
              description: t.description,
            }))
        let edges: GraphEdge[] = Array.isArray(data.edges) ? [...data.edges] : []

        // Enriquecer nós de livros com capas salvas localmente e adicionar possíveis conexões locais
        try {
          const localBooks = await bookRepo.getAll()
          if (localBooks && localBooks.length > 0) {
            for (const node of nodes) {
              if (node.type === 'book') {
                const found = localBooks.find((lb: any) =>
                  lb.id === node.rawId ||
                  lb.bookId === node.rawId ||
                  (lb.title && node.name && lb.title.trim().toLowerCase() === node.name.trim().toLowerCase())
                )
                if (found) {
                  if (!node.coverPath && found.coverPath) {
                    node.coverPath = found.coverPath
                  }
                  if (!node.author && found.author) {
                    node.author = found.author
                  }
                  // Se o livro tiver temas locais cadastrados, assegurar arestas locais
                  if (found.themes && Array.isArray(found.themes) && found.themes.length > 0) {
                    for (const theme of found.themes) {
                      const themeId = typeof theme === 'object' ? theme.id : theme
                      const edgeId = `edge-bt-local-${node.rawId}-${themeId}`
                      const alreadyConnected = edges.some((e: any) =>
                        (String(e.source) === String(node.id) || String(e.source) === `book-${node.rawId}`) &&
                        (String(e.target) === String(themeId) || Number(e.target) === Number(themeId))
                      )
                      if (themeId && !alreadyConnected) {
                        edges.push({
                          id: edgeId,
                          source: `book-${node.rawId}`,
                          target: themeId,
                          type: 'book-theme',
                        })
                      }
                    }
                  }
                }
              }
            }

            // Adicionar livros locais que possam não ter sido retornados pelo backend ainda
            for (const lb of localBooks) {
              const bookId = lb.bookId || lb.id
              const exists = nodes.some((n: any) => n.rawId === bookId || n.id === `book-${bookId}`)
              if (!exists && lb.title) {
                const newBookNode: GraphNode = {
                  id: `book-${bookId}`,
                  rawId: bookId,
                  type: 'book',
                  name: lb.title,
                  title: lb.title,
                  fullTitle: lb.title,
                  author: lb.author,
                  coverPath: lb.coverPath,
                  filePath: lb.filePath,
                }
                nodes.push(newBookNode)

                if (lb.themes && Array.isArray(lb.themes)) {
                  for (const theme of lb.themes) {
                    const themeId = typeof theme === 'object' ? theme.id : theme
                    if (themeId) {
                      edges.push({
                        id: `edge-bt-local-${bookId}-${themeId}`,
                        source: `book-${bookId}`,
                        target: themeId,
                        type: 'book-theme',
                      })
                    }
                  }
                }
              }
            }
          }
        } catch (repoErr) {
          console.warn('[useGraph] Falha ao sincronizar dados locais de livros no grafo:', repoErr)
        }

        // Garantir que tags/temas que não estão anexadas a nenhum livro, anotação ou nota não apareçam no grafo
        const connectedThemeIds = new Set<string>()
        for (const e of edges) {
          if (e.type === 'book-theme' || e.type === 'annotation-theme' || e.type === 'note-theme') {
            connectedThemeIds.add(String(e.source))
            connectedThemeIds.add(String(e.target))
          }
        }

        const noteConnectedThemeIds = new Set<string>()
        if (Array.isArray(data.annotations)) {
          for (const ann of data.annotations) {
            for (const at of ann.annotationThemes || []) {
              if (at.theme_id) {
                noteConnectedThemeIds.add(String(at.theme_id))
              }
            }
          }
        }

        nodes = nodes.filter((node) => {
          if (node.type !== 'theme' || node.isRoot) return true
          const idStr = String(node.id)
          const rawIdStr = String(node.rawId || '')
          const hasBook =
            Boolean(node.bookCount && node.bookCount > 0) ||
            connectedThemeIds.has(idStr) ||
            (Boolean(rawIdStr) && connectedThemeIds.has(rawIdStr))
          const hasNote =
            Boolean(node.annotationCount && node.annotationCount > 0) ||
            Boolean(node.noteCount && node.noteCount > 0) ||
            noteConnectedThemeIds.has(idStr) ||
            (Boolean(rawIdStr) && noteConnectedThemeIds.has(rawIdStr))
          return hasBook || hasNote
        })

        const activeNodeIds = new Set(nodes.map((n) => String(n.id)))
        edges = edges.filter(
          (e) => activeNodeIds.has(String(e.source)) && activeNodeIds.has(String(e.target))
        )

        graphData.value = {
          nodes,
          edges,
          counts: data.counts || {
            themes: nodes.filter((n) => n.type === 'theme').length,
            books: nodes.filter((n) => n.type === 'book').length,
            annotations: nodes.filter((n) => n.type === 'annotation').length,
            notes: nodes.filter((n) => n.type === 'note').length,
            canvases: nodes.filter((n) => n.type === 'canvas').length,
          },
        }
      }
    } catch (e: any) {
      console.error('Erro ao carregar dados do Grafo:', e)
      error.value = 'Falha ao carregar o Mapa Mental.'
    } finally {
      loading.value = false
    }
  }


  const fetchThemeBooks = async (themeId: number): Promise<BookItem[]> => {
    try {
      return await $fetch<BookItem[]>(`${getApiBase()}/graph/themes/${themeId}/books`, {
        headers: getHeaders(),
      })
    } catch (e: any) {
      console.error(`Erro ao buscar livros do tema ${themeId}:`, e)
      return []
    }
  }

  const fetchThemeAnnotations = async (themeId: number): Promise<AnnotationThemeItem[]> => {
    try {
      return await $fetch<AnnotationThemeItem[]>(`${getApiBase()}/graph/themes/${themeId}/annotations`, {
        headers: getHeaders(),
      })
    } catch (e: any) {
      console.error(`Erro ao buscar anotações do tema ${themeId}:`, e)
      return []
    }
  }

  const fetchBookAnnotations = async (bookId: number): Promise<AnnotationThemeItem[]> => {
    try {
      return await $fetch<AnnotationThemeItem[]>(`${getApiBase()}/annotations?bookId=${bookId}`, {
        headers: getHeaders(),
      })
    } catch (e: any) {
      console.error(`Erro ao buscar anotações do livro ${bookId}:`, e)
      return []
    }
  }

  const createLooseAnnotation = async (
    bookId: number,
    note: string,
    themeIds: number[] = []
  ): Promise<AnnotationThemeItem> => {
    try {
      const res = await $fetch<AnnotationThemeItem>(`${getApiBase()}/annotations`, {
        method: 'POST',
        headers: getHeaders(),
        body: {
          bookId,
          note,
          themeIds,
        },
      })
      return res
    } catch (e: any) {
      console.error('Erro ao criar anotação solta:', e)
      throw e
    }
  }

  const createNode = async (name: string, color = '#E57B55', description = '') => {
    try {
      const newNode = await $fetch<GraphNode>(`${getApiBase()}/graph/nodes`, {
        method: 'POST',
        headers: getHeaders(),
        body: { name, color, description },
      })
      await fetchGraph()
      return newNode
    } catch (e: any) {
      console.warn('Erro ao criar nó na API, aplicando fallback local:', e)
      const fallbackNode: GraphNode = {
        id: Date.now(),
        rawId: Date.now(),
        name,
        color,
        description,
        type: 'theme',
      }
      graphData.value = {
        nodes: [...(graphData.value?.nodes || []), fallbackNode],
        edges: graphData.value?.edges || [],
      }
      return fallbackNode
    }
  }

  const updateNode = async (id: number, name: string, color: string, description: string) => {
    try {
      const updated = await $fetch<GraphNode>(`${getApiBase()}/graph/nodes/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: { name, color, description },
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
      await $fetch(`${getApiBase()}/graph/nodes/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      })
      await fetchGraph()
    } catch (e: any) {
      console.error('Erro ao deletar nó:', e)
      throw e
    }
  }

  const createConnection = async (sourceId: number, targetId: number) => {
    try {
      const conn = await $fetch<GraphEdge>(`${getApiBase()}/graph/connections`, {
        method: 'POST',
        headers: getHeaders(),
        body: { sourceId, targetId },
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
      await $fetch(`${getApiBase()}/graph/connections/${sourceId}/${targetId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      })
      await fetchGraph()
    } catch (e: any) {
      console.error('Erro ao remover conexão:', e)
      throw e
    }
  }

  const linkBookToNode = async (nodeId: number, bookId: number) => {
    try {
      await $fetch(`${getApiBase()}/graph/nodes/${nodeId}/books`, {
        method: 'POST',
        headers: getHeaders(),
        body: { bookId },
      })
      await fetchGraph()
    } catch (e: any) {
      console.error('Erro ao vincular livro ao nó:', e)
      throw e
    }
  }

  const unlinkBookFromNode = async (nodeId: number, bookId: number) => {
    try {
      await $fetch(`${getApiBase()}/graph/nodes/${nodeId}/books/${bookId}`, {
        method: 'DELETE',
        headers: getHeaders(),
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
    fetchThemeBooks,
    fetchThemeAnnotations,
    fetchBookAnnotations,
    createLooseAnnotation,
    createNode,
    updateNode,
    deleteNode,
    createConnection,
    deleteConnection,
    linkBookToNode,
    unlinkBookFromNode,
  }
}
