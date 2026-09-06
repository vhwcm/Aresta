import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import LibraryPage from '../../../app/pages/library.vue'

const mockFetch = vi.fn()
;(globalThis as any).$fetch = mockFetch

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    isLoggedIn: ref(true),
    token: ref('mock-token'),
    user: ref({ id: 1, name: 'Admin', role: 'ADMIN' })
  })
}))

describe('Library Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    expect(wrapper.text()).toContain('Biblioteca & Estante')
    expect(wrapper.text()).toContain('Total na sua Estante')
    expect(wrapper.text()).toContain('Novo Livreto IA')
    expect(wrapper.text()).toContain('Enviar Arquivo')
    expect(wrapper.text()).toContain('EPUB')
    expect(wrapper.text()).toContain('PDF')
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
})
