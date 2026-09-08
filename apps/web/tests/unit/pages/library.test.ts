import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import LibraryPage from '../../../app/pages/library.vue'

const mockFetch = vi.fn()
;(globalThis as any).$fetch = mockFetch

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    isLoggedIn: ref(true),
    token: ref('mock-token'),
    user: ref({ id: 1, name: 'Admin', role: 'ADMIN' })
  })
}))

describe('Library Page', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { bookRepo } = await import('../../../app/adapters/database/repositories/BookRepository')
    await bookRepo.clear()
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/user-books')) {
        return Promise.resolve([
          { id: 10, bookId: 1, title: 'Contos Fluminenses', filePath: 'storage/epubs/contos.epub', status: 'LENDO', currentPage: 45 },
          { id: 11, bookId: 2, title: 'Manual de Engenharia', filePath: 'storage/pdfs/manual.pdf', status: 'QUERO_LER', currentPage: 0 }
        ])
      }
      return Promise.resolve([])
    })
  })

  it('renders the library page with user shelf content and actions', async () => {
    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' }
        }
      }
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Estante')
    expect(wrapper.text()).not.toContain('Biblioteca & Estante')
    expect(wrapper.text()).not.toContain('Acervo da Aresta')
    expect(wrapper.text()).toContain('Novo Livreto IA')
    expect(wrapper.text()).toContain('Enviar Arquivo')
    // Não deve conter os cards de status removidos
    expect(wrapper.text()).not.toContain('Total na sua Estante')
    expect(wrapper.text()).not.toContain('Lendo Atualmente')
    // Não deve exibir formato de arquivo (EPUB ou PDF)
    expect(wrapper.text()).not.toContain('EPUB')
    expect(wrapper.text()).not.toContain('PDF')
    // Deve exibir porcentagem de leitura não editável
    expect(wrapper.text()).toContain('45%')
    expect(wrapper.text()).toContain('0%')
    // Botão Ler Livro e seletor de status devem ter sido removidos
    expect(wrapper.text()).not.toContain('Ler Livro')
    expect(wrapper.text()).not.toContain('Lendo')
    expect(wrapper.text()).not.toContain('📖 Lendo')
    expect(wrapper.text()).not.toContain('Ver no Mapa Mental')
    // As palavras Filtrar Temas e Ver Grafo devem ser removidas
    expect(wrapper.text()).not.toContain('Filtrar Temas')
    expect(wrapper.text()).not.toContain('Ver Grafo')
  })

  it('navigates to reader when clicking a book card', async () => {
    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' }
        }
      }
    })
    await flushPromises()

    const bookCards = wrapper.findAll('[data-testid="user-book-card"]')
    expect(bookCards.length).toBeGreaterThanOrEqual(2)

    const card0 = bookCards[0]
    const card1 = bookCards[1]
    expect(card0).toBeDefined()
    expect(card1).toBeDefined()

    if (card0 && card1) {
      // Primeiro card na ordem por recência/id (Manual de Engenharia: bookId 2, page 1 fallback)
      await card0.trigger('click')
      expect(mockPush).toHaveBeenCalledWith('/reader?bookId=2&page=1')

      // Segundo card (Contos Fluminenses: bookId 1, page 45)
      await card1.trigger('click')
      expect(mockPush).toHaveBeenCalledWith('/reader?bookId=1&page=45')
    }
  })

  it('does not display general catalog tab selection', async () => {
    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' }
        }
      }
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('Catálogo Geral')
    expect(wrapper.text()).not.toContain('Todos os Livros do Acervo')
  })

  it('orders user books by most recently opened or added first', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/user-books')) {
        return Promise.resolve([
          { id: 10, bookId: 1, title: 'Livro Antigo', status: 'LENDO', currentPage: 10, lastAccessedAt: '2026-09-01T10:00:00.000Z' },
          { id: 11, bookId: 2, title: 'Livro Mais Recente', status: 'LENDO', currentPage: 5, lastAccessedAt: '2026-09-06T08:00:00.000Z' },
          { id: 12, bookId: 3, title: 'Livro Intermediário', status: 'LENDO', currentPage: 20, lastAccessedAt: '2026-09-04T12:00:00.000Z' }
        ])
      }
      return Promise.resolve([])
    })

    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' }
        }
      }
    })
    await flushPromises()

    const titles = wrapper.findAll('h3').map(h => h.text())
    expect(titles.indexOf('Livro Mais Recente')).toBeLessThan(titles.indexOf('Livro Intermediário'))
    expect(titles.indexOf('Livro Intermediário')).toBeLessThan(titles.indexOf('Livro Antigo'))
  })

  it('opens delete confirmation modal with book title when clicking delete button', async () => {
    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' }
        }
      }
    })
    await flushPromises()

    const deleteBtn = wrapper.find('[data-testid="delete-book-btn"]')
    expect(deleteBtn.exists()).toBe(true)

    await deleteBtn.trigger('click')
    expect(wrapper.text()).toContain('Remover Livro da Estante')
    expect(wrapper.text()).toContain('Contos Fluminenses')
  })

  it('renders book list inside a responsive grid for shelf display on larger screens', async () => {
    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' }
        }
      }
    })
    await flushPromises()

    const bookCard = wrapper.find('[data-testid="user-book-card"]')
    expect(bookCard.exists()).toBe(true)

    const gridContainer = bookCard.element.parentElement
    expect(gridContainer?.className).toContain('grid')
    expect(gridContainer?.className).toContain('grid-cols-1')
    expect(gridContainer?.className).toContain('md:grid-cols-2')
    expect(gridContainer?.className).toContain('lg:grid-cols-3')
  })

  it('renders selectable and deselectable theme tags beside Estante and supports mobile collapsible list', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/user-books')) {
        return Promise.resolve([
          { id: 10, bookId: 1, title: 'Livro Filosofia', themes: [{ id: 1, name: 'Filosofia', color: '#E57B55' }], status: 'LENDO', currentPage: 10 },
          { id: 11, bookId: 2, title: 'Livro Ficção', themes: [{ id: 2, name: 'Ficção', color: '#38BDF8' }], status: 'LENDO', currentPage: 5 }
        ])
      }
      if (url.includes('/graph')) {
        return Promise.resolve({
          nodes: [
            { id: 1, name: 'Filosofia', color: '#E57B55' },
            { id: 2, name: 'Ficção', color: '#38BDF8' }
          ],
          edges: []
        })
      }
      return Promise.resolve([])
    })

    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' }
        }
      }
    })
    await flushPromises()

    // Não deve conter os textos antigos removidos
    expect(wrapper.text()).not.toContain('Filtrar Temas')
    expect(wrapper.text()).not.toContain('Ver Grafo')

    // Deve renderizar Todos os Temas e as tags dos temas
    expect(wrapper.text()).toContain('Todos os Temas')
    expect(wrapper.text()).toContain('Filosofia')
    expect(wrapper.text()).toContain('Ficção')

    // Botão de alternar lista no mobile
    const toggleMobileBtn = wrapper.find('[data-testid="toggle-mobile-themes-btn"]')
    expect(toggleMobileBtn.exists()).toBe(true)

    // Ao clicar no botão mobile, a lista colapsável para baixo deve aparecer
    expect(wrapper.find('[data-testid="mobile-themes-dropdown"]').exists()).toBe(false)
    await toggleMobileBtn.trigger('click')
    expect(wrapper.find('[data-testid="mobile-themes-dropdown"]').exists()).toBe(true)

    // Ao clicar novamente, a lista colapsa
    await toggleMobileBtn.trigger('click')
    expect(wrapper.find('[data-testid="mobile-themes-dropdown"]').exists()).toBe(false)
  })
})


