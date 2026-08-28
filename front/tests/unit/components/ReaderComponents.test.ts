import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ReaderBottomBar from '../../../app/components/reader/ReaderBottomBar.vue'
import ReaderSavedPagesModal from '../../../app/components/reader/ReaderSavedPagesModal.vue'
import ReaderAnnotationModal from '../../../app/components/reader/ReaderAnnotationModal.vue'
import ReaderAnnotationDrawer from '../../../app/components/reader/ReaderAnnotationDrawer.vue'
import HandwritingCanvas from '../../../app/components/reader/HandwritingCanvas.vue'
import ReaderSelectionTooltip from '../../../app/components/reader/ReaderSelectionTooltip.vue'
import ReaderTypographyPopover from '../../../app/components/reader/ReaderTypographyPopover.vue'
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
const mockCreateAnnotationWithOcr = vi.fn()
vi.mock('~/composables/useAnnotations', () => ({
  useAnnotations: () => ({
    annotations: { value: [] },
    loading: { value: false },
    fetchAnnotations: vi.fn().mockResolvedValue([]),
    createAnnotation: mockCreateAnnotation,
    createAnnotationWithOcr: mockCreateAnnotationWithOcr,
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

    it('alterna modo de 1 página e 2 páginas ao clicar no botão de layout', async () => {
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
      store.isTwoPageMode = false

      const wrapper = mount(ReaderBottomBar, {
        props: { isGraphActive: false },
      })

      const togglePageBtn = wrapper.find('button[aria-label="Alternar modo de páginas"]')
      expect(togglePageBtn.exists()).toBe(true)

      await togglePageBtn.trigger('click')
      expect(store.isTwoPageMode).toBe(true)

      await togglePageBtn.trigger('click')
      expect(store.isTwoPageMode).toBe(false)
    })

    it('exibe controle de tamanho de fonte para EPUB e permite alterar tamanho via popover', async () => {
      const store = useReaderStore()
      store.setDocument({
        type: 'epub',
        metadata: { title: 'Livro EPUB' },
        totalPages: 15,
        isLoaded: true,
        load: vi.fn(),
        getPage: vi.fn(),
        setFontSize: vi.fn((size: number) => 1),
        destroy: vi.fn(),
      } as any, 'livro.epub')
      store.fontSize = 18

      const wrapper = mount(ReaderBottomBar, {
        props: { isGraphActive: false },
      })

      const fontBtn = wrapper.find('#btn-appearance-toggle')
      expect(fontBtn.exists()).toBe(true)

      // Abre o popover
      await fontBtn.trigger('click')
      expect(wrapper.find('[aria-label="Controle de aparência e fundo de leitura"]').exists()).toBe(true)

      // Clica em A+
      const increaseBtn = wrapper.find('button[aria-label="Aumentar tamanho da fonte"]')
      expect(increaseBtn.exists()).toBe(true)
      await increaseBtn.trigger('click')
      expect(store.fontSize).toBe(20)

      // Clica em A-
      const decreaseBtn = wrapper.find('button[aria-label="Diminuir tamanho da fonte"]')
      expect(decreaseBtn.exists()).toBe(true)
      await decreaseBtn.trigger('click')
      expect(store.fontSize).toBe(18)

      // Clica em A+ novamente
      await increaseBtn.trigger('click')
      expect(store.fontSize).toBe(20)

      // Clica em Padrão
      const resetBtn = wrapper.findAll('button').find((b) => b.text() === 'Padrão')
      expect(resetBtn?.exists()).toBe(true)
      await resetBtn?.trigger('click')
      expect(store.fontSize).toBe(18)
    })

    it('possui tema amarelado (sepia) por padrão e permite alternar entre Branco, Amarelado e Preto', async () => {
      const store = useReaderStore()
      expect(store.readerTheme).toBe('sepia')

      const wrapper = mount(ReaderBottomBar, {
        props: { isGraphActive: false },
      })

      const appearanceBtn = wrapper.find('#btn-appearance-toggle')
      expect(appearanceBtn.exists()).toBe(true)

      // Abre popover de aparência
      await appearanceBtn.trigger('click')
      expect(wrapper.find('[aria-label="Controle de aparência e fundo de leitura"]').exists()).toBe(true)

      // Clica em Branco
      const brancoBtn = wrapper.find('button[title="Fundo branco claro"]')
      expect(brancoBtn.exists()).toBe(true)
      await brancoBtn.trigger('click')
      expect(store.readerTheme).toBe('white')
      expect(localStorage.getItem('aresta_reader_theme')).toBe('white')

      // Clica em Preto
      const pretoBtn = wrapper.find('button[title="Fundo preto noturno"]')
      expect(pretoBtn.exists()).toBe(true)
      await pretoBtn.trigger('click')
      expect(store.readerTheme).toBe('black')
      expect(localStorage.getItem('aresta_reader_theme')).toBe('black')

      // Clica em Amarelado (Livro)
      const amareladoBtn = wrapper.find('button[title="Fundo amarelado suave estilo livro físico"]')
      expect(amareladoBtn.exists()).toBe(true)
      await amareladoBtn.trigger('click')
      expect(store.readerTheme).toBe('sepia')
      expect(localStorage.getItem('aresta_reader_theme')).toBe('sepia')
    })

    it('alterna Modo Zen ao clicar no botão Zen', async () => {
      const store = useReaderStore()
      expect(store.isZenMode).toBe(false)

      const wrapper = mount(ReaderBottomBar, {
        props: { isGraphActive: false },
      })

      const zenBtn = wrapper.find('#btn-zen-mode')
      expect(zenBtn.exists()).toBe(true)

      await zenBtn.trigger('click')
      expect(store.isZenMode).toBe(true)

      await zenBtn.trigger('click')
      expect(store.isZenMode).toBe(false)
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

  describe('ReaderSelectionTooltip', () => {
    it('renderiza botões de anotação e cópia quando visible é true', () => {
      const wrapper = mount(ReaderSelectionTooltip, {
        props: {
          visible: true,
          x: 250,
          y: 300,
          selectedText: 'Texto selecionado para anotação',
          pageNumber: 4,
          isAbove: true,
        },
      })

      expect(wrapper.text()).toContain('Anotar')
      expect(wrapper.text()).toContain('Copiar')
      expect(wrapper.find('.reader-selection-tooltip').exists()).toBe(true)
    })

    it('não renderiza conteúdo quando visible é false', () => {
      const wrapper = mount(ReaderSelectionTooltip, {
        props: {
          visible: false,
          x: 250,
          y: 300,
          selectedText: '',
        },
      })

      expect(wrapper.find('.reader-selection-tooltip').exists()).toBe(false)
    })

    it('emite evento annotate com o texto e página corretos ao clicar em Anotar', async () => {
      const wrapper = mount(ReaderSelectionTooltip, {
        props: {
          visible: true,
          x: 250,
          y: 300,
          selectedText: 'Trecho importante de teste',
          pageNumber: 7,
          isAbove: true,
        },
      })

      const annotateBtn = wrapper.findAll('button').find((b) => b.text().includes('Anotar'))
      expect(annotateBtn?.exists()).toBe(true)
      await annotateBtn?.trigger('click')

      expect(wrapper.emitted('annotate')?.[0]).toEqual([
        { text: 'Trecho importante de teste', pageNumber: 7 },
      ])
    })

    it('copia o texto selecionado e altera o estado do botão para Copiado!', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: writeTextMock,
        },
        configurable: true,
        writable: true,
      })

      const wrapper = mount(ReaderSelectionTooltip, {
        props: {
          visible: true,
          x: 250,
          y: 300,
          selectedText: 'Texto a ser copiado',
          pageNumber: 2,
        },
      })

      const copyBtn = wrapper.findAll('button').find((b) => b.text().includes('Copiar'))
      expect(copyBtn?.exists()).toBe(true)
      await copyBtn?.trigger('click')

      expect(writeTextMock).toHaveBeenCalledWith('Texto a ser copiado')
      expect(wrapper.text()).toContain('Copiado!')
    })
  })

  describe('ReaderAnnotationDrawer', () => {
    it('renderiza o drawer lateral com alternador de modo e temas', async () => {
      const wrapper = mount(ReaderAnnotationDrawer, {
        props: {
          isOpen: true,
          initialText: 'Trecho do livro no drawer',
          currentPage: 5,
          bookId: 1,
          initialMode: 'type',
        },
      })

      expect(wrapper.text()).toContain('Painel de Escrita & Anotação')
      expect(wrapper.text()).toContain('Digitação')
      expect(wrapper.text()).toContain('Desenho / Caneta (OCR)')
      expect(wrapper.text()).toContain('História Antiga')

      // Preenche nota no modo digitação
      const noteTextarea = wrapper.findAll('textarea')[1]
      await noteTextarea?.setValue('Nota digitada no painel expandido')

      mockCreateAnnotation.mockResolvedValueOnce({
        id: 11,
        bookId: 1,
        cfi: 'page:5',
        selectedText: 'Trecho do livro no drawer',
        note: 'Nota digitada no painel expandido',
        themes: [],
      })

      const submitBtn = wrapper.findAll('button').find((b) => b.text().includes('Salvar Anotação'))
      await submitBtn?.trigger('click')

      expect(mockCreateAnnotation).toHaveBeenCalledWith(
        expect.objectContaining({
          bookId: 1,
          cfi: 'page:5',
          selectedText: 'Trecho do livro no drawer',
          note: 'Nota digitada no painel expandido',
        })
      )
      expect(wrapper.emitted('created')).toBeTruthy()
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('emite evento expand na modal de anotações ao clicar no botão Modo Caneta', async () => {
      const wrapper = mount(ReaderAnnotationModal, {
        props: {
          isOpen: true,
          currentPage: 3,
          bookId: 1,
        },
      })

      const expandBtn = wrapper.find('button[title="Expandir tela / Modo Caneta (OCR)"]')
      expect(expandBtn.exists()).toBe(true)
      await expandBtn.trigger('click')

      expect(wrapper.emitted('expand')).toBeTruthy()
    })
  })

  describe('ReaderTypographyPopover', () => {
    it('renderiza opções de fundo de leitura (Amarelado, Branco, Preto) e altera o tema na store', async () => {
      const store = useReaderStore()
      expect(store.readerTheme).toBe('sepia')

      const wrapper = mount(ReaderTypographyPopover, {
        props: { isOpen: true },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      expect(wrapper.text()).toContain('Fundo da Leitura')
      expect(wrapper.text()).toContain('Amarelado')
      expect(wrapper.text()).toContain('Branco')
      expect(wrapper.text()).toContain('Preto')

      // Clicar em Branco
      const brancoBtn = wrapper.find('button[title="Fundo branco claro"]')
      expect(brancoBtn.exists()).toBe(true)
      await brancoBtn.trigger('click')
      expect(store.readerTheme).toBe('white')

      // Clicar em Preto
      const pretoBtn = wrapper.find('button[title="Fundo preto para leitura noturna"]')
      expect(pretoBtn.exists()).toBe(true)
      await pretoBtn.trigger('click')
      expect(store.readerTheme).toBe('black')

      // Clicar em Amarelado
      const amareladoBtn = wrapper.find('button[title="Fundo amarelado suave estilo livro físico"]')
      expect(amareladoBtn.exists()).toBe(true)
      await amareladoBtn.trigger('click')
      expect(store.readerTheme).toBe('sepia')
    })
  })
})

