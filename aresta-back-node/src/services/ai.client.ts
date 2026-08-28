import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'node:path';
import fs from 'node:fs';
import { env } from '../config/env.js';

export interface ThemeItemProto {
  id: number;
  name: string;
  embedding?: number[];
}

export interface NewThemeSuggestionProto {
  name: string;
  description?: string;
  color?: string;
  embedding?: number[];
  parent_theme_name?: string;
}

export interface AnalyzeBookResultProto {
  summary: string;
  matchedThemeIds: number[];
  newThemes: NewThemeSuggestionProto[];
}

export interface ContextAnnotationProto {
  note: string;
  quote: string;
  chapter: string;
}

export interface GenerateFlashcardRequestProto {
  bookTitle: string;
  targetQuote: string;
  targetNote: string;
  chapterTitle?: string;
  themes?: string[];
  contextNotes?: ContextAnnotationProto[];
}

export interface GenerateFlashcardResultProto {
  question: string;
  answer: string;
  cardType: string;
  contextSummary?: string;
}

export class AIClient {
  private client: any = null;
  private protoLoaded = false;

  private initClient(): void {
    if (this.client) return;

    let protoPath = path.resolve(process.cwd(), 'proto/ai/v1/ai.proto');
    if (!fs.existsSync(protoPath)) {
      protoPath = path.resolve(process.cwd(), '../aresta-ocr/proto/ai/v1/ai.proto');
    }

    if (!fs.existsSync(protoPath)) {
      throw new Error(`Arquivo proto de IA não encontrado no caminho: ${protoPath}`);
    }

    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
    const AIService = protoDescriptor.ai?.v1?.AIService;

    if (!AIService) {
      throw new Error('Serviço ai.v1.AIService não foi encontrado no arquivo Protobuf carregado.');
    }

    this.client = new AIService(
      env.OCR_GRPC_URL,
      grpc.credentials.createInsecure()
    );
    this.protoLoaded = true;
  }

  /**
   * Envia título e autor do livro para análise semântica e busca web no microsserviço Go
   */
  async analyzeBook(
    title: string,
    author: string,
    existingThemes: ThemeItemProto[] = [],
    timeoutMs = 30000
  ): Promise<AnalyzeBookResultProto> {
    try {
      this.initClient();
    } catch (e) {
      console.warn('[AIClient] Falha ao inicializar client gRPC:', e);
      return {
        summary: `Obra '${title}' de ${author}.`,
        matchedThemeIds: [],
        newThemes: [],
      };
    }

    return new Promise((resolve) => {
      const deadline = new Date(Date.now() + timeoutMs);
      const request = {
        title,
        author,
        existing_themes: existingThemes.map((t) => ({
          id: t.id,
          name: t.name,
          embedding: t.embedding || [],
        })),
      };

      this.client.AnalyzeBook(
        request,
        { deadline },
        (error: grpc.ServiceError | null, response: any) => {
          if (error) {
            console.warn('[AIClient] Fallback local para AnalyzeBook:', error.message);
            return resolve({
              summary: `Obra '${title}' de ${author}.`,
              matchedThemeIds: existingThemes.length > 0 ? [existingThemes[0].id] : [],
              newThemes: [],
            });
          }

          const summary = (response?.summary || '').trim();
          const matchedThemeIds = (response?.matched_theme_ids || []).map((id: any) => Number(id));
          const newThemes = (response?.new_themes || []).map((nt: any) => ({
            name: nt.name,
            description: nt.description,
            color: nt.color,
            embedding: nt.embedding,
            parent_theme_name: nt.parent_theme_name,
          }));

          resolve({
            summary,
            matchedThemeIds,
            newThemes,
          });
        }
      );
    });
  }

  /**
   * Gera embedding vetorial (float[]) para um texto via gRPC com fallback determinístico local
   */
  async generateEmbedding(text: string, timeoutMs = 5000): Promise<number[]> {
    if (!text || text.trim() === '') {
      return new Array(768).fill(0);
    }

    try {
      this.initClient();
      return await new Promise<number[]>((resolve) => {
        const deadline = new Date(Date.now() + timeoutMs);
        this.client.GenerateEmbedding(
          { text },
          { deadline },
          (error: grpc.ServiceError | null, response: any) => {
            if (error || !response?.embedding || response.embedding.length === 0) {
              return resolve(this.generateLocalEmbedding(text));
            }
            resolve(response.embedding.map((v: any) => Number(v)));
          }
        );
      });
    } catch {
      return this.generateLocalEmbedding(text);
    }
  }

  /**
   * Gera flashcard pedagógico inteligente via gRPC com fallback local
   */
  async generateFlashcard(
    req: GenerateFlashcardRequestProto,
    timeoutMs = 20000
  ): Promise<GenerateFlashcardResultProto> {
    try {
      this.initClient();
      return await new Promise<GenerateFlashcardResultProto>((resolve) => {
        const deadline = new Date(Date.now() + timeoutMs);
        const request = {
          book_title: req.bookTitle,
          target_quote: req.targetQuote || '',
          target_note: req.targetNote || '',
          chapter_title: req.chapterTitle || '',
          themes: req.themes || [],
          context_notes: (req.contextNotes || []).map((cn) => ({
            note: cn.note,
            quote: cn.quote,
            chapter: cn.chapter,
          })),
        };

        this.client.GenerateFlashcard(
          request,
          { deadline },
          (error: grpc.ServiceError | null, response: any) => {
            if (error || !response?.question) {
              return resolve(this.generateLocalFlashcard(req));
            }

            resolve({
              question: response.question,
              answer: response.answer,
              cardType: response.card_type || 'CONCEPT_RECALL',
              contextSummary: response.context_summary || '',
            });
          }
        );
      });
    } catch {
      return this.generateLocalFlashcard(req);
    }
  }

  /**
   * Fallback local para gerar embedding de 768 dimensões normalizado
   */
  private generateLocalEmbedding(text: string): number[] {
    const dim = 768;
    const emb = new Array(dim).fill(0);
    let sum = 0;

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      const idx = (code * 31 + i) % dim;
      emb[idx] += code * 0.01;
      sum += emb[idx];
    }

    if (sum === 0) sum = 1;
    for (let i = 0; i < dim; i++) {
      emb[i] = Number((emb[i] / sum).toFixed(6));
    }
    return emb;
  }

  /**
   * Fallback local pedagógico nos 3 arquétipos
   */
  private generateLocalFlashcard(req: GenerateFlashcardRequestProto): GenerateFlashcardResultProto {
    const hasContext = req.contextNotes && req.contextNotes.length > 0;
    const quote = req.targetQuote?.trim() || req.targetNote?.trim() || 'Conceito da leitura';
    const note = req.targetNote?.trim() || 'Anotação de estudo';

    if (hasContext) {
      const neighbor = req.contextNotes![0];
      return {
        question: `Como o conceito "${quote.slice(0, 80)}..." se conecta com a ideia de "${neighbor.quote.slice(0, 60)}..."?`,
        answer: `Ambos os trechos exploram aspectos complementares em "${req.bookTitle}". Síntese: ${note}. Contexto correlato: ${neighbor.note}.`,
        cardType: 'CONCEPT_UNION',
        contextSummary: `Conexão semântica entre capítulos de ${req.bookTitle}`,
      };
    }

    if (req.targetNote && req.targetNote.length > 10) {
      return {
        question: `Em uma situação prática, como se aplica o princípio: "${note}"?`,
        answer: `No contexto de "${req.bookTitle}", este princípio resolve problemas fundamentais quando nos deparamos com o cenário descrito no trecho: "${quote}".`,
        cardType: 'REAL_SITUATION',
        contextSummary: `Aplicação prática em ${req.bookTitle}`,
      };
    }

    return {
      question: `Qual o princípio essencial destacado no trecho: "${quote.slice(0, 100)}..."?`,
      answer: `O autor enfatiza conceitos fundamentais em "${req.bookTitle}". Significado central: ${note}.`,
      cardType: 'CONCEPT_RECALL',
      contextSummary: `Conceito fundamental de ${req.bookTitle}`,
    };
  }
}

export const aiClient = new AIClient();
