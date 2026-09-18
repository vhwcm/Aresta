import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import IndexPage from '~/pages/index.vue'
import * as authComposable from '~/composables/useAuth'
import { useUserBooks } from '~/composables/useUserBooks'
import { useAnnotations } from '~/composables/useAnnotations'
import { useFlashcards } from '~/composables/useFlashcards'

vi.mock('~/composables/useUserBooks', () => ({
  useUserBooks: vi.fn()
}))

vi.mock('~/composables/useAnnotations', () => ({
  useAnnotations: vi.fn()
}))

vi.mock('~/composables/useFlashcards', () => ({
  useFlashcards: vi.fn()
}))

describe('Index Page (Landing Page & Home)', () => {
  beforeEach(() => {
    vi.mocked(useUserBooks).mockReturnValue({
      userBooks: ref([
        {
          id: 1,
          bookId: 1,
          userBookId: 1,
          title: 'O Alienista',
          author: 'Machado de Assis',
          currentPage: 42,
          totalPages: 128,
          status: 'LENDO'
        }
      ]),
      loading: ref(false),
      error: ref(null),
      fetchUserBooks: vi.fn().mockResolvedValue(undefined),
      addUserBook: vi.fn(),
      updateUserBook: vi.fn(),
      recordBookAccess: vi.fn(),
      clearLocalBooks: vi.fn()
    } as any)

    vi.mocked(useAnnotations).mockReturnValue({
      annotations: ref([]),
      loading: ref(false),
      error: ref(null),
      fetchAnnotations: vi.fn().mockResolvedValue([]),
      createAnnotation: vi.fn(),
      updateAnnotationNote: vi.fn(),
      deleteAnnotation: vi.fn(),
      convertAnnotationToFlashcard: vi.fn()
    } as any)

    vi.mocked(useFlashcards).mockReturnValue({
      dailyDeck: ref([]),
      firstCard: ref(null),
      isLoading: ref(false),
      isSubmitting: ref(false),
      error: ref(null),
      deckDate: ref(''),
      totalCards: ref(0),
      reviewedCount: ref(0),
      fetchDailyDeck: vi.fn().mockResolvedValue(null),
      fetchFirstDailyCard: vi.fn().mockResolvedValue(null),
      reviewFlashcard: vi.fn(),
      generateBatch: vi.fn()
    } as any)
  })

  const commonStubs = {
    NuxtLink: {
      template: '<a :href="to" :to="to"><slot /></a>',
      props: ['to']
    },
    ReadingStreak: { template: '<div data-testid="reading-streak">5</div>' },
    EbbinghausChart: { template: '<div data-testid="ebbinghaus-chart">Gráfico Ebbinghaus D3</div>' },
    SidebarGraph: { template: '<div data-testid="sidebar-graph">Grafo de Conhecimento</div>' },
    ArestaLogoGraph: { template: '<div data-testid="aresta-logo-graph">Logo Grafo</div>' },
    HomeBookReaderDemo: { template: '<div data-testid="home-book-reader-demo">Demonstração do Leitor</div>' },
    HomeCanvasNotesDemo: { template: '<div data-testid="home-canvas-notes-demo">Demonstração do Canvas e Notas</div>' },
    HomeKnowledgeGraphDemo: { template: '<div data-testid="home-knowledge-graph-demo">Demonstração do Grafo</div>' },
    FeedbackCanvas: { template: '<div data-testid="feedback-canvas-stub" :data-open="isOpen" />', props: ['isOpen'] },
    ArrowRightIcon: true,
    LibraryIcon: true,
    BrainIcon: true,
    BookOpenIcon: true,
    NetworkIcon: true,
    FileCode2Icon: true,
    FileTextIcon: true,
    UserIcon: true,
    LockIcon: true,
    MailIcon: true,
    KeyIcon: true,
    AlertCircleIcon: true,
    InfoIcon: true,
    MessageSquareIcon: true,
    PanelRightCloseIcon: true,
    PanelRightOpenIcon: true,
    SparklesIcon: true,
    ZapOffIcon: true,
    TargetIcon: true,
    GraduationCapIcon: true,
    CompassIcon: true,
    CheckCircle2Icon: true,
    MicroscopeIcon: true,
    HeartPulseIcon: true,
    ShieldCheckIcon: true,
    LayersIcon: true,
    LightbulbIcon: true,
    LayoutGridIcon: true,
    PlusIcon: true,
    SunIcon: true,
    MoonIcon: true,
    PaletteIcon: true,
    UploadIcon: true
  }

  it('renders landing page for guest visitor with reading and retention scientific sections', () => {
    vi.spyOn(authComposable, 'useAuth').mockReturnValue({
      token: ref(null),
      user: ref(null),
      isLoggedIn: ref(false),
      isAdmin: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      deleteAccount: vi.fn(),
      fetchCurrentUser: vi.fn()
    } as any)

    const wrapper = mount(IndexPage, {
      global: {
        stubs: commonStubs
      }
    })

    expect(wrapper.find('[data-testid="guest-landing"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="auth-home"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="home-book-reader-demo"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="home-canvas-notes-demo"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="home-knowledge-graph-demo"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Transforme cada livro e anotação em retenção duradoura de conhecimento')
    expect(wrapper.text()).toContain('Experimentar o Aresta Gratuitamente')
    expect(wrapper.text()).toContain('Por que usar o Aresta?')
    expect(wrapper.text()).toContain('anti-dopaminérgico')

    // Verificação da Seção 1: Benefícios da Leitura Profunda e Neurociência
    expect(wrapper.text()).toContain('Por que a leitura profunda molda a arquitetura do seu raciocínio')
    expect(wrapper.text()).toContain('Raciocínio Lógico & Pensamento Crítico')
    expect(wrapper.text()).toContain('Stanford University')
    expect(wrapper.text()).toContain('Neuroplasticidade & Conectividade Expandida')
    expect(wrapper.text()).toContain('Emory University (fMRI)')
    expect(wrapper.text()).toContain('Reserva Cognitiva & Blindagem Cerebral')
    expect(wrapper.text()).toContain('Teoria da Mente & Inteligência Social')
    expect(wrapper.text()).toContain('Desaceleração Fisiológica do Estresse')
    expect(wrapper.text()).toContain('Fluência Verbal & Articulação de Ideias')

    // Verificação da Seção 2: Importância da Anotação e Síntese Ativa para Retenção
    expect(wrapper.text()).toContain('Por que anotar multiplica a retenção e transforma leitura em competência')
    expect(wrapper.text()).toContain('Processamento Semântico Profundo')
    expect(wrapper.text()).toContain('Craik & Lockhart')
    expect(wrapper.text()).toContain('Efeito de Geração & Síntese')
    expect(wrapper.text()).toContain('Mueller & Oppenheimer')
    expect(wrapper.text()).toContain('Recuperação Ativa de Memória')
    expect(wrapper.text()).toContain('Roediger & Karpicke')
    expect(wrapper.text()).toContain('Externalização em Grafo Vivo')

    expect(wrapper.text()).toContain('Gostaria de se sentir mais competente?')
    expect(wrapper.text()).toContain('Quer se tornar especialista em algo?')
    expect(wrapper.text()).toContain('Quer dominar um novo hobby ou paixão?')
    expect(wrapper.text()).toContain('Quer transformar seus estudos e melhorar sua vida?')
    expect(wrapper.text()).toContain('Silêncio Cognitivo')
    expect(wrapper.text()).toContain('1. Leitura de Livros')
    expect(wrapper.text()).toContain('2. Notas Ativas')
    expect(wrapper.text()).toContain('3. Canvas Espacial')
    expect(wrapper.text()).toContain('4. Retenção Permanente')
    expect(wrapper.text()).toContain('A Revisão de Conhecimento & Curva de Ebbinghaus')
    expect(wrapper.find('[data-testid="ebbinghaus-info-link"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="ebbinghaus-chart"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="landing-cta-login-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="landing-cta-register-btn"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Acessar Conta')
    expect(wrapper.text()).toContain('Criar Conta')

    // Verifica a ordem das seções: Leitura Profunda -> Ciência da Anotação -> Curva de Ebbinghaus -> Indagações -> Pilares
    const fullText = wrapper.text()
    const readingBenefitsIndex = fullText.indexOf('Por que a leitura profunda molda a arquitetura do seu raciocínio')
    const noteRetentionIndex = fullText.indexOf('Por que anotar multiplica a retenção')
    const ebbinghausIndex = fullText.indexOf('A Revisão de Conhecimento & Curva de Ebbinghaus')
    const competentIndex = fullText.indexOf('Gostaria de se sentir mais competente?')
    const pilaresIndex = fullText.indexOf('O Ecossistema Completo de Retenção de Conhecimento')

    expect(readingBenefitsIndex).toBeLessThan(noteRetentionIndex)
    expect(noteRetentionIndex).toBeLessThan(ebbinghausIndex)
    expect(ebbinghausIndex).toBeLessThan(competentIndex)
    expect(competentIndex).toBeLessThan(pilaresIndex)
  })

  it('renders informative empty states when logged in and has no notes or flashcards without using mocks', () => {
    vi.spyOn(authComposable, 'useAuth').mockReturnValue({
      token: ref('valid-jwt-token'),
      user: ref({ id: 1, name: 'viktor', email: 'viktor@aresta.org', role: 'ADMIN', isActive: true }),
      isLoggedIn: ref(true),
      isAdmin: ref(true),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      deleteAccount: vi.fn(),
      fetchCurrentUser: vi.fn()
    } as any)

    vi.mocked(useAnnotations).mockReturnValue({
      annotations: ref([]),
      loading: ref(false),
      error: ref(null),
      fetchAnnotations: vi.fn().mockResolvedValue([]),
      createAnnotation: vi.fn(),
      updateAnnotationNote: vi.fn(),
      deleteAnnotation: vi.fn(),
      convertAnnotationToFlashcard: vi.fn()
    } as any)

    vi.mocked(useFlashcards).mockReturnValue({
      dailyDeck: ref([]),
      firstCard: ref(null),
      isLoading: ref(false),
      isSubmitting: ref(false),
      error: ref(null),
      deckDate: ref(''),
      totalCards: ref(0),
      reviewedCount: ref(0),
      fetchDailyDeck: vi.fn().mockResolvedValue(null),
      fetchFirstDailyCard: vi.fn().mockResolvedValue(null),
      reviewFlashcard: vi.fn(),
      generateBatch: vi.fn()
    } as any)

    const wrapper = mount(IndexPage, {
      global: {
        stubs: commonStubs
      }
    })

    expect(wrapper.find('[data-testid="auth-home"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="guest-landing"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('O Alienista')
    expect(wrapper.text()).toContain('33%')
    expect(wrapper.find('[data-testid="home-new-canvas-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="home-notes-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="home-notes-btn"]').attributes('to')).toBe('/canvas')

    // Verifica que informa a falta de flashcards e de anotações
    expect(wrapper.text()).toContain('Nenhum flashcard disponível')
    expect(wrapper.text()).toContain('Nenhuma anotação disponível')

    // Verifica a ordem dos tópicos: Leitura -> Canvas/Notas -> Flashcards -> Anotações
    const text = wrapper.text()
    const leituraIndex = text.indexOf('O Alienista')
    const canvasIndex = text.indexOf('Novo Canvas')
    const flashcardsIndex = text.indexOf('Flashcards do Dia')
    const notesIndex = text.indexOf('Anotações & Destaques')

    expect(leituraIndex).toBeLessThan(canvasIndex)
    expect(canvasIndex).toBeLessThan(flashcardsIndex)
    expect(flashcardsIndex).toBeLessThan(notesIndex)

    // Verifica presença dos botões de continuar leitura e de atalho para a estante
    expect(wrapper.find('[data-testid="continue-reading-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="home-library-btn"]').exists()).toBe(true)
  })

  it('renders real user notes and flashcards when available', () => {
    vi.spyOn(authComposable, 'useAuth').mockReturnValue({
      token: ref('valid-jwt-token'),
      user: ref({ id: 1, name: 'viktor', email: 'viktor@aresta.org', role: 'ADMIN', isActive: true }),
      isLoggedIn: ref(true),
      isAdmin: ref(true),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      deleteAccount: vi.fn(),
      fetchCurrentUser: vi.fn()
    } as any)

    vi.mocked(useAnnotations).mockReturnValue({
      annotations: ref([
        {
          id: 10,
          userId: 1,
          bookId: 1,
          chapterTitle: 'Capítulo I',
          selectedText: 'Citação real do leitor',
          note: 'Insight profundo real',
          createdAt: new Date().toISOString()
        }
      ]),
      loading: ref(false),
      error: ref(null),
      fetchAnnotations: vi.fn().mockResolvedValue([]),
      createAnnotation: vi.fn(),
      updateAnnotationNote: vi.fn(),
      deleteAnnotation: vi.fn(),
      convertAnnotationToFlashcard: vi.fn()
    } as any)

    vi.mocked(useFlashcards).mockReturnValue({
      dailyDeck: ref([]),
      firstCard: ref({
        id: 101,
        userId: 1,
        annotationId: 10,
        bookId: 1,
        bookTitle: 'O Alienista',
        chapterTitle: 'Capítulo I',
        question: 'Qual é o conceito essencial?',
        answer: 'Explicação detalhada.'
      } as any),
      isLoading: ref(false),
      isSubmitting: ref(false),
      error: ref(null),
      deckDate: ref(''),
      totalCards: ref(1),
      reviewedCount: ref(0),
      fetchDailyDeck: vi.fn().mockResolvedValue(null),
      fetchFirstDailyCard: vi.fn().mockResolvedValue(null),
      reviewFlashcard: vi.fn(),
      generateBatch: vi.fn()
    } as any)

    const wrapper = mount(IndexPage, {
      global: {
        stubs: commonStubs
      }
    })

    expect(wrapper.text()).toContain('Citação real do leitor')
    expect(wrapper.text()).toContain('Insight profundo real')
    expect(wrapper.text()).toContain('Qual é o conceito essencial?')
  })

  it('renders "Comece uma leitura" and redirects to /upload when new user has no books', () => {
    vi.spyOn(authComposable, 'useAuth').mockReturnValue({
      token: ref('valid-jwt-token'),
      user: ref({ id: 2, name: 'novo leitor', email: 'novo@aresta.org', role: 'USER', isActive: true }),
      isLoggedIn: ref(true),
      isAdmin: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      deleteAccount: vi.fn(),
      fetchCurrentUser: vi.fn()
    } as any)

    vi.mocked(useUserBooks).mockReturnValue({
      userBooks: ref([]),
      loading: ref(false),
      error: ref(null),
      fetchUserBooks: vi.fn().mockResolvedValue(undefined),
      addUserBook: vi.fn(),
      updateUserBook: vi.fn(),
      deleteUserBook: vi.fn(),
      recordBookAccess: vi.fn(),
      clearLocalBooks: vi.fn()
    } as any)

    const wrapper = mount(IndexPage, {
      global: {
        stubs: commonStubs
      }
    })

    expect(wrapper.find('[data-testid="auth-home"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="start-reading-cover-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="start-reading-btn"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Comece uma leitura')
    expect(wrapper.text()).not.toContain('O Alienista')
  })

  it('renders knowledge graph open by default and allows retracting and re-expanding it', async () => {
    vi.spyOn(authComposable, 'useAuth').mockReturnValue({
      token: ref('valid-jwt-token'),
      user: ref({ id: 1, name: 'viktor', email: 'viktor@aresta.org', role: 'ADMIN', isActive: true }),
      isLoggedIn: ref(true),
      isAdmin: ref(true),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      deleteAccount: vi.fn(),
      fetchCurrentUser: vi.fn()
    } as any)

    const wrapper = mount(IndexPage, {
      global: {
        stubs: commonStubs
      }
    })

    // Inicialmente o grafo está aberto por padrão
    expect(wrapper.find('[data-testid="home-graph-section"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="retract-graph-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="expand-graph-btn"]').attributes('to')).toBe('/canvas?tab=notes')
    expect(wrapper.find('[data-testid="toggle-graph-open-btn"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="auth-home"]').classes()).toContain('grid')

    // Clicar para retrair o grafo
    await wrapper.find('[data-testid="retract-graph-btn"]').trigger('click')

    // Grafo retraído: seção oculta, layout centralizado
    expect(wrapper.find('[data-testid="home-graph-section"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="toggle-graph-open-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="auth-home"]').classes()).toContain('max-w-3xl')

    // Clicar no botão para re-expandir
    await wrapper.find('[data-testid="toggle-graph-open-btn"]').trigger('click')

    // Grafo volta a ficar visível
    expect(wrapper.find('[data-testid="home-graph-section"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="retract-graph-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="toggle-graph-open-btn"]').exists()).toBe(false)
  })

  it('renderiza os botões de benefícios e feedback no cabeçalho e abre o canvas de feedback', async () => {
    vi.spyOn(authComposable, 'useAuth').mockReturnValue({
      token: ref('valid-jwt-token'),
      user: ref({ id: 1, name: 'viktor', email: 'viktor@aresta.org', role: 'ADMIN', isActive: true }),
      isLoggedIn: ref(true),
      isAdmin: ref(true),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      deleteAccount: vi.fn(),
      fetchCurrentUser: vi.fn()
    } as any)

    const wrapper = mount(IndexPage, {
      global: {
        stubs: commonStubs
      }
    })

    const benefitsBtn = wrapper.find('[data-testid="header-benefits-btn"]')
    expect(benefitsBtn.exists()).toBe(true)
    expect(benefitsBtn.attributes('to') || benefitsBtn.attributes('href')).toBe('/beneficios')

    const feedbackBtn = wrapper.find('[data-testid="header-feedback-btn"]')
    expect(feedbackBtn.exists()).toBe(true)

    const canvasStub = wrapper.find('[data-testid="feedback-canvas-stub"]')
    expect(canvasStub.exists()).toBe(true)
    expect(canvasStub.attributes('data-open')).toBe('false')

    await feedbackBtn.trigger('click')
    expect(canvasStub.attributes('data-open')).toBe('true')
  })
})
