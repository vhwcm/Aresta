import { describe, expect, it, beforeEach } from 'vitest'
import {
  getCanonicalThemeId,
  getCanonicalEdgeId,
  normalizeThemeName,
  hashThemeName,
  hashThemeNumeric,
  parseNodeId,
} from '~/utils/themeIdentity'
import {
  loadGraphMeta,
  saveGraphMeta,
  resetGraphMeta,
  normalizeGraphEdge,
  normalizeGraphTheme,
} from '~/utils/graphMeta'

describe('ThemeIdentity & GraphMeta v2 (CRDT Support)', () => {
  beforeEach(() => {
    resetGraphMeta()
  })

  it('1. Gera hash determinístico e ID canônico convergente para o mesmo nome de tema', () => {
    const id1 = getCanonicalThemeId('Filosofia')
    const id2 = getCanonicalThemeId('  filosofia  ')
    const id3 = getCanonicalThemeId('FILOSOFIA')

    expect(id1).toBe(id2)
    expect(id1).toBe(id3)
    expect(id1.startsWith('theme-')).toBe(true)

    const numHash1 = hashThemeNumeric('Tecnologia')
    const numHash2 = hashThemeNumeric('tecnologia')
    expect(numHash1).toBe(numHash2)
    expect(numHash1).toBeGreaterThan(0)
  })

  it('2. Gera IDs canônicos simétricos para arestas ordenando os nós lexicograficamente', () => {
    const edgeKey1 = getCanonicalEdgeId('note-1', 'theme-abc')
    const edgeKey2 = getCanonicalEdgeId('theme-abc', 'note-1')
    expect(edgeKey1).toBe(edgeKey2)
    expect(edgeKey1).toBe('note-1---theme-abc')
  })

  it('3. Extrai tipo e rawId com parseNodeId', () => {
    expect(parseNodeId('book-101')).toEqual({ type: 'book', rawId: '101', canonicalId: 'book-101' })
    expect(parseNodeId('theme-filo')).toEqual({ type: 'theme', rawId: 'filo', canonicalId: 'theme-filo' })
    expect(parseNodeId('note-abc-123')).toEqual({ type: 'note', rawId: 'abc-123', canonicalId: 'note-abc-123' })
    expect(parseNodeId('123')).toEqual({ type: 'unknown', rawId: '123', canonicalId: '123' })
  })

  it('4. Carrega e salva GraphMeta com timestamps e migração de schema', () => {
    saveGraphMeta({
      themes: [{ id: 1, name: 'História' }],
      edges: [{ id: '1---2', source: 'theme-1', target: 'book-2', type: 'theme-hierarchy' } as any],
    })

    const meta = loadGraphMeta()
    expect(meta.version).toBe(2)
    expect(meta.themes.length).toBe(1)
    expect(meta.themes[0]?.name).toBe('História')
    expect(meta.themes[0]?.updated_at).toBeDefined()
    expect(meta.themes[0]?.deleted_at).toBeNull()

    expect(meta.edges.length).toBe(1)
    expect(meta.edges[0]?.id).toBe('book-2---theme-1')
    expect(meta.edges[0]?.updated_at).toBeDefined()
    expect(meta.edges[0]?.deleted_at).toBeNull()
  })
})
