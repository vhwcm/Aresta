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

  it('identifica notas HTML e conecta com o desenho de origem via aresta note-note', () => {
    const graph = buildLocalGraph({
      drawingNotes: [{
        id: 'drawing-123',
        title: 'Meu Desenho',
        updated_at: '',
        sync_status: 'synced',
      }],
      notes: [{
        id: 'note-456',
        title: 'Rascunho Inicial: Teste',
        content: '<div class="synthesized-html-container"><h1>Teste</h1></div>',
        links: [{ targetType: 'NOTE', targetId: 'drawing-123' }],
        updated_at: '',
        sync_status: 'synced',
      }],
    })

    const htmlNode = graph.nodes.find((n) => n.id === 'note-note-456')
    expect(htmlNode).toBeDefined()
    expect(htmlNode?.isHtml).toBe(true)
    expect(htmlNode?.color).toBe('#F59E0B')

    const drawingNode = graph.nodes.find((n) => n.id === 'note-drawing-123')
    expect(drawingNode).toBeDefined()
    expect(drawingNode?.isDrawing).toBe(true)

    const connection = graph.edges.find((e) => e.type === 'note-note' && (
      (e.source === 'note-note-456' && e.target === 'note-drawing-123') ||
      (e.source === 'note-drawing-123' && e.target === 'note-note-456')
    ))
    expect(connection).toBeDefined()
  })

  it('conecta nota ao quadro (canvas) via aresta note-canvas quando há link de canvas no conteúdo markdown', () => {
    const graph = buildLocalGraph({
      canvases: [{
        id: 'canvas-789',
        name: 'Quadro de Arquitetura',
        document: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
        nodeCount: 3,
        edgeCount: 2,
        updated_at: '',
        sync_status: 'synced',
      }],
      notes: [{
        id: 'note-101',
        title: 'Nota de Especificação',
        content: 'Aqui está a especificação e o diagrama: [🎨 Quadro de Arquitetura](canvas:canvas-789)',
        updated_at: '',
        sync_status: 'synced',
      }],
    })

    const noteNode = graph.nodes.find((n) => n.id === 'note-note-101')
    expect(noteNode).toBeDefined()

    const canvasNode = graph.nodes.find((n) => n.id === 'canvas-canvas-789')
    expect(canvasNode).toBeDefined()

    const edge = graph.edges.find((e) => e.type === 'note-canvas' && (
      (e.source === 'note-note-101' && e.target === 'canvas-canvas-789') ||
      (e.source === 'canvas-canvas-789' && e.target === 'note-note-101')
    ))
    expect(edge).toBeDefined()
  })
})
