import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import FeedbackCanvas from '../../../app/components/FeedbackCanvas.vue'

// Mock de useAuth
vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    user: ref({ id: 1, name: 'Viktor Vasconcelos', email: 'viktor@aresta.org' }),
    token: ref('test-token-123'),
  }),
}))

describe('FeedbackCanvas Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // @ts-ignore
    global.$fetch = vi.fn()
  })

  it('não renderiza nada quando isOpen for false', () => {
    const wrapper = mount(FeedbackCanvas, {
      props: { isOpen: false },
    })

    expect(wrapper.find('[data-testid="feedback-canvas-container"]').exists()).toBe(false)
  })

  it('renderiza o cabeçalho, banner de usuário e categorias quando isOpen for true', () => {
    const wrapper = mount(FeedbackCanvas, {
      props: { isOpen: true },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.find('[data-testid="feedback-canvas-container"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="feedback-canvas-title"]').text()).toContain('Feedback & Melhorias')
    expect(wrapper.find('[data-testid="feedback-user-banner"]').text()).toContain('Viktor Vasconcelos')
    expect(wrapper.find('[data-testid="feedback-user-banner"]').text()).toContain('viktor@aresta.org')
  })

  it('emite close e update:isOpen ao clicar no botão de fechar ou backdrop', async () => {
    const wrapper = mount(FeedbackCanvas, {
      props: { isOpen: true },
      global: {
        stubs: { Teleport: true },
      },
    })

    await wrapper.find('[data-testid="feedback-canvas-close-btn"]').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('update:isOpen')?.[0]).toEqual([false])

    await wrapper.find('[data-testid="feedback-canvas-backdrop"]').trigger('click')
    expect(wrapper.emitted('close')?.length).toBe(2)
  })

  it('permite alternar entre categorias de feedback', async () => {
    const wrapper = mount(FeedbackCanvas, {
      props: { isOpen: true },
      global: { stubs: { Teleport: true } },
    })

    const bugBtn = wrapper.find('[data-testid="feedback-type-bug"]')
    await bugBtn.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="feedback-type-bug"]').classes()).toContain('text-accent')

    const feedbackBtn = wrapper.find('[data-testid="feedback-type-feedback"]')
    await feedbackBtn.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="feedback-type-feedback"]').classes()).toContain('text-accent')
  })

  it('desabilita botão de envio para mensagens vazias e habilita com texto válido', async () => {
    const wrapper = mount(FeedbackCanvas, {
      props: { isOpen: true },
      global: { stubs: { Teleport: true } },
    })

    const submitBtn = wrapper.find('[data-testid="feedback-submit-btn"]')
    expect(submitBtn.attributes('disabled')).toBeDefined()

    const textarea = wrapper.find('[data-testid="feedback-message-textarea"]')
    await textarea.setValue('Gostaria de sugerir uma nova fonte editorial.')
    await wrapper.vm.$nextTick()

    const updatedSubmitBtn = wrapper.find('[data-testid="feedback-submit-btn"]')
    expect(updatedSubmitBtn.attributes('disabled')).toBeUndefined()
  })

  it('envia feedback com sucesso via $fetch e exibe banner de sucesso', async () => {
    // @ts-ignore
    global.$fetch.mockResolvedValueOnce({
      feedback: {
        id: 1,
        message: 'Excelente experiência de leitura!',
        type: 'FEEDBACK',
      },
    })

    const wrapper = mount(FeedbackCanvas, {
      props: { isOpen: true },
      global: { stubs: { Teleport: true } },
    })

    await wrapper.find('[data-testid="feedback-type-feedback"]').trigger('click')
    await wrapper.find('[data-testid="feedback-message-textarea"]').setValue('Excelente experiência de leitura!')
    await wrapper.find('[data-testid="feedback-submit-btn"]').trigger('click')

    expect(global.$fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/feedback'),
      expect.objectContaining({
        method: 'POST',
        body: {
          message: 'Excelente experiência de leitura!',
          type: 'FEEDBACK',
        },
      })
    )

    // Aguarda atualização da view
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="feedback-success-banner"]').exists()).toBe(true)
    expect(wrapper.emitted('submitted')).toBeTruthy()
  })

  it('exibe mensagem de erro quando $fetch falhar', async () => {
    // @ts-ignore
    global.$fetch.mockRejectedValueOnce({
      data: { error: 'Falha de conexão com a API' },
    })

    const wrapper = mount(FeedbackCanvas, {
      props: { isOpen: true },
      global: { stubs: { Teleport: true } },
    })

    await wrapper.find('[data-testid="feedback-message-textarea"]').setValue('Mensagem com erro de envio')
    await wrapper.find('[data-testid="feedback-submit-btn"]').trigger('click')

    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="feedback-error-banner"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="feedback-error-banner"]').text()).toContain('Falha de conexão com a API')
  })
})
