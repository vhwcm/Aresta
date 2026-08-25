import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ReaderBottomBar from '../../../app/components/reader/ReaderBottomBar.vue'
import ReaderSavedPagesModal from '../../../app/components/reader/ReaderSavedPagesModal.vue'
import ReaderAnnotationModal from '../../../app/components/reader/ReaderAnnotationModal.vue'
import { useReaderStore } from '../../../app/stores/readerStore'

vi.mock('~/composables/useGraph', () => ({
  useGraph: () => ({
    graphData: {
      value: {
        nodes: [
          { id: -999, name: 'Meu Conhecimento', isRoot: true },
          { id: 1, name: 'História Antiga', color: '#E57B55' },
          { id: 2, name: 'Filosofia', color: '#4CAF50' },
        ],
        edges: [],
      },
    },
    loading: { value: false },
    fetchGraph: vi.fn(),
    createNode: vi.fn().mockResolvedValue({ id: 3, name: 'Novo Tema' }),
    createConnection: vi.fn(),
  }),
}))

const mockCreateAnnotation = vi.fn()
vi.mock('~/composables/useAnnotations', () => ({
  useAnnotations: () => ({
    annotations: { value: [] },
    loading: { value: false },
    fetchAnnotations: vi.fn().mockResolvedValue([]),
    createAnnotation: mockCreateAnnotation,
    updateAnnotationNote: vi.fn().mockResolvedValue({ id: 1, note: 'atualizado' }),
    deleteAnnotation: vi.fn().mockResolvedValue(true),
  }),
}))

describe('Reader Components', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('ReaderBottomBar', () => {
    it('renderiza botões e reage ao clique de marcar página', async () => {
      const store = useReaderStore()
      store.currentPage = 4
      const wrapper = mount(ReaderBottomBar, {
        props: { isGraphActive: false },
      })

      const bookmarkBtn = wrapper.find('button[aria-label="Marcar ou desmarcar página atual"]')
      expect(bookmarkBtn.exists()).toBe(true)

      await bookmarkBtn.trigger('click')
      expect(store.isCurrentPageBookmarked).toBe(true)
      expect(store.savedPages).toContain(4)
    })

    it('emite eventos corretos ao clicar nos botões de sair, anotação, páginas salvas e grafo', async () => {
      const store = useReaderStore()
      store.setDocument({
        type: 'pdf',
        metadata: { title: 'Livro de Teste' },
        totalPages: 20,
        isLoaded: true,
        load: vi.fn(),
        getPage: vi.fn(),
        destroy: vi.fn(),
      } as any, 'livro.pdf')
      store.currentPage = 5

      const wrapper = mount(ReaderBottomBar, {
        props: { isGraphActive: true },
      })

      // Verifica exibição da porcentagem (5 / 20 = 25%)
      expect(wrapper.text()).toContain('25%')

      // Botão Sair
      const closeBtn = wrapper.find('#btn-close-book')
      expect(closeBtn.exists()).toBe(true)
      await closeBtn.trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()

      // Botão Anotar
      const annotateBtn = wrapper.find('button[aria-label="Criar anotação"]')
      await annotateBtn.trigger('click')
      expect(wrapper.emitted('openAnnotation')).toBeTruthy()

      // Botão Páginas Salvas
      const savedPagesBtn = wrapper.find('button[aria-label="Abrir lista de páginas salvas"]')
      await savedPagesBtn.trigger('click')
      expect(wrapper.emitted('openSavedPages')).toBeTruthy()

      // Botão Grafo
      const graphBtn = wrapper.find('button[aria-label="Abrir ou fechar Grafo de Conhecimento"]')
      await graphBtn.trigger('click')
      expect(wrapper.emitted('toggleGraph')).toBeTruthy()
    })

    it('exibe formato de spread de duas páginas no indicador (1-2/20)', async () => {
      const store = useReaderStore()
      store.setDocument({
        type: 'pdf',
        metadata: { title: 'Livro de Teste' },
        totalPages: 20,
        isLoaded: true,
        load: vi.fn(),
        getPage: vi.fn(),
        destroy: vi.fn(),
      } as any, 'livro.pdf')
      store.currentPage = 1
      store.setTwoPageMode(true)

      const wrapper = mount(ReaderBottomBar, {
        props: { isGraphActive: false },
      })

      expect(wrapper.text()).toContain('(1-2/20)')
    })
  })

  describe('ReaderSavedPagesModal', () => {
    it('renderiza lista de páginas marcadas e emite navegação', async () => {
      const store = useReaderStore()
      store.setDocument({
        type: 'pdf',
        metadata: { title: 'Livro' },
        totalPages: 10,
        isLoaded: true,
        load: vi.fn(),
        getPage: vi.fn(),
        destroy: vi.fn(),
      } as any, 'livro.pdf')
      store.bookmarks = [2, 5, 8]

      const wrapper = mount(ReaderSavedPagesModal, {
        props: { isOpen: true },
      })

      expect(wrapper.text()).toContain('Páginas Marcadas')
      expect(wrapper.text()).toContain('Página 2')
      expect(wrapper.text()).toContain('Página 5')
      expect(wrapper.text()).toContain('Página 8')

      // Clicar na página 5
      const pageBtn = wrapper.findAll('button').find((b) => b.text().includes('Página 5'))
      await pageBtn?.trigger('click')

      expect(store.currentPage).toBe(5)
      expect(wrapper.emitted('selectPage')?.[0]).toEqual([5])
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('permite remover bookmark da lista', async () => {
      const store = useReaderStore()
      store.bookmarks = [3, 7]

      const wrapper = mount(ReaderSavedPagesModal, {
        props: { isOpen: true },
      })

      const deleteBtns = wrapper.findAll('button[title="Remover marcação"]')
      expect(deleteBtns.length).toBe(2)
      await deleteBtns[0]?.trigger('click')

      expect(store.bookmarks).toEqual([7])
    })
  })

  describe('ReaderAnnotationModal', () => {
    it('preenche texto inicial e seleciona temas', async () => {
      const wrapper = mount(ReaderAnnotationModal, {
        props: {
          isOpen: true,
          initialText: 'Trecho interessante do capítulo 1',
          currentPage: 3,
          bookId: 1,
        },
      })

      expect(wrapper.text()).toContain('Nova Anotação')
      expect(wrapper.text()).toContain('Página 3')

      const textarea = wrapper.find('textarea')
      expect(textarea.element.value).toBe('Trecho interessante do capítulo 1')

      // Temas disponíveis
      expect(wrapper.text()).toContain('História Antiga')
      expect(wrapper.text()).toContain('Filosofia')

      // Clica no tema Filosofia (id: 2)
      const themeBtns = wrapper.findAll('button[type="button"]')
      const filosofiaBtn = themeBtns.find((b) => b.text().includes('Filosofia'))
      await filosofiaBtn?.trigger('click')

      // Digita anotação
      const noteTextarea = wrapper.findAll('textarea')[1]
      await noteTextarea?.setValue('Reflexão sobre filosofia grega')

      mockCreateAnnotation.mockResolvedValueOnce({
        id: 10,
        bookId: 1,
        cfi: 'page:3',
        selectedText: 'Trecho interessante do capítulo 1',
        note: 'Reflexão sobre filosofia grega',
        themes: [{ id: 2, name: 'Filosofia' }],
      })

      const submitBtn = wrapper.findAll('button').find((b) => b.text().includes('Salvar Anotação'))
      await submitBtn?.trigger('click')

      expect(mockCreateAnnotation).toHaveBeenCalledWith({
        bookId: 1,
        cfi: 'page:3',
        selectedText: 'Trecho interessante do capítulo 1',
        note: 'Reflexão sobre filosofia grega',
        themeIds: [2],
        chapterTitle: 'Página 3',
      })

      expect(wrapper.emitted('created')).toBeTruthy()
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })
})
