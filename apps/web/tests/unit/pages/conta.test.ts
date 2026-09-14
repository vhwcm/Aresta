import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ContaPage from '~/pages/conta.vue'
import { useSettings } from '~/composables/useSettings'

describe('Conta Page (/conta)', () => {
  const defaultStubs = {
    NuxtLink: { template: '<a><slot /></a>' },
    UserIcon: true,
    CrownIcon: true,
    BookOpenIcon: true,
    ClockIcon: true,
    NetworkIcon: true,
    CheckCircle2Icon: true,
    BrainIcon: true,
    FileCode2Icon: true,
    ShieldCheckIcon: true,
    ShieldAlertIcon: true,
    AlertTriangleIcon: true,
    LogOutIcon: true,
    Trash2Icon: true,
    XIcon: true,
    SunIcon: true,
    MoonIcon: true,
    SlidersIcon: true,
    TypeIcon: true,
    CheckIcon: true,
    PaletteIcon: true,
    CloudIcon: true,
  }

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    const { setDesktopHomeGraphOpen, setPageAnimationEnabled, setPageCreaseEnabled } = useSettings()
    setDesktopHomeGraphOpen(true)
    setPageAnimationEnabled(true)
    setPageCreaseEnabled(true)
  })

  it('renders user profile, reading metrics, preferences section, and danger zone', () => {
    const wrapper = mount(ContaPage, {
      global: {
        stubs: defaultStubs,
      },
    })

    expect(wrapper.text()).toContain('Sua Conta')
    expect(wrapper.text()).toContain('Métricas de Leitura & Conhecimento')
    expect(wrapper.find('[data-testid="account-preferences-section"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Configurações da Aplicação')
    expect(wrapper.text()).toContain('Aresta Pro')
    expect(wrapper.text()).toContain('Zona de Perigo & Segurança')
    expect(wrapper.text()).toContain('Fazer Logout')
    expect(wrapper.text()).toContain('Deletar Minha Conta')
  })

  it('permite alternar o tema unificado do app e de leitura (claro, escuro, livro)', async () => {
    const wrapper = mount(ContaPage, {
      global: {
        stubs: defaultStubs,
      },
    })
    const { readerTheme } = useSettings()

    const lightBtn = wrapper.find('[data-testid="theme-light-btn"]')
    const darkBtn = wrapper.find('[data-testid="theme-dark-btn"]')
    const sepiaBtn = wrapper.find('[data-testid="theme-sepia-btn"]')

    expect(lightBtn.exists()).toBe(true)
    expect(darkBtn.exists()).toBe(true)
    expect(sepiaBtn.exists()).toBe(true)
    expect(wrapper.text()).toContain('Claro (Light)')

    // Clica para ativar modo escuro
    await darkBtn.trigger('click')
    expect(wrapper.text()).toContain('Escuro (Dark)')
    expect(readerTheme.value).toBe('black')
    expect(localStorage.getItem('aresta_reader_theme')).toBe('black')

    // Clica para ativar modo livro/sepia
    await sepiaBtn.trigger('click')
    expect(wrapper.text()).toContain('Amarelado (Kindle / Livro)')
    expect(readerTheme.value).toBe('sepia')
    expect(localStorage.getItem('aresta_reader_theme')).toBe('sepia')

    // Clica para voltar ao modo claro
    await lightBtn.trigger('click')
    expect(wrapper.text()).toContain('Claro (Light)')
    expect(readerTheme.value).toBe('white')
    expect(localStorage.getItem('aresta_reader_theme')).toBe('white')
  })

  it('permite alternar o switch unificado de Virada de Página 3D e Efeitos de Livro Físico', async () => {
    const wrapper = mount(ContaPage, {
      global: {
        stubs: defaultStubs,
      },
    })

    const pageAnimationToggle = wrapper.find('[data-testid="toggle-page-animation"]')
    expect(pageAnimationToggle.exists()).toBe(true)

    // Inicia como ativado por padrão
    expect(pageAnimationToggle.attributes('aria-checked')).toBe('true')
    expect(wrapper.text()).toContain('Ativado (3D & Livro Físico)')

    // Alterna para desativado
    await pageAnimationToggle.trigger('click')
    expect(pageAnimationToggle.attributes('aria-checked')).toBe('false')
    expect(wrapper.text()).toContain('Desativado (Instantâneo)')
    let saved = JSON.parse(localStorage.getItem('aresta_settings') || '{}')
    expect(saved.pageAnimationEnabled).toBe(false)
    expect(saved.pageCreaseEnabled).toBe(false)

    // Alterna de volta para ativado
    await pageAnimationToggle.trigger('click')
    expect(pageAnimationToggle.attributes('aria-checked')).toBe('true')
    expect(wrapper.text()).toContain('Ativado (3D & Livro Físico)')
    saved = JSON.parse(localStorage.getItem('aresta_settings') || '{}')
    expect(saved.pageAnimationEnabled).toBe(true)
    expect(saved.pageCreaseEnabled).toBe(true)
  })

  it('não exibe configurações globais de grafo na tela inicial e fontes na página de conta', () => {
    const wrapper = mount(ContaPage, {
      global: {
        stubs: defaultStubs,
      },
    })

    expect(wrapper.find('[data-testid="toggle-desktop-home-graph"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="decrease-font-btn"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="font-option-merriweather"]').exists()).toBe(false)
  })

  it('opens delete modal and enables delete button only when phrase is correctly typed', async () => {
    const wrapper = mount(ContaPage, {
      global: {
        stubs: defaultStubs,
      },
    })

    // Modal inicialmente fechado
    expect(wrapper.find('[data-testid="delete-confirmation-input"]').exists()).toBe(false)

    // Clica em Deletar Minha Conta
    const openBtn = wrapper.find('[data-testid="open-delete-modal-btn"]')
    await openBtn.trigger('click')

    // Modal aberto
    const input = wrapper.find('[data-testid="delete-confirmation-input"]')
    expect(input.exists()).toBe(true)

    const confirmBtn = wrapper.find('[data-testid="confirm-delete-account-btn"]')
    // Botão inicialmente desabilitado
    expect((confirmBtn.element as HTMLButtonElement).disabled).toBe(true)

    // Digita frase errada
    await input.setValue('deletar conta')
    expect((confirmBtn.element as HTMLButtonElement).disabled).toBe(true)

    // Digita frase exata
    await input.setValue('deletar minha conta permanentemente')
    expect((confirmBtn.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('opens logout confirmation modal when clicking logout button', async () => {
    const wrapper = mount(ContaPage, {
      global: {
        stubs: defaultStubs,
      },
    })

    const logoutBtn = wrapper.find('[data-testid="logout-btn"]')
    expect(logoutBtn.exists()).toBe(true)

    await logoutBtn.trigger('click')
    expect(wrapper.text()).toContain('Sair da Conta')
    expect(wrapper.text()).toContain('Encerramento de Sessão')
  })

  it('exibe seção de sincronização em nuvem com status do Google Drive e permite conectar/desconectar', async () => {
    const wrapper = mount(ContaPage, {
      global: {
        stubs: defaultStubs,
      },
    })

    expect(wrapper.find('[data-testid="cloud-sync-section"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Sincronização em Nuvem')
    expect(wrapper.text()).toContain('Google Drive')
    expect(wrapper.text()).toContain('Desconectado')

    const connectBtn = wrapper.find('[data-testid="connect-drive-account-btn"]')
    expect(connectBtn.exists()).toBe(true)
    expect(connectBtn.text()).toContain('Conectar Google Drive')

    // Simula token conectado
    localStorage.setItem('aresta_google_drive_token', 'mock_token_123')
    const wrapperConnected = mount(ContaPage, {
      global: {
        stubs: defaultStubs,
      },
    })

    expect(wrapperConnected.text()).toContain('Sincronizado & Ativo')
    const disconnectBtn = wrapperConnected.find('[data-testid="disconnect-drive-account-btn"]')
    expect(disconnectBtn.exists()).toBe(true)
    expect(disconnectBtn.text()).toContain('Desconectar')

    await disconnectBtn.trigger('click')
    expect(localStorage.getItem('aresta_google_drive_token')).toBeNull()
  })
})

