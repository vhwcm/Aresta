import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import IndexPage from '~/pages/index.vue'
import * as authComposable from '~/composables/useAuth'

describe('Index Page (Landing Page & Home)', () => {
  const commonStubs = {
    NuxtLink: { template: '<a><slot /></a>' },
    ReadingStreak: { template: '<div data-testid="reading-streak">5</div>' },
    EbbinghausChart: { template: '<div data-testid="ebbinghaus-chart">Gráfico Ebbinghaus D3</div>' },
    SidebarGraph: { template: '<div data-testid="sidebar-graph">Grafo de Conhecimento</div>' },
    ArestaLogoGraph: { template: '<div data-testid="aresta-logo-graph">Logo Grafo</div>' },
    HomeBookReaderDemo: { template: '<div data-testid="home-book-reader-demo">Demonstração do Leitor</div>' },
    HomeKnowledgeGraphDemo: { template: '<div data-testid="home-knowledge-graph-demo">Demonstração do Grafo</div>' },
    ArrowRightIcon: true,
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
    LightbulbIcon: true
  }

  it('renders guest landing page with PKM, deep reading, copywriting questions, de-emphasized forgetting curve, and CTA', async () => {
    vi.spyOn(authComposable, 'useAuth').mockReturnValue({
      token: ref(null),
      user: ref(null),
      isLoggedIn: ref(false),
      isAdmin: ref(false),
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
    expect(wrapper.find('[data-testid="home-book-reader-demo"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="home-knowledge-graph-demo"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Transforme sua leitura em uma rede viva de conhecimento e competência')
    expect(wrapper.text()).toContain('Experimentar o Aresta Gratuitamente')
    expect(wrapper.text()).toContain('Anti-Dopaminérgico')

    // Verificação da Seção 1: Benefícios da Leitura Profunda e Neurociência
    expect(wrapper.text()).toContain('Neurociência Cognitiva & Pesquisas Científicas')
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
    expect(wrapper.text()).toContain('Ciência da Aprendizagem & Memória de Longo Prazo')
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
    expect(wrapper.text()).toContain('Leitura Imersiva')
    expect(wrapper.text()).toContain('Grafo Conceitual')
    expect(wrapper.text()).toContain('Retenção Ativa')
    expect(wrapper.text()).toContain('Conversor PDF')
    expect(wrapper.text()).toContain('A Revisão de Conhecimento & Curva de Ebbinghaus')
    expect(wrapper.find('[data-testid="ebbinghaus-info-link"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="ebbinghaus-chart"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="landing-cta-login-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="landing-cta-register-btn"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Acessar Conta')
    expect(wrapper.text()).toContain('Criar Conta')

    // Verifica que a apresentação das seções científicas e pilares vem antes da Curva de Esquecimento
    const fullText = wrapper.text()
    const readingBenefitsIndex = fullText.indexOf('Por que a leitura profunda molda a arquitetura do seu raciocínio')
    const noteRetentionIndex = fullText.indexOf('Por que anotar multiplica a retenção')
    const competentIndex = fullText.indexOf('Gostaria de se sentir mais competente?')
    const pilaresIndex = fullText.indexOf('O Ecossistema Completo do Leitor')
    const ebbinghausIndex = fullText.indexOf('A Revisão de Conhecimento & Curva de Ebbinghaus')

    expect(readingBenefitsIndex).toBeLessThan(noteRetentionIndex)
    expect(noteRetentionIndex).toBeLessThan(competentIndex)
    expect(competentIndex).toBeLessThan(pilaresIndex)
    expect(pilaresIndex).toBeLessThan(ebbinghausIndex)
  })

  it('renders active reader home dashboard with flashcard above 3 notes and Ebbinghaus info link when logged in', () => {
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

    expect(wrapper.find('[data-testid="auth-home"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="guest-landing"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('O Alienista')
    expect(wrapper.text()).toContain('33%')
    expect(wrapper.text()).toContain('Flashcards do Dia')
    expect(wrapper.text()).toContain('Por que revisar?')
    expect(wrapper.text()).toContain('1º Flashcard de Hoje')
    expect(wrapper.text()).toContain('Fazer Flashcard')
    expect(wrapper.text()).toContain('Anotações & Destaques')

    // Verifica que 3 anotações são renderizadas
    expect(wrapper.text()).toContain('A razão é a perfeita saúde da alma')
    expect(wrapper.text()).toContain('A ciência é a minha esposa única')
    expect(wrapper.text()).toContain('A loucura, objeto dos meus estudos')

    // Verifica que Flashcards do Dia aparece antes de Anotações & Destaques
    const text = wrapper.text()
    const flashcardsIndex = text.indexOf('Flashcards do Dia')
    const notesIndex = text.indexOf('Anotações & Destaques')
    expect(flashcardsIndex).toBeLessThan(notesIndex)

    expect(wrapper.find('[data-testid="reading-streak"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="toggle-graph-open-btn"]').exists()).toBe(true)
  })

  it('allows expanding the knowledge graph from collapsed state and retracting it back', async () => {
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

    // Inicialmente o grafo está recolhido (foco na leitura centralizada)
    expect(wrapper.find('[data-testid="home-graph-section"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="toggle-graph-open-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="auth-home"]').classes()).toContain('max-w-3xl')

    // Clicar para expandir o grafo
    await wrapper.find('[data-testid="toggle-graph-open-btn"]').trigger('click')

    // Grafo expandido: seção visível, layout em grid
    expect(wrapper.find('[data-testid="home-graph-section"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="retract-graph-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="toggle-graph-open-btn"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="auth-home"]').classes()).toContain('grid')

    // Clicar no botão para retrair novamente
    await wrapper.find('[data-testid="retract-graph-btn"]').trigger('click')

    // Grafo volta a ficar oculto
    expect(wrapper.find('[data-testid="home-graph-section"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="toggle-graph-open-btn"]').exists()).toBe(true)
  })
})
