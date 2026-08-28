import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/error.middleware.js';
import { flashcardRAGService } from './flashcardRAG.service.js';
import { StreakService } from './streak.service.js';

export interface FlashcardDTO {
  id: number;
  userId: number;
  annotationId: number;
  bookId: number;
  bookTitle: string;
  bookCover: string | null;
  chapterTitle: string | null;
  selectedText: string | null;
  note: string | null;
  cardType: string;
  question: string;
  answer: string;
  contextSummary: string | null;
  repetitionLevel: number;
  nextReviewAt: Date;
  lastReviewedAt: Date | null;
  reviewCount: number;
  difficulty: number;
  isReviewed?: boolean;
  rating?: string | null;
  position?: number;
}

export class FlashcardService {
  private streakService: StreakService;

  constructor() {
    this.streakService = new StreakService();
  }

  /**
   * Gera flashcards 1:1 para todas as anotações que ainda não possuem flashcard
   */
  public async generatePendingFlashcards(userId?: number, limit = 50) {
    const whereClause: any = {
      flashcard: null,
    };

    if (userId) {
      whereClause.user_id = userId;
    }

    const pendingAnnotations = await prisma.annotation.findMany({
      where: whereClause,
      take: limit,
      select: {
        id: true,
        user_id: true,
      },
    });

    const generated = [];
    for (const ann of pendingAnnotations) {
      try {
        const card = await flashcardRAGService.generateFlashcardForAnnotation(ann.user_id, ann.id);
        generated.push(card);
      } catch (err) {
        console.error(`[FlashcardService] Erro ao gerar flashcard para anotação ${ann.id}:`, err);
      }
    }

    return {
      totalPendingFound: pendingAnnotations.length,
      totalGenerated: generated.length,
      flashcards: generated,
    };
  }

  /**
   * Obtém ou monta sob demanda o deck diário de até 50 flashcards balanceados
   */
  public async getOrCreateDailyDeck(userId: number, dateStr?: string): Promise<{ date: string; totalCards: number; reviewedCount: number; cards: FlashcardDTO[] }> {
    const deckDate = dateStr || this.streakService.getUtcDateString();

    // 1. Verificar se já existe deck persistido para o dia
    const existingDeckCards = await prisma.dailyDeckCard.findMany({
      where: {
        user_id: userId,
        deck_date: deckDate,
      },
      orderBy: { position: 'asc' },
      include: {
        flashcard: {
          include: {
            book: {
              select: { id: true, title: true, cover_path: true },
            },
            annotation: {
              select: {
                id: true,
                selected_text: true,
                note: true,
                chapter_title: true,
              },
            },
          },
        },
      },
    });

    if (existingDeckCards.length > 0) {
      const cards: FlashcardDTO[] = existingDeckCards.map((dc) => ({
        id: dc.flashcard.id,
        userId: dc.flashcard.user_id,
        annotationId: dc.flashcard.annotation_id,
        bookId: dc.flashcard.book_id,
        bookTitle: dc.flashcard.book.title,
        bookCover: dc.flashcard.book.cover_path,
        chapterTitle: dc.flashcard.annotation.chapter_title,
        selectedText: dc.flashcard.annotation.selected_text,
        note: dc.flashcard.annotation.note,
        cardType: dc.flashcard.card_type,
        question: dc.flashcard.question,
        answer: dc.flashcard.answer,
        contextSummary: dc.flashcard.context_summary,
        repetitionLevel: dc.flashcard.repetition_level,
        nextReviewAt: dc.flashcard.next_review_at,
        lastReviewedAt: dc.flashcard.last_reviewed_at,
        reviewCount: dc.flashcard.review_count,
        difficulty: dc.flashcard.difficulty,
        isReviewed: dc.is_reviewed,
        rating: dc.rating,
        position: dc.position,
      }));

      const reviewedCount = cards.filter((c) => c.isReviewed).length;
      return {
        date: deckDate,
        totalCards: cards.length,
        reviewedCount,
        cards,
      };
    }

    // 2. Se não existe deck, garantir primeiro que anotações sem flashcard sejam processadas
    await this.generatePendingFlashcards(userId, 50);

    // 3. Buscar todos os flashcards do usuário
    const allUserFlashcards = await prisma.flashcard.findMany({
      where: { user_id: userId },
      include: {
        book: {
          select: { id: true, title: true, cover_path: true, bookThemes: { include: { theme: true } } },
        },
        annotation: {
          select: {
            id: true,
            selected_text: true,
            note: true,
            chapter_title: true,
            annotationThemes: { include: { theme: true } },
          },
        },
      },
    });

    if (allUserFlashcards.length === 0) {
      return {
        date: deckDate,
        totalCards: 0,
        reviewedCount: 0,
        cards: [],
      };
    }

    // 4. Seleção inteligente do Deck de 50 cards
    const now = new Date();
    // Prioridade 1: Cards vencidos ou agendados para até o final de hoje
    const dueCards = allUserFlashcards.filter((c) => new Date(c.next_review_at) <= now);
    const nonDueCards = allUserFlashcards.filter((c) => new Date(c.next_review_at) > now);

    // Embaralhar para evitar sempre a mesma ordem
    dueCards.sort(() => Math.random() - 0.5);
    nonDueCards.sort(() => Math.random() - 0.5);

    const selectedCards: typeof allUserFlashcards = [];

    // Adiciona os devidos primeiro
    for (const card of dueCards) {
      if (selectedCards.length < 50) {
        selectedCards.push(card);
      }
    }

    // Completa com sorteio balanceado por temas dos não-devidos
    if (selectedCards.length < 50) {
      for (const card of nonDueCards) {
        if (selectedCards.length < 50) {
          selectedCards.push(card);
        }
      }
    }

    // 5. Salvar DailyDeckCard no banco de dados
    await prisma.$transaction(
      selectedCards.map((card, index) =>
        prisma.dailyDeckCard.create({
          data: {
            user_id: userId,
            deck_date: deckDate,
            flashcard_id: card.id,
            position: index + 1,
            is_reviewed: false,
          },
        })
      )
    );

    // 6. Formatar resposta
    const cards: FlashcardDTO[] = selectedCards.map((c, index) => ({
      id: c.id,
      userId: c.user_id,
      annotationId: c.annotation_id,
      bookId: c.book_id,
      bookTitle: c.book.title,
      bookCover: c.book.cover_path,
      chapterTitle: c.annotation.chapter_title,
      selectedText: c.annotation.selected_text,
      note: c.annotation.note,
      cardType: c.card_type,
      question: c.question,
      answer: c.answer,
      contextSummary: c.context_summary,
      repetitionLevel: c.repetition_level,
      nextReviewAt: c.next_review_at,
      lastReviewedAt: c.last_reviewed_at,
      reviewCount: c.review_count,
      difficulty: c.difficulty,
      isReviewed: false,
      rating: null,
      position: index + 1,
    }));

    return {
      date: deckDate,
      totalCards: cards.length,
      reviewedCount: 0,
      cards,
    };
  }

  /**
   * Retorna o primeiro flashcard do deck diário para o widget da Home
   */
  public async getFirstDailyFlashcard(userId: number, dateStr?: string): Promise<FlashcardDTO | null> {
    const deck = await this.getOrCreateDailyDeck(userId, dateStr);
    if (deck.cards.length === 0) {
      return null;
    }
    // Retorna o primeiro card não revisado, ou o primeiro do dia se todos estiverem revisados
    const firstUnreviewed = deck.cards.find((c) => !c.isReviewed);
    return firstUnreviewed || deck.cards[0];
  }

  /**
   * Registra a autoavaliação (hard, good, easy) e atualiza a repetição espaçada e streak
   */
  public async reviewFlashcard(
    userId: number,
    flashcardId: number,
    rating: 'hard' | 'good' | 'easy',
    dateStr?: string
  ) {
    const flashcard = await prisma.flashcard.findFirst({
      where: { id: flashcardId, user_id: userId },
      include: {
        book: { select: { id: true, title: true, cover_path: true } },
        annotation: {
          select: {
            id: true,
            selected_text: true,
            note: true,
            chapter_title: true,
          },
        },
      },
    });

    if (!flashcard) {
      throw new AppError('Flashcard não encontrado.', 404);
    }

    const todayStr = dateStr || this.streakService.getUtcDateString();
    const now = new Date();

    // Cálculo da Repetição Espaçada (Curva do Esquecimento / SuperMemo)
    let newLevel = flashcard.repetition_level;
    let daysToAdd = 1;
    let newDifficulty = flashcard.difficulty;

    if (rating === 'hard') {
      newLevel = 1;
      daysToAdd = 1;
      newDifficulty = Math.min(3.0, flashcard.difficulty + 0.2);
    } else if (rating === 'good') {
      newLevel = flashcard.repetition_level + 1;
      daysToAdd = Math.max(2, newLevel * 2);
      newDifficulty = Math.max(1.3, flashcard.difficulty);
    } else if (rating === 'easy') {
      newLevel = flashcard.repetition_level + 2;
      daysToAdd = Math.max(4, newLevel * 3);
      newDifficulty = Math.max(1.3, flashcard.difficulty - 0.15);
    }

    const nextReview = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    // 1. Atualizar o Flashcard
    const updatedFlashcard = await prisma.flashcard.update({
      where: { id: flashcardId },
      data: {
        repetition_level: newLevel,
        next_review_at: nextReview,
        last_reviewed_at: now,
        review_count: flashcard.review_count + 1,
        difficulty: Number(newDifficulty.toFixed(2)),
      },
    });

    // 2. Atualizar o DailyDeckCard para o dia se existir
    await prisma.dailyDeckCard.updateMany({
      where: {
        user_id: userId,
        deck_date: todayStr,
        flashcard_id: flashcardId,
      },
      data: {
        is_reviewed: true,
        rating,
        reviewed_at: now,
      },
    });

    // 3. Registrar atividade no StreakService
    const streakResult = await this.streakService.recordFlashcardReview(userId, 1);

    return {
      flashcard: {
        id: updatedFlashcard.id,
        userId: updatedFlashcard.user_id,
        annotationId: updatedFlashcard.annotation_id,
        bookId: updatedFlashcard.book_id,
        bookTitle: flashcard.book.title,
        bookCover: flashcard.book.cover_path,
        chapterTitle: flashcard.annotation.chapter_title,
        selectedText: flashcard.annotation.selected_text,
        note: flashcard.annotation.note,
        cardType: updatedFlashcard.card_type,
        question: updatedFlashcard.question,
        answer: updatedFlashcard.answer,
        contextSummary: updatedFlashcard.context_summary,
        repetitionLevel: updatedFlashcard.repetition_level,
        nextReviewAt: updatedFlashcard.next_review_at,
        lastReviewedAt: updatedFlashcard.last_reviewed_at,
        reviewCount: updatedFlashcard.review_count,
        difficulty: updatedFlashcard.difficulty,
        isReviewed: true,
        rating,
      },
      streak: streakResult.status,
      justCompletedStreakGoal: streakResult.justCompleted,
    };
  }
}

export const flashcardService = new FlashcardService();
