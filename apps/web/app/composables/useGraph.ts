import { ref } from 'vue'
import type { GraphData, GraphNode, GraphEdge, BookItem, AnnotationThemeItem } from '~/interfaces/graph'
import { useAuth } from '~/composables/useAuth'
import { bookRepo } from '~/adapters/database/repositories/BookRepository'
import { getApiBase } from '~/utils/apiBase'

// Estado Compartilhado Singleton para o Grafo (SWR - 0ms de latência)
const sharedGraphData = ref<GraphData>({ nodes: [], edges: [] })
const sharedLoading = ref(false)
const sharedError = ref<string | null>(null)

export const resetGraphMemory = () => {
  sharedGraphData.value = { nodes: [], edges: [] }
  sharedLoading.value = false
  sharedError.value = null
}

export const useGraph = () => {
  const graphData = sharedGraphData
  const loading = sharedLoading
  const error = sharedError
  const auth = useAuth()

  const getHeaders = () => {
    let token: string | null = auth.token.value ?? null
    if (!token && typeof useCookie === 'function') {
      try {
        const cookieVal = useCookie<string | null | undefined>('aresta_token').value
        token = cookieVal ?? null
      } catch {
        token = null
      }
    }
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  const fetchGraph = async () => {
    if (!auth.isLoggedIn.value) {
      graphData.value = { nodes: [], edges: [] }
      loading.value = false
      return
    }

    // SWR: Apenas exibe loading se o grafo ainda não tiver nós carregados
    if (!graphData.value.nodes || graphData.value.nodes.length === 0) {
      loading.value = true
    }
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

        // Enriquecer nós de livros com capas salvas localmente
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
                }
              }
            }
          }
        } catch (repoErr) {
          console.warn('[useGraph] Falha ao sincronizar capas locais de livros no grafo:', repoErr)
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

        // Todos os temas e nós existentes permanecem ativos no grafo para conexão

        const activeNodeIds = new Set<string>()
        for (const n of nodes) {
          activeNodeIds.add(String(n.id))
          if (n.rawId !== undefined && n.rawId !== null) {
            activeNodeIds.add(String(n.rawId))
            activeNodeIds.add(`${n.type || 'theme'}-${n.rawId}`)
          }
        }

        const isNodeActive = (id: any) => {
          if (!id && id !== 0) return false
          const s = String(id)
          if (activeNodeIds.has(s)) return true
          const stripped = s.replace(/^(book-|theme-|note-|canvas-|annotation-|folder-)/, '')
          if (activeNodeIds.has(stripped)) return true
          for (const prefix of ['book-', 'theme-', 'note-', 'canvas-', 'annotation-', 'folder-']) {
            if (activeNodeIds.has(`${prefix}${stripped}`)) return true
          }
          return false
        }

        edges = edges.filter(
          (e) => isNodeActive(e.source) && isNodeActive(e.target)
        )

        // Preservar arestas recém-criadas no frontend que conectam nós válidos
        const serverEdgeKeys = new Set(
          edges.map((e) => `${String(e.source)}---${String(e.target)}`)
        )
        const currentEdges = graphData.value?.edges || []
        for (const ce of currentEdges) {
          const k1 = `${String(ce.source)}---${String(ce.target)}`
          const k2 = `${String(ce.target)}---${String(ce.source)}`
          if (!serverEdgeKeys.has(k1) && !serverEdgeKeys.has(k2) && isNodeActive(ce.source) && isNodeActive(ce.target)) {
            edges.push(ce)
          }
        }

        graphData.value = {
          nodes,
          edges,
          counts: data.counts || {
            themes: nodes.filter((n) => n.type === 'theme').length,
            books: nodes.filter((n) => n.type === 'book').length,
            annotations: nodes.filter((n) => n.type === 'annotation').length,
            notes: nodes.filter((n) => n.type === 'note').length,
            canvases: nodes.filter((n) => n.type === 'canvas').length,
            folders: nodes.filter((n) => n.type === 'folder').length,
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
      const res = await $fetch<any>(`${getApiBase()}/annotations?bookId=${bookId}`, {
        headers: getHeaders(),
      })
      const list = Array.isArray(res) ? res : (Array.isArray(res?.annotations) ? res.annotations : [])
      return list.map((item: any) => {
        let color = item.color || null
        if (!color && item.cfi && item.cfi.includes('#color=')) {
          const match = item.cfi.match(/#color=([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/)
          if (match && match[1]) {
            color = `#${match[1]}`
          }
        }
        return {
          id: Number(item.id),
          userId: item.userId ?? item.user_id ?? 0,
          bookId: Number(item.bookId ?? item.book_id ?? bookId),
          bookTitle: item.bookTitle || item.book?.title,
          bookCover: item.bookCover || item.book?.cover_path,
          cfi: item.cfi || null,
          selectedText: item.selectedText || item.selected_text || item.text || null,
          note: item.note || item.comment || null,
          color,
          chapterTitle: item.chapterTitle || item.chapter_title || null,
          progress: item.progress ?? null,
          themes: Array.isArray(item.themes)
            ? item.themes
            : (Array.isArray(item.annotationThemes) ? item.annotationThemes.map((at: any) => at.theme || at).filter(Boolean) : []),
          createdAt: item.createdAt || item.created_at || '',
        }
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
      const res = await $fetch<any>(`${getApiBase()}/annotations`, {
        method: 'POST',
        headers: getHeaders(),
        body: {
          bookId,
          note,
          themeIds,
        },
      })
      return res?.annotation || res
    } catch (e: any) {
      console.error('Erro ao criar anotação solta:', e)
      throw e
    }
  }

  const createNode = async (
    nameOrPayload: string | { name?: string; label?: string; color?: string; description?: string },
    colorParam = '#E57B55',
    descriptionParam = ''
  ) => {
    const rawName = typeof nameOrPayload === 'string'
      ? nameOrPayload
      : (nameOrPayload?.name || nameOrPayload?.label || '')
    const color = typeof nameOrPayload === 'object' && nameOrPayload.color ? nameOrPayload.color : colorParam
    const description = typeof nameOrPayload === 'object' && nameOrPayload.description ? nameOrPayload.description : descriptionParam

    const name = (rawName || '').trim()
    if (!name) {
      throw new Error('Nome do nó/tema é obrigatório')
    }
    if (name.length > 30) {
      throw new Error('O nome do tema deve ter no máximo 30 caracteres')
    }

    try {
      const newNode = await $fetch<GraphNode>(`${getApiBase()}/graph/nodes`, {
        method: 'POST',
        headers: getHeaders(),
        body: { name, color, description },
      })
      if (newNode && newNode.id !== undefined && newNode.id !== null) {
        await fetchGraph()
        return newNode
      }
      throw new Error('Resposta inválida da API ao criar nó')
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

  const updateNode = async (id: number | string, name: string, color?: string, description?: string) => {
    const trimmed = name !== undefined ? name.trim() : ''
    if (name !== undefined) {
      if (!trimmed) {
        throw new Error('Nome do tema não pode ser vazio')
      }
      if (trimmed.length > 30) {
        throw new Error('O nome do tema deve ter no máximo 30 caracteres')
      }
    }

    try {
      const updated = await $fetch<GraphNode>(`${getApiBase()}/graph/nodes/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: { name: trimmed || name, color, description },
      })
      await fetchGraph()
      return updated
    } catch (e: any) {
      console.warn('Erro ao atualizar nó na API, aplicando fallback local se possível:', e)
      const currentNodes = graphData.value?.nodes || []
      const index = currentNodes.findIndex((n) => String(n.id) === String(id))
      if (index !== -1) {
        const existing = currentNodes[index]!
        const updatedNode: GraphNode = {
          ...existing,
          name: trimmed || existing.name,
          color: color || existing.color,
          description: description !== undefined ? description : existing.description,
        }
        const newNodes = [...currentNodes]
        newNodes[index] = updatedNode
        graphData.value = {
          ...graphData.value,
          nodes: newNodes,
        }
      }
      throw e
    }
  }

  const deleteNode = async (id: number | string) => {
    try {
      await $fetch(`${getApiBase()}/graph/nodes/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      })
      await fetchGraph()
    } catch (e: any) {
      console.warn('Erro ao deletar nó na API, aplicando fallback local:', e)
      const currentNodes = graphData.value?.nodes || []
      graphData.value = {
        ...graphData.value,
        nodes: currentNodes.filter((n) => String(n.id) !== String(id)),
        edges: (graphData.value?.edges || []).filter(
          (edge) => String(edge.source) !== String(id) && String(edge.target) !== String(id)
        ),
      }
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
    resetGraph: resetGraphMemory,
  }
}
