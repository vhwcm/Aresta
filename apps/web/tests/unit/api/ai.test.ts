import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.stubGlobal('defineEventHandler', (handler: any) => handler)
vi.stubGlobal('useRuntimeConfig', () => ({
  aiKey: 'test-api-key',
  public: {
    aiKey: 'test-api-key',
  },
}))

vi.stubGlobal('readBody', vi.fn())
vi.stubGlobal('createError', (opts: any) => opts)

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel() {
        return {
          generateContent: async (prompt: string) => {
            if (prompt === 'trigger-error') {
              throw new Error('API Key Limit Exceeded')
            }
            return {
              response: {
                text: () => `Resposta gerada para: ${prompt}`,
              },
            }
          },
        }
      }
    },
  }
})

describe('AI API Handler (/api/ai)', () => {
  const originalEnv = process.env.IS_PRODUCTION
  let aiHandler: any

  beforeEach(async () => {
    vi.clearAllMocks()
    delete process.env.IS_PRODUCTION
    const module = await import('../../../server/api/ai.post')
    aiHandler = module.default
  })

  afterEach(() => {
    process.env.IS_PRODUCTION = originalEnv
  })

  it('throws 400 error when prompt is missing', async () => {
    vi.mocked(readBody).mockResolvedValue({})

    const result = await aiHandler({} as any).catch((err: any) => err)

    expect(result).toEqual({
      statusCode: 400,
      statusMessage: 'Prompt é obrigatório',
    })
  })

  it('returns generated text and model name when prompt is valid', async () => {
    vi.mocked(readBody).mockResolvedValue({ prompt: 'O que é Aresta?' })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [
          {
            name: 'models/gemini-2.0-flash',
            supportedGenerationMethods: ['generateContent'],
          },
        ],
      }),
    }))

    const response = await aiHandler({} as any)

    expect(response).toEqual({
      text: 'Resposta gerada para: O que é Aresta?',
      modelUsed: 'gemini-2.0-flash',
    })
  })

  it('handles error in development mode with detailed markdown', async () => {
    process.env.IS_PRODUCTION = 'false'
    vi.mocked(readBody).mockResolvedValue({ prompt: 'trigger-error' })

    const response = await aiHandler({} as any)

    expect(response.error).toBe(true)
    expect(response.message).toBe('API Key Limit Exceeded')
    expect(response.text).toContain('### Erro de Comunicação com a IA')
    expect(response.text).toContain('API Key Limit Exceeded')
  })

  it('handles error in production mode with sanitized message', async () => {
    process.env.IS_PRODUCTION = 'true'
    vi.mocked(readBody).mockResolvedValue({ prompt: 'trigger-error' })

    const response = await aiHandler({} as any)

    expect(response.error).toBe(true)
    expect(response.message).toBe('Erro de comunicação com o serviço de IA')
    expect(response.text).toBe('Não foi possível obter uma resposta do serviço de IA.')
  })
})
