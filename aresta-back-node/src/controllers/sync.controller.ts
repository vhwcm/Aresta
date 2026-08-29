import { Response, NextFunction } from 'express';
import { SyncService } from '../services/sync.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class SyncController {
  constructor(private syncService = new SyncService()) {}

  private getUserId(req: AuthenticatedRequest): number {
    return req.user?.userId || 1;
  }

  /**
   * @openapi
   * /api/sync:
   *   post:
   *     summary: Sincronização bidirecional de mutações locais e deltas remotos
   *     tags: [Sync]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               last_sync_timestamp:
   *                 type: string
   *                 nullable: true
   *                 example: "2026-08-29T10:00:00.000Z"
   *               mutations:
   *                 type: array
   *                 items:
   *                   type: object
   *                   required: [id, entity_type, entity_id, action, payload, client_timestamp]
   *                   properties:
   *                     id:
   *                       type: string
   *                     entity_type:
   *                       type: string
   *                       enum: [book, annotation, flashcard, canvas, streak]
   *                     entity_id:
   *                       type: string
   *                     action:
   *                       type: string
   *                       enum: [INSERT, UPDATE, DELETE]
   *                     payload:
   *                       type: object
   *                     client_timestamp:
   *                       type: string
   *     responses:
   *       200:
   *         description: Mutações processadas com sucesso e deltas retornados
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 server_timestamp:
   *                   type: string
   *                 processed_mutation_ids:
   *                   type: array
   *                   items:
   *                     type: string
   *                 conflicts:
   *                   type: array
   *                 deltas:
   *                   type: object
   */
  sync = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const result = await this.syncService.processSync(userId, req.body);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };
}
