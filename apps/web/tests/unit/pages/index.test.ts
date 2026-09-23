import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import IndexPage from '~/pages/index.vue'
import * as authComposable from '~/composables/useAuth'

describe('Index Page (Landing Page & Home)', () => {
  const commonStubs = {
    NuxtLink: {
      template: '<a :href="to" :to="to"><slot /></a>',
      props: ['to']
    },
    UnifiedCanvasHub: { template: '<div data-testid="auth-home">Unified Canvas Hub</div>' },
    ReadingStreak: { template: '<div data-testid="reading-streak">5</div>' },
    EbbinghausChart: { template: '<div data-testid="ebbinghaus-chart">Gráfico Ebbinghaus D3</div>' },
    ArestaLogoGraph: { template: '<div data-testid="aresta-logo-graph">Logo Grafo</div>' },
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
    expect(wrapper.find('[data-testid="home-canvas-notes-demo"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="home-knowledge-graph-demo"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Transforme cada livro e anotação em retenção duradoura de conhecimento')
    expect(wrapper.text()).toContain('Experimentar o Aresta Gratuitamente')
    expect(wrapper.text()).toContain('Por que usar o Aresta?')
    expect(wrapper.text()).toContain('anti-dopaminérgico')
  })

  it('renders UnifiedCanvasHub workspace when user is logged in', () => {
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
    expect(wrapper.text()).toContain('Unified Canvas Hub')
  })
})
