import { Response, NextFunction } from 'express';
import { UserBookService } from '../services/userBook.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class UserBookController {
  constructor(private userBookService = new UserBookService()) {}

  private getUserId(req: AuthenticatedRequest): number {
    return req.user?.userId || 1;
  }

  /**
   * @openapi
   * /api/user-books:
   *   get:
   *     summary: Listar livros na estante do usuário logado
   *     tags: [UserBooks]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de livros da estante
   */
  getUserBooks = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const userBooks = await this.userBookService.getByUserId(userId);
      return res.status(200).json(userBooks);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/user-books:
   *   post:
   *     summary: Adicionar ou atualizar livro na estante do usuário
   *     tags: [UserBooks]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [bookId]
   *             properties:
   *               bookId:
   *                 type: integer
   *               status:
   *                 type: string
   *                 enum: [QUERO_LER, LENDO, LIDO, ABANDONADO]
   *               currentPage:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Livro salvo na estante
   */
  addUserBook = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const saved = await this.userBookService.addUserBook(userId, req.body);
      return res.status(201).json(saved);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/user-books/{id}:
   *   patch:
   *     summary: Atualizar status e página de leitura de um livro
   *     tags: [UserBooks]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status:
   *                 type: string
   *               currentPage:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Livro atualizado
   */
  updateUserBook = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await this.userBookService.updateUserBook(id, req.body);
      return res.status(200).json(updated);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/user-books/{id}/access:
   *   patch:
   *     summary: Registrar acesso/leitura recente ao livro da estante
   *     tags: [UserBooks]
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
   *         description: Acesso registrado com sucesso
   */
  recordAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const id = parseInt(req.params.id, 10);
      const updated = await this.userBookService.recordAccess(id, userId);
      return res.status(200).json(updated);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/user-books/{id}:
   *   delete:
   *     summary: Remover livro da estante por ID do item
   *     tags: [UserBooks]
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
   *         description: Livro removido da estante
   */
  deleteUserBook = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const id = parseInt(req.params.id, 10);
      await this.userBookService.deleteUserBook(id, userId);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/user-books/book/{bookId}:
   *   delete:
   *     summary: Remover livro da estante por ID do livro
   *     tags: [UserBooks]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: bookId
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       204:
   *         description: Livro removido da estante
   */
  deleteUserBookByBookId = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = this.getUserId(req);
      const bookId = parseInt(req.params.bookId, 10);
      await this.userBookService.deleteByBookId(userId, bookId);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  };
}

