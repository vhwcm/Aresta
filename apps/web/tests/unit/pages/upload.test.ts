import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import UploadPage from '../../../app/pages/upload.vue'
import { useReaderStore } from '../../../app/stores/readerStore'

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    isLoggedIn: ref(true),
    token: ref('mock-token'),
    user: ref({ id: 1, name: 'User' }),
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
  beforeEach(async () => {
    setActivePinia(createPinia())
    mockPush.mockClear()
    const { dbManager } = await import('../../../app/adapters/database/DatabaseManager')
    const { InMemoryAdapter } = await import('../../../app/adapters/database/InMemoryAdapter')
    dbManager.setAdapter(new InMemoryAdapter())
    const { bookRepo } = await import('../../../app/adapters/database/repositories/BookRepository')
    await bookRepo.clear()
    const { resetGraphMemory } = await import('../../../app/composables/useGraph')
    resetGraphMemory()
  })

  it('renders the upload page title and dropzone container', () => {
    const wrapper = mount(UploadPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          ReaderUploadDropZone: true
        }
      }
    })
    expect(wrapper.text()).toContain('Upload de Livros')
    expect(wrapper.text()).not.toContain('Módulo de Importação')
    expect(wrapper.text()).toContain('Voltar para a Estante')
    expect(wrapper.text()).not.toContain('Ir para Biblioteca')
    expect(wrapper.text()).not.toContain('Formatos Suportados')
    expect(wrapper.text()).not.toContain('Recursos Aresta')

    // Input de título opcional com limite de 30 caracteres
    const titleInput = wrapper.find('#upload-book-title')
    expect(titleInput.exists()).toBe(true)
    expect(titleInput.attributes('maxlength')).toBe('30')
  })

  it('permite definir título personalizado pelo input antes do upload', async () => {
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

    const titleInput = wrapper.find('#upload-book-title')
    await titleInput.setValue('Meu Livro Especial')

    const dropzone = wrapper.findComponent('#drop-zone-area')
    ;(dropzone as any).vm.$emit('file-validated', { file: fakeFile, type: 'epub' })

    await new Promise((r) => setTimeout(r, 100))

    const store = useReaderStore()
    expect(store.hasDocument).toBe(true)
    expect(store.fileName).toBe('Meu Livro Especial')
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

  it('permite selecionar um tema existente antes de realizar o upload do livro', async () => {
    const { useGraph } = await import('../../../app/composables/useGraph')
    const { graphData } = useGraph()
    graphData.value = {
      nodes: [
        { id: 101, name: 'Filosofia', color: '#3B82F6', type: 'theme' },
        { id: 102, name: 'Tecnologia', color: '#10B981', type: 'theme' },
      ],
      edges: [],
    }

    const fakeFile = new File([new Uint8Array([1, 2, 3])], 'filosofia-antiga.epub', { type: 'application/epub+zip' })

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

    // Verifica que os chips dos temas aparecem
    const themeChip101 = wrapper.find('[data-testid="theme-chip-101"]')
    expect(themeChip101.exists()).toBe(true)
    expect(themeChip101.text()).toContain('Filosofia')

    // Clica no tema Filosofia para selecionar
    await themeChip101.trigger('click')

    // Dispara validação do arquivo
    const dropzone = wrapper.findComponent('#drop-zone-area')
    ;(dropzone as any).vm.$emit('file-validated', { file: fakeFile, type: 'epub' })

    await new Promise((r) => setTimeout(r, 100))

    const store = useReaderStore()
    expect(store.hasDocument).toBe(true)

    const { bookRepo } = await import('../../../app/adapters/database/repositories/BookRepository')
    const savedBook = await bookRepo.getById(store.bookId!)
    expect(savedBook).toBeDefined()
    expect(savedBook?.themes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 101, name: 'Filosofia' })
      ])
    )
  })

  it('permite criar novo tema inline e vinculá-lo ao livro no upload', async () => {
    const fakeFile = new File([new Uint8Array([1, 2, 3])], 'novo-assunto.epub', { type: 'application/epub+zip' })

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

    // Abre o painel inline de criação de tema
    const toggleBtn = wrapper.find('[data-testid="toggle-create-theme-btn"]')
    expect(toggleBtn.exists()).toBe(true)
    await toggleBtn.trigger('click')
    await flushPromises()

    const input = wrapper.find('[data-testid="inline-theme-name-input"]')
    expect(input.exists()).toBe(true)
    await input.setValue('Estoicismo Moderno')
    await input.trigger('keyup.enter')
    await new Promise((r) => setTimeout(r, 150))
    await flushPromises()

    // Dispara validação do arquivo
    const dropzone = wrapper.findComponent('#drop-zone-area')
    ;(dropzone as any).vm.$emit('file-validated', { file: fakeFile, type: 'epub' })
    await new Promise((r) => setTimeout(r, 150))
    await flushPromises()

    const store = useReaderStore()
    const { bookRepo } = await import('../../../app/adapters/database/repositories/BookRepository')
    const savedBook = await bookRepo.getById(store.bookId!)
    expect(savedBook).toBeDefined()
    expect(savedBook?.themes?.some((t) => t.name === 'Estoicismo Moderno')).toBe(true)
  })
})

