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
      if (url.includes('/api/books')) {
        return Promise.resolve([
          { id: 1, title: 'Contos Fluminenses', filePath: 'storage/epubs/contos.epub', coverPath: 'storage/covers/1.png' },
          { id: 2, title: 'Manual de Engenharia', filePath: 'storage/pdfs/manual.pdf', coverPath: 'storage/covers/2.png' }
        ])
      }
      if (url.includes('/api/user-books')) {
        return Promise.resolve([
          { id: 10, bookId: 1, title: 'Contos Fluminenses', filePath: 'storage/epubs/contos.epub', status: 'LENDO', currentPage: 45 },
          { id: 11, bookId: 2, title: 'Manual de Engenharia', filePath: 'storage/pdfs/manual.pdf', status: 'QUERO_LER', currentPage: 0 }
        ])
      }
      return Promise.resolve([])
    })
  })

  it('renders the library page with catalog tab and displays format badges', async () => {
    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: true
        }
      }
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Biblioteca & Estante')
    expect(wrapper.text()).toContain('Catálogo Geral')
    expect(wrapper.text()).toContain('EPUB')
    expect(wrapper.text()).toContain('PDF')
  })

  it('switches to My Books tab when clicked by logged-in user and displays EPUB/PDF badges', async () => {
    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: true
        }
      }
    })
    await flushPromises()

    const buttons = wrapper.findAll('button')
    const myBooksButton = buttons.find(b => b.text().includes('Minha Estante'))

    expect(myBooksButton).toBeDefined()
    await myBooksButton!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Total na sua Estante')
    expect(wrapper.text()).toContain('EPUB')
    expect(wrapper.text()).toContain('PDF')
  })
})

