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
    this.initClient();

    return new Promise((resolve, reject) => {
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
            console.error('Erro na chamada gRPC ao serviço de IA (AnalyzeBook):', error);
            if (error.code === grpc.status.DEADLINE_EXCEEDED) {
              return reject(new Error('Tempo limite excedido ao analisar livro no microsserviço de IA.'));
            }
            if (error.code === grpc.status.UNAVAILABLE) {
              return reject(new Error('Microsserviço de IA indisponível.'));
            }
            return reject(new Error(error.details || error.message || 'Falha ao analisar livro com IA.'));
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
}

export const aiClient = new AIClient();
