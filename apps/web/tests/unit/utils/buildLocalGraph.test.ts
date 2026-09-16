import { describe, it, expect } from 'vitest'
import { buildLocalGraph } from '../../../app/utils/buildLocalGraph'

describe('buildLocalGraph', () => {
  it('monta nós e arestas a partir de livros, temas, notas e quadros locais', () => {
    const graph = buildLocalGraph({
      books: [{
        id: 1,
        bookId: 1,
        title: 'Contos Fluminenses',
        author: 'Machado de Assis',
        status: 'LENDO',
        currentPage: 10,
        updated_at: '',
        sync_status: 'synced',
        themes: [{ id: 7, name: 'Literatura Brasileira', color: '#E57B55' }],
      }],
      notes: [{
        id: 'n1',
        title: 'Síntese da Casa Verde',
        content: 'A razão científica como poder.',
        folder: 'Filosofia',
        tags: ['Literatura Brasileira'],
        updated_at: '',
        sync_status: 'synced',
      }],
      canvases: [{
        id: 'c1',
        name: 'Mapa do Alienista',
        document: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
        updated_at: '',
        sync_status: 'synced',
      }],
    })

    const names = graph.nodes.map((node) => node.name)
    expect(names).toContain('Literatura Brasileira')
    expect(names).toContain('Contos Fluminenses')
    expect(graph.nodes.some((node) => node.type === 'note' && node.title === 'Síntese da Casa Verde')).toBe(true)
    expect(names).toContain('Mapa do Alienista')
    expect(names).toContain('Filosofia')
    expect(graph.edges.some((edge) => edge.type === 'book-theme')).toBe(true)
    expect(graph.edges.some((edge) => edge.type === 'note-folder')).toBe(true)
    expect(graph.edges.some((edge) => edge.type === 'note-theme')).toBe(true)
  })

  it('inclui temas extras ainda sem livros para permitir conexões magnéticas', () => {
    const graph = buildLocalGraph({
      extraThemes: [{ id: 30, name: 'Tema Disponível Para Conexão', color: '#3B82F6' }],
      books: [{
        id: 1,
        bookId: 1,
        title: 'Livro Teste',
        status: 'QUERO_LER',
        currentPage: 0,
        updated_at: '',
        sync_status: 'synced',
      }],
    })

    expect(graph.nodes.map((node) => node.name)).toContain('Tema Disponível Para Conexão')
    expect(graph.nodes.map((node) => node.name)).toContain('Livro Teste')
  })
})
