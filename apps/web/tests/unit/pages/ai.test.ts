import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AiPage from '../../../app/pages/ai.vue'

const mockGenerateContent = vi.fn()

vi.stubGlobal('useRuntimeConfig', () => ({
  public: {
    aiKey: 'test-key',
    isProduction: false,
  },
  aiKey: 'test-key',
}))

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return {
        generateContent: mockGenerateContent,
      }
    }
  },
}))

describe('AI Assistant Page', () => {
  const originalEnv = process.env.IS_PRODUCTION

  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.IS_PRODUCTION
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [
          {
            name: 'models/gemini-2.5-flash',
            supportedGenerationMethods: ['generateContent'],
          },
        ],
      }),
    }))
  })

  afterEach(() => {
    process.env.IS_PRODUCTION = originalEnv
  })

  it('renders the AI assistant page correctly', () => {
    const wrapper = mount(AiPage)

    expect(wrapper.text()).toContain('Inteligência Artificial')
    expect(wrapper.text()).toContain('Assistente Aresta')
    expect(wrapper.text()).toContain('Como posso ajudar hoje?')

    const input = wrapper.find('input[type="text"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toContain('Pergunte algo sobre sua biblioteca...')
  })

  it('sends user message and displays AI response on success', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({
      text: 'Resposta da IA para o teste.',
    }))

    const wrapper = mount(AiPage)
    const input = wrapper.find('input[type="text"]')

    await input.setValue('Explique Paradigmas')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Explique Paradigmas')
    expect(wrapper.text()).toContain('Resposta da IA para o teste.')
  })

  it('handles API error object returned from server', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({
      error: true,
      text: '### Erro de Comunicação com a IA\n\nChave inválida',
    }))

    const wrapper = mount(AiPage)
    const input = wrapper.find('input[type="text"]')

    await input.setValue('Test Error Response')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Erro de Comunicação com a IA')
    expect(wrapper.text()).toContain('Chave inválida')
  })

  it('handles network failure error in development mode', async () => {
    process.env.IS_PRODUCTION = 'false'
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('Network Failure')))
    mockGenerateContent.mockRejectedValue(new Error('Network Failure'))

    const wrapper = mount(AiPage)
    const input = wrapper.find('input[type="text"]')

    await input.setValue('Test Net Error')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Erro de Comunicação com a IA')
    expect(wrapper.text()).toContain('Network Failure')
  })

  it('handles network failure error in production mode', async () => {
    process.env.IS_PRODUCTION = 'true'
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('Sensitive Trace')))
    mockGenerateContent.mockRejectedValue(new Error('Sensitive Trace'))

    const wrapper = mount(AiPage)
    const input = wrapper.find('input[type="text"]')

    await input.setValue('Test Prod Error')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Não foi possível obter uma resposta do serviço de IA.')
    expect(wrapper.text()).not.toContain('Sensitive Trace')
  })
})
