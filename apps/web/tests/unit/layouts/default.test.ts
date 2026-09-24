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

vi.mock('../../../app/composables/useWorkspaceSidebar', () => ({
  useWorkspaceSidebar: () => ({
    isSidebarCollapsed: mockSidebarCollapsed,
    viewLayout: ref('graph'),
    activeFolder: ref(null),
    activeTag: ref(null),
    activeItemId: ref(null),
    isNewLinkModalOpen: ref(false),
    isNewCanvasModalOpen: ref(false),
    unifiedFolders: ref([]),
    unifiedSidebarItems: ref([]),
    fetchAllWorkspaceData: vi.fn().mockResolvedValue(undefined),
    handleCreateNewNote: vi.fn(),
    handleCreateNewDrawing: vi.fn(),
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
})
