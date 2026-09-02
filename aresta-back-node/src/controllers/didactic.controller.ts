import { Response, NextFunction } from 'express';
import { didacticBookletService } from '../services/didacticBooklet.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { createBookletSchema, appendChapterSchema, getBookletsQuerySchema } from '../schemas/didactic.schema.js';

export class DidacticController {
  private getUserId(req: AuthenticatedRequest): number {
    return req.user?.userId || 1;
  }

  /**
   * @openapi
   * /api/v1/didactic/booklets:
   *   post:
   *     summary: Criar novo livreto didático independente gerado por IA
   *     tags: [Didactic Booklets]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [topic]
   *             properties:
   *               title:
   *                 type: string
   *                 example: "Didático: Injeção de Dependência"
   *               topic:
   *                 type: string
   *                 example: "Injeção de dependência e inversão de controle em TypeScript"
   *               theme_id:
   *                 type: integer
   *               flashcard_id:
   *                 type: integer
   *               annotation_id:
   *                 type: integer
   *               depth_level:
   *                 type: string
   *                 enum: [quick_summary, standard, deep_dive]
   *                 default: standard
   *     responses:
   *       201:
   *         description: Livreto didático criado com sucesso
   */
  createBooklet = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const validated = createBookletSchema.parse(req.body);
      const result = await didacticBookletService.createBooklet(userId, validated);
      return res.status(201).json(result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/v1/didactic/booklets/{id}/append:
   *   post:
   *     summary: Anexar um novo capítulo explicativo ao final de um livreto didático
   *     tags: [Didactic Booklets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID numérico do Book ou UUID do DidacticBooklet
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [topic]
   *             properties:
   *               title:
   *                 type: string
   *               topic:
   *                 type: string
   *               theme_id:
   *                 type: integer
   *               flashcard_id:
   *                 type: integer
   *               annotation_id:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Capítulo anexado com sucesso
   *       422:
   *         description: Erro de negócio (proibido anexar em livro que não seja livreto didático)
   */
  appendChapter = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const targetId = isNaN(Number(req.params.id)) ? req.params.id : Number(req.params.id);
      const validated = appendChapterSchema.parse(req.body);
      const result = await didacticBookletService.appendChapterToBooklet(userId, targetId, validated);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/v1/didactic/booklets:
   *   get:
   *     summary: Listar livretos didáticos do usuário
   *     tags: [Didactic Booklets]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de livretos retornada
   */
  getBooklets = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const query = getBookletsQuerySchema.parse(req.query);
      const booklets = await didacticBookletService.getBooklets(userId, query.theme_id);
      return res.status(200).json({ booklets });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/v1/didactic/booklets/{id}:
   *   get:
   *     summary: Obter dados completos de um livreto e seus capítulos
   *     tags: [Didactic Booklets]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Livreto retornado
   *       404:
   *         description: Livreto não encontrado
   */
  getBookletById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const targetId = isNaN(Number(req.params.id)) ? req.params.id : Number(req.params.id);
      const booklet = await didacticBookletService.getBookletById(userId, targetId);
      return res.status(200).json({ booklet });
    } catch (error) {
      return next(error);
    }
  };
}

export const didacticController = new DidacticController();
