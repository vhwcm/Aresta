import { Response, NextFunction } from 'express';
import { CanvasService } from '../services/canvas.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { createCanvasSchema, updateCanvasSchema } from '../schemas/canvas.schema.js';

export class CanvasController {
  constructor(private canvasService = new CanvasService()) {}

  private getUserId(req: AuthenticatedRequest): number {
    return req.user?.userId || 1;
  }

  /**
   * @openapi
   * /api/canvases:
   *   get:
   *     summary: Listar quadros do usuário
   *     tags: [Canvas]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de quadros
   */
  getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const canvases = await this.canvasService.getAllByUser(userId);
      res.json(canvases);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/canvases/{id}:
   *   get:
   *     summary: Obter quadro completo por ID
   *     tags: [Canvas]
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
   *         description: Quadro retornado com sucesso
   *       404:
   *         description: Quadro não encontrado
   */
  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;
      const canvas = await this.canvasService.getById(id, userId);
      res.json(canvas);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/canvases:
   *   post:
   *     summary: Criar novo quadro
   *     tags: [Canvas]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               data:
   *                 type: string
   *     responses:
   *       201:
   *         description: Quadro criado com sucesso
   */
  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const validated = createCanvasSchema.parse(req.body);
      const canvas = await this.canvasService.create(userId, validated);
      res.status(201).json(canvas);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/canvases/{id}:
   *   put:
   *     summary: Atualizar quadro (autosave)
   *     tags: [Canvas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               data:
   *                 type: string
   *     responses:
   *       200:
   *         description: Quadro atualizado com sucesso
   */
  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;
      const validated = updateCanvasSchema.parse(req.body);
      const canvas = await this.canvasService.update(id, userId, validated);
      res.json(canvas);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/canvases/{id}:
   *   delete:
   *     summary: Excluir quadro
   *     tags: [Canvas]
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
   *         description: Quadro excluído
   */
  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;
      const result = await this.canvasService.delete(id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/canvases/{id}/duplicate:
   *   post:
   *     summary: Duplicar quadro
   *     tags: [Canvas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       201:
   *         description: Quadro duplicado com sucesso
   */
  duplicate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;
      const canvas = await this.canvasService.duplicate(id, userId);
      res.status(201).json(canvas);
    } catch (error) {
      next(error);
    }
  };
}
