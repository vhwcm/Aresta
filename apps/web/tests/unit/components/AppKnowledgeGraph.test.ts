import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import AppKnowledgeGraph from '../../../app/components/graph/AppKnowledgeGraph.vue'

const mockGraphData = ref({
  nodes: [
    {
      id: 'theme-1',
      rawId: 1,
      type: 'theme',
      name: 'Programação',
    },
    {
      id: 'book-10',
      rawId: 10,
      type: 'book',
      name: 'Clean Code',
      fullTitle: 'Clean Code',
      author: 'Robert C. Martin',
      summary: 'Boas práticas de código limpo.',
    },
  ],
  edges: [
    { id: 'edge-1', source: 'theme-1', target: 'book-10', type: 'book-theme' },
    { id: 'edge-2', source: 'note-101', target: 'theme-1', type: 'note-theme' },
    { id: 'edge-3', source: 'canvas-201', target: 'theme-1', type: 'canvas-theme' },
    { id: 'edge-4', source: 'link-301', target: 'theme-1', type: 'link-theme' },
  ],
})

const mockUserBooks = ref([
  {
    userBookId: 10,
    bookId: 10,
    title: 'Clean Code',
    author: 'Robert C. Martin',
    status: 'LENDO',
    currentPage: 50,
    themes: [{ id: 1, name: 'Programação' }],
  },
])

const mockNotes = ref([
  {
    id: '101',
    title: 'Arquitetura Limpa e SOLID',
    content: 'Princípios de design de software em TypeScript.',
    tags: ['Programação'],
    folder: 'Tech',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
  {
    id: '102',
    title: 'Receita de Bolo',
    content: 'Farinha e ovos.',
    tags: ['Culinária'],
    folder: 'Pessoal',
    created_at: '2026-01-01T00:00:00Z',
  },
])

const mockDrawings = ref([
  {
    id: 'draw-1',
    title: 'Diagrama de Microsserviços',
    tags: ['Programação'],
    folder: 'Tech',
    created_at: '2026-01-01T00:00:00Z',
  },
])

const mockCanvases = ref([
  {
    id: 'canvas-201',
    name: 'Quadro de Arquitetura',
    description: 'Mapeamento visual do sistema',
    tags: ['Programação'],
    nodeCount: 15,
  },
])

const mockLinks = ref([
  {
    id: 'link-301',
    title: 'Documentação Oficial Vue.js',
    url: 'https://vuejs.org',
    domain: 'vuejs.org',
    tags: ['Programação'],
  },
])

const mockAnnotations = ref([
  {
    id: 501,
    bookId: 10,
    bookTitle: 'Clean Code',
    chapterTitle: 'Capítulo 2: Nomes Significativos',
    selectedText: 'O nome de uma variável, função ou classe deve responder a todas as grandes questões.',
    note: 'Princípio fundamental de legibilidade.',
    color: '#E57B55',
    cfi: 'epubcfi(/6/14[chapter-2]!/4/2/10/1:0)',
    themes: [{ id: 1, name: 'Programação' }],
    created_at: '2026-01-01T00:00:00Z',
  },
])

const mockFlashcards = ref([
  {
    id: 1,
    question: 'O que é SRP no SOLID?',
    answer: 'Single Responsibility Principle: uma classe deve ter um único motivo para mudar.',
    noteId: '101',
    bookId: 10,
    sourceTitle: 'Arquitetura Limpa e SOLID',
    sourceUrl: '/canvas?tab=notes&noteId=101',
    repetitionLevel: 2,
    nextReviewAt: '2026-10-05T00:00:00Z',
  },
  {
    id: 2,
    question: 'Qual a temperatura ideal do forno?',
    answer: '180 graus Celsius.',
    noteId: '102',
    sourceTitle: 'Receita de Bolo',
    repetitionLevel: 1,
    nextReviewAt: '2026-10-03T00:00:00Z',
  },
])

const mockReviewFlashcard = vi.fn().mockResolvedValue({})
const mockSaveNote = vi.fn().mockResolvedValue({})

vi.mock('~/composables/useGraph', () => ({
  useGraph: () => ({
    graphData: mockGraphData,
    loading: ref(false),
    fetchGraph: vi.fn(),
    createNode: vi.fn(),
    updateNode: vi.fn(),
    deleteNode: vi.fn(),
    createConnection: vi.fn(),
    linkBookToNode: vi.fn(),
    unlinkEdge: vi.fn(),
  }),
}))

vi.mock('~/composables/useUserBooks', () => ({
  useUserBooks: () => ({
    userBooks: mockUserBooks,
    fetchUserBooks: vi.fn(),
  }),
}))

vi.mock('~/composables/useFlashcards', () => ({
  useFlashcards: () => ({
    reviewFlashcard: mockReviewFlashcard,
  }),
}))

vi.mock('~/composables/useWorkspaceSidebar', () => ({
  useWorkspaceSidebar: () => ({
    activeTag: ref(null),
    graphSearchQuery: ref(''),
  }),
}))

vi.mock('~/adapters/database/repositories/NoteRepository', () => ({
  noteRepo: {
    getAll: vi.fn().mockImplementation(() => Promise.resolve(mockNotes.value)),
    save: (...args: any[]) => mockSaveNote(...args),
  },
}))

vi.mock('~/adapters/database/repositories/DrawingNoteRepository', () => ({
  drawingNoteRepo: {
    getAll: vi.fn().mockImplementation(() => Promise.resolve(mockDrawings.value)),
  },
}))

vi.mock('~/adapters/database/repositories/CanvasRepository', () => ({
  canvasRepo: {
    getAll: vi.fn().mockImplementation(() => Promise.resolve(mockCanvases.value)),
  },
}))

vi.mock('~/adapters/database/repositories/LinkRepository', () => ({
  linkRepo: {
    getAll: vi.fn().mockImplementation(() => Promise.resolve(mockLinks.value)),
  },
}))

vi.mock('~/adapters/database/repositories/AnnotationRepository', () => ({
  annotationRepo: {
    getAll: vi.fn().mockImplementation(() => Promise.resolve(mockAnnotations.value)),
  },
}))

vi.mock('~/adapters/database/repositories/FlashcardRepository', () => ({
  flashcardRepo: {
    getAll: vi.fn().mockImplementation(() => Promise.resolve(mockFlashcards.value)),
  },
}))

describe('AppKnowledgeGraph Component - Detalhe do Tema & Abas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ao clicar em um tema, exibe as 3 abas superiores (Anotações, Tudo, Flashcards) e ativa a aba Anotações inicialmente', async () => {
    const wrapper = mount(AppKnowledgeGraph, {
      global: {
        stubs: {
          GraphCanvas: {
            template: '<div data-testid="graph-canvas"><button data-testid="click-theme" @click="$emit(\'selectNode\', themeNode)">Tema</button></div>',
            data() {
              return {
                themeNode: {
                  id: 'theme-1',
                  rawId: 1,
                  type: 'theme',
                  name: 'Programação',
                },
              }
            },
          },
          BookAnnotationsDrawer: true,
          NoteDetailDrawer: true,
          CreateNodeModal: true,
          ConnectNodesModal: true,
          NuxtLink: true,
        },
      },
    })

    // Clica no tema
    await wrapper.find('[data-testid="click-theme"]').trigger('click')
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Programação')
    })

    // As três abas devem estar presentes no topo
    expect(wrapper.find('[data-testid="theme-tab-annotations"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="theme-tab-all"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="theme-tab-flashcards"]').exists()).toBe(true)

    // Inicialmente mostra a aba de Anotações ativada
    expect(wrapper.find('[data-testid="theme-tab-annotations"]').classes()).toContain('bg-accent')
    expect(wrapper.find('[data-testid="theme-tab-annotations"]').text()).toContain('Anotações')

    // Deve exibir o trecho e nota do leitor vinculados ao tema/livro
    expect(wrapper.text()).toContain('Clean Code')
    expect(wrapper.text()).toContain('O nome de uma variável, função ou classe deve responder a todas as grandes questões.')
    expect(wrapper.text()).toContain('Princípio fundamental de legibilidade.')
    // Não exibe notas de outros temas
    expect(wrapper.text()).not.toContain('Receita de Bolo')
  })

  it('permite alternar para a aba Tudo e exibe todos os recursos (livros, notas, quadros, links)', async () => {
    const wrapper = mount(AppKnowledgeGraph, {
      global: {
        stubs: {
          GraphCanvas: {
            template: '<div data-testid="graph-canvas"><button data-testid="click-theme" @click="$emit(\'selectNode\', themeNode)">Tema</button></div>',
            data() {
              return {
                themeNode: {
                  id: 'theme-1',
                  rawId: 1,
                  type: 'theme',
                  name: 'Programação',
                },
              }
            },
          },
          BookAnnotationsDrawer: true,
          NoteDetailDrawer: true,
          CreateNodeModal: true,
          ConnectNodesModal: true,
          NuxtLink: true,
        },
      },
    })

    await wrapper.find('[data-testid="click-theme"]').trigger('click')
    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="theme-tab-all"]').exists()).toBe(true)
    })

    // Clica na aba Tudo
    await wrapper.find('[data-testid="theme-tab-all"]').trigger('click')

    // Deve exibir o livro, a nota, o quadro e o link
    expect(wrapper.text()).toContain('Clean Code')
    expect(wrapper.text()).toContain('Arquitetura Limpa e SOLID')
    expect(wrapper.text()).toContain('Quadro de Arquitetura')
    expect(wrapper.text()).toContain('Documentação Oficial Vue.js')
  })

  it('permite alternar para a aba Flashcards e exibe apenas flashcards daquele tema com suporte a flip 3D e avaliação SRS', async () => {
    const wrapper = mount(AppKnowledgeGraph, {
      global: {
        stubs: {
          GraphCanvas: {
            template: '<div data-testid="graph-canvas"><button data-testid="click-theme" @click="$emit(\'selectNode\', themeNode)">Tema</button></div>',
            data() {
              return {
                themeNode: {
                  id: 'theme-1',
                  rawId: 1,
                  type: 'theme',
                  name: 'Programação',
                },
              }
            },
          },
          BookAnnotationsDrawer: true,
          NoteDetailDrawer: true,
          CreateNodeModal: true,
          ConnectNodesModal: true,
          NuxtLink: true,
        },
      },
    })

    await wrapper.find('[data-testid="click-theme"]').trigger('click')
    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="theme-tab-flashcards"]').exists()).toBe(true)
    })

    // Clica na aba Flashcards
    await wrapper.find('[data-testid="theme-tab-flashcards"]').trigger('click')

    // Deve exibir o card de Programação (SRP no SOLID) e NÃO o de Culinária (temperatura do forno)
    expect(wrapper.text()).toContain('O que é SRP no SOLID?')
    expect(wrapper.text()).not.toContain('Qual a temperatura ideal do forno?')

    // Clica no card para virar (3D Flip)
    const cardScene = wrapper.find('.card-scene')
    expect(cardScene.exists()).toBe(true)
    await cardScene.trigger('click')

    // Card virado deve exibir a resposta e os botões SRS
    expect(wrapper.text()).toContain('Single Responsibility Principle')
    const easyBtn = wrapper.findAll('button').find((b) => b.text().includes('Fácil (7 dias)'))
    expect(easyBtn).toBeDefined()

    // Clica em Fácil
    await easyBtn?.trigger('click')
    expect(mockReviewFlashcard).toHaveBeenCalledWith(1, 'easy')
  })

  it('permite criar nova nota contextualizada diretamente no tema através do botão "+ Nova Nota"', async () => {
    const navigateToMock = (globalThis as any).navigateTo as any
    navigateToMock.mockClear()

    const wrapper = mount(AppKnowledgeGraph, {
      global: {
        stubs: {
          GraphCanvas: {
            template: '<div data-testid="graph-canvas"><button data-testid="click-theme" @click="$emit(\'selectNode\', themeNode)">Tema</button></div>',
            data() {
              return {
                themeNode: {
                  id: 'theme-1',
                  rawId: 1,
                  type: 'theme',
                  name: 'Programação',
                },
              }
            },
          },
          BookAnnotationsDrawer: true,
          NoteDetailDrawer: true,
          CreateNodeModal: true,
          ConnectNodesModal: true,
          NuxtLink: true,
        },
      },
    })

    await wrapper.find('[data-testid="click-theme"]').trigger('click')
    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="theme-tab-all"]').exists()).toBe(true)
    })

    // Alterna para a aba Tudo onde a ação de criação de nota é disponibilizada
    await wrapper.find('[data-testid="theme-tab-all"]').trigger('click')
    await vi.waitFor(() => {
      expect(wrapper.find('[data-testid="create-note-in-theme-btn"]').exists()).toBe(true)
    })

    // Clica em Nova Nota
    await wrapper.find('[data-testid="create-note-in-theme-btn"]').trigger('click')

    await vi.waitFor(() => {
      expect(mockSaveNote).toHaveBeenCalledWith(expect.objectContaining({
        tags: ['Programação'],
        title: 'Nota sobre Programação',
      }))
      expect(navigateToMock).toHaveBeenCalledWith(expect.stringContaining('/canvas?id=note-'))
    })
  })
})
