import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import SidebarGraph from '../../../app/components/SidebarGraph.vue'

const mockGraphData = ref({
  nodes: [
    {
      id: 'theme-1',
      rawId: 1,
      type: 'theme',
      name: 'Filosofia',
      books: [
        {
          userBookId: 1,
          bookId: 10,
          title: 'A República',
          author: 'Platão',
          status: 'LENDO',
          currentPage: 42,
        },
      ],
    },
    {
      id: 'book-10',
      rawId: 10,
      type: 'book',
      name: 'A República',
      fullTitle: 'A República',
      author: 'Platão',
      summary: 'Obra clássica sobre justiça e cidade ideal.',
      coverPath: 'storage/covers/republica.jpg',
    },
  ],
  edges: [
    { id: 'edge-1', source: 'theme-1', target: 'book-10', type: 'book-theme' },
  ],
})

const mockUserBooks = ref([
  {
    userBookId: 1,
    bookId: 10,
    title: 'A República',
    author: 'Platão',
    status: 'LENDO',
    currentPage: 42,
  },
])

vi.mock('~/composables/useGraph', () => ({
  useGraph: () => ({
    graphData: mockGraphData,
    loading: ref(false),
    fetchGraph: vi.fn(),
    createNode: vi.fn(),
    createConnection: vi.fn(),
    fetchBookAnnotations: vi.fn().mockResolvedValue([]),
    createLooseAnnotation: vi.fn(),
  }),
}))

vi.mock('~/composables/useUserBooks', () => ({
  useUserBooks: () => ({
    userBooks: mockUserBooks,
    fetchUserBooks: vi.fn(),
  }),
}))

describe('SidebarGraph Component', () => {
  it('ao clicar em um nó do tipo livro no grafo, abre a gaveta de anotações do livro ao invés de exibir "Nenhum livro neste tema"', async () => {
    const wrapper = mount(SidebarGraph, {
      global: {
        stubs: {
          GraphCanvas: {
            template: '<div data-testid="graph-canvas"><button data-testid="click-book" @click="$emit(\'selectNode\', bookNode)">Livro</button></div>',
            data() {
              return {
                bookNode: {
                  id: 'book-10',
                  rawId: 10,
                  type: 'book',
                  name: 'A República',
                  fullTitle: 'A República',
                  author: 'Platão',
                  summary: 'Obra clássica sobre justiça.',
                },
              }
            },
          },
          BookAnnotationsDrawer: {
            props: ['isOpen', 'book'],
            template: '<div v-if="isOpen" data-testid="book-drawer"><h2>{{ book?.fullTitle || book?.name }}</h2><span>{{ book?.author }}</span></div>',
          },
          CreateNodeModal: true,
          ConnectNodesModal: true,
          NuxtLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    })

    // Inicialmente a gaveta de anotações está fechada e exibe o grafo
    expect(wrapper.find('[data-testid="graph-canvas"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="book-drawer"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Nenhum livro neste tema')

    // Clica no nó de livro
    const clickBookBtn = wrapper.find('[data-testid="click-book"]')
    await clickBookBtn.trigger('click')

    // NÃO deve exibir o estado vazio de tema
    expect(wrapper.text()).not.toContain('Nenhum livro neste tema')
    expect(wrapper.text()).not.toContain('Este mapa mental ainda não possui livros vinculados.')

    // DEVE abrir a gaveta de anotações com as informações do livro
    const drawer = wrapper.find('[data-testid="book-drawer"]')
    expect(drawer.exists()).toBe(true)
    expect(drawer.text()).toContain('A República')
    expect(drawer.text()).toContain('Platão')
  })

  it('ao clicar em um tema, exibe os livros daquele tema e permite abrir a gaveta ao clicar no livro da lista', async () => {
    const wrapper = mount(SidebarGraph, {
      global: {
        stubs: {
          GraphCanvas: {
            template: '<div data-testid="graph-canvas"><button data-testid="click-theme" @click="$emit(\'selectNode\', themeNode)">Tema</button></div>',
            data() {
              return {
                themeNode: {
                  id: 1,
                  type: 'theme',
                  name: 'Filosofia',
                  books: [
                    {
                      userBookId: 1,
                      bookId: 10,
                      title: 'A República',
                      author: 'Platão',
                      status: 'LENDO',
                      currentPage: 42,
                    },
                  ],
                },
              }
            },
          },
          BookAnnotationsDrawer: {
            props: ['isOpen', 'book'],
            template: '<div v-if="isOpen" data-testid="book-drawer"><h2>{{ book?.name }}</h2></div>',
          },
          CreateNodeModal: true,
          ConnectNodesModal: true,
          NuxtLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    })

    // Clica no tema
    await wrapper.find('[data-testid="click-theme"]').trigger('click')

    // Exibe o cabeçalho do tema e a lista de livros
    expect(wrapper.text()).toContain('Filosofia')
    expect(wrapper.text()).toContain('1 livro conectado')
    expect(wrapper.text()).toContain('A República')

    // Clica no livro dentro da lista do tema
    const bookRow = wrapper.findAll('.cursor-pointer').find((el) => el.text().includes('A República'))
    expect(bookRow).toBeDefined()
    await bookRow?.trigger('click')

    // Abre a gaveta de anotações do livro
    expect(wrapper.find('[data-testid="book-drawer"]').exists()).toBe(true)
  })

  it('ao clicar em um nó do tipo nota no grafo, abre a gaveta NoteDetailDrawer no local ao invés de redirecionar para /canvas', async () => {
    const wrapper = mount(SidebarGraph, {
      global: {
        stubs: {
          GraphCanvas: {
            template: '<div data-testid="graph-canvas"><button data-testid="click-note" @click="$emit(\'selectNode\', noteNode)">Nota</button></div>',
            data() {
              return {
                noteNode: {
                  id: 'note-42',
                  rawId: '42',
                  type: 'note',
                  name: 'Minhas Anotações de Platão',
                  title: 'Minhas Anotações de Platão',
                },
              }
            },
          },
          BookAnnotationsDrawer: true,
          NoteDetailDrawer: {
            props: ['isOpen', 'node'],
            template: '<div v-if="isOpen" data-testid="note-drawer"><h2>{{ node?.title || node?.name }}</h2></div>',
          },
          CreateNodeModal: true,
          ConnectNodesModal: true,
          NuxtLink: true,
        },
      },
    })

    expect(wrapper.find('[data-testid="note-drawer"]').exists()).toBe(false)

    // Clica no nó de nota
    await wrapper.find('[data-testid="click-note"]').trigger('click')

    // Deve abrir a gaveta de nota
    const noteDrawer = wrapper.find('[data-testid="note-drawer"]')
    expect(noteDrawer.exists()).toBe(true)
    expect(noteDrawer.text()).toContain('Minhas Anotações de Platão')
  })
})
