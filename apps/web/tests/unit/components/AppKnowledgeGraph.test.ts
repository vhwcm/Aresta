import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import AppKnowledgeGraph from '../../../app/components/graph/AppKnowledgeGraph.vue'

const mockGraphData = ref({
  nodes: [
    {
      id: 'theme-42',
      rawId: 42,
      type: 'theme',
      name: 'Filosofia',
      color: '#E57B55',
    },
    {
      id: 'book-100',
      rawId: 100,
      type: 'book',
      name: 'Meditações',
      fullTitle: 'Meditações',
      author: 'Marco Aurélio',
    },
  ],
  edges: [
    { id: 'edge-1', source: 'theme-42', target: 'book-100', type: 'book-theme' },
  ],
})

const mockUserBooks = ref([
  {
    userBookId: 100,
    bookId: 100,
    title: 'Meditações',
    author: 'Marco Aurélio',
    status: 'LENDO',
    currentPage: 25,
    themes: [{ id: 42, name: 'Filosofia' }],
  },
])

vi.mock('~/composables/useGraph', () => ({
  useGraph: () => ({
    graphData: mockGraphData,
    loading: ref(false),
    fetchGraph: vi.fn(),
    createNode: vi.fn(),
    createConnection: vi.fn(),
    linkBookToNode: vi.fn(),
  }),
}))

vi.mock('~/composables/useUserBooks', () => ({
  useUserBooks: () => ({
    userBooks: mockUserBooks,
    fetchUserBooks: vi.fn(),
  }),
}))

vi.mock('~/composables/useWorkspaceSidebar', () => ({
  useWorkspaceSidebar: () => ({
    activeTag: ref(null),
    graphSearchQuery: ref(''),
  }),
}))

describe('AppKnowledgeGraph Component', () => {
  it('ao selecionar um nó de tema que não possui .books embutido, resolve os livros conectados de userBooks e exibe na UI', async () => {
    const wrapper = mount(AppKnowledgeGraph, {
      global: {
        stubs: {
          GraphCanvas: {
            template: '<div data-testid="graph-canvas"><button data-testid="select-theme" @click="$emit(\'selectNode\', themeNode)">Selecionar Tema</button></div>',
            data() {
              return {
                themeNode: {
                  id: 'theme-42',
                  rawId: 42,
                  type: 'theme',
                  name: 'Filosofia',
                },
              }
            },
          },
          BookAnnotationsDrawer: true,
          NoteDetailDrawer: true,
          CreateNodeModal: true,
          ConnectNodesModal: true,
        },
      },
    })

    // Clica no botão para selecionar o tema
    await wrapper.find('[data-testid="select-theme"]').trigger('click')

    // Deve exibir o nome do tema no painel lateral
    expect(wrapper.text()).toContain('Filosofia')

    // DEVE exibir o livro conectado 'Meditações' e 'Marco Aurélio'
    expect(wrapper.text()).toContain('Meditações')
    expect(wrapper.text()).not.toContain('Nenhum livro neste tema')
  })
})
