import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ContaPage from '~/pages/conta.vue'
import { useSettings } from '~/composables/useSettings'
import { useUserMetrics } from '~/composables/useUserMetrics'
import { useOAuth } from '~/composables/useOAuth'

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
    SparklesIcon: true,
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
    const { metrics } = useUserMetrics()
    metrics.value = {
      books: { total: 8, activeReading: 3 },
      readingTime: { totalSeconds: 153000, totalHoursFormatted: '42.5', averageMinutesPerDay: 35 },
      knowledge: { totalNodes: 64, canvasCount: 4 },
      memory: { retentionRate: 91, totalFlashcards: 10, reviewedCount: 8 },
      memberSince: '2026-08-01T00:00:00.000Z',
    }

    const wrapper = mount(ContaPage, {
      global: {
        stubs: defaultStubs,
      },
    })

    expect(wrapper.text()).toContain('Sua Conta')
    expect(wrapper.find('[data-testid="reading-metrics-section"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="metric-books"]').text()).toContain('8')
    expect(wrapper.find('[data-testid="metric-books"]').text()).toContain('3 em leitura ativa')
    expect(wrapper.find('[data-testid="metric-reading-time"]').text()).toContain('42.5')
    expect(wrapper.find('[data-testid="metric-reading-time"]').text()).toContain('Média 35 min/dia')
    expect(wrapper.find('[data-testid="metric-knowledge-nodes"]').text()).toContain('64')
    expect(wrapper.find('[data-testid="metric-knowledge-nodes"]').text()).toContain('Em 4 mapas conceituais')
    expect(wrapper.find('[data-testid="metric-retention-rate"]').text()).toContain('91%')
    expect(wrapper.find('[data-testid="account-preferences-section"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Virada de Página 3D & Efeitos de Livro Físico')
    expect(wrapper.text()).toContain('Idiomas & Dicionário Offline')
    expect(wrapper.text()).toContain('Aresta Pro')
    expect(wrapper.text()).toContain('Zona de Perigo & Segurança')
    expect(wrapper.text()).toContain('Fazer Logout')
    expect(wrapper.text()).toContain('Deletar Minha Conta')
  })

  it('permite configurar idiomas de definições e tradução', async () => {
    const wrapper = mount(ContaPage, {
      global: {
        stubs: defaultStubs,
      },
    })
    const { nativeLanguage, targetTranslationLanguage } = useSettings()

    expect(wrapper.find('[data-testid="dictionary-settings-section"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Minha Língua Nativa')
    expect(wrapper.text()).toContain('Língua de Tradução / Estudo')
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

    // Alterna para desativado
    await pageAnimationToggle.trigger('click')
    expect(pageAnimationToggle.attributes('aria-checked')).toBe('false')
    let saved = JSON.parse(localStorage.getItem('aresta_settings') || '{}')
    expect(saved.pageAnimationEnabled).toBe(false)
    expect(saved.pageCreaseEnabled).toBe(false)

    // Alterna de volta para ativado
    await pageAnimationToggle.trigger('click')
    expect(pageAnimationToggle.attributes('aria-checked')).toBe('true')
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
    const { setGoogleDriveToken, isGoogleDriveConnected } = useOAuth()
    setGoogleDriveToken(null)

    const wrapper = mount(ContaPage, {
      global: {
        stubs: defaultStubs,
      },
    })

    expect(wrapper.find('[data-testid="cloud-sync-section"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Google Drive')
    expect(wrapper.text()).toContain('Desconectado')

    const connectBtn = wrapper.find('[data-testid="connect-drive-account-btn"]')
    expect(connectBtn.exists()).toBe(true)
    expect(connectBtn.text()).toContain('Conectar Google Drive')

    // Simula token conectado em memória via useOAuth
    setGoogleDriveToken('mock_token_123')
    const wrapperConnected = mount(ContaPage, {
      global: {
        stubs: defaultStubs,
      },
    })

    expect(wrapperConnected.text()).toContain('Sincronizado')
    const disconnectBtn = wrapperConnected.find('[data-testid="disconnect-drive-account-btn"]')
    expect(disconnectBtn.exists()).toBe(true)
    expect(disconnectBtn.text()).toContain('Desconectar')

    await disconnectBtn.trigger('click')
    expect(isGoogleDriveConnected.value).toBe(false)
  })
})

