import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ReaderBookNotesPanel from '~/components/reader/ReaderBookNotesPanel.vue'
import { useReaderStore } from '~/stores/readerStore'

const mockAnnotations = [
  {
    id: 1,
    userId: 1,
    bookId: 10,
    bookTitle: 'Dom Casmurro',
    cfi: 'page:5',
    chapterTitle: 'Página 5',
    selectedText: 'Capitu olhou para mim com olhos de ressaca.',
    note: 'Metáfora central do livro sobre mistério e atração.',
    progress: 25,
    themes: [{ id: 1, name: 'Ciúme' }, { id: 2, name: 'Amor' }],
    createdAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 2,
    userId: 1,
    bookId: 10,
    bookTitle: 'Dom Casmurro',
    cfi: 'page:12',
    chapterTitle: 'Página 12',
    selectedText: null,
    note: 'Reflexão geral sem citação direta.',
    progress: 60,
    themes: [],
    createdAt: '2026-09-02T15:00:00.000Z',
  },
]

const mockFetchAnnotations = vi.fn().mockResolvedValue(mockAnnotations)
const mockCreateAnnotation = vi.fn().mockResolvedValue({ id: 3, note: 'Nota rápida' })
const mockUpdateAnnotationNote = vi.fn().mockResolvedValue({ id: 1, note: 'Nota editada' })
const mockDeleteAnnotation = vi.fn().mockResolvedValue(true)
const mockConvertAnnotationToFlashcard = vi.fn().mockResolvedValue({ id: 99 })

vi.mock('~/composables/useAnnotations', () => ({
  useAnnotations: () => ({
    annotations: { value: [...mockAnnotations] },
    loading: { value: false },
    error: { value: null },
    fetchAnnotations: mockFetchAnnotations,
    createAnnotation: mockCreateAnnotation,
    updateAnnotationNote: mockUpdateAnnotationNote,
    deleteAnnotation: mockDeleteAnnotation,
    convertAnnotationToFlashcard: mockConvertAnnotationToFlashcard,
  }),
}))

describe('ReaderBookNotesPanel Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renderiza título do painel e nome do livro corretamente', () => {
    const store = useReaderStore()
    store.setDocument({
      type: 'pdf',
      metadata: { title: 'Dom Casmurro' },
      totalPages: 100,
      isLoaded: true,
      load: vi.fn(),
      getPage: vi.fn(),
      destroy: vi.fn(),
    } as any, 'dom-casmurro.pdf')
    store.bookId = 10

    const wrapper = mount(ReaderBookNotesPanel, {
      props: {
        bookId: 10,
        bookTitle: 'Dom Casmurro',
        theme: 'sepia',
      },
    })

    expect(wrapper.text()).toContain('Notas do Livro')
    expect(wrapper.text()).toContain('Dom Casmurro')
    expect(wrapper.text()).toContain('2') // contador de notas
  })

  it('emite evento close ao clicar no botão fechar', async () => {
    const wrapper = mount(ReaderBookNotesPanel, {
      props: {
        bookId: 10,
        isMobile: false,
      },
    })

    const closeBtn = wrapper.find('button[aria-label="Fechar painel de notas"]')
    expect(closeBtn.exists()).toBe(true)
    await closeBtn.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emite evento openAnnotationModal ao clicar no botão Anotar no topo', async () => {
    const wrapper = mount(ReaderBookNotesPanel, {
      props: {
        bookId: 10,
      },
    })

    const annotateBtn = wrapper.find('button[aria-label="Nova anotação"]')
    expect(annotateBtn.exists()).toBe(true)
    await annotateBtn.trigger('click')
    expect(wrapper.emitted('openAnnotationModal')).toBeTruthy()
  })

  it('exibe citações e notas da lista', () => {
    const wrapper = mount(ReaderBookNotesPanel, {
      props: {
        bookId: 10,
      },
    })

    expect(wrapper.text()).toContain('Capitu olhou para mim com olhos de ressaca.')
    expect(wrapper.text()).toContain('Metáfora central do livro sobre mistério e atração.')
    expect(wrapper.text()).toContain('#Ciúme')
    expect(wrapper.text()).toContain('Reflexão geral sem citação direta.')
  })

  it('filtra notas pelo campo de busca', async () => {
    const wrapper = mount(ReaderBookNotesPanel, {
      props: {
        bookId: 10,
      },
    })

    const input = wrapper.find('input[placeholder="Buscar nas notas ou citações..."]')
    expect(input.exists()).toBe(true)

    await input.setValue('Capitu')
    expect(wrapper.text()).toContain('Capitu olhou para mim')
    expect(wrapper.text()).not.toContain('Reflexão geral sem citação direta.')

    await input.setValue('termo_inexistente_xyz')
    expect(wrapper.text()).toContain('Nenhuma anotação encontrada')
  })

  it('filtra por categoria ao clicar nos chips (Com Citação vs Anotações Soltas)', async () => {
    const wrapper = mount(ReaderBookNotesPanel, {
      props: {
        bookId: 10,
      },
    })

    // Clica no filtro Com Citação
    const quoteFilterBtn = wrapper.findAll('button').find((b) => b.text().includes('Com Citação'))
    expect(quoteFilterBtn).toBeDefined()
    await quoteFilterBtn!.trigger('click')

    expect(wrapper.text()).toContain('Capitu olhou para mim')
    expect(wrapper.text()).not.toContain('Reflexão geral sem citação direta.')

    // Clica no filtro Anotações Soltas
    const looseFilterBtn = wrapper.findAll('button').find((b) => b.text().includes('Anotações Soltas'))
    expect(looseFilterBtn).toBeDefined()
    await looseFilterBtn!.trigger('click')

    expect(wrapper.text()).not.toContain('Capitu olhou para mim')
    expect(wrapper.text()).toContain('Reflexão geral sem citação direta.')
  })

  it('navega para a página ao clicar no badge de página', async () => {
    const store = useReaderStore()
    store.setDocument({
      type: 'pdf',
      metadata: { title: 'Dom Casmurro' },
      totalPages: 100,
      isLoaded: true,
      load: vi.fn(),
      getPage: vi.fn(),
      destroy: vi.fn(),
    } as any, 'dom-casmurro.pdf')

    const wrapper = mount(ReaderBookNotesPanel, {
      props: {
        bookId: 10,
      },
    })

    const pageBtn = wrapper.find('button[title="Clique para ir para esta página no livro"]')
    expect(pageBtn.exists()).toBe(true)
    await pageBtn.trigger('click')

    expect(wrapper.emitted('goToPage')).toBeTruthy()
    expect(wrapper.emitted('goToPage')![0]).toEqual([5])
    expect(store.currentPage).toBe(5)
  })

  it('permite abrir o modo de edição de uma nota e salvar alterações', async () => {
    const wrapper = mount(ReaderBookNotesPanel, {
      props: {
        bookId: 10,
      },
    })

    const editBtn = wrapper.find('button[aria-label="Editar anotação"]')
    expect(editBtn.exists()).toBe(true)
    await editBtn.trigger('click')

    const textarea = wrapper.find('textarea[placeholder="Escreva sua reflexão ou insight..."]')
    expect(textarea.exists()).toBe(true)
    await textarea.setValue('Nova versão editada da reflexão.')

    const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Salvar Nota'))
    expect(saveBtn).toBeDefined()
    await saveBtn!.trigger('click')

    expect(mockUpdateAnnotationNote).toHaveBeenCalledWith(1, 'Nova versão editada da reflexão.')
  })

  it('permite transformar uma anotação em flashcard', async () => {
    const wrapper = mount(ReaderBookNotesPanel, {
      props: {
        bookId: 10,
      },
    })

    const flashcardBtn = wrapper.find('button[aria-label="Gerar Flashcard"]')
    expect(flashcardBtn.exists()).toBe(true)
    await flashcardBtn.trigger('click')

    expect(mockConvertAnnotationToFlashcard).toHaveBeenCalled()
  })

  it('permite excluir uma anotação após confirmação', async () => {
    const wrapper = mount(ReaderBookNotesPanel, {
      props: {
        bookId: 10,
      },
    })

    const deleteBtn = wrapper.find('button[aria-label="Excluir anotação"]')
    expect(deleteBtn.exists()).toBe(true)
    await deleteBtn.trigger('click')

    // Botão de confirmação "Excluir?"
    const confirmBtn = wrapper.findAll('button').find((b) => b.text().includes('Excluir?'))
    expect(confirmBtn).toBeDefined()
    await confirmBtn!.trigger('click')

    expect(mockDeleteAnnotation).toHaveBeenCalledWith(1)
  })

  it('permite criar nota rápida no rodapé do painel', async () => {
    const store = useReaderStore()
    store.currentPage = 7
    store.bookId = 10

    const wrapper = mount(ReaderBookNotesPanel, {
      props: {
        bookId: 10,
      },
    })

    const openQuickBtn = wrapper.findAll('button').find((b) => b.text().includes('Escrever reflexão rápida'))
    expect(openQuickBtn).toBeDefined()
    await openQuickBtn!.trigger('click')

    const textarea = wrapper.find('textarea[placeholder="Escreva sua reflexão ou síntese rápida..."]')
    expect(textarea.exists()).toBe(true)
    await textarea.setValue('Insight rápido capturado na página 7.')

    const sendBtn = wrapper.findAll('button').find((b) => b.text().includes('Salvar'))
    expect(sendBtn).toBeDefined()
    await sendBtn!.trigger('click')

    expect(mockCreateAnnotation).toHaveBeenCalledWith(expect.objectContaining({
      bookId: 10,
      cfi: 'page:7',
      chapterTitle: 'Página 7',
      note: 'Insight rápido capturado na página 7.',
    }))
  })
})
