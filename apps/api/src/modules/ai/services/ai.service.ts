import { TaskType } from '@google/generative-ai'
import axios from 'axios'
import {
  genAI,
  flashcardAI,
  didacticAI,
  GEMINI_MODEL,
  GEMINI_FLASHCARD_MODEL,
  GEMINI_DIDACTIC_MODEL,
  GEMINI_MODEL_CASCADE,
  GEMINI_EMBED_MODEL,
  EMBED_DIMENSIONS,
  fallbackAiConfig,
} from '../config/gemini.config'

export class AiService {
  /**
   * Executa chat com cascata hierárquica de modelos:
   * 1. Gemini (3.7 -> 3.6 -> 3.5)
   * 2. Provedor Externo configurado no .env (OpenAI / Groq / OpenRouter)
   * 3. Lança erro caso todas as tentativas falhem (sem dados falsos/estáticos)
   */
  async executeChatCascade(options: {
    userPrompt: string
    systemInstruction?: string
    clientType?: 'general' | 'flashcard' | 'didactic'
    overrideModels?: string[]
  }): Promise<string> {
    const client =
      options.clientType === 'didactic'
        ? didacticAI
        : options.clientType === 'flashcard'
        ? flashcardAI
        : genAI

    const preferredModel =
      options.clientType === 'didactic'
        ? GEMINI_DIDACTIC_MODEL
        : options.clientType === 'flashcard'
        ? GEMINI_FLASHCARD_MODEL
        : GEMINI_MODEL

    const modelsToTry = [
      ...new Set(
        (options.overrideModels || [preferredModel, ...GEMINI_MODEL_CASCADE]).filter(Boolean)
      ),
    ]

    let lastError: any = null

    // 1. Tenta a sequência de modelos Gemini
    for (const modelName of modelsToTry) {
      try {
        const model = client.getGenerativeModel({
          model: modelName,
          ...(options.systemInstruction ? { systemInstruction: options.systemInstruction } : {}),
        })
        const result = await model.generateContent(options.userPrompt)
        const text = result.response.text()
        if (text && text.trim().length > 0) {
          return text
        }
      } catch (err: any) {
        lastError = err
        console.warn(`[AiService] Tentativa com ${modelName} falhou:`, err?.message || err)
      }
    }

    // 2. Tenta provedor fallback externo se configurado no .env
    if (fallbackAiConfig.isConfigured) {
      try {
        console.info(
          `[AiService] Tentando provedor externo de fallback: ${fallbackAiConfig.baseUrl} (${fallbackAiConfig.model})...`
        )
        const messages: Array<{ role: 'system' | 'user'; content: string }> = []
        if (options.systemInstruction) {
          messages.push({ role: 'system', content: options.systemInstruction })
        }
        messages.push({ role: 'user', content: options.userPrompt })

        const response = await axios.post(
          `${fallbackAiConfig.baseUrl}/chat/completions`,
          {
            model: fallbackAiConfig.model,
            messages,
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${fallbackAiConfig.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        )

        const reply = response.data?.choices?.[0]?.message?.content
        if (reply && reply.trim().length > 0) {
          return reply
        }
      } catch (fallbackErr: any) {
        lastError = fallbackErr
        console.error(
          '[AiService] Provedor externo de fallback falhou:',
          fallbackErr?.response?.data || fallbackErr?.message || fallbackErr
        )
      }
    }

    // 3. Se todos falharem, lança erro genérico limpo (sem fallback offline mockado)
    const genericMessage =
      'Não foi possível obter resposta da Inteligência Artificial no momento. Por favor, tente novamente em instantes.'
    const error: any = new Error(genericMessage)
    error.statusCode = 503
    error.code = 'AI_UNAVAILABLE'
    error.originalError = lastError
    throw error
  }

  /**
   * Generate text from a prompt using the default/general AI client
   */
  async generate(prompt: string, systemInstruction?: string): Promise<string> {
    return this.executeChatCascade({
      userPrompt: prompt,
      systemInstruction,
      clientType: 'general',
    })
  }

  /**
   * Generate embedding vector for text (1536 dimensions)
   */
  async embed(text: string): Promise<number[]> {
    const model = genAI.getGenerativeModel({ model: GEMINI_EMBED_MODEL })
    const result = await model.embedContent({
      content: { parts: [{ text }], role: 'user' },
      taskType: TaskType.RETRIEVAL_DOCUMENT,
    })
    const values = result.embedding.values
    // Pad or trim to EMBED_DIMENSIONS
    if (values.length < EMBED_DIMENSIONS) {
      return [...values, ...Array(EMBED_DIMENSIONS - values.length).fill(0)]
    }
    return values.slice(0, EMBED_DIMENSIONS)
  }

  /**
   * Generate a flashcard (question + answer) from annotation context using dedicated Flashcard API
   */
  async generateFlashcard(params: {
    selectedText: string
    note?: string
    chapterTitle?: string
    bookTitle?: string
    cardType?: string
    userLanguage?: string
  }): Promise<{ question: string; answer: string; contextSummary: string }> {
    const { selectedText, note, chapterTitle, bookTitle, cardType = 'CONCEPT_RECALL', userLanguage = 'pt-BR' } = params
    const prompt = `
You are an expert at creating effective flashcards for spaced repetition learning.
Create a flashcard in ${userLanguage} from the following annotation:

Book: ${bookTitle ?? 'Unknown'}
Chapter: ${chapterTitle ?? 'Unknown'}
Highlighted text: "${selectedText}"
${note ? `Reader's note: "${note}"` : ''}

Card type: ${cardType}
- CONCEPT_RECALL: Test if the reader can recall the concept
- REAL_SITUATION: Apply the concept to a real situation
- CONCEPT_UNION: Connect this concept with related ideas

Respond ONLY with valid JSON in this exact format:
{
  "question": "...",
  "answer": "...",
  "contextSummary": "Brief 1-sentence summary of the context"
}
`
    const text = await this.executeChatCascade({
      userPrompt: prompt,
      clientType: 'flashcard',
    })
    const json = text.match(/\{[\s\S]*\}/)?.[0]
    if (!json) throw new Error('Falha ao interpretar JSON de flashcard gerado pela IA.')
    return JSON.parse(json)
  }

  /**
   * Translate text to target language
   */
  async translate(text: string, from: string, to: string): Promise<string> {
    const prompt = `Translate the following text from ${from} to ${to}. Return ONLY the translation, no explanations:\n\n${text}`
    return this.generate(prompt)
  }

  /**
   * Summarize a book chapter or passage
   */
  async summarize(text: string, language = 'pt-BR'): Promise<string> {
    const prompt = `Summarize the following text in ${language} in 2-3 sentences:\n\n${text}`
    return this.generate(prompt)
  }

  /**
   * Generate rich didactic explanation (Markdown + Mermaid + Callouts) using dedicated Didactic / Tutor AI API.
   * SEM FALLBACK OFFLINE: Se a IA falhar em todos os modelos e provedores, propaga o erro.
   */
  async generateDidacticExplanation(params: {
    topic: string
    themeName?: string
    bookTitle?: string
    flashcardQuestion?: string
    flashcardAnswer?: string
    annotationQuote?: string
    annotationNote?: string
    depthLevel?: 'quick_summary' | 'standard' | 'deep_dive'
    userLanguage?: string
  }): Promise<{ title: string; markdown: string; diagramCount: number }> {
    const { topic, themeName, bookTitle, flashcardQuestion, flashcardAnswer, annotationQuote, annotationNote, depthLevel = 'standard', userLanguage = 'pt-BR' } = params

    const systemPrompt = `Você é o Didactic AI Tutor do ecossistema Aresta, um comunicador de elite especializado em ensinar conceitos complexos de forma extraordinariamente clara, intuitiva, visual e memorável para leitura em smartphones.
DIRETRIZES:
1. Use Markdown Estendido com seções separadas por --- para paginação mobile.
2. Analogia Âncora no início: > [!ANALOGY]
3. Princípios Primeiros: > [!KEY_CONCEPT]
4. Diagrama Mermaid Válido (OBRIGATÓRIO): \`\`\`mermaid flowchart TD/LR ... \`\`\`
5. Dica e Cuidado: > [!TIP] e > [!WARNING]
6. Autoavaliação rápida com <details><summary>...</summary>...</details>.
Idioma: ${userLanguage}.`

    let userPrompt = `Crie uma explicação didática estruturada para o tópico: "${topic}"\n`
    if (themeName) userPrompt += `Tema: ${themeName}\n`
    if (bookTitle) userPrompt += `Livro: ${bookTitle}\n`
    if (flashcardQuestion && flashcardAnswer) userPrompt += `Flashcard Q: ${flashcardQuestion} / A: ${flashcardAnswer}\n`
    if (annotationQuote) userPrompt += `Trecho grifado: "${annotationQuote}" (${annotationNote ?? ''})\n`
    userPrompt += `Profundidade: ${depthLevel}`

    // Executa em cascata (3.7 -> 3.6 -> 3.5 -> APIs externas). Lança erro se falhar.
    const generated = await this.executeChatCascade({
      userPrompt,
      systemInstruction: systemPrompt,
      clientType: 'didactic',
    })

    const matches = generated.match(/```mermaid[\s\S]*?```/g)
    const titleMatch = generated.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1].replace(/[*_#]/g, '').trim() : `Didático: ${topic}`

    return {
      title,
      markdown: generated,
      diagramCount: matches ? matches.length : 0,
    }
  }

  /**
   * Transcreve traços manuscritos ou texto em imagem usando Gemini Vision
   */
  async transcribeImage(imageBase64: string, mimeType = 'image/png', promptHint?: string): Promise<{ text: string }> {
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim()
    if (!cleanBase64) {
      throw new Error('Buffer de imagem inválido ou vazio.')
    }

    const defaultInstruction =
      'You are a high-precision text transcription engine. Your sole task is to transcribe exclusively all handwritten and printed writing found in the provided image.\n\nStrict Rules:\n1. Output ONLY the raw transcribed text.\n2. Do NOT add any preamble, greeting, markdown code block wrappers (such as ```text or ```), notes, explanations, or commentary.\n3. Do NOT describe visual elements, drawings, decorations, or backgrounds. Transcribe ONLY letters, digits, punctuation, and mathematical/scientific symbols.\n4. Maintain the natural reading order and line breaks of the text.\n5. If no text or handwriting is found in the image, output an empty response.'

    const userPrompt = promptHint || 'Transcribe exclusively all written and handwritten text in this image. Do not add any conversational text or formatting.'

    const candidateModels = [...new Set([GEMINI_MODEL, ...GEMINI_MODEL_CASCADE].filter(Boolean))]

    let lastError: any = null
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: defaultInstruction,
        })

        const result = await model.generateContent([
          userPrompt,
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || 'image/png',
            },
          },
        ])

        const rawText = result.response.text() || ''
        const cleanedText = rawText.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim()
        return { text: cleanedText }
      } catch (err: any) {
        lastError = err
        console.warn(`[AiService] Tentativa com modelo ${modelName} falhou:`, err?.message || err)
      }
    }

    throw new Error(`Falha ao transcrever imagem com IA: ${lastError?.message || 'Erro desconhecido'}`)
  }
}

export const aiService = new AiService()
