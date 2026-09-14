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
   * Generate rich didactic explanation in standard Aresta Semantic HTML with interactive elements.
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
  }): Promise<{ title: string; html: string; markdown: string; diagramCount: number }> {
    const { topic, themeName, bookTitle, flashcardQuestion, flashcardAnswer, annotationQuote, annotationNote, depthLevel = 'standard', userLanguage = 'pt-BR' } = params

    const systemPrompt = `Você é o Didactic AI Tutor do ecossistema Aresta, um comunicador de elite especializado em ensinar conceitos complexos de forma extraordinariamente clara, intuitiva, visual e memorável para leitura digital.
DIRETRIZES FUNDAMENTAIS DE DIAGRAMAÇÃO EDITORIAL (LIVRO DIGITAL SEM SCROLL):
1. O Aresta é um leitor de livros físicos simulados (folhear 2D/3D). PÁGINAS NUNCA DEVEM TER BARRA DE ROLAGEM (ZERO SCROLL).
2. Pense estritamente como um diagramador de livro impresso: cada página é uma folha visual fechada com altura limitada.
3. É TERMINANTEMENTE PROIBIDO ultrapassar o limite de palavras ou acumular múltiplos blocos que forcem rolagem vertical.
4. Retorne HTML Semântico padronizado do Aresta, SEM blocos de código markdown como \`\`\`html.
5. Cada página DEVE ser encapsulada em:
   <section class="didactic-page" data-page="NUMERO" data-title="TITULO_DA_PAGINA" data-layout="LAYOUT_TYPE">

ARQUÉTIPOS E CONTRATO ESTRITO POR PÁGINA:
- Página 1 (data-layout="cover"): Capa Editorial & Título
  * <header class="didactic-cover"><h1>TITULO_CURTO_E_PRECISO</h1><p class="didactic-subtitle">Subtítulo explicativo em 1 linha</p></header>
  * Resumo conceitual de no máximo 2 linhas. ZERO parágrafos extensos.
- Página 2 (data-layout="foundation"): Tese & Fundamentos Essenciais
  * Orçamento total: máximo de 150 palavras.
  * 1 parágrafo abordando a dor real ou por que esse conceito existe (máx. 65 palavras).
  * 1 Callout pedagógico de Conceito Central:
    <div class="didactic-callout callout-key-concept">
      <div class="callout-header">Conceito Central</div>
      <div class="callout-body">Definição nuclear inequívoca (máx. 40 palavras).</div>
    </div>
  * 1 parágrafo de síntese ou conexão (máx. 35 palavras).
- Página 3 (data-layout="mechanism"): Explicação Mecânica & Operacional
  * Orçamento total: máximo de 100 palavras de texto + 1 componente visual compacto.
  * 1 frase introdutória concisa (máx. 25 palavras).
  * EXATAMENTE 1 componente visual compacto:
    Opção A: Stepper com EXATAMENTE 3 passos compactos:
      <div class="aresta-stepper" data-title="Como Funciona">
        <div class="aresta-step" data-step="1" data-step-title="Passo 1">Descrição objetiva (máx. 20 palavras).</div>
        <div class="aresta-step" data-step="2" data-step-title="Passo 2">Descrição objetiva (máx. 20 palavras).</div>
        <div class="aresta-step" data-step="3" data-step-title="Passo 3">Descrição objetiva (máx. 20 palavras).</div>
      </div>
    Opção B: Diagrama conceitual estruturado ou Mermaid compacto (máx. 4 nós).
  * PROIBIDO acumular parágrafos adicionais após o componente.
- Página 4 (data-layout="analogy"): Analogia do Mundo Real
  * Orçamento total: máximo de 140 palavras.
  * Metáfora vívida e concreta do cotidiano explicando o mecanismo (máx. 85 palavras).
  * 1 Callout de Analogia Visual conectando o mecanismo ao mundo real:
    <div class="didactic-callout callout-analogy">
      <div class="callout-header">Analogia Visual</div>
      <div class="callout-body">O paralelo direto e memorável (máx. 45 palavras).</div>
    </div>
- Página 5 (data-layout="nuances"): Aplicações Práticas, Cuidados & Armadilhas
  * Orçamento total: máximo de 120 palavras.
  * 1 Callout de Atenção destacando um erro comum e como evitá-lo:
    <div class="didactic-callout callout-warning">
      <div class="callout-header">Cuidado & Armadilhas</div>
      <div class="callout-body">Armadilha clássica e a solução correta (máx. 40 palavras).</div>
    </div>
  * Lista com 3 regras de ouro concisas (máx. 18 palavras cada).
- Página 6 (data-layout="subtopics"): Expansão de Conhecimento & Conexões
  * 1 linha introdutória de contextualização (máx. 20 palavras).
  * EXATAMENTE 2 a 3 cards de subtemas para explorar (sem sobrecarregar a folha):
    <div class="aresta-subtopics">
      <div class="aresta-subtopic" data-topic="Nome do Subtema">
        <span class="aresta-subtopic-title">Nome do Subtema</span>
        <p class="aresta-subtopic-desc">Explicação em 1 linha (máx. 15 palavras).</p>
        <div class="aresta-subtopic-actions">
          <button type="button" class="aresta-btn-explain" data-action="explain" data-topic="Nome do Subtema">Explicar</button>
          <button type="button" class="aresta-btn-booklet" data-action="booklet" data-topic="Nome do Subtema">Criar Livreto</button>
        </div>
      </div>
    </div>
- Página 7 (data-layout="flashcards"): Fixação Ativa com Flashcards Interativos
  * Cabeçalho de fixação ativa em 1 linha.
  * EXATAMENTE 2 flashcards compactos (JAMAIS inclua mais de 2 flashcards nesta página):
    <div class="aresta-flashcards-deck">
      <div class="aresta-flashcard" data-question="Pergunta direta (máx 15 palavras)?" data-answer="Resposta concisa (máx 30 palavras)." data-type="CONCEPT_RECALL" data-difficulty="2.5">
        <div class="aresta-flashcard-inner">
          <div class="aresta-flashcard-front"><p class="aresta-card-q">Pergunta do Flashcard</p></div>
          <div class="aresta-flashcard-back"><p class="aresta-card-a">Resposta do Flashcard</p></div>
        </div>
        <button type="button" class="aresta-btn-add-deck" data-action="add-deck">Adicionar ao meu Deck</button>
      </div>
    </div>

REGRAS INEGOCIÁVEIS:
1. NÃO UTILIZE NENHUM EMOJI em títulos, cabeçalhos ou botões.
2. Utilize classes preparadas para variáveis CSS dinâmicas (Dark/Light/Sepia mode) com acentos em laranja (#f97316).
3. Respeite com precisão cirúrgica a delimitação de cada página para que o leitor tenha uma experiência de livro sem scroll.
Idioma: ${userLanguage}.`

    let userPrompt = `Gere o livreto didático estruturado em HTML para o tópico: "${topic}"\n`
    if (themeName) userPrompt += `Tema: ${themeName}\n`
    if (bookTitle) userPrompt += `Livro de Origem: ${bookTitle}\n`
    if (flashcardQuestion && flashcardAnswer) userPrompt += `Flashcard Contexto: Q: ${flashcardQuestion} / A: ${flashcardAnswer}\n`
    if (annotationQuote) userPrompt += `Trecho grifado de referência: "${annotationQuote}" (${annotationNote ?? ''})\n`
    userPrompt += `Profundidade: ${depthLevel}`

    // Executa em cascata (3.7 -> 3.6 -> 3.5 -> APIs externas). Lança erro se falhar.
    const rawGenerated = await this.executeChatCascade({
      userPrompt,
      systemInstruction: systemPrompt,
      clientType: 'didactic',
    })

    const cleanHtml = rawGenerated.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim()

    const titleMatch = cleanHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i) || cleanHtml.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1].replace(/[*_#]/g, '').trim() : `Didático: ${topic}`

    const diagramCount = (cleanHtml.match(/class="aresta-stepper"/g) || []).length +
      (cleanHtml.match(/class="aresta-slides"/g) || []).length +
      (cleanHtml.match(/```mermaid|<svg/g) || []).length

    return {
      title,
      html: cleanHtml,
      markdown: cleanHtml,
      diagramCount,
    }
  }

  /**
   * Gera uma explicação curta e contextual em HTML limpo para popovers/overlays de anotação.
   */
  async generateShortExplanation(params: {
    text: string
    prompt?: string
    bookTitle?: string
    userLanguage?: string
  }): Promise<{ html: string; textSnippet: string }> {
    const { text, prompt, bookTitle, userLanguage = 'pt-BR' } = params

    const systemPrompt = `Você é o assistente didático pontual do Aresta. O leitor selecionou um trecho de um livro e solicitou uma explicação rápida e objetiva.

DIRETRIZES:
1. Retorne HTML semântico conciso e estruturado, SEM blocos de código como \`\`\`html.
2. Formato:
   <div class="aresta-short-explanation">
     <div class="aresta-short-header"><strong>Explicação Contextual</strong></div>
     <div class="aresta-short-body">
       <p>1 a 2 parágrafos claros explicando o trecho selecionado de forma direta.</p>
     </div>
     <div class="aresta-short-highlight">
       <p>Ponto prático de fixação ou exemplo conciso.</p>
     </div>
   </div>
3. NÃO UTILIZE NENHUM EMOJI em botões ou cabeçalhos.
4. Linguagem concisa, elegante e didática em ${userLanguage}.`

    let userPrompt = `Trecho selecionado: "${text}"\n`
    if (bookTitle) userPrompt += `Obra: ${bookTitle}\n`
    if (prompt) userPrompt += `Instrução do usuário: ${prompt}\n`

    const rawGenerated = await this.executeChatCascade({
      userPrompt,
      systemInstruction: systemPrompt,
      clientType: 'didactic',
    })

    const cleanHtml = rawGenerated.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim()

    return {
      html: cleanHtml,
      textSnippet: text.slice(0, 100),
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

  /**
   * Sintetiza páginas desenhadas à mão em HTML semântico com CSS moderno via Gemini Vision
   */
  async synthesizeDrawingToHtml(params: {
    images: string[]
    promptOverride?: string
  }): Promise<{ html: string; titleSuggested: string; summary: string }> {
    if (!params.images || params.images.length === 0) {
      throw new Error('Nenhuma imagem de página fornecida para síntese.')
    }

    const inlineParts = params.images.map((img) => {
      let mimeType = 'image/png'
      let cleanBase64 = img
      if (img.startsWith('data:')) {
        const match = img.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/)
        if (match) {
          mimeType = match[1]
          cleanBase64 = match[2]
        }
      }
      return {
        inlineData: {
          data: cleanBase64.trim(),
          mimeType,
        },
      }
    })

    const systemInstruction = `Você é um compilador de conteúdo visual e arquiteto de anotações da plataforma Aresta.
Sua missão é interpretar rigorosamente anotações manuscritas, desenhos, fluxogramas, tabelas e diagramas contidos nas imagens das páginas de um caderno e sintetizá-los em HTML semântico puro com CSS moderno embutido e visual premium.

Diretrizes obrigatórias:
1. SEMÂNTICA E CONTEÚDO:
   - Identifique títulos, subtítulos, tópicos e anotações. Use <h1>, <h2>, <h3>, <p>, <ul>, <ol>.
   - Preserve integralmente o significado, fórmulas, termos e conexões conceituais desenhadas.
2. DIAGRAMAS E FLUXOGRAMAS:
   - Converta blocos conectados, caixas, setas e árvores desenhadas em estruturas visuais HTML/CSS usando display: flex ou grid, cards com bordas elegantes, badges de etapas e setas em caracteres limpos (→, ↓, ➔).
   - NÃO utilize blocos brutos de código Markdown ou DSL externa não compilada.
3. TABELAS:
   - Converta tabelas desenhadas em elementos <table> semânticos com <thead>, <th>, <tbody>, <td> com bordas sutis e padding equilibrado.
4. ESTILIZAÇÃO E TEMA:
   - Todo o conteúdo deve ser envolvido por uma div com classe 'aresta-drawing-synthesis'.
   - Adicione estilos embutidos <style> dentro ou classes adequadas, com cores sofisticadas (tons de cinza, acentos laranja/âmbar, bordas suaves, tipografia com line-height confortável).
5. FORMATO DE SAÍDA:
   - Responda EXCLUSIVAMENTE em formato JSON válido:
   {
     "titleSuggested": "Título representativo sintetizado",
     "summary": "Breve resumo do conteúdo em 1 ou 2 frases",
     "html": "<div class=\\"aresta-drawing-synthesis\\">...</div>"
   }`

    const userPrompt = params.promptOverride || 'Converta com máxima fidelidade e beleza visual as anotações e desenhos contidos nestas páginas para a estrutura JSON solicitada.'

    const candidateModels = [...new Set([GEMINI_MODEL, ...GEMINI_MODEL_CASCADE].filter(Boolean))]
    let lastError: any = null

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction,
        })

        const result = await model.generateContent([userPrompt, ...inlineParts])
        const rawText = result.response.text() || ''

        const jsonMatch = rawText.match(/\{[\s\S]*\}/)?.[0]
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch)
            if (parsed.html) {
              return {
                titleSuggested: parsed.titleSuggested || 'Desenho Sintetizado',
                summary: parsed.summary || 'Síntese das anotações manuscritas.',
                html: parsed.html,
              }
            }
          } catch {
            // Continua para fallback
          }
        }

        const cleanedHtml = rawText.replace(/^```(html)?\n?/i, '').replace(/\n?```$/i, '').trim()
        return {
          titleSuggested: 'Anotação Sintetizada',
          summary: 'Conteúdo visual sintetizado com sucesso.',
          html: cleanedHtml,
        }
      } catch (err: any) {
        lastError = err
        console.warn(`[AiService:synthesizeDrawingToHtml] Falha com ${modelName}:`, err?.message || err)
      }
    }

    throw new Error(`Falha ao sintetizar desenho com IA: ${lastError?.message || 'Erro desconhecido'}`)
  }
}

export const aiService = new AiService()
