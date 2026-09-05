import { GoogleGenerativeAI } from '@google/generative-ai'
import { isProductionMode, logError } from '~/utils/logger'

async function getBestModel(apiKey: string): Promise<string> {
  const preferredModels = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-pro',
    'gemini-flash-latest',
  ]
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    if (res.ok) {
      const data = await res.json()
      const models = data?.models || []

      for (const pref of preferredModels) {
        const found = models.find((m: any) => m.name === `models/${pref}` || m.name === pref)
        if (found) return pref
      }

      const validModel = models.find((m: any) =>
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes('generateContent') &&
        m.name &&
        !m.name.includes('2.5') &&
        !m.name.includes('embedding') &&
        !m.name.includes('imagen') &&
        !m.name.includes('tts') &&
        !m.name.includes('veo')
      )
      if (validModel && validModel.name) {
        return validModel.name.replace(/^models\//, '')
      }
    }
  } catch (err) {
    logError('[AI API Model Discovery Error]', err)
  }
  return 'gemini-2.0-flash'
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const prompt = body?.prompt || body?.message || ''

  const config = useRuntimeConfig()
  const apiKey = String(config.aiKey || (config.public as any)?.aiKey || process.env.AI_KEY || '')
  const isProd = isProductionMode()

  if (!prompt) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Prompt é obrigatório',
    })
  }

  try {
    const modelName = await getBestModel(apiKey)
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: modelName })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    return { text, modelUsed: modelName }
  } catch (error: any) {
    logError('[AI API Error]', error)

    if (isProd) {
      return {
        error: true,
        message: 'Erro de comunicação com o serviço de IA',
        text: 'Não foi possível obter uma resposta do serviço de IA.'
      }
    }

    const isQuotaError = error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED') || error?.status === 429
    const errorTitle = isQuotaError ? 'Limite de Cota Excedido (API Gemini)' : 'Erro de Comunicação com a IA'

    return {
      error: true,
      message: error?.message || 'Erro de comunicação com o serviço de IA',
      text: `### ${errorTitle}

Não foi possível obter uma resposta do serviço da IA com a chave fornecida.

**Detalhes da resposta da API:**
\`\`\`text
${error?.message || 'Chave de API inválida ou sem permissão'}
\`\`\`

> **Dica:** Se o erro for de cota excedida (\`RESOURCE_EXHAUSTED\`), substitua a chave \`AI_KEY\` no arquivo \`.env\` por uma nova chave gerada no Google AI Studio (https://aistudio.google.com/).`
    }
  }
})
