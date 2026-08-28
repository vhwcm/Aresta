import { prisma } from '../config/prisma.js';
import { aiClient } from './ai.client.js';

export interface NeighborAnnotation {
  id: number;
  note: string;
  quote: string;
  chapter: string;
  similarity: number;
}

export class FlashcardRAGService {
  /**
   * Calcula a similaridade de cosseno entre dois vetores de mesma dimensão
   */
  public cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length || a.length === 0) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Busca no espaço vetorial do usuário as k anotações mais próximas semanticamente
   */
  public async findNearestNeighborAnnotations(
    userId: number,
    targetAnnotationId: number,
    targetEmbedding: number[],
    topK = 3
  ): Promise<NeighborAnnotation[]> {
    const userAnnotations = await prisma.annotation.findMany({
      where: {
        user_id: userId,
        id: { not: targetAnnotationId },
        embedding: { not: null },
      },
      select: {
        id: true,
        selected_text: true,
        note: true,
        chapter_title: true,
        embedding: true,
      },
    });

    const scored: NeighborAnnotation[] = [];

    for (const ann of userAnnotations) {
      if (!ann.embedding) continue;
      try {
        const emb = JSON.parse(ann.embedding) as number[];
        if (Array.isArray(emb) && emb.length > 0) {
          const sim = this.cosineSimilarity(targetEmbedding, emb);
          scored.push({
            id: ann.id,
            quote: ann.selected_text || '',
            note: ann.note || '',
            chapter: ann.chapter_title || '',
            similarity: sim,
          });
        }
      } catch {
        // Ignora erros de parsing em anotações corrompidas
      }
    }

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK);
  }

  /**
   * Gera e persiste um flashcard 1:1 para a anotação alvo usando RAG e IA pedagógica
   */
  public async generateFlashcardForAnnotation(userId: number, annotationId: number) {
    // 1. Verificar se já existe flashcard para essa anotação (reutilização 1:1 com custo zero)
    const existingCard = await prisma.flashcard.findUnique({
      where: { annotation_id: annotationId },
      include: {
        book: {
          select: { id: true, title: true, cover_path: true },
        },
      },
    });

    if (existingCard) {
      return existingCard;
    }

    // 2. Buscar dados completos da anotação
    const annotation = await prisma.annotation.findFirst({
      where: { id: annotationId, user_id: userId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            bookThemes: {
              include: { theme: true },
            },
          },
        },
        annotationThemes: {
          include: { theme: true },
        },
      },
    });

    if (!annotation) {
      throw new Error(`Anotação ID ${annotationId} não encontrada para o usuário ${userId}`);
    }

    // 3. Garantir embedding da anotação
    let targetEmbedding: number[] = [];
    if (annotation.embedding) {
      try {
        targetEmbedding = JSON.parse(annotation.embedding);
      } catch {
        targetEmbedding = [];
      }
    }

    if (!targetEmbedding || targetEmbedding.length === 0) {
      const textToEmbed = `${annotation.selected_text || ''} ${annotation.note || ''}`.trim() || annotation.book.title;
      targetEmbedding = await aiClient.generateEmbedding(textToEmbed);
      await prisma.annotation.update({
        where: { id: annotationId },
        data: { embedding: JSON.stringify(targetEmbedding) },
      });
    }

    // 4. RAG: Buscar vizinhos mais próximos
    const neighbors = await this.findNearestNeighborAnnotations(userId, annotationId, targetEmbedding, 3);

    // 5. Coletar temas
    const themes =
      annotation.annotationThemes.length > 0
        ? annotation.annotationThemes.map((at) => at.theme.name)
        : (annotation.book.bookThemes || []).map((bt) => bt.theme.name);

    // 6. Gerar flashcard via IA (gRPC ou fallback local)
    const aiResult = await aiClient.generateFlashcard({
      bookTitle: annotation.book.title,
      targetQuote: annotation.selected_text || '',
      targetNote: annotation.note || '',
      chapterTitle: annotation.chapter_title || '',
      themes,
      contextNotes: neighbors.map((n) => ({
        note: n.note,
        quote: n.quote,
        chapter: n.chapter,
      })),
    });

    // 7. Persistir o Flashcard 1:1
    const flashcard = await prisma.flashcard.create({
      data: {
        user_id: userId,
        annotation_id: annotationId,
        book_id: annotation.book_id,
        card_type: aiResult.cardType || 'CONCEPT_RECALL',
        question: aiResult.question,
        answer: aiResult.answer,
        context_summary: aiResult.contextSummary || null,
        repetition_level: 1,
        next_review_at: new Date(),
      },
      include: {
        book: {
          select: { id: true, title: true, cover_path: true },
        },
      },
    });

    return flashcard;
  }
}

export const flashcardRAGService = new FlashcardRAGService();
