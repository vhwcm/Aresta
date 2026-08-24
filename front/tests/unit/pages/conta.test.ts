import { describe, it, expect, vi } from 'vitest'
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
    XIcon: true
  }

  it('renders user profile, reading metrics and danger zone', () => {
    const wrapper = mount(ContaPage, {
      global: {
        stubs: defaultStubs
      }
    })

    expect(wrapper.text()).toContain('Sua Conta')
    expect(wrapper.text()).toContain('Métricas de Leitura & Conhecimento')
    expect(wrapper.text()).toContain('Aresta Pro')
    expect(wrapper.text()).toContain('Zona de Perigo & Segurança')
    expect(wrapper.text()).toContain('Fazer Logout')
    expect(wrapper.text()).toContain('Deletar Minha Conta')
  })

  it('opens delete modal and enables delete button only when phrase is correctly typed', async () => {
    const wrapper = mount(ContaPage, {
      global: {
        stubs: defaultStubs
      }
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
