import { Response, NextFunction } from 'express';
import { NoteService } from '../services/note.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { createNoteSchema, updateNoteSchema, noteQuerySchema } from '../schemas/note.schema.js';

export class NoteController {
  constructor(private noteService = new NoteService()) {}

  private getUserId(req: AuthenticatedRequest): number {
    return req.user?.userId || 1;
  }

  /**
   * @openapi
   * /api/notes:
   *   get:
   *     summary: Listar notas do usuário com filtros e paginação
   *     tags: [Notes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: folder
   *         schema:
   *           type: string
   *       - in: query
   *         name: tag
   *         schema:
   *           type: string
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista de notas
   */
  getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const query = noteQuerySchema.parse(req.query);
      const result = await this.noteService.getAllByUser(userId, query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/notes/folders:
   *   get:
   *     summary: Listar pastas de notas do usuário
   *     tags: [Notes]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de pastas
   */
  getFolders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const folders = await this.noteService.getFolders(userId);
      res.json(folders);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/notes/{id}:
   *   get:
   *     summary: Obter nota por ID
   *     tags: [Notes]
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
   *         description: Dados completos da nota
   *       404:
   *         description: Nota não encontrada
   */
  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;
      const note = await this.noteService.getById(id, userId);
      res.json(note);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/notes:
   *   post:
   *     summary: Criar nova nota
   *     tags: [Notes]
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
   *               content:
   *                 type: string
   *               folder:
   *                 type: string
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       201:
   *         description: Nota criada com sucesso
   */
  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const validated = createNoteSchema.parse(req.body);
      const note = await this.noteService.create(userId, validated);
      res.status(201).json(note);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/notes/{id}:
   *   put:
   *     summary: Atualizar nota
   *     tags: [Notes]
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
   *               content:
   *                 type: string
   *               folder:
   *                 type: string
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Nota atualizada com sucesso
   */
  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;
      const validated = updateNoteSchema.parse(req.body);
      const note = await this.noteService.update(id, userId, validated);
      res.json(note);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @openapi
   * /api/notes/{id}:
   *   delete:
   *     summary: Excluir nota
   *     tags: [Notes]
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
   *         description: Nota excluída com sucesso
   */
  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;
      const result = await this.noteService.delete(id, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
