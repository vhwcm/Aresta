import type { GraphNode, GraphEdge, GraphData } from '~/interfaces/graph'

export const sampleLandingNodes: GraphNode[] = [
  // Raiz Central
  {
    id: 'root-landing',
    rawId: 'root',
    type: 'theme',
    name: 'Aresta',
    title: 'Aresta',
    isRoot: true,
    color: '#E57B55',
    description: 'Segundo cérebro e santuário de leitura profunda'
  },
  // Temas Principais
  {
    id: 'theme-1',
    rawId: 1,
    type: 'theme',
    name: 'Neurociência & Memória',
    title: 'Neurociência & Memória',
    color: '#E57B55',
    emoji: '🧠',
    description: 'Estudo da retenção mnemônica, curva do esquecimento e plasticidade sináptica',
    bookCount: 2,
    noteCount: 3
  },
  {
    id: 'theme-2',
    rawId: 2,
    type: 'theme',
    name: 'Modelos Mentais',
    title: 'Modelos Mentais',
    color: '#3B82F6',
    emoji: '🧭',
    description: 'Estruturas conceituais para tomada de decisão e raciocínio analítico',
    bookCount: 2,
    noteCount: 2
  },
  {
    id: 'theme-3',
    rawId: 3,
    type: 'theme',
    name: 'Literatura & Filosofia',
    title: 'Literatura & Filosofia',
    color: '#10B981',
    emoji: '🏛️',
    description: 'Obras seminais sobre a condição humana, dilemas éticos e psicologia clássica',
    bookCount: 2,
    noteCount: 1
  },
  {
    id: 'theme-4',
    rawId: 4,
    type: 'theme',
    name: 'Leitura Ativa & Sintópica',
    title: 'Leitura Ativa & Sintópica',
    color: '#8B5CF6',
    emoji: '📖',
    description: 'Metodologias de extração, diálogo entre textos e construção de sínteses',
    bookCount: 1,
    noteCount: 2
  },

  // Livros
  {
    id: 'book-1',
    rawId: 101,
    type: 'book',
    name: 'O Alienista',
    title: 'O Alienista',
    fullTitle: 'O Alienista - Machado de Assis',
    author: 'Machado de Assis',
    summary: 'Estudo clássico sobre a razão humana, limites do método científico e loucura na Casa Verde.',
    coverPath: null,
    color: '#10B981'
  },
  {
    id: 'book-2',
    rawId: 102,
    type: 'book',
    name: 'Rápido e Devagar',
    title: 'Rápido e Devagar',
    fullTitle: 'Rápido e Devagar: Duas Formas de Pensar',
    author: 'Daniel Kahneman',
    summary: 'A dualidade entre o Sistema 1 (intuitivo e veloz) e o Sistema 2 (analítico e deliberado).',
    coverPath: null,
    color: '#3B82F6'
  },
  {
    id: 'book-3',
    rawId: 103,
    type: 'book',
    name: 'A Arte da Memória',
    title: 'A Arte da Memória',
    fullTitle: 'A Arte da Memória e Palácios Mentais',
    author: 'Frances Yates',
    summary: 'Técnicas mnemônicas da antiguidade clássica e associação espacial de ideias.',
    coverPath: null,
    color: '#E57B55'
  },
  {
    id: 'book-4',
    rawId: 104,
    type: 'book',
    name: 'Como Ler Livros',
    title: 'Como Ler Livros',
    fullTitle: 'Como Ler Livros: O Guia Clássico para a Leitura Inteligente',
    author: 'Mortimer Adler',
    summary: 'Os quatro níveis de leitura: elementar, inspecional, analítica e sintópica.',
    coverPath: null,
    color: '#8B5CF6'
  },

  // Notas / Sínteses
  {
    id: 'note-1',
    rawId: 201,
    type: 'note',
    name: 'Curva de Ebbinghaus e Repetição Espaçada',
    title: 'Curva de Ebbinghaus e Repetição Espaçada',
    folder: 'Neurociência',
    tags: ['Memória', 'Flashcards', 'Retenção'],
    color: '#E57B55',
    summary: 'Sem reforço ativo, 70% das informações são esquecidas em 24 horas. Intervalos calculados fixam sinapses.'
  },
  {
    id: 'note-2',
    rawId: 202,
    type: 'note',
    name: 'Heurísticas de Disponibilidade vs Fatos',
    title: 'Heurísticas de Disponibilidade vs Fatos',
    folder: 'Decisão',
    tags: ['Sistema 1', 'Viés Cognitivo'],
    color: '#3B82F6',
    summary: 'Julgamos a probabilidade de um evento pela facilidade com que exemplos vêm à nossa mente.'
  },
  {
    id: 'note-3',
    rawId: 203,
    type: 'note',
    name: 'Diálogo Sintópico Entre Obras',
    title: 'Diálogo Sintópico Entre Obras',
    folder: 'Metodologia',
    tags: ['Leitura', 'Síntese'],
    color: '#8B5CF6',
    summary: 'Cruzar teses de autores divergentes sobre a mesma questão para gerar novos insights autorais.'
  },

  // Quadro Espacial / Canvas
  {
    id: 'canvas-1',
    rawId: 301,
    type: 'canvas',
    name: 'Quadro: Arquitetura Cognitiva',
    title: 'Quadro: Arquitetura Cognitiva',
    folder: 'Canvas',
    tags: ['Visual', 'Diagramas'],
    color: '#10B981',
    summary: 'Mapa visual conectando teorias de retenção com mapas conceituais e notas ativas.'
  }
]

export const sampleLandingEdges: GraphEdge[] = [
  // Conexões com o Centro
  { id: 'e-root-1', source: 'root-landing', target: 'theme-1', type: 'root' },
  { id: 'e-root-2', source: 'root-landing', target: 'theme-2', type: 'root' },
  { id: 'e-root-3', source: 'root-landing', target: 'theme-3', type: 'root' },
  { id: 'e-root-4', source: 'root-landing', target: 'theme-4', type: 'root' },

  // Livros com seus Temas
  { id: 'e-b1-t3', source: 'theme-3', target: 'book-1', type: 'book-theme' },
  { id: 'e-b2-t2', source: 'theme-2', target: 'book-2', type: 'book-theme' },
  { id: 'e-b3-t1', source: 'theme-1', target: 'book-3', type: 'book-theme' },
  { id: 'e-b4-t4', source: 'theme-4', target: 'book-4', type: 'book-theme' },

  // Conexões Cruzadas entre Temas e Livros
  { id: 'e-b2-t1', source: 'theme-1', target: 'book-2', type: 'book-theme' },
  { id: 'e-b1-t2', source: 'theme-2', target: 'book-1', type: 'book-theme' },

  // Notas com Temas e Livros
  { id: 'e-n1-t1', source: 'theme-1', target: 'note-1', type: 'note-theme' },
  { id: 'e-n1-b3', source: 'book-3', target: 'note-1', type: 'note-book' },
  { id: 'e-n2-t2', source: 'theme-2', target: 'note-2', type: 'note-theme' },
  { id: 'e-n2-b2', source: 'book-2', target: 'note-2', type: 'note-book' },
  { id: 'e-n3-t4', source: 'theme-4', target: 'note-3', type: 'note-theme' },
  { id: 'e-n3-b4', source: 'book-4', target: 'note-3', type: 'note-book' },

  // Canvas conectado
  { id: 'e-c1-t1', source: 'theme-1', target: 'canvas-1', type: 'note-canvas' },
  { id: 'e-c1-t2', source: 'theme-2', target: 'canvas-1', type: 'note-canvas' }
]

export const sampleLandingGraphData: GraphData = {
  nodes: sampleLandingNodes,
  edges: sampleLandingEdges,
  counts: {
    themes: 4,
    books: 4,
    annotations: 0,
    notes: 3,
    canvases: 1,
    folders: 3
  }
}
