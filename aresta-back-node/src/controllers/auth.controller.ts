import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class AuthController {
  constructor(private authService = new AuthService()) {}

  /**
   * @openapi
   * /api/auth/register:
   *   post:
   *     summary: Cadastrar novo usuário e obter token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, email, password]
   *             properties:
   *               name:
   *                 type: string
   *                 example: Leitor Aresta
   *               email:
   *                 type: string
   *                 example: leitor@aresta.app
   *               password:
   *                 type: string
   *                 example: senha123456
   *     responses:
   *       201:
   *         description: Cadastro realizado com sucesso
   *       400:
   *         description: E-mail ou usuário já cadastrado
   */
  register = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.register(req.body);
      return res.status(201).json(result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/auth/login:
   *   post:
   *     summary: Autenticar usuário
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [login, password]
   *             properties:
   *               login:
   *                 type: string
   *                 example: viktor
   *               password:
   *                 type: string
   *                 example: orlaweb123123#
   *     responses:
   *       200:
   *         description: Login bem-sucedido
   *       401:
   *         description: Credenciais inválidas
   */
  login = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.login(req.body);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/auth/me:
   *   get:
   *     summary: Obter dados do usuário autenticado atual
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Dados do usuário autenticado
   *       401:
   *         description: Não autorizado
   */
  me = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Token não fornecido ou inválido.' });
      }
      const user = await this.authService.getMe(userId);
      return res.status(200).json(user);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * @openapi
   * /api/auth/me:
   *   delete:
   *     summary: Deletar conta do próprio usuário autenticado
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       204:
   *         description: Conta removida com sucesso
   *       401:
   *         description: Não autorizado
   */
  deleteMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Token não fornecido ou inválido.' });
      }
      await this.authService.deleteMe(userId);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  };
}

