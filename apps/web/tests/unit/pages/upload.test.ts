import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import UploadPage from '../../../app/pages/upload.vue'
import { useReaderStore } from '../../../app/stores/readerStore'

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock('~/adapters/BookDocumentFactory', () => ({
  createBookDocument: vi.fn((type: string) => ({
    type,
    metadata: { title: 'Dom Casmurro', author: 'Machado de Assis', coverUrl: '' },
    totalPages: 50,
    isLoaded: true,
    load: vi.fn().mockResolvedValue(undefined),
    getPage: vi.fn(),
    destroy: vi.fn(),
  }))
}))

describe('Upload Page', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockPush.mockClear()
  })

  it('renders the upload page title and dropzone container', () => {
    const wrapper = mount(UploadPage, {
      global: {
        stubs: {
          NuxtLink: true,
          ReaderUploadDropZone: true
        }
      }
    })
    expect(wrapper.text()).toContain('Upload de Livros')
    expect(wrapper.text()).toContain('Módulo de Importação')
    expect(wrapper.text()).toContain('Formatos Suportados')
  })

  it('ao validar arquivo na dropzone, salva no banco local e navega para /reader com bookId', async () => {
    const fakeFile = new File([new Uint8Array([1, 2, 3])], 'dom-casmurro.epub', { type: 'application/epub+zip' })

    const wrapper = mount(UploadPage, {
      global: {
        stubs: {
          NuxtLink: true,
          ReaderUploadDropZone: {
            name: 'ReaderUploadDropZone',
            template: '<div id="drop-zone-area"></div>'
          }
        }
      }
    })

    const dropzone = wrapper.findComponent('#drop-zone-area')
    ;(dropzone as any).vm.$emit('file-validated', { file: fakeFile, type: 'epub' })

    // Aguarda microtasks e carregamento do documento
    await new Promise((r) => setTimeout(r, 100))

    const store = useReaderStore()
    expect(store.hasDocument).toBe(true)
    expect(store.bookId).toBeGreaterThan(0)
    expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({
      path: '/reader',
      query: expect.objectContaining({ bookId: expect.any(String) })
    }))
  })
})
