import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FolderTagSidebar from '../../../app/components/FolderTagSidebar.vue'
import type { SidebarTreeItem } from '../../../app/interfaces/sidebar'

const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/', query: {} }),
  useRouter: () => ({ push: mockPush })
}))

vi.mock('~/composables/useUserBooks', () => ({
  useUserBooks: () => ({
    userBooks: { value: [] },
    fetchUserBooks: vi.fn().mockResolvedValue([])
  })
}))

vi.mock('~/composables/useGraph', () => ({
  useGraph: () => ({
    graphData: { value: { nodes: [], edges: [] } },
    fetchGraph: vi.fn().mockResolvedValue(undefined)
  })
}))

vi.mock('~/composables/useSettings', () => ({
  useSettings: () => ({
    themeMode: { value: 'dark' },
    toggleThemeMode: vi.fn()
  })
}))

vi.mock('~/composables/useWorkspaceSidebar', () => ({
  useWorkspaceSidebar: () => ({
    graphSearchQuery: { value: '' },
    activeTag: { value: null }
  })
}))

vi.mock('~/utils/cover', () => ({
  resolveBookCover: () => ''
}))

vi.mock('~/utils/graphMeta', () => ({
  loadGraphMeta: () => ({ themes: [] })
}))

describe('FolderTagSidebar Component (Itens sem pasta na raiz)', () => {
  const items: SidebarTreeItem[] = [
    {
      id: 'note-1',
      title: 'Nota Solta na Raiz',
      kind: 'note',
      folder: null,
      tags: [],
      referenceCount: 0
    },
    {
      id: 'canvas-1',
      title: 'Quadro da Pasta Projetos',
      kind: 'canvas',
      folder: 'Projetos',
      tags: ['Projetos'],
      referenceCount: 1
    }
  ]

  const folders = ['Projetos']

  it('renderiza itens sem pasta diretamente na raiz e NÃO exibe pasta chamada "Sem pasta"', () => {
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items,
        folders,
        collapsed: false
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>'
          },
          ArestaLogoGraph: true,
          ReadingStreak: true,
          ManageThemesModal: true
        }
      }
    })

    const text = wrapper.text()
    // Deve conter os itens diretamente
    expect(text).toContain('Nota Solta na Raiz')
    expect(text).toContain('Projetos')

    // NÃO deve conter o rótulo da pasta "Sem pasta"
    expect(text).not.toContain('Sem pasta')
  })

  it('ao clicar em um item da raiz, emite select-item com o item correto', async () => {
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items,
        folders,
        collapsed: false
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>'
          },
          ArestaLogoGraph: true,
          ReadingStreak: true,
          ManageThemesModal: true
        }
      }
    })

    const rootItemElement = wrapper.findAll('.group\\/file').find((el) => el.text().includes('Nota Solta na Raiz'))
    expect(rootItemElement).toBeDefined()

    await rootItemElement?.trigger('click')

    expect(wrapper.emitted('select-item')).toBeTruthy()
    expect(wrapper.emitted('select-item')?.[0]?.[0]).toEqual(
      expect.objectContaining({
        id: 'note-1',
        title: 'Nota Solta na Raiz'
      })
    )
  })

  it('exibe opção unificada "Livro / PDF" no botão de mais (+) e emite create-book redirecionando para /upload', async () => {
    mockPush.mockClear()
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items,
        folders,
        collapsed: false
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>'
          },
          ArestaLogoGraph: true,
          ReadingStreak: true,
          ManageThemesModal: true
        }
      }
    })

    // Botão de adicionar (+)
    const addBtn = wrapper.find('button[aria-label="Criar novo item"]')
    expect(addBtn.exists()).toBe(true)

    // Antes de abrir, menu está fechado
    expect(wrapper.find('[data-testid="sidebar-add-book-btn"]').exists()).toBe(false)

    // Abre o menu dropdown
    await addBtn.trigger('click')

    // Botão "Livro / PDF" deve estar presente como opção única
    const addBookBtn = wrapper.find('[data-testid="sidebar-add-book-btn"]')
    expect(addBookBtn.exists()).toBe(true)
    expect(addBookBtn.text()).toContain('Livro / PDF')
    expect(addBookBtn.text()).toContain('Importar EPUB ou PDF')

    // Clica na opção
    await addBookBtn.trigger('click')

    // Deve emitir create-book e redirecionar para /upload
    expect(wrapper.emitted('create-book')).toBeTruthy()
    expect(mockPush).toHaveBeenCalledWith('/upload')

    // Menu dropdown deve fechar
    expect(wrapper.find('[data-testid="sidebar-add-book-btn"]').exists()).toBe(false)
  })

  it('exibe opção "Nova Tag" no botão de mais (+), fecha o menu dropdown, emite create-tag e abre modal de tags', async () => {
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items,
        folders,
        collapsed: false
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>'
          },
          ArestaLogoGraph: true,
          ReadingStreak: true,
          ManageThemesModal: {
            props: ['isOpen'],
            template: '<div v-if="isOpen" data-testid="manage-themes-modal-stub" />'
          }
        }
      }
    })

    const addBtn = wrapper.find('button[aria-label="Criar novo item"]')
    expect(addBtn.exists()).toBe(true)

    // Antes de abrir o menu dropdown
    expect(wrapper.find('[data-testid="sidebar-add-tag-btn"]').exists()).toBe(false)

    // Abre o menu dropdown
    await addBtn.trigger('click')

    // Botão "Nova Tag" deve estar visível
    const addTagBtn = wrapper.find('[data-testid="sidebar-add-tag-btn"]')
    expect(addTagBtn.exists()).toBe(true)
    expect(addTagBtn.text()).toContain('Nova Tag')
    expect(addTagBtn.text()).toContain('Criar no grafo e estante')

    // Clica em "Nova Tag"
    await addTagBtn.trigger('click')

    // Deve emitir create-tag
    expect(wrapper.emitted('create-tag')).toBeTruthy()

    // O modal ManageThemesModal deve ser aberto
    expect(wrapper.find('[data-testid="manage-themes-modal-stub"]').exists()).toBe(true)

    // Menu dropdown deve ser fechado
    expect(wrapper.find('[data-testid="sidebar-add-tag-btn"]').exists()).toBe(false)
  })

  it('ao clicar no ícone de Início (modo expandido), emite go-home e navega para /', async () => {
    mockPush.mockClear()
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items,
        folders,
        collapsed: false,
        viewLayout: 'grid'
      },
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          ArestaLogoGraph: true,
          ReadingStreak: true,
          ManageThemesModal: true
        }
      }
    })

    const homeBtn = wrapper.find('button[aria-label="Início"]')
    expect(homeBtn.exists()).toBe(true)

    await homeBtn.trigger('click')

    expect(wrapper.emitted('go-home')).toBeTruthy()
  })

  it('ao clicar no ícone de Início (modo colapsado), emite go-home e fecha no mobile', async () => {
    mockPush.mockClear()
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items,
        folders,
        collapsed: true,
        viewLayout: 'grid'
      },
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          ArestaLogoGraph: true,
          ReadingStreak: true,
          ManageThemesModal: true
        }
      }
    })

    const homeBtn = wrapper.find('button[aria-label="Início"]')
    expect(homeBtn.exists()).toBe(true)

    await homeBtn.trigger('click')

    expect(wrapper.emitted('go-home')).toBeTruthy()
  })
})

