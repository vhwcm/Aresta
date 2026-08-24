import { Response, NextFunction } from 'express';
import { StreakService } from '../services/streak.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class StreakController {
  constructor(private streakService = new StreakService()) {}

  private getUserId(req: AuthenticatedRequest): number {
    return req.user?.userId || 1;
  }

  /**
   * @openapi
   * /api/users/me/streak:
   *   get:
   *     summary: Obter dados da ofensiva e progresso diário do usuário
   *     tags: [Streak]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Status da ofensiva retornado com sucesso
   */
  getStreak = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const status = await this.streakService.getStreakStatus(userId);
      return res.status(200).json(status);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/users/me/activity/reading-time:
   *   post:
   *     summary: Registrar pulso de tempo de leitura ativa do dia
   *     tags: [Streak]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [reading_seconds]
   *             properties:
   *               reading_seconds:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 300
   *     responses:
   *       200:
   *         description: Tempo registrado com sucesso e status atualizado
   */
  recordReadingTime = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const { reading_seconds } = req.body;
      const result = await this.streakService.recordReadingTime(userId, reading_seconds);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/users/me/activity/flashcard-review:
   *   post:
   *     summary: Registrar revisão de flashcard do dia
   *     tags: [Streak]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               count:
   *                 type: integer
   *                 default: 1
   *     responses:
   *       200:
   *         description: Flashcard registrado e status atualizado
   */
  recordFlashcardReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const { count = 1 } = req.body || {};
      const result = await this.streakService.recordFlashcardReview(userId, count);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/users/me/streak/target:
   *   patch:
   *     summary: Atualizar meta de dias da ofensiva
   *     tags: [Streak]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [target_days]
   *             properties:
   *               target_days:
   *                 type: integer
   *                 minimum: 1
   *     responses:
   *       200:
   *         description: Meta de ofensiva atualizada com sucesso
   */
  updateStreakTarget = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const { target_days } = req.body;
      const result = await this.streakService.updateStreakTarget(userId, target_days);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };
}
