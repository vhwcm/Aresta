import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import LoginPage from '~/pages/login.vue'
import * as authComposable from '~/composables/useAuth'
import * as settingsComposable from '~/composables/useSettings'

describe('Login & Register Dedicated Page Component', () => {
  let loginMock: any
  let registerMock: any
  let loadFromServerMock: any

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const commonStubs = {
    NuxtLink: { template: '<a><slot /></a>' },
    ArestaLogoGraph: { template: '<div data-testid="aresta-logo">Logo</div>' },
    UserIcon: true,
    LockIcon: true,
    MailIcon: true,
    KeyIcon: true,
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
      fetchCurrentUser: vi.fn()
    } as any)

    vi.spyOn(settingsComposable, 'useSettings').mockReturnValue({
      loadFromServer: loadFromServerMock
    } as any)
  })

  it('renders dedicated 2-column page with title, copywriting, benefits and login form', () => {
    const wrapper = mount(LoginPage, {
      global: {
        stubs: commonStubs
      }
    })

    // Coluna esquerda: Copywriting e benefícios
    expect(wrapper.text()).toContain('Acesso Imediato')
    expect(wrapper.text()).toContain('Pronto para transformar sua leitura em')
    expect(wrapper.text()).toContain('sabedoria duradoura')
    expect(wrapper.text()).toContain('Junte-se a leitores, estudantes e pesquisadores')
    expect(wrapper.text()).toContain('Leitor universal para seus arquivos EPUB e PDF')
    expect(wrapper.text()).toContain('Grafo de conexões conceituais navegável')
    expect(wrapper.text()).toContain('Flashcards inteligentes e repetição espaçada')
    expect(wrapper.text()).toContain('100% livre de distrações, anúncios e algoritmos viciantes')

    // Coluna direita: Card com abas e formulário de login
    expect(wrapper.find('[data-testid="tab-login"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tab-register"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Acesso Rápido Demo')
    expect(wrapper.text()).toContain('viktor')
    expect(wrapper.text()).toContain('orlaweb123123#')
    expect(wrapper.find('[data-testid="login-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="password-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="submit-login-btn"]').exists()).toBe(true)
  })

  it('allows switching to register tab and submitting account creation form', async () => {
    const wrapper = mount(LoginPage, {
      global: {
        stubs: commonStubs
      }
    })

    const registerTab = wrapper.find('[data-testid="tab-register"]')
    await registerTab.trigger('click')

    // Campos da aba de registro
    expect(wrapper.find('[data-testid="register-name-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="register-email-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="register-password-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="submit-register-btn"]').exists()).toBe(true)

    await wrapper.find('[data-testid="register-name-input"]').setValue('Ana Silva')
    await wrapper.find('[data-testid="register-email-input"]').setValue('ana@exemplo.com')
    await wrapper.find('[data-testid="register-password-input"]').setValue('senha123456')

    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(registerMock).toHaveBeenCalledWith('Ana Silva', 'ana@exemplo.com', 'senha123456')
  })

  it('submits login form and triggers auth.login', async () => {
    const wrapper = mount(LoginPage, {
      global: {
        stubs: commonStubs
      }
    })

    await wrapper.find('[data-testid="login-input"]').setValue('viktor')
    await wrapper.find('[data-testid="password-input"]').setValue('orlaweb123123#')

    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(loginMock).toHaveBeenCalledWith('viktor', 'orlaweb123123#')
  })

  it('displays error message when login fails', async () => {
    loginMock.mockResolvedValueOnce({
      success: false,
      error: 'Credenciais inválidas'
    })

    const wrapper = mount(LoginPage, {
      global: {
        stubs: commonStubs
      }
    })

    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(wrapper.text()).toContain('Credenciais inválidas')
  })
})
