import { TaskType } from '@google/generative-ai'
import {
  genAI,
  GEMINI_MODEL,
  GEMINI_EMBED_MODEL,
  EMBED_DIMENSIONS,
  getFlashcardModel,
  getDidacticModel,
} from '../config/gemini.config'

export class AiService {
  /**
   * Generate text from a prompt using the default/general AI client
   */
  async generate(prompt: string, systemInstruction?: string): Promise<string> {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      ...(systemInstruction ? { systemInstruction } : {}),
    })
    const result = await model.generateContent(prompt)
    return result.response.text()
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
    const model = getFlashcardModel()
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const json = text.match(/\{[\s\S]*\}/)?.[0]
    if (!json) throw new Error('Failed to parse flashcard JSON from AI response')
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
   * Generate rich didactic explanation (Markdown + Mermaid + Callouts) using dedicated Didactic / Tutor AI API
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

    try {
      const model = getDidacticModel(systemPrompt)
      const result = await model.generateContent(userPrompt)
      const generated = result.response.text()
      const matches = generated.match(/```mermaid[\s\S]*?```/g)
      const titleMatch = generated.match(/^#\s+(.+)$/m)
      const title = titleMatch ? titleMatch[1].replace(/[*_#]/g, '').trim() : `Didático: ${topic}`

      return {
        title,
        markdown: generated,
        diagramCount: matches ? matches.length : 0,
      }
    } catch {
      // Fallback determinístico caso API esteja indisponível
      const title = `Didático: ${topic}`
      const markdown = `# ${title}\n\n> [!ANALOGY]\n> Pense em **${topic}** como um sistema bem orquestrado onde cada etapa depende da integridade da anterior.\n\n---\n\n## 1. Princípio Central\n\n> [!KEY_CONCEPT]\n> A essência de ${topic} é isolar a complexidade e oferecer previsibilidade.\n\n---\n\n## 2. Diagrama Visual\n\n\`\`\`mermaid\nflowchart TD\n    A[🎯 Entrada: ${topic.slice(0, 20)}] --> B[⚙️ Processamento]\n    B --> C[✅ Conclusão & Fixação]\n\`\`\`\n\n---\n\n> [!TIP]\n> Foque primeiro na intuição fundamental.\n\n> [!WARNING]\n> Evite decorar termos sem compreender a mecânica de causa e efeito.\n`
      return { title, markdown, diagramCount: 1 }
    }
  }
}

export const aiService = new AiService()
