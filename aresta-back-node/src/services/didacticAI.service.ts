import { DidacticPromptContext, DidacticPromptEngineService } from './didacticPromptEngine.service.js';

export interface DidacticGenerationResult {
  title: string;
  markdown: string;
  diagramCount: number;
}

export class DidacticAIService {
  /**
   * Gera o conteúdo didático estruturado utilizando Gemini AI com fallback local pedagógico
   */
  async generateExplanation(context: DidacticPromptContext): Promise<DidacticGenerationResult> {
    const { systemPrompt, userPrompt } = DidacticPromptEngineService.buildPrompt(context);

    try {
      // Se houver chave do Gemini no ambiente ou serviço configurado, invoca
      const content = await this.callGeminiModel(systemPrompt, userPrompt);
      if (content && content.trim().length > 50) {
        const diagramCount = this.countMermaidDiagrams(content);
        return {
          title: this.extractOrFallbackTitle(content, context.topic),
          markdown: content,
          diagramCount,
        };
      }
    } catch (err) {
      console.warn('[DidacticAIService] Erro ao invocar Gemini AI. Utilizando gerador pedagógico determinístico:', err);
    }

    return this.generateDeterministicDidacticContent(context);
  }

  private async callGeminiModel(systemPrompt: string, userPrompt: string): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return null;

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        console.warn('[DidacticAIService] Resposta não OK do Gemini:', response.status, response.statusText);
        return null;
      }

      const data = (await response.json()) as any;
      return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    } catch (e) {
      console.warn('[DidacticAIService] Falha na requisição HTTP do Gemini:', e);
      return null;
    }
  }

  private countMermaidDiagrams(markdown: string): number {
    const matches = markdown.match(/```mermaid[\s\S]*?```/g);
    return matches ? matches.length : 0;
  }

  private extractOrFallbackTitle(markdown: string, fallback: string): string {
    const match = markdown.match(/^#\s+(.+)$/m);
    if (match && match[1]) {
      return match[1].replace(/[*_#]/g, '').trim();
    }
    return fallback;
  }

  /**
   * Gerador didático determinístico de alta qualidade para testes, offline e fallbacks
   */
  private generateDeterministicDidacticContent(context: DidacticPromptContext): DidacticGenerationResult {
    const topic = context.topic.trim();
    const title = `Didático: ${topic.charAt(0).toUpperCase() + topic.slice(1)}`;

    const markdown = `# ${title}

> [!ANALOGY]
> Pense em **${topic}** como um sistema de engrenagens em uma oficina bem organizada: cada peça tem uma responsabilidade única e interage com as vizinhas sem depender de como elas foram construídas por dentro.

---

## 1. O Mecanismo Fundamental

Em sua essência, ${topic} visa resolver a complexidade dividindo um problema denso em partes gerenciáveis e observáveis.

> [!KEY_CONCEPT]
> **Princípio Central**: Isolar responsabilidades, reduzir acoplamento e permitir raciocínio previsível sobre o fluxo de dados e estados.

---

## 2. Mapa Conceitual Visual

O diagrama a seguir ilustra a sequência lógica e as relações de causa e efeito:

\`\`\`mermaid
flowchart TD
    A[🎯 Entrada / Problema: ${topic.slice(0, 20)}] --> B[⚙️ Processamento & Validação]
    B --> C{Conceito Atendido?}
    C -->|Sim| D[✅ Resultado Didático & Fixação]
    C -->|Não| E[⚠️ Ajuste de Hipótese & Revisão]
    E --> B
\`\`\`

---

## 3. Na Prática & O Que Evitar

> [!TIP]
> **Dica de Ouro**: Ao estudar ou implementar ${topic}, comece sempre pelo fluxo principal antes de se preocupar com casos de borda raros.

> [!WARNING]
> **Armadilha Comum**: Tentar memorizar termos sem entender a metáfora fundamental por trás de cada etapa.

---

## 4. Fixação do Conhecimento

<details>
<summary>🧠 Pergunta 1: Qual o objetivo principal de ${topic}?</summary>
O objetivo principal é simplificar a compreensão e a tomada de decisão através de abstrações claras e previsíveis.
</details>

<details>
<summary>🔍 Pergunta 2: O que acontece se ignorarmos o princípio central?</summary>
O sistema ou raciocínio torna-se excessivamente frágil, dificultando manutenções futuras e diagnósticos de erros.
</details>
`;

    return {
      title,
      markdown,
      diagramCount: 1,
    };
  }
}

export const didacticAIService = new DidacticAIService();
