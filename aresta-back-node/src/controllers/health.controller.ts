import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';

export class HealthController {
  /**
   * @openapi
   * /api/health:
   *   get:
   *     summary: Verificação de status e saúde do backend e banco
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Status do sistema
   */
  check = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const config = await prisma.appConfig.findUnique({
        where: { key: 'version' },
      });

      return res.status(200).json({
        status: 'UP',
        database: env.DATABASE_URL,
        schemaVersion: config?.value || '1.0.0',
      });
    } catch (error) {
      return next(error);
    }
  };
}

