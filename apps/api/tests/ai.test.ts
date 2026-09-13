import { describe, it, expect, vi, beforeEach } from 'vitest'
import { aiService } from '../src/modules/ai/services/ai.service'
import { didacticAI, fallbackAiConfig } from '../src/modules/ai/config/gemini.config'
import axios from 'axios'

vi.mock('axios')

describe('AiService - Model Cascade & Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. Deve tentar os modelos na ordem prioritária: 3.7 -> 3.6 -> 3.5', async () => {
    const attemptedModels: string[] = []

    vi.spyOn(didacticAI, 'getGenerativeModel').mockImplementation(({ model }: any) => {
      attemptedModels.push(model)
      if (model === 'gemini-3.7-flash') {
        throw new Error('3.7 unavailable')
      }
      if (model === 'gemini-3.6-flash') {
        return {
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: () => '# Título\n\nTexto gerado com sucesso\n\n```mermaid\nflowchart TD\nA-->B\n```',
            },
          }),
        } as any
      }
      throw new Error('not reached')
    })

    const result = await aiService.generateDidacticExplanation({
      topic: 'Algoritmos Gulosos',
    })

    expect(attemptedModels[0]).toBe('gemini-3.7-flash')
    expect(attemptedModels[1]).toBe('gemini-3.6-flash')
    expect(result.title).toBe('Título')
    expect(result.markdown).toContain('Texto gerado com sucesso')
  })

  it('2. Deve tentar fallback externo universal caso todos os modelos Gemini falhem', async () => {
    vi.spyOn(didacticAI, 'getGenerativeModel').mockImplementation(() => {
      throw new Error('All Gemini quota exceeded')
    })

    // Simula fallback externo configurado
    vi.spyOn(fallbackAiConfig, 'isConfigured', 'get').mockReturnValue(true)
    fallbackAiConfig.baseUrl = 'https://api.groq.com/openai/v1'
    fallbackAiConfig.apiKey = 'gsk-test'
    fallbackAiConfig.model = 'llama-3.3-70b-versatile'

    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              content: '# Explicação via Groq Fallback\n\nConteúdo da API externa\n\n```mermaid\ngraph LR\nA-->B\n```',
            },
          },
        ],
      },
    })

    const result = await aiService.generateDidacticExplanation({
      topic: 'Estruturas de Grafos',
    })

    expect(axios.post).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({
        model: 'llama-3.3-70b-versatile',
      }),
      expect.any(Object)
    )
    expect(result.title).toBe('Explicação via Groq Fallback')
    expect(result.markdown).toContain('Conteúdo da API externa')
  })

  it('3. Deve lançar erro genérico 503 sem fallback mockado se todos os modelos e APIs falharem', async () => {
    vi.spyOn(didacticAI, 'getGenerativeModel').mockImplementation(() => {
      throw new Error('Network error')
    })
    vi.spyOn(fallbackAiConfig, 'isConfigured', 'get').mockReturnValue(false)

    await expect(
      aiService.generateDidacticExplanation({
        topic: 'Conceito Complexo',
      })
    ).rejects.toMatchObject({
      statusCode: 503,
      code: 'AI_UNAVAILABLE',
      message: 'Não foi possível obter resposta da Inteligência Artificial no momento. Por favor, tente novamente em instantes.',
    })
  })
})
