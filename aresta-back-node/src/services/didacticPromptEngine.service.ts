export interface DidacticPromptContext {
  topic: string;
  depthLevel?: 'quick_summary' | 'standard' | 'deep_dive';
  themeName?: string;
  flashcardQuestion?: string;
  flashcardAnswer?: string;
  annotationQuote?: string;
  annotationNote?: string;
  bookTitle?: string;
  chapterIndex?: number;
  bookletTitle?: string;
}

export class DidacticPromptEngineService {
  /**
   * Constrói as instruções do sistema e o prompt contextual para o Gemini AI
   */
  static buildPrompt(context: DidacticPromptContext): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = `Você é o Didactic AI Tutor do ecossistema Aresta, um pedagogo e comunicador de elite especializado em ensinar conceitos complexos de forma extraordinariamente clara, intuitiva, visual e memorável para leitura em smartphones.

DIRETRIZES PEDAGÓGICAS E FORMATO OBRIGATÓRIO:
1. Formato: Markdown Estendido estruturado em seções bem delimitadas com cabeçalhos claros (#, ##, ###) e separadores (---) para permitir paginação móvel perfeita.
2. Analogia Âncora (Obrigatório): Abra a explicação com uma metáfora visual ou analogia palpável do mundo real antes de entrar no jargão técnico.
3. Princípios Primeiros: Explique a mecânica de causa e efeito ("por que funciona assim").
4. Diagramação Visual Mermaid (OBRIGATÓRIO):
   - Inclua de 1 a 2 blocos de diagramas Mermaid em bloco de código: \`\`\`mermaid ... \`\`\`
   - Tipos suportados: \`flowchart TD\`, \`flowchart LR\`, \`mindmap\`, ou \`sequenceDiagram\`.
   - Regra estrita: O diagrama Mermaid DEVE ter sintaxe 100% válida, rótulos limpos e sem quebras de sintaxe.
5. Caixas de Destaque Didáticas (Callouts com GitHub syntax):
   - > [!ANALOGY] (Metáfora do cotidiano)
   - > [!KEY_CONCEPT] (Conceito essencial e definição formal)
   - > [!TIP] (Dica prática / atalho mental de fixação)
   - > [!WARNING] (Armadilha conceitual comum ou o que NÃO fazer)
6. Fixação & Autoavaliação:
   - Finalize com 2 perguntas de checagem mental com respostas em detalhes retráteis:
     <details>
     <summary>Pergunta de Fixação</summary>
     Resposta explicativa com o raciocínio.
     </details>
7. Idioma: Português do Brasil com tom encorajador, elegante e direto.`;

    let userPrompt = `Por favor, crie um capítulo didático completo e fascinante sobre o seguinte tópico:\n`;
    userPrompt += `📌 TÓPICO PRINCIPAL: "${context.topic}"\n`;

    if (context.themeName) {
      userPrompt += `🏷️ TEMA/ÁREA DE CONHECIMENTO: ${context.themeName}\n`;
    }

    if (context.bookletTitle) {
      userPrompt += `📖 LIVRETO CONTEXTO: "${context.bookletTitle}" (Capítulo ${context.chapterIndex ?? 1})\n`;
    }

    if (context.flashcardQuestion && context.flashcardAnswer) {
      userPrompt += `\n🎯 CONTEXTO DO FLASHCARD:\n- Pergunta: ${context.flashcardQuestion}\n- Resposta: ${context.flashcardAnswer}\n`;
    }

    if (context.annotationQuote) {
      userPrompt += `\n📝 TRECHO GRIFADO NO LIVRO "${context.bookTitle || 'Obra'}":\n"${context.annotationQuote}"\n`;
      if (context.annotationNote) {
        userPrompt += `- Nota do leitor: "${context.annotationNote}"\n`;
      }
    }

    const depth = context.depthLevel || 'standard';
    if (depth === 'quick_summary') {
      userPrompt += `\n⚙️ NÍVEL DE PROFUNDIDADE: Resumo Rápido e Direto (~2 páginas mobile, 1 diagrama Mermaid).`;
    } else if (depth === 'deep_dive') {
      userPrompt += `\n⚙️ NÍVEL DE PROFUNDIDADE: Aprofundamento Completo (~6 páginas mobile, múltiplos exemplos práticos e 2 diagramas Mermaid).`;
    } else {
      userPrompt += `\n⚙️ NÍVEL DE PROFUNDIDADE: Padrão Didático Equilibrado (~4 páginas mobile, 1 diagrama Mermaid e exemplos).`;
    }

    return { systemPrompt, userPrompt };
  }
}
