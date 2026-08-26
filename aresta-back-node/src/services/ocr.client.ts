import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'node:path';
import fs from 'node:fs';
import { env } from '../config/env.js';

export interface ExtractTextResult {
  text: string;
  modelUsed?: string;
}

export class OcrClient {
  private client: any = null;
  private protoLoaded = false;

  private initClient(): void {
    if (this.client) return;

    let protoPath = env.OCR_PROTO_PATH;
    if (!fs.existsSync(protoPath)) {
      protoPath = path.resolve(process.cwd(), 'proto/ocr/v1/ocr.proto');
    }

    if (!fs.existsSync(protoPath)) {
      throw new Error(`Arquivo proto de OCR não encontrado no caminho: ${protoPath}`);
    }

    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
    const OcrService = protoDescriptor.ocr?.v1?.OcrService;

    if (!OcrService) {
      throw new Error('Serviço ocr.v1.OcrService não foi encontrado no arquivo Protobuf carregado.');
    }

    this.client = new OcrService(
      env.OCR_GRPC_URL,
      grpc.credentials.createInsecure()
    );
    this.protoLoaded = true;
  }

  /**
   * Envia uma imagem (buffer) para extração OCR via gRPC
   * @param imageBuffer Buffer da imagem
   * @param mimeType MimeType (ex: "image/png", "image/jpeg")
   * @param promptHint Dica opcional de contexto
   * @param timeoutMs Timeout em milissegundos (default: 20000ms)
   */
  async extractText(
    imageBuffer: Buffer,
    mimeType = 'image/png',
    promptHint = '',
    timeoutMs = 20000
  ): Promise<ExtractTextResult> {
    this.initClient();

    return new Promise((resolve, reject) => {
      const deadline = new Date(Date.now() + timeoutMs);
      const request = {
        image_data: imageBuffer,
        mime_type: mimeType,
        prompt_hint: promptHint,
      };

      this.client.ExtractText(
        request,
        { deadline },
        (error: grpc.ServiceError | null, response: { text?: string; model_used?: string }) => {
          if (error) {
            console.error('Erro na chamada gRPC ao serviço OCR:', error);
            if (error.code === grpc.status.DEADLINE_EXCEEDED) {
              return reject(new Error('Tempo limite excedido ao processar OCR no microsserviço.'));
            }
            if (error.code === grpc.status.UNAVAILABLE) {
              return reject(new Error('Microsserviço de OCR indisponível (conexão recusada).'));
            }
            return reject(new Error(error.details || error.message || 'Falha ao extrair texto da imagem.'));
          }

          const extractedText = (response?.text || '').trim();
          resolve({
            text: extractedText,
            modelUsed: response?.model_used || '',
          });
        }
      );
    });
  }
}

export const ocrClient = new OcrClient();
