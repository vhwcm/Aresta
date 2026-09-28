import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import DefaultLayout from '../../../app/layouts/default.vue'

const mockIsLoggedIn = ref(true)
const mockRoute = ref({ path: '/library', fullPath: '/library' })

vi.mock('../../../app/composables/useAuth', () => ({
  useAuth: () => ({
    isLoggedIn: mockIsLoggedIn,
    user: ref({ id: '1', email: 'test@example.com' })
  })
}))

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute.value,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn()
  })
}))

const mockSidebarCollapsed = ref(false)
const mockActiveTag = ref<string | null>(null)

const mockHandleCreateNewCanvas = vi.fn()
const mockHandleCreateNewBook = vi.fn()

vi.mock('../../../app/composables/useWorkspaceSidebar', () => ({
  useWorkspaceSidebar: () => ({
    isSidebarCollapsed: mockSidebarCollapsed,
    viewLayout: ref('graph'),
    activeFolder: ref(null),
    activeTag: mockActiveTag,
    activeItemId: ref(null),
    isNewLinkModalOpen: ref(false),
    isNewCanvasModalOpen: ref(false),
    unifiedFolders: ref([]),
    unifiedSidebarItems: ref([]),
    fetchAllWorkspaceData: vi.fn().mockResolvedValue(undefined),
    handleCreateNewNote: vi.fn(),
    handleCreateNewDrawing: vi.fn(),
    handleCreateNewCanvas: mockHandleCreateNewCanvas,
    handleCreateNewBook: mockHandleCreateNewBook,
    handleSelectItem: vi.fn(),
    handleCreateFolder: vi.fn(),
    handleRenameFolder: vi.fn(),
    handleDeleteFolder: vi.fn(),
    handleOpenJournal: vi.fn()
  })
}))

describe('Default Layout (Global FolderTagSidebar & Mobile Hamburger)', () => {
  beforeEach(() => {
    mockIsLoggedIn.value = true
    mockRoute.value = { path: '/library', fullPath: '/library' }
    mockSidebarCollapsed.value = false
    mockActiveTag.value = null
  })

  it('renders global FolderTagSidebar when user is logged in', () => {
    const wrapper = mount(DefaultLayout, {
      global: {
        stubs: {
          FolderTagSidebar: true,
          MenuIcon: true
        }
      },
      slots: {
        default: '<div class="test-content">Conteúdo da Estante</div>'
      }
    })

    expect(wrapper.findComponent({ name: 'FolderTagSidebar' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('Conteúdo da Estante')
  })

  it('renders mobile hamburger button when sidebar is collapsed', async () => {
    mockSidebarCollapsed.value = true
    const wrapper = mount(DefaultLayout, {
      global: {
        stubs: {
          FolderTagSidebar: true,
          MenuIcon: true
        }
      }
    })

    const hamburger = wrapper.find('button[aria-label="Abrir navegação lateral"]')
    expect(hamburger.exists()).toBe(true)

    await hamburger.trigger('click')
    expect(mockSidebarCollapsed.value).toBe(false)
  })

  it('does not render sidebar for guest users', () => {
    mockIsLoggedIn.value = false
    const wrapper = mount(DefaultLayout, {
      global: {
        stubs: {
          FolderTagSidebar: true,
          MenuIcon: true
        }
      },
      slots: {
        default: '<div class="landing-content">Landing Page</div>'
      }
    })

    expect(wrapper.findComponent({ name: 'FolderTagSidebar' }).exists()).toBe(false)
    expect(wrapper.text()).toContain('Landing Page')
  })

  it('marks is-journal-active as true on FolderTagSidebar when on /diario', () => {
    mockRoute.value = { path: '/diario', fullPath: '/diario' }
    const wrapper = mount(DefaultLayout, {
      global: {
        stubs: {
          FolderTagSidebar: {
            name: 'FolderTagSidebar',
            template: '<div class="sidebar-stub" :data-journal-active="isJournalActive"></div>',
            props: ['isJournalActive']
          },
          MenuIcon: true
        }
      }
    })

    const sidebar = wrapper.findComponent({ name: 'FolderTagSidebar' })
    expect(sidebar.props('isJournalActive')).toBe(true)
    const main = wrapper.find('main')
    expect(main.classes()).toContain('overflow-hidden')
  })

  it('chama handleCreateNewCanvas quando FolderTagSidebar emite create-canvas', async () => {
    mockHandleCreateNewCanvas.mockClear()
    const wrapper = mount(DefaultLayout, {
      global: {
        stubs: {
          FolderTagSidebar: {
            name: 'FolderTagSidebar',
            template: '<div class="sidebar-stub"><button class="btn-create-canvas" @click="$emit(\'create-canvas\')">Novo Quadro</button></div>',
            emits: ['create-canvas']
          },
          MenuIcon: true
        }
      }
    })

    const btn = wrapper.find('.btn-create-canvas')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')

    expect(mockHandleCreateNewCanvas).toHaveBeenCalledTimes(1)
  })

  it('renders mobile header with page title next to hamburger button on /library', () => {
    mockSidebarCollapsed.value = true
    mockRoute.value = { path: '/library', fullPath: '/library' }

    const wrapper = mount(DefaultLayout, {
      global: {
        stubs: {
          FolderTagSidebar: true,
          MenuIcon: true,
          BookIcon: true,
          SunIcon: true,
          MoonIcon: true,
          PaletteIcon: true
        }
      }
    })

    const mobileHeader = wrapper.find('[data-testid="mobile-top-header"]')
    expect(mobileHeader.exists()).toBe(true)

    const hamburger = mobileHeader.find('button[aria-label="Abrir navegação lateral"]')
    expect(hamburger.exists()).toBe(true)

    const titleContainer = mobileHeader.find('[data-testid="mobile-header-title-container"]')
    expect(titleContainer.exists()).toBe(true)
    expect(titleContainer.text()).toContain('Estante')
  })

  it('displays activeTag in mobile header when activeTag is selected on /library', () => {
    mockSidebarCollapsed.value = true
    mockRoute.value = { path: '/library', fullPath: '/library' }
    mockActiveTag.value = 'filosofia'

    const wrapper = mount(DefaultLayout, {
      global: {
        stubs: {
          FolderTagSidebar: true,
          MenuIcon: true,
          BookIcon: true,
          SunIcon: true,
          MoonIcon: true,
          PaletteIcon: true
        }
      }
    })

    const titleContainer = wrapper.find('[data-testid="mobile-header-title-container"]')
    expect(titleContainer.text()).toContain('Estante')
    expect(titleContainer.text()).toContain('filosofia')
  })

  it('renders correct page titles on other routes (/revisao, /conta, /upload, /diario, /)', () => {
    mockSidebarCollapsed.value = true

    const routesWithTitles = [
      { path: '/revisao', title: 'Revisão' },
      { path: '/conta', title: 'Sua Conta' },
      { path: '/upload', title: 'Upload de Livros' },
      { path: '/diario', title: 'Diário Sequencial' },
      { path: '/', title: 'Grafo de Conhecimento' }
    ]

    for (const item of routesWithTitles) {
      mockRoute.value = { path: item.path, fullPath: item.path }
      const wrapper = mount(DefaultLayout, {
        global: {
          stubs: {
            FolderTagSidebar: true,
            MenuIcon: true,
            BrainIcon: true,
            UserIcon: true,
            UploadIcon: true,
            BookOpenCheckIcon: true,
            LayoutGridIcon: true,
            NetworkIcon: true,
            SunIcon: true,
            MoonIcon: true,
            PaletteIcon: true
          }
        }
      })

      const titleContainer = wrapper.find('[data-testid="mobile-header-title-container"]')
      expect(titleContainer.text()).toContain(item.title)
    }
  })

  it('does not render mobile top header on canvas detail pages (/canvas/123)', () => {
    mockSidebarCollapsed.value = true
    mockRoute.value = { path: '/canvas/123', fullPath: '/canvas/123' }

    const wrapper = mount(DefaultLayout, {
      global: {
        stubs: {
          FolderTagSidebar: true,
          MenuIcon: true
        }
      }
    })

    const mobileHeader = wrapper.find('[data-testid="mobile-top-header"]')
    expect(mobileHeader.exists()).toBe(false)
  })

  it('chama handleCreateNewBook quando FolderTagSidebar emite create-book', async () => {
    const wrapper = mount(DefaultLayout, {
      global: {
        stubs: {
          FolderTagSidebar: {
            name: 'FolderTagSidebar',
            template: '<div class="sidebar-stub"><button class="trigger-create-book" @click="$emit(\'create-book\')">Criar Livro</button></div>'
          },
          MenuIcon: true
        }
      }
    })

    const triggerBtn = wrapper.find('.trigger-create-book')
    expect(triggerBtn.exists()).toBe(true)

    await triggerBtn.trigger('click')
    expect(mockHandleCreateNewBook).toHaveBeenCalled()
  })
})
