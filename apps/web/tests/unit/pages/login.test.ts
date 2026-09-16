import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import LoginPage from '~/pages/login.vue'
import * as authComposable from '~/composables/useAuth'
import * as oauthComposable from '~/composables/useOAuth'
import * as settingsComposable from '~/composables/useSettings'

describe('Login Dedicated Page Component', () => {
  let loginMock: any
  let registerMock: any
  let loginWithOAuthMock: any
  let loadFromServerMock: any

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const commonStubs = {
    NuxtLink: { template: '<a><slot /></a>' },
    ArestaLogoGraph: { template: '<div data-testid="aresta-logo">Logo</div>' },
    AlertCircleIcon: true,
    ArrowRightIcon: true,
    ArrowLeftIcon: true,
    CheckCircle2Icon: true
  }

  beforeEach(() => {
    loginMock = vi.fn().mockResolvedValue({
      success: true,
      user: { id: 1, name: 'viktor', email: 'viktor@aresta.org', role: 'ADMIN', isActive: true }
    })
    registerMock = vi.fn().mockResolvedValue({
      success: true,
      user: { id: 2, name: 'Novo Usuário', email: 'novo@aresta.org', role: 'USER', isActive: true }
    })
    loginWithOAuthMock = vi.fn().mockResolvedValue({
      success: true,
      provider: 'google',
      user: { id: 1, name: 'Viktor Google', email: 'viktor@gmail.com', role: 'USER', isActive: true }
    })
    loadFromServerMock = vi.fn().mockResolvedValue({})

    vi.spyOn(authComposable, 'useAuth').mockReturnValue({
      token: ref(null),
      user: ref(null),
      isLoggedIn: ref(false),
      isAdmin: ref(false),
      login: loginMock,
      register: registerMock,
      logout: vi.fn(),
      deleteAccount: vi.fn(),
      fetchCurrentUser: vi.fn(),
      isOnboardingCompleted: vi.fn().mockReturnValue(true)
    } as any)

    vi.spyOn(oauthComposable, 'useOAuth').mockReturnValue({
      loginWithOAuth: loginWithOAuthMock,
      isLoggingIn: ref(false),
      oauthError: ref(null)
    } as any)

    vi.spyOn(settingsComposable, 'useSettings').mockReturnValue({
      loadFromServer: loadFromServerMock
    } as any)
  })

  it('renders dedicated 2-column page with title, copywriting, benefits and Google login button', () => {
    const wrapper = mount(LoginPage, {
      global: {
        stubs: commonStubs
      }
    })

    // Navegação e ausência de logo externo
    expect(wrapper.find('[data-testid="back-to-home-link"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="mobile-back-to-home-link"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Voltar ao Início')
    expect(wrapper.find('[data-testid="aresta-logo"]').exists()).toBe(false)

    // Coluna esquerda: Copywriting e benefícios
    expect(wrapper.text()).toContain('Pronto para transformar sua leitura em')
    expect(wrapper.text()).toContain('sabedoria duradoura')
    expect(wrapper.text()).toContain('Junte-se a leitores, estudantes e pesquisadores')
    expect(wrapper.text()).toContain('Leitor universal para seus arquivos EPUB e PDF')
    expect(wrapper.text()).toContain('Grafo de conexões conceituais navegável')
    expect(wrapper.text()).toContain('Flashcards inteligentes e repetição espaçada')
    expect(wrapper.text()).toContain('100% livre de distrações, anúncios e algoritmos viciantes')
    expect(wrapper.find('.hidden.lg\\:flex').exists()).toBe(true)

    // Coluna direita: Card exclusivo para Google OAuth
    expect(wrapper.find('[data-testid="oauth-google-btn"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Continuar com Google')
    expect(wrapper.find('[data-testid="tab-login"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="tab-register"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="login-input"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="password-input"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="oauth-microsoft-btn"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="oauth-apple-btn"]').exists()).toBe(false)
  })

  it('triggers Google OAuth login when clicking the Google button', async () => {
    const wrapper = mount(LoginPage, {
      global: {
        stubs: commonStubs
      }
    })

    const googleBtn = wrapper.find('[data-testid="oauth-google-btn"]')
    expect(googleBtn.exists()).toBe(true)
    await googleBtn.trigger('click')

    expect(loginWithOAuthMock).toHaveBeenCalledWith('google')
  })

  it('displays error message when OAuth login fails', async () => {
    loginWithOAuthMock.mockResolvedValueOnce({
      success: false,
      error: 'Popup bloqueado pelo navegador. Por favor, autorize popups para entrar.'
    })

    const wrapper = mount(LoginPage, {
      global: {
        stubs: commonStubs
      }
    })

    const googleBtn = wrapper.find('[data-testid="oauth-google-btn"]')
    await googleBtn.trigger('click')

    expect(wrapper.text()).toContain('Popup bloqueado pelo navegador. Por favor, autorize popups para entrar.')
  })
})

