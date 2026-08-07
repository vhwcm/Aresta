import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
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
          { id: 1, title: 'Contos Fluminenses', filePath: 'storage/books/1.pdf', coverPath: 'storage/covers/1.png' }
        ])
      }
      if (url.includes('/api/user-books')) {
        return Promise.resolve([
          { id: 10, bookId: 1, title: 'Contos Fluminenses', status: 'LENDO', currentPage: 45 }
        ])
      }
      return Promise.resolve([])
    })
  })

  it('renders the library page with catalog tab', () => {
    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: true
        }
      }
    })
    expect(wrapper.text()).toContain('Biblioteca & Estante')
    expect(wrapper.text()).toContain('Catálogo Geral')
  })

  it('switches to My Books tab when clicked by logged-in user', async () => {
    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: true
        }
      }
    })

    const buttons = wrapper.findAll('button')
    const myBooksButton = buttons.find(b => b.text().includes('Minha Estante'))

    expect(myBooksButton).toBeDefined()
    await myBooksButton!.trigger('click')

    expect(wrapper.text()).toContain('Total na sua Estante')
  })
})
