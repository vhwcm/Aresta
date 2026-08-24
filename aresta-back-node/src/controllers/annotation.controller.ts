import { Response, NextFunction } from 'express';
import { AnnotationService } from '../services/annotation.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class AnnotationController {
  constructor(private annotationService = new AnnotationService()) {}

  private getUserId(req: AuthenticatedRequest): number {
    return req.user?.userId || 1;
  }

  /**
   * @openapi
   * /api/annotations:
   *   get:
   *     summary: Listar anotações do usuário (com filtros opcionais por livro ou tema)
   *     tags: [Annotations]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: bookId
   *         schema:
   *           type: integer
   *         description: Filtrar por ID do livro
   *       - in: query
   *         name: themeId
   *         schema:
   *           type: integer
   *         description: Filtrar por ID do tema (nó do grafo)
   *     responses:
   *       200:
   *         description: Lista de anotações
   */
  getAnnotations = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const bookId = req.query.bookId ? parseInt(req.query.bookId as string, 10) : undefined;
      const themeId = req.query.themeId ? parseInt(req.query.themeId as string, 10) : undefined;

      const annotations = await this.annotationService.getAnnotations(userId, { bookId, themeId });
      return res.status(200).json(annotations);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/annotations/{id}:
   *   get:
   *     summary: Obter uma anotação por ID
   *     tags: [Annotations]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Detalhes da anotação
   *       404:
   *         description: Anotação não encontrada
   */
  getAnnotationById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const id = parseInt(req.params.id, 10);
      const annotation = await this.annotationService.getAnnotationById(userId, id);
      return res.status(200).json(annotation);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/annotations:
   *   post:
   *     summary: Criar nova anotação/destaque de EPUB
   *     tags: [Annotations]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [bookId, cfi]
   *             properties:
   *               bookId:
   *                 type: integer
   *               cfi:
   *                 type: string
   *                 example: "epubcfi(/6/14[chapter_3]!/4/2/10/1:15,/4/2/10/1:58)"
   *               selectedText:
   *                 type: string
   *               note:
   *                 type: string
   *               chapterTitle:
   *                 type: string
   *               progress:
   *                 type: number
   *                 format: float
   *                 example: 0.35
   *               themeIds:
   *                 type: array
   *                 items:
   *                   type: integer
   *     responses:
   *       201:
   *         description: Anotação criada com sucesso
   */
  createAnnotation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const annotation = await this.annotationService.createAnnotation(userId, req.body);
      return res.status(201).json(annotation);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/annotations/{id}:
   *   put:
   *     summary: Atualizar anotação existente
   *     tags: [Annotations]
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
   *             properties:
   *               cfi:
   *                 type: string
   *               selectedText:
   *                 type: string
   *               note:
   *                 type: string
   *               chapterTitle:
   *                 type: string
   *               progress:
   *                 type: number
   *               themeIds:
   *                 type: array
   *                 items:
   *                   type: integer
   *     responses:
   *       200:
   *         description: Anotação atualizada
   */
  updateAnnotation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const id = parseInt(req.params.id, 10);
      const updated = await this.annotationService.updateAnnotation(userId, id, req.body);
      return res.status(200).json(updated);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/annotations/{id}:
   *   delete:
   *     summary: Deletar anotação
   *     tags: [Annotations]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       204:
   *         description: Anotação deletada
   */
  deleteAnnotation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const id = parseInt(req.params.id, 10);
      await this.annotationService.deleteAnnotation(userId, id);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  };
}

