import fs from 'node:fs';
import path from 'node:path';
import { AppError } from '../middlewares/error.middleware.js';
import { BookService } from './book.service.js';
import { ConvertBookInput } from '../schemas/conversion.schema.js';

export interface ConversionResult {
  status: string;
  epubPath: string;
  pagesCount: number;
  chaptersCount: number;
  assetsCount: number;
  processingTimeSeconds: number;
  classification: string;
  validation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export class ConversionService {
  private bookService: BookService;
  private serviceUrl: string;

  constructor(bookService = new BookService()) {
    this.bookService = bookService;
    this.serviceUrl = process.env.PDF2EPUB_SERVICE_URL || 'http://localhost:8000';
  }

  async convert(input: ConvertBookInput): Promise<ConversionResult> {
    let resolvedPdfPath: string;
    let title = input.title;
    let author = input.author;

    if (input.bookId) {
      const book = await this.bookService.getById(input.bookId);
      resolvedPdfPath = await this.bookService.getFilePath(input.bookId);
      if (!title) title = book.title;
    } else if (input.filePath) {
      resolvedPdfPath = path.resolve(process.cwd(), input.filePath);
      if (!fs.existsSync(resolvedPdfPath)) {
        resolvedPdfPath = path.resolve(process.cwd(), '..', input.filePath);
      }
      if (!fs.existsSync(resolvedPdfPath)) {
        throw new AppError(`Arquivo PDF de entrada não encontrado: ${input.filePath}`, 404);
      }
    } else {
      throw new AppError('Nenhum arquivo de entrada fornecido.', 400);
    }

    const outputEpubPath = resolvedPdfPath.replace(/\.pdf$/i, '.epub');

    try {
      const response = await fetch(`${this.serviceUrl}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: resolvedPdfPath,
          output_path: outputEpubPath,
          title: title || undefined,
          author: author || undefined,
          dpi: input.dpi || 150,
          confidence: input.confidence || 0.35,
          validate: input.validate !== false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new AppError(`Falha no microsserviço de conversão (${response.status}): ${errorText}`, 502);
      }

      const data = await response.json();
      return {
        status: data.status,
        epubPath: data.epub_path,
        pagesCount: data.pages_count,
        chaptersCount: data.chapters_count,
        assetsCount: data.assets_count,
        processingTimeSeconds: data.processing_time_seconds,
        classification: data.classification,
        validation: data.validation ? {
          isValid: data.validation.is_valid,
          errors: data.validation.errors || [],
          warnings: data.validation.warnings || [],
        } : undefined,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(`Não foi possível conectar ao microsserviço de conversão em ${this.serviceUrl}: ${err.message}`, 503);
    }
  }

  async checkHealth(): Promise<{ status: string; serviceUrl: string }> {
    try {
      const res = await fetch(`${this.serviceUrl}/health`);
      if (res.ok) {
        const data = await res.json();
        return { status: data.status || 'ok', serviceUrl: this.serviceUrl };
      }
      return { status: 'unhealthy', serviceUrl: this.serviceUrl };
    } catch {
      return { status: 'offline', serviceUrl: this.serviceUrl };
    }
  }
}
