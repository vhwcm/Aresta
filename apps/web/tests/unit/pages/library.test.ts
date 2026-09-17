import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import LibraryPage from '../../../app/pages/library.vue'
import { bookRepo } from '../../../app/adapters/database/repositories/BookRepository'

const mockFetch = vi.fn()
;(globalThis as any).$fetch = mockFetch

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useRoute: () => ({
    query: {},
  }),
}))

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    isLoggedIn: ref(true),
    token: ref('mock-token'),
    user: ref({ id: 1, name: 'Admin', role: 'ADMIN' }),
  }),
}))

describe('Library Page', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { dbManager } = await import('../../../app/adapters/database/DatabaseManager')
    const { InMemoryAdapter } = await import('../../../app/adapters/database/InMemoryAdapter')
    dbManager.setAdapter(new InMemoryAdapter())
    const { bookRepo } = await import('../../../app/adapters/database/repositories/BookRepository')
    const { resetUserBooksMemory } = await import('../../../app/composables/useUserBooks')
    const { resetGraphMemory } = await import('../../../app/composables/useGraph')
    resetUserBooksMemory()
    resetGraphMemory()
    await bookRepo.clear()
    await bookRepo.save({ id: 10, bookId: 1, title: 'Contos Fluminenses', filePath: 'storage/epubs/contos.epub', status: 'LENDO', currentPage: 45, lastAccessedAt: '2026-09-02T10:00:00.000Z' })
    await bookRepo.save({ id: 11, bookId: 2, title: 'Manual de Engenharia', filePath: 'storage/pdfs/manual.pdf', status: 'QUERO_LER', currentPage: 0, lastAccessedAt: '2026-09-03T10:00:00.000Z' })
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
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Estante')
    expect(wrapper.text()).not.toContain('Biblioteca & Estante')
    expect(wrapper.text()).toContain('Gerenciar Temas')
    expect(wrapper.text()).toContain('Novo Livreto IA')
    expect(wrapper.text()).toContain('Enviar Arquivo')
    // Não deve conter os cards de status removidos
    expect(wrapper.text()).not.toContain('Total na sua Estante')
    expect(wrapper.text()).not.toContain('Lendo Atualmente')
    // Não deve exibir formato de arquivo (EPUB ou PDF)
    expect(wrapper.text()).not.toContain('EPUB')
    expect(wrapper.text()).not.toContain('PDF')
    // Deve exibir porcentagem de leitura não editável
    expect(wrapper.text()).toContain('45%')
    expect(wrapper.text()).toContain('0%')
    // Botão Ler Livro e seletor de status devem ter sido removidos
    expect(wrapper.text()).not.toContain('Ler Livro')
    expect(wrapper.text()).not.toContain('Lendo')
    expect(wrapper.text()).not.toContain('📖 Lendo')
    expect(wrapper.text()).not.toContain('Ver no Mapa Mental')
    // As palavras Filtrar Temas e Ver Grafo devem ser removidas
    expect(wrapper.text()).not.toContain('Filtrar Temas')
    expect(wrapper.text()).not.toContain('Ver Grafo')
  })

  it('opens manage themes modal when clicking Gerenciar Temas button', async () => {
    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    })
    await flushPromises()

    const manageBtn = wrapper.find('[data-testid="manage-themes-btn"]')
    expect(manageBtn.exists()).toBe(true)
    await manageBtn.trigger('click')
    await flushPromises()

    // O modal deve ser aberto e exibir os controles
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Gerenciar Temas')
  })

  it('navigates to reader when clicking a book card', async () => {
    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    })
    await flushPromises()

    const bookCards = wrapper.findAll('[data-testid="user-book-card"]')
    expect(bookCards.length).toBeGreaterThanOrEqual(2)

    const card0 = bookCards[0]
    const card1 = bookCards[1]
    expect(card0).toBeDefined()
    expect(card1).toBeDefined()

    if (card0 && card1) {
      await card0.trigger('click')
      expect(mockPush).toHaveBeenCalled()
    }
  })

  it('does not display general catalog tab selection', async () => {
    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('Catálogo Geral')
    expect(wrapper.text()).not.toContain('Todos os Livros do Acervo')
  })

  it('orders user books by most recently opened or added first', async () => {
    const { resetUserBooksMemory } = await import('../../../app/composables/useUserBooks')
    resetUserBooksMemory()
    await bookRepo.clear()
    await bookRepo.save({ id: 10, bookId: 1, title: 'Livro Antigo', status: 'LENDO', currentPage: 10, lastAccessedAt: '2026-09-01T10:00:00.000Z' })
    await bookRepo.save({ id: 11, bookId: 2, title: 'Livro Mais Recente', status: 'LENDO', currentPage: 5, lastAccessedAt: '2026-09-06T08:00:00.000Z' })
    await bookRepo.save({ id: 12, bookId: 3, title: 'Livro Intermediário', status: 'LENDO', currentPage: 20, lastAccessedAt: '2026-09-04T12:00:00.000Z' })

    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    })
    await flushPromises()

    const titles = wrapper.findAll('h3').map((h) => h.text())
    expect(titles.indexOf('Livro Mais Recente')).toBeLessThan(titles.indexOf('Livro Intermediário'))
    expect(titles.indexOf('Livro Intermediário')).toBeLessThan(titles.indexOf('Livro Antigo'))
  })

  it('opens delete confirmation modal with book title when clicking delete button', async () => {
    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    })
    await flushPromises()

    const deleteBtn = wrapper.find('[data-testid="delete-book-btn"]')
    expect(deleteBtn.exists()).toBe(true)

    await deleteBtn.trigger('click')
    expect(wrapper.text()).toContain('Remover Livro da Estante')
    expect(wrapper.text()).toContain('Contos Fluminenses')
  })

  it('opens delete confirmation modal and warns when book has notes and flashcards, then deletes them', async () => {
    const { annotationRepo } = await import('../../../app/adapters/database/repositories/AnnotationRepository')
    const { flashcardRepo } = await import('../../../app/adapters/database/repositories/FlashcardRepository')

    // Cria anotações e flashcards para o livro 1 (Contos Fluminenses)
    await annotationRepo.save({
      id: 501,
      bookId: 1,
      cfi: 'epubcfi(/6/2!/4)',
      note: 'Minha anotação crítica',
      selectedText: 'Texto destacado',
    })
    await annotationRepo.save({
      id: 502,
      bookId: 1,
      cfi: 'epubcfi(/6/4!/2)',
      note: 'Segunda anotação',
      selectedText: 'Outro trecho',
    })
    await flashcardRepo.save({
      id: 601,
      bookId: 1,
      annotationId: 501,
      question: 'Pergunta sobre a obra',
      answer: 'Resposta',
    } as any)

    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    })
    await flushPromises()

    const bookCards = wrapper.findAll('[data-testid="user-book-card"]')
    const contosCard = bookCards.find((c) => c.text().includes('Contos Fluminenses'))
    expect(contosCard).toBeDefined()
    const deleteBtn = contosCard!.find('[data-testid="delete-book-btn"]')
    expect(deleteBtn.exists()).toBe(true)
    await deleteBtn.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Remover Livro da Estante')
    expect(wrapper.text()).toContain('Contos Fluminenses')

    // Deve exibir caixa de aviso denotando anotações e flashcards
    const warningBox = wrapper.find('[data-testid="book-notes-warning-box"]')
    expect(warningBox.exists()).toBe(true)
    expect(warningBox.text()).toContain('2 anotações')
    expect(warningBox.text()).toContain('1 flashcard')
    expect(warningBox.text()).toContain('excluídos permanentemente')

    // Ao confirmar a exclusão, deve deletar o livro e limpar notas e flashcards
    const confirmBtn = wrapper.find('[data-testid="confirm-modal-confirm-btn"]')
    expect(confirmBtn.exists()).toBe(true)
    await confirmBtn.trigger('click')
    await flushPromises()

    expect(await annotationRepo.getAll({ bookId: 1 })).toHaveLength(0)
    const cards = await flashcardRepo.getAll()
    expect(cards.filter((c) => c.bookId === 1)).toHaveLength(0)
  })

  it('does not display warning box when book has no notes or flashcards', async () => {
    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    })
    await flushPromises()

    const deleteBtn = wrapper.find('[data-testid="delete-book-btn"]')
    await deleteBtn.trigger('click')
    await flushPromises()

    const warningBox = wrapper.find('[data-testid="book-notes-warning-box"]')
    expect(warningBox.exists()).toBe(false)
    expect(wrapper.text()).toContain('O progresso da leitura será removido.')
  })

  it('renders book list inside a responsive grid for shelf display on larger screens', async () => {
    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    })
    await flushPromises()

    const bookCard = wrapper.find('[data-testid="user-book-card"]')
    expect(bookCard.exists()).toBe(true)

    const gridContainer = bookCard.element.parentElement
    expect(gridContainer?.className).toContain('grid')
    expect(gridContainer?.className).toContain('grid-cols-1')
    expect(gridContainer?.className).toContain('md:grid-cols-2')
    expect(gridContainer?.className).toContain('lg:grid-cols-3')
  })

  it('renders selectable and deselectable theme tags beside Estante and supports mobile collapsible list', async () => {
    const { resetUserBooksMemory } = await import('../../../app/composables/useUserBooks')
    const { resetGraphMemory } = await import('../../../app/composables/useGraph')
    resetUserBooksMemory()
    resetGraphMemory()
    await bookRepo.clear()
    await bookRepo.save({
      id: 10,
      bookId: 1,
      title: 'Livro Filosofia',
      themes: [{ id: 1, name: 'Filosofia', color: '#E57B55' }],
      status: 'LENDO',
      currentPage: 10,
    })
    await bookRepo.save({
      id: 11,
      bookId: 2,
      title: 'Livro Ficção',
      themes: [{ id: 2, name: 'Ficção', color: '#38BDF8' }],
      status: 'LENDO',
      currentPage: 5,
    })

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/graph')) {
        return Promise.resolve({
          nodes: [
            { id: 1, name: 'Filosofia', color: '#E57B55', type: 'theme' },
            { id: 2, name: 'Ficção', color: '#38BDF8', type: 'theme' },
          ],
          edges: [
            { id: 'e1', source: 'book-1', target: 1, type: 'book-theme' },
            { id: 'e2', source: 'book-2', target: 2, type: 'book-theme' },
          ],
        })
      }
      return Promise.resolve([])
    })

    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    })
    await flushPromises()

    // Não deve conter os textos antigos removidos
    expect(wrapper.text()).not.toContain('Filtrar Temas')
    expect(wrapper.text()).not.toContain('Ver Grafo')

    // Deve renderizar Todos os Temas e as tags dos temas
    expect(wrapper.text()).toContain('Todos os Temas')
    expect(wrapper.text()).toContain('Filosofia')
    expect(wrapper.text()).toContain('Ficção')

    // Botão de alternar lista no mobile
    const toggleMobileBtn = wrapper.find('[data-testid="toggle-mobile-themes-btn"]')
    expect(toggleMobileBtn.exists()).toBe(true)

    // Ao clicar no botão mobile, a lista colapsável para baixo deve aparecer
    expect(wrapper.find('[data-testid="mobile-themes-dropdown"]').exists()).toBe(false)
    await toggleMobileBtn.trigger('click')
    expect(wrapper.find('[data-testid="mobile-themes-dropdown"]').exists()).toBe(true)

    // Ao clicar novamente, a lista colapsa
    await toggleMobileBtn.trigger('click')
    expect(wrapper.find('[data-testid="mobile-themes-dropdown"]').exists()).toBe(false)
  })

  it('não cria nem exibe tags de tema com nomes de livros ao carregar nós do grafo', async () => {
    const { resetUserBooksMemory } = await import('../../../app/composables/useUserBooks')
    const { resetGraphMemory } = await import('../../../app/composables/useGraph')
    resetUserBooksMemory()
    resetGraphMemory()
    await bookRepo.clear()
    await bookRepo.save({
      id: 10,
      bookId: 1,
      title: 'Dom Casmurro',
      themes: [{ id: 1, name: 'Clássicos' }],
      status: 'LENDO',
      currentPage: 10,
    })

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/graph')) {
        return Promise.resolve({
          nodes: [
            { id: 1, rawId: 1, type: 'theme', name: 'Clássicos', color: '#E57B55', bookCount: 1 },
            { id: 'book-1', rawId: 1, type: 'book', name: 'Dom Casmurro', fullTitle: 'Dom Casmurro' },
            { id: 'note-100', rawId: 100, type: 'note', name: 'Minha Nota Solta' }
          ],
          edges: [
            { id: 'e1', source: 'book-1', target: 1, type: 'book-theme' }
          ]
        })
      }
      return Promise.resolve([])
    })

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/graph')) {
        return Promise.resolve({
          nodes: [
            { id: 1, rawId: 1, type: 'theme', name: 'Clássicos', color: '#E57B55', bookCount: 1 },
            { id: 'book-1', rawId: 1, type: 'book', name: 'Dom Casmurro', fullTitle: 'Dom Casmurro' },
            { id: 'note-100', rawId: 100, type: 'note', name: 'Minha Nota Solta' },
          ],
          edges: [
            { id: 'e1', source: 'book-1', target: 1, type: 'book-theme' },
          ],
        })
      }
      return Promise.resolve([])
    })

    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    })
    await flushPromises()

    // Deve exibir o tema real
    expect(wrapper.text()).toContain('Clássicos')
    // O livro 'Dom Casmurro' deve ser renderizado como livro na estante
    expect(wrapper.find('[data-testid="user-book-card"]').text()).toContain('Dom Casmurro')
    // Mas NÃO deve existir como botão de tag de tema
    const themeButtons = wrapper.findAll('header button')
    const themeButtonTexts = themeButtons.map((b) => b.text())
    expect(themeButtonTexts.some((t) => t.includes('Clássicos'))).toBe(true)
    expect(themeButtonTexts.some((t) => t.includes('Dom Casmurro'))).toBe(false)
  })

  it('conta e filtra corretamente livros quando os nós do grafo possuem prefixo theme- e os livros possuem IDs numéricos ou nomes', async () => {
    const { resetUserBooksMemory } = await import('../../../app/composables/useUserBooks')
    const { resetGraphMemory } = await import('../../../app/composables/useGraph')
    resetUserBooksMemory()
    resetGraphMemory()
    await bookRepo.clear()

    await bookRepo.save({
      id: 201,
      bookId: 101,
      title: 'O Programador Pragmático',
      themes: [{ id: 42, name: 'Programação', color: '#E57B55' }],
      status: 'LENDO',
      currentPage: 30,
      lastAccessedAt: '2026-09-10T10:00:00.000Z'
    })
    await bookRepo.save({
      id: 202,
      bookId: 102,
      title: 'Código Limpo',
      themes: [{ id: 42, name: 'Programação', color: '#E57B55' }],
      status: 'LENDO',
      currentPage: 15,
      lastAccessedAt: '2026-09-09T10:00:00.000Z'
    })
    await bookRepo.save({
      id: 203,
      bookId: 103,
      title: 'A Divina Comédia',
      themes: [{ id: 99, name: 'Literatura', color: '#38BDF8' }],
      status: 'LENDO',
      currentPage: 5,
      lastAccessedAt: '2026-09-08T10:00:00.000Z'
    })

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/graph')) {
        return Promise.resolve({
          nodes: [
            { id: 'theme-42', rawId: 42, type: 'theme', name: 'Programação', color: '#E57B55' },
            { id: 'theme-99', rawId: 99, type: 'theme', name: 'Literatura', color: '#38BDF8' },
            { id: 'book-101', rawId: 101, type: 'book', name: 'O Programador...' },
            { id: 'book-102', rawId: 102, type: 'book', name: 'Código Limpo' },
            { id: 'book-103', rawId: 103, type: 'book', name: 'A Divina Comédia' },
          ],
          edges: [
            { id: 'e1', source: 'book-101', target: 'theme-42', type: 'book-theme' },
            { id: 'e2', source: 'book-102', target: 'theme-42', type: 'book-theme' },
            { id: 'e3', source: 'book-103', target: 'theme-99', type: 'book-theme' },
          ]
        })
      }
      return Promise.resolve([])
    })

    const wrapper = mount(LibraryPage, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    })
    await flushPromises()

    // A contagem deve ser correta: 2 para Programação e 1 para Literatura (não 0)
    expect(wrapper.text()).toContain('Programação')
    expect(wrapper.text()).toContain('(2)')
    expect(wrapper.text()).toContain('Literatura')
    expect(wrapper.text()).toContain('(1)')

    // Antes do filtro, todos os 3 livros são exibidos
    let cards = wrapper.findAll('[data-testid="user-book-card"]')
    expect(cards.length).toBe(3)

    // Clica no botão de filtrar por Programação
    const progBtn = wrapper.findAll('header button').find((b) => b.text().includes('Programação'))
    expect(progBtn).toBeDefined()
    await progBtn!.trigger('click')
    await flushPromises()

    // Deve exibir apenas os 2 livros de Programação
    cards = wrapper.findAll('[data-testid="user-book-card"]')
    expect(cards.length).toBe(2)
    expect(wrapper.text()).toContain('O Programador Pragmático')
    expect(wrapper.text()).toContain('Código Limpo')
    expect(wrapper.text()).not.toContain('A Divina Comédia')

    // Clica novamente para desmarcar o filtro
    await progBtn!.trigger('click')
    await flushPromises()

    // Todos os 3 livros voltam a ser exibidos
    cards = wrapper.findAll('[data-testid="user-book-card"]')
    expect(cards.length).toBe(3)
  })
})
