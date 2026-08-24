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
    InfoIcon: true
  }

  it('renders guest landing page with Ebbinghaus forgetting curve highlight and login/register tabs when not logged in', async () => {
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
    expect(wrapper.text()).toContain('A Revisão de Conhecimento')
    expect(wrapper.find('[data-testid="ebbinghaus-info-link"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="ebbinghaus-chart"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Leitura Imersiva')
    expect(wrapper.text()).toContain('Grafo Conceitual')
    expect(wrapper.text()).toContain('Retenção Ativa')
    expect(wrapper.text()).toContain('Conversor PDF')
    expect(wrapper.text()).toContain('Acessar Conta')
    expect(wrapper.text()).toContain('Criar Conta')

    // Alternar para aba de Registro
    const registerTab = wrapper.find('[data-testid="tab-register"]')
    await registerTab.trigger('click')

    expect(wrapper.find('[data-testid="register-name-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="register-email-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="register-password-input"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Criar Conta e Começar')
  })

  it('renders active reader home dashboard with single note and Ebbinghaus info link when logged in', () => {
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
    expect(wrapper.text()).toContain('Anotações & Destaques')
    expect(wrapper.text()).toContain('Flashcards do Dia')
    expect(wrapper.text()).toContain('Por que revisar? (Curva de Ebbinghaus)')
    expect(wrapper.text()).toContain('1º Flashcard de Hoje')
    expect(wrapper.text()).toContain('Fazer Flashcard')
    expect(wrapper.find('[data-testid="reading-streak"]').exists()).toBe(true)
  })
})
