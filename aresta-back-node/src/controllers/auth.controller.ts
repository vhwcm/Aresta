import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export class AuthController {
  constructor(private authService = new AuthService()) {}

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
}

