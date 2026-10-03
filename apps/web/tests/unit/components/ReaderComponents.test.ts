import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ReaderBottomBar from '../../../app/components/reader/ReaderBottomBar.vue'
import ReaderSavedPagesModal from '../../../app/components/reader/ReaderSavedPagesModal.vue'
import ReaderAnnotationModal from '../../../app/components/reader/ReaderAnnotationModal.vue'
import ReaderSelectionTooltip from '../../../app/components/reader/ReaderSelectionTooltip.vue'
import ReaderTypographyPopover from '../../../app/components/reader/ReaderTypographyPopover.vue'
import ReaderViewer from '../../../app/components/reader/Viewer.vue'
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
    it('renderiza o bloco harmonioso de 6 ícones (voltar, zen mode, zoom e anotações/configurações) sem elementos de bookmark', async () => {
      const store = useReaderStore()
      store.currentPage = 4
      const wrapper = mount(ReaderBottomBar, {
        props: { isNotesActive: false, isZenMode: false },
      })

      // Verifica presença dos 6 botões estruturados no grid 2x3
      const closeBtn = wrapper.find('#btn-close-book')
      const fontDecreaseBtn = wrapper.find('#btn-font-decrease')
      const fontIncreaseBtn = wrapper.find('#btn-font-increase')
      const zenBtn = wrapper.find('#btn-bottom-zen-mode')
      const notesBtn = wrapper.find('#btn-view-notes')
      const appearanceBtn = wrapper.find('#btn-appearance-toggle')

      expect(closeBtn.exists()).toBe(true)
      expect(fontDecreaseBtn.exists()).toBe(true)
      expect(fontIncreaseBtn.exists()).toBe(true)
      expect(zenBtn.exists()).toBe(true)
      expect(notesBtn.exists()).toBe(true)
      expect(appearanceBtn.exists()).toBe(true)

      // Garante que nenhum elemento de bookmark existe na barra
      expect(wrapper.find('#btn-bookmark-toggle').exists()).toBe(false)
      expect(wrapper.find('button[aria-label="Marcar ou desmarcar página"]').exists()).toBe(false)

      // Abre popover de configurações
      await appearanceBtn.trigger('click')

      // Garante que marcadores foram removidos de configurações também
      expect(wrapper.find('#btn-bookmarks-menu').exists()).toBe(false)
      expect(wrapper.find('#btn-open-saved-pages').exists()).toBe(false)
      expect(wrapper.text()).not.toContain('Marcadores de Página')
    })

    it('emite eventos corretos ao clicar nos botões de voltar, alternar modo zen e anotação', async () => {
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
        props: { isNotesActive: true, isZenMode: false },
      })

      // 1. Botão Voltar (Sair)
      const closeBtn = wrapper.find('#btn-close-book')
      expect(closeBtn.exists()).toBe(true)
      await closeBtn.trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()

      // 2. Botão Alternar Modo Zen
      const zenBtn = wrapper.find('#btn-bottom-zen-mode')
      expect(zenBtn.exists()).toBe(true)
      await zenBtn.trigger('click')
      expect(wrapper.emitted('toggleZenMode')).toBeTruthy()

      // 3. Botão Anotações do Livro
      const notesBtn = wrapper.find('#btn-view-notes')
      expect(notesBtn.exists()).toBe(true)
      await notesBtn.trigger('click')
      expect(wrapper.emitted('toggleNotes')).toBeTruthy()

      // 4. Popover de Configurações
      const settingsBtn = wrapper.find('#btn-appearance-toggle')
      expect(settingsBtn.exists()).toBe(true)
      await settingsBtn.trigger('click')

      // Verifica exibição do progresso por página (Pág. 5-6/20) e porcentagem
      expect(wrapper.text()).toContain('Pág. 5-6/20')
      expect(wrapper.text()).toContain('%')
    })

    it('permite alterar tamanho da fonte diretamente pelos botões de zoom na barra inferior', async () => {
      const store = useReaderStore()
      store.currentPage = 7
      store.fontSize = 16

      const wrapper = mount(ReaderBottomBar, {
        props: { isNotesActive: false },
      })

      // 1. Botão de Aumentar Tamanho da Fonte (Zoom In)
      const fontIncreaseBtn = wrapper.find('#btn-font-increase')
      expect(fontIncreaseBtn.exists()).toBe(true)
      await fontIncreaseBtn.trigger('click')
      expect(store.fontSize).toBe(18)

      // 2. Botão de Diminuir Tamanho da Fonte (Zoom Out)
      const fontDecreaseBtn = wrapper.find('#btn-font-decrease')
      expect(fontDecreaseBtn.exists()).toBe(true)
      await fontDecreaseBtn.trigger('click')
      expect(store.fontSize).toBe(16)
    })

    it('renderiza barra lateral no desktop e barra inferior no mobile com capa e controles', async () => {
      // 1. Cenário Desktop (Horizontal)
      const desktopWrapper = mount(ReaderBottomBar, {
        props: {
          isHorizontal: true,
          coverUrl: '/covers/livro.jpg',
          bookLeft: 240,
          bookWidth: 800,
        },
      })

      const desktopSidebar = desktopWrapper.find('aside.reader-lateral-bar')
      expect(desktopSidebar.exists()).toBe(true)
      expect(desktopSidebar.find('img[src="/covers/livro.jpg"]').exists()).toBe(true)
      expect(desktopSidebar.find('#btn-close-book').exists()).toBe(true)
      expect(desktopSidebar.find('#btn-appearance-toggle').exists()).toBe(true)

      // 2. Cenário Mobile (largura da janela < 768px / Vertical)
      const originalInnerWidth = window.innerWidth
      try {
        window.innerWidth = 390
        window.dispatchEvent(new Event('resize'))

        const mobileWrapper = mount(ReaderBottomBar, {
          props: {
            isHorizontal: false,
            coverUrl: '/covers/livro.jpg',
            bookLeft: 240,
          },
        })

        const mobileFooter = mobileWrapper.find('footer.reader-unified-bottom-bar')
        expect(mobileFooter.exists()).toBe(true)
        const mobileContainer = mobileFooter.find('div')
        expect(mobileContainer.exists()).toBe(true)
        const mobileStyle = mobileContainer.attributes('style') || ''
        expect(mobileStyle).toContain('padding-left: 8px')
        expect(mobileStyle).toContain('justify-content: flex-start')
        expect(mobileFooter.find('img[src="/covers/livro.jpg"]').exists()).toBe(true)
        expect(mobileFooter.find('#btn-close-book').exists()).toBe(true)
      } finally {
        window.innerWidth = originalInnerWidth
        window.dispatchEvent(new Event('resize'))
      }
    })

    it('em telas horizontais exibe a barra lateral com capa e 6 botões; em telas verticais exibe na barra inferior', async () => {
      // 1. Em tela horizontal (isHorizontal = true)
      const horizontalBar = mount(ReaderBottomBar, {
        props: {
          isHorizontal: true,
          coverUrl: '/covers/livro.jpg',
          bookLeft: 220,
        },
      })
      // Na barra lateral, a capa e os 6 botões existem
      expect(horizontalBar.find('aside.reader-lateral-bar').exists()).toBe(true)
      expect(horizontalBar.find('img[src="/covers/livro.jpg"]').exists()).toBe(true)
      expect(horizontalBar.find('#btn-close-book').exists()).toBe(true)
      expect(horizontalBar.find('#btn-view-notes').exists()).toBe(true)
      expect(horizontalBar.find('#btn-font-decrease').exists()).toBe(true)
      expect(horizontalBar.find('#btn-font-increase').exists()).toBe(true)
      expect(horizontalBar.find('#btn-bottom-zen-mode').exists()).toBe(true)
      expect(horizontalBar.find('#btn-appearance-toggle').exists()).toBe(true)

      // 2. Em tela vertical (isHorizontal = false)
      const verticalBar = mount(ReaderBottomBar, {
        props: {
          isHorizontal: false,
          coverUrl: '/covers/livro.jpg',
          bookLeft: 220,
        },
      })
      // Na vertical, renderiza footer com capa e os 6 botões
      expect(verticalBar.find('footer.reader-unified-bottom-bar').exists()).toBe(true)
      expect(verticalBar.find('img[src="/covers/livro.jpg"]').exists()).toBe(true)
      expect(verticalBar.find('#btn-close-book').exists()).toBe(true)
      expect(verticalBar.find('#btn-appearance-toggle').exists()).toBe(true)
    })

    it('alterna modo de 1 página e 2 páginas no popover de configurações', async () => {
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

      const appearanceBtn = wrapper.find('#btn-appearance-toggle')
      expect(appearanceBtn.exists()).toBe(true)
      await appearanceBtn.trigger('click')

      const setTwoPageBtn = wrapper.find('#btn-set-two-page')
      expect(setTwoPageBtn.exists()).toBe(true)
      await setTwoPageBtn.trigger('click')
      expect(store.isTwoPageMode).toBe(true)

      const setOnePageBtn = wrapper.find('#btn-set-one-page')
      expect(setOnePageBtn.exists()).toBe(true)
      await setOnePageBtn.trigger('click')
      expect(store.isTwoPageMode).toBe(false)
    })

    it('permite alterar tamanho de fonte, modo de leitura, largura e modo foco no popover de configurações', async () => {
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

      const wrapper = mount(ReaderBottomBar, {
        props: { isGraphActive: false },
      })

      const settingsBtn = wrapper.find('#btn-appearance-toggle')
      expect(settingsBtn.exists()).toBe(true)

      // Abre o popover de configurações
      await settingsBtn.trigger('click')
      expect(wrapper.find('[aria-label="Controle de aparência e fundo de leitura"]').exists()).toBe(true)

      // Testa aumento e diminuição do tamanho da fonte
      const initialFontSize = store.fontSize || 15
      expect(initialFontSize).toBe(15)
      const increaseFontBtn = wrapper.find('#btn-increase-font-size')
      expect(increaseFontBtn.exists()).toBe(true)
      await increaseFontBtn.trigger('click')
      expect(store.fontSize).toBe(initialFontSize + 2)

      const decreaseFontBtn = wrapper.find('#btn-decrease-font-size')
      expect(decreaseFontBtn.exists()).toBe(true)
      await decreaseFontBtn.trigger('click')
      expect(store.fontSize).toBe(initialFontSize)

      // Botão de 15px do meio foi removido; reset de fonte é testado no store
      await increaseFontBtn.trigger('click')
      expect(store.fontSize).toBe(17)
      expect(wrapper.find('#btn-reset-font-size').exists()).toBe(false)
      store.resetFontSize()
      expect(store.fontSize).toBe(15)

      // Testa alternância de Scroll vs Páginas
      const scrollModeBtn = wrapper.find('#btn-mode-scroll')
      expect(scrollModeBtn.exists()).toBe(true)
      await scrollModeBtn.trigger('click')
      expect(store.readingMode).toBe('scroll')

      const paginatedModeBtn = wrapper.find('#btn-mode-paginated')
      expect(paginatedModeBtn.exists()).toBe(true)
      await paginatedModeBtn.trigger('click')
      expect(store.readingMode).toBe('paginated')

      // Testa alternância de largura Centralizado vs 100% Largo
      const widthWideBtn = wrapper.find('#btn-width-wide')
      expect(widthWideBtn.exists()).toBe(true)
      await widthWideBtn.trigger('click')
      expect(store.readerWidthMode).toBe('wide')

      const widthCenteredBtn = wrapper.find('#btn-width-centered')
      expect(widthCenteredBtn.exists()).toBe(true)
      await widthCenteredBtn.trigger('click')
      expect(store.readerWidthMode).toBe('centered')

      // Testa Modo Foco dentro do popover
      const toggleFocusBtn = wrapper.find('#btn-toggle-focus-inside-popover')
      expect(toggleFocusBtn.exists()).toBe(true)
      await toggleFocusBtn.trigger('click')
      expect(store.isFocusMode).toBe(true)
      await toggleFocusBtn.trigger('click')
      expect(store.isFocusMode).toBe(false)
    })

    it('não exibe opções de modo largo quando o documento for PDF e impede ativação no store', async () => {
      const store = useReaderStore()
      store.setDocument({
        type: 'pdf',
        metadata: { title: 'Livro PDF' },
        totalPages: 10,
        isLoaded: true,
        load: vi.fn(),
        getPage: vi.fn(),
        destroy: vi.fn(),
      } as any, 'documento.pdf')

      const wrapper = mount(ReaderBottomBar, {
        props: { isNotesActive: false },
      })

      const settingsBtn = wrapper.find('#btn-appearance-toggle')
      await settingsBtn.trigger('click')

      // Em PDF, os botões de modo largo e centralizado não devem existir
      expect(wrapper.find('#btn-width-wide').exists()).toBe(false)
      expect(wrapper.find('#btn-width-centered').exists()).toBe(false)

      // Store não deve permitir modo wide para PDF
      store.setReaderWidthMode('wide')
      expect(store.readerWidthMode).toBe('centered')
      store.toggleReaderWidthMode()
      expect(store.readerWidthMode).toBe('centered')
    })

    it('adota barra unificada inferior ocupando 20% da altura em telas verticais/mobile', () => {
      const wrapper = mount(ReaderBottomBar, {
        props: { isNotesActive: false, isHorizontal: false },
      })

      const footer = wrapper.find('footer')
      expect(footer.exists()).toBe(true)
      expect(footer.classes()).toContain('reader-unified-bottom-bar')
      expect(footer.classes()).toContain('shrink-0')
      expect(footer.classes()).toContain('w-full')
    })

    it('identifica corretamente a prioridade de tipografia: livro específico > configuração global > padrão 15px', () => {
      const store = useReaderStore()
      localStorage.clear()

      // 1. Sem nada salvo -> Padrão 15px
      store.setDocument({
        type: 'epub',
        metadata: { title: 'Livro Padrão' },
        totalPages: 10,
        isLoaded: true,
        load: vi.fn(),
        getPage: vi.fn(),
        setFontSize: vi.fn(),
        destroy: vi.fn(),
      } as any, 'padrao.epub', 101)
      expect(store.fontSize).toBe(15)

      // 2. Com configuração global (ex: 20px) e livro sem customização -> 20px
      localStorage.setItem('aresta_settings', JSON.stringify({ epubFontSize: 20 }))
      store.setDocument({
        type: 'epub',
        metadata: { title: 'Livro Sem Custom' },
        totalPages: 10,
        isLoaded: true,
        load: vi.fn(),
        getPage: vi.fn(),
        setFontSize: vi.fn(),
        destroy: vi.fn(),
      } as any, 'outro.epub', 102)
      expect(store.fontSize).toBe(20)

      // 3. Com tamanho customizado especificamente para o livro 103 (ex: 24px) -> 24px
      localStorage.setItem('aresta_book_103_fontsize', '24')
      store.setDocument({
        type: 'epub',
        metadata: { title: 'Livro Custom' },
        totalPages: 10,
        isLoaded: true,
        load: vi.fn(),
        getPage: vi.fn(),
        setFontSize: vi.fn(),
        destroy: vi.fn(),
      } as any, 'custom.epub', 103)
      expect(store.fontSize).toBe(24)

      // 4. Ao alterar o tamanho da fonte do livro 103 para 26px, salva em aresta_book_103_fontsize
      store.setFontSize(26)
      expect(store.fontSize).toBe(26)
      expect(localStorage.getItem('aresta_book_103_fontsize')).toBe('26')
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

    it('não exibe barra superior e gerencia Modo Zen e retorno através da barra inferior', async () => {
      const store = useReaderStore()
      expect(store.isZenMode).toBe(false)

      const wrapper = mount(ReaderViewer, {
        global: {
          stubs: {
            ReaderEnginePageCurlCanvas: true,
            ReaderBookNotesPanel: true,
            ReaderGraphPanel: true,
            ReaderBottomBar: true,
            ReaderSavedPagesModal: true,
            ReaderAnnotationModal: true,
            ReaderAnnotationDrawer: true,
            ReaderTypographyPopover: true,
            ReaderSelectionTooltip: true,
            ReaderDictionaryCard: true,
          },
        },
      })

      // Barra superior e botões antigos do topo não devem existir
      expect(wrapper.find('.reader-viewer__top-bar').exists()).toBe(false)
      expect(wrapper.find('#btn-zen-mode').exists()).toBe(false)

      // A alternância de Modo Zen agora é disparada pela barra inferior
      const bottomBarStub = wrapper.findComponent({ name: 'ReaderBottomBar' })
      expect(bottomBarStub.exists()).toBe(true)

      bottomBarStub.vm.$emit('toggle-zen-mode')
      expect(store.isZenMode).toBe(true)

      // No modo Zen, a barra inferior é ocultada para leitura 100% imersiva
      await wrapper.vm.$nextTick()
      expect(wrapper.findComponent({ name: 'ReaderBottomBar' }).exists()).toBe(false)

      // Sai do Modo Zen
      store.setZenMode(false)
      await wrapper.vm.$nextTick()
      expect(wrapper.findComponent({ name: 'ReaderBottomBar' }).exists()).toBe(true)
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
    it('permite escolher cor e salvar anotação com tema', async () => {
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

      // Inicialmente o campo de nota fica oculto até o usuário optar por anotar
      expect(wrapper.find('[data-testid="annotation-note-textarea"]').exists()).toBe(false)

      // Seleciona uma cor (Amarelo Ouro #F59E0B)
      const yellowBtn = wrapper.find('button[aria-label="Cor Amarelo Ouro"]')
      expect(yellowBtn.exists()).toBe(true)
      await yellowBtn.trigger('click')

      // Clica no toggle para desejar fazer uma anotação escrita
      const toggle = wrapper.find('[data-testid="toggle-want-note"]')
      await toggle.trigger('click')

      // Agora o textarea de reflexão/nota aparece
      const noteTextarea = wrapper.find('[data-testid="annotation-note-textarea"]')
      expect(noteTextarea.exists()).toBe(true)
      await noteTextarea.setValue('Reflexão sobre filosofia grega')

      // Abre temas do grafo
      const themeSectionBtn = wrapper.findAll('button').find((b) => b.text().includes('Temas no Grafo'))
      await themeSectionBtn?.trigger('click')

      // Clica no tema Filosofia (id: 2)
      const themeBtns = wrapper.findAll('button[type="button"]')
      const filosofiaBtn = themeBtns.find((b) => b.text().includes('Filosofia'))
      await filosofiaBtn?.trigger('click')

      mockCreateAnnotation.mockResolvedValueOnce({
        id: 10,
        bookId: 1,
        cfi: 'page:3',
        selectedText: 'Trecho interessante do capítulo 1',
        note: 'Reflexão sobre filosofia grega',
        color: '#F59E0B',
        themes: [{ id: 2, name: 'Filosofia' }],
      })

      const submitBtn = wrapper.findAll('button').find((b) => b.text().includes('Salvar Anotação'))
      await submitBtn?.trigger('click')

      expect(mockCreateAnnotation).toHaveBeenCalledWith({
        bookId: 1,
        bookTitle: 'Obra Sem Título',
        cfi: 'page:3#color=F59E0B',
        selectedText: 'Trecho interessante do capítulo 1',
        note: 'Reflexão sobre filosofia grega',
        color: '#F59E0B',
        themeIds: [2],
        chapterTitle: 'Página 3',
        generateFlashcard: false,
        noteId: undefined,
      })

      expect(wrapper.emitted('created')).toBeTruthy()
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('salva apenas como destaque com cor selecionada quando não deseja anotação escrita', async () => {
      const wrapper = mount(ReaderAnnotationModal, {
        props: {
          isOpen: true,
          initialText: 'Citação direta para marcação',
          currentPage: 5,
          bookId: 1,
        },
      })

      // Não há textarea aberto para nota inicialmente
      expect(wrapper.find('[data-testid="annotation-note-textarea"]').exists()).toBe(false)
      expect(wrapper.text()).toContain('Salvar Destaque')

      // Seleciona cor Verde Menta (#10B981)
      const greenBtn = wrapper.find('button[aria-label="Cor Verde Menta"]')
      expect(greenBtn.exists()).toBe(true)
      await greenBtn.trigger('click')

      mockCreateAnnotation.mockResolvedValueOnce({
        id: 11,
        bookId: 1,
        cfi: 'page:5#color=10B981',
        selectedText: 'Citação direta para marcação',
        note: null,
        color: '#10B981',
        themes: [],
      })

      const saveBtn = wrapper.findAll('button').find((b) => b.text().includes('Salvar Destaque'))
      await saveBtn?.trigger('click')

      expect(mockCreateAnnotation).toHaveBeenCalledWith({
        bookId: 1,
        bookTitle: 'Obra Sem Título',
        cfi: 'page:5#color=10B981',
        selectedText: 'Citação direta para marcação',
        note: null,
        color: '#10B981',
        themeIds: [],
        chapterTitle: 'Página 5',
        generateFlashcard: false,
        noteId: undefined,
      })
    })

    it('alterna as caixinhas minimalistas de anotação e flashcard entre apagado e laranja nítido', async () => {
      const wrapper = mount(ReaderAnnotationModal, {
        props: {
          isOpen: true,
          initialText: 'Trecho para caixinhas minimalistas',
          currentPage: 2,
          bookId: 1,
        },
      })

      const noteBox = wrapper.find('[data-testid="toggle-want-note"]')
      const flashcardBox = wrapper.find('[data-testid="toggle-want-flashcard"]')

      expect(noteBox.exists()).toBe(true)
      expect(flashcardBox.exists()).toBe(true)

      // Inicialmente ambas estão com estilo sutil/apagado
      expect(noteBox.classes()).toContain('text-zinc-500')
      expect(flashcardBox.classes()).toContain('text-zinc-500')
      expect(noteBox.classes()).not.toContain('text-orange-400')

      // Clica na caixinha de Anotação -> fica nítida em laranja
      await noteBox.trigger('click')
      expect(noteBox.classes()).toContain('text-orange-400')
      expect(noteBox.classes()).toContain('border-accent')

      // Clica na caixinha de Flashcard -> fica nítida em laranja
      await flashcardBox.trigger('click')
      expect(flashcardBox.classes()).toContain('text-orange-400')
      expect(flashcardBox.classes()).toContain('border-accent')

      // Clica novamente na caixinha de Anotação -> desativa e volta para cores apagadas
      await noteBox.trigger('click')
      expect(noteBox.classes()).toContain('text-zinc-500')
      expect(noteBox.classes()).not.toContain('text-orange-400')
    })

    it('inicia com caixinha de anotação ou flashcard ativada quando initialWantNote ou initialWantFlashcard for passado', async () => {
      const wrapper = mount(ReaderAnnotationModal, {
        props: {
          isOpen: true,
          initialText: 'Trecho com abertura pré-ativada',
          currentPage: 1,
          bookId: 1,
          initialWantNote: true,
          initialWantFlashcard: false,
        },
      })

      const noteBox = wrapper.find('[data-testid="toggle-want-note"]')
      const flashcardBox = wrapper.find('[data-testid="toggle-want-flashcard"]')

      expect(noteBox.classes()).toContain('text-orange-400')
      expect(flashcardBox.classes()).toContain('text-zinc-500')
      expect(wrapper.find('[data-testid="annotation-note-textarea"]').exists()).toBe(true)

      const wrapperFlashcard = mount(ReaderAnnotationModal, {
        props: {
          isOpen: true,
          initialText: 'Trecho para flashcard pré-ativado',
          currentPage: 1,
          bookId: 1,
          initialWantNote: false,
          initialWantFlashcard: true,
        },
      })

      const flashcardBoxActive = wrapperFlashcard.find('[data-testid="toggle-want-flashcard"]')
      expect(flashcardBoxActive.classes()).toContain('text-orange-400')
    })
  })

  describe('ReaderSelectionTooltip', () => {
    it('renderiza botão de anotação quando visible é true', () => {
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
      expect(wrapper.text()).not.toContain('Copiar')
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

    it('renderiza o botão de dicionário quando selecionada uma única palavra', () => {
      const wrapper = mount(ReaderSelectionTooltip, {
        props: {
          visible: true,
          x: 250,
          y: 300,
          selectedText: 'Arquitetura',
          pageNumber: 1,
        },
      })

      expect(wrapper.text()).toContain('Dicionário')
      expect(wrapper.text()).toContain('Anotar')
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

  describe('ReaderSelectionTooltip', () => {
    it('exibe o botão Dicionário quando o texto selecionado for uma única palavra', async () => {
      const wrapper = mount(ReaderSelectionTooltip, {
        props: {
          visible: true,
          x: 100,
          y: 200,
          selectedText: 'manuscript',
        },
      })

      const dictBtn = wrapper.find('button[title="Consultar no Dicionário Offline"]')
      expect(dictBtn.exists()).toBe(true)
      expect(dictBtn.text()).toContain('Dicionário')

      await dictBtn.trigger('click')
      expect(wrapper.emitted('open-dictionary')).toBeTruthy()
      expect(wrapper.emitted('open-dictionary')![0]).toEqual([{
        word: 'manuscript',
        pageNumber: 1,
      }])
    })

    it('não exibe o botão Dicionário quando a seleção tiver múltiplas palavras', async () => {
      const wrapper = mount(ReaderSelectionTooltip, {
        props: {
          visible: true,
          x: 100,
          y: 200,
          selectedText: 'an ancient manuscript',
        },
      })

      const dictBtn = wrapper.find('button[title="Consultar no Dicionário Offline"]')
      expect(dictBtn.exists()).toBe(false)
    })
  })

  describe('ReaderViewer', () => {
    it('renderiza o título do livro com fonte editorial quando houver documento carregado', async () => {
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

      const wrapper = mount(ReaderViewer, {
        global: {
          stubs: {
            ReaderEnginePageCurlCanvas: true,
            ReaderBookNotesPanel: true,
            ReaderGraphPanel: true,
            ReaderBottomBar: false,
            ReaderSavedPagesModal: true,
            ReaderAnnotationModal: true,
            ReaderAnnotationDrawer: true,
            ReaderTypographyPopover: true,
            ReaderSelectionTooltip: true,
            ReaderDictionaryCard: true,
          },
        },
      })

      const bottomBar = wrapper.find('#reader-unified-bar')
      expect(bottomBar.exists()).toBe(true)
      expect(bottomBar.classes()).toContain('bg-transparent')
      // O título foi removido da barra para deixar os ícones e capa soltos
      expect(wrapper.find('.reader-viewer__book-title-bar').exists()).toBe(false)
      // Ícones de controle soltos presentes no bloco de 6 ícones
      expect(wrapper.find('#btn-close-book').exists()).toBe(true)
      expect(wrapper.find('#btn-font-decrease').exists()).toBe(true)
      expect(wrapper.find('#btn-font-increase').exists()).toBe(true)
      expect(wrapper.find('#btn-bottom-zen-mode').exists()).toBe(true)
      expect(wrapper.find('#btn-view-notes').exists()).toBe(true)
      expect(wrapper.find('#btn-appearance-toggle').exists()).toBe(true)
      expect(wrapper.find('#btn-bookmark-toggle').exists()).toBe(false)
    })

    it('oculta a barra inferior no modo Zen', async () => {
      const store = useReaderStore()
      store.setDocument({
        type: 'pdf',
        metadata: { title: 'O Alienista' },
        totalPages: 50,
        isLoaded: true,
        load: vi.fn(),
        getPage: vi.fn(),
        destroy: vi.fn(),
      } as any, 'alienista.pdf')
      store.isZenMode = true

      const wrapper = mount(ReaderViewer, {
        global: {
          stubs: {
            ReaderEnginePageCurlCanvas: true,
            ReaderBookNotesPanel: true,
            ReaderGraphPanel: true,
            ReaderBottomBar: false,
            ReaderSavedPagesModal: true,
            ReaderAnnotationModal: true,
            ReaderAnnotationDrawer: true,
            ReaderTypographyPopover: true,
            ReaderSelectionTooltip: true,
            ReaderDictionaryCard: true,
          },
        },
      })

      const bottomBar = wrapper.find('#reader-unified-bar')
      expect(bottomBar.exists()).toBe(false)
    })

    it('sai do Modo Zen ao pressionar a tecla Escape no ReaderViewer', async () => {
      const store = useReaderStore()
      store.setDocument({
        type: 'epub',
        metadata: { title: 'Livro Zen' },
        totalPages: 10,
        isLoaded: true,
        load: vi.fn(),
        getPage: vi.fn(),
        destroy: vi.fn(),
      } as any, 'livro.epub')
      store.isZenMode = true

      mount(ReaderViewer, {
        global: {
          stubs: {
            ReaderEnginePageCurlCanvas: true,
            ReaderBookNotesPanel: true,
            ReaderBottomBar: true,
            ReaderSavedPagesModal: true,
            ReaderAnnotationModal: true,
            ReaderSelectionTooltip: true,
            ReaderDictionaryCard: true,
            ReaderAiOverlayCard: true,
            ReaderCreateBookletModal: true,
          },
        },
      })

      expect(store.isZenMode).toBe(true)

      // Dispara evento Escape no window
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(store.isZenMode).toBe(false)
    })

    it('sai do Modo Zen ao detectar evento fullscreenchange sem fullscreenElement ativo', async () => {
      const store = useReaderStore()
      store.setDocument({
        type: 'epub',
        metadata: { title: 'Livro Zen' },
        totalPages: 10,
        isLoaded: true,
        load: vi.fn(),
        getPage: vi.fn(),
        destroy: vi.fn(),
      } as any, 'livro.epub')
      store.isZenMode = true

      mount(ReaderViewer, {
        global: {
          stubs: {
            ReaderEnginePageCurlCanvas: true,
            ReaderBookNotesPanel: true,
            ReaderBottomBar: true,
            ReaderSavedPagesModal: true,
            ReaderAnnotationModal: true,
            ReaderSelectionTooltip: true,
            ReaderDictionaryCard: true,
            ReaderAiOverlayCard: true,
            ReaderCreateBookletModal: true,
          },
        },
      })

      expect(store.isZenMode).toBe(true)

      // Simula término do Fullscreen no navegador
      document.dispatchEvent(new Event('fullscreenchange'))
      expect(store.isZenMode).toBe(false)
    })

    it('exibe o tooltip de seleção e abre o modal de anotação com o texto selecionado', async () => {
      const store = useReaderStore()
      store.setDocument({
        type: 'epub',
        metadata: { title: 'Memórias Póstumas' },
        totalPages: 80,
        isLoaded: true,
        load: vi.fn(),
        destroy: vi.fn(),
      } as any, 'memorias.epub')

      const wrapper = mount(ReaderViewer, {
        global: {
          stubs: {
            ReaderEnginePageCurlCanvas: true,
            ReaderBookNotesPanel: true,
            ReaderGraphPanel: true,
            ReaderBottomBar: true,
            ReaderSavedPagesModal: true,
            ReaderAnnotationModal: {
              name: 'ReaderAnnotationModal',
              template: '<div v-if="isOpen" class="modal-stub" :data-initial="initialText">{{ initialText }}</div>',
              props: ['isOpen', 'initialText'],
            },
            ReaderAnnotationDrawer: true,
            ReaderTypographyPopover: true,
            ReaderSelectionTooltip: {
              name: 'ReaderSelectionTooltip',
              template: '<div v-if="visible" class="tooltip-stub"><button @click="$emit(\'annotate\', { text: selectedText, pageNumber })">Anotar</button></div>',
              props: ['visible', 'selectedText', 'pageNumber'],
              emits: ['annotate'],
            },
            ReaderDictionaryCard: true,
          },
        },
      })

      // Simula seleção de texto
      const canvasArea = wrapper.find('.reader-viewer__canvas-area')
      expect(canvasArea.exists()).toBe(true)

      const mockSelection = {
        isCollapsed: false,
        toString: () => 'Ao verme que primeiro roeu as frias carnes',
        rangeCount: 1,
        anchorNode: canvasArea.element,
        focusNode: canvasArea.element,
        getRangeAt: () => ({
          getBoundingClientRect: () => ({
            top: 200,
            bottom: 220,
            left: 300,
            right: 500,
            width: 200,
            height: 20,
          }),
        }),
      }

      vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection as any)

      await canvasArea.trigger('mouseup')

      const tooltip = wrapper.findComponent({ name: 'ReaderSelectionTooltip' })
      expect(tooltip.exists()).toBe(true)
      expect(tooltip.props('visible')).toBe(true)
      expect(tooltip.props('selectedText')).toBe('Ao verme que primeiro roeu as frias carnes')

      // Clica em Anotar a partir do tooltip
      await tooltip.vm.$emit('annotate', {
        text: 'Ao verme que primeiro roeu as frias carnes',
        pageNumber: 1,
      })

      const modal = wrapper.findComponent({ name: 'ReaderAnnotationModal' })
      expect(modal.exists()).toBe(true)
      expect(modal.props('isOpen')).toBe(true)
      expect(modal.props('initialText')).toBe('Ao verme que primeiro roeu as frias carnes')
    })

    it('preserva a seleção de texto e mantém o tooltip visível em sequência pointerup e mouseup no EPUB sem apagar a seleção', async () => {
      const store = useReaderStore()
      store.setDocument({
        type: 'epub',
        metadata: { title: 'Memórias Póstumas' },
        totalPages: 80,
        isLoaded: true,
        load: vi.fn(),
        destroy: vi.fn(),
      } as any, 'memorias.epub')

      const wrapper = mount(ReaderViewer, {
        global: {
          stubs: {
            ReaderEnginePageCurlCanvas: true,
            ReaderBookNotesPanel: true,
            ReaderGraphPanel: true,
            ReaderBottomBar: true,
            ReaderSavedPagesModal: true,
            ReaderAnnotationModal: true,
            ReaderAnnotationDrawer: true,
            ReaderTypographyPopover: true,
            ReaderSelectionTooltip: {
              name: 'ReaderSelectionTooltip',
              template: '<div v-if="visible" class="tooltip-stub">Tooltip</div>',
              props: ['visible', 'selectedText', 'pageNumber'],
            },
            ReaderDictionaryCard: true,
          },
        },
      })

      const canvasArea = wrapper.find('.reader-viewer__canvas-area')
      const removeAllRangesSpy = vi.fn()
      const mockSelection = {
        isCollapsed: false,
        toString: () => 'Capítulo Primeiro: Do Óbito do Autor',
        rangeCount: 1,
        anchorNode: canvasArea.element,
        focusNode: canvasArea.element,
        removeAllRanges: removeAllRangesSpy,
        getRangeAt: () => ({
          getBoundingClientRect: () => ({
            top: 150,
            bottom: 170,
            left: 200,
            right: 450,
            width: 250,
            height: 20,
          }),
        }),
      }

      vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection as any)

      // Simula a sequência natural do navegador ao soltar o mouse: pointerup seguido de mouseup
      await canvasArea.trigger('pointerup')
      await canvasArea.trigger('mouseup')

      // A seleção não deve ter sido descartada / apagada
      expect(removeAllRangesSpy).not.toHaveBeenCalled()

      const tooltip = wrapper.findComponent({ name: 'ReaderSelectionTooltip' })
      expect(tooltip.exists()).toBe(true)
      expect(tooltip.props('visible')).toBe(true)
      expect(tooltip.props('selectedText')).toBe('Capítulo Primeiro: Do Óbito do Autor')
    })

    it('abre e fecha o painel de anotações do livro ao receber toggleNotes da barra inferior sem fechar imediatamente', async () => {
      const store = useReaderStore()
      store.setDocument({
        type: 'epub',
        metadata: { title: 'Dom Casmurro' },
        totalPages: 100,
        isLoaded: true,
        load: vi.fn(),
        destroy: vi.fn(),
      } as any, 'dom-casmurro.epub')

      const wrapper = mount(ReaderViewer, {
        global: {
          stubs: {
            ReaderEnginePageCurlCanvas: true,
            ReaderBookNotesPanel: true,
            ReaderGraphPanel: true,
            ReaderBottomBar: {
              name: 'ReaderBottomBar',
              template: '<div class="bottom-bar-stub"><button id="notes-btn" @click="$emit(\'toggleNotes\'); $emit(\'toggleGraph\')">Notas</button></div>',
              emits: ['toggleNotes', 'toggleGraph'],
            },
            ReaderSavedPagesModal: true,
            ReaderAnnotationModal: true,
            ReaderAnnotationDrawer: true,
            ReaderTypographyPopover: true,
            ReaderSelectionTooltip: true,
            ReaderDictionaryCard: true,
          },
        },
      })

      expect(store.isNotesOpen).toBe(false)

      const bottomBar = wrapper.findComponent({ name: 'ReaderBottomBar' })
      expect(bottomBar.exists()).toBe(true)

      // Clica no botão de notas (que emite toggleNotes e toggleGraph)
      await bottomBar.find('#notes-btn').trigger('click')

      // O painel deve permanecer aberto (não pode fechar imediatamente)
      expect(store.isNotesOpen).toBe(true)

      // Ao clicar novamente após intervalo de throttle, deve fechar
      await new Promise((r) => setTimeout(r, 250))
      await bottomBar.find('#notes-btn').trigger('click')
      expect(store.isNotesOpen).toBe(false)
    })

    it('no desktop, ao abrir anotações, reader-pane contrai com classe with-notes e aside fica lado a lado sem backdrop', async () => {
      const store = useReaderStore()
      store.setDocument({
        type: 'epub',
        metadata: { title: 'Dom Casmurro' },
        totalPages: 100,
        isLoaded: true,
        load: vi.fn(),
        destroy: vi.fn(),
      } as any, 'dom-casmurro.epub')

      const wrapper = mount(ReaderViewer, {
        global: {
          stubs: {
            ReaderEnginePageCurlCanvas: true,
            ReaderBookNotesPanel: true,
            ReaderGraphPanel: true,
            ReaderBottomBar: true,
            ReaderSavedPagesModal: true,
            ReaderAnnotationModal: true,
            ReaderAnnotationDrawer: true,
            ReaderTypographyPopover: true,
            ReaderSelectionTooltip: true,
            ReaderDictionaryCard: true,
          },
        },
      })

      const readerPane = wrapper.find('.reader-viewer__reader-pane')
      expect(readerPane.classes()).toContain('reader-viewer__reader-pane--full')
      expect(readerPane.classes()).not.toContain('reader-viewer__reader-pane--with-notes')
      expect(wrapper.find('aside').exists()).toBe(false)

      // Abre as notas no desktop
      store.setNotesOpen(true)
      await wrapper.vm.$nextTick()

      expect(readerPane.classes()).toContain('reader-viewer__reader-pane--with-notes')
      const aside = wrapper.find('aside')
      expect(aside.exists()).toBe(true)
      // Confirma que não há backdrop sobreposto com fixed inset-0 cobrindo o livro
      expect(wrapper.find('.fixed.inset-0.bg-black\\/25').exists()).toBe(false)
    })

    it('no mobile, ao abrir anotações, ocupa totalmente a área do livro dentro de content-column sem cobrir a navbar', async () => {
      const store = useReaderStore()
      store.setDocument({
        type: 'epub',
        metadata: { title: 'Dom Casmurro' },
        totalPages: 100,
        isLoaded: true,
        load: vi.fn(),
        destroy: vi.fn(),
      } as any, 'dom-casmurro.epub')

      const wrapper = mount(ReaderViewer, {
        global: {
          stubs: {
            ReaderEnginePageCurlCanvas: true,
            ReaderBookNotesPanel: true,
            ReaderGraphPanel: true,
            ReaderBottomBar: true,
            ReaderSavedPagesModal: true,
            ReaderAnnotationModal: true,
            ReaderAnnotationDrawer: true,
            ReaderTypographyPopover: true,
            ReaderSelectionTooltip: true,
            ReaderDictionaryCard: true,
          },
        },
      })

      // Abre notas mobile
      store.setMobileNotesOpen(true)
      await wrapper.vm.$nextTick()

      // Painel mobile está contido dentro da coluna de conteúdo do livro
      const contentCol = wrapper.find('.reader-viewer__content-column')
      expect(contentCol.exists()).toBe(true)

      const mobileNotes = contentCol.findComponent({ name: 'ReaderBookNotesPanel' })
      expect(mobileNotes.exists()).toBe(true)
      expect(mobileNotes.props('isMobile')).toBe(true)

      // BottomBar (navbar) permanece presente no reader-pane e externa ao content-column
      const bottomBar = wrapper.findComponent({ name: 'ReaderBottomBar' })
      expect(bottomBar.exists()).toBe(true)
      expect(contentCol.findComponent({ name: 'ReaderBottomBar' }).exists()).toBe(false)
    })

    it('preserva o modo de 2 páginas (duas folhas) ao abrir e fechar as anotações', async () => {
      const store = useReaderStore()
      store.setTwoPageMode(true)
      store.setDocument({
        type: 'epub',
        metadata: { title: 'Dom Casmurro' },
        totalPages: 100,
        isLoaded: true,
        load: vi.fn(),
        destroy: vi.fn(),
      } as any, 'dom-casmurro.epub')

      expect(store.isTwoPageMode).toBe(true)

      const wrapper = mount(ReaderViewer, {
        global: {
          stubs: {
            ReaderEnginePageCurlCanvas: true,
            ReaderBookNotesPanel: true,
            ReaderGraphPanel: true,
            ReaderBottomBar: true,
            ReaderSavedPagesModal: true,
            ReaderAnnotationModal: true,
            ReaderAnnotationDrawer: true,
            ReaderTypographyPopover: true,
            ReaderSelectionTooltip: true,
            ReaderDictionaryCard: true,
          },
        },
      })

      // Ao montar e com duas páginas ativas, permanece true
      expect(store.isTwoPageMode).toBe(true)

      // Abre as anotações
      store.setNotesOpen(true)
      await wrapper.vm.$nextTick()

      // O modo de 2 páginas DEVE continuar ativo
      expect(store.isTwoPageMode).toBe(true)

      // Fecha as anotações
      store.setNotesOpen(false)
      await wrapper.vm.$nextTick()

      // Continua com 2 páginas ativas
      expect(store.isTwoPageMode).toBe(true)
    })

    it('não exibe setas visuais de navegação na leitura de livros (leitura imersiva pelas pontas da tela)', async () => {
      const store = useReaderStore()
      store.setDocument({
        type: 'epub',
        metadata: { title: 'Dom Casmurro' },
        totalPages: 100,
        isLoaded: true,
        load: vi.fn(),
        destroy: vi.fn(),
      } as any, 'dom-casmurro.epub')

      const wrapper = mount(ReaderViewer, {
        global: {
          stubs: {
            ReaderEnginePageCurlCanvas: true,
            ReaderBookNotesPanel: true,
            ReaderGraphPanel: true,
            ReaderBottomBar: true,
            ReaderSavedPagesModal: true,
            ReaderAnnotationModal: true,
            ReaderAnnotationDrawer: true,
            ReaderTypographyPopover: true,
            ReaderSelectionTooltip: true,
            ReaderDictionaryCard: true,
          },
        },
      })

      const prevBtn = wrapper.find('#btn-prev-page')
      const nextBtn = wrapper.find('#btn-next-page')

      expect(prevBtn.exists()).toBe(false)
      expect(nextBtn.exists()).toBe(false)
    })

    it('reseta a store do leitor ao acionar o botão de fechar/sair', async () => {
      const store = useReaderStore()
      store.setDocument({
        type: 'epub',
        metadata: { title: 'Dom Casmurro' },
        totalPages: 100,
        isLoaded: true,
        load: vi.fn(),
        destroy: vi.fn(),
      } as any, 'dom-casmurro.epub')

      const wrapper = mount(ReaderViewer, {
        global: {
          stubs: {
            ReaderEnginePageCurlCanvas: true,
            ReaderBookNotesPanel: true,
            ReaderGraphPanel: true,
            ReaderBottomBar: true,
            ReaderSavedPagesModal: true,
            ReaderAnnotationModal: true,
            ReaderAnnotationDrawer: true,
            ReaderTypographyPopover: true,
            ReaderSelectionTooltip: true,
            ReaderDictionaryCard: true,
          },
        },
      })

      const bottomBarStub = wrapper.findComponent({ name: 'ReaderBottomBar' })
      expect(bottomBarStub.exists()).toBe(true)
      bottomBarStub.vm.$emit('close')

      expect(store.hasDocument).toBe(false)
    })

    it('em telas horizontais renderiza a barra lateral na lateral esquerda', async () => {
      const store = useReaderStore()
      store.setDocument({
        type: 'epub',
        metadata: { title: 'Livro Horizontal', coverUrl: '/covers/horizontal.jpg' },
        totalPages: 100,
        isLoaded: true,
      } as any, 'livro.epub')

      const wrapper = mount(ReaderViewer, {
        global: {
          stubs: {
            ReaderEnginePageCurlCanvas: true,
            ReaderBookNotesPanel: true,
            ReaderGraphPanel: true,
            ReaderBottomBar: true,
            ReaderSavedPagesModal: true,
            ReaderAnnotationModal: true,
            ReaderAnnotationDrawer: true,
            ReaderTypographyPopover: true,
            ReaderSelectionTooltip: true,
            ReaderDictionaryCard: true,
          },
        },
      })

      // Simula layout do livro com margem esquerda de 150px
      const pageRendererStub = wrapper.findComponent({ name: 'ReaderEnginePageCurlCanvas' })
      expect(pageRendererStub.exists()).toBe(true)
      pageRendererStub.vm.$emit('layout-change', { left: 150, width: 700 })
      await wrapper.vm.$nextTick()

      // A barra lateral deve estar presente e com isHorizontal true
      const bottomBar = wrapper.findComponent({ name: 'ReaderBottomBar' })
      expect(bottomBar.exists()).toBe(true)
      expect(bottomBar.props('isHorizontal')).toBe(true)
      expect(wrapper.find('.reader-viewer__reader-pane--horizontal').exists()).toBe(true)
    })
  })
})

