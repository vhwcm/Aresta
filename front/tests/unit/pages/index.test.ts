import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import IndexPage from '~/pages/index.vue'
import * as authComposable from '~/composables/useAuth'

describe('Index Page (Landing Page & Home)', () => {
  const commonStubs = {
    NuxtLink: { template: '<a><slot /></a>' },
    ReadingStreak: { template: '<div data-testid="reading-streak">Streak 5 dias</div>' },
    ArrowRightIcon: true,
    BrainIcon: true,
    SparklesIcon: true,
    BookOpenIcon: true,
    NetworkIcon: true,
    FileCode2Icon: true,
    SearchIcon: true,
    FileTextIcon: true,
    UserIcon: true,
    LockIcon: true,
    MailIcon: true,
    KeyIcon: true,
    AlertCircleIcon: true
  }

  it('renders guest landing page with 4 pillars and login/register tabs when not logged in', async () => {
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
    expect(wrapper.text()).toContain('Transforme sua leitura em uma rede viva de conhecimento')
    expect(wrapper.text()).toContain('Leitura Imersiva')
    expect(wrapper.text()).toContain('Grafo Conceitual')
    expect(wrapper.text()).toContain('Retenção Ativa')
    expect(wrapper.text()).toContain('Conversor PDF')
    expect(wrapper.text()).toContain('Acessar Conta')
    expect(wrapper.text()).toContain('Criar Conta')
    expect(wrapper.text()).toContain('viktor')

    // Alternar para aba de Registro
    const registerTab = wrapper.find('[data-testid="tab-register"]')
    await registerTab.trigger('click')

    expect(wrapper.find('[data-testid="register-name-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="register-email-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="register-password-input"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Criar Conta e Começar')
  })

  it('renders active reader home dashboard when logged in with token', () => {
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
    expect(wrapper.text()).toContain('Leitura Ativa')
    expect(wrapper.text()).toContain('O Alienista')
    expect(wrapper.text()).toContain('Pág. 42 / 128')
    expect(wrapper.text()).toContain('33%')
    expect(wrapper.text()).toContain('Anotações & Destaques')
    expect(wrapper.text()).toContain('Flashcards do Dia')
    expect(wrapper.text()).toContain('1º Flashcard de Hoje')
    expect(wrapper.text()).toContain('Fazer Flashcard')
    expect(wrapper.find('[data-testid="reading-streak"]').exists()).toBe(true)
  })
})
