import { Response, NextFunction } from 'express';
import { UserSettingsService } from '../services/userSettings.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class UserSettingsController {
  constructor(private userSettingsService = new UserSettingsService()) {}

  private getUserId(req: AuthenticatedRequest): number {
    return req.user?.userId || 1;
  }

  /**
   * @openapi
   * /api/user-settings:
   *   get:
   *     summary: Obter preferências de leitura do usuário
   *     tags: [UserSettings]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Preferências do usuário
   */
  getSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const settings = await this.userSettingsService.getSettings(userId);
      return res.status(200).json(settings);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/user-settings:
   *   put:
   *     summary: Atualizar preferências de leitura do usuário
   *     tags: [UserSettings]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               pageAnimationEnabled:
   *                 type: boolean
   *               language:
   *                 type: string
   *     responses:
   *       200:
   *         description: Preferências atualizadas
   */
  updateSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const settings = await this.userSettingsService.updateSettings(userId, req.body);
      return res.status(200).json(settings);
    } catch (error) {
      return next(error);
    }
  };
}

