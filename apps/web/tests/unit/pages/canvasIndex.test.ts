import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import CanvasIndexPage from '../../../app/components/canvas/UnifiedCanvasHub.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {}
  }),
  useRouter: () => ({
    push: vi.fn()
  }),
  onBeforeRouteLeave: vi.fn()
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

const mockNotesList = ref<any[]>([])
const mockLoadNote = vi.fn().mockImplementation((id: string) => {
  return Promise.resolve(mockNotesList.value.find((n) => String(n.id) === String(id) || String(n.id).replace(/^note-/, '') === String(id).replace(/^note-/, '')) || null)
})

vi.mock('../../../app/composables/useNotes', () => ({
  useNotes: () => ({
    notesList: mockNotesList,
    folders: ref([]),
    isLoading: ref(false),
    createNote: vi.fn(),
    deleteNote: vi.fn(),
    updateNote: vi.fn(),
    loadNote: mockLoadNote,
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
    AppKnowledgeGraph: true,
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

  it('renders workspace in immersive mode without horizontal top header and connects to sidebar', () => {
    const wrapper = mount(CanvasIndexPage, {
      global: {
        stubs: defaultStubs
      }
    })

    // Garante que o container principal e o grafo estão presentes
    expect(wrapper.find('header').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'AppKnowledgeGraph' }).exists()).toBe(true)
  })

  it('abre o NoteEditorPane ao selecionar um nó de nota emitido pelo AppKnowledgeGraph', async () => {
    const mockNote = {
      id: 'note-12345',
      title: 'Nota Arquitetural',
      content: '# Conteúdo da Nota',
      tags: ['estudo'],
      folder: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    mockNotesList.value = [mockNote]

    const wrapper = mount(CanvasIndexPage, {
      global: {
        stubs: {
          ...defaultStubs,
          AppKnowledgeGraph: {
            template: '<div data-testid="app-knowledge-graph"><button data-testid="select-graph-note" @click="$emit(\'selectNode\', noteNode)">Abrir Nota</button></div>',
            data() {
              return {
                noteNode: {
                  id: 'note-note-12345',
                  rawId: 'note-12345',
                  type: 'note',
                  name: 'Nota Arquitetural'
                }
              }
            }
          },
          NoteEditorPane: {
            props: ['note'],
            template: '<div data-testid="note-editor-pane">Editor: {{ note?.title }}</div>'
          }
        }
      }
    })

    // Clica no botão do stub do AppKnowledgeGraph simulando o clique no nó do grafo
    await wrapper.find('[data-testid="select-graph-note"]').trigger('click')

    // Deve abrir o NoteEditorPane e não exibir o estado vazio "Nenhuma nota selecionada"
    expect(wrapper.find('[data-testid="note-editor-pane"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="note-editor-pane"]').text()).toContain('Nota Arquitetural')
    expect(wrapper.text()).not.toContain('Nenhuma nota selecionada')
  })
})
