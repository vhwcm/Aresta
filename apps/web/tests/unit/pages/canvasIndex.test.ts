import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import CanvasIndexPage from '../../../app/pages/canvas/index.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {}
  }),
  useRouter: () => ({
    push: vi.fn()
  })
}))

vi.mock('../../../app/composables/useCanvas', () => ({
  useCanvas: () => ({
    canvasesList: ref([]),
    canvasFolders: ref([]),
    isLoading: ref(false),
    createCanvas: vi.fn(),
    deleteCanvas: vi.fn(),
    duplicateCanvas: vi.fn(),
    updateCanvasMetadata: vi.fn(),
    fetchCanvases: vi.fn().mockResolvedValue([]),
    fetchCanvasFolders: vi.fn().mockResolvedValue([]),
    importJsonCanvas: vi.fn()
  })
}))

vi.mock('../../../app/composables/useNotes', () => ({
  useNotes: () => ({
    notesList: ref([]),
    folders: ref([]),
    isLoading: ref(false),
    createNote: vi.fn(),
    deleteNote: vi.fn(),
    updateNote: vi.fn(),
    loadNote: vi.fn(),
    fetchNotes: vi.fn().mockResolvedValue([]),
    fetchFolders: vi.fn().mockResolvedValue([])
  })
}))

vi.mock('../../../app/composables/useGraph', () => ({
  useGraph: () => ({
    graphData: ref({ nodes: [], edges: [] }),
    isLoading: ref(false),
    fetchGraph: vi.fn()
  })
}))

describe('Canvas Index Page Header (Mobile single line & expandable search)', () => {
  const defaultStubs = {
    FolderTagSidebar: true,
    ArestaLogoGraph: true,
    CanvasActionModals: true,
    NoteEditorPane: true,
    GraphCanvas: true,
    SearchIcon: true,
    PlusIcon: true,
    UploadCloudIcon: true,
    FolderIcon: true,
    FolderInputIcon: true,
    TagIcon: true,
    CopyIcon: true,
    Trash2Icon: true,
    SidebarIcon: true,
    LayoutGridIcon: true,
    FileTextIcon: true,
    Edit3Icon: true,
    NetworkIcon: true
  }

  it('renders both desktop and mobile header structures with mobile items in one single line', () => {
    const wrapper = mount(CanvasIndexPage, {
      global: {
        stubs: defaultStubs
      }
    })

    // Header existe
    const header = wrapper.find('header')
    expect(header.exists()).toBe(true)

    // Layout desktop
    const desktopContainer = header.find('.hidden.md\\:flex')
    expect(desktopContainer.exists()).toBe(true)

    // Layout mobile
    const mobileContainer = header.find('.flex.md\\:hidden')
    expect(mobileContainer.exists()).toBe(true)

    // Botão de busca por lupa no mobile
    const searchBtn = mobileContainer.find('button[title="Buscar"]')
    expect(searchBtn.exists()).toBe(true)

    // Botão Nova Nota e Novo Quadro no mobile
    expect(mobileContainer.text()).toContain('Nova Nota')
    expect(mobileContainer.text()).toContain('Novo Quadro')
  })

  it('expands search input on mobile when search icon button is clicked, and collapses on Fechar', async () => {
    const wrapper = mount(CanvasIndexPage, {
      global: {
        stubs: defaultStubs
      }
    })

    const mobileContainer = wrapper.find('header .flex.md\\:hidden')
    expect(mobileContainer.exists()).toBe(true)

    // Inicialmente a busca expansível está fechada
    expect(mobileContainer.find('input[placeholder="Buscar livros, notas, quadros..."]').exists()).toBe(false)

    // Clica no botão de lupa
    const searchBtn = mobileContainer.find('button[title="Buscar"]')
    await searchBtn.trigger('click')

    // Agora o campo de busca móvel está visível
    const mobileInput = wrapper.find('input[placeholder="Buscar livros, notas, quadros..."]')
    expect(mobileInput.exists()).toBe(true)

    // Botão fechar fecha a busca
    const closeBtn = wrapper.find('button[title="Fechar busca"], button:not([title])')
    const fecharButton = wrapper.findAll('button').find(b => b.text() === 'Fechar')
    expect(fecharButton).toBeDefined()
    await fecharButton!.trigger('click')

    // Volta para o estado inicial fechado
    expect(wrapper.find('input[placeholder="Buscar livros, notas, quadros..."]').exists()).toBe(false)
    expect(wrapper.find('button[title="Buscar"]').exists()).toBe(true)
  })
})
