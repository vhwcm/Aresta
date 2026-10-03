/**
 * Utilitários canônicos e determinísticos de identidade para Temas, Vínculos e Arestas do Grafo.
 * Garante convergência idêntica entre múltiplos dispositivos (Local-First).
 */

export function normalizeThemeName(name: string): string {
  if (!name) return ''
  return name.trim().toLowerCase().normalize('NFC')
}

export function hashThemeName(name: string): string {
  const norm = normalizeThemeName(name)
  if (!norm) return '0'
  let hash = 2166136261 // FNV-1a 32-bit offset basis
  for (let i = 0; i < norm.length; i++) {
    hash ^= norm.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0).toString(36)
}

export function hashThemeNumeric(name: string): number {
  const norm = normalizeThemeName(name)
  if (!norm) return 0
  let hash = 2166136261
  for (let i = 0; i < norm.length; i++) {
    hash ^= norm.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  const unsigned = hash >>> 0
  return unsigned === 0 ? 1 : unsigned
}

export function getCanonicalThemeId(nameOrId: string | number): string {
  const raw = String(nameOrId ?? '').trim()
  if (!raw) return 'theme-0'
  
  if (raw.startsWith('theme-')) {
    const withoutPrefix = raw.slice(6)
    // Se for hash ou numérico direto, mantém o prefixo
    return `theme-${withoutPrefix}`
  }
  
  const hash = hashThemeName(raw)
  return `theme-${hash}`
}

export function getCanonicalEdgeId(source: string | number, target: string | number): string {
  const s = String(source ?? '').trim()
  const t = String(target ?? '').trim()
  const [a, b] = [s, t].sort()
  return `${a}---${b}`
}

export type NodeType = 'book' | 'theme' | 'annotation' | 'note' | 'canvas' | 'link' | 'folder' | 'unknown'

export interface ParsedNodeId {
  type: NodeType
  rawId: string
  canonicalId: string
}

export function parseNodeId(nodeId: string | number): ParsedNodeId {
  const str = String(nodeId ?? '').trim()
  const match = str.match(/^(book|theme|annotation|note|canvas|link|folder)-(.*)$/)
  if (match && match[1] && match[2]) {
    const type = match[1] as NodeType
    const rawId = match[2]
    return {
      type,
      rawId,
      canonicalId: str,
    }
  }

  // Fallback por tipo numérico ou nome
  return {
    type: 'unknown',
    rawId: str,
    canonicalId: str,
  }
}
