import { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class UserController {
  constructor(private userService = new UserService()) {}

  /**
   * @openapi
   * /api/users:
   *   get:
   *     summary: Listar todos os usuários (Admin)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de usuários
   */
  getAll = async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const users = await this.userService.getAll();
      return res.status(200).json(users);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/users/{id}:
   *   get:
   *     summary: Buscar usuário por ID (Admin)
   *     tags: [Users]
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
   *         description: Dados do usuário
   *       404:
   *         description: Usuário não encontrado
   */
  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      const user = await this.userService.getById(id);
      return res.status(200).json(user);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/users:
   *   post:
   *     summary: Criar novo usuário (Admin)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, email]
   *             properties:
   *               name:
   *                 type: string
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               role:
   *                 type: string
   *                 enum: [ADMIN, USER]
   *               isActive:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: Usuário criado
   */
  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.create(req.body);
      return res.status(201).json(user);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/users/{id}:
   *   put:
   *     summary: Atualizar usuário existente (Admin)
   *     tags: [Users]
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
   *         description: Usuário atualizado
   */
  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      const user = await this.userService.update(id, req.body);
      return res.status(200).json(user);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/users/{id}:
   *   delete:
   *     summary: Remover usuário (Admin)
   *     tags: [Users]
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
   *         description: Usuário removido
   */
  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      await this.userService.delete(id);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  };
}

