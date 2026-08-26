import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ContaPage from '~/pages/conta.vue'

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
  }

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
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

  it('permite alternar entre modo claro e escuro', async () => {
    const wrapper = mount(ContaPage, {
      global: {
        stubs: defaultStubs,
      },
    })

    const lightBtn = wrapper.find('[data-testid="theme-light-btn"]')
    const darkBtn = wrapper.find('[data-testid="theme-dark-btn"]')

    expect(lightBtn.exists()).toBe(true)
    expect(darkBtn.exists()).toBe(true)
    expect(wrapper.text()).toContain('Claro (Light)')

    // Clica para ativar modo escuro
    await darkBtn.trigger('click')
    expect(wrapper.text()).toContain('Escuro (Dark)')

    // Clica para voltar ao modo claro
    await lightBtn.trigger('click')
    expect(wrapper.text()).toContain('Claro (Light)')
  })

  it('permite alternar o switch de Grafo na Tela Inicial (Desktop)', async () => {
    const wrapper = mount(ContaPage, {
      global: {
        stubs: defaultStubs,
      },
    })

    const homeGraphToggle = wrapper.find('[data-testid="toggle-desktop-home-graph"]')
    expect(homeGraphToggle.exists()).toBe(true)

    // Inicia como true
    expect(homeGraphToggle.attributes('aria-checked')).toBe('true')

    // Alterna para false
    await homeGraphToggle.trigger('click')
    expect(homeGraphToggle.attributes('aria-checked')).toBe('false')

    // Alterna de volta para true
    await homeGraphToggle.trigger('click')
    expect(homeGraphToggle.attributes('aria-checked')).toBe('true')
  })

  it('permite alternar o switch de Grafo no Leitor Desktop', async () => {
    const wrapper = mount(ContaPage, {
      global: {
        stubs: defaultStubs,
      },
    })

    const readerGraphToggle = wrapper.find('[data-testid="toggle-desktop-reader-graph"]')
    expect(readerGraphToggle.exists()).toBe(true)

    // Inicia como true
    expect(readerGraphToggle.attributes('aria-checked')).toBe('true')

    // Alterna para false
    await readerGraphToggle.trigger('click')
    expect(readerGraphToggle.attributes('aria-checked')).toBe('false')
  })

  it('permite ajustar o tamanho da fonte padrão do EPUB', async () => {
    const wrapper = mount(ContaPage, {
      global: {
        stubs: defaultStubs,
      },
    })

    const decreaseBtn = wrapper.find('[data-testid="decrease-font-btn"]')
    const increaseBtn = wrapper.find('[data-testid="increase-font-btn"]')
    const indicator = wrapper.find('[data-testid="font-size-indicator"]')

    expect(indicator.text()).toBe('18px')

    await increaseBtn.trigger('click')
    expect(indicator.text()).toBe('20px')

    await decreaseBtn.trigger('click')
    expect(indicator.text()).toBe('18px')
  })

  it('permite selecionar a fonte padrão do EPUB', async () => {
    const wrapper = mount(ContaPage, {
      global: {
        stubs: defaultStubs,
      },
    })

    const merriweatherBtn = wrapper.find('[data-testid="font-option-merriweather"]')
    const interBtn = wrapper.find('[data-testid="font-option-inter"]')

    expect(merriweatherBtn.exists()).toBe(true)
    expect(interBtn.exists()).toBe(true)

    await merriweatherBtn.trigger('click')
    const saved = JSON.parse(localStorage.getItem('aresta_settings') || '{}')
    expect(saved.epubFontFamily).toBe('merriweather')

    await interBtn.trigger('click')
    const saved2 = JSON.parse(localStorage.getItem('aresta_settings') || '{}')
    expect(saved2.epubFontFamily).toBe('inter')
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
})

