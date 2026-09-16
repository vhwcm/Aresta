import type { GraphEdge } from '~/interfaces/graph'
import type { GraphThemeRecord } from '~/utils/buildLocalGraph'

export const GRAPH_META_STORAGE_KEY = 'aresta_graph_meta'

export interface GraphMeta {
  themes: GraphThemeRecord[]
  edges: GraphEdge[]
}

const emptyMeta = (): GraphMeta => ({ themes: [], edges: [] })

export const loadGraphMeta = (): GraphMeta => {
  if (typeof localStorage === 'undefined') return emptyMeta()
  try {
    const raw = localStorage.getItem(GRAPH_META_STORAGE_KEY)
    if (!raw) return emptyMeta()
    const parsed = JSON.parse(raw)
    return {
      themes: Array.isArray(parsed?.themes) ? parsed.themes : [],
      edges: Array.isArray(parsed?.edges) ? parsed.edges : [],
    }
  } catch {
    return emptyMeta()
  }
}

export const saveGraphMeta = (meta: GraphMeta): void => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(GRAPH_META_STORAGE_KEY, JSON.stringify({
    themes: meta.themes || [],
    edges: meta.edges || [],
  }))
}

export const resetGraphMeta = (): void => {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(GRAPH_META_STORAGE_KEY)
}
