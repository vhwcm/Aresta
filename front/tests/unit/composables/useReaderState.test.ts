import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useReaderStore } from '~/stores/readerStore'
import type { IBookDocument, BookMetadata, PageData } from '~/interfaces/reader/IBookDocument'

function createMockDocument(overrides: Partial<IBookDocument> = {}): IBookDocument {
  const base: IBookDocument = {
    type: 'pdf',
    metadata: { title: 'Livro Teste' } as BookMetadata,
    totalPages: 10,
    isLoaded: true,
    load: vi.fn().mockResolvedValue(undefined),
    getPage: vi.fn().mockResolvedValue({} as PageData),
    destroy: vi.fn(),
  }
  return { ...base, ...overrides }
}

describe('useReaderStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('estado inicial é vazio e sem documento', () => {
    const store = useReaderStore()
    expect(store.hasDocument).toBe(false)
    expect(store.currentPage).toBe(1)
    expect(store.totalPages).toBe(0)
    expect(store.error).toBeNull()
  })

  describe('setDocument', () => {
    it('define o documento e reseta para página 1', () => {
      const store = useReaderStore()
      const doc = createMockDocument({ totalPages: 20 })
      store.setDocument(doc, 'livro.pdf')
      expect(store.hasDocument).toBe(true)
      expect(store.totalPages).toBe(20)
      expect(store.currentPage).toBe(1)
      expect(store.fileName).toBe('livro.pdf')
    })

    it('destrói o documento anterior ao definir um novo', () => {
      const store = useReaderStore()
      const doc1 = createMockDocument()
      const doc2 = createMockDocument()
      store.setDocument(doc1, 'a.pdf')
      store.setDocument(doc2, 'b.pdf')
      expect(doc1.destroy).toHaveBeenCalledOnce()
    })

    it('limpa o erro ao definir novo documento', () => {
      const store = useReaderStore()
      store.setError('erro anterior')
      const doc = createMockDocument()
      store.setDocument(doc, 'livro.pdf')
      expect(store.error).toBeNull()
    })

    it('desativa loading ao definir documento carregado', () => {
      const store = useReaderStore()
      store.setLoading(true)
      store.setDocument(createMockDocument(), 'livro.pdf')
      expect(store.isLoading).toBe(false)
    })
  })

  describe('navegação de páginas', () => {
    it('navega para a próxima página', () => {
      const store = useReaderStore()
      store.setDocument(createMockDocument({ totalPages: 5 }), 'livro.pdf')
      store.nextPage()
      expect(store.currentPage).toBe(2)
    })

    it('navega para a página anterior', () => {
      const store = useReaderStore()
      store.setDocument(createMockDocument({ totalPages: 5 }), 'livro.pdf')
      store.goToPage(3)
      store.prevPage()
      expect(store.currentPage).toBe(2)
    })

    it('não passa da última página', () => {
      const store = useReaderStore()
      store.setDocument(createMockDocument({ totalPages: 3 }), 'livro.pdf')
      store.goToPage(3)
      store.nextPage()
      expect(store.currentPage).toBe(3)
    })

    it('não volta antes da primeira página', () => {
      const store = useReaderStore()
      store.setDocument(createMockDocument({ totalPages: 3 }), 'livro.pdf')
      store.prevPage()
      expect(store.currentPage).toBe(1)
    })

    it('clamp goToPage para limites válidos', () => {
      const store = useReaderStore()
      store.setDocument(createMockDocument({ totalPages: 10 }), 'livro.pdf')
      store.goToPage(-5)
      expect(store.currentPage).toBe(1)
      store.goToPage(999)
      expect(store.currentPage).toBe(10)
    })

    it('goToPage sem documento não faz nada', () => {
      const store = useReaderStore()
      store.goToPage(5)
      expect(store.currentPage).toBe(1)
    })
  })

  describe('getters derivados', () => {
    it('isFirstPage é true na página 1', () => {
      const store = useReaderStore()
      store.setDocument(createMockDocument({ totalPages: 5 }), 'l.pdf')
      expect(store.isFirstPage).toBe(true)
    })

    it('isLastPage é true na última página', () => {
      const store = useReaderStore()
      store.setDocument(createMockDocument({ totalPages: 3 }), 'l.pdf')
      store.goToPage(3)
      expect(store.isLastPage).toBe(true)
    })

    it('canGoNext é false na última página', () => {
      const store = useReaderStore()
      store.setDocument(createMockDocument({ totalPages: 2 }), 'l.pdf')
      store.goToPage(2)
      expect(store.canGoNext).toBe(false)
    })

    it('canGoPrev é false na primeira página', () => {
      const store = useReaderStore()
      store.setDocument(createMockDocument({ totalPages: 5 }), 'l.pdf')
      expect(store.canGoPrev).toBe(false)
    })

    it('documentType retorna o tipo correto', () => {
      const store = useReaderStore()
      store.setDocument(createMockDocument({ type: 'epub' }), 'l.epub')
      expect(store.documentType).toBe('epub')
    })

    it('progressPercentage calcula a porcentagem arredondada', () => {
      const store = useReaderStore()
      expect(store.progressPercentage).toBe(0)

      store.setDocument(createMockDocument({ totalPages: 10 }), 'l.pdf')
      store.goToPage(3)
      expect(store.progressPercentage).toBe(30)

      store.goToPage(7)
      expect(store.progressPercentage).toBe(70)
    })
  })

  describe('reset', () => {
    it('destrói o documento e limpa o estado', () => {
      const store = useReaderStore()
      const doc = createMockDocument()
      store.setDocument(doc, 'livro.pdf')
      store.reset()
      expect(store.hasDocument).toBe(false)
      expect(store.currentPage).toBe(1)
      expect(store.fileName).toBeNull()
      expect(doc.destroy).toHaveBeenCalledOnce()
    })
  })

  describe('error handling', () => {
    it('setError define mensagem e desativa loading', () => {
      const store = useReaderStore()
      store.setLoading(true)
      store.setError('Falha ao carregar')
      expect(store.error).toBe('Falha ao carregar')
      expect(store.isLoading).toBe(false)
    })
  })

  describe('bookmarks e grafo', () => {
    it('marca e desmarca página com toggleBookmark', () => {
      const store = useReaderStore()
      store.setDocument(createMockDocument({ totalPages: 10 }), 'livro.pdf', 1)
      expect(store.isCurrentPageBookmarked).toBe(false)

      store.toggleBookmark()
      expect(store.isCurrentPageBookmarked).toBe(true)
      expect(store.savedPages).toContain(1)

      store.toggleBookmark()
      expect(store.isCurrentPageBookmarked).toBe(false)
      expect(store.savedPages).not.toContain(1)
    })

    it('adiciona e remove bookmark específico', () => {
      const store = useReaderStore()
      store.setDocument(createMockDocument({ totalPages: 10 }), 'livro.pdf', 1)
      store.addBookmark(5)
      store.addBookmark(3)
      expect(store.savedPages).toEqual([3, 5])

      store.removeBookmark(5)
      expect(store.savedPages).toEqual([3])
    })

    it('alterna visualização do grafo', () => {
      const store = useReaderStore()
      expect(store.isGraphOpen).toBe(false)
      store.toggleGraph()
      expect(store.isGraphOpen).toBe(true)
      store.toggleGraph()
      expect(store.isGraphOpen).toBe(false)
    })

    it('alterna modo de duas folhas (isTwoPageMode)', () => {
      const store = useReaderStore()
      expect(store.isTwoPageMode).toBe(true)
      store.toggleTwoPageMode()
      expect(store.isTwoPageMode).toBe(false)
      store.setTwoPageMode(true)
      expect(store.isTwoPageMode).toBe(true)
    })

    it('alterna modo de largura de leitura (readerWidthMode)', () => {
      const store = useReaderStore()
      expect(store.readerWidthMode).toBe('centered')
      store.toggleReaderWidthMode()
      expect(store.readerWidthMode).toBe('wide')
      store.setReaderWidthMode('centered')
      expect(store.readerWidthMode).toBe('centered')
    })

    it('alterna grafo mobile', () => {
      const store = useReaderStore()
      expect(store.isMobileGraphOpen).toBe(false)
      store.toggleMobileGraph()
      expect(store.isMobileGraphOpen).toBe(true)
    })
  })

  describe('progresso e marcadores', () => {
    it('calcula porcentagem de progresso corretamente', () => {
      const store = useReaderStore()
      store.setDocument(createMockDocument({ totalPages: 10 }), 'livro.pdf')

      expect(store.progressPercentage).toBe(10)

      store.goToPage(5)
      expect(store.progressPercentage).toBe(50)

      store.goToPage(10)
      expect(store.progressPercentage).toBe(100)
    })

    it('marca e desmarca bookmark na página atual', () => {
      const store = useReaderStore()
      store.setDocument(createMockDocument({ totalPages: 10 }), 'livro.pdf', 1)

      expect(store.isCurrentPageBookmarked).toBe(false)

      store.toggleBookmark()
      expect(store.isCurrentPageBookmarked).toBe(true)
      expect(store.savedPages).toContain(1)

      store.toggleBookmark()
      expect(store.isCurrentPageBookmarked).toBe(false)
      expect(store.savedPages).not.toContain(1)
    })
  })

  describe('tamanho de fonte (fontSize)', () => {
    it('inicia com valor padrão 18', () => {
      const store = useReaderStore()
      expect(store.fontSize).toBe(18)
    })

    it('ajusta tamanho de fonte com setFontSize respeitando limites e atualizando documento', () => {
      const store = useReaderStore()
      const mockDoc = createMockDocument({
        type: 'epub',
        setFontSize: vi.fn((size: number, currPage?: number) => (currPage || 1) + 1),
      })
      store.setDocument(mockDoc, 'livro.epub')

      store.setFontSize(22)
      expect(store.fontSize).toBe(22)
      expect(mockDoc.setFontSize).toHaveBeenCalledWith(22, 1)

      // Testar limites mínimos e máximos (12 a 36)
      store.setFontSize(8)
      expect(store.fontSize).toBe(12)

      store.setFontSize(48)
      expect(store.fontSize).toBe(36)
    })

    it('aumenta e diminui tamanho de fonte com increaseFontSize e decreaseFontSize', () => {
      const store = useReaderStore()
      store.setFontSize(18)

      store.increaseFontSize(2)
      expect(store.fontSize).toBe(20)

      store.decreaseFontSize(4)
      expect(store.fontSize).toBe(16)

      store.resetFontSize()
      expect(store.fontSize).toBe(18)
    })

    it('sincroniza tamanho da fonte configurado nas preferências da conta ao carregar documento', () => {
      localStorage.setItem('aresta_settings', JSON.stringify({ epubFontSize: 26 }))
      const store = useReaderStore()
      const mockDoc = createMockDocument({
        type: 'epub',
        setFontSize: vi.fn((size: number, currPage?: number) => currPage || 1),
      })

      store.setDocument(mockDoc, 'livro.epub')

      expect(store.fontSize).toBe(26)
      expect(mockDoc.setFontSize).toHaveBeenCalledWith(26, 1)
    })

    it('redefine para o tamanho padrão 18 com resetFontSize', () => {
      const store = useReaderStore()
      store.setFontSize(30)
      expect(store.fontSize).toBe(30)

      store.resetFontSize()
      expect(store.fontSize).toBe(18)
    })
  })

  describe('Modo Zen (isZenMode)', () => {
    it('inicia desativado por padrão', () => {
      const store = useReaderStore()
      expect(store.isZenMode).toBe(false)
    })

    it('ativa e desativa modo zen com setZenMode', () => {
      const store = useReaderStore()
      store.setZenMode(true)
      expect(store.isZenMode).toBe(true)

      store.setZenMode(false)
      expect(store.isZenMode).toBe(false)
    })

    it('alterna modo zen com toggleZenMode', () => {
      const store = useReaderStore()
      expect(store.isZenMode).toBe(false)

      store.toggleZenMode()
      expect(store.isZenMode).toBe(true)

      store.toggleZenMode()
      expect(store.isZenMode).toBe(false)
    })

    it('reseta isZenMode para false ao chamar reset()', () => {
      const store = useReaderStore()
      store.setZenMode(true)
      expect(store.isZenMode).toBe(true)

      store.reset()
      expect(store.isZenMode).toBe(false)
    })
  })
})
