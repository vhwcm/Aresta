import { Response, NextFunction } from 'express';
import { flashcardService } from '../services/flashcard.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class FlashcardController {
  private getUserId(req: AuthenticatedRequest): number {
    return req.user?.userId || 1;
  }

  /**
   * @openapi
   * /api/v1/flashcards/daily:
   *   get:
   *     summary: Obter o deck diário de até 50 flashcards do usuário logado
   *     tags: [Flashcards]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: date
   *         schema:
   *           type: string
   *           example: "2026-08-27"
   *         description: Data de referência do deck (YYYY-MM-DD)
   *     responses:
   *       200:
   *         description: Deck diário retornado com sucesso
   */
  getDailyDeck = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const date = typeof req.query.date === 'string' ? req.query.date : undefined;
      const result = await flashcardService.getOrCreateDailyDeck(userId, date);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/v1/flashcards/daily/first:
   *   get:
   *     summary: Obter o primeiro flashcard do deck diário para o widget da Home
   *     tags: [Flashcards]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: date
   *         schema:
   *           type: string
   *         description: Data do deck
   *     responses:
   *       200:
   *         description: Primeiro flashcard do dia retornado
   */
  getFirstDailyCard = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const date = typeof req.query.date === 'string' ? req.query.date : undefined;
      const card = await flashcardService.getFirstDailyFlashcard(userId, date);
      return res.status(200).json({ card });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/v1/flashcards/{id}/review:
   *   post:
   *     summary: Avaliar flashcard com repetição espaçada e pontuar ofensiva
   *     tags: [Flashcards]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [rating]
   *             properties:
   *               rating:
   *                 type: string
   *                 enum: [hard, good, easy]
   *     responses:
   *       200:
   *         description: Revisão computada e agendamento de repetição atualizado
   */
  reviewFlashcard = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const flashcardId = Number(req.params.id);
      const { rating } = req.body;
      const result = await flashcardService.reviewFlashcard(userId, flashcardId, rating);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/v1/flashcards/generate-batch:
   *   post:
   *     summary: Disparar geração em lote de flashcards para anotações pendentes
   *     tags: [Flashcards]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               limit:
   *                 type: integer
   *                 default: 50
   *     responses:
   *       200:
   *         description: Flashcards gerados com sucesso
   */
  generateBatch = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const limit = req.body?.limit ? Number(req.body.limit) : 50;
      const result = await flashcardService.generatePendingFlashcards(userId, limit);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };
}

export const flashcardController = new FlashcardController();
