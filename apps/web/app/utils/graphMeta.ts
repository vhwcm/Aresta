import type { GraphEdge } from '~/interfaces/graph'
import { getCanonicalEdgeId, getCanonicalThemeId, hashThemeNumeric } from '~/utils/themeIdentity'

export const GRAPH_META_STORAGE_KEY = 'aresta_graph_meta'

export interface GraphThemeRecord {
  id: number | string
  name: string
  color?: string | null
  description?: string | null
  updated_at?: number
  updated_by?: string
  deleted_at?: number | null
}

export interface GraphEdgeRecord {
  id: string // canonical format: min(src, tgt)---max(src, tgt)
  source: string
  target: string
  type?: string
  updated_at?: number
  updated_by?: string
  deleted_at?: number | null
}

export interface GraphMeta {
  version?: number
  themes: GraphThemeRecord[]
  edges: GraphEdgeRecord[]
  updated_at?: number
  updated_by?: string
}

const getDeviceId = (): string => {
  if (typeof localStorage === 'undefined') return 'device_server'
  let id = localStorage.getItem('aresta_client_device_id')
  if (!id) {
    id = `dev_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`
    localStorage.setItem('aresta_client_device_id', id)
  }
  return id
}

export const emptyMeta = (): GraphMeta => ({
  version: 2,
  themes: [],
  edges: [],
  updated_at: Date.now(),
  updated_by: getDeviceId(),
})

export const normalizeGraphEdge = (edge: any): GraphEdgeRecord => {
  const source = String(typeof edge.source === 'object' ? edge.source?.id : edge.source || '')
  const target = String(typeof edge.target === 'object' ? edge.target?.id : edge.target || '')
  const id = getCanonicalEdgeId(source, target)
  return {
    id,
    source,
    target,
    type: edge.type || 'theme-hierarchy',
    updated_at: typeof edge.updated_at === 'number' ? edge.updated_at : Date.now(),
    updated_by: edge.updated_by || 'local',
    deleted_at: edge.deleted_at ?? null,
  }
}

export const normalizeGraphTheme = (theme: any): GraphThemeRecord => {
  const name = (theme.name || '').trim()
  const id = theme.id !== undefined && theme.id !== null && theme.id !== ''
    ? theme.id
    : (name ? hashThemeNumeric(name) : Date.now())

  return {
    id,
    name: name || `Tag ${id}`,
    color: theme.color || '#E57B55',
    description: theme.description ?? null,
    updated_at: typeof theme.updated_at === 'number' ? theme.updated_at : Date.now(),
    updated_by: theme.updated_by || 'local',
    deleted_at: theme.deleted_at ?? null,
  }
}

export const loadGraphMeta = (): GraphMeta => {
  if (typeof localStorage === 'undefined') return emptyMeta()
  try {
    const raw = localStorage.getItem(GRAPH_META_STORAGE_KEY)
    if (!raw) return emptyMeta()
    const parsed = JSON.parse(raw)
    const rawThemes = Array.isArray(parsed?.themes) ? parsed.themes : []
    const rawEdges = Array.isArray(parsed?.edges) ? parsed.edges : []

    return {
      version: parsed?.version || 2,
      themes: rawThemes.map(normalizeGraphTheme),
      edges: rawEdges.map(normalizeGraphEdge),
      updated_at: parsed?.updated_at || Date.now(),
      updated_by: parsed?.updated_by || getDeviceId(),
    }
  } catch {
    return emptyMeta()
  }
}

export const saveGraphMeta = (meta: GraphMeta): void => {
  if (typeof localStorage === 'undefined') return
  const currentDeviceId = getDeviceId()
  const normalized: GraphMeta = {
    version: 2,
    themes: (meta.themes || []).map((t) => ({
      ...normalizeGraphTheme(t),
      updated_at: t.updated_at || Date.now(),
      updated_by: t.updated_by || currentDeviceId,
    })),
    edges: (meta.edges || []).map((e) => ({
      ...normalizeGraphEdge(e),
      updated_at: e.updated_at || Date.now(),
      updated_by: e.updated_by || currentDeviceId,
    })),
    updated_at: Date.now(),
    updated_by: currentDeviceId,
  }

  localStorage.setItem(GRAPH_META_STORAGE_KEY, JSON.stringify(normalized))

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aresta:graph-meta-updated', { detail: normalized }))
  }
}

export const resetGraphMeta = (): void => {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(GRAPH_META_STORAGE_KEY)
}
